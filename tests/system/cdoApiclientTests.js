"use strict";
var assert = require('assert');
var sinon = require('sinon');
var CdoApiClient = require('../../cdoApiClient');

describe('CdoApiClient', function(){
  describe('#invoke', function(){

    it('should raise done event', function(done){
      // arrange
      this.timeout(120 * 1000);

      var client = CdoApiClient.createInstance('CITY:BR000023', 'GHCNDMS',
        'MNTM', '1983-01-01', '1983-12-31');

      var eventEmitter = client.getEventEmitter();

      // act
      client.query(function(result){
        console.log(result);
      });

      // assert
      eventEmitter.on('done', function(result){
        console.log(result);
        assert.notEqual(result, null);
        done();
      });
    });

    it('should raise done even also when api only returns an empty object', function(done){
      // arrange
      this.timeout(120 * 1000);

      var client = CdoApiClient.createInstance('CITY:BR000023', 'GHCNDMS',
        'MNTM', '2000-01-01', '2000-12-31');

      var eventEmitter = client.getEventEmitter();

      // act
      client.query();

      // assert
      eventEmitter.on('done', function(result){
        assert.equal(result, null);
        done();
      });
    });

  })
});
