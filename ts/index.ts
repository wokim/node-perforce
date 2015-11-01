'use strict';

import * as S from 'string';
import * as os from 'os';
import * as child_process from 'child_process';
import * as Promise from 'bluebird';
import * as _ from 'lodash';

import p4options from './p4options';

let exec = child_process.exec;
let ztagRegex = /^\.\.\.\s+(\w+)\s+(.+)/;


// build a list of options/arguments for the p4 command
function optionBuilder(options) {
  options = options || {};

  let results = {stdin: [], args: [], files: []};
  Object.keys(options).map((option) => {
    let p4option = p4options[option];
    if (!p4option) return;
    if (p4option.category !== 'unary') {
      if ((options[option] || {}).constructor !== p4option.type) return;
    }
    if (p4option.category === 'stdin') {
      results.stdin.push(p4option.cmd + options[option]);
      if (results.args.indexOf('-i') < 0) results.args.push('-i');
    } else if (p4option.cmd) {
      results.args.push(p4option.cmd);
      if (p4option.category === 'mixed') results.args.push(options[option]);
    } else {
      results.files = results.files.concat(options[option]);
    }
  });
  return results;
}


// filter passed-in options to get a hash of child process options
// (i.e., not p4 command arguments)
function execOptionBuilder(options?) {
  let validKeys = {
    cwd:        true,
    env:        true,
    encoding:   true,
    shell:      true,
    timeout:    true,
    maxBuffer:  true,
    killSignal: true,
    uid:        true,
    gid:        true
  };

  options = options || {};

  return Object.keys(options).reduce((result, key) => {
    if (validKeys[key]) {
      result[key] = options[key];
    }
    return result;
  }, {});
}


function execP4(p4cmd, options?, callback?) {
  return new Promise<string>((resolve, reject) => {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    
    function callbackOrPromise(err, stdout?) {
      if (err) {
        return callback && callback(err) || reject(err);
      }
      return resolve(stdout);
    }
  
    let ob = optionBuilder(options);
    let childProcessOptions = execOptionBuilder(options);
    let cmd = ['p4', p4cmd, ob.args.join(' '), ob.files.join(' ')];
    let child = exec(cmd.join(' '), childProcessOptions, (err, stdout, stderr) => {
      if (err) return callbackOrPromise(err);
      if (stderr) return callbackOrPromise(new Error(stderr.toString()));
      return callbackOrPromise(null, stdout);
    });
    if (ob.stdin.length > 0) {
      ob.stdin.forEach((line) => {
        child.stdin.write(line + '\n');
      });
      child.stdin.emit('end');
    }
  });
}


function _resolve(callback) {
  return (result) => {
    if (callback) return callback(null, result);
    return result;
  };
}


function _reject(callback) {
  return (err:Error) => {
    if (callback) return callback(err);
    throw err;
  };
}


interface ViewResultFile {
  file: string;
  action: string;
}
interface ViewResult {
  change?: string;
  date?: string;
  client?: string;
  user?: string;
  status?: string;
  description?: string;
  files?: ViewResultFile[];
}


export class Changelist {
  public create(options?, callback?) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    return execP4('change', {
      _change: 'new',
      description: options.description || '<saved by node-perforce>'
    }).then((stdout) => {
      let matched = stdout.match(/([0-9]+)/g);
      if (matched.length <= 0) throw new Error('Unknown error');
      return parseInt(matched[0], 10);
    }).then(_resolve(callback), _reject(callback));
  }


  private precond(options) {
    return new Promise((resolve, reject) => {
      if (!options || !options.changelist) return reject(new Error('Missing parameter/argument'));
      return resolve(void 0);
    });
  }


  public edit(options, callback?) {
    return this.precond(options).then(() => {
      return execP4('change', {
        _change: options.changelist.toString(),
        description: options.description
      });
    }).then(_resolve(callback), _reject(callback));
  }


  public delete(options, callback?) {
    return this.precond(options).then(() => {
      execP4('change', {_delete: options.changelist});
    }).then(_resolve(callback), _reject(callback));
  }


  public view(options, callback) {
    return this.precond(options).then(() => {
      return execP4('change', {_output: options.changelist});
    }).then((stdout) => {
      // preprocessing file status
      stdout = stdout.replace(/(\t)+#(.)*/g, (match) => {
        return '@@@' + match.substring(3);
      });

      let output: any = {};
      let lines = stdout.replace(/#(.)*\n/g, '').split(os.EOL + os.EOL);
      lines.forEach((line) => {
        let key = S(line.split(':')[0].toLowerCase()).trim().camelize().s;
        if (key) {
          output[key] = S(line).between(':').trim().s;
        }
      });

      let result: ViewResult = { files: [] };
      _.assign(result, output);
      if (output.files) {
        result.files = output.files.split('\n').map(function (file) {
          let fileAndAction = file.replace(/\t*/g, '').split('@@@');
          return {file: fileAndAction[0], action: fileAndAction[1]};
        });
      }
      return result;
    }).then(_resolve(callback), _reject(callback));
  }


  public submit(options, callback?):Promise<string> {
    return this.precond(options).then(() => {
      return execP4('submit', options);
    }).then(_resolve(callback), _reject(callback));
  }
}

