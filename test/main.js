'use strict';

var p4 = require('../dist').default;
var should = require('should');
var assert = require('assert');
var path = require('path');
var _ = require('lodash');
require('mocha');

var fixtures = function (glob) { return path.join(__dirname, 'fixtures', glob); };

before(function (done) {
  p4.clients(function (err, clients) {
    if (_.find(clients, 'client', 'node-perfoce')) return;
    return p4.client({custom: '-o node-perforce'}).then(function (stdout) {
      return p4.client({stdin: stdout});
    });
  }).then(function () {}).then(done).catch(done);
});

describe('node-perforce', function () {
  describe('info', function () {
    it('should output p4 info', function (done) {
      p4.info(function (err, info) {
        if (err) return done(err);
        var keys = Object.keys(info);
        assert.notEqual(keys.indexOf('userName'), -1);
        done();
      });
    });
  });

  describe('changelist', function () {
    var changelist = 0;
    
    it('should create a changelist', function (done) {
      p4.changelist.create({description: 'hello'}, function (err, cl) {
        if (err) return done(err);
        changelist = cl;
        done();
      });
    });
    it('should be named \'hello\'', function (done) {
      p4.changelist.view({changelist: changelist}, function (err, view) {
        if (err) return done(err);
        assert.equal('hello', view.description);
        done();
      });
    });
    it('should modify description of changelist as \'world\'', function (done) {
      p4.changelist.edit({changelist: changelist, description: 'world'}, function (err) {
        if (err) return done(err);
        p4.changelist.view({changelist: changelist}, function (err, view) {
          if (err) return done(err);
          assert.equal(view.description, 'world');
          done();
        });
      });
    });
    describe('add and revert', function () {
      it('should add files', function (done) {
        p4.add({changelist:changelist, files: [fixtures('*')]}, function (err) {
          if (err) return done(err);
          p4.changelist.view({changelist: changelist}, function (err, view) {
            if (err) return done(err);
            assert.equal(view.files.length, 2);
            done();
          });
        });
      });
      it('should revert files', function (done) {
        p4.revert({changelist: changelist, files: [fixtures(('*'))]}, function (err) {
          if (err) return done(err);
          p4.changelist.view({changelist: changelist}, function (err, view) {
            if (err) return done(err);
            assert.equal(view.files.length, 0);
            done();
          });
        });
      });
    });
      
    describe('cleanup', function () {
      it('should delete changelist', function (done) {
        p4.changelist.delete({changelist: changelist}, function (err) {
          if (err) return done(err);
          p4.changelist.view({changelist: changelist}, function (err) {
            assert.ifError(err === undefined);
            done();
          });
        });
      });
    });
  });
});


describe('node-perforce (promise)', function () {
  describe('info', function () {
    it('should output p4 info', function (done) {
      p4.info().then(function (info) {
        var keys = Object.keys(info);
        assert.notEqual(keys.indexOf('userName'), -1);
        done();
      }).catch(done);
    });
  });

  describe('changelist', function () {
    var changelist = 0;
    
    it('should create a changelist', function (done) {
      p4.changelist.create({description: 'hello'}).then(function (cl) {
        changelist = cl;
      }).then(done).catch(done);
    });
    it('should be named \'hello\'', function (done) {
      p4.changelist.view({changelist: changelist}).then(function (view) {
        assert.equal('hello', view.description);
      }).then(done).catch(done);
    });
    it('should modify description of changelist as "world"', function (done) {
      p4.changelist.edit({changelist: changelist, description: 'world'}).then(function () {
        return p4.changelist.view({changelist: changelist});
      }).then(function (view) {
        assert.equal(view.description, 'world');
      }).then(done).catch(done);
    });
    describe('add and revert', function () {
      it('should add files', function (done) {
        p4.add({changelist:changelist, files: [fixtures('*')]}).then(function () {
          return p4.changelist.view({changelist: changelist});
        }).then(function (view) {
          assert.equal(view.files.length, 2);
        }).then(done).catch(done);
      });
      it('should revert files', function (done) {
        p4.revert({changelist: changelist, files: [fixtures(('*'))]}).then(function () {
          return p4.changelist.view({changelist: changelist});
        }).then(function (view) {
          assert.equal(view.files.length, 0);
        }).then(done).catch(done);
      });
    });
      
    describe('cleanup', function () {
      it('should delete changelist', function (done) {
        p4.changelist.delete({changelist: changelist}).then(function (xx) {
          return p4.changelist.view({changelist: changelist});
        }).then(function (view) {
          assert.fail(view);
        }).catch(function (err) {
          assert.ok(err);
        }).then(done).catch(done);
      });
    });
  });
});
