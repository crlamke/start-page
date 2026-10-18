/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

// Every box on the page (links, weather, RSS, search) has the same frame:
// a coloured panel with a title, a rule, and a content area. createBox()
// builds that frame and returns its parts so each box type only fills in
// its own content.
//   kind   - CSS class for the box type, e.g. "linkBox", "weatherBox"
//   id     - unique element id
//   title  - text shown at the top (set with textContent, never as HTML)
//   color  - any CSS colour, e.g. "Crimson" or "#225588"; empty = theme default
function createBox(kind, id, title, color) {
    const boxDiv = document.createElement("div");
    boxDiv.className = "box " + kind;
    boxDiv.id = id;
    if (color) {
        boxDiv.style.backgroundColor = color;
    }

    const titleElement = document.createElement("h3");
    titleElement.textContent = title;
    boxDiv.appendChild(titleElement);
    boxDiv.appendChild(document.createElement("hr"));

    const contentDiv = document.createElement("div");
    contentDiv.className = "boxContent";
    boxDiv.appendChild(contentDiv);

    return { boxDiv: boxDiv, titleElement: titleElement, contentDiv: contentDiv };
}

// Name a box for userConfig.boxOrder, e.g. "link:News", "weather:Home",
// "rss:techdirt", "search", "notepad", "clock" or "timer" (one of each of
// the last four). config-editor.js builds the same names.
const SINGLE_BOX_KINDS = ["search", "notepad", "clock", "timer"];

function setBoxKey(boxDiv, kind, name) {
    boxDiv.dataset.boxKey = SINGLE_BOX_KINDS.includes(kind) ? kind : kind + ":" + name;
}

// Show a short message inside a box (e.g. "Feed could not be loaded").
function showBoxMessage(contentDiv, message) {
    contentDiv.replaceChildren();
    const p = document.createElement("div");
    p.className = "boxMessage";
    p.textContent = message;
    contentDiv.appendChild(p);
}

// Read a value from the user config, falling back to a default when the
// config or the key is missing.
function configValue(key, fallback) {
    if (typeof userConfig === "undefined" || userConfig === null) {
        return fallback;
    }
    const value = userConfig[key];
    return (value === undefined || value === null) ? fallback : value;
}
