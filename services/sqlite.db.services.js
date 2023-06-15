'use strict';

// TODO: Better and more consistent error handling.

const sqlite3 = require('sqlite3');

const parseVtt = require('../utils/parsevtt');
const { on } = require('nodemon');

let db = null;

// Use CLI .fullschema to re-create. 
// Note FTS5 will auto-gen several tables that shouldn't be manually re-created.
const dbCreateScriptSQLite = `
CREATE TABLE tt_about (
  about text
);

insert into tt_about (about) values (
('Tamescripts - Parse Microsoft Teams meeting transcripts and make them searchable for your project team. For more information go to https://github.com/sheppoor/tamescripts')
);

CREATE TABLE tt_meeting (
    meeting_id INTEGER PRIMARY KEY, 
    meeting_date text,
    meeting_name text, 
    created_dt text
);

CREATE TABLE tt_textline (
    textline_id INTEGER PRIMARY KEY, 
    meeting_id INTEGER,
    seq INTEGER,
    cue_start text,
    cue_end text,
    speaker text,
    speech text
);

CREATE VIRTUAL TABLE tt_fulltext USING FTS5(
  textline_id UNINDEXED,
  speech
);

CREATE TABLE tt_raw_transcript (
    meeting_id INTEGER, 
    raw_transcript_content text
);
`;


// Open the SQLite database and be ready for work.
// If there is no database then it create it.
function setUpDbConnection(dbConfig) {
  return new Promise(function(resolve, reject) {
    db= new sqlite3.Database('./tamescripts.sqlite', sqlite3.OPEN_READWRITE, (err) => {
      if (err == null) {
        // Opened db successfully. Do a simple check to make sure it seems readable (not corrupt, etc).
        const query = "SELECT about from tt_about";
        db.all(query, (err, rows) => {
          if (err) {
            console.log("Fatal error. Attempt to confirm reads from SQLite database failed "+err.code);
            throw err;
          }
          resolve();
        });
      } else {
        // Failed to open the database. Attempt to create it instead.
        db = new sqlite3.Database('tamescripts.sqlite', (err) => {
          if (err) {
            console.log("Fatal error. Cannot create SQLite database "+err.code);
            throw err;
          } else {
            // Go on to create tables and populate them.
            db.exec(dbCreateScriptSQLite, () => {
              resolve();
            });
          }
        });
      }
    });
  });
}


function getSpeakers(req, res, next) {
  const query = "select distinct speaker from tt_textline order by speaker";
  db.all(query, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send( result );
    }
  });
};


function getStats(req, res, next) {
  let transcripts = 0;
  let textlines = 0;
  const query1 = "select count(*) as cnt from tt_meeting;";
  db.all(query1, (err, result) => {
    transcripts = result[0].cnt;
    const query2 = "select count(*) as cnt from tt_textline;";
    db.all(query2, (err, result) => {
      textlines = result[0].cnt;
      res.status(200).send({ "transcripts": transcripts, "textlines": textlines });
    });
  });
};


function getMeeting(req, res, next) {
  const { id }=req.params;
  const query =
  "select meeting_date, meeting_name from tt_meeting where meeting_id = ?";
  db.all(query, [id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send( result );
    }
  });
};

function getMeetings(req, res, next) {
  const query =
    "select m.meeting_id, m.meeting_date, m.meeting_name, count(t.textline_id) count_text, count(distinct t.speaker) count_speaker "+
    "from tt_meeting m "+
    "left outer join tt_textline t on "+
      "m.meeting_id = t.meeting_id "+
    "group by m.meeting_id, m.meeting_date, m.meeting_name";
  db.all(query, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send( result );
    }
  });
};

function getTranscript(req, res, next) {
  const { id }=req.params;
  const query =
  "select meeting_id, seq, cue_start, speaker, speech from tt_textline where meeting_id = ? order by seq";
  db.all(query, [id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send( result );
    }
  });
};

