/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

// Countdown timer box. Rings through Alerts (js/alerts.js) when time is up.
// A running timer keeps going across page reloads (its end time is kept in
// this browser) and stays in step across tabs.
//
// Settings (userConfig.timer, all optional):
//   title        box title (default "Timer")
//   color        box color
//   visibility   "Hidden" leaves the timer off the page
//   presets      quick-start buttons in minutes (default [1, 5, 10, 25])

const TIMER_KEY = "startPage.timer";
const TIMER_MAX_MS = 24 * 60 * 60 * 1000;

function timerSettings() {
    const s = configValue("timer", {});
    return (s && typeof s === "object") ? s : {};
}

function timerPresets() {
    const p = timerSettings().presets;
    const list = (Array.isArray(p) ? p : [1, 5, 10, 25])
        .map(Number).filter(n => Number.isFinite(n) && n > 0 && n <= 1440);
    return list.length ? list : [1, 5, 10, 25];
}

// "25" = 25 min, "1:30" = 1 min 30 s, "1:00:00" = 1 h, "1h 30m", "90s"
function parseDuration(text) {
    const t = String(text).trim().toLowerCase();
    if (t === "") {
        return null;
    }
    let ms = null;
    if (/^\d+(\.\d+)?$/.test(t)) {
        ms = Number(t) * 60000;
    } else if (/^\d+(:\d{1,2}){1,2}$/.test(t)) {
        const parts = t.split(":").map(Number);
        if (parts.slice(1).some(n => n > 59)) {
            return null;
        }
        const [h, m, s] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
        ms = ((h * 60 + m) * 60 + s) * 1000;
    } else if (/^(\d+(\.\d+)?\s*(h|hr|hrs|hours?|m|min|mins|minutes?|s|sec|secs|seconds?)\s*)+$/.test(t)) {
        ms = 0;
        t.replace(/(\d+(?:\.\d+)?)\s*([hms])/g, (_, n, unit) => {
            ms += Number(n) * (unit === "h" ? 3600000 : unit === "m" ? 60000 : 1000);
            return "";
        });
    }
    return ms !== null && ms > 0 && ms <= TIMER_MAX_MS ? Math.round(ms) : null;
}

// 4:05, 12:00, 1:02:03
function formatDuration(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const two = n => String(n).padStart(2, "0");
    return h > 0 ? h + ":" + two(m) + ":" + two(s) : m + ":" + two(s);
}

function presetLabel(minutes) {
    return minutes >= 60 && minutes % 60 === 0 ? (minutes / 60) + " h"
        : (minutes < 1 ? Math.round(minutes * 60) + " s" : minutes + " min");
}

function loadTimerState() {
    const st = readStored(TIMER_KEY, null);
    const ok = st && typeof st === "object";
    return {
        duration: ok && Number.isFinite(st.duration) ? st.duration : 5 * 60000,
        endsAt: ok && Number.isFinite(st.endsAt) ? st.endsAt : null,      // running
        remaining: ok && Number.isFinite(st.remaining) ? st.remaining : null, // paused
        label: ok && typeof st.label === "string" ? st.label : "",
        finishedAt: ok && Number.isFinite(st.finishedAt) ? st.finishedAt : null,
        sound: ok && typeof st.sound === "string" && st.sound ? st.sound : alertSettings().timerSound,
        finishedUnseen: ok && st.finishedUnseen === true
    };
}

