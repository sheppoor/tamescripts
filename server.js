'use strict';

const express = require('express');
const app = express();
app.use(express.json({ limit: "50mb" }));
app.set("view engine", "ejs");

const config = require('config');

const router = require('./routes/routes');
app.use("/", router);

app.use('/resources', express.static(__dirname + '/public'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/bootstrap-icons/font', express.static(__dirname + '/node_modules/bootstrap-icons/font'));
app.use('/simple-datatables/dist', express.static(__dirname + '/node_modules/simple-datatables/dist'));
app.use('/vanillajs-datepicker', express.static(__dirname + '/node_modules/vanillajs-datepicker/dist'));

// TODO Temporary, until req.body issue is resolved. See below.
const ttController = require('./controllers/transcripts.controller');

const logger = require('./services/log.service');
logger.setupLoggingService();

const i18n = require('./utils/i18n');
i18n.load();


// ------ Database initialization ------

let ttDb = null;
const rdbms=config.get('app.rdbms');
const dbConfig = config.get('dbConfig'+rdbms);

if (rdbms=='MariaDB') {
  ttDb = require('./services/mysql.db.services');
} else if (rdbms=='Oracle') {
  ttDb = require('./services/oracle.db.services');
} else if (rdbms=='MSSQLServer') {
  ttDb = require('./services/sqlserver.db.services');
} else {
  ttDb = require('./services/sqlite.db.services');
}

ttDb.setUpDbConnection(dbConfig).then( (_resolveValue) => {});


// ------ Pages and APIs / Routing ------

app.listen(config.app.port, () => {
  console.log(new Date());
  console.log("Application "+config.get('app.name')+" started");
});

// Capture all traffic, no 404s
app.get("/*", (req, res) => {
  const lang = i18n.resolveLang(req.headers['cookie'], req.headers['accept-language']);
  res.render("index", { "i18n": i18n.getTerms(lang), "lang": lang, "languages": i18n.getLanguages() } );
});

// TODO: Figure out why req.body doesn't work from express.Router(). Move to router.js
app.post("/add", (req, res) => {
  const { addMeetingDt, addMeetingName, addMeetingVtt } = req.body;
  ttController.create(addMeetingDt, addMeetingName, addMeetingVtt, res);
});

// TODO: Figure out why req.body doesn't work from express.Router(). Move to router.js
app.post("/search", (req, res) => {
  const { formSearchPhrase, formSearchSpeaker } = req.body;
  ttController.search(formSearchPhrase, formSearchSpeaker, res);
  console.log("Search for text "+formSearchPhrase);
});
