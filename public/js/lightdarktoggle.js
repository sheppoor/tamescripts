'use strict';

/**
  * Simple light/dark mode toggle.
  * Retains the choice in localStorage, but only if selection differs from user browser preference.
  * Uses Bootstrap 5.3 functionality except not using $color-mode-type Saas var (hybrid solution)
  * It's important to execute this early to reduce/eliminate chance of load flicker when starting in dark mode.
  * 
  * To use:
  *   Create a control (usually a button) with class "lightdarktoggle"
  */

// only look for the value 'dark', assume light for any other text string values, or for no value.
const preferColorScheme = (window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
// Get choice from local storage, then browser preference, then fall back to default light mode.
let colorScheme = (localStorage.getItem('color-scheme')) ?? preferColorScheme;

setColorScheme();

function setColorScheme() {
  if (colorScheme !== 'dark') {
    document.documentElement.setAttribute('data-bs-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  }
}

function toggleColorScheme() {
  colorScheme = (colorScheme=='light') ? 'dark' : 'light';
  setColorScheme();
  if (preferColorScheme == colorScheme) {
    localStorage.removeItem('color-scheme');
  } else {
    localStorage.setItem('color-scheme', colorScheme);
  }
}

// Unusual to have 2+ dark/light toggle buttons, but it's possible.
(function() {
  const elems = document.querySelectorAll('.lightdarktoggle');
  for (const elem of elems) {
    elem.onclick = function(event) {
      toggleColorScheme();
    };
  };
})();
