'use strict';

// Defined upon page load
let resultDivCollapse;

function startup() {
  setupAddModal();
  setupListModal();
  setupTranscriptModal();
  resultDivCollapse = new bootstrap.Collapse(document.getElementById('resultDiv'), {
    toggle: false,
    show: false,
    hide: true,
  });
  resetFocus();
  setupDatePickers();
  reloadIndexStats();
  populateSpeakerDataList();
  setupTooltips();
  setupHelp();
};


function browserBarTo(newPath) {
  window.history.pushState({}, document.title, newPath + '/');
}


function setupDatePickers() {
  const elems = document.querySelectorAll('.datepicker_input');
  for (const elem of elems) {
    new Datepicker(elem, {
      todayButton: true,
      todayButtonMode: 1,
      daysOfWeekHighlighted: [1, 2, 3, 4, 5],
      autohide: true,
    });
  }
}

function clearSearchResults() {
  dtResultTable.data.data = [];
  const displayData = [];
  dtResultTable.insert({ data: displayData });
  dtResultTable.refresh();
}

function resetSearchFields() {
  document.getElementById("formSearchPhrase").value = "";
  document.getElementById("formSearchSpeaker").value = "";
}

function resetFocus() {
  document.getElementById("formSearchPhrase").focus();
}

function populateSpeakerDataList() {
  fetch("/speakers", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
      .then(
          (response) => response.json(),
      ).then(
          (resultData) => {
            let addOptions = "";
            for (const row of resultData) {
              addOptions += "<option value='"+row.speaker+"'>";
            }
            document.getElementById("speakerDataList").innerHTML = addOptions;
          },
      );
  return false;
}


formSearch.onsubmit = function(event) {
  document.getElementById("tooManyResults").innerHTML = "";
  clearAlert();
  const formData = new FormData(formSearch);
  if (document.getElementById("formSearchPhrase").value === "") {
    showAlert('Search phrase is required', 'warning');
  } else {
    fetch("/search", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "Content-Type": "application/json"},
    })
        .then(
            (response) => response.json())
        .then(
            (resultData) => {
              dtResultTable.data.data = [];
              const displayData = [];
              for (const row of resultData) {
                const displayRow = [
                  row.meeting_id,
                  row.seq,
                  row.meeting_name,
                  formatSqlDateAsLocal(row.meeting_date),
                  row.speaker,
                  [row.speech],
                  row.cue_start];
                displayData.push(displayRow);
              }
              dtResultTable.insert({ data: displayData });
              if (resultData.length >= 1000) {
                document.getElementById("tooManyResults").innerHTML = "More than 1000 results found.";
              }
            })
        .catch((err) => {
          console.log(err);
        });
    resultDivCollapse.show();
  }
  return false;
};


btnClear.onclick = function(event) {
  resultDivCollapse.hide();
  resetSearchFields();
  clearSearchResults();
  clearAlert();
  resetFocus();
};

// Input is of the form 2023-05-06T04:00:00.000Z, for now want mm/dd/yyyy, but this will eventually be localizable from config file.
function formatSqlDateAsLocal(sqlDate) {
  const dtSplit = sqlDate.slice(0, 10).split(/-/);
  const dt = new Date(dtSplit[0], dtSplit[1], dtSplit[2]);
  return dtSplit[1] + "/" + dtSplit[2] + "/" + dtSplit[0]; // temporary, to be replaced.
//        return dateFormat(dt, "mm/dd/yyyy");    // Note, not using Node dateFormat yet
}


const alertPlaceholder = document.getElementById('alertPlaceholder');

function clearAlert() {
  alertPlaceholder.innerHTML = "";
  clearTimeout(); // just in case there is an active timeout
}

// Small, general purpose status message. Disable.
function showAlert(alertMessage, alertType) {
  clearAlert();
  const wrapper = document.createElement('div');
  // TODO: Hidden the "X" close for now. Not sure if this is what I want. Figure out best UX.
  wrapper.innerHTML = [
    `<div class="alert alert-${alertType} alert-dismissible fade show" role="alert">`,
    `   <div>${alertMessage}</div>`,
    '   <!-- <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close">--></button>',
    '</div>'].join('');
  alertPlaceholder.append(wrapper);
  setTimeout(() => {
    clearAlert();
  }, "3500");
}


