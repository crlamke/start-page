/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

// Timer state
var TimerState = {
    STOPPED: 0,
    RUNNING: 1
};
var timerState = TimerState.STOPPED;
var elapsedTime = 0;
var splitTime = 0;
var elapsedDisplayDefault = "00:00:00";

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


/*
            <div class="toolBox" class="Timer" id="toolBox2">
                <div class="content">
                    <h3>Timer</h3>
                    <hr>
                    <div id="status">
                        <div class="statusDisplay"><b>Elapsed: </b> <span id="elapsedDisplay"></span></div>
                        <div class="statusDisplay"><b>Split: </b> <span id="splitDisplay"></span></div>
                        <div class="statusDisplay">
                            <button id="timerStartButton" class="timerButton" onclick="startTimer()">Start</button>
                            <button id="timerSplitButton" class="timerButton" onclick="markTimerSplit()">Split</button>
                            <button id="timerStopButton" class="timerButton" onclick="stopTimer()">Stop</button>
                            <button id="timerResetButton" class="timerButton" onclick="resetTimer()">Reset</button>
                        </div>
                    </div>
                </div>
            </div>
*/