/* 
 * The MIT License
 *
 * Copyright 2020 Chris Lamke <https://chris.lamke.org>.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// Timekeeping state
var currentTime;

// Alarm state
var AlarmState = {
    UNSET: 0,
    SET: 1
};
var alarmState = AlarmState.UNSET;
var alarmDisplayDefault = "Not Set";
var alarmSetHour = 0;
var alarmSetMinute = 0;
var alarmTimeIsValid = false;
var alarms = new Array();

// Timer state
var TimerState = {
    STOPPED: 0,
    RUNNING: 1
};
var timerState = TimerState.STOPPED;
var elapsedTime = 0;
var splitTime = 0;
var elapsedDisplayDefault = "00:00:00";

function keepTime() {
    currentTime = new Date();

    var currentTimeFormatted = formatTimeHMS(currentTime, true);

    // Rather than run multiple interval timers, we'll run this one 
    // and then call all the update functions from here. 
    // A register/callback mechanism would be better.
    updateClock(currentTimeFormatted);
    if (alarmState === AlarmState.SET) {
        //console.log("delta = " + (alarms[0] - currentTime));
        if (alarms[0] - currentTime <= 0) {
            alert("Alarm.\nPress Okay to dismiss.");
            alarmState = AlarmState.UNSET;
        }
    }

    if (timerState === TimerState.RUNNING) {
        updateTimer(currentTime, currentTimeFormatted);
    }

    // Use a 1 second (1000 millisecond) tick, good enough for our needs.
    var t = setTimeout(keepTime, 1000);
}


function formatTimeHMS(timeIn, withSeconds) {
    var hours = timeIn.getHours();
    var minutes = timeIn.getMinutes();
    var seconds = timeIn.getSeconds();
    if (hours < 10) {
        hmsTime = "0" + hours;
    } else {
        hmsTime = hours;
    }
    hmsTime += ":";
    if (minutes < 10) {
        hmsTime += "0" + minutes;
    } else {
        hmsTime += minutes;
    }
    if (withSeconds === true) {
        hmsTime += ":";
        if (seconds < 10) {
            hmsTime += "0" + seconds;
        } else {
            hmsTime += seconds;
        }
    }

    return hmsTime;
}

function startTimer() {
    if (timerState === TimerState.STOPPED) {
        timerState = TimerState.RUNNING;
    }
}

function markTimerSplit() {
    if (timerState === TimerState.RUNNING) {
        let currentTimeFormatted = formatTimeHMS(currentTime, true);
        document.getElementById('splitDisplay').innerHTML = currentTimeFormatted;
    }
}

function stopTimer() {
    if (timerState === TimerState.RUNNING) {
        timerState = TimerState.STOPPED;
    }
}

function resetTimer() {
    timerState = TimerState.STOPPED;
    document.getElementById('elapsedDisplay').innerHTML = elapsedDisplayDefault;
    document.getElementById('splitDisplay').innerHTML = elapsedDisplayDefault;
}

function updateTimer(currentTime, currentTimeFormatted) {
    document.getElementById('elapsedDisplay').innerHTML = currentTimeFormatted;
}

function alarmTimeUpdate(newValue) {
    var timeRegExp = /([01]?\d|2[0-3]):([0-5]\d)/;
    if (timeRegExp.test(newValue) === true) {
        var timeParts = newValue.split(":");
        alarmSetHour = timeParts[0];
        alarmSetMinute = timeParts[1];
        alarmTimeIsValid = true;
    } else {
        alert(newValue + " is not a valid time. Format is HH:MM in 24 hour format, e.g. 21:12");
        document.getElementById("alarmSetTimeInput").value = "";
        alarmTimeIsValid = false;
    }
}

function setAlarm() {
    if (alarmTimeIsValid === true) {
        var date = new Date();
        date.setHours(alarmSetHour);
        date.setMinutes(alarmSetMinute);
        var alarmTimeFormatted = formatTimeHMS(date, false);
        alarms[alarms.length] = date;
        document.getElementById('alarmDisplay').innerHTML = alarmTimeFormatted;
        document.getElementById('alarmSetTimeInput').innerHTML = "";
        alarmState = AlarmState.SET;
    } else {
        alert("Please enter a valid alarm time first.");
    }
}

function clearAlarm() {
    alarms.pop();
    document.getElementById('alarmDisplay').innerHTML = "";
    alarmState = AlarmState.UNSET;
}