// ----------------- Add transcript page ---------------------

const modalAdd = document.getElementById('modalAdd');
let modalAddBootstrapModal;
const formAddTranscript = document.getElementById('formAddTranscript');

function setupAddModal() {
  modalAddBootstrapModal = new bootstrap.Modal(modalAdd);
};

// TODO show should have a listener; it should also set the path.

addMeetingDtIcon.onclick = function(event) {
  document.getElementById("addMeetingDt").focus();
};

function closedAddModal() {
  modalAddBootstrapModal.hide();
  reloadIndexStats();
}

function clearAddTranscriptFormFields() {
  const inputElements = formAddTranscript.getElementsByTagName('textarea,input');
  for (const element of inputElements) {
    element.value = '';
  }
}

// Don't actually clear the form until it's hidden, otherwise user sees a flash of validation issues.
// TODO: The resetFocus() isn't working here, not sure why.
modalAdd.addEventListener('hidden.bs.modal', function(event) {
  formAddTranscript.classList.remove('was-validated');
  browserBarTo('');
  clearAddTranscriptFormFields();
  resetFocus();
});

btnAddCancel.onclick = function(event) {
  closedAddModal();
};

formAddTranscript.onsubmit = function(event) {
  // Using bootstrap validation, but submit is being called anyway.
  for (const inputField of formAddTranscript) {
    if (! inputField.validity.valid) {
      return false;
    }
  }
  clearAlert();
  const formData = new FormData(formAddTranscript);
  fetch("/add", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(formData)),
    headers: {
      "Content-Type": "application/json",
    },
  })
      .then(async (res) => {
        const result = await res.json();
        closedAddModal();
        showAlert('Adding Transcript...', 'success');
      })
      .catch((err) => {
        console.log(err);
      });
  clearStats();
  resultDivCollapse.hide();
  resetFocus(); // TODO: This is working, but then it re-focuses on the button after the modal close is complete.
  formAddTranscript.reset();
  //    formAddTranscript.classList.remove('was-validated');  // TODO: This part isn't working, isn't doing the bootstrap validation reset.
};


// ----------------- Index page statistics ---------------------

// Called upon add, gives a signal to the user when the add is complete (can take a few seconds).
function clearStats() {
  document.getElementById("lazyIndexstatsTranscripts").innerHTML = "--";
  document.getElementById("lazyIndexstatsTextlines").innerHTML = "----";
}

