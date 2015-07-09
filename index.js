'use strict';

var S = require('string');
var os = require('os');
var exec = require('child_process').exec;
var p4options = require('./p4options');
var ztagRegex = /^\.\.\.\s+(\w+)\s+(.+)/;

// build a list of options/arguments for the p4 command
function optionBuilder(options) {
  options = options || {};

  var results = {stdin: [], args: [], files: []};
  Object.keys(options).map(function (option) {
    var p4option = p4options[option];
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
function execOptionBuilder(options) {
  var validKeys = {
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

  return Object.keys(options).reduce(function(result, key) {
    if(validKeys[key]) {
      result[key] = options[key];
    }
    return result;
  }, {});
}

function execP4(p4cmd, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }

  var ob = optionBuilder(options);
  var childProcessOptions = execOptionBuilder(options);
  var cmd = ['p4', p4cmd, ob.args.join(' '), ob.files.join(' ')];
  var child = exec(cmd.join(' '), childProcessOptions, function (err, stdout, stderr) {
    if (err) return callback(err);
    if (stderr) return callback(new Error(stderr));
    return callback(null, stdout);
  });
  if (ob.stdin.length > 0) {
    ob.stdin.forEach(function (line) {
      child.stdin.write(line + '\n');
    });
    child.stdin.emit('end');
  }
}

// process group of lines of output from a p4 command executed with -ztag
function processZtagOutput(output) {
  return output.split('\n').reduce(function(memo, line) {
    var match, key, value;
      match = ztagRegex.exec(line);
      if(match) {
        key = match[1];
        value = match[2];
        memo[key] = value;
      }
      return memo;
  }, {});
}

function NodeP4() {}

NodeP4.prototype.changelist = {
  create: function (options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    var newOptions = {
      _change: 'new',
      description: options.description || '<saved by node-perforce>'
    };
    execP4('change', newOptions, function (err, stdout) {
      if (err) return callback(err);
      var matched = stdout.match(/([0-9]+)/g);
      if (matched.length > 0) return callback(null, parseInt(matched[0], 10));
      else return callback(new Error('Unknown error'));
    });
  },
  edit: function (options, callback) {
    callback = callback || function(){};
    if (!options || !options.changelist) return callback(new Error('Missing parameter/argument'));
    if (!options.description) return callback();
    var newOptions = {
      _change: options.changelist.toString(),
      description: options.description
    };
    execP4('change', newOptions, function (err) {
      if (err) return callback(err);
      return callback();
    });
  },
  delete: function (options, callback) {
    callback = callback || function(){};
    if (!options || !options.changelist) return callback(new Error('Missing parameter/argument'));
    execP4('change', {_delete: options.changelist}, function (err) {
      if (err) return callback(err);
      return callback();
    });
  },
  view: function (options, callback) {
    if (!options || !options.changelist) return callback(new Error('Missing parameter/argument'));
    execP4('change', {_output: options.changelist}, function (err, stdout) {
      if (err) return callback(err);

      // preprocessing file status
      stdout = stdout.replace(/(\t)+#(.)*/g, function (match) {
        return '@@@' + match.substring(3);
      });

      var result = {};
      var lines = stdout.replace(/#(.)*\n/g, '').split(os.EOL + os.EOL);
      lines.forEach(function (line) {
        var key = S(line.split(':')[0].toLowerCase()).trim().camelize().s;
        if (key) {
          result[key] = S(line).between(':').trim().s;
        }
      });

      if (result.files) {
        result.files = result.files.split('\n').map(function (file) {
          var file = file.replace(/\t*/g, '').split('@@@');
          return {file: file[0], action: file[1]};
        });
      } else {
        result.files = [];
      }
      return callback(null, result);
    });
  },
  submit: function (options, callback) {
    if (!options || !options.changelist) return callback(new Error('Missing parameter/argument'));
    execP4('submit', options, function (err, stdout) {
      if (err) return callback(err);
    });
  }
};

NodeP4.prototype.info = function (options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  execP4('info', options, function (err, stdout) {
    if (err) return callback(err);

    var result = {};
    S(stdout).lines().forEach(function (line) {
      if (!line) return;
      var key = S((line.split(':')[0]).toLowerCase()).camelize().s;
      result[key] = S(line).between(':').trim().s;

    });
    callback(null, result);
  });
};

// return an array of file info objects for each file opened in the workspace
NodeP4.prototype.opened = function (options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  execP4('-ztag opened', options, function (err, stdout) {
    var result;
    if (err) return callback(err);

    // process each file
    result = stdout.trim().split(/\r\n\r\n|\n\n/).reduce(function(memo, fileinfo) {
      // process each line of file info, transforming into a hash
      memo.push(processZtagOutput(fileinfo));
      return memo;
    }, []);

    callback(null, result);
  });
};

NodeP4.prototype.fstat = function (options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  execP4('fstat', options, function (err, stdout) {
    var result;
    if (err) return callback(err);

    // process file info
    result = processZtagOutput(stdout);

    callback(null, result);
  });
}

var commonCommands = ['add', 'delete', 'edit', 'revert', 'sync',
                      'diff', 'reconcile', 'changes', 'reopen', 'resolved',
                      'shelve', 'unshelve', 'client', 'resolve', 'submit'];
commonCommands.forEach(function (command) {
  NodeP4.prototype[command] = function (options, callback) {
    execP4(command, options, callback);
  };
});

module.exports = new NodeP4();
