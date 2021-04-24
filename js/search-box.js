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
