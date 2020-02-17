/* 
 Created on : Jan 10, 2020, 10:38:14 AM
 Author     : Chris Lamke <https://chris.lamke.org>
 License    : MIT License
 */



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

class LinkGroup {
    name = "";
    parent;
    children = new Array();
    links = new Array();

    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
    }

    attachLink(link) {
        links.push(link);
    }
}

class searchProvider {
    displayName = "";
    searchCommand = "";

    constructor(displayName, searchCommand) {
        this.displayName = displayName;
        this.searchCommand = searchCommand;
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
var linkGroups = []; // Array to hold all LinkGroup objects
var orphanLinks = new LinkGroup("Orphans", "None");

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

// Load the setting file from disk, break it into lines, and pass the lines
// to another function to parse.
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

// Take the config file and parse it line by line,
// calling functions to create new items or set options
// as directed by each line.
function parseSettings(rows) {

    for (var i = 0; i < rows.length; i++) {
        // Skip comments and empty lines
        if ((rows[i][0] === "#") || (rows[i].trim() === "")) {
            continue;
        }

        var linkDef = rows[i].split(",");
        switch (linkDef[0]) {
            case "SEARCH-PROVIDER":
                addSearchProvider(linkDef[1], linkDef[2]);
                break;
            case "LINK-GROUP":
                addLinkGroup(linkDef[1], linkDef[2]);
                break;
            case "LINK":
                addLinkItem(linkDef[1], linkDef[2], linkDef[3]);
                break;
            default:
                // Handle invalid line.
                console.log("Ignoring malformed line: " + rows[i]);
                continue;
        }
    }
}

function addSearchProvider(providerName, providerLink) {
    ;
}

function addLinkGroup(groupName, parentName) {

    let newGroup = new LinkGroup(groupName, groupName, parentName);
    linkGroups.push(newGroup);

    if (parentName !== "None") {
        // Find parent link group and add this group as a child
        let parentFound = false;
        for (i = 0; i < linkGroups.length; i++) {
            if (linkGroups[i].name === parentName) {
                linkGroups[i].children.push(newGroup);
                parentFound = true;
            }
        }

        if (parentFound === false) {
            console.log("Parent group " + parentName +
                    " not found for group " + groupName);
        }
    }
}

function addLinkItem(linkText, linkRef, linkGroup) {
    let groupFound = false;
    let newLink = new Link(linkText, linkRef, linkGroup);
    // Find link group and add link
    for (i = 0; i < linkGroups.length; i++) {
        if (linkGroups[i].name === linkGroup) {
            linkGroups[i].attachLink(newLink);
            groupFound = true;
        }
    }

    if (groupFound === false) {
        console.log("No group found for link " + linkText);
        orphanLinks.attachLink(newLink);
    }
}

function addLinksToPage(linkText, linkRef, listDiv) {

    var newDiv = document.createElement("div");
    var newContent = document.createElement("a");
    newContent.href = linkRef;
    newContent.innerHTML = linkText;
    newContent.setAttribute('target', '_blank');
    newDiv.appendChild(newContent);

    // Insert after anchor node  
    listDiv.parentNode.insertBefore(newDiv, listDiv.nextSibling);
}

