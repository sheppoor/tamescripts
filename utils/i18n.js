'use strict';
/**
 * Basic/simple internationalization i18n
 * 
 * Goal: All non-user text strings should be shown in the user's chosen language.
 * Known issues: Not bothering with db-dependent help screen for the time being.
 * Possible future goal: Cut over to a standard package?
 */

const logger = require('../services/log.service');
const fs = require('fs');

let i18n={}; // All i18n text. As loaded from file, then backfilled with missing terms.
const languageList = []; // Dropdown list of languages


// Load languages and their terms (strings used in the app) from a JSON file.
// To be called once upon application start.
function load() {
  fs.readFile('./config/i18n.json', (err, json) => {
    if (err !== null) {
      logger.fatalError(err);
    } else {
      try {
        i18n = JSON.parse(json);
        loadMissingLanguageTerms();
        loadLanguageList();
      } catch (err) {
        logger.fatalError(err);
      }
    };
  });
}

// For each language (skipping English), look for missing terms, fall back to english
// Personal note: The one case where old school for loop might be better
// for (let indx=1; indx < i18n.length; indx++) // Starts at indx=1, not indx=0. Skips English
// But then it will error if English is the old defined language, unless other logic is added. This is clean enough.
function loadMissingLanguageTerms() {
  for (const language of i18n) {
    if (language.lang !== 'en') {
      for (const [enKey, enValue] of Object.entries(i18n[0].terms)) {
        if (language.terms[enKey] === undefined) {
          language.terms[enKey] = enValue;
          logger.log("i18n "+language.name+" is missing term "+enKey);
        }
      }
    }
  }
}

// Pre-build the list of languages, used for drop-downs
function loadLanguageList() {
  for (const language of i18n) {
    const entry = {
      languageCode: language.lang,
      languageName: language.name };
    languageList.push(entry);
  }
}


// List of languages for drop-down selection
function getLanguages() {
  return languageList;
}


// Gets language terms for the currently chosen language, used for basically all text display
function getTerms(requestLang) {
  const currentLang = i18n.filter((el) => {
    if (el.lang == requestLang) {
      return el;
    }
  });
  if (currentLang.length === 1) {
    return currentLang[0].terms;
  } else {
    // Should never fail to find the requested language, but if it does, fall back to English.
    console.log("Falling back to i18n english from "+requestLang);
    return i18n[0].terms;
  }
}


module.exports = {
  load,
  getLanguages,
  getTerms,
};
