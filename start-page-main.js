/* 
    Created on : Jan 10, 2020, 10:38:14 AM
    Author     : Chris Lamke <https://chris.lamke.org>
    License    : MIT License
*/

class LinkGroup {
  name = "";
  parent;
  constructor(name, parent) {    
    this.name = name;
    this.parent = parent;
  }
}

class Link {
  displayName = "";
  linkHref = "";
  groupName = "";
  
  constructor(displayName, linkHref, groupName) {    
    this.displayName = displayName;
    this.linkHref = linkHref;
    this.groupName = groupName;
  }
}

var SearchTargetOption = {
    DUCKDUCKGO: 0,
    GOOGLE: 1,
    BING: 2
};

var AlarmState = {
    UNSET: 0,
    SET: 1
};

var TimerState = {
    STOPPED: 0,
    RUNNING: 1
};

var alarmState = AlarmState.UNSET;
var alarmDisplayDefault = "Not Set";
var alarmSetHour = 0;
var alarmSetMinute = 0;
var alarmTimeIsValid = false;
var timerState = TimerState.STOPPED;
var elapsedTime = 0;
var splitTime = 0;
var elapsedDisplayDefault = "00:00:00";
var alarms = new Array();
var searchTargetOption = SearchTargetOption.DUCKDUCKGO;
//var timeRegExp = new RegExp('([01]?\d|2[0-3]):([0-5]\d)');

window.onload = initializePage;

function initializePage() {
    document.getElementById('alarmDisplay').innerHTML = alarmDisplayDefault;
    document.getElementById('elapsedDisplay').innerHTML = elapsedDisplayDefault;
    document.getElementById('splitDisplay').innerHTML = elapsedDisplayDefault;
    //document.getElementById("statusDisplay").innerHTML = "Loading";
    // document.getElementById("searchInput").focus();
    //readTextFile("./user-config.txt");

    var bodyStyles = window.getComputedStyle(document.body);
    var greyColor = bodyStyles.getPropertyValue('--dkgrey-color');
    for (i = 0; i < 6; i++) {
        var linkBox = "linkBox" + i;
//        document.getElementById(linkBox).style.backgroundColor = greyColor;
    }

    notifyMe();
    showNotification();

    keepTime();
}

function keepTime() {
    var currentTime = new Date();

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
    // Use a 1 second (1000 millisecond) tick, good enough for our needs.
    var t = setTimeout(keepTime, 1000);
}

function updateClock(newTime) {
    document.getElementById('timeDisplay').innerHTML = newTime;
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

function startTimer() {
    if (timerState === TimerState.STOPPED) {
        timerState = TimerState.RUNNING;
    }
}

function markTimerSplit() {
    if (timerState === TimerState.RUNNING) {
        document.getElementById('elapsedDisplay').innerHTML = elapsedDisplayDefault;
        document.getElementById('splitDisplay').innerHTML = elapsedDisplayDefault;
    }

}

function stopTimer() {

}

function searchTargetSelect(selectedValue) {
    if (selectedValue === "optDuckDuckGo") {
        searchTargetOption = SearchTargetOption.DUCKDUCKGO;
		let searchForm = document.getElementById('searchForm');
		searchForm.action = "https://www.duckduckgo.com/?q";
    } else if (selectedValue === "optGoogle") {
        urlLoadOption = SearchTargetOption.GOOGLE;
		let searchForm = document.getElementById('searchForm');
		searchForm.action = "https://www.google.com/?q";
	} else if (selectedValue === "optBing") {
        urlLoadOption = SearchTargetOption.BING;
		let searchForm = document.getElementById('searchForm');
		searchForm.action = "https://www.bing.com/?q";
    } else {
        console.log("Invalid Selection");
    }
}

function loadSettings() {
    var fileUpload = document.getElementById("fileUpload");
    var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;
    if (regex.test(fileUpload.value.toLowerCase())) {
        if (typeof (FileReader) !== "undefined") {
            var reader = new FileReader();
            reader.onload = function (e) {
                var rows = e.target.result.split("\n");
                parseSettings(rows);
            };
            reader.readAsText(fileUpload.files[0]);
        } else {
            alert("This browser does not support HTML5.");
        }
    } else {
        alert("Please upload a valid CSV file.");
    }
}

function parseSettings(rows) {
    var linkBoxCount = 0;
    var linkBoxTitleDiv;
    var linkBoxContentDiv = document.getElementById("linkBoxContent0");
    for (var i = 0; i < rows.length; i++) {
        if ((rows[i][0] === "#") || (rows[i].trim() === "")) {
            continue;
        }
        var linkDef = rows[i].split(",");
        if (linkDef.length === 2) {
            if (linkDef[0] === "GROUP") {
                linkBoxTitleDiv = document.getElementById("linkBoxTitle" + linkBoxCount);
                linkBoxContentDiv = document.getElementById("linkBoxContent" + linkBoxCount);
                linkBoxTitleDiv.innerHTML = linkDef[1];
                linkBoxCount++;
            } else {
                if (linkDef.length === 2) {
                    addLinkToList(linkDef[0], linkDef[1], linkBoxContentDiv);
                } else {
                    console.log("Ignoring malformed line: " + rows[i]);
                }
            }
        }
    }
}

function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if (rawFile.readyState === 4)
        {
            if (rawFile.status === 200 || rawFile.status === 0)
            {
                var allText = rawFile.responseText;
                alert(allText);
            }
        }
    };
    rawFile.send(null);
}

function addLinkToList(linkText, linkRef, listDiv) {
    var newDiv = document.createElement("div");
    var newContent = document.createElement("a");
    newContent.href = linkRef;
    newContent.innerHTML = linkText;
	newContent.setAttribute('target', '_blank');
    newDiv.appendChild(newContent);

    // Insert after anchor node  
    listDiv.parentNode.insertBefore(newDiv, listDiv.nextSibling);
}

function notifyMe() {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var notification = new Notification("Hi there!");
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                var notification = new Notification("Time's Up!");
            }
        });
    }

    // At last, if the user has denied notifications, and you 
    // want to be respectful there is no need to bother them any more.
}

function showNotification() {

    const title = 'Time\'s Up.';

    /*    const options = {
     body: 'The countdown timer has expired.\n' +
     'Time to do the thing.',
     icon: 'file:///C:/crl/dev/jsdev/clock-alarm-timer/img/alarm-badge.png',
     badge: 'file:///C:/crl/dev/jsdev/clock-alarm-timer/img/alarm-badge.png',
     image: 'file:///C:/crl/dev/jsdev/clock-alarm-timer/img/white-beach-and-blue-sky.jpg',
     tag: 'alarm-notification'
     };
     */
    const options = {
        body: 'The countdown timer has expired.\n' + 'Time to do the thing.'
    };

    var notification = new Notification(title, options);
}
