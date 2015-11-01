node-perforce
=============

A simple library for perforce

## Install

```sh
npm install node-perforce --save
```

## Breaking changes for promises and typescript

You need to change statements to require.

```js
// Use `.default`
var ps = require('node-perforce').default;
// instead of
var ps = require('node-perforce');
```

## Example

If you omitted a callback, every methods returns promise instead.

```js
var p4 = require('node-perforce').default;

// create a new changelist
p4.changelist.create({description: 'hello world'}, function (err, changelist) {
  if (err) return console.log(err);
  console.log('changelist:', changelist);
});
p4.changelist.create({description: 'hello world'}).then(function (changelist) {
  console.log('changelist:', changelist);
}).catch(function (err) {
  console.log(err);
});

// view changelist info
p4.changelist.view({changelist: changelist}, function (err, view) {
  if (err) return console.log(err);
  console.log(view);
});
p4.changelist.view({changelist: changelist}).then(function (view) {
  console.log(view);
});

// edit changelist 1234
p4.changelist.edit({changelist: 1234, description: 'hi world'}, function (err) {
  if (err) return console.log(err);
});
p4.changelist.edit({changelist: 1234, description: 'hi world'}).then(function () {
});

// delete changelist 1234
p4.changelist.delete({changelist: 1234}, function (err) {
  if (err) return console.log(err);
});
p4.changelist.delete({changelist: 1234}).then(function () {
});

// add files into CL@1234
p4.add({changelist: 1234, filetype: 'binary', files: ['*.bin']}, function(err) {
  if (err) return console.log(err);
});
p4.add({changelist: 1234, filetype: 'binary', files: ['*.bin']}).then(function() {
});

// revert files
p4.revert({files: ['*.bin']}, function(err) {
  if (err) return console.log(err);
});
p4.revert({files: ['*.bin']}).then(function() {
});

// edit files
p4.edit({files: ['*.js']}, function(err) {
  if (err) return console.log(err);
});
p4.edit({files: ['*.js']}).then(function() {
});
```

## Test

```bash
$ docker run -d -p 8080:8080 -p 1666:1666 -h perforce --name perforce ambakshi/perforce-server
$ # Let `P4PORT` point a proper ip address of your docker host in `.p4config`
$ echo 'pass12349ers!' | p4 login
$ npm test
```
