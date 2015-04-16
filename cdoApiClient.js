"use strict";
var fs = require('fs');
var Timer = require('./helpers/timer');

function CdoApiClient(httpClient, logger, eventEmitter, timer,
                      dataset, datatypeid, locationid, startDate, endDate) {

  var queryResults;
  var resultDelegate = function(){};

  var queryPath =
    '/cdo-web/api/v2/data?datasetid=' + dataset
    + '&locationid=' + locationid
    + '&startdate=' + startDate
    + '&enddate=' + endDate
    + '&datatypeid=' + datatypeid
    + '&limit=1000';

  function invokeApi(offset) {
    if(offset === 1){
      queryResults = [];
    }

    var apiToken = readApiToken();

    var options = {
      host : 'www.ncdc.noaa.gov',
      port : 80,
      path : queryPath + '&offset=' + offset,
      method : 'GET',
      headers: {'token': apiToken}
    };

    logger.info(options.path);
    httpClient.request(options, onRequestCompleted, function(error) {
      logger.error(error);
    });
  }

  function readApiToken(){
    try {
      return fs.readFileSync('apitoken.txt', 'utf8');
    } catch (e){
      logger.info('Please make sure there is an apitoken.txt file (containing your API token) in the executing directory.');
      logger.error(e);
    }
  }

  function onRequestCompleted(result){
    var resultJson = JSON.parse(result);
    queryResults = queryResults.concat(resultJson.results);

    if (resultJson.metadata){
      var resultset = resultJson.metadata.resultset;
      var nextRequestOffset = resultset.offset + resultset.limit;

      if (nextRequestOffset > resultset.count) {
        eventEmitter.emit('done', queryResults);
        resultDelegate(queryResults);
      }
      else {
        timer.setTimeout(function () {
          invokeApi(nextRequestOffset);
        }, 1500);
      }
    }
    else {
      if (Object.keys(resultJson).length === 0){
        eventEmitter.emit('done', null);
        resultDelegate(null);
      }
    }
  }

  // privileged functions
  this.query = function(offset, resultCallback) {
    if (resultCallback) {
      resultDelegate = resultCallback;
    }
    invokeApi(offset ? offset : 1);
  };

  this.getEventEmitter = function(){
    return eventEmitter;
  };
}

CdoApiClient.createInstance = function(dataset, datatypeid, locationid, startDate, endDate,
                                       eventEmitter, timer){
  var events = require('events');
  var HttpClient = require('./helpers/httpClient');
  var Logger = require('./helpers/logger');

  return new CdoApiClient(
    new HttpClient(), new Logger(),
    eventEmitter ? eventEmitter : new events.EventEmitter(),
    timer ? timer : new Timer(),
    dataset, datatypeid, locationid, startDate, endDate);
};

module.exports = CdoApiClient;