function createTimerBox() {
    const settings = timerSettings();
    const box = createBox("timerBox", "timerBox", String(settings.title || "Timer"),
            settings.color || "");
    const el = (tag, cls, text) => {
        const e = document.createElement(tag);
        if (cls) {
            e.className = cls;
        }
        if (text !== undefined) {
            e.textContent = text;
        }
        return e;
    };
    const button = (text, title) => {
        const b = el("button", null, text);
        b.type = "button";
        if (title) {
            b.title = title;
        }
        return b;
    };

    // ---------------------------------------------------------------- elements
    const display = el("div", "timerDisplay");
    display.setAttribute("role", "timer");
    const labelLine = el("div", "timerLabel");
    const bar = el("div", "timerBar");
    const fill = el("div", "timerFill");
    bar.appendChild(fill);

    const presets = el("div", "timerPresets");
    timerPresets().forEach(min => {
        const b = button(presetLabel(min), "Start a " + presetLabel(min) + " timer");
        b.addEventListener("click", () => startNew(Math.round(min * 60000), labelInput.value.trim()));
        presets.appendChild(b);
    });

    const form = el("form", "timerForm");
    const durationInput = el("input");
    durationInput.type = "text";
    durationInput.placeholder = "mm:ss or minutes";
    durationInput.setAttribute("aria-label", "Timer length, e.g. 25, 1:30, 1:00:00 or 1h 30m");
    durationInput.title = "e.g. 25 (minutes), 1:30, 1:00:00, 1h 30m, 90s";
    const labelInput = el("input");
    labelInput.type = "text";
    labelInput.placeholder = "Label";
    labelInput.maxLength = 60;
    labelInput.setAttribute("aria-label", "Timer label");
    form.append(durationInput, labelInput);

    const controls = el("div", "timerControls");
    const startBtn = button("Start");
    startBtn.type = "submit";   // inside the form, so Enter in either input starts too
    const resetBtn = button("Reset", "Stop and reset the timer");
    controls.append(startBtn, resetBtn);
    form.appendChild(controls);
    const soundRow = el("div", "soundRow");
    const soundLabel = el("span", "soundLabel", "Sound");
    let soundPick = null;     // made once the saved state is known
    const note = el("div", "timerNote");
    note.setAttribute("aria-live", "polite");

    box.contentDiv.append(display, labelLine, bar, presets, form, soundRow, note);

    // ---------------------------------------------------------------- state
    let state = loadTimerState();
    const save = () => writeStored(TIMER_KEY, state);
    const mutate = (fn) => {
        state = loadTimerState();
        fn(state);
        save();
        render(Date.now());
    };
    window.addEventListener("storage", e => {
        if (e.key === TIMER_KEY) {
            state = loadTimerState();
            render(Date.now());
        }
    });

    // The sound is remembered with the timer; changing it while a timer runs
    // applies to that run too.
    soundPick = soundSelect(state.sound, "Timer sound");
    soundPick.className = "soundPick";
    soundPick.addEventListener("change", () => mutate(st => {
        st.sound = soundPick.value;
    }));
    soundRow.append(soundLabel, soundPick, soundPreviewButton(soundPick));

    // ---------------------------------------------------------------- actions
    const remainingAt = (now) => state.endsAt !== null ? state.endsAt - now
        : (state.remaining !== null ? state.remaining : state.duration);

    function startNew(ms, label) {
        Alerts.unlockAudio();
        mutate(st => {
            st.duration = ms;
            st.endsAt = Date.now() + ms;
            st.remaining = null;
            st.label = label;
            st.finishedAt = null;
            st.finishedUnseen = false;
        });
        durationInput.value = "";
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        Alerts.unlockAudio();
        const typed = durationInput.value.trim();
        if (typed !== "") {
            const ms = parseDuration(typed);
            if (ms === null) {
                note.textContent = "Try 25, 1:30, 1:00:00 or 1h 30m (up to 24 h)";
                durationInput.focus();
                return;
            }
            startNew(ms, labelInput.value.trim());
            return;
        }
        if (state.endsAt !== null) {            // running -> pause
            mutate(st => {
                st.remaining = Math.max(0, st.endsAt - Date.now());
                st.endsAt = null;
            });
        } else if (state.remaining !== null && state.remaining > 0) {   // paused -> resume
            mutate(st => {
                st.endsAt = Date.now() + st.remaining;
                st.remaining = null;
            });
        } else {                                 // idle or finished -> start again
            startNew(state.duration, labelInput.value.trim() || state.label);
        }
    });
    resetBtn.addEventListener("click", () => mutate(st => {
        st.endsAt = null;
        st.remaining = null;
        st.finishedAt = null;
        st.finishedUnseen = false;
    }));

    // ---------------------------------------------------------------- render
    function render(now) {
        if (soundPick && soundPick.value !== state.sound
                && Array.from(soundPick.options).some(o => o.value === state.sound)) {
            soundPick.value = state.sound;
        }
        const running = state.endsAt !== null;
        const paused = !running && state.remaining !== null;
        const finished = !running && !paused && state.finishedAt !== null;
        const left = finished ? 0 : remainingAt(now);
        display.textContent = formatDuration(left);
        display.classList.toggle("done", finished);
        labelLine.textContent = state.label || (running || paused || finished ? "Timer" : "");
        const done = state.duration > 0 ? 1 - Math.max(0, left) / state.duration : 0;
        fill.style.width = Math.min(100, Math.max(0, done * 100)).toFixed(1) + "%";
        startBtn.textContent = running ? "Pause" : (paused ? "Resume" : "Start");
        startBtn.title = running ? "Pause the timer" : (paused ? "Carry on" : "Start the timer");
        resetBtn.disabled = !running && !paused && !finished;
        if (finished) {
            note.textContent = (state.finishedUnseen ? "Finished at " : "Done at ")
                + formatClockTime(new Date(state.finishedAt), false)
                + (state.finishedUnseen ? " while the page was closed" : "");
        } else if (running) {
            note.textContent = "Ends at " + formatClockTime(new Date(state.endsAt), false);
        } else if (paused) {
            note.textContent = "Paused";
        } else {
            note.textContent = "";
        }
    }

    // ---------------------------------------------------------------- start-up
    // A timer that ran out while the page was closed is reported, not rung.
    if (state.endsAt !== null && state.endsAt < Date.now() - LATE_GRACE_MS) {
        mutate(st => {
            st.finishedAt = st.endsAt;
            st.endsAt = null;
            st.remaining = null;
            st.finishedUnseen = true;
        });
    }

    // ---------------------------------------------------------------- tick
    Ticker.subscribe(now => {
        if (state.endsAt !== null && state.endsAt <= now) {
            const endsAt = state.endsAt;
            const label = state.label;
            const duration = state.duration;
            const sound = state.sound;
            mutate(st => {
                st.finishedAt = st.endsAt || endsAt;
                st.endsAt = null;
                st.remaining = null;
            });
            Alerts.ring({
                id: "timer-" + endsAt,
                title: label || "Timer",
                message: "Time's up (" + formatDuration(duration) + ")",
                sound: sound,
                onSnooze: minutes => startNew(minutes * 60000, label)
            });
            return;
        }
        render(now);
    });
    return box.boxDiv;
}

function addTimerBox(container) {
    if (String(timerSettings().visibility || "").toLowerCase() === "hidden") {
        return;
    }
    const boxDiv = createTimerBox();
    setBoxKey(boxDiv, "timer", "");
    container.appendChild(boxDiv);
}
