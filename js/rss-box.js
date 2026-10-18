/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

// RSS/Atom boxes, one per entry in userConfig.rssFeeds.
//
// Browsers only let a page read another site's feed if that site allows it
// (CORS). Many feeds don't, and a page opened from disk (file://) is treated
// strictly. For those feeds, set userConfig.rssProxy to a CORS proxy URL
// prefix; the feed URL is appended to it, URL-encoded. Example:
//     "rssProxy": "https://your-proxy.example.com/?url="
// Leave it empty ("") to fetch feeds directly.

class RSSBox {
    constructor(title, bgColor, feedUrl, maxItems, itemNumber) {
        this.title = title;
        this.bgColor = bgColor;
        this.feedUrl = feedUrl;
        this.maxItems = maxItems;
        this.itemNumber = itemNumber;
        this.contentDiv = null;
        this.listElement = null;
    }
}

function createRSSBox(rssBox) {
    const box = createBox("RSSBox", "RSSBox" + rssBox.itemNumber,
            rssBox.title, rssBox.bgColor);
    rssBox.contentDiv = box.contentDiv;
    rssBox.listElement = document.createElement("ul");
    rssBox.listElement.className = "rssBoxList";
    showBoxMessage(rssBox.contentDiv, "Loading…");
    return box.boxDiv;
}

// Only allow ordinary web links from a feed (no javascript: and the like).
function safeLink(href) {
    try {
        const url = new URL(href);
        return (url.protocol === "http:" || url.protocol === "https:") ? url.href : "";
    } catch (e) {
        return "";
    }
}

// Pull title/link pairs out of an RSS 2.0, RSS 1.0 (RDF) or Atom document.
function parseFeed(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    if (doc.querySelector("parsererror")) {
        throw new Error("the response is not valid RSS/Atom XML");
    }
    const items = [];
    doc.querySelectorAll("item").forEach(item => {
        const title = item.querySelector("title");
        const link = item.querySelector("link");
        items.push({
            title: title ? title.textContent.trim() : "",
            link: link ? link.textContent.trim() : ""
        });
    });
    doc.querySelectorAll("entry").forEach(entry => {   // Atom
        const title = entry.querySelector("title");
        const link = entry.querySelector("link[rel='alternate']")
                || entry.querySelector("link:not([rel])") || entry.querySelector("link");
        items.push({
            title: title ? title.textContent.trim() : "",
            link: link ? (link.getAttribute("href") || "").trim() : ""
        });
    });
    return items.filter(i => i.title !== "");
}

function loadRSS(rssBox) {
    const proxy = String(configValue("rssProxy", "") || "").trim();
    const url = proxy ? proxy + encodeURIComponent(rssBox.feedUrl) : rssBox.feedUrl;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            return response.text();
        })
        .then(text => {
            const items = parseFeed(text).slice(0, rssBox.maxItems);
            rssBox.listElement.replaceChildren();
            items.forEach(item => {
                const li = document.createElement("li");
                const href = safeLink(item.link);
                if (href) {
                    const a = document.createElement("a");
                    a.href = href;
                    a.textContent = item.title;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    li.appendChild(a);
                } else {
                    li.textContent = item.title;
                }
                rssBox.listElement.appendChild(li);
            });
            rssBox.contentDiv.replaceChildren(rssBox.listElement);
            if (items.length === 0) {
                showBoxMessage(rssBox.contentDiv, "The feed has no items.");
            }
        })
        .catch(error => {
            // fetch() reports a CORS block as a plain "Failed to fetch".
            const hint = (error instanceof TypeError && !proxy)
                    ? " The site may not allow pages to read its feed; set rssProxy in user-config.js."
                    : "";
            console.error("RSS feed '" + rssBox.title + "' (" + rssBox.feedUrl + "): "
                    + error.message);
            // Keep the previous items if a refresh fails.
            if (!rssBox.listElement.hasChildNodes()) {
                showBoxMessage(rssBox.contentDiv, "Feed could not be loaded." + hint);
            }
        });
}

function addRSSBoxes(container) {
    const feeds = configValue("rssFeeds", []);
    const minutes = Number(configValue("rssRefreshMinutes", 30)) || 30;

    feeds.forEach((feed, i) => {
        if (!feed.link) {
            console.warn("RSS feed '" + (feed.name || i + 1) + "' has no link; skipped");
            return;
        }
        const rssBox = new RSSBox(feed.name || feed.link, feed.color || "",
                feed.link, Number(feed.maxItems) || 10, i + 1);
        const boxDiv = createRSSBox(rssBox);
        setBoxKey(boxDiv, "rss", rssBox.title);
        container.appendChild(boxDiv);
        loadRSS(rssBox);
        setInterval(loadRSS, minutes * 60 * 1000, rssBox);
    });
}
