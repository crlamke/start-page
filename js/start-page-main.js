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

/* 
 * Application global variables
 */

// Database state
let linksDB; // Store links and link groups
let configDB; // Store general page config 

window.onload = initializePage;

function initializePage() {
    document.getElementById('alarmDisplay').innerHTML = alarmDisplayDefault;
    document.getElementById('elapsedDisplay').innerHTML = elapsedDisplayDefault;
    document.getElementById('splitDisplay').innerHTML = elapsedDisplayDefault;
    //document.getElementById("statusDisplay").innerHTML = "Loading";
    // document.getElementById("searchInput").focus();
    //readTextFile("./user-config.txt");

    loadUserConfigFromJSON();

    document.documentElement.setAttribute('theme', 'dark');

    var bodyStyles = window.getComputedStyle(document.body);
    var greyColor = bodyStyles.getPropertyValue('--dkgrey-color');
    for (i = 0; i < 6; i++) {
        var linkBox = "linkBox" + i;
//        document.getElementById(linkBox).style.backgroundColor = greyColor;
    }

    loadRSS("https://www.techdirt.com/techdirt_rss.xml", "linkBox4List0")
    loadRSS("https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", "linkBox5List0")

    //notifyMe();
    showNotification();

    keepTime();
}

function updateClock(newTime) {
    document.getElementById('timeDisplay').innerHTML = newTime;
}
