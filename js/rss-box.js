/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

class RSSBox {
    constructor(title, bgColor, itemNumber) {
        this.title = title;
        this.bgColor = bgColor;
        this.itemNumber = itemNumber;
        this.RSSBoxDiv = "";
        this.titleElement = "";
        this.listElement = "";
    }
}

// Create an RSS box
function createRSSBox(rssBox) {
    rssBox.RSSBoxDiv = document.createElement('div');
    rssBox.RSSBoxDiv.className = "RSSBox";
    rssBox.RSSBoxDiv.id = "RSSBox" + rssBox.itemNumber;
    rssBox.RSSBoxDiv.style.backgroundColor = rssBox.bgColor;
    var newContent = document.createElement('div');
    newContent.className = "content";
    rssBox.titleElement = document.createElement('h3');
    rssBox.titleElement.id = "RSSBoxTitle" + rssBox.itemNumber;
    rssBox.titleElement.textContent = rssBox.title;
    newHR = document.createElement('hr');
    var newRSSboxContent = document.createElement('div');
    newRSSboxContent.id = "RSSBoxContent" + rssBox.itemNumber;
    rssBox.listElement = document.createElement('ul');
    rssBox.listElement.className = "RSSBoxList";
    rssBox.listElement.id = "RSSBox" + rssBox.itemNumber + "List" + rssBox.itemNumber;
    rssBox.RSSBoxDiv.appendChild(newContent);
    newContent.appendChild(rssBox.titleElement);
    newContent.appendChild(newHR);
    newContent.appendChild(rssBox.listElement);
    rssBox.RSSBoxDiv.draggable = true;
}


function loadRSS(rssString, element) {
    elementID = document.getElementById(element);
    $(elementID).rss(rssString,
            {
                entryTemplate: '<li><a href="{url}">{title}</a></li>', limit: 10
            }
    );
}
