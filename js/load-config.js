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

class Link {

    constructor(displayName, linkHref, groupName) {
        this.displayName = displayName;
        this.linkHref = linkHref;
        this.groupName = groupName;
    }
}

class LinkGroup {

    constructor(name, parent, color, position) {
        this.name = name;
        this.parent = parent;
        this.color = color;
        this.position = position;
        this.children = new Array();
        this.links = new Array();
        this.linkBoxID = null;
        this.linkBoxContentUL = null;
        this.linkBoxObj = null;
    }

}

var linkGroupsJSON = "";

var linkGroups = []; // Array to hold all LinkGroup objects

function loadUserConfigFromJSON() {
    //alert(userConfig['linkGroups'][0].name);
	//setElementVisibility();
    loadSearchSettings();
    var toolboxContainer = document.getElementById('toolBox-container0');
    toolboxContainer.style.visibility='hidden';
    toolboxContainer = document.getElementById('toolBox-container1');
    toolboxContainer.style.visibility='hidden';
    loadLinks();
    loadToolboxes();
    //addLinksToPage();
    var linkboxContainer = document.getElementById('linkBox-container0');
    addLinkBoxes(linkboxContainer);
    addListToggle();

    //var linkBox1 = document.getElementById('linkBox1');

    var weatherBox = new WeatherBox("Home Weather", "Blue", 
        38.84, -77.429, "metric");
    var wbox1 = createWeatherBox(weatherBox, 1);
    linkboxContainer.appendChild(wbox1);
    updateWeather(weatherBox);

    var weatherBox2 = new WeatherBox("NCE Weather", "Blue", 
    38.756, -77.195, "metric");
    var wbox2 = createWeatherBox(weatherBox2, 2);
    linkboxContainer.appendChild(wbox2);
    updateWeather(weatherBox2);

    var rss1 = new RSSBox("techdirt", "brown", 1);
    createRSSBox(rss1);
    linkboxContainer.appendChild(rss1.RSSBoxDiv);
    loadRSS("https://www.techdirt.com/techdirt_rss.xml", 
        rss1.listElement.id);
    var rss2 = new RSSBox("New York Times", "green", 2);
    createRSSBox(rss2);
    linkboxContainer.appendChild(rss2.RSSBoxDiv);
    loadRSS("https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
        rss2.listElement.id);

}

// Set the visibility of page elements
function setElementVisibility() {
	var elem = document.getElementById('toolbox4');
	//let toolboxdiv = document.getElementById("toolbox4");
	elem.style.display='none';
}

// Populate the search control based on the settings
// defined in user-config.js.
function loadSearchSettings(rows) {
    for (var i = 0; i < userConfig['searchProviders'].length; i++) {
        addSearchProvider(userConfig['searchProviders'][i].name,
                userConfig['searchProviders'][i].link);
    }
}

// Take the config file and parse it line by line,
// calling functions to create new items or set options
// as directed by each line.
function loadLinks(rows) {

    for (var i = 0; i < userConfig['linkGroups'].length; i++) {
        addLinkGroup(userConfig['linkGroups'][i].name,
                userConfig['linkGroups'][i].parent,
                userConfig['linkGroups'][i].color,
                userConfig['linkGroups'][i].order);

        for (var j = 0; j < userConfig['linkGroups'][i].links.length; j++) {
            addLinkItem(userConfig['linkGroups'][i].links[j].name,
                    userConfig['linkGroups'][i].links[j].link,
                    userConfig['linkGroups'][i].name);
        }
    }
}


function loadToolboxes() {
    for (var i = 0; i < userConfig['toolboxes'].length; i++) {
        setToolboxState(userConfig['toolboxes'][i].name,
                userConfig['toolboxes'][i].color,
                userConfig['toolboxes'][i].visibility);
    }
}

