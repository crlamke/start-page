# Start Page

A browser start page with link boxes, weather, RSS feeds and a search box,
all set up from one config file. It is meant to be opened straight from
disk (`file://`), because I often don't have access to a web server.

![Start Page screenshot](readme/start-page.png?raw=true "Start Page Screenshot")

## Setup

1. Copy `user-config.example.js` to `user-config.js` and edit it: your link
   groups, weather locations, RSS feeds and search engines.
2. Copy `secrets.example.js` to `secrets.js` and add your OpenWeather API
   key (free at <https://home.openweathermap.org/api_keys>).
3. Open `start-page.html` in your browser, and set it as your home page if
   you like.

To change your settings later, open `config-editor.html` (see below) or
edit `user-config.js` in a text editor.

`user-config.js` and `secrets.js` are listed in `.gitignore`, so your
locations, links and keys never end up in git. Keep `secrets.js` with your
other secrets and copy it in when you set up a new machine. If either file
is missing, the page still opens and says what to do.

## Notepad

The notepad box is for quick notes. **New** starts an empty note, **Open…**
loads a text file, **Save** (or Ctrl+S in the notepad) saves it, and
**Save as…** saves to a new file. The file name shows under the text, with
● while there are unsaved changes. Drag the notepad's bottom-right corner
to make it taller.

- **Chrome, Edge, Opera:** Save writes straight back to the file you
  opened (the first Save of a new note asks where to put it).
- **Firefox, Safari:** Save downloads the file under its name; move it
  where you want it.

What you type is also kept as a draft in this browser, so reloading the
page or closing the tab doesn't lose it. After a reload, the next Save
asks where to write again, suggesting the same file name. Windows (CRLF)
line endings in an opened file are kept when it is saved.

## Alarm clock and timer

The **Alarm Clock** box shows the time and date. To set an alarm, pick a
time, add a label if you like, tick **Daily** to repeat it every day, and
click **Set**. Untick an alarm to turn it off; ✕ deletes it. One-time
alarms turn themselves off after ringing.

The **Timer** box counts down. Click a preset (1, 5, 10, 25 min) to start
straight away, or type a length (`25` = 25 minutes, `1:30`, `1:00:00`,
`1h 30m`, `90s`), an optional label, and press **Start**. **Pause**,
**Resume** and **Reset** do what they say.

When an alarm or timer rings:

- **Start page in front:** the page flashes (once a second; a steady color
  if your system is set to reduce motion) with **Dismiss** (or Esc) and
  **Snooze**, and it beeps.
- **Start page not in front** (another tab or window): the tab title and
  icon flash, it beeps, and you get a **desktop notification** that stays
  until you click it. If the browser doesn't allow notifications for the
  page, the browser's own **OK/Cancel dialog** appears instead: OK
  dismisses, Cancel snoozes. Click **Turn on desktop alerts** in the clock
  box to allow notifications, and **Test** to ring a test alarm in 5
  seconds (switch to another window to see what happens).

**Sounds:** pick a sound for each alarm (next to **Set**) and for the
timer (under its buttons); ▶ plays it. The choices are the built-in beep,
the sound files in the `snd` folder (chime, bell, digital alarm, gentle,
wake up) and Silent. To add your own, copy the file into `snd` and list it
in `snd/sounds.js` (see `snd/README.md`). The defaults for new alarms and
the timer, and the volume, are in the settings editor. If a sound file is
missing or won't play, the beep plays instead.

A web page can't flash the whole screen outside the browser, so the
notification or dialog is how an alarm reaches you when you're in another
program. Browsers only allow sound after you've clicked or typed on the
page once; setting an alarm or starting a timer counts.

Alarms and a running timer are kept in this browser, so they survive a
reload. The start page must be open (any tab) for them to ring. An alarm
that came due while the page was closed is marked **missed** (daily alarms
move on to the next day), and a timer that ran out says when it finished.
With the start page open in several tabs, they stay in step, and
dismissing in one stops the others.

## Settings editor

Open `config-editor.html` from the same folder to edit `user-config.js`
with forms instead of by hand: arrange the boxes on the page by dragging
them in **Page layout**, add, reorder and delete link groups, links,
search engines, weather locations and feeds, pick colors, and put a group
inside another. It checks for mistakes as you type (missing names, bad
URLs, coordinates out of range, colors too light for white text) and won't
save while something is marked in red. "File preview" shows exactly what
will be saved.

Saving:

- **Chrome, Edge, Opera:** the first Save asks where to write; pick the
  `user-config.js` next to `start-page.html`. After that, Save (or Ctrl+S)
  writes straight to it. Using **Open…** to pick your file first does the
  same.
- **Firefox, Safari:** Save downloads a new `user-config.js`; move it next
  to `start-page.html`, replacing the old one.

Then reload the start page. Settings the editor doesn't show (such as
`toolboxes`) are kept unchanged, and a hand-edited file with comments or
trailing commas still opens. The editor never touches `secrets.js`.

### Importing bookmarks

Click **Import bookmarks…** under Link boxes to turn your browser's
bookmarks into link groups. A web page can't read the browser's bookmarks
directly, so export them to a file first:

