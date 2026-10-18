/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

/*
 * Start Page settings. TEMPLATE - this copy is kept in git.
 *
 * Copy it to user-config.js (same folder as start-page.html) and edit that
 * copy; user-config.js is not kept in git, so your locations and links stay
 * private.
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

var userConfig = {
    "boxOrder": [
        "search",
        "link:News",
        "link:Dev",
        "weather:Washington, DC",
        "rss:BBC World",
        "notepad",
        "clock",
        "timer"
    ],
    "searchBoxTitle": "Search",
    "searchBoxColor": "",
    "searchProviders": [
        {
            "name": "DuckDuckGo",
            "link": "https://duckduckgo.com/?q="
        },
        {
            "name": "Google",
            "link": "https://www.google.com/search?q="
        },
        {
            "name": "Bing",
            "link": "https://www.bing.com/search?q="
        }
    ],
    "linkGroups": [
        {
            "name": "News",
            "parent": "None",
            "order": 1,
            "color": "Crimson",
            "links": [
                {
                    "name": "BBC News",
                    "link": "https://www.bbc.com/news"
                },
                {
                    "name": "Ars Technica",
                    "link": "https://arstechnica.com/"
                }
            ]
        },
        {
            "name": "Dev",
            "parent": "None",
            "order": 2,
            "color": "Blue",
            "links": [
                {
                    "name": "GitHub",
                    "link": "https://github.com/"
                },
                {
                    "name": "MDN Web Docs",
                    "link": "https://developer.mozilla.org/"
                }
            ]
        },
        {
            "name": "Regex",
            "parent": "Dev",
            "order": 3,
            "color": "",
            "links": [
                {
                    "name": "RegExr",
                    "link": "https://regexr.com/"
                },
                {
                    "name": "Regex101",
                    "link": "https://regex101.com/"
                }
            ]
        }
    ],
    "weatherPreferences": [
        {
            "locationName": "Washington, DC",
            "lat": 38.907,
            "lon": -77.037,
            "unit": "imperial",
            "color": "Blue"
        }
    ],
    "weatherRefreshMinutes": 10,
    "rssFeeds": [
        {
            "name": "BBC World",
            "link": "https://feeds.bbci.co.uk/news/world/rss.xml",
            "color": "Gray",
            "maxItems": 10
        }
    ],
    "rssRefreshMinutes": 30,
    "rssProxy": "",
    "notepad": {
        "title": "Notepad",
        "color": "DarkSlateGray",
        "visibility": "Shown",
        "defaultFileName": "notes.txt"
    },
    "clock": {
        "title": "Alarm Clock",
        "color": "",
        "visibility": "Shown",
        "hour12": "auto",
        "showSeconds": true
    },
    "timer": {
        "title": "Timer",
        "color": "",
        "visibility": "Shown",
        "presets": [1, 5, 10, 25]
    },
    "alerts": {
        "sound": true,
        "flash": true,
        "desktopNotification": true,
        "browserDialog": "auto",
        "snoozeMinutes": 5,
        "alarmSound": "snd/chime.wav",
        "timerSound": "snd/digital.wav",
        "soundVolume": 80
    },
    "toolboxes": [
        {
            "name": "Timer",
            "color": "MidnightBlue",
            "visibility": "Shown"
        },
        {
            "name": "TimeAndAlarm",
            "color": "Gray",
            "visibility": "Shown"
        }
    ]
};
