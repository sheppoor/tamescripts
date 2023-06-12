'use strict';
/**
 * Takes a .vtt file's contents as produced by Microsoft Teams transcript
 * (which is a unique form of .vtt file) and convert into a JSON object.
 */

const regexpStartsWithNum = /^\d/;

// TODO: Sanity check of text length, speaker length. Possible: regex for both times. Clear times after a push
function parse(filecontent) {
  const lines = filecontent.split('\n');
  const entries = [];
  let startTime='';
  let endTime='';

  for (const line of lines) {
    if (line === "") {
      continue;
    }

    // Parse the start/end que times, which is on it's own line
    if (regexpStartsWithNum.test(line)) {
      const startstop = line.split(' --> ');
      if (startstop.length === 2) {
        startTime = reformatTime(startstop[0]);
        endTime = reformatTime(startstop[1]);
        continue;
      }
    }

    // Format: <v Voice speaker Name Here>Speaker Text Here</v>
    if (line.startsWith('<v ') && line.endsWith("</v>")) {
      // Strip off the first '<v ' 3 characters and '</v>' the last 4 characters
      const speakerline = line.substring(3, line.length-4).split('>');
      if (speakerline.length ==2) {
        const entry = {
          start: startTime,
          end: endTime,
          speaker: speakerline[0],
          text: speakerline[1] };
        entries.push(entry);
        continue;
      }
    }

    if (line === "WEBVTT") {
      continue;
    }

    // Shouldn't ever get here.
    console.log("VTT PARSE ERROR: Found an unparsable line");
    console.log(line);
  }
  return entries;
}

// MS Teams does a bad job formatting the time. Make it proper.
// Example cue start/end line: 0:7:45.910 --> 0:8:0.30
// Desired result as two strings: 00:07:45.910  and  00:08:00.030
// This fn is called 2x, one for each time.
// Also handles rare negative time at the start via ABS (removes the '-')
// UPDATE 5/2023: Looks like they fixed their time formatting to be normal.
//  Leaving  as-is since there are old transcript downloads around.
function reformatTime(timeStr) {
  const timeHrMinSecMs = timeStr.replaceAll('-', '').split(/[:.]/);
  if (timeHrMinSecMs.length === 4) {
    return timeHrMinSecMs[0].padStart(2, '0') + ':' +
        timeHrMinSecMs[1].padStart(2, '0') + ':' +
        timeHrMinSecMs[2].padStart(2, '0') + '.' +
        timeHrMinSecMs[3].padStart(3, '0');
  } else {
    console.log("VTT PARSE ERROR: Found a bad time que field, using as-is");
    console.log(timStr);
    return timeStr;
  }
}

module.exports = { parse };
