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
    children;
    links;

    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
        this.children = new Array();
        this.links = new Array();
    }

    attachLink(link) {
        this.links.push(link);
    }
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
                printLinksToConsole();
                addLinksToPage();
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

function addLinkGroup(groupNameIn, parentNameIn) {
    let groupName = groupNameIn.trim();
    let parentName = parentNameIn.trim();
    let newGroup = new LinkGroup(groupName, parentName);
    linkGroups.push(newGroup);
    console.log("Group '" + groupName + "' created. Parent name is \'"
            + parentName + "'");
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
            linkGroups[i].attachLink(newLink);
            groupFound = true;
        }
    }

    if (groupFound === false) {
        console.log("No group found for link " + linkText);
        orphanLinks.attachLink(newLink);
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


function addLinksToPage(linkText, linkRef, listDiv) {

    var linkBoxCurrent = 0; // Current link box we're adding links to
    const linkBoxTotal = 6; // Number of link boxes on web page

    for (var i = 0; i < linkGroups.length; i++) {
        // When we find a top level group, we want to add its contents,
        // both links and sub groups, to the current link box.
        if (linkGroups[i].parent === "None") {
            // Set link box title and get div for link box to pass to functions
            // that add links and sub groups to the link box.
            let linkBoxTitleDiv = document.getElementById(
                    "linkBoxTitle" + linkBoxCurrent);
            console.log("linkBoxTitle = '" + linkBoxTitleDiv + "'");
            linkBoxTitleDiv.innerHTML = linkGroups[i].name;
            let linkBoxList = document.getElementById(
                    "linkBox" + + linkBoxCurrent + "List0" );
            //let linkBoxContentDiv = document.getElementById(
            //        "linkBoxContent" + linkBoxCurrent);
            addLinkGroupToPage(linkGroups[i], linkBoxList);
            
            // Increment link box number after we've completed adding links to the
            // current one.
            linkBoxCurrent++;
        }
    }
}

function addLinkGroupToPage(linkGroup, linkBoxContentDiv) {
    if (linkGroup.children.length > 0) {
        for (var j = 0; j < linkGroup.children.length; j++) {
            addLinkGroupToPage(linkGroup.children[j], linkBoxContentDiv);
        }
    }
    // Add the links in this link group
    for (var i = 0; i < linkGroup.links.length; i++) {
        addLinkToList(linkGroup.links[i].displayName,
                linkGroup.links[i].linkHref,
                linkBoxContentDiv);
    }
}


function addLinkToList(linkText, linkRef, listDiv) {
    //var newDiv = document.createElement("div");
    var newDiv = document.createElement("li");
    var newContent = document.createElement("a");
    newContent.href = linkRef;
    newContent.innerHTML = linkText;
    newContent.setAttribute('target', '_blank');
    newDiv.appendChild(newContent);

    // Insert after anchor node  
    //listDiv.parentNode.appendChild(newDiv);
    listDiv.appendChild(newDiv);
    //listDiv.parentNode.insertBefore(newDiv, listDiv.nextSibling);
}