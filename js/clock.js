/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

// Alarm clock box: the current time and date, plus alarms (one-time or
// daily) that ring through Alerts (js/alerts.js). Alarms are kept in this
// browser (localStorage) and stay in step across tabs.
//
// Settings (userConfig.clock, all optional):
//   title        box title (default "Alarm Clock")
//   color        box color
//   visibility   "Hidden" leaves the clock (and its alarms) off the page
//   hour12       true = 1:30 PM, false = 13:30, "auto" (default) = like the computer
//   showSeconds  true (default) / false

const ALARMS_KEY = "startPage.alarms";
const LATE_GRACE_MS = 60 * 1000;   // ring if the page wakes up at most this late

function clockSettings() {
    const s = configValue("clock", {});
    return (s && typeof s === "object") ? s : {};
}

function boxIsShown(settings) {
    return String(settings.visibility || "").toLowerCase() !== "hidden";
}

// true / false / undefined (= the computer's own setting)
function hour12Setting() {
    const v = clockSettings().hour12;
    if (v === true || String(v).toLowerCase() === "true") {
        return true;
    }
    if (v === false || String(v).toLowerCase() === "false") {
        return false;
    }
    return undefined;
}

function formatClockTime(date, withSeconds) {
    const opts = { hour: "numeric", minute: "2-digit" };
    if (withSeconds) {
        opts.second = "2-digit";
    }
    const h12 = hour12Setting();
    if (h12 !== undefined) {
        opts.hour12 = h12;
    }
    return date.toLocaleTimeString([], opts);
}

// "07:30" -> the next time it is 07:30 after `afterMs`
function nextOccurrence(hhmm, afterMs) {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(afterMs);
    d.setHours(h, m, 0, 0);
    if (d.getTime() <= afterMs) {
        d.setDate(d.getDate() + 1);
    }
    return d.getTime();
}

function formatAlarmTime(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return formatClockTime(d, false);
}

// 9 h 12 min / 4 min / 35 s
function formatWait(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) {
        return s + " s";
    }
    const totalMin = Math.round(s / 60);
    const h = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    if (h === 0) {
        return min + " min";
    }
    return h + " h" + (min ? " " + min + " min" : "");
}

function loadAlarmState() {
    const st = readStored(ALARMS_KEY, null);
    const ok = st && typeof st === "object";
    return {
        alarms: ok && Array.isArray(st.alarms) ? st.alarms : [],
        snoozes: ok && Array.isArray(st.snoozes) ? st.snoozes : []
    };
}

