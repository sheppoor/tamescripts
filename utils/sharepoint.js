'use strict';
/**
 * Provide linkage to MS SharePoint meeting recording and transcription player.
 * Support functions for parsing and creating file paths.
 * 
 * Decomposing the SharePoint links:
 * 
 *  The links consist of path, id param, parent param, and optionally a nav param.
 *    https://myorg.sharepoint.com/personal/user_name/path/onedrive.aspx?
 *    id=%2Fpersonal%2Fuser%5Fname%2FDocuments%2FRecordings%2FMeeting%20name%2D20230101%5F090000%2DMeeting%20Recording%2Emp4&
 *    parent=%2Fpersonal%2Fuser%5Fname%2FDocuments%2FRecordings&
 *    nav=eyJwbGF5YmFja09wdGlvbnMiOnsic3RhcnRUaW1lSW5TZWNvbmRzIjo0NTMuNH19
 * 
 *  URL Path:
 *    With the org name, the user name, and the sharepoint fixed path, the URL path can be reconstructed.
 *  id param:
 *    Consists of "personal", user name, "Documents Recordings", meeting name, date, time, and file suffix Meeting Recording.mp4
 *  parent param:
 *    A subset of the id: "personal", user name, "Documents Recordings"
 *  nav param (optional):
 *    Used to set a starting time. Can be left off if not starting at the beginning.
 *    It is encoded in base64.
 *    The above example translates to: {"playbackOptions":{"startTimeInSeconds":453.4}}
 */


// Return value includes the "&" for the URI param.
// Return value will be an empty string if the start point is 0 (beginning of file).
function startTimeSuffix(cueStart) {
  const seconds = cueToSeconds(cueStart);
  if (aseconds > 0) {
    const navStr = '&nav={"playbackOptions":{"startTimeInSeconds":'+seconds+'}}';
    return atob(navStr);
  } else {
    return "";
  }
}


// cue is in hh:mm:ss.xxx format, needs to be converted to seconds.
// Truncates the milliseconds. All integer math here.
// Optionally back up a few seconds before the start of the clip, bottom out at 0
function cueToSeconds(cue, rewind=0) {
  const cueParts = cue.split(/[:.]/);
  const seconds = cueParts[0]*60*60 + cueParts[1]*60 + cueParts[2] - rewind;
  return seconds >= 0 ? seconds : 0;
}


module.exports = {
  startTimeSuffix,
};
