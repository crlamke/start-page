/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

class SearchBox {
    constructor(title, bgColor, searchEngine) {
		this.title = title;
        this.bgColor = bgColor;
        this.itemNumber = itemNumber;
        this.searchBoxDiv = "";
        this.titleElement = "";
        this.listElement = "";
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
/*
    sbox.searchBoxDiv = document.createElement('div');
    sbox.searchBoxDiv.className = "SearchBox";
    sbox.searchBoxDiv.id = "SearchBox" + itemNumber;
    sbox.searchBoxDiv.style.backgroundColor = sbox.bgColor;
    var newContent = document.createElement('div');
    newContent.className = "content";
    sbox.titleElement = document.createElement('h3');
    sbox.titleElement.id = "SearchBoxTitle" + itemNumber;
    sbox.titleElement.textContent = sbox.title;
    newHR = document.createElement('hr');
    	
	sbox.SearchForm = document.createElement('form');
	sbox.SearchForm.role='search';
	sbox.SearchForm.id="search" + itemNumber;
	sbox.SearchForm.target="_blank";
	sbox.SearchForm.action="https://www.duckduckgo.com/?q";
	sbox.SearchForm.method="get";
    searchInput = document.createElement('div');
	searchInput.id = "searchInput";
	searchInput.input = document.createElement("input");
	searchInput.input.type="search";
	searchInput.input.name = "q";
	searchInput.input.placeholder = "Search ...";
	searchInput.input.aria-label = "Search ...";
	searchInput.button = document.createElement("button");
	searchInput.button.label = "Search";
	
	
	<div id="searchTarget" >
                        <div class="statusDisplay"><span class="searchOptionDisplayLabel">Search Engine: </span>
                            <select id="search-target-select" onchange="searchTargetSelect(this.options[this.selectedIndex].value)">
                                <option value="optDuckDuckGo" selected>DuckDuckGo</option>
                                <option value="optGoogle">Google</option>
                                <option value="optBing">Bing</option>
                            </select>
                        </div>
                    </div>
    newContent.appendChild(sbox.titleElement);
    newContent.appendChild(newHR);
    newContent.appendChild(sbox.SearchIconDiv);
	newContent.appendChild(SearchValuesDiv);
    SearchValuesDiv.appendChild(sbox.temperatureValueDiv);
    SearchValuesDiv.appendChild(sbox.SearchDescriptionDiv);
    SearchValuesDiv.appendChild(sbox.locationDiv);
    return newSearchbox;
*/
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