- **Chrome / Edge:** bookmark manager (Ctrl+Shift+O) → ⋮ (Edge: …) →
  *Export bookmarks*.
- **Firefox:** Bookmarks → Manage bookmarks → *Import and Backup* →
  *Export Bookmarks to HTML…*
- **Safari:** File → Export → *Bookmarks…*

Chrome's or Edge's own `Bookmarks` file (in the browser profile folder) and
Firefox JSON backups work too. Choose the folders to bring in; each one
becomes a link group. Top folders become boxes and folders inside them
become collapsible lists, or put everything in one box. A folder with the
same name as one of your groups adds its links to that group (or imports
as a renamed group, if you prefer). Links you already have, bookmarklets
and other non-web links are skipped, so importing the same file again adds
nothing new. **Undo import** reverses it until you save.

## Configuration

`user-config.example.js` explains every setting at the top. In short:

| Setting | What it does |
|---|---|
| `boxOrder` | The order of all boxes on the page, by type and title: `["search", "notepad", "link:News", "weather:Home", "rss:techdirt"]`. Boxes not listed follow in the usual order (links, weather, RSS, search, notepad, clock, timer). Easiest to set with the drag-and-drop **Page layout** in `config-editor.html`. |
| `linkGroups` | One box per group with `"parent": "None"`, sorted by `order` (unless `boxOrder` says otherwise). A group whose `parent` is another group's name becomes a collapsible list inside that box. `"visibility": "Hidden"` leaves a group out. |
| `weatherPreferences` | One weather box per location (`lat`, `lon`, `unit`: `"imperial"` or `"metric"`). Click the temperature to switch between °F and °C. Refreshed every `weatherRefreshMinutes` (default 10). |
| `rssFeeds` | One box per RSS or Atom feed (`maxItems` defaults to 10). Refreshed every `rssRefreshMinutes` (default 30). |
| `rssProxy` | Optional CORS proxy URL prefix for feeds the browser won't load directly (see below). |
| `searchProviders` | Search engines for the search box: a name and the search URL up to the query, e.g. `https://duckduckgo.com/?q=`. The last one you used is remembered. |
| `notepad` | The notepad box: `title`, `color`, `visibility` (`"Hidden"` leaves it off the page) and `defaultFileName` (suggested when saving a new note, default `notes.txt`). |
| `clock` | The alarm clock box: `title`, `color`, `visibility`, `hour12` (`true`, `false` or `"auto"` = like the computer) and `showSeconds`. |
| `timer` | The timer box: `title`, `color`, `visibility` and `presets` (quick-start buttons in minutes, default `[1, 5, 10, 25]`). |
| `alerts` | How alarms ring: `sound`, `flash`, `desktopNotification` (all `true` by default), `browserDialog` (`"auto"`: the browser's OK/Cancel dialog when desktop notifications aren't allowed; `true`: always; `false`: never), `snoozeMinutes` (5), `alarmSound` and `timerSound` (the sounds new alarms and the timer start with: `"beep"`, `"none"` or a file from `snd/sounds.js` such as `"snd/chime.wav"`) and `soundVolume` (0–100, default 80). |
| `toolboxes` | No longer used; the clock and timer have their own settings. |

Colors are CSS color names or hex values. Boxes are darkened slightly so
white text stays readable; very light colors (Gold, Yellow) are still hard
to read.

### RSS feeds and CORS

Browsers only let a page read another site's feed if that site allows it
(CORS). Some feeds do; many don't, and pages opened from disk are treated
strictly. A feed that is blocked shows "Feed could not be loaded" in its
box, and the browser console (F12) has the details. To read such feeds,
set `rssProxy` to a CORS proxy you trust; the feed URL is appended to it,
URL-encoded. A proxy sees which feeds you read, so a small one you run
yourself (or a browser extension version of this page) is the private
option.

## Project layout

```
start-page.html          the page
config-editor.html       settings editor for user-config.js
user-config.example.js   settings template  -> copy to user-config.js
secrets.example.js       secrets template   -> copy to secrets.js
css/main.css             styles
js/box.js                shared box frame used by every box type
js/link-box.js           link groups and link boxes
js/weather.js            weather boxes (OpenWeather API)
js/rss-box.js            RSS / Atom boxes
js/search-box.js         search box
js/notepad.js            notepad box (open / save text files)
js/alerts.js             shared ticker and alarm alerts (flash, sound, notification)
js/clock.js              alarm clock box
js/timer-box.js          timer box
snd/                     alarm sounds, sounds.js (the list of them), make_sounds.py
js/load-config.js        reads user-config.js and builds the page
js/main.js               start-up
js/config-editor.js      settings editor logic (css/config-editor.css)
js/bookmark-import.js    Import bookmarks in the settings editor
js/in-development/       planned features, not loaded yet (see its README)
img/                     background images, favicon, weather icons
doc/                     requirements notes
```

## Credits

Weather icons by Ashley Jager, via
[Weather-App-JavaScript](https://github.com/CodeExplainedRepo/Weather-App-JavaScript)
(MIT); see `img/weather-icons/README-weather-icons.txt`. The collapsible
link list is based on the
[W3Schools tree view](https://www.w3schools.com/howto/howto_js_treeview.asp).

## License

MIT; see `LICENSE`.
