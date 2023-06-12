'use strict';

const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

// const ttDb = require('../services/mysql.db.services');
const ttDb = require('../services/sqlite.db.services');


async function search(formSearchPhrase, formSearchSpeaker, res) {
  ttDb.search(formSearchPhrase, formSearchSpeaker, res);
}

async function create(addMeetingDt, addMeetingName, addMeetingVtt, res) {
  ttDb.add(addMeetingDt, addMeetingName, addMeetingVtt, res);
}

async function meetings(req, res, next) {
  ttDb.getMeetings(req, res, next);
}

async function meeting(req, res, next) {
  ttDb.getMeeting(req, res, next);
}

async function transcript(req, res, next) {
  ttDb.getTranscript(req, res, next);
}

async function speakers(req, res, next) {
  ttDb.getSpeakers(req, res, next);
};

async function stats(req, res, next) {
  ttDb.getStats(req, res, next);
}

async function remove(req, res, next) {
  ttDb.remove(req, res, next);
}

module.exports = {
  create,
  search,
  speakers,
  stats,
  remove,
  transcript,
  meeting,
  meetings,
};
