/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

class LinkBox {
    constructor(title, bgColor, itemNumber) {
        this.title = title;
        this.bgColor = bgColor;
        this.itemNumber = itemNumber;
        this.linkBoxDiv = "";
        this.titleElement = "";
        this.listElement = "";
    }
}


function createLinkBox(linkBoxObj) {
    linkBoxObj.linkBoxDiv = document.createElement('div');
    linkBoxObj.linkBoxDiv.className = "linkBox";
    linkBoxObj.linkBoxDiv.id = "linkBox" + linkBoxObj.itemNumber;
    linkBoxObj.linkBoxDiv.style.backgroundColor = linkBoxObj.bgColor;
    var newContent = document.createElement('div');
    newContent.className = "content";
    linkBoxObj.titleElement = document.createElement('h3');
    linkBoxObj.titleElement.id = "linkBoxTitle" + linkBoxObj.itemNumber;
    linkBoxObj.titleElement.textContent = linkBoxObj.title;
    newHR = document.createElement('hr');
    linkBoxObj.listElement = document.createElement('ul');
    linkBoxObj.listElement.className = "linkBoxList";
    linkBoxObj.listElement.id = "linkBox" + linkBoxObj.itemNumber + "List" + linkBoxObj.itemNumber;
    linkBoxObj.linkBoxDiv.appendChild(newContent);
    newContent.appendChild(linkBoxObj.titleElement);
    newContent.appendChild(newHR);
    newContent.appendChild(linkBoxObj.listElement);
    linkBoxObj.linkBoxDiv.draggable = true;
}

