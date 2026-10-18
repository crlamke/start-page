# In development

Code for features that are planned but not finished. None of these files
are loaded by `start-page.html` yet; add a `<script ... defer>` line there
(before `js/load-config.js`) once a feature is ready.

| File | Feature |
|---|---|
| `themes.js`, `theme-selector.js` | dark / light / colorful themes |
| `background.js` | background image choice (empty so far) |
| `js-utils.js` | small string helpers |

The alarm clock, timer and notifications that used to be here are now
finished: see `js/clock.js`, `js/timer-box.js` and `js/alerts.js`.
