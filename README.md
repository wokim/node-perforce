node-perforce
=============

A simple library for perforce

## Install

```sh
npm install node-perforce --save-dev
```

## Example

```js
var p4 = require('node-perforce');

// create new changelist
p4.change({change:'new', description: 'hello world'}, function(err, changelist) {
  if (err) return console.log(err);
  console.log('changelist:', changelist);
});

// delete changelist 1234
p4.change({delete: 1234}, function(err) {
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
