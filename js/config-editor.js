/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 *
 * Settings editor for the Start Page (config-editor.html).
 *
 * Loads user-config.js (or the example if there is none), shows every
 * setting as a form, checks for mistakes, and saves a new user-config.js.
 * Saving writes the file directly in browsers that support the File System
 * Access API (Chrome, Edge, Opera); elsewhere the file is downloaded.
 * Settings the editor doesn't know about are kept unchanged.
 */
"use strict";

const DEFAULT_HEADER = `/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

/*
 * Start Page settings. YOUR copy - not kept in git (see .gitignore).
 * Template: user-config.example.js. Edit by hand or with config-editor.html.
 *
 * Colors: any CSS color name (https://www.w3schools.com/colors/colors_names.asp)
 * or hex value such as "#225588". Leave a color "" for the default grey.
 * Boxes are darkened a little so white text stays readable; very light
 * colors (Gold, Yellow, LightBlue, ...) will still be hard to read.
 *
 * boxOrder         the order of the boxes on the page, e.g.
 *                  ["search", "link:News", "weather:Home", "rss:techdirt"].
 *                  Boxes not listed follow in the usual order (links,
 *                  weather, RSS, search). Easiest to set in config-editor.html.
 * searchBoxTitle, searchBoxColor  title and color of the search box.
 * searchProviders  name + search URL up to the query; the words are appended.
 * linkGroups       one box per group with "parent": "None". A group whose
 *                  parent is another group's name becomes a collapsible list
 *                  inside that box (define the parent first). "order" sorts
 *                  the boxes. "visibility": "Hidden" leaves a group out.
 * weatherPreferences  one box per location; "unit" is "imperial" (F) or
 *                  "metric" (C). Needs an API key in secrets.js.
 * rssFeeds         one box per feed; "maxItems" defaults to 10.
 * rssProxy         "" to fetch feeds directly, or a CORS proxy URL prefix
 *                  (the feed URL is appended, URL-encoded) for sites that
 *                  don't let pages read their feed.
 * notepad          the notepad box: "title", "color", "visibility"
 *                  ("Hidden" leaves it off the page) and "defaultFileName"
 *                  (suggested when saving a new note).
 * clock            the alarm clock box: "title", "color", "visibility",
 *                  "hour12" (true, false or "auto") and "showSeconds".
 * timer            the timer box: "title", "color", "visibility" and
 *                  "presets" (quick-start buttons, in minutes).
 * alerts           how alarms ring: "sound", "flash", "desktopNotification",
 *                  "browserDialog" ("auto", true or false), "snoozeMinutes",
 *                  "alarmSound" and "timerSound" (default sounds: "beep",
 *                  "none" or a file listed in snd/sounds.js) and "soundVolume"
 *                  (0 to 100).
 * toolboxes        no longer used (the clock and timer have their own settings).
 */

`;

// Order of the top-level settings in the saved file; unknown keys follow.
const KEY_ORDER = ["boxOrder", "searchBoxTitle", "searchBoxColor", "searchProviders", "linkGroups",
    "weatherPreferences", "weatherRefreshMinutes", "rssFeeds", "rssRefreshMinutes",
    "rssProxy", "notepad", "clock", "timer", "alerts", "toolboxes"];

const CSS_COLOR_NAMES = ("AliceBlue AntiqueWhite Aqua Aquamarine Azure Beige Bisque Black "
    + "BlanchedAlmond Blue BlueViolet Brown BurlyWood CadetBlue Chartreuse Chocolate Coral "
    + "CornflowerBlue Cornsilk Crimson Cyan DarkBlue DarkCyan DarkGoldenRod DarkGray DarkGreen "
    + "DarkKhaki DarkMagenta DarkOliveGreen DarkOrange DarkOrchid DarkRed DarkSalmon "
    + "DarkSeaGreen DarkSlateBlue DarkSlateGray DarkTurquoise DarkViolet DeepPink DeepSkyBlue "
    + "DimGray DodgerBlue FireBrick FloralWhite ForestGreen Fuchsia Gainsboro GhostWhite Gold "
    + "GoldenRod Gray Green GreenYellow HoneyDew HotPink IndianRed Indigo Ivory Khaki Lavender "
    + "LavenderBlush LawnGreen LemonChiffon LightBlue LightCoral LightCyan LightGoldenRodYellow "
    + "LightGray LightGreen LightPink LightSalmon LightSeaGreen LightSkyBlue LightSlateGray "
    + "LightSteelBlue LightYellow Lime LimeGreen Linen Magenta Maroon MediumAquaMarine "
    + "MediumBlue MediumOrchid MediumPurple MediumSeaGreen MediumSlateBlue MediumSpringGreen "
    + "MediumTurquoise MediumVioletRed MidnightBlue MintCream MistyRose Moccasin NavajoWhite "
    + "Navy OldLace Olive OliveDrab Orange OrangeRed Orchid PaleGoldenRod PaleGreen "
    + "PaleTurquoise PaleVioletRed PapayaWhip PeachPuff Peru Pink Plum PowderBlue Purple "
    + "RebeccaPurple Red RosyBrown RoyalBlue SaddleBrown Salmon SandyBrown SeaGreen SeaShell "
    + "Sienna Silver SkyBlue SlateBlue SlateGray Snow SpringGreen SteelBlue Tan Teal Thistle "
    + "Tomato Turquoise Violet Wheat White WhiteSmoke Yellow YellowGreen").split(" ");

const BOX_SHADE = 0.25;        // matches --box-shade in css/main.css
const MIN_CONTRAST = 4.5;      // WCAG AA for normal text

let cfg = null;                // the settings being edited
let fileHeader = DEFAULT_HEADER;
let fileHandle = null;         // where Save writes, when the browser allows it
let fileLabel = "";
let dirty = false;
let problems = [];
const openGroups = new WeakSet();   // link groups whose card is expanded

// Page layout: every box on the start page, in display order. Entries are
// the config items themselves (link group, weather location, feed) or
// SEARCH_BOX, so renaming a box doesn't lose its place.
const SEARCH_BOX = { searchBox: true };
const NOTEPAD_BOX = { notepadBox: true };
const CLOCK_BOX = { clockBox: true };
const TIMER_BOX = { timerBox: true };

// Boxes there is only one of. `settings` names their section in the config
// (title, color, visibility); the search box keeps its older top-level keys.
const SINGLE_BOXES = [
    { kind: "search", ref: SEARCH_BOX, settings: null, defaultTitle: "Search", focus: "searchBoxTitle" },
    { kind: "notepad", ref: NOTEPAD_BOX, settings: "notepad", defaultTitle: "Notepad", focus: "notepad.title" },
    { kind: "clock", ref: CLOCK_BOX, settings: "clock", defaultTitle: "Alarm Clock", focus: "clock.title" },
    { kind: "timer", ref: TIMER_BOX, settings: "timer", defaultTitle: "Timer", focus: "timer.title" }
];

function singleBox(ref) {
    return SINGLE_BOXES.find(sb => sb.ref === ref) || null;
}
let layout = [];
const boxIds = new WeakMap();
let nextBoxId = 1;
const KIND_LABEL = { link: "Links", weather: "Weather", rss: "RSS", search: "Search",
    notepad: "Notepad", clock: "Clock", timer: "Timer" };

// ====================================================================== helpers

function $(id) {
    return document.getElementById(id);
}

// Build an element: el("div", {class: "x", onclick: fn}, child, "text", ...)
function el(tag, props, ...children) {
    const e = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
        if (v === undefined || v === null || v === false) {
            return;
        }
        if (k === "class") {
            e.className = v;
        } else if (k === "value") {
            e.value = v;
        } else if (k === "dataset") {
            Object.assign(e.dataset, v);
        } else if (k.startsWith("on")) {
            e.addEventListener(k.slice(2), v);
        } else {
            e.setAttribute(k, v === true ? "" : v);
        }
    });
    children.flat().forEach(c => {
        if (c !== null && c !== undefined && c !== false) {
            e.append(c instanceof Node ? c : String(c));
        }
    });
    return e;
}

function pathKey(path) {
    return path.join(".");
}

function getPath(path) {
    return path.reduce((obj, key) => (obj === undefined || obj === null) ? undefined : obj[key], cfg);
}

function setPath(path, value) {
    const parent = path.slice(0, -1).reduce((obj, key) => obj[key], cfg);
    parent[path[path.length - 1]] = value;
}

