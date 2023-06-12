'use strict';

// The index page contains a Help modal stub. On startup setupHelp() is called
// to populated it with a DB engine specific help file.
// This is because each db does full text syntax differently.

let modalHelpBootstrapModal;

async function setupHelp() {
  // TODO: Set for single db engine, make generalized from config file
  const response = await fetch("/resources/help/help.sqlite.html");
  const text = await response.text();
  document.getElementById('modalHelp').innerHTML = text;
  modalHelpBootstrapModal = new bootstrap.Modal(document.getElementById('modalHelp'));

  const helpTableRows = document.querySelectorAll('.helpTableRow');
  for (const helpTableRow of helpTableRows) {
    helpTableRow.addEventListener("mouseover", (event) => {
      helpSetHighlights(helpTableRow.dataset.highlights);
    });
  };
  // Design choice: didn't add mouseout event.
}

function helpSetHighlights(highlights) {
  const helpSampleRows = document.querySelectorAll('.sample-help-row');
  for (const helpSampleRow of helpSampleRows) {
    if (highlights.includes(helpSampleRow.dataset.highlight)) {
      helpSampleRow.classList.add("sample-help-row-highlight");
    } else {
      helpSampleRow.classList.remove("sample-help-row-highlight");
    }
  }
}

// Not actually called, leave here for potential future use.
function helpClearHighlights() {
  const helpSampleRows = document.querySelectorAll('.sample-help-row');
  for (const helpSampleRow of helpSampleRows) {
    helpSampleRow.classList.remove("sample-help-row-highlight");
  }
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && (e.key=="F1")) {
    modalHelpBootstrapModal.show();
  }
});

btnHelp.onclick = function(event) {
  modalHelpBootstrapModal.show();
};

function setupTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, { "delay": { "show": 500, "hide": 0 }, "animation": false});
  });
}
