/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

// Shared pieces for the alarm clock and the timer:
//
//   Ticker  - calls subscribers about twice a second. It runs its timer in a
//             small Web Worker, because browsers slow page timers in
//             background tabs (Chrome to once a minute after a while) but
//             not worker timers, so alarms ring on time in a hidden tab.
//   Alerts  - rings: flashes the page (an overlay with Dismiss / Snooze),
//             flashes the tab title and icon, beeps, and shows a desktop
//             notification (or the browser's alert dialog, if configured)
//             when the page doesn't have focus.
//
// Settings (userConfig.alerts, all optional):
//   sound                true   play a sound when ringing (false = silent)
//   alarmSound           "beep" default sound for new alarms: "beep" (built in),
//                               "none" (silent) or a file listed in
//                               snd/sounds.js, e.g. "snd/chime.wav"
//   timerSound           "beep" the timer's default sound (same choices)
//   soundVolume          80     0 to 100
//   flash                true   flash the page (steady color if the system
//                               asks for reduced motion)
//   desktopNotification  true   system notification when the page isn't in
//                               front (needs the browser's permission)
//   browserDialog        "auto" the browser's own OK/Cancel dialog when the
//                               page isn't in front (OK dismisses, Cancel
//                               snoozes): "auto" = only when desktop
//                               notifications aren't allowed, true = always
//                               instead of a notification, false = never
//   snoozeMinutes        5

const Ticker = (() => {
    const subscribers = new Set();
    let started = false;
    let fallbackTimer = null;

    const tick = () => {
        const now = Date.now();
        subscribers.forEach(fn => {
            try {
                fn(now);
            } catch (e) {
                console.error(e);
            }
        });
    };
    const useFallback = () => {
        if (!fallbackTimer) {
            fallbackTimer = setInterval(tick, 500);
        }
    };
    const start = () => {
        if (started) {
            return;
        }
        started = true;
        try {
            const source = "setInterval(function () { postMessage(0); }, 500);";
            const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
            const worker = new Worker(url);
            worker.onmessage = tick;
            worker.onerror = useFallback;
        } catch (e) {
            useFallback();
        }
        // Catch up straight away when the page comes back.
        document.addEventListener("visibilitychange", tick);
        window.addEventListener("focus", tick);
    };
    return {
        subscribe(fn) {
            subscribers.add(fn);
            start();
            fn(Date.now());
        },
        tick
    };
})();

function alertSettings() {
    const s = configValue("alerts", {});
    const a = (s && typeof s === "object") ? s : {};
    const flag = (v, dflt) => (v === undefined || v === null || v === "") ? dflt
        : (v === true || String(v).toLowerCase() === "true");
    const snooze = Number(a.snoozeMinutes);
    const volume = Number(a.soundVolume);
    const soundOr = v => (typeof v === "string" && v.trim() !== "") ? v.trim() : "beep";
    const dialog = (a.browserDialog === undefined || a.browserDialog === null
            || String(a.browserDialog).toLowerCase() === "auto" || a.browserDialog === "")
        ? "auto" : flag(a.browserDialog, false);
    return {
        sound: flag(a.sound, true),
        flash: flag(a.flash, true),
        desktopNotification: flag(a.desktopNotification, true),
        browserDialog: dialog,            // "auto", true or false
        snoozeMinutes: Number.isFinite(snooze) && snooze > 0 ? snooze : 5,
        alarmSound: soundOr(a.alarmSound),
        timerSound: soundOr(a.timerSound),
        soundVolume: Number.isFinite(volume) ? Math.min(100, Math.max(0, volume)) : 80
    };
}

// The sounds to choose from: the built-in beep, the files listed in
// snd/sounds.js, and "Silent". Each is { name, file }.
function soundChoices() {
    const listed = (typeof startPageSounds !== "undefined" && Array.isArray(startPageSounds))
        ? startPageSounds.filter(x => x && typeof x.file === "string" && x.file.trim() !== "")
            .map(x => ({ name: String(x.name || x.file), file: x.file.trim() }))
        : [];
    return [{ name: "Beep (built in)", file: "beep" }].concat(listed,
        [{ name: "Silent", file: "none" }]);
}

function soundName(file) {
    const found = soundChoices().find(x => x.file === file);
    return found ? found.name : String(file || "beep").split("/").pop();
}

// A <select> of the sounds, with `current` chosen (added to the list if it
// isn't in snd/sounds.js, so a hand-set file still shows).
function soundSelect(current, label) {
    const select = document.createElement("select");
    select.setAttribute("aria-label", label);
    select.title = label;
    const choices = soundChoices();
    if (!choices.some(x => x.file === current)) {
        choices.splice(1, 0, { name: soundName(current), file: current });
    }
    choices.forEach(x => {
        const o = document.createElement("option");
        o.value = x.file;
        o.textContent = x.name;
        select.appendChild(o);
    });
    select.value = current;
    return select;
}

