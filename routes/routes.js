'use strict';

/* Unified router for the app */

const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();

const ttController = require('../controllers/transcripts.controller');


// List all, retrieve single just heading, retrieve single transcript rows, add, update, and delete
router.get('/meetings', ttController.meetings);
router.get('/meeting/:id', ttController.meeting);
router.get('/transcript/:id', ttController.transcript);
// router.post('/transcript', ttController.create); // TODO In server.js until issue resolved
// router.put('/transcript/:id', ttController.update);
router.delete('/transcript/:id', ttController.remove);

// Primary full text search
// router.post('/search', ttController.search); // TODO In server.js until issue resolved

// speakers from transcripts for filtering, stats for the main page
router.get('/speakers', ttController.speakers);
router.get('/indexstats', ttController.stats);


module.exports = router;
