'use strict';

// Most basic logging. Just to the console.

let logLevel = "verbose";


// Called once by the server with the value from config
function setLogLevel(newLogLevel) {
  if (newLogLevel !== "") {
    logLevel = newLogLevel;
  }
}

function log(msg) {
  if (logLevel === "verbose") {
    console.log(msg);
  }
}

function logError(err) {
  console.log(err);
}

function logFatalError(err) {
  console.log(err);
  console.log("Fatal error. Exiting");
  process.exit(1);
}

function logFatal(msg) {
  console.log(msg);
  console.log("Fatal error. Exiting");
  process.exit(1);
}

module.exports = {
  setLogLevel,
  logError,
  logFatal,
  log,
  logFatalError,
};