// Lazy load of stats at the top of the index page
// Called once upon page load, and again as needed such as after loading a new transcript
function reloadIndexStats() {
  fetch("/indexstats", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
      .then(async (res) => {
        const result = await res.json();
        document.getElementById("lazyIndexstatsTranscripts").innerHTML = result.transcripts;
        document.getElementById("lazyIndexstatsTextlines").innerHTML = result.textlines;
      })
      .catch((err) => {
        console.log(err);
      });
}


// ----------------- Drag-and-drop / file selection ---------------------

const dropArea = document.getElementById('drop-area');
const fileSelector = document.getElementById('file-selector');

fileSelector.addEventListener('change', (event) => {
  const fileList = event.target.files;
  processFileSelection(fileList);
});

dropArea.addEventListener('dragover', (event) => {
  event.stopPropagation();
  event.preventDefault();
  // Style the drag-and-drop as a "copy file" operation.
  event.dataTransfer.dropEffect = 'copy';
});

dropArea.addEventListener('drop', (event) => {
  event.stopPropagation();
  event.preventDefault();
  const fileList = event.dataTransfer.files;
  processFileSelection(fileList);
});

// Called for both drag-and-drop and browse.
// Preliminary check if the file looks to be ok (name, type)
// Has a console log but is otherwise silently failing.
function processFileSelection(fileList) {
  // It is an array of files, but we're not allowing multiple. should only be one.
  // But if the user drags-and-drops they can do 2+
  if (fileList.length !== 1) {
    console.log("File selection can only be for one file");
  } else {
    // Browse is limited to .vtt but drag-and-drop can do other files.
    const file = fileList[0];
    if (! file.name.toUpperCase().endsWith(".VTT")) {
      console.log("File selection must be a .vtt file");
    } else {
      // TODO (low priority): Check file size isn't 0 or too huge. Could also do an initial file name analysis.
      //  BUT: Such an addition might mean I should actively give failure feedback.
      // If we don't get here it ignores this file / the file is never read.
      const reader = new FileReader();
      reader.addEventListener('load', (event) => {
        const fileContent = event.target.result;
        populateVttAddFields(file.name, fileContent);
      });
      reader.readAsText(file);
    }
  }
};

// Called after file read is completed.
function populateVttAddFields(fileName, fileContent) {
  // File name always ends in "_yyyy-mm-dd.vtt". 15 chars. 
  // Extract the date elements, remaining is the meeting name.
  const fileDate = fileName.slice(-14,-4).split('-');
  document.getElementById("addMeetingDt").value = fileDate[1]+"/"+fileDate[2]+"/"+fileDate[0];
  document.getElementById("addMeetingName").value = fileName.slice(0,fileName.length-15).trim();
  document.getElementById("addMeetingVtt").value = fileContent;
}


// ----------------- List Modal ---------------------

const modalList = document.getElementById('modalList');
let modalListBootstrapModal;

function setupListModal() {
  modalListBootstrapModal = new bootstrap.Modal(modalList);
}

modalList.addEventListener('hidden.bs.modal', function(event) {
  browserBarTo('');
  resetFocus();
});

modalList.addEventListener('shown.bs.modal', function(event) {
  browserBarTo('list');
});

btnListTranscripts.onclick = function(event) {
  modalListBootstrapModal.show();
  clearAlert();
  fetch("/meetings", {
    method: "GET",
    headers: { "Content-Type": "application/json"},
  })
      .then(
          (response) => response.json(),
      ).then(
          (resultdata) => {
            dtTranscriptsTable.data.data = [];
            const displayData = [];
            for (const row of resultdata) {
              const displayRow = [
                row.meeting_id,
                formatSqlDateAsLocal(row.meeting_date),
                row.meeting_name,
                row.count_text + " comments, "+ row.count_speaker + " speakers"];
              displayData.push(displayRow);
            }
            dtTranscriptsTable.insert({ data: displayData });
          })
      .catch((err) => {
        console.log(err);
      });
  return false;
};


// ----------------- Transcript Modal ---------------------

const modalTranscript = document.getElementById('modalTranscript');
let modalTranscriptBootstrapModal;

function setupTranscriptModal() {
  modalTranscriptBootstrapModal = new bootstrap.Modal(modalTranscript);
}

modalTranscript.addEventListener('hidden.bs.modal', function(event) {
  browserBarTo('');
  resetFocus();
});

// TODO: This is insufficient. Browser history entry should include the transcript ID and the seq.
modalList.addEventListener('shown.bs.modal', function(event) {
  browserBarTo('transcript');
});

function populateTranscriptModal(meetingId, searchStr="", startLoc=1) {
  fetch("/meeting/"+meetingId, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
      .then(async (res) => {
        const result = await res.json();
        document.getElementById("modalTranscriptTitle").innerHTML = result[0].meeting_name;
        document.getElementById("modalTranscriptDate").innerHTML = formatSqlDateAsLocal(result[0].meeting_date);
      })
      .catch((err) => {
        console.log(err);
      });

  fetch("/transcript/"+meetingId, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
      .then(
          (response) => response.json() )
      .then(
          (resultData) => {
            dtTranscriptTable.data.data = [];
            const displayData = [];
            for (const row of resultData) {
              const displayRow = [
                row.speaker,
                [row.speech, row.meeting_id, row.seq],
                row.cue_start];
              displayData.push(displayRow);
            }
            dtTranscriptTable.insert({ data: displayData });
          })
      .catch((err) => {
        console.log(err);
      });
  return false;
}


// FROM BOOTSTRAP 5.0 DOCS, for form validation. TODO: refactor
(function() {
  'use strict';
  const forms = document.querySelectorAll('.needs-validation');
  // Loop over them and prevent submission
  Array.prototype.slice.call(forms)
      .forEach(function(form) {
        form.addEventListener('submit', function(event) {
          if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
          }
          form.classList.add('was-validated');
        }, false);
      });
})();
