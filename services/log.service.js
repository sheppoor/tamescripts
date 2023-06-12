'use strict';

/**
 * Logging service definition, independent of service implementation.
 * 
 * Goal: Develop independently (learning), then probably ditch in favor of industry standard logging.
 * 
 * Usage:
 *    In server.js, near the top, call setupLoggingService() with an optional param of an alt implementation.
 *    Any module that needs logging, add:
 *      const logger = require('../services/log.service');
 */


let loggingServiceName = "console"; // fallback if no other service is chosen
let loggingService = null;


// Called once in server.js. Optionally can specify a different logging implementation.
function setupLoggingService(newLoggingServiceName = loggingServiceName) {
  loggingServiceName = newLoggingServiceName;
  loggingService = require('./'+loggingServiceName+'.log.services');
}

function setLogLevel(newLogLevel) {
  loggingService.setLogLevel(newLogLevel);
}

function log(msg) {
  loggingService.log(msg);
}

function logError(err) {
  loggingService.logError(err);
}

function logFatalError(err) {
  loggingService.logFatalError(err);
}

function logFatal(msg) {
  loggingService.logFatal(msg);
}



module.exports = {
  // service definition
  setupLoggingService,

  // pass-through to service implementation
  setLogLevel,
  log,
  logError,
  logFatal,
  logFatalError,
};
