/* 
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */

// Add a link box to the linkbox-container
function createLinkBox(linkBoxTitle, itemNumber, bgColor) {

    var newLinkbox = document.createElement('div');
    newLinkbox.className = "linkBox";
    newLinkbox.id = "linkBox" + itemNumber;
    newLinkbox.style.backgroundColor = bgColor;
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
    newLinkbox.draggable = true;
    return newLinkbox;
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

