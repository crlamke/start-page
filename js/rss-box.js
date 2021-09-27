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
        this.listArea = "";
    }
}


function createRSSBox(rssBox) {
    rssBox.RSSBoxDiv = document.createElement('div');
    rssBox.RSSBoxDiv.className = "RSSBox";
    rssBox.RSSBoxDiv.id = "RSSBox" + rssBox.itemNumber;
    rssBox.RSSBoxDiv.style.backgroundColor = rssBox.bgColor;
    rssBox.titleElement = document.createElement('h3');
    rssBox.titleElement.id = "RSSBoxTitle" + rssBox.itemNumber;
    rssBox.titleElement.textContent = rssBox.title;
    newHR = document.createElement('hr');
    rssBox.RSSBoxDiv.appendChild(rssBox.titleElement);
    rssBox.RSSBoxDiv.appendChild(newHR);

    rssBox.listArea = document.createElement('div');
    rssBox.listArea.className = "listArea";
    rssBox.RSSBoxDiv.appendChild(rssBox.listArea);
    rssBox.listElement = document.createElement('ul');
    rssBox.listElement.className = "rssBoxList";
    rssBox.listElement.id = "rssBox" + rssBox.itemNumber + "List" + rssBox.itemNumber;
    rssBox.listArea.appendChild(rssBox.listElement);
    rssBox.RSSBoxDiv.draggable = true;
}

function loadRSS(rssBox)  {
    const RSS_URL = `https://codepen.io/picks/feed/`;

    fetch(RSS_URL,{mode:'cors'})
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      console.log(data);
      const items = data.querySelectorAll("item");
      let html = ``;
      items.forEach(el => {
          let link =  ${el.querySelector("link").innerHTML};
          let title =  ${el.querySelector("title").innerHTML};
        // html += `<article><h4><a href="${el.querySelector("link").innerHTML}" target="_blank">${el.querySelector("title").innerHTML}</a></h4></article>`;
        html += `<article><h4><a href="${el.querySelector("link").innerHTML}" target="_blank">${el.querySelector("title").innerHTML}</a></h4></article>`;
      });
      document.body.insertAdjacentHTML("beforeend", html);
    });
}

function loadRSSOld(rssString, element) {
    elementID = document.getElementById(element);
    $(elementID).rss(rssString,
            {
                entryTemplate: '<li><a href="{url}">{title}</a></li>', limit: 10
            }
    );
}