function createClockBox() {
    const settings = clockSettings();
    const showSeconds = settings.showSeconds === undefined
        ? true : (settings.showSeconds === true || String(settings.showSeconds) === "true");
    const box = createBox("clockBox", "clockBox", String(settings.title || "Alarm Clock"),
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

    // ---------------------------------------------------------------- elements
    const timeDiv = el("div", "clockTime");
    const dateDiv = el("div", "clockDate");

    const form = el("form", "alarmForm");
    const timeInput = el("input");
    timeInput.type = "time";
    timeInput.required = true;
    timeInput.setAttribute("aria-label", "Alarm time");
    const labelInput = el("input");
    labelInput.type = "text";
    labelInput.placeholder = "Label";
    labelInput.maxLength = 60;
    labelInput.setAttribute("aria-label", "Alarm label");
    const dailyLabel = el("label", "alarmDaily");
    const dailyBox = el("input");
    dailyBox.type = "checkbox";
    dailyLabel.append(dailyBox, " Daily");
    const addBtn = el("button", null, "Set");
    addBtn.type = "submit";
    addBtn.title = "Set the alarm";
    const soundPick = soundSelect(alertSettings().alarmSound, "Alarm sound");
    soundPick.className = "soundPick";
    const soundRow = el("div", "soundRow");
    soundRow.append(soundPick, soundPreviewButton(soundPick), dailyLabel, addBtn);
    form.append(timeInput, labelInput, soundRow);

    const list = el("ul", "alarmItems");
    const nextDiv = el("div", "clockNext");
    const alertsDiv = el("div", "clockAlerts");

    box.contentDiv.append(timeDiv, dateDiv, form, list, nextDiv, alertsDiv);

    // ---------------------------------------------------------------- state
    let state = loadAlarmState();
    const save = () => writeStored(ALARMS_KEY, state);
    // Re-read before every change so two open tabs don't overwrite each other.
    const mutate = (fn) => {
        state = loadAlarmState();
        fn(state);
        save();
        renderList();
    };

    window.addEventListener("storage", e => {
        if (e.key === ALARMS_KEY) {
            state = loadAlarmState();
            renderList();
        }
    });

    // ---------------------------------------------------------------- list
    const iconButton = (text, title, onClick) => {
        const b = el("button", "iconbtn", text);
        b.type = "button";
        b.title = title;
        b.setAttribute("aria-label", title);
        b.addEventListener("click", onClick);
        return b;
    };

    function renderList() {
        const items = [];
        state.alarms
            .slice()
            .sort((a, b) => a.time.localeCompare(b.time))
            .forEach(a => {
                const li = el("li", "alarmItem" + (a.enabled ? "" : " off"));
                const toggle = el("input");
                toggle.type = "checkbox";
                toggle.checked = !!a.enabled;
                toggle.setAttribute("aria-label", "Alarm " + formatAlarmTime(a.time) + " on");
                toggle.addEventListener("change", () => mutate(st => {
                    const x = st.alarms.find(y => y.id === a.id);
                    if (x) {
                        x.enabled = toggle.checked;
                        x.missed = null;
                        if (x.enabled) {
                            x.at = nextOccurrence(x.time, Date.now());
                        }
                    }
                }));
                const when = el("span", "alarmWhen", formatAlarmTime(a.time));
                const what = el("span", "alarmWhat", a.label || "Alarm");
                what.title = (a.label || "Alarm") + " · sound: " + soundName(a.sound || alertSettings().alarmSound);
                const kind = el("span", "alarmKind", a.missed ? "missed" : (a.daily ? "daily" : "once"));
                if (a.missed) {
                    kind.title = "Missed at " + new Date(a.missed).toLocaleString()
                            + " (the page was closed). Tick the box to set it again.";
                }
                li.append(toggle, when, what, kind, iconButton("✕", "Delete the " + formatAlarmTime(a.time)
                        + " alarm", () => mutate(st => {
                    st.alarms = st.alarms.filter(y => y.id !== a.id);
                })));
                items.push(li);
            });
        state.snoozes
            .slice()
            .sort((a, b) => a.at - b.at)
            .forEach(s => {
                const li = el("li", "alarmItem snoozed");
                li.append(el("span", "alarmWhen", formatClockTime(new Date(s.at), false)),
                    el("span", "alarmWhat", s.label || "Alarm"),
                    el("span", "alarmKind", "snoozed"),
                    iconButton("✕", "Cancel the snooze", () => mutate(st => {
                        st.snoozes = st.snoozes.filter(y => y.id !== s.id);
                    })));
                items.push(li);
            });
        list.replaceChildren(...items);
        renderNext(Date.now());
    }

    function renderNext(now) {
        const times = state.alarms.filter(a => a.enabled).map(a => a.at)
            .concat(state.snoozes.map(s => s.at));
        if (times.length === 0) {
            nextDiv.textContent = state.alarms.length ? "No alarms on" : "No alarms set";
            return;
        }
        nextDiv.textContent = "Next alarm in " + formatWait(Math.min(...times) - now);
    }

    // ---------------------------------------------------------------- adding
    form.addEventListener("submit", e => {
        e.preventDefault();
        Alerts.unlockAudio();
        if (!timeInput.value) {
            timeInput.focus();
            return;
        }
        const time = timeInput.value.slice(0, 5);
        mutate(st => st.alarms.push({
            id: newId(), time: time, label: labelInput.value.trim(), daily: dailyBox.checked,
            enabled: true, at: nextOccurrence(time, Date.now()), missed: null,
            sound: soundPick.value
        }));
        labelInput.value = "";
        timeInput.focus();
    });

    // ---------------------------------------------------------------- ringing
    const snoozeFor = (label, sound) => (minutes) => mutate(st => st.snoozes.push({
        id: newId(), at: Date.now() + minutes * 60000, label: label, sound: sound
    }));

    function checkDue(now) {
        const due = state.alarms.some(a => a.enabled && a.at <= now)
            || state.snoozes.some(s => s.at <= now);
        if (!due) {
            return;
        }
        const toRing = [];
        mutate(st => {
            st.alarms.forEach(a => {
                if (a.enabled && a.at <= now) {
                    const sound = a.sound || alertSettings().alarmSound;
                    toRing.push({ id: "alarm-" + a.id + "-" + a.at, title: a.label || "Alarm",
                        message: formatAlarmTime(a.time) + (a.daily ? " (daily)" : ""),
                        sound: sound, onSnooze: snoozeFor(a.label || "Alarm", sound) });
                    if (a.daily) {
                        a.at = nextOccurrence(a.time, now);
                    } else {
                        a.enabled = false;
                    }
                }
            });
            st.snoozes = st.snoozes.filter(s => {
                if (s.at <= now) {
                    const sound = s.sound || alertSettings().alarmSound;
                    toRing.push({ id: "snooze-" + s.id, title: s.label || "Alarm",
                        message: "Snoozed alarm", sound: sound,
                        onSnooze: snoozeFor(s.label || "Alarm", sound) });
                    return false;
                }
                return true;
            });
        });
        toRing.forEach(entry => Alerts.ring(entry));
    }

    // ---------------------------------------------------------------- desktop alerts status
    function renderAlertsStatus() {
        const a = alertSettings();
        const perm = Alerts.notificationState();
        const method = Alerts.awayMethod(a);
        alertsDiv.replaceChildren();
        const text = el("span");
        text.title = "How alarms reach you when the start page isn't in front. "
                + "The tab title and icon always flash, and it beeps.";
        if (method === "notification") {
            text.textContent = "Desktop alerts on";
        } else if (a.desktopNotification && perm === "default" && a.browserDialog !== true) {
            const on = el("button", "linkbtn", "Turn on desktop alerts");
            on.type = "button";
            on.title = "Lets alarms show a system notification when the start page isn't in front";
            on.addEventListener("click", async () => {
                Alerts.unlockAudio();
                await Alerts.requestNotifications();
                renderAlertsStatus();
            });
            text.append(on, method === "dialog" ? " (until then: pop-up)" : "");
        } else if (method === "dialog") {
            text.textContent = a.browserDialog === true ? "Alerts: pop-up dialog"
                : (perm === "denied" ? "Desktop alerts blocked; using a pop-up"
                    : "Alerts: pop-up dialog");
            if (perm === "denied") {
                text.title += " To use desktop notifications, allow them for this page in the "
                        + "browser's site settings.";
            }
        } else {
            text.textContent = "Away alerts off (tab flashes and beeps)";
        }
        const test = el("button", "linkbtn", "Test");
        test.type = "button";
        test.title = "Rings a test alarm in 5 seconds: switch to another window to see how it reaches you";
        test.addEventListener("click", () => {
            Alerts.unlockAudio();
            test.textContent = "Ringing in 5 s…";
            test.disabled = true;
            setTimeout(() => {
                test.textContent = "Test";
                test.disabled = false;
                Alerts.ring({ id: "test-" + Date.now(), title: "Test alarm",
                    message: "This is how alarms reach you." });
            }, 5000);
        });
        alertsDiv.append(text, " · ", test);
    }

    // ---------------------------------------------------------------- start-up
    // Alarms that came due while the page was closed: daily ones move to
    // their next time, one-time ones are marked missed instead of ringing late.
    mutate(st => {
        const now = Date.now();
        st.alarms.forEach(a => {
            if (a.enabled && a.at < now - LATE_GRACE_MS) {
                if (a.daily) {
                    a.at = nextOccurrence(a.time, now);
                } else {
                    a.enabled = false;
                    a.missed = a.at;
                }
            }
        });
        st.snoozes = st.snoozes.filter(s => s.at >= now - LATE_GRACE_MS);
    });

    // ---------------------------------------------------------------- tick
    let lastShown = "";
    Ticker.subscribe(now => {
        const d = new Date(now);
        const shown = formatClockTime(d, showSeconds);
        if (shown !== lastShown) {
            lastShown = shown;
            timeDiv.textContent = shown;
            dateDiv.textContent = d.toLocaleDateString([], { weekday: "long", month: "long",
                day: "numeric" });
            renderNext(now);
        }
        checkDue(now);
    });

    renderAlertsStatus();
    return box.boxDiv;
}

function addClockBox(container) {
    if (!boxIsShown(clockSettings())) {
        return;
    }
    const boxDiv = createClockBox();
    setBoxKey(boxDiv, "clock", "");
    container.appendChild(boxDiv);
}
