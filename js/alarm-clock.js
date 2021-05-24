/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

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


/*
            <div class="toolBox" class="TimeAndAlarm" id="toolBox0" >
            <div class="content">
                <h3>Time and Alarm</h3>
                <hr>
                <div id="status">
                    <div class="statusDisplay"><span class="statusDisplayLabel">Current Time:</span><span id="timeDisplay"></span></div>
                    <div class="statusDisplay"><span class="statusDisplayLabel">Alarm Time:</span><span id="alarmDisplay"></span><button id="clearButton" class="alarmButton" onclick="clearAlarm()">Clear</button></div>
                    <span class="statusDisplay"><span class="statusDisplayLabel">Set Alarm:</span><input title="Format is HH:MM in 24 hour format, e.g. 21:12" type="text" size="5" id="alarmSetTimeInput" onchange="alarmTimeUpdate(this.value)"> <button id="setButton" class="alarmButton" onclick="setAlarm()">Set</button> </span>
                </div>
            </div>
        </div>
*/