// ▶ / ■ button that previews the sound chosen in `select`.
function soundPreviewButton(select) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "iconbtn soundPreview";
    const idle = () => {
        b.textContent = "▶";
        b.title = "Play this sound";
        b.setAttribute("aria-label", "Play the selected sound");
    };
    idle();
    let stop = null;
    b.addEventListener("click", () => {
        if (stop) {
            stop();
            return;
        }
        b.textContent = "■";
        b.title = "Stop";
        b.setAttribute("aria-label", "Stop the sound");
        stop = Alerts.preview(select.value, () => {
            stop = null;
            idle();
        });
    });
    select.addEventListener("change", () => {
        if (stop) {
            stop();
        }
    });
    return b;
}

const Alerts = (() => {
    const ringing = new Map();     // id -> { title, message, onSnooze, notification }
    let overlay = null;
    let titleTimer = null;
    let originalTitle = "";
    let originalIcon = null;
    let audio = null;              // AudioContext, created on the first click or key
    let soundOut = null;           // gain node for the current ringing sound

    // ------------------------------------------------------------------ sound
    // Browsers only allow sound after the user has clicked or typed on the
    // page, so the audio context is unlocked on the first interaction.
    const unlockAudio = () => {
        try {
            if (!audio) {
                const AC = window.AudioContext || window.webkitAudioContext;
                audio = AC ? new AC() : null;
            }
            if (audio && audio.state === "suspended") {
                audio.resume();
            }
        } catch (e) {
            audio = null;
        }
    };
    ["pointerdown", "keydown"].forEach(type =>
        document.addEventListener(type, unlockAudio, { capture: true }));

    // The built-in beep: three short beeps every 1.2 s, `cycles` times,
    // scheduled all at once on the audio clock so they play on time even in
    // a background tab. Returns the output node (disconnect it to stop).
    const scheduleBeeps = (cycles, volume) => {
        unlockAudio();
        if (!audio) {
            return null;
        }
        if (audio.state === "suspended") {
            audio.resume();
        }
        const out = audio.createGain();
        out.gain.value = Math.min(0.3, 0.18 * volume / 80);
        out.connect(audio.destination);
        const t0 = audio.currentTime + 0.05;
        for (let cycle = 0; cycle < cycles; cycle++) {
            for (let b = 0; b < 3; b++) {
                const start = t0 + cycle * 1.2 + b * 0.2;
                const osc = audio.createOscillator();
                const env = audio.createGain();
                osc.type = "square";
                osc.frequency.value = 880;
                env.gain.setValueAtTime(0, start);
                env.gain.linearRampToValueAtTime(1, start + 0.01);
                env.gain.setValueAtTime(1, start + 0.12);
                env.gain.linearRampToValueAtTime(0, start + 0.14);
                osc.connect(env);
                env.connect(out);
                osc.start(start);
                osc.stop(start + 0.15);
            }
        }
        return out;
    };

    // A sound file, looping. If it is missing or can't play, `onFail` runs
    // (the ringing sound then falls back to the beep).
    const playFile = (file, volume, loop, onFail) => {
        const player = new Audio(file);
        player.loop = loop;
        player.volume = volume / 100;
        let failed = false;
        const fail = () => {
            if (!failed) {
                failed = true;
                console.warn("Sound '" + file + "' could not be played; using the beep instead.");
                onFail();
            }
        };
        player.addEventListener("error", fail);
        const started = player.play();
        if (started && started.catch) {
            started.catch(fail);
        }
        return player;
    };

    let soundFile = null;     // HTMLAudioElement while a file rings
    let soundTimer = null;
    const SOUND_MAX_MS = 2 * 60 * 1000;

    const startSound = (sound) => {
        if (soundOut || soundFile || sound === "none") {
            return;   // already sounding (several alarms share one sound), or silent
        }
        const volume = alertSettings().soundVolume;
        const beep = () => {
            if (soundFile) {
                soundFile.pause();
                soundFile = null;
            }
            if (!soundOut) {
                soundOut = scheduleBeeps(100, volume);
            }
        };
        if (sound && sound !== "beep") {
            soundFile = playFile(sound, volume, true, beep);
        } else {
            beep();
        }
        clearTimeout(soundTimer);
        soundTimer = setTimeout(stopSound, SOUND_MAX_MS);
    };
    const stopSound = () => {
        clearTimeout(soundTimer);
        if (soundOut) {
            soundOut.disconnect();
            soundOut = null;
        }
        if (soundFile) {
            soundFile.pause();
            soundFile = null;
        }
    };

    // Play a sound briefly to try it (up to 4 s). Returns a stop function;
    // `onEnd` runs when it stops either way.
    const preview = (sound, onEnd) => {
        const volume = alertSettings().soundVolume;
        let node = null;
        let player = null;
        let timer = null;
        let done = false;
        const stop = () => {
            if (done) {
                return;
            }
            done = true;
            clearTimeout(timer);
            if (node) {
                node.disconnect();
            }
            if (player) {
                player.pause();
            }
            if (onEnd) {
                onEnd();
            }
        };
        if (sound === "none") {
            timer = setTimeout(stop, 300);
            return stop;
        }
        if (sound && sound !== "beep") {
            player = playFile(sound, volume, false, () => {
                player = null;
                node = scheduleBeeps(1, volume);
            });
            player.addEventListener("ended", stop);
        } else {
            node = scheduleBeeps(1, volume);
        }
        timer = setTimeout(stop, 4000);
        return stop;
    };

    // ------------------------------------------------------------------ tab title and icon
    const bellIcon = "data:image/svg+xml," + encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>"
        + "<circle cx='16' cy='16' r='16' fill='#d62828'/>"
        + "<path d='M16 6a7 7 0 0 0-7 7v5l-2 3h18l-2-3v-5a7 7 0 0 0-7-7zm-3 17a3 3 0 0 0 6 0z' fill='#fff'/>"
        + "</svg>");
    const iconLink = () => {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
        }
        return link;
    };
    const startTabFlash = (text) => {
        if (titleTimer) {
            return;
        }
        originalTitle = document.title;
        originalIcon = iconLink().getAttribute("href");
        let on = false;
        const flip = () => {
            on = !on;
            document.title = on ? "⏰ " + text : originalTitle;
            iconLink().href = on ? bellIcon : (originalIcon || "");
        };
        flip();
        titleTimer = setInterval(flip, 1000);
    };
    const stopTabFlash = () => {
        if (!titleTimer) {
            return;
        }
        clearInterval(titleTimer);
        titleTimer = null;
        document.title = originalTitle;
        if (originalIcon !== null) {
            iconLink().href = originalIcon;
        }
    };

    // ------------------------------------------------------------------ desktop notification
    const notificationsSupported = () => "Notification" in window;
    const notificationState = () => notificationsSupported() ? Notification.permission : "unsupported";

    const requestNotifications = async () => {
        if (!notificationsSupported()) {
            return "unsupported";
        }
        try {
            return await Notification.requestPermission();
        } catch (e) {
            return Notification.permission;
        }
    };

    const pageInFront = () => document.visibilityState === "visible" && document.hasFocus();

    // How an alarm reaches you when the page isn't in front: "notification",
    // "dialog" or "none" (the tab title and icon still flash, and it beeps).
    const awayMethod = (settings) => {
        const canNotify = settings.desktopNotification && notificationState() === "granted";
        if (settings.browserDialog === true) {
            return "dialog";
        }
        if (canNotify) {
            return "notification";
        }
        return settings.browserDialog === "auto" ? "dialog" : "none";
    };

    // The browser's own dialog: OK dismisses, Cancel snoozes. It waits until
    // answered (the beeps carry on meanwhile), so it's shown a moment after
    // the overlay has been drawn.
    const showDialog = (entry, settings) => {
        setTimeout(() => {
            if (!ringing.has(entry.id)) {
                return;
            }
            const text = "⏰ " + entry.title + (entry.message ? "\n" + entry.message : "");
            if (entry.onSnooze) {
                const ok = window.confirm(text + "\n\nOK to dismiss, Cancel to snooze "
                        + settings.snoozeMinutes + " min.");
                if (!ringing.has(entry.id)) {
                    return;   // dismissed elsewhere meanwhile
                }
                if (ok) {
                    dismissAll();
                } else {
                    snoozeAll();
                }
            } else {
                window.alert(text);
                if (ringing.has(entry.id)) {
                    dismissAll();
                }
            }
        }, 300);
    };

    const notify = (entry, settings) => {
        if (pageInFront()) {
            return;   // the flashing page is enough
        }
        const method = awayMethod(settings);
        if (method === "dialog") {
            showDialog(entry, settings);
            return;
        }
        if (method === "notification") {
            try {
                const n = new Notification("⏰ " + entry.title, {
                    body: entry.message || "", tag: "startpage-" + entry.id,
                    requireInteraction: true   // stays until clicked or closed
                });
                n.onclick = () => {
                    window.focus();
                    n.close();
                };
                entry.notification = n;
            } catch (e) {
                console.warn("Desktop notification failed: " + e.message);
            }
        }
    };

    // ------------------------------------------------------------------ overlay
    const buildOverlay = () => {
        overlay = document.createElement("div");
        overlay.className = "alarmOverlay";
        overlay.setAttribute("role", "alertdialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "alarmOverlayTitle");
        const panel = document.createElement("div");
        panel.className = "alarmPanel";
        const bell = document.createElement("div");
        bell.className = "alarmBell";
        bell.textContent = "⏰";
        bell.setAttribute("aria-hidden", "true");
        const heading = document.createElement("h2");
        heading.id = "alarmOverlayTitle";
        const list = document.createElement("ul");
        list.className = "alarmList";
        const buttons = document.createElement("div");
        buttons.className = "alarmButtons";
        const dismiss = document.createElement("button");
        dismiss.type = "button";
        dismiss.className = "alarmDismiss";
        dismiss.textContent = "Dismiss";
        dismiss.addEventListener("click", () => dismissAll());
        const snooze = document.createElement("button");
        snooze.type = "button";
        snooze.className = "alarmSnooze";
        snooze.addEventListener("click", () => snoozeAll());
        buttons.append(dismiss, snooze);
        panel.append(bell, heading, list, buttons);
        overlay.appendChild(panel);
        overlay.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                e.preventDefault();
                dismissAll();
            }
        });
        document.body.appendChild(overlay);
    };

    const renderOverlay = () => {
        const settings = alertSettings();
        if (!overlay) {
            buildOverlay();
        }
        overlay.classList.toggle("flashing", settings.flash);
        const entries = Array.from(ringing.values());
        overlay.querySelector("h2").textContent = entries.length === 1
            ? entries[0].title : entries.length + " alarms";
        const list = overlay.querySelector(".alarmList");
        list.replaceChildren(...entries.map(e => {
            const li = document.createElement("li");
            const strong = document.createElement("strong");
            strong.textContent = e.title;
            li.appendChild(strong);
            if (e.message) {
                li.append(" — " + e.message);
            }
            return li;
        }));
        const snooze = overlay.querySelector(".alarmSnooze");
        snooze.textContent = "Snooze " + settings.snoozeMinutes + " min";
        snooze.hidden = !entries.some(e => e.onSnooze);
        const dismiss = overlay.querySelector(".alarmDismiss");
        if (document.activeElement !== dismiss) {
            dismiss.focus();
        }
    };

    // ------------------------------------------------------------------ ring / stop
    // ring({ id, title, message, sound, onSnooze(minutes) })
    const ring = (entry) => {
        const settings = alertSettings();
        if (ringing.has(entry.id)) {
            return;
        }
        ringing.set(entry.id, entry);
        renderOverlay();
        startTabFlash(entry.title);
        if (settings.sound) {
            startSound(entry.sound || "beep");
        }
        notify(entry, settings);
    };

    const stopAll = () => {
        ringing.forEach(e => {
            if (e.notification) {
                e.notification.close();
            }
        });
        ringing.clear();
        stopSound();
        stopTabFlash();
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
    };

    const dismissAll = () => {
        const ids = Array.from(ringing.keys());
        stopAll();
        broadcast({ type: "dismiss", ids: ids });
    };

    const snoozeAll = () => {
        const minutes = alertSettings().snoozeMinutes;
        const entries = Array.from(ringing.values());
        stopAll();
        entries.forEach(e => {
            if (e.onSnooze) {
                e.onSnooze(minutes);
            }
        });
        broadcast({ type: "dismiss", ids: entries.map(e => e.id) });
    };

    // If the start page is open in several tabs, dismissing in one stops the others.
    const CHANNEL_KEY = "startPage.alerts.broadcast";
    const broadcast = (msg) => {
        try {
            localStorage.setItem(CHANNEL_KEY, JSON.stringify(Object.assign({ at: Date.now() }, msg)));
        } catch (e) {
            // storage blocked: other tabs keep ringing until dismissed there
        }
    };
    window.addEventListener("storage", e => {
        if (e.key !== CHANNEL_KEY || !e.newValue) {
            return;
        }
        try {
            const msg = JSON.parse(e.newValue);
            if (msg.type === "dismiss" && msg.ids.some(id => ringing.has(id))) {
                msg.ids.forEach(id => {
                    const entry = ringing.get(id);
                    if (entry && entry.notification) {
                        entry.notification.close();
                    }
                    ringing.delete(id);
                });
                if (ringing.size === 0) {
                    stopAll();
                } else {
                    renderOverlay();
                }
            }
        } catch (err) {
            // ignore malformed messages
        }
    });

    return {
        ring, dismissAll, isRinging: id => ringing.has(id),
        notificationState, requestNotifications, unlockAudio, awayMethod, preview
    };
})();

// Small helpers shared by the clock and timer.
function readStored(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function writeStored(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // storage blocked: settings last until the page is closed
    }
}

function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
