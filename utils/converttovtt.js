'use strict';
/**
 * Takes the json for a Microsoft Teams transcript as produced by a SharePoint
 * API call when playing back video with with a synchronized transcript, and 
 * returns it as a vtt file content.
 * 
 * On a semi-frequent basis Teams fails to provide a transcript in the meeting
 * chat or the link fails to download a file. With some manual effort the
 * .json version can be extracted, then this returns an equivalent .vtt
 * format, which can be processed as normal with parsevtt.parse().
 * 
 * THIS IS NOT OFFICIAL and may not ever be as it relies on an unpublished
 * schema and interactively extracted MS API results. But it has proven
 * to be very useful.
 */


function convert(json) {
  return "";
}

module.exports = { convert };
