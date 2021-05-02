/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

/* 
 * Application global variables
 */

// Database state
let linksDB; // Store links and link groups
let configDB; // Store general page config 

window.onload = initializePage;

function initializePage() {

    loadUserConfigFromJSON();
    applyUserConfig();

    //notifyMe();
    //showNotification();

    keepTime();
}

function updateClock(newTime) {
    //document.getElementById('timeDisplay').innerHTML = newTime;
}
