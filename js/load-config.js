/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

// Read user-config.js (the global userConfig) and build the page from it.

function haveUserConfig() {
    return typeof userConfig !== "undefined" && userConfig !== null;
}

function loadUserConfig() {
    loadSearchProviders();
    loadLinks();
    loadToolboxes();
}

function loadLinks() {
    configValue("linkGroups", []).forEach(group => {
        if (String(group.visibility || "").toLowerCase() === "hidden") {
            return;   // "visibility": "Hidden" leaves a group off the page
        }
        addLinkGroup(group.name, group.parent, group.color, group.order);
        (group.links || []).forEach(link => addLinkItem(link.name, link.link, group.name));
    });
}

// "toolboxes" is from the original design. The alarm clock and timer are now
// boxes with their own settings (clock, timer); the theme selector is still
// being built. So the setting is noted and otherwise ignored.
function loadToolboxes() {
    if (configValue("toolboxes", []).length) {
        console.info("The \"toolboxes\" setting isn't used any more: the alarm clock and timer "
                + "have their own settings (\"clock\" and \"timer\").");
    }
}

function applyUserConfig(container) {
    addLinkBoxes(container);
    addWeatherBoxes(container);
    addRSSBoxes(container);
    const searchDiv = createSearchBox(
            configValue("searchBoxTitle", "Search"),
            configValue("searchBoxColor", ""));
    setBoxKey(searchDiv, "search", "");
    container.appendChild(searchDiv);
    addNotepadBox(container);
    addClockBox(container);
    addTimerBox(container);
    arrangeBoxes(container);
}

// Put the boxes in the order given by userConfig.boxOrder, a list of box
// names such as ["search", "link:News", "weather:Home", "rss:techdirt"].
// Boxes not in the list keep their usual order after the listed ones
// (link boxes, then weather, RSS, search, notepad, clock, timer), so new boxes still
// show up. If two boxes have the same name, the first one is used first.
function arrangeBoxes(container) {
    const order = configValue("boxOrder", []);
    if (!Array.isArray(order) || order.length === 0) {
        return;
    }
    const remaining = Array.from(container.children);
    const placed = [];
    order.forEach(key => {
        const i = remaining.findIndex(box => box.dataset.boxKey === String(key));
        if (i >= 0) {
            placed.push(remaining.splice(i, 1)[0]);
        } else {
            console.info("boxOrder: no box called '" + key + "' (renamed, hidden or removed?)");
        }
    });
    placed.concat(remaining).forEach(box => container.appendChild(box));
}

// Shown when user-config.js is missing (e.g. a fresh clone).
function showMissingConfigNotice(container) {
    const box = createBox("noticeBox", "noticeBox", "Start Page setup", "");
    showBoxMessage(box.contentDiv, "No user-config.js found. Copy user-config.example.js "
            + "to user-config.js next to start-page.html, edit it, and reload.");
    container.appendChild(box.boxDiv);
}
