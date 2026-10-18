/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

// Search box with a choice of search engines from userConfig.searchProviders.
// Each provider's "link" is the search URL up to the query, e.g.
//     "https://duckduckgo.com/?q="
// and the search words are appended, URL-encoded. The last engine used is
// remembered in this browser.

const SEARCH_CHOICE_KEY = "startPage.searchProvider";

class SearchProvider {
    constructor(displayName, searchUrl) {
        this.displayName = displayName;
        this.searchUrl = searchUrl;
    }
}

const searchProviders = [];

function addSearchProvider(providerName, providerLink) {
    const name = String(providerName || "").trim();
    let link = String(providerLink || "").trim();
    if (name === "" || link === "") {
        console.warn("Search provider without a name or link skipped");
        return;
    }
    // Older configs gave just the site, e.g. "https://www.bing.com/".
    if (!link.includes("=")) {
        console.warn("Search provider '" + name + "' link has no query parameter; "
                + "assuming '?q='. Use a full search URL such as "
                + "'https://www.bing.com/search?q='.");
        link = link.replace(/\/?$/, "/") + "?q=";
    }
    searchProviders.push(new SearchProvider(name, link));
}

function loadSearchProviders() {
    configValue("searchProviders", []).forEach(p => addSearchProvider(p.name, p.link));
    if (searchProviders.length === 0) {
        addSearchProvider("DuckDuckGo", "https://duckduckgo.com/?q=");
    }
}

function rememberedProvider() {
    try {
        return localStorage.getItem(SEARCH_CHOICE_KEY) || "";
    } catch (e) {
        return "";   // storage blocked (e.g. some file:// or private-window setups)
    }
}

function rememberProvider(name) {
    try {
        localStorage.setItem(SEARCH_CHOICE_KEY, name);
    } catch (e) {
        // Not being able to remember the choice is harmless.
    }
}

function createSearchBox(title, color) {
    const box = createBox("searchBox", "searchBox", title, color);

    const form = document.createElement("form");
    form.className = "searchForm";
    form.setAttribute("role", "search");

    const input = document.createElement("input");
    input.type = "search";
    input.name = "q";
    input.placeholder = "Search …";
    input.setAttribute("aria-label", "Search words");

    const button = document.createElement("button");
    button.type = "submit";
    button.textContent = "Search";

    const label = document.createElement("label");
    label.className = "searchTarget";
    label.textContent = "Search engine: ";
    const select = document.createElement("select");
    searchProviders.forEach((p, i) => {
        const option = document.createElement("option");
        option.value = String(i);
        option.textContent = p.displayName;
        select.appendChild(option);
    });
    const remembered = searchProviders.findIndex(p => p.displayName === rememberedProvider());
    if (remembered >= 0) {
        select.value = String(remembered);
    }
    select.addEventListener("change", () => {
        rememberProvider(searchProviders[Number(select.value)].displayName);
        input.focus();
    });
    label.appendChild(select);

    const row = document.createElement("div");
    row.className = "searchRow";
    row.append(input, button);
    form.append(row, label);

    form.addEventListener("submit", event => {
        event.preventDefault();
        const words = input.value.trim();
        if (words === "") {
            input.focus();
            return;
        }
        const provider = searchProviders[Number(select.value)];
        window.open(provider.searchUrl + encodeURIComponent(words), "_blank", "noopener");
    });

    box.contentDiv.appendChild(form);
    return box.boxDiv;
}
