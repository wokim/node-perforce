'use strict';

module.exports = {
  _change: {
    cmd: 'Change:',
    type: String,
    category: 'stdin'
  },
  description: {
    cmd: 'Description:',
    type: String,
    category: 'stdin'
  },
  acceptmerged: {
    cmd: '-am',
    category: 'unary'
  },
  delete: {
    cmd: '-d',
    category: 'unary'
  },
  changelist: {
    cmd: '-c',
    type: Number,
    category: 'mixed'
  },
  shelved: {
    cmd: '-s',
    type: Number,
    category: 'mixed'
  },
  stream: {
    cmd: '-S',
    type: String,
    category: 'mixed'
  },
  filetype: {
    cmd: '-t',
    type: String,
    category: 'mixed'
  },
  _delete: {
    cmd: '-d',
    type: Number,
    category: 'mixed'
  },
  _output: {
    cmd: '-o',
    type: Number,
    category: 'mixed'
  },
  force: {
    cmd: '-f',
    category: 'unary'
  },
  switch: {
    cmd: '-s',
    category: 'unary'
  },
  unchanged: {
    cmd: '-a',
    category: 'unary'
  },
  files: {
    type: Array,
    category: 'mixed'
  },
  max: {
    cmd: '-m',
    type: Number,
    category: 'mixed'
  }
};
