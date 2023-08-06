'use strict';
/**
 * Takes the json for a Microsoft Teams transcript as produced by a SharePoint
 * API call when playing back video with with a synchronized transcript, and 
 * returns it as a vtt file content.
 * 
 * On a semi-frequent basis Teams fails to provide a transcript in the meeting
 * chat or the link fails to download a file. With some manual effort the
 * .json version can be extracted. This routine returns an equivalent .vtt
 * format, which can be processed as normal with parsevtt.parse().
 * 
 * THIS IS NOT OFFICIAL and may not ever be as it relies on an unpublished
 * schema and interactively extracted MS API results. But it has proven
 * to be very useful.
 * 
 * Repeatable process to extract the JSON version:
 *   Open link to the SharePoint version of a video file.
 *   Open developer tools, open the network tab. Refresh.
 *   In the Network tab filter box, filter for "transcripts".
 *   In the short list find "streamContent?format=json" and click on it. 
 *   From the Response tab, select all and copy/paste to a text file and save.
 * 
 * An example of the returned JSON:
 *   Note: The reference to a schema definition doesn't resolve.
 *   Also, the start and end cue values have a fixed appended 4-digit number.
  // {
  //   "$schema": "http://stream.office.com/schemas/transcript.json",
  //   "version": "1.0.0",
  //   "type": "Transcript",
  //   "entries": [
  //     "id": "SOME_GUID", 
  //     "speechServiceResultId": "LONG_HEX_STRING",
  //     "text": "The text is found here.",
  //     "speakerId": "SOME_GUID",
  //     "speakerDisplayName": "Speaker Name",
  //     "confidence": 0.83296895,
  //     "startoffset": "00:00:05.7197695",
  //     "endoffset":"00:00:23.6197695",
  //     "hasBeenEdited": false,
  //     "roomId": null,
  //     "spokenLanguageTag": en-us"
  //   ],
  //   "events": []
  // }
*/

function convert(json) {
  let vtt = "WEBVTT\n\n";
  json.entries.forEach( function(entry) {
    vtt +=
      entry.startOffset.slice(0, 12) + " --> " +entry.endOffset.slice(0, 12) + "\n" +
      "<v " + entry.speakerDisplayName + ">" + entry.text + "</v>\n\n";
  });
  return vtt;
}

module.exports = { convert };