// delete a single meeting and all sub-structures
function remove(req, res, next) {
  const { id }=req.params;
  const query1 =
    "delete from tt_raw_transcript where meeting_id = ?";
  db.all(query1, [id], (err, result) => { });
  const query2 =
    "delete from tt_textline where meeting_id = ?";
  db.all(query2, [id], (err, result) => { });
  const query3 =
    "delete from tt_meeting where meeting_id = ?";
  db.all(query3, [id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send();
    }
  });
};


// TODO: Body request isn't working, launch point on server.js for now.
function add(addMeetingDt, addMeetingName, addMeetingVtt, res) {
  const query = "Insert Into tt_meeting(meeting_name, meeting_date,created_dt) Values(?, ?, CURRENT_TIMESTAMP)";
  const meetingDtSqlFormat = new Date(addMeetingDt).toISOString().slice(0, 10).replace('T', ' ');
  db.run(query, [addMeetingName, meetingDtSqlFormat], (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'SERVER_ERROR' });
    }
    // TODO: temporary, until I can get .lastrowid to return correctly. (It's not in the result)
    // Note to explore in the doc:
    //  you must use an old-school function () { ... } style callback rather than a lambda function, otherwise this.lastID and this.changes will be undefined.
    // See https://github.com/TryGhost/node-sqlite3/wiki/API
    const queryID = "SELECT max(meeting_id) as id from tt_meeting";
    db.all(queryID, (err, result) => {
      const meetingId = result[0].id;
      const query2 = "Insert Into tt_raw_transcript (meeting_id, raw_transcript_content) Values (?, ?)";
      db.all(query2, [meetingId, addMeetingVtt], (err, result) => {
        // Currently doing nothing, assume success. No results that we care about.
        if (err) {
          console.log(err);
        }
      });
      const vttData = parseVtt.parse(addMeetingVtt);
      // Save it twice - once in regular table, once in full text lookup table.
      const queryVtt = "INSERT INTO tt_textline (meeting_id, seq, cue_start, cue_end, speaker, speech) values (?, ?, ?, ?, ?, ?)";
      for (let i = 0; i < vttData.length; i++) {
        db.all(queryVtt,
            [meetingId, i+1, vttData[i].start, vttData[i].end, vttData[i].speaker, vttData[i].text],
            (err, result) => {
              if (err) {
                console.log(err);
              }
              const q = "INSERT INTO tt_fulltext (textline_id, speech) select textline_id, speech from tt_textline where meeting_id = ? and seq= ?";
              db.all(q, [meetingId, i+1], (err, result) => {
              });
            });
      }
      console.log("Added meeting "+addMeetingName+" id="+meetingId+" with "+(vttData.length)+" transcript lines");
      res.status(200).send({ });
    });
  });
};


// TODO: Body request isn't working, launch point on server.js for now.
function search(formSearchPhrase, formSearchSpeaker, res) {
  const query =
    `SELECT t.meeting_id, m.meeting_name, m.meeting_date, t.seq, t.cue_start, t.speaker, t.speech 
    FROM tt_fulltext ft 
    inner join tt_textline t on 
      ft.textline_id = t.textline_id 
    INNER JOIN tt_meeting m on 
      t.meeting_id = m.meeting_id 
    WHERE tt_fulltext MATCH ? AND 
      (? = '' OR t.speaker = ?) 
    ORDER BY m.meeting_date desc, t.meeting_id, t.seq 
    LIMIT 1000`;
  db.all(query,
      [formSearchPhrase, formSearchSpeaker, formSearchSpeaker],
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send({ msg: 'SERVER_ERROR' });
        } else {
          res.status(200).send( result );
        }
      });
};



module.exports = {
  setUpDbConnection,

  getStats,
  getSpeakers,
  add,
  getMeetings,
  getMeeting,
  getTranscript,
  remove,
  search,
};