function addLinkGroup(groupNameIn, parentNameIn, groupColorIn, groupPositionIn) {

    // Do error checking before building link group
    if (!groupNameIn || 0 === groupNameIn.length) {
        console.error("Empty link group name");
        return;
    }
    if (!parentNameIn || 0 === parentNameIn.length) {
        console.error("Empty link group parent name");
        return;
    }
    if (!groupColorIn || 0 === groupColorIn.length) {
        groupColorIn = "None";
        return;
    }
    if (!groupPositionIn || 0 === groupPositionIn.length) {
        groupPositionIn = -1;
        return;
    }

    let groupName = groupNameIn.trim();
    let parentName = parentNameIn.trim();
    let groupColor = groupColorIn.trim();
    let groupPosition = groupPositionIn.trim();

    let newGroup = new LinkGroup(groupName, parentName, groupColor, groupPosition);
    linkGroups.push(newGroup);

    if (parentName !== "None") {
        // Find parent link group and add this group as a child
        let parentFound = false;
        for (var i = 0; i < linkGroups.length; i++) {
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


function addLinkItem(linkTextIn, linkRefIn, linkGroupIn) {
    let linkText = linkTextIn.trim();
    let linkRef = linkRefIn.trim();
    let linkGroup = linkGroupIn.trim();
    let groupFound = false;
    let newLink = new Link(linkText, linkRef, linkGroup);
    // Find link group and add link
    for (var i = 0; i < linkGroups.length; i++) {
        if (linkGroups[i].name === linkGroup) {
            linkGroups[i].links.push(newLink);
            //linkGroups[i].attachLink(newLink);
            groupFound = true;
        }
    }

    if (groupFound === false) {
        console.log("No group found for link " + linkText);
        //  orphanLinks.attachLink(newLink);
    }
}




function addLinkBoxes(linkboxContainer) {
    for (var i = 0; i < linkGroups.length; i++) {
        console.log("In addLinkBoxes() - i = " + i);
        // When we find a top level group, we want to add its contents,
        // both links and sub groups, to the current link box.
        if (linkGroups[i].parent === "None") {
            // Create LinkBox object and LinkBoxHTML structure
            linkGroups[i].linkBoxObj = new LinkBox(
                linkGroups[i].name, linkGroups[i].color, linkGroups[i].position);
            createLinkBox(linkGroups[i].linkBoxObj);
            //console.log("itemNumber = " + linkBox1.itemNumber);
            //console.log("bgcolor = " + linkBox1.linkBoxDiv.style.backgroundColor);
            linkboxContainer.appendChild(linkGroups[i].linkBoxObj.linkBoxDiv);
            addLinkGroupToPage(linkGroups[i], linkGroups[i].linkBoxObj.listElement);
        }
    }
    
}


function addLinksToPage() {

    var linkBoxCurrent = 0; // Current link box we're adding links to
    const linkBoxTotal = 6; // Number of link boxes on web page

    for (var i = 0; i < linkGroups.length; i++) {
        console.log("In addLinksToPage() - i = " + i);
        // When we find a top level group, we want to add its contents,
        // both links and sub groups, to the current link box.
        if (linkGroups[i].parent === "None") {
            // Set link box title and get div for link box to pass to functions
            // that add links and sub groups to the link box.
            let linkBoxTitleDiv = document.getElementById(
                    "linkBoxTitle" + linkBoxCurrent);
            //console.log("linkBoxTitle = '" + linkBoxTitleDiv + "'");
            linkBoxTitleDiv.innerHTML = linkGroups[i].name;
            let linkBoxList = document.getElementById(
                    "linkBox" + linkBoxCurrent + "List0");
            //let linkBoxContentDiv = document.getElementById(
            //        "linkBoxContent" + linkBoxCurrent);
            addLinkGroupToPage(linkGroups[i], linkBoxList);
            // Increment link box number after we've completed adding links to the
            // current one.
            linkBoxCurrent++;
        }
    }
}

function addLinkGroupToPage(linkGroup, linkBoxList) {
    if (linkGroup.children.length > 0) {
        for (var j = 0; j < linkGroup.children.length; j++) {
            addLinkGroupToPage(linkGroup.children[j], linkBoxList);
        }
    }

    if (linkGroup.parent !== "None") {
        // Add the group header so this becomes a toggle-able list
        let newLI = document.createElement("li");
        let newSpan = document.createElement("span");
        newSpan.setAttribute('class', 'caret');
        //console.log("Setting group header to " + linkGroup.name);
        newSpan.textContent = linkGroup.name;
        let newUL = document.createElement("ul");
        newUL.setAttribute('class', 'nested');
        newLI.appendChild(newSpan);
        newLI.appendChild(newUL);
        linkBoxList.appendChild(newLI);

        // Add the links in this link group
        for (var i = 0; i < linkGroup.links.length; i++) {
            addLinkToList(linkGroup.links[i].displayName,
                    linkGroup.links[i].linkHref,
                    newUL, true);
        }
    } else {
    //    let linkBoxDiv = document.getElementById(
    //            "linkBox" + (linkGroup.position - 1));
    //    linkBoxDiv.style.backgroundColor = linkGroup.color;

        // Add the links in this link group
        for (var i = 0; i < linkGroup.links.length; i++) {
            addLinkToList(linkGroup.links[i].displayName,
                    linkGroup.links[i].linkHref,
                    linkBoxList, false);
        }
    }
}


function addLinkToList(linkText, linkRef, list, isNested) {
    var newLI = document.createElement("li");
    var newContent = document.createElement("a");
    newContent.href = linkRef;
    newContent.innerHTML = linkText;
    newContent.setAttribute('target', '_blank');
    newLI.appendChild(newContent);
    list.appendChild(newLI);
}

function addListToggle() {
    var toggler = document.getElementsByClassName("caret");
    var i;

    for (i = 0; i < toggler.length; i++) {
        //console.log("Adding listener to " + i);
        toggler[i].addEventListener("click", function () {
            this.parentElement.querySelector(".nested").classList.toggle("active");
            this.classList.toggle("caret-down");
        });
    }
}

function setToolboxState(name, color, visibility) {
    var toggler = document.getElementsByClassName("caret");
    var i;

    for (i = 0; i < toggler.length; i++) {
        //console.log("Adding listener to " + i);
        toggler[i].addEventListener("click", function () {
            this.parentElement.querySelector(".nested").classList.toggle("active");
            this.classList.toggle("caret-down");
        });
    }
}

function printLinksToConsole() {
    console.log("Begin printing links.");
    for (var i = 0; i < linkGroups.length; i++) {
        // Link subgroups will be printed when their top level groups are
        // printed and top level children are iterated through.
        console.log("Found link group '" + linkGroups[i].name + "'");
        if (linkGroups[i].parent === "None") {
            printLinkGroupToConsole(linkGroups[i]);
        }
    }

    console.log("End printing links.");
}

function printLinkGroupToConsole(linkGroup) {
    console.log("Begin printing link group - " + linkGroup.name);
    if (linkGroup.children.length > 0) {
        for (var j = 0; j < linkGroup.children.length; j++) {
            printLinkGroupToConsole(linkGroup.children[j]);
        }
    }
    // Print the links in this link group
    for (var i = 0; i < linkGroup.links.length; i++) {
        console.log("  Link - " + linkGroup.links[i].displayName
                + " - " + linkGroup.links[i].linkHref);
    }
    console.log("End printing link group - " + linkGroup.name);
}