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
  changelist: {
    cmd: '-c',
    type: Number,
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
  files: {
    type: Array,
    category: 'mixed'
  }
};