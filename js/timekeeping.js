/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 * H/T to https://www.construct.net/en/tutorials/js-create-timer-class-code-2261
 */


// TimeKeeper manages time and all timers for the application
class TimeKeeper
{
	constructor(runtime) {
		this.timers = new Map();
		this.runtime = runtime;
	}

	Tick() {
		this.timers.forEach((value, key, map)=>{
			if (!value.paused) {
				value.current += (this.runtime.dt * 1000.0);

				if (value.current>=value.threshold) {
					value.func(...value.params);

					value.current = 0;

					if (value.oneTime) {
						map.delete(key);
					}
				}
			}
		});
	}

	Pause(tag, flag) {
		const item = this.timers.get(tag);

		if (item) {
			item.paused = flag;
		}
	}

	PauseAll(flag) {
		this.timers.forEach((value, key, map)=>{
			value.paused = flag;
		});
	}

	ClearTimer(tag) {
		if (this.timers.has(tag)) {
			this.timers.delete(tag);
		}
	}

	ClearAllTimers() {
		this.CleanUp();
	}

	CleanUp() {
		this.timers.clear();
	}

	CreateTimer(tag, func, params, milliseconds, oneTime=true) {
		let item = this.timers.get(tag);

		if (item) {
			console.info(`Can not create a timer since ${tag} already exists.`);
		}
		else {
			item = new TimerInfo(func, params, milliseconds, oneTime);
			this.timers.set(tag, item);
		}
	}
}


// Timekeeping state
var currentTime;

function keepTime() {
    currentTime = new Date();

    var currentTimeFormatted = formatTimeHMS(currentTime, true);

    // Rather than run multiple interval timers, we'll run this one 
    // and then call all the update functions from here. 
    // A register/callback mechanism would be better.
    updateClock(currentTimeFormatted);
    /*if (alarmState === AlarmState.SET) {
        //console.log("delta = " + (alarms[0] - currentTime));
        if (alarms[0] - currentTime <= 0) {
            alert("Alarm.\nPress Okay to dismiss.");
            alarmState = AlarmState.UNSET;
        }
    }
   
    if (timerState === TimerState.RUNNING) {
        updateTimer(currentTime, currentTimeFormatted);
    }
    */
   
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