export class NodeP4 {
  changelist = new Changelist();
  
  // process group of lines of output from a p4 command executed with -ztag
  private processZtagOutput(output) {
    return output.split('\n').reduce((memo, line) => {
      let match, key, value;
        match = ztagRegex.exec(line);
        if (match) {
          key = match[1];
          value = match[2];
          memo[key] = value;
        }
        return memo;
    }, {});
  }


  public info(options, callback?) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    return execP4('info', options).then(stdout => {
      let result = {};
      S(stdout).lines().forEach(line => {
        if (!line) return;
        let key = S((line.split(':')[0]).toLowerCase()).camelize().s;
        result[key] = S(line).between(':').trim().s;
      });
      return result;
    }).then(_resolve(callback), _reject(callback));
  }


  // return an array of file info objects for each file opened in the workspace
  public opened(options, callback?) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    return execP4('-ztag opened', options).then((stdout) => {
      // process each line of file info, transforming into a hash
      return stdout.trim().split(/\r\n\r\n|\n\n/).map(fileinfo => {
        return this.processZtagOutput(fileinfo);
      });
    }).then(_resolve(callback), _reject(callback));
  }


  public fstat(options, callback?) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    return execP4('fstat', options).then(stdout => {
      return this.processZtagOutput(stdout);
    }).then(_resolve(callback), _reject(callback));
  }


  private exec(command, options, callback?) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    return execP4(command, options).then(_resolve(callback), _reject(callback));
  }
  public add(options, callback?) {
    return this.exec('add', options, callback);
  }
  public delete(options, callback?) {
    return this.exec('delete', options, callback);
  }
  public edit(options, callback?) {
    return this.exec('edit', options, callback);
  }
  public revert(options, callback?) {
    return this.exec('revert', options, callback);
  }
  public sync(options, callback?) {
    return this.exec('sync', options, callback);
  }
  public diff(options, callback?) {
    return this.exec('diff', options, callback);
  }
  public reconcile(options, callback?) {
    return this.exec('reconcile', options, callback);
  }
  public changes(options, callback?) {
    return this.exec('reopen', options, callback);
  }
  public reopen(options, callback?) {
    return this.exec('reopen', options, callback);
  }
  public resolved(options, callback?) {
    return this.exec('resolved', options, callback);
  }
  public shelve(options, callback?) {
    return this.exec('shelve', options, callback);
  }
  public unshelve(options, callback?) {
    return this.exec('unshelve', options, callback);
  }


  public clients(options, callback?) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    return execP4('clients', options).then(stdout => {
      let lines = stdout.split(os.EOL);
      let clients = lines.map(line => {
        let token = line.split(' ');
        return {
          client: token[1],
          access: token[2],
          root: token[4],
          description: token.slice(5).join(' ')
        };
      });
      return clients.filter(client => !!client.client);
    }).then(_resolve(callback), _reject(callback));
  }


  public client(options, callback?) {
    return this.exec('client', options, callback);
  }
  public resolve(options, callback?) {
    return this.exec('resolve', options, callback);
  }
  public submit(options, callback?) {
    return this.exec('submit', options, callback);
  }
}

let p4 = new NodeP4();
export default p4;