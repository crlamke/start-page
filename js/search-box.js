/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

 
class SearchBox {

    constructor(title, bgColor, searchEngine) {
        this.title = title;
        this.bgColor = bgColor;
        this.titleElement = "";
        this.SearchIconDiv = "";
        this.temperatureValueDiv = "";
        this.SearchDescriptionDiv = "";
        this.locationDiv = "";
    }
}

class searchProvider {

    constructor(displayName, searchCommand) {
        this.displayName = displayName;
        this.searchCommand = searchCommand;
    }
}

var SearchTargetOption = {
    DUCKDUCKGO: 0,
    GOOGLE: 1,
    BING: 2
};

function createSearchBox(sbox, itemNumber) {

    var newSearchbox = document.createElement('div');
    newSearchbox.className = "SearchBox";
    newSearchbox.id = "SearchBox" + itemNumber;
    newSearchbox.style.backgroundColor = sbox.bgColor;
    var newContent = document.createElement('div');
    newContent.className = "content";
    sbox.titleElement = document.createElement('h3');
    sbox.titleElement.id = "SearchBoxTitle" + itemNumber;
    sbox.titleElement.textContent = sbox.title;
    newHR = document.createElement('hr');
    sbox.SearchIconDiv = document.createElement('div');
    sbox.SearchIconDiv.className = "SearchIcon";
	var SearchValuesDiv = document.createElement('div');
	SearchValuesDiv.className = "SearchValues"; 
    sbox.temperatureValueDiv = document.createElement('div');
    sbox.temperatureValueDiv.className = "tempValue";
    sbox.SearchDescriptionDiv = document.createElement('div');
    sbox.SearchDescriptionDiv.className = "SearchDescription";
    sbox.locationDiv = document.createElement('div');
    sbox.locationDiv.className = "SearchLocation";

    newSearchbox.appendChild(newContent);
    newContent.appendChild(sbox.titleElement);
    newContent.appendChild(newHR);
    newContent.appendChild(sbox.SearchIconDiv);
	newContent.appendChild(SearchValuesDiv);
    SearchValuesDiv.appendChild(sbox.temperatureValueDiv);
    SearchValuesDiv.appendChild(sbox.SearchDescriptionDiv);
    SearchValuesDiv.appendChild(sbox.locationDiv);
    return newSearchbox;
}
/*
            <div class="toolBox" class="Search" id="toolBox1">
                <div class="content">
                    <h3>Search</h3>
                    <hr>
                    <form id="searchForm" role="search" action="https://www.duckduckgo.com/?q" method="get" target="_blank">
                        <div id="searchInput" >
                            <input type="search" name="q" placeholder="Search ..." aria-label="Search ...">
                            <button>Search</button>
                        </div>
                    </form>
                    <div id="searchTarget" >
                        <div class="statusDisplay"><span class="searchOptionDisplayLabel">Search Engine: </span>
                            <select id="search-target-select" onchange="searchTargetSelect(this.options[this.selectedIndex].value)">
                                <option value="optDuckDuckGo" selected>DuckDuckGo</option>
                                <option value="optGoogle">Google</option>
                                <option value="optBing">Bing</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
*/

// Search state
var searchTargetOption = SearchTargetOption.DUCKDUCKGO;

function addSearchProvider(providerName, providerLink) {
    ;
}

function searchTargetSelect(selectedValue) {
    if (selectedValue === "optDuckDuckGo") {
        searchTargetOption = SearchTargetOption.DUCKDUCKGO;
        let searchForm = document.getElementById('searchForm');
        searchForm.action = "https://www.duckduckgo.com/?q";
    } else if (selectedValue === "optGoogle") {
        urlLoadOption = SearchTargetOption.GOOGLE;
        let searchForm = document.getElementById('searchForm');
        searchForm.action = "https://www.google.com/?q";
    } else if (selectedValue === "optBing") {
        urlLoadOption = SearchTargetOption.BING;
        let searchForm = document.getElementById('searchForm');
        searchForm.action = "https://www.bing.com/?q";
    } else {
        console.log("Invalid Selection");
    }
}