'use strict';

var p4 = require('../');
var should = require('should');
var assert = require('assert');
var path = require('path');
require('mocha');

var fixtures = function (glob) { return path.join(__dirname, 'fixtures', glob); };

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

  var changelist = 0;
  describe('changelist', function () {
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