// Numbers typed into a field: keep a number when it is one, else the text
// (so validation can point at it), "" when empty.
function parseNumber(text) {
    const t = String(text).trim();
    if (t === "") {
        return "";
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : t;
}

function isNumber(v) {
    return typeof v === "number" && Number.isFinite(v);
}

function httpUrl(text) {
    try {
        const url = new URL(String(text).trim());
        return (url.protocol === "http:" || url.protocol === "https:") ? url : null;
    } catch (e) {
        return null;
    }
}

function linkUrlOk(text) {
    try {
        const url = new URL(String(text).trim());
        return ["http:", "https:", "ftp:", "file:", "mailto:"].includes(url.protocol);
    } catch (e) {
        return false;
    }
}

// ====================================================================== colours

function colorToRgb(color) {
    const probe = $("colorProbe");
    probe.style.color = "";
    probe.style.color = color;
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/
            .exec(getComputedStyle(probe).color);
    if (!m || (m[4] !== undefined && Number(m[4]) === 0)) {
        return null;
    }
    return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function luminance(rgb) {
    const c = rgb.map(v => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

// Contrast of white text on this color as shown on the page (darkened by BOX_SHADE).
function whiteTextContrast(color) {
    const rgb = colorToRgb(color);
    if (!rgb) {
        return null;
    }
    const shaded = rgb.map(v => v * (1 - BOX_SHADE));
    return 1.05 / (luminance(shaded) + 0.05);
}

function colorIsValid(color) {
    return color === "" || (window.CSS && CSS.supports("color", color));
}

function toHex(color) {
    const rgb = colorToRgb(color);
    return rgb ? "#" + rgb.map(v => Math.round(v).toString(16).padStart(2, "0")).join("") : "#404040";
}

// ====================================================================== reading files

// Turn JavaScript-ish object text into JSON: drop comments and trailing
// commas, quote bare keys, and convert 'single-quoted' strings. Nothing is
// executed, so opening a file can't run code.
function relaxJson(src) {
    const n = src.length;
    let out = "";
    let i = 0;
    const skipSpace = j => {
        for (;;) {
            while (j < n && /\s/.test(src[j])) {
                j++;
            }
            if (src.startsWith("//", j)) {
                while (j < n && src[j] !== "\n") {
                    j++;
                }
            } else if (src.startsWith("/*", j)) {
                const end = src.indexOf("*/", j + 2);
                j = end < 0 ? n : end + 2;
            } else {
                return j;
            }
        }
    };
    while (i < n) {
        const c = src[i];
        if (c === "\"" || c === "'") {
            let j = i + 1;
            let s = "";
            while (j < n && src[j] !== c) {
                if (src[j] === "\\" && j + 1 < n) {
                    s += (c === "'" && src[j + 1] === "'") ? "'" : src[j] + src[j + 1];
                    j += 2;
                } else {
                    s += (c === "'" && src[j] === "\"") ? "\\\"" : src[j];
                    j++;
                }
            }
            out += "\"" + s + "\"";
            i = j + 1;
        } else if (src.startsWith("//", i) || src.startsWith("/*", i)) {
            i = skipSpace(i);
            out += " ";
        } else if (c === ",") {
            const j = skipSpace(i + 1);
            if (src[j] === "}" || src[j] === "]") {
                i = j;              // trailing comma
            } else {
                out += c;
                i++;
            }
        } else if (/[A-Za-z_$]/.test(c)) {
            let j = i;
            while (j < n && /[\w$]/.test(src[j])) {
                j++;
            }
            const word = src.slice(i, j);
            const isKey = src[skipSpace(j)] === ":" && !["true", "false", "null"].includes(word);
            out += isKey ? "\"" + word + "\"" : word;
            i = j;
        } else {
            out += c;
            i++;
        }
    }
    return out;
}

// Read the settings out of user-config.js text. Returns {config, header}.
function parseConfigText(text) {
    const m = /\b(?:var|let|const)\s+userConfig\s*=\s*/.exec(text);
    if (!m) {
        throw new Error("this file has no \"var userConfig = { ... }\" in it");
    }
    const start = text.indexOf("{", m.index + m[0].length);
    const end = text.lastIndexOf("}");
    if (start < 0 || end < start) {
        throw new Error("the settings in this file are incomplete (missing { or })");
    }
    const body = text.slice(start, end + 1);
    let config;
    try {
        config = JSON.parse(body);
    } catch (e) {
        try {
            config = JSON.parse(relaxJson(body));
        } catch (e2) {
            throw new Error("the settings could not be read (" + e2.message + ")");
        }
    }
    const header = text.slice(0, m.index);
    return { config: config, header: header.trim() ? header.replace(/\s*$/, "\n\n") : DEFAULT_HEADER };
}

// Give every section the shape the editor expects, and list link groups
// the way the page shows them: boxes in "order" order, each followed by
// the groups shown inside it.
function normalize(input) {
    const c = (input && typeof input === "object" && !Array.isArray(input)) ? input : {};
    ["searchProviders", "linkGroups", "weatherPreferences", "rssFeeds"].forEach(key => {
        if (!Array.isArray(c[key])) {
            c[key] = [];
        }
    });
    c.linkGroups.forEach(g => {
        if (!Array.isArray(g.links)) {
            g.links = [];
        }
        g.name = String(g.name === undefined ? "" : g.name);
        g.parent = (g.parent === undefined || g.parent === null || String(g.parent).trim() === "")
            ? "None" : String(g.parent);
        if (g.color === undefined) {
            g.color = "";
        }
        if (g.visibility === undefined) {
            g.visibility = "Shown";
        }
    });
    c.linkGroups = treeOrder(c.linkGroups, orderRank);
    // Settings sections for the single boxes and alerts, with the page's
    // defaults filled in.
    const section = (key, defaults) => {
        const v = c[key];
        c[key] = Object.assign(defaults, (v && typeof v === "object" && !Array.isArray(v)) ? v : {});
    };
    section("notepad", { title: "Notepad", color: "", visibility: "Shown", defaultFileName: "notes.txt" });
    section("clock", { title: "Alarm Clock", color: "", visibility: "Shown", hour12: "auto",
        showSeconds: true });
    section("timer", { title: "Timer", color: "", visibility: "Shown", presets: [1, 5, 10, 25] });
    section("alerts", { sound: true, flash: true, desktopNotification: true, browserDialog: "auto",
        snoozeMinutes: 5, alarmSound: "beep", timerSound: "beep", soundVolume: 80 });
    return c;
}

// "order" of a link group as a number (missing = last).
function orderRank(g) {
    return (isNumber(Number(g.order)) && String(g.order).trim() !== "") ? Number(g.order) : Infinity;
}

// Top-level groups (sorted by rank(group) when given), each followed by its
// subgroups; anything unreachable (bad parent, loops) goes at the end.
function treeOrder(groups, rank) {
    const names = new Set(groups.map(g => g.name));
    let tops = groups.filter(g => g.parent === "None");
    if (rank) {
        tops = tops.map((g, i) => [g, i])
            .sort((a, b) => (rank(a[0]) - rank(b[0])) || (a[1] - b[1]))
            .map(pair => pair[0]);
    }
    const out = [];
    const seen = new Set();
    const visit = g => {
        if (seen.has(g)) {
            return;
        }
        seen.add(g);
        out.push(g);
        groups.filter(ch => ch !== g && ch.parent === g.name).forEach(visit);
    };
    tops.forEach(visit);
    groups.filter(g => g.parent !== "None" && !names.has(g.parent)).forEach(visit);
    groups.forEach(visit);   // loops
    return out;
}

// ====================================================================== page layout

function boxKind(ref) {
    const sb = singleBox(ref);
    if (sb) {
        return sb.kind;
    }
    if (cfg.linkGroups.includes(ref)) {
        return "link";
    }
    if (cfg.weatherPreferences.includes(ref)) {
        return "weather";
    }
    if (cfg.rssFeeds.includes(ref)) {
        return "rss";
    }
    return null;
}

// The box title as the start page shows it.
function boxName(ref) {
    switch (boxKind(ref)) {
    case "link": return ref.name;
    case "weather": return ref.locationName || "Weather";
    case "rss": return ref.name || ref.link || "";
    case "search": return cfg.searchBoxTitle || "Search";
    case "notepad":
    case "clock":
    case "timer": {
        const sb = singleBox(ref);
        return cfg[sb.settings].title || sb.defaultTitle;
    }
    default: return "";
    }
}

// The name used in boxOrder; must match setBoxKey() in js/box.js.
function boxKey(ref) {
    const kind = boxKind(ref);
    return singleBox(ref) ? kind : kind + ":" + boxName(ref);
}

function boxColor(ref) {
    const sb = singleBox(ref);
    const raw = sb ? (sb.settings ? cfg[sb.settings].color : cfg.searchBoxColor) : ref.color;
    const c = String(raw || "").trim();
    return c !== "" && colorIsValid(c) ? c : "#404040";
}

function boxId(ref) {
    if (!boxIds.has(ref)) {
        boxIds.set(ref, String(nextBoxId++));
    }
    return boxIds.get(ref);
}

// Every box the page will have, in the page's default order.
function allBoxes() {
    return cfg.linkGroups.filter(g => g.parent === "None")
        .concat(cfg.weatherPreferences, cfg.rssFeeds, SINGLE_BOXES.map(sb => sb.ref));
}

// Build the layout from a boxOrder list; unlisted boxes follow in default order.
function buildLayout(keys) {
    const pool = allBoxes();
    const out = [];
    (Array.isArray(keys) ? keys : []).forEach(key => {
        const i = pool.findIndex(ref => boxKey(ref) === String(key));
        if (i >= 0) {
            out.push(pool.splice(i, 1)[0]);
        }
    });
    layout = out.concat(pool);
}

// Drop boxes that no longer exist; new boxes go at the end.
function syncLayout() {
    const current = allBoxes();
    const exists = new Set(current);
    layout = layout.filter(ref => exists.has(ref));
    current.forEach(ref => {
        if (!layout.includes(ref)) {
            layout.push(ref);
        }
    });
}

function layoutRank(ref) {
    const i = layout.indexOf(ref);
    return i < 0 ? Infinity : i;
}

// List link groups, weather locations and feeds in page order.
// Only called right before re-rendering, since it changes array indexes.
function applyLayoutOrder() {
    syncLayout();
    const byRank = (a, b) => layoutRank(a) - layoutRank(b);
    cfg.weatherPreferences.sort(byRank);
    cfg.rssFeeds.sort(byRank);
    cfg.linkGroups = treeOrder(cfg.linkGroups, layoutRank);
}

function moveInLayout(ref, to, focusSelector) {
    const from = layout.indexOf(ref);
    if (from < 0 || to < 0 || to >= layout.length || to === from) {
        return;
    }
    layout.splice(from, 1);
    layout.splice(to, 0, ref);
    changed(true);
    renderAll();
    if (focusSelector) {
        const again = document.querySelector(focusSelector);
        if (again && !again.disabled) {
            again.focus();
        }
    }
}

function isHiddenBox(ref) {
    const kind = boxKind(ref);
    const sb = singleBox(ref);
    const visibility = kind === "link" ? ref.visibility
        : (sb && sb.settings ? cfg[sb.settings].visibility : "");
    return String(visibility || "").toLowerCase() === "hidden";
}

// Place on the page counting only boxes that are shown (hidden groups are skipped).
function shownPosition(ref) {
    return layout.filter(r => !isHiddenBox(r)).indexOf(ref) + 1;
}

function positionText(ref) {
    return isHiddenBox(ref) ? "hidden" : "position " + shownPosition(ref) + " on the page";
}

// ====================================================================== writing files

function buildOutputConfig() {
    syncLayout();
    const clone = x => JSON.parse(JSON.stringify(x));
    const c = clone(cfg);
    const byRank = (a, b) => layoutRank(a) - layoutRank(b);

    // Everything is written in page order. Link groups keep an "order"
    // number that agrees with boxOrder, and parents come before subgroups.
    const linkBoxes = layout.filter(ref => boxKind(ref) === "link");
    c.linkGroups = treeOrder(cfg.linkGroups.slice(), layoutRank).map(g => {
        const out = clone(g);
        if (g.parent === "None") {
            out.order = linkBoxes.indexOf(g) + 1;
        }
        return out;
    });
    c.weatherPreferences = cfg.weatherPreferences.slice().sort(byRank).map(clone);
    c.rssFeeds = cfg.rssFeeds.slice().sort(byRank).map(clone);
    c.boxOrder = layout.map(boxKey);

    c.weatherPreferences.forEach(w => {
        ["lat", "lon"].forEach(k => {
            w[k] = parseNumber(w[k] === undefined ? "" : w[k]);
        });
    });
    c.rssFeeds.forEach(f => {
        if (f.maxItems === "" || f.maxItems === undefined) {
            delete f.maxItems;
        }
    });
    ["weatherRefreshMinutes", "rssRefreshMinutes"].forEach(k => {
        if (c[k] === "") {
            delete c[k];
        }
    });

    const ordered = {};
    KEY_ORDER.forEach(k => {
        if (k in c) {
            ordered[k] = c[k];
        }
    });
    Object.keys(c).forEach(k => {
        if (!(k in ordered)) {
            ordered[k] = c[k];
        }
    });
    return ordered;
}

function fileText() {
    return fileHeader + "var userConfig = " + JSON.stringify(buildOutputConfig(), null, 4) + ";\n";
}

// ====================================================================== checks

function validate() {
    const list = [];
    const add = (level, path, where, msg) => list.push({ level, path, where, msg });

    const checkColor = (path, where) => {
        const v = String(getPath(path) === undefined ? "" : getPath(path)).trim();
        if (v === "") {
            return;
        }
        if (!colorIsValid(v)) {
            add("error", path, where, "\"" + v + "\" isn't a color name or hex value like #225588");
            return;
        }
        const contrast = whiteTextContrast(v);
        if (contrast !== null && contrast < MIN_CONTRAST) {
            add("warning", path, where, "white text is hard to read on " + v
                    + " (contrast " + contrast.toFixed(1) + ":1; aim for 4.5:1). Try a darker color.");
        }
    };
    const checkMinutes = (key, where) => {
        const v = cfg[key];
        if (v !== undefined && v !== "" && !(isNumber(v) && v >= 1)) {
            add("error", [key], where, "refresh time must be a number of minutes, 1 or more");
        }
    };

    // Search
    checkColor(["searchBoxColor"], "Search box");

    // Alarm clock, timer, alerts
    checkColor(["clock", "color"], "Alarm clock");
    checkColor(["timer", "color"], "Timer");
    const presets = cfg.timer.presets;
    if (!Array.isArray(presets)) {
        add("error", ["timer", "presets"], "Timer",
                "presets must be minutes separated by commas, e.g. 1, 5, 10, 25");
    } else if (presets.some(n => !(isNumber(n) && n > 0 && n <= 1440))) {
        add("error", ["timer", "presets"], "Timer", "each preset must be from 0.1 to 1440 minutes");
    } else if (presets.length > 6) {
        add("warning", ["timer", "presets"], "Timer", "more than 6 presets won't fit on one line");
    }
    ["alarmSound", "timerSound"].forEach(key => {
        const v = String(cfg.alerts[key] || "").trim();
        if (v === "") {
            add("error", ["alerts", key], "Alerts", "pick a sound");
        } else if (!editorSoundChoices().some(x => x.file === v)) {
            add("warning", ["alerts", key], "Alerts", "\"" + v + "\" isn't listed in snd/sounds.js; "
                    + "if the file is missing, the beep plays instead");
        }
    });
    const volume = cfg.alerts.soundVolume;
    if (!(isNumber(volume) && volume >= 0 && volume <= 100)) {
        add("error", ["alerts", "soundVolume"], "Alerts", "volume must be 0 to 100");
    }
    const snoozeMin = cfg.alerts.snoozeMinutes;
    if (!(isNumber(snoozeMin) && snoozeMin >= 1 && snoozeMin <= 120)) {
        add("error", ["alerts", "snoozeMinutes"], "Alerts", "snooze must be 1 to 120 minutes");
    }

    // Notepad
    checkColor(["notepad", "color"], "Notepad");
    const noteFile = String(cfg.notepad.defaultFileName || "").trim();
    if (/[\\/:*?"<>|]/.test(noteFile)) {
        add("error", ["notepad", "defaultFileName"], "Notepad",
                "the file name can't contain / \\ : * ? \" < > or |");
    } else if (noteFile !== "" && !/\.[A-Za-z0-9]+$/.test(noteFile)) {
        add("warning", ["notepad", "defaultFileName"], "Notepad",
                "add an extension such as .txt so the file opens in a text editor");
    }
    if (cfg.searchProviders.length === 0) {
        add("warning", null, "Search", "no search engines: the page will use DuckDuckGo");
    }
    const providerNames = new Map();
    cfg.searchProviders.forEach((p, i) => {
        const where = "Search engine " + (i + 1) + (p.name ? " (" + p.name + ")" : "");
        const name = String(p.name || "").trim();
        if (name === "") {
            add("error", ["searchProviders", i, "name"], where, "needs a name");
        } else if (providerNames.has(name.toLowerCase())) {
            add("warning", ["searchProviders", i, "name"], where,
                    "two search engines are called \"" + name + "\"");
        }
        providerNames.set(name.toLowerCase(), i);
        const link = String(p.link || "").trim();
        if (link === "") {
            add("error", ["searchProviders", i, "link"], where, "needs a search URL");
        } else if (!httpUrl(link)) {
            add("error", ["searchProviders", i, "link"], where,
                    "the search URL must start with https:// or http://");
        } else if (!link.includes("=")) {
            add("warning", ["searchProviders", i, "link"], where,
                    "the search URL should end with the query part, e.g. ?q=");
        }
    });

    // Link groups
    const groupNames = new Map();
    cfg.linkGroups.forEach(g => {
        const name = String(g.name || "").trim();
        if (name !== "") {
            groupNames.set(name, (groupNames.get(name) || 0) + 1);
        }
    });
    cfg.linkGroups.forEach((g, gi) => {
        const name = String(g.name || "").trim();
        const where = "Link group " + (name ? "\"" + name + "\"" : gi + 1);
        if (name === "") {
            add("error", ["linkGroups", gi, "name"], where, "needs a name");
        } else if (groupNames.get(name) > 1) {
            add("error", ["linkGroups", gi, "name"], where,
                    "another group has the same name; each group needs its own name");
        } else if (name !== g.name) {
            add("warning", ["linkGroups", gi, "name"], where,
                    "the name starts or ends with spaces");
        }
        if (g.parent !== "None") {
            if (!groupNames.has(g.parent)) {
                add("error", ["linkGroups", gi, "parent"], where,
                        "is shown inside \"" + g.parent + "\", but there is no group with that name");
            } else {
                // follow the parents up; coming back to this group means a loop
                let p = g.parent;
                const seen = new Set([g.name]);
                while (p !== "None" && groupNames.has(p) && !seen.has(p)) {
                    seen.add(p);
                    const pg = cfg.linkGroups.find(x => x.name === p);
                    p = pg ? pg.parent : "None";
                }
                if (seen.has(p)) {
                    add("error", ["linkGroups", gi, "parent"], where,
                            "groups are shown inside each other in a loop");
                }
            }
        }
        checkColor(["linkGroups", gi, "color"], where);
        const hasChildren = cfg.linkGroups.some(x => x !== g && x.parent === g.name);
        if (g.links.length === 0 && !hasChildren) {
            add("warning", ["linkGroups", gi, "name"], where, "has no links yet");
        }
        g.links.forEach((link, li) => {
            const lwhere = where + ", link " + (li + 1);
            if (String(link.name || "").trim() === "") {
                add("error", ["linkGroups", gi, "links", li, "name"], lwhere, "needs a name");
            }
            const url = String(link.link || "").trim();
            if (url === "") {
                add("error", ["linkGroups", gi, "links", li, "link"], lwhere, "needs a URL");
            } else if (!linkUrlOk(url)) {
                add("error", ["linkGroups", gi, "links", li, "link"], lwhere,
                        "the URL must start with https://, http://, file:// or mailto:");
            }
        });
    });

    // Boxes with the same name can't be told apart in boxOrder.
    const seenKeys = new Map();
    allBoxes().forEach(ref => {
        const kind = boxKind(ref);
        if (kind === "link" || kind === "search") {
            return;   // link group names are checked above; there is one search box
        }
        const key = boxKey(ref);
        if (seenKeys.has(key)) {
            const path = kind === "weather"
                ? ["weatherPreferences", cfg.weatherPreferences.indexOf(ref), "locationName"]
                : ["rssFeeds", cfg.rssFeeds.indexOf(ref), "name"];
            add("warning", path, KIND_LABEL[kind] + " box \"" + boxName(ref) + "\"",
                    "another box has the same title, so the page may swap their places");
        }
        seenKeys.set(key, true);
    });

    // Weather
    checkMinutes("weatherRefreshMinutes", "Weather");
    cfg.weatherPreferences.forEach((w, i) => {
        const where = "Weather " + (w.locationName ? "\"" + w.locationName + "\"" : i + 1);
        if (String(w.locationName || "").trim() === "") {
            add("error", ["weatherPreferences", i, "locationName"], where, "needs a name");
        }
        const lat = parseNumber(w.lat === undefined ? "" : w.lat);
        const lon = parseNumber(w.lon === undefined ? "" : w.lon);
        if (!(isNumber(lat) && lat >= -90 && lat <= 90)) {
            add("error", ["weatherPreferences", i, "lat"], where,
                    "latitude must be a number from -90 to 90, e.g. 38.84");
        }
        if (!(isNumber(lon) && lon >= -180 && lon <= 180)) {
            add("error", ["weatherPreferences", i, "lon"], where,
                    "longitude must be a number from -180 to 180, e.g. -77.43");
        }
        if (!["imperial", "metric"].includes(w.unit)) {
            add("error", ["weatherPreferences", i, "unit"], where, "pick °F or °C");
        }
        checkColor(["weatherPreferences", i, "color"], where);
    });

    // RSS
    checkMinutes("rssRefreshMinutes", "RSS");
    const proxy = String(cfg.rssProxy || "").trim();
    if (proxy !== "" && !httpUrl(proxy)) {
        add("error", ["rssProxy"], "RSS proxy", "must be empty or start with https://");
    }
    cfg.rssFeeds.forEach((f, i) => {
        const where = "Feed " + (f.name ? "\"" + f.name + "\"" : i + 1);
        const link = String(f.link || "").trim();
        if (link === "") {
            add("error", ["rssFeeds", i, "link"], where, "needs a feed URL");
        } else if (!httpUrl(link)) {
            add("error", ["rssFeeds", i, "link"], where,
                    "the feed URL must start with https:// or http://");
        }
        if (f.maxItems !== undefined && f.maxItems !== ""
                && !(Number.isInteger(f.maxItems) && f.maxItems >= 1 && f.maxItems <= 100)) {
            add("error", ["rssFeeds", i, "maxItems"], where,
                    "number of items must be a whole number from 1 to 100");
        }
        checkColor(["rssFeeds", i, "color"], where);
    });

    return list;
}

// ====================================================================== form fields

// A labelled input bound to cfg at `path`.
//   opts: label, type ("text" | "number" | "url" | "select" | "color"),
//         options [{value, label}], placeholder, wide, number (store numbers),
//         onInput(value), onChange(value, oldValue)
function field(path, opts) {
    const key = pathKey(path);
    const current = getPath(path);
    const raw0 = (current === undefined || current === null) ? "" : current;
    // opts.format turns the stored value into text; opts.parse turns text back.
    const value = opts.format ? opts.format(raw0) : raw0;
    const msg = el("div", { class: "fieldmsg", dataset: { msgFor: key } });
    let control;

    const commit = raw => {
        const v = opts.parse ? opts.parse(raw) : (opts.number ? parseNumber(raw) : raw);
        setPath(path, v);
        changed();
        if (opts.onInput) {
            opts.onInput(v);
        }
    };

    if (opts.type === "select") {
        control = el("select", { dataset: { path: key }, "aria-label": opts.label },
            opts.options.map(o => el("option", { value: o.value }, o.label)));
        control.value = String(value);
        if (control.value !== String(value)) {
            // value not among the options (e.g. from a hand-edited file): show it anyway
            control.prepend(el("option", { value: String(value) }, String(value)));
            control.value = String(value);
        }
        control.addEventListener("change", () => {
            const old = getPath(path);
            commit(control.value);
            if (opts.onChange) {
                opts.onChange(control.value, old);
            }
        });
    } else if (opts.type === "color") {
        const swatch = el("div", { class: "swatch", "aria-hidden": "true" }, "Aa");
        const picker = el("input", { type: "color", "aria-label": opts.label + " picker",
            title: "Pick a color" });
        const text = el("input", { type: "text", list: "cssColors", dataset: { path: key },
            placeholder: "default grey", value: String(value), "aria-label": opts.label,
            spellcheck: "false" });
        const paint = () => {
            const v = text.value.trim();
            swatch.style.backgroundColor = colorIsValid(v) && v !== "" ? v : "#404040";
            picker.value = toHex(v || "#404040");
            const contrast = v && colorIsValid(v) ? whiteTextContrast(v) : null;
            swatch.title = contrast ? "White text contrast " + contrast.toFixed(1) + ":1" : "";
        };
        text.addEventListener("input", () => {
            commit(text.value.trim());
            paint();
        });
        picker.addEventListener("input", () => {
            text.value = picker.value;
            commit(picker.value);
            paint();
        });
        control = el("div", { class: "colorrow" }, text, swatch, picker);
        // Paint once the swatch is in the page, so the color probe works.
        requestAnimationFrame(paint);
    } else {
        control = el("input", {
            type: opts.type === "number" ? "text" : (opts.type || "text"),
            inputmode: opts.type === "number" ? "decimal" : null,
            dataset: { path: key },
            value: String(value),
            placeholder: opts.placeholder || "",
            "aria-label": opts.label,
            spellcheck: opts.type === "url" ? "false" : null
        });
        control.addEventListener("input", () => commit(control.value));
        if (opts.onChange) {
            control.addEventListener("focus", () => {
                control.dataset.before = control.value;
            });
            control.addEventListener("change", () => opts.onChange(control.value,
                    control.dataset.before));
        }
    }

    return el("label", { class: "field" + (opts.wide ? " wide" : "") },
        el("span", {}, opts.label), control, msg);
}

// Button that needs a second click within 3 seconds (for deleting things).
function confirmButton(label, confirmLabel, title, action) {
    const btn = el("button", { type: "button", class: "iconbtn danger", title: title,
        "aria-label": title }, label);
    let timer = null;
    btn.addEventListener("click", () => {
        if (btn.classList.contains("armed")) {
            clearTimeout(timer);
            action();
            return;
        }
        btn.classList.add("armed");
        btn.textContent = confirmLabel;
        timer = setTimeout(() => {
            btn.classList.remove("armed");
            btn.textContent = label;
        }, 3000);
    });
    return btn;
}

// Up / down / delete buttons for item `index` of the array at `arrPath`.
function itemButtons(arrPath, index, what, rerender) {
    const arr = getPath(arrPath);
    const move = delta => {
        const j = index + delta;
        [arr[index], arr[j]] = [arr[j], arr[index]];
        changed(true);
        rerender();
        const again = document.querySelector("[data-item=\"" + pathKey(arrPath.concat(j))
                + "\"] [data-move=\"" + delta + "\"]");
        if (again && !again.disabled) {
            again.focus();
        }
    };
    return [
        el("button", { type: "button", class: "iconbtn", title: "Move " + what + " up",
            "aria-label": "Move " + what + " up", disabled: index === 0,
            dataset: { move: "-1" }, onclick: () => move(-1) }, "↑"),
        el("button", { type: "button", class: "iconbtn", title: "Move " + what + " down",
            "aria-label": "Move " + what + " down", disabled: index === arr.length - 1,
            dataset: { move: "1" }, onclick: () => move(1) }, "↓"),
        confirmButton("✕", "Delete?", "Delete " + what, () => {
            arr.splice(index, 1);
            changed(true);
            rerender();
        })
    ];
}

// Up / down / delete for a box (link group, weather location, feed):
// up and down move it one place on the page.
function boxButtons(ref, what, onDelete) {
    const i = layoutRank(ref);
    const sel = delta => "#editor .card[data-box-id=\"" + boxId(ref) + "\"] [data-move=\""
            + delta + "\"]";
    return [
        el("button", { type: "button", class: "iconbtn", title: "Show " + what + " earlier on the page",
            "aria-label": "Move " + what + " earlier on the page", disabled: i === 0,
            dataset: { move: "-1" }, onclick: () => moveInLayout(ref, i - 1, sel(-1)) }, "↑"),
        el("button", { type: "button", class: "iconbtn", title: "Show " + what + " later on the page",
            "aria-label": "Move " + what + " later on the page", disabled: i >= layout.length - 1,
            dataset: { move: "1" }, onclick: () => moveInLayout(ref, i + 1, sel(1)) }, "↓"),
        confirmButton("✕", "Delete?", "Delete " + what, () => {
            onDelete();
            changed(true);
            renderAll();
        })
    ];
}

// Up / down / delete for a group shown inside another group: up and down
// move it among the other groups inside the same parent.
function subgroupButtons(g, what, onDelete) {
    const siblings = cfg.linkGroups.filter(x => x.parent === g.parent);
    const k = siblings.indexOf(g);
    const move = delta => {
        const other = siblings[k + delta];
        const a = cfg.linkGroups.indexOf(g);
        const b = cfg.linkGroups.indexOf(other);
        [cfg.linkGroups[a], cfg.linkGroups[b]] = [cfg.linkGroups[b], cfg.linkGroups[a]];
        changed(true);
        renderAll();
        const again = document.querySelector("#editor .card[data-box-id=\"" + boxId(g)
                + "\"] [data-move=\"" + delta + "\"]");
        if (again && !again.disabled) {
            again.focus();
        }
    };
    return [
        el("button", { type: "button", class: "iconbtn", title: "Move " + what + " up inside "
                + g.parent, "aria-label": "Move " + what + " up", disabled: k === 0,
            dataset: { move: "-1" }, onclick: () => move(-1) }, "↑"),
        el("button", { type: "button", class: "iconbtn", title: "Move " + what + " down inside "
                + g.parent, "aria-label": "Move " + what + " down", disabled: k === siblings.length - 1,
            dataset: { move: "1" }, onclick: () => move(1) }, "↓"),
        confirmButton("✕", "Delete?", "Delete " + what, () => {
            onDelete();
            changed(true);
            renderAll();
        })
    ];
}

function deleteLinkGroup(g) {
    // Groups shown inside it move up a level instead of losing their parent.
    cfg.linkGroups.forEach(x => {
        if (x !== g && x.parent === g.name) {
            x.parent = g.parent;
        }
    });
    cfg.linkGroups.splice(cfg.linkGroups.indexOf(g), 1);
}

// Scroll to a box's settings and put the cursor in its first field.
function editBox(ref) {
    const kind = boxKind(ref);
    if (kind === "link") {
        openGroups.add(ref);
        const card = document.querySelector("#editor .card[data-box-id=\"" + boxId(ref) + "\"]");
        if (card) {
            card.open = true;
        }
        focusPath(pathKey(["linkGroups", cfg.linkGroups.indexOf(ref), "name"]));
    } else if (kind === "weather") {
        focusPath(pathKey(["weatherPreferences", cfg.weatherPreferences.indexOf(ref), "locationName"]));
    } else if (kind === "rss") {
        focusPath(pathKey(["rssFeeds", cfg.rssFeeds.indexOf(ref), "name"]));
    } else if (singleBox(ref)) {
        focusPath(singleBox(ref).focus);
    }
}

function focusPath(key, selectText) {
    const target = document.querySelector("[data-path=\"" + key + "\"]");
    if (!target) {
        return false;
    }
    let d = target.closest("details");
    while (d) {
        d.open = true;
        d = d.parentElement.closest("details");
    }
    target.focus();
    if (selectText && target.select) {
        target.select();
    }
    return true;
}

// ====================================================================== sections

function renderLinkGroups() {
    const host = $("linkGroups");
    host.replaceChildren();
    if (cfg.linkGroups.length === 0) {
        host.append(el("p", { class: "empty" }, "No link groups yet."));
    }

    cfg.linkGroups.forEach((g, gi) => {
        const base = ["linkGroups", gi];
        const title = el("span", { class: "cardtitle" });
        const tag = el("span", { class: "tag" });
        const paintHead = () => {
            title.textContent = g.name || "(unnamed group)";
            const where = g.parent === "None" ? positionText(g) : "inside " + g.parent;
            tag.textContent = where + " · " + g.links.length + " link"
                    + (g.links.length === 1 ? "" : "s");
        };
        paintHead();

        // A group can be shown inside any group except itself and its own subgroups.
        const descendants = new Set([g.name]);
        let grew = true;
        while (grew) {
            grew = false;
            cfg.linkGroups.forEach(x => {
                if (descendants.has(x.parent) && !descendants.has(x.name)) {
                    descendants.add(x.name);
                    grew = true;
                }
            });
        }
        const parentOptions = [{ value: "None", label: "— its own box —" }].concat(
            cfg.linkGroups.filter(x => x.name && !descendants.has(x.name))
                .map(x => ({ value: x.name, label: x.name })));

        const fields = el("div", { class: "fields" },
            field(base.concat("name"), {
                label: "Name", onInput: () => {
                    paintHead();
                    renderLayout();
                },
                onChange: (newName, oldName) => {
                    // Keep subgroups and their links attached after a rename.
                    if (oldName !== undefined && oldName !== newName) {
                        cfg.linkGroups.forEach(x => {
                            if (x !== g && x.parent === oldName) {
                                x.parent = newName;
                            }
                        });
                        renderAll();
                    }
                }
            }),
            field(base.concat("parent"), {
                label: "Shown inside", type: "select", options: parentOptions,
                onChange: () => renderAll()
            }),
            field(base.concat("color"), { label: "Color", type: "color", onInput: renderLayout }),
            field(base.concat("visibility"), {
                label: "Visibility", type: "select", onChange: () => {
                    renderAll();   // other boxes' positions change too
                    focusPath(pathKey(base.concat("visibility")));
                },
                options: [{ value: "Shown", label: "Shown" },
                    { value: "Hidden", label: "Hidden (left off the page)" }]
            })
        );

        const links = el("div", { class: "links" },
            el("h4", {}, "Links"));
        if (g.links.length) {
            links.append(el("div", { class: "linkrow linkhead", "aria-hidden": "true" },
                el("div", {}, "Name"), el("div", {}, "URL"), el("div", {}, "Group"), el("div", {})));
        }
        g.links.forEach((link, li) => {
            const lbase = base.concat("links", li);
            // Choosing another group moves the link there.
            const sel = el("select", { "aria-label": "Move link to group" },
                cfg.linkGroups.filter(x => x.name)
                    .map(x => el("option", { value: x.name }, x.name)));
            sel.value = g.name;
            const moveTo = el("label", { class: "field" }, el("span", {}, "Group"), sel);
            sel.addEventListener("change", () => {
                const target = cfg.linkGroups.find(x => x.name === sel.value);
                if (target && target !== g) {
                    g.links.splice(li, 1);
                    target.links.push(link);
                    openGroups.add(target);
                    changed(true);
                    renderAll();
                }
            });
            links.append(el("div", { class: "linkrow", dataset: { item: pathKey(lbase) } },
                field(lbase.concat("name"), { label: "Link name", onInput: paintHead }),
                field(lbase.concat("link"), { label: "URL", type: "url",
                    placeholder: "https://" }),
                moveTo,
                el("div", { class: "buttons" },
                    itemButtons(base.concat("links"), li, "link", renderLinkGroups))));
        });
        links.append(el("button", {
            type: "button", class: "add", onclick: () => {
                g.links.push({ name: "", link: "" });
                openGroups.add(g);
                changed(true);
                renderLinkGroups();
                focusPath(pathKey(base.concat("links", g.links.length - 1, "name")));
            }
        }, "+ Add link"));

        const what = "group \"" + (g.name || "unnamed") + "\"";
        const card = el("details", { class: "card",
            dataset: { item: pathKey(base), boxId: boxId(g) } },
            el("summary", { class: "cardhead" }, title, tag,
                g.parent === "None"
                    ? boxButtons(g, what, () => deleteLinkGroup(g))
                    : subgroupButtons(g, what, () => deleteLinkGroup(g))),
            fields, links);
        card.open = openGroups.has(g);
        card.addEventListener("toggle", () => {
            if (card.open) {
                openGroups.add(g);
            } else {
                openGroups.delete(g);
            }
        });
        // Buttons in the summary shouldn't also open/close the card.
        card.querySelector("summary").addEventListener("click", e => {
            if (e.target.closest("button")) {
                e.preventDefault();
            }
        });
        host.append(card);
    });
    updateCounts();
}

function renderSearch() {
    $("searchGeneral").replaceChildren(el("div", { class: "fields" },
        field(["searchBoxTitle"], { label: "Box title", placeholder: "Search",
            onInput: renderLayout }),
        field(["searchBoxColor"], { label: "Box color", type: "color", onInput: renderLayout })),
        el("p", { class: "hint tight" }, "The search box is at ", positionText(SEARCH_BOX),
            ". Change that in ", el("a", { href: "#sec-layout" }, "Page layout"), "."));

    const host = $("searchProviders");
    host.replaceChildren();
    if (cfg.searchProviders.length === 0) {
        host.append(el("p", { class: "empty" }, "No search engines; the page will use DuckDuckGo."));
    }
    cfg.searchProviders.forEach((p, i) => {
        const base = ["searchProviders", i];
        const title = el("span", { class: "cardtitle" }, p.name || "(unnamed)");
        host.append(el("div", { class: "card", dataset: { item: pathKey(base) } },
            el("div", { class: "cardhead" }, title,
                el("span", { class: "tag" }, i === 0 ? "default" : ""),
                el("button", {
                    type: "button", class: "iconbtn", title: "Try a search with this engine",
                    onclick: () => {
                        if (httpUrl(p.link)) {
                            window.open(String(p.link).trim() + encodeURIComponent("start page"),
                                    "_blank", "noopener");
                        }
                    }
                }, "Try"),
                itemButtons(["searchProviders"], i, "search engine", renderSearch)),
            el("div", { class: "fields" },
                field(base.concat("name"), { label: "Name",
                    onInput: v => { title.textContent = v || "(unnamed)"; } }),
                field(base.concat("link"), { label: "Search URL", type: "url", wide: true,
                    placeholder: "https://duckduckgo.com/?q=" }))));
    });
}

function renderWeather() {
    $("weatherGeneral").replaceChildren(el("div", { class: "fields" },
        field(["weatherRefreshMinutes"], { label: "Refresh every (minutes)", type: "number",
            number: true, placeholder: "10" })));

    const host = $("weatherPreferences");
    host.replaceChildren();
    if (cfg.weatherPreferences.length === 0) {
        host.append(el("p", { class: "empty" }, "No weather locations."));
    }
    cfg.weatherPreferences.forEach((w, i) => {
        const base = ["weatherPreferences", i];
        const title = el("span", { class: "cardtitle" }, w.locationName || "(unnamed)");
        host.append(el("div", { class: "card", dataset: { item: pathKey(base), boxId: boxId(w) } },
            el("div", { class: "cardhead" }, title,
                el("span", { class: "tag" }, positionText(w)),
                boxButtons(w, "weather box", () => cfg.weatherPreferences.splice(
                    cfg.weatherPreferences.indexOf(w), 1))),
            el("div", { class: "fields" },
                field(base.concat("locationName"), { label: "Box title",
                    onInput: v => {
                        title.textContent = v || "(unnamed)";
                        renderLayout();
                    } }),
                field(base.concat("lat"), { label: "Latitude", type: "number", number: true,
                    placeholder: "38.84" }),
                field(base.concat("lon"), { label: "Longitude", type: "number", number: true,
                    placeholder: "-77.43" }),
                field(base.concat("unit"), { label: "Temperature", type: "select",
                    options: [{ value: "imperial", label: "°F (imperial)" },
                        { value: "metric", label: "°C (metric)" }] }),
                field(base.concat("color"), { label: "Color", type: "color",
                    onInput: renderLayout }))));
    });
    updateCounts();
}

function renderRSS() {
    $("rssGeneral").replaceChildren(el("div", { class: "fields" },
        field(["rssRefreshMinutes"], { label: "Refresh every (minutes)", type: "number",
            number: true, placeholder: "30" }),
        field(["rssProxy"], { label: "CORS proxy URL prefix (optional)", type: "url", wide: true,
            placeholder: "leave empty to read feeds directly" })));

    const host = $("rssFeeds");
    host.replaceChildren();
    if (cfg.rssFeeds.length === 0) {
        host.append(el("p", { class: "empty" }, "No feeds."));
    }
    cfg.rssFeeds.forEach((f, i) => {
        const base = ["rssFeeds", i];
        const title = el("span", { class: "cardtitle" }, f.name || f.link || "(unnamed)");
        host.append(el("div", { class: "card", dataset: { item: pathKey(base), boxId: boxId(f) } },
            el("div", { class: "cardhead" }, title,
                el("span", { class: "tag" }, positionText(f)),
                el("button", {
                    type: "button", class: "iconbtn", title: "Open the feed in a new tab to check it",
                    onclick: () => {
                        if (httpUrl(f.link)) {
                            window.open(String(f.link).trim(), "_blank", "noopener");
                        }
                    }
                }, "Open"),
                boxButtons(f, "feed box", () => cfg.rssFeeds.splice(cfg.rssFeeds.indexOf(f), 1))),
            el("div", { class: "fields" },
                field(base.concat("name"), { label: "Box title", placeholder: "(the feed URL)",
                    onInput: v => {
                        title.textContent = v || f.link || "(unnamed)";
                        renderLayout();
                    } }),
                field(base.concat("link"), { label: "Feed URL", type: "url", wide: true,
                    placeholder: "https://example.com/feed.xml", onInput: renderLayout }),
                field(base.concat("color"), { label: "Color", type: "color", onInput: renderLayout }),
                field(base.concat("maxItems"), { label: "Items to show", type: "number",
                    number: true, placeholder: "10" }))));
    });
    updateCounts();
}

function renderLayout() {
    if (!cfg) {
        return;
    }
    syncLayout();
    const host = $("layoutGrid");
    host.replaceChildren();
    let dragFrom = -1;
    const clearMarks = () => host.querySelectorAll(".drop-before, .drop-after, .dragging")
        .forEach(t => t.classList.remove("drop-before", "drop-after", "dragging"));

    layout.forEach((ref, i) => {
        const kind = boxKind(ref);
        const hidden = isHiddenBox(ref);
        const name = boxName(ref) || "(unnamed)";
        const sel = delta => "#layoutGrid [data-box-id=\"" + boxId(ref) + "\"] [data-move=\""
                + delta + "\"]";
        const tile = el("li", {
            class: "tile" + (hidden ? " hiddenbox" : ""), draggable: "true",
            dataset: { boxId: boxId(ref) },
            "aria-label": (hidden ? "Hidden" : shownPosition(ref) + ".") + " " + KIND_LABEL[kind]
                    + ": " + name
        },
            el("div", { class: "tiletop" },
                el("span", { class: "tilepos", title: hidden ? "Hidden: not on the page" : "" },
                    hidden ? "–" : String(shownPosition(ref))),
                el("span", { class: "tilekind" }, KIND_LABEL[kind] + (hidden ? " · hidden" : ""))),
            el("button", { type: "button", class: "tilename", title: "Edit this box",
                onclick: () => editBox(ref) }, name),
            el("div", { class: "tilebuttons" },
                el("button", { type: "button", class: "iconbtn", title: "Move earlier on the page",
                    "aria-label": "Move " + name + " earlier on the page", disabled: i === 0,
                    dataset: { move: "-1" }, onclick: () => moveInLayout(ref, i - 1, sel(-1)) }, "←"),
                el("button", { type: "button", class: "iconbtn", title: "Move later on the page",
                    "aria-label": "Move " + name + " later on the page",
                    disabled: i === layout.length - 1, dataset: { move: "1" },
                    onclick: () => moveInLayout(ref, i + 1, sel(1)) }, "→")));
        tile.style.backgroundColor = boxColor(ref);

        tile.addEventListener("dragstart", e => {
            dragFrom = i;
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", name);
            tile.classList.add("dragging");
        });
        tile.addEventListener("dragover", e => {
            if (dragFrom < 0) {
                return;
            }
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            const r = tile.getBoundingClientRect();
            const after = e.clientX > r.left + r.width / 2;
            tile.classList.toggle("drop-after", after);
            tile.classList.toggle("drop-before", !after);
        });
        tile.addEventListener("dragleave", () => tile.classList.remove("drop-before", "drop-after"));
        tile.addEventListener("drop", e => {
            e.preventDefault();
            const after = tile.classList.contains("drop-after");
            clearMarks();
            if (dragFrom < 0 || dragFrom === i) {
                return;
            }
            let to = after ? i + 1 : i;
            if (dragFrom < to) {
                to -= 1;
            }
            const moving = layout[dragFrom];
            dragFrom = -1;
            moveInLayout(moving, to);
        });
        tile.addEventListener("dragend", () => {
            dragFrom = -1;
            clearMarks();
        });
        host.append(tile);
    });
}

// "The timer is at position 9 on the page. Change that in Page layout."
function positionHint(ref, noun) {
    const hidden = isHiddenBox(ref);
    return el("p", { class: "hint tight" }, hidden ? noun + " is hidden."
        : noun + " is at " + positionText(ref) + ". ",
        hidden ? "" : el("span", {}, "Change that in ", el("a", { href: "#sec-layout" }, "Page layout"), "."));
}

function visibilityField(section) {
    return field([section, "visibility"], { label: "Visibility", type: "select",
        options: [{ value: "Shown", label: "Shown" },
            { value: "Hidden", label: "Hidden (left off the page)" }],
        onChange: () => {
            renderAll();   // other boxes' positions change too
            focusPath(section + ".visibility");
        } });
}

// Sounds from snd/sounds.js plus the built-in beep and silence.
function editorSoundChoices() {
    const listed = (typeof startPageSounds !== "undefined" && Array.isArray(startPageSounds))
        ? startPageSounds.filter(x => x && typeof x.file === "string" && x.file.trim() !== "")
            .map(x => ({ name: String(x.name || x.file), file: x.file.trim() }))
        : [];
    return [{ name: "Beep (built in)", file: "beep" }].concat(listed, [{ name: "Silent", file: "none" }]);
}

// Try a sound in the editor: plays the file once (or three beeps), up to 4 s.
let editorAudio = null;
let stopEditorPreview = null;
function previewEditorSound(file, volume, onEnd) {
    if (stopEditorPreview) {
        stopEditorPreview();
    }
    let player = null;
    let node = null;
    let timer = null;
    const stop = () => {
        clearTimeout(timer);
        if (player) {
            player.pause();
        }
        if (node) {
            node.disconnect();
        }
        stopEditorPreview = null;
        onEnd();
    };
    const beep = () => {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            editorAudio = editorAudio || new AC();
            node = editorAudio.createGain();
            node.gain.value = Math.min(0.3, 0.18 * volume / 80);
            node.connect(editorAudio.destination);
            const t0 = editorAudio.currentTime + 0.05;
            for (let b = 0; b < 3; b++) {
                const osc = editorAudio.createOscillator();
                osc.type = "square";
                osc.frequency.value = 880;
                osc.connect(node);
                osc.start(t0 + b * 0.2);
                osc.stop(t0 + b * 0.2 + 0.12);
            }
        } catch (e) {
            // no Web Audio: nothing to play
        }
    };
    if (file === "beep") {
        beep();
    } else if (file !== "none") {
        player = new Audio(file);
        player.volume = Math.min(1, Math.max(0, volume / 100));
        player.addEventListener("ended", stop);
        player.addEventListener("error", () => {
            player = null;
            showStatus("Couldn't play " + file + " (missing or not a sound file?)", "error");
            beep();
        });
        const started = player.play();
        if (started && started.catch) {
            started.catch(() => {});
        }
    }
    timer = setTimeout(stop, file === "none" ? 300 : 4000);
    stopEditorPreview = stop;
}

function soundField(path, label) {
    const options = editorSoundChoices().map(x => ({ value: x.file, label: x.name }));
    const f = field(path, { label: label, type: "select", options: options });
    const select = f.querySelector("select");
    const btn = el("button", { type: "button", class: "iconbtn soundPreview",
        title: "Play this sound", "aria-label": "Play the selected " + label.toLowerCase() }, "▶");
    btn.addEventListener("click", e => {
        e.preventDefault();
        if (btn.textContent === "■") {
            if (stopEditorPreview) {
                stopEditorPreview();
            }
            return;
        }
        btn.textContent = "■";
        const vol = isNumber(cfg.alerts.soundVolume) ? cfg.alerts.soundVolume : 80;
        previewEditorSound(select.value, vol, () => {
            btn.textContent = "▶";
        });
    });
    const row = el("div", { class: "selectrow" });
    select.before(row);        // put the row where the select is, then move the select in
    row.append(select, btn);
    return f;
}

const YES_NO = [{ value: "true", label: "Yes" }, { value: "false", label: "No" }];
const toBool = v => v === "true";

function renderClockTimer() {
    $("clockGeneral").replaceChildren(el("div", { class: "fields" },
        field(["clock", "title"], { label: "Box title", placeholder: "Alarm Clock", onInput: renderLayout }),
        field(["clock", "color"], { label: "Box color", type: "color", onInput: renderLayout }),
        visibilityField("clock"),
        field(["clock", "hour12"], { label: "Time format", type: "select",
            options: [{ value: "auto", label: "Like this computer" },
                { value: "true", label: "12-hour (1:30 PM)" }, { value: "false", label: "24-hour (13:30)" }],
            parse: v => v === "auto" ? "auto" : v === "true" }),
        field(["clock", "showSeconds"], { label: "Show seconds", type: "select", options: YES_NO,
            parse: toBool })),
        positionHint(CLOCK_BOX, "The alarm clock"));

    $("timerGeneral").replaceChildren(el("div", { class: "fields" },
        field(["timer", "title"], { label: "Box title", placeholder: "Timer", onInput: renderLayout }),
        field(["timer", "color"], { label: "Box color", type: "color", onInput: renderLayout }),
        visibilityField("timer"),
        field(["timer", "presets"], { label: "Preset buttons (minutes)", placeholder: "1, 5, 10, 25",
            format: v => Array.isArray(v) ? v.join(", ") : String(v),
            parse: text => {
                const parts = String(text).split(/[\s,]+/).filter(Boolean);
                const nums = parts.map(Number);
                return parts.length && nums.every(n => isNumber(n)) ? nums : String(text);
            } })),
        positionHint(TIMER_BOX, "The timer"));

    $("alertsGeneral").replaceChildren(el("div", { class: "fields" },
        field(["alerts", "sound"], { label: "Beep", type: "select", options: YES_NO, parse: toBool }),
        field(["alerts", "flash"], { label: "Flash the page", type: "select", options: YES_NO,
            parse: toBool }),
        field(["alerts", "desktopNotification"], { label: "Desktop notification when away",
            type: "select", options: YES_NO, parse: toBool }),
        field(["alerts", "browserDialog"], { label: "Pop-up dialog when away", type: "select",
            options: [{ value: "auto", label: "If notifications aren't allowed" },
                { value: "true", label: "Always" },
                { value: "false", label: "Never" }],
            parse: v => v === "auto" ? "auto" : v === "true" }),
        field(["alerts", "snoozeMinutes"], { label: "Snooze (minutes)", type: "number", number: true,
            placeholder: "5" }),
        soundField(["alerts", "alarmSound"], "Alarm sound"),
        soundField(["alerts", "timerSound"], "Timer sound"),
        field(["alerts", "soundVolume"], { label: "Volume (0–100)", type: "number", number: true,
            placeholder: "80" })),
        el("p", { class: "hint tight" }, "These are the sounds new alarms and the timer start with; each "
            + "alarm and the timer can also pick their own on the start page. To add sounds, put the "
            + "files in the snd folder and list them in snd/sounds.js."));
}

function renderNotepad() {
    $("notepadGeneral").replaceChildren(el("div", { class: "fields" },
        field(["notepad", "title"], { label: "Box title", placeholder: "Notepad",
            onInput: renderLayout }),
        field(["notepad", "color"], { label: "Box color", type: "color", onInput: renderLayout }),
        field(["notepad", "visibility"], { label: "Visibility", type: "select",
            options: [{ value: "Shown", label: "Shown" },
                { value: "Hidden", label: "Hidden (left off the page)" }],
            onChange: () => {
                renderAll();   // other boxes' positions change too
                focusPath("notepad.visibility");
            } }),
        field(["notepad", "defaultFileName"], { label: "File name for new notes",
            placeholder: "notes.txt" })),
        el("p", { class: "hint tight", id: "notepadPosition" }));
    renderNotepadPosition();
}

function renderNotepadPosition() {
    const p = $("notepadPosition");
    if (!p) {
        return;
    }
    p.replaceChildren(isHiddenBox(NOTEPAD_BOX)
        ? "The notepad is hidden."
        : "The notepad is at " + positionText(NOTEPAD_BOX) + ". ",
        isHiddenBox(NOTEPAD_BOX) ? "" : el("span", {}, "Change that in ",
            el("a", { href: "#sec-layout" }, "Page layout"), "."));
}

function renderAll() {
    applyLayoutOrder();
    renderLayout();
    renderLinkGroups();
    renderSearch();
    renderWeather();
    renderRSS();
    renderNotepad();
    renderClockTimer();
    refresh();
}

function updateCounts() {
    if (!cfg) {
        return;
    }
    $("count-links").textContent = cfg.linkGroups.length;
    $("count-weather").textContent = cfg.weatherPreferences.length;
    $("count-rss").textContent = cfg.rssFeeds.length;
}

// ====================================================================== adding items

function addItem(kind) {
    if (kind === "linkGroup") {
        const g = { name: uniqueGroupName("New group"), parent: "None", order: 0, color: "",
            visibility: "Shown", links: [] };
        cfg.linkGroups.push(g);
        openGroups.add(g);
        changed(true);
        renderAll();
        focusPath(pathKey(["linkGroups", cfg.linkGroups.indexOf(g), "name"]), true);
    } else if (kind === "searchProvider") {
        cfg.searchProviders.push({ name: "", link: "" });
        changed(true);
        renderSearch();
        focusPath(pathKey(["searchProviders", cfg.searchProviders.length - 1, "name"]));
    } else if (kind === "weather") {
        const w = { locationName: "", lat: "", lon: "", unit: "imperial", color: "Blue" };
        cfg.weatherPreferences.push(w);
        changed(true);
        renderAll();
        focusPath(pathKey(["weatherPreferences", cfg.weatherPreferences.indexOf(w), "locationName"]));
    } else if (kind === "rss") {
        const f = { name: "", link: "", color: "Gray" };
        cfg.rssFeeds.push(f);
        changed(true);
        renderAll();
        focusPath(pathKey(["rssFeeds", cfg.rssFeeds.indexOf(f), "name"]));
    }
}

function uniqueGroupName(base) {
    const names = new Set(cfg.linkGroups.map(g => g.name));
    let name = base;
    for (let n = 2; names.has(name); n++) {
        name = base + " " + n;
    }
    return name;
}

// ====================================================================== status, checks, preview

let refreshTimer = null;

function changed(now) {
    if (!dirty) {
        dirty = true;
        showStatus("Unsaved changes", "dirty");
    }
    clearTimeout(refreshTimer);
    if (now) {
        refresh();
    } else {
        refreshTimer = setTimeout(refresh, 200);
    }
}

function showStatus(text, kind) {
    const s = $("status");
    s.textContent = (fileLabel ? fileLabel + " — " : "") + text;
    s.className = "status" + (kind ? " " + kind : "");
}

function refresh() {
    if (!cfg) {
        return;
    }
    problems = validate();

    // Mark fields
    document.querySelectorAll(".invalid, .warned").forEach(e => e.classList.remove("invalid", "warned"));
    document.querySelectorAll(".fieldmsg").forEach(e => {
        e.textContent = "";
        e.className = "fieldmsg";
    });
    document.querySelectorAll(".card.has-error").forEach(e => e.classList.remove("has-error"));
    problems.forEach(p => {
        if (!p.path) {
            return;
        }
        const key = pathKey(p.path);
        const input = document.querySelector("[data-path=\"" + key + "\"]");
        const msg = document.querySelector("[data-msg-for=\"" + key + "\"]");
        if (input && !input.classList.contains("invalid")) {
            input.classList.add(p.level === "error" ? "invalid" : "warned");
        }
        if (msg && msg.textContent === "") {
            msg.textContent = p.msg;
            msg.className = "fieldmsg " + p.level;
        }
        if (p.level === "error" && input) {
            const card = input.closest(".card");
            if (card) {
                card.classList.add("has-error");
            }
        }
    });

    // Side panel list
    const errors = problems.filter(p => p.level === "error");
    const warnings = problems.filter(p => p.level === "warning");
    const panel = $("problems");
    panel.replaceChildren();
    if (problems.length === 0) {
        panel.append(el("div", { class: "allgood" }, "✓ No problems found"));
    }
    const listOf = (items, heading, cls) => {
        if (items.length === 0) {
            return;
        }
        panel.append(el("h4", { class: cls }, heading + " (" + items.length + ")"),
            el("ul", {}, items.slice(0, 30).map(p => el("li", { class: cls },
                p.path
                    ? el("button", { type: "button", onclick: () => focusPath(pathKey(p.path)) },
                        p.where + ": " + p.msg)
                    : p.where + ": " + p.msg))));
    };
    listOf(errors, "Fix before saving", "error");
    listOf(warnings, "Worth a look", "warning");

    $("preview").textContent = fileText();
    updateCounts();
}

// ====================================================================== load and save

function useConfig(config, header, label, handle) {
    cfg = normalize(config);
    const keys = cfg.boxOrder;
    delete cfg.boxOrder;        // kept in `layout` while editing; written back on save
    buildLayout(keys);
    fileHeader = header || DEFAULT_HEADER;
    fileLabel = label;
    fileHandle = handle || null;
    dirty = false;
    renderAll();
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error(src + " not found"));
        document.head.appendChild(s);
    });
}

async function initialLoad() {
    window.userConfig = undefined;
    try {
        await loadScript("user-config.js");
        if (window.userConfig && typeof window.userConfig === "object") {
            useConfig(JSON.parse(JSON.stringify(window.userConfig)), DEFAULT_HEADER,
                    "user-config.js");
            showStatus(window.showSaveFilePicker
                ? "Loaded. The first Save asks where to write: pick the user-config.js next to start-page.html."
                : "Loaded. Save downloads a new user-config.js to put next to start-page.html.");
            return;
        }
        // The file exists but didn't run: show the example meanwhile, and say why.
        await loadExample("user-config.js could not be read (it may have a typo), so this is "
                + "the example. Use Open… to load your file; the editor can read most "
                + "hand-edited files.", "error");
        return;
    } catch (e) {
        // no user-config.js: fall through to the example
    }
    await loadExample("No user-config.js found, so this is the example settings. "
            + "Save it as user-config.js next to start-page.html.");
}

async function loadExample(message, kind) {
    window.userConfig = undefined;
    try {
        await loadScript("user-config.example.js");
    } catch (e) {
        // no example either
    }
    const example = (window.userConfig && typeof window.userConfig === "object")
        ? JSON.parse(JSON.stringify(window.userConfig)) : {};
    useConfig(example, DEFAULT_HEADER, "new file");
    showStatus(message || "Started from the example settings.", kind);
}

async function openFile() {
    if (window.showOpenFilePicker) {
        let handle;
        try {
            [handle] = await window.showOpenFilePicker({
                types: [{ description: "Start Page settings", accept: { "text/javascript": [".js"] } }]
            });
        } catch (e) {
            return;   // cancelled
        }
        const file = await handle.getFile();
        readOpenedFile(await file.text(), file.name, handle);
    } else {
        $("fileInput").value = "";
        $("fileInput").click();
    }
}

function readOpenedFile(text, name, handle) {
    try {
        const parsed = parseConfigText(text);
        useConfig(parsed.config, parsed.header, name, handle);
        showStatus(handle ? "Opened. Save writes straight back to this file."
                : "Opened. Save downloads a new copy.", "saved");
    } catch (e) {
        showStatus("Could not open " + name + ": " + e.message, "error");
    }
}

async function save(asNew) {
    refresh();
    const errors = problems.filter(p => p.level === "error");
    if (errors.length) {
        showStatus("Not saved: fix the " + errors.length + " problem"
                + (errors.length === 1 ? "" : "s") + " marked in red first.", "error");
        focusPath(errors[0].path ? pathKey(errors[0].path) : "");
        return;
    }
    const text = fileText();
    try {
        if (window.showSaveFilePicker && (asNew || !fileHandle)) {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: "user-config.js",
                types: [{ description: "Start Page settings", accept: { "text/javascript": [".js"] } }]
            });
        }
        if (fileHandle) {
            const writable = await fileHandle.createWritable();
            await writable.write(text);
            await writable.close();
            fileLabel = fileHandle.name;
            dirty = false;
            showStatus("Saved at " + new Date().toLocaleTimeString()
                    + ". Reload the start page to see the changes.", "saved");
            return;
        }
    } catch (e) {
        if (e.name === "AbortError") {
            return;   // save dialog cancelled
        }
        showStatus("Could not save (" + e.message + "). Downloading instead.", "error");
    }
    download(text);
    dirty = false;
    showStatus("Downloaded user-config.js. Move it next to start-page.html, replacing the old one, "
            + "then reload the start page.", "saved");
}

function download(text) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    const a = el("a", { href: url, download: "user-config.js" });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText() {
    const text = fileText();
    try {
        await navigator.clipboard.writeText(text);
    } catch (e) {
        const range = document.createRange();
        range.selectNodeContents($("preview"));
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("copy");
        sel.removeAllRanges();
    }
    $("copyBtn").textContent = "Copied ✓";
    setTimeout(() => { $("copyBtn").textContent = "Copy to clipboard"; }, 2000);
}

// Ask before throwing away unsaved changes: the first click arms the button.
function guarded(btn, action) {
    const label = btn.textContent;
    let timer = null;
    btn.addEventListener("click", () => {
        if (!dirty || btn.dataset.armed === "1") {
            clearTimeout(timer);
            btn.dataset.armed = "";
            btn.textContent = label;
            btn.classList.remove("danger", "armed");
            action();
            return;
        }
        btn.dataset.armed = "1";
        btn.textContent = "Discard changes?";
        btn.classList.add("danger", "armed");
        timer = setTimeout(() => {
            btn.dataset.armed = "";
            btn.textContent = label;
            btn.classList.remove("danger", "armed");
        }, 3000);
    });
}

// ====================================================================== start-up

document.addEventListener("DOMContentLoaded", () => {
    $("cssColors").append(...CSS_COLOR_NAMES.map(n => el("option", { value: n })));

    $("groupByTypeBtn").addEventListener("click", () => {
        layout = allBoxes();   // links, weather, RSS, then search
        changed(true);
        renderAll();
    });
    guarded($("openBtn"), openFile);
    guarded($("exampleBtn"), () => loadExample());
    $("saveBtn").addEventListener("click", () => save(false));
    $("saveAsBtn").addEventListener("click", () => save(true));
    $("copyBtn").addEventListener("click", copyText);
    $("downloadBtn").addEventListener("click", () => download(fileText()));
    $("fileInput").addEventListener("change", async () => {
        const file = $("fileInput").files[0];
        if (file) {
            readOpenedFile(await file.text(), file.name, null);
        }
    });
    document.querySelectorAll("[data-add]").forEach(b =>
        b.addEventListener("click", () => addItem(b.dataset.add)));

    document.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            save(false);
        }
    });
    window.addEventListener("beforeunload", e => {
        if (dirty) {
            e.preventDefault();
            e.returnValue = "";
        }
    });

    initialLoad();
});
