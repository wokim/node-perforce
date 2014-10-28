'use strict';

var exec = require('child_process').exec;
var p4options = require('./p4options');

function optionBuilder(options) {
  if (!options) return '';

  var results = {stdin: [], args: [], files: []};
  Object.keys(options).map(function (option) {
    var p4option = p4options[option];
    if (!p4option) return;
    if ((options[option] || {}).constructor !== p4option.type) return;

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

function execP4(p4cmd, options, callback) {
  var ob = optionBuilder(options);
  var cmd = ['p4', p4cmd, ob.args.join(' '), ob.files.join(' ')];
  var child = exec(cmd.join(' '), function (err, stdout, stderr) {
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

function NodeP4() {}

NodeP4.prototype.change = function (options, callback) {
  execP4('change', options, function (err, stdout) {
    if (err) return callback(err);
    var matched = stdout.match(/([0-9]+)/g);
    return callback(null, (matched || [])[0]);
  });
};

var commonCommands = ['add', 'edit', 'revert'];
commonCommands.forEach(function (command) {
  NodeP4.prototype[command] = function (options, callback) {
    execP4(command, options, callback);
  };
});

module.exports = new NodeP4();