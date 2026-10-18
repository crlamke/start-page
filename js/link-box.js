/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

class Link {
    constructor(displayName, linkHref, groupName) {
        this.displayName = displayName;
        this.linkHref = linkHref;
        this.groupName = groupName;
    }
}

class LinkGroup {
    constructor(name, parent, color, position) {
        this.name = name;
        this.parent = parent;      // "None" for a top-level group (its own box)
        this.color = color;        // "" = theme default
        this.position = position;  // sort order of top-level boxes
        this.children = [];
        this.links = [];
    }
}

const linkGroups = []; // All LinkGroup objects, in config order

// Trim a config value that may be a string, a number or missing.
function cleanText(value) {
    return (value === undefined || value === null) ? "" : String(value).trim();
}

function addLinkGroup(groupNameIn, parentNameIn, groupColorIn, groupPositionIn) {
    const groupName = cleanText(groupNameIn);
    if (groupName === "") {
        console.error("Link group with an empty name skipped");
        return;
    }
    // Optional fields get defaults instead of dropping the group.
    const parentName = cleanText(parentNameIn) || "None";
    const groupColor = cleanText(groupColorIn);
    const position = Number(cleanText(groupPositionIn));
    const groupPosition = Number.isFinite(position) && cleanText(groupPositionIn) !== ""
        ? position : linkGroups.length + 1;

    const newGroup = new LinkGroup(groupName, parentName, groupColor, groupPosition);
    linkGroups.push(newGroup);

    if (parentName !== "None") {
        const parent = linkGroups.find(g => g.name === parentName && g !== newGroup);
        if (parent) {
            parent.children.push(newGroup);
        } else {
            console.warn("Parent group '" + parentName + "' not found for group '"
                    + groupName + "' (define the parent first)");
        }
    }
}

function addLinkItem(linkTextIn, linkRefIn, linkGroupIn) {
    const linkText = cleanText(linkTextIn);
    const linkRef = cleanText(linkRefIn);
    const groupName = cleanText(linkGroupIn);
    const group = linkGroups.find(g => g.name === groupName);
    if (group) {
        group.links.push(new Link(linkText, linkRef, groupName));
    } else {
        console.warn("No group '" + groupName + "' found for link '" + linkText + "'");
    }
}

// Create one box per top-level group, in "order" order, and add them to
// the container. Subgroups become collapsible lists inside their parent.
function addLinkBoxes(container) {
    const topLevel = linkGroups
            .filter(g => g.parent === "None")
            .sort((a, b) => a.position - b.position);

    topLevel.forEach((group, i) => {
        const box = createBox("linkBox", "linkBox" + (i + 1), group.name, group.color);
        const list = document.createElement("ul");
        list.className = "linkBoxList";
        box.contentDiv.appendChild(list);
        addLinkGroupToList(group, list);
        setBoxKey(box.boxDiv, "link", group.name);
        container.appendChild(box.boxDiv);
    });
}

function addLinkGroupToList(linkGroup, list) {
    // Subgroups first, as collapsible entries.
    linkGroup.children.forEach(child => {
        const li = document.createElement("li");
        const caret = document.createElement("span");
        caret.className = "caret";
        caret.textContent = child.name;
        caret.tabIndex = 0;
        caret.setAttribute("role", "button");
        caret.setAttribute("aria-expanded", "false");
        const nested = document.createElement("ul");
        nested.className = "nested";
        li.appendChild(caret);
        li.appendChild(nested);
        list.appendChild(li);
        addLinkGroupToList(child, nested);

        const toggle = () => {
            nested.classList.toggle("active");
            caret.classList.toggle("caret-down");
            caret.setAttribute("aria-expanded",
                    nested.classList.contains("active") ? "true" : "false");
        };
        caret.addEventListener("click", toggle);
        caret.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
            }
        });
    });

    linkGroup.links.forEach(link => addLinkToList(link.displayName, link.linkHref, list));
}

function addLinkToList(linkText, linkRef, list) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = linkRef;
    a.textContent = linkText;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    li.appendChild(a);
    list.appendChild(li);
}

// Debugging aid: print the link tree to the browser console.
function printLinksToConsole() {
    const printGroup = (group, indent) => {
        console.log(indent + "Group: " + group.name);
        group.children.forEach(child => printGroup(child, indent + "  "));
        group.links.forEach(link => console.log(indent + "  " + link.displayName
                + " - " + link.linkHref));
    };
    linkGroups.filter(g => g.parent === "None").forEach(g => printGroup(g, ""));
}
