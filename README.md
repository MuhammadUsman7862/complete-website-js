# Bloomrix Internship Portal (Day 11: JavaScript + jQuery)

Built on the earlier HTML/CSS project. No React/Vue/Angular.

## Run it
`fetch`/AJAX need a server. Use VS Code Live Server, or in this folder run `python -m http.server 8000`
and open http://localhost:8000. (Opening index.html directly still works: it falls back to inline JSON.)
jQuery 3.7.1 loads from code.jquery.com, so an internet connection is needed for the jQuery parts.

## Structure
`js/app.js` PART A, Vanilla JS: theme + status saved in localStorage, fetch JSON, `<template>` rendering, search/filter, delegated events, `<dialog>` modal, toast notifications, form validation and saving.
- `js/app-jquery.js` - PART B, jQuery: same list + modal rebuilt, `$.ajax`, selectors, delegated events, traversal (`closest`, `find`, `siblings`, `next`, `parent`), effects (`fadeIn`, `fadeOut`, `slideToggle`, `slideDown`, `slideUp`), quick-notes form. Contains the Vanilla-vs-jQuery comparison table.
- `statusSummaryJQ()` (jQuery) is converted back to `statusSummaryVanilla()` in `app.js`, with an API mapping table.
- `data/assignments.json` - assignment data.

## Test checklist
Search + filter both lists, click a status badge (refresh: it persists in the Vanilla list), open both modals (Esc / backdrop / Close), submit the form empty and filled, change theme and reload, add and remove notes, tab through with the keyboard, toggle prefers-reduced-motion.
                  
