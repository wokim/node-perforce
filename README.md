node-perforce
=============

A simple library for perforce

## Install

```sh
npm install node-perforce --save
```

## Example

```js
var p4 = require('node-perforce');

// create a new changelist
p4.changelist.create({description: 'hello world'}, function (err, changelist) {
  if (err) return console.log(err);
  console.log('changelist:', changelist);
});

// view changelist info
p4.changelist.view({changelist: changelist}, function (err, view) {
  if (err) return console.log(err);
  console.log(view);
});

// edit changelist 1234
p4.changelist.edit({changelist: 1234, description: 'hi world'}, function (err) {
  if (err) return console.log(err);
});

// delete changelist 1234
p4.changelist.delete({changelist: 1234}, function (err) {
  if (err) return console.log(err);
});

// add files into CL@1234
p4.add({changelist: 1234, filetype: 'binary', files: ['*.bin']}, function(err) {
  if (err) return console.log(err);
});

// revert files
p4.revert({files: ['*.bin']}, function(err) {
  if (err) return console.log(err);
});

// edit files
p4.edit({files: ['*.js']}, function(err) {
  if (err) return console.log(err);
});
```
