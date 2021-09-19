/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

class SearchBox {
    constructor(title, bgColor, searchEngine) {
		this.title = title;
        this.bgColor = bgColor;
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

function createSearchBox(sbox) {

    sbox.searchBoxDiv = document.createElement('div');
    sbox.searchBoxDiv.className = "searchBox";
    sbox.searchBoxDiv.id = "searchBox";
    sbox.searchBoxDiv.style.backgroundColor = sbox.bgColor;
    var newContent = document.createElement('div');
    newContent.className = "content";
    sbox.titleElement = document.createElement('h3');
    sbox.titleElement.id = "searchBoxTitle";
    sbox.titleElement.textContent = sbox.title;
    newHR = document.createElement('hr');
    
    //var newSearchFormContent = document.createElement("div");
    //newSearchFormContent.id = "searchFormContent";
	sbox.SearchForm = document.createElement('form');
    sbox.SearchForm.role='search';
	sbox.SearchForm.id="search";
	sbox.SearchForm.target="_blank";
	sbox.SearchForm.action="https://www.duckduckgo.com/?q";
	sbox.SearchForm.method="get";
    searchInput = document.createElement('div');
	searchInput.id = "searchInput";
	searchInput.input = document.createElement("input");
    sbox.SearchForm.appendChild(searchInput.input);
	searchInput.input.type="search";
	searchInput.input.name = "q";
	searchInput.input.placeholder = "Search ...";
	searchInput.button = document.createElement("button");
	searchInput.button.label = "Search";
    searchInput.button.id = "searchBtn";
    sbox.SearchForm.appendChild(searchInput.button);
	searchTarget = document.createElement('div');
    searchTarget.id = "searchTarget";
    sbox.SearchForm.appendChild(searchTarget);
    searchTargetLabel = document.createElement('span');
    searchTargetLabel.textContent = "Search Engine:"; 
    searchTarget.appendChild(searchTargetLabel);
    var selectList = document.createElement("select");
    selectList.id = "searchSelectList";
    var option = document.createElement("option");
    option.value = searchTargetOption.DUCKDUCKGO;
    option.text = "DuckDuckGo";
    selectList.appendChild(option);
    var option2 = document.createElement("option");
    option2.value = searchTargetOption.GOOGLE;
    option2.text = "Google";
    selectList.appendChild(option2);
    var option3 = document.createElement("option");
    option3.value = searchTargetOption.BING;
    option3.text = "Bing";
    selectList.appendChild(option3);
    selectList.addEventListener('change', searchTargetSelect);

    statusDisplay = document.createElement('div');

    sbox.searchBoxDiv.appendChild(newContent);
    newContent.appendChild(sbox.titleElement);
    newContent.appendChild(newHR);
    newContent.appendChild(sbox.SearchForm);
	newContent.appendChild(searchInput);
    newContent.appendChild(selectList);
    return sbox.searchBoxDiv;
}

// Search state
var searchTargetOption = SearchTargetOption.DUCKDUCKGO;

function addSearchProvider(providerName, providerLink) {
    ;
}

function searchTargetSelect(selectedValue) {
    var e = document.getElementById("searchSelectList");
    alert(e.selectedValue); 
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