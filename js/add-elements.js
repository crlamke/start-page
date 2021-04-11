/* 
 * The MIT License
 *
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>.
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

// Add a link box to the linkbox-container
function addLinkBox(addLocation, linkBoxTitle, itemNumber) {

    var newLinkbox = document.createElement('div');
    newLinkbox.className = "linkBox";
    newLinkbox.id = "linkBox" + itemNumber;
    var newContent = document.createElement('div');
    newContent.className = "content";
    var newTitle = document.createElement('h3');
    newTitle.id = "linkBoxTitle" + itemNumber;
    newTitle.textContent = linkBoxTitle;
    newHR = document.createElement('hr');
    var newLinkboxContent = document.createElement('div');
    newLinkboxContent.id = "linkBoxContent" + itemNumber;
    newUList = document.createElement('ul');
    newUList.className = "linkBoxList";
    newUList.id = "linkBox" + itemNumber + "List" + itemNumber;
    newLinkbox.appendChild(newContent);
    newContent.appendChild(newTitle);
    newContent.appendChild(newHR);
    newContent.appendChild(newUList);
    addLocation.appendChild(newLinkbox);
}


/* The code above is building this structure.
 
            <div class="linkBox" id="linkBox0">
                <div class="content">
                    <h3 id="linkBoxTitle0"></h3>
                    <hr>
                    <div id="linkBoxContent0">
                        <ul id="linkBox0List0" class="linkBoxList">
                        </ul>
                    </div>
                </div>
            </div>
*/