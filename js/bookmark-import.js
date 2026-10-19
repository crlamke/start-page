/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 *
 * Bookmark import for the settings editor (config-editor.html).
 *
 * Web pages can't read the browser's bookmarks (only extensions can), so
 * this reads a bookmarks file instead:
 *   - the HTML file every browser exports (Chrome, Edge, Firefox, Safari:
 *     the "Netscape bookmark file" format),
 *   - Chrome's or Edge's own "Bookmarks" file from the browser profile, or
 *   - a Firefox JSON backup.
 * Each bookmark folder becomes a link group: top folders become boxes and
 * folders inside them become collapsible lists. Nothing in the file is run
 * or shown as HTML; names are used as plain text.
 */
"use strict";

// ====================================================================== reading files

// A folder in the tree: { name, container, links: [{name, url}], children: [folder] }.
// `container` marks the browser's own top folders (Bookmarks bar, Other
// bookmarks, ...): their loose links become a group, but folders inside
// them are not nested under them.
function bookmarkFolder(name, container) {
    return { name: String(name || "").trim(), container: !!container, links: [], children: [],
        checked: true };
}

function parseBookmarksFile(text) {
    const t = String(text).replace(/^﻿/, "").trim();
    if (t.startsWith("{")) {
        let data;
        try {
            data = JSON.parse(t);
        } catch (e) {
            throw new Error("this JSON file couldn't be read (" + e.message + ")");
        }
        if (data && data.roots && typeof data.roots === "object") {
            return parseChromeJson(data);
        }
        if (data && (Array.isArray(data.children) || data.type === "text/x-moz-place-container")) {
            return parseFirefoxJson(data);
        }
        throw new Error("this JSON file isn't a Chrome, Edge or Firefox bookmarks file");
    }
    if (/<dl[\s>]/i.test(t) && /<(a|h3)[\s>]/i.test(t)) {
        return parseNetscapeHtml(t);
    }
    throw new Error("this isn't a bookmarks file. Export your bookmarks to HTML from the browser "
            + "and open that file.");
}

// The HTML export: <DL><DT><H3>Folder</H3><DL>...</DL><DT><A HREF>Link</A>...
function parseNetscapeHtml(text) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    const h1 = doc.querySelector("h1");
    const root = bookmarkFolder(h1 ? h1.textContent : "Bookmarks", true);
    const topDl = doc.querySelector("dl");
    const used = new Set();
    const walk = (dl, folder) => {
        used.add(dl);
        Array.from(dl.children).forEach(node => {
            const tag = node.tagName;
            if (tag === "DT") {
                readDt(node, folder);
            } else if (tag === "DL" && !used.has(node)) {
                walk(node, folder);            // a stray list: its items belong here
            } else if (tag === "P") {
                Array.from(node.children).filter(c => c.tagName === "DT")
                    .forEach(dt => readDt(dt, folder));
            }
        });
    };
    const readDt = (dt, folder) => {
        const h3 = dt.querySelector(":scope > h3");
        const a = dt.querySelector(":scope > a");
        if (h3) {
            const sub = bookmarkFolder(h3.textContent,
                h3.hasAttribute("personal_toolbar_folder") || h3.hasAttribute("unfiled_bookmarks_folder"));
            let dl = dt.querySelector(":scope > dl");
            if (!dl && dt.nextElementSibling && dt.nextElementSibling.tagName === "DL") {
                dl = dt.nextElementSibling;    // some exports put the list after the <DT>
            }
            if (dl) {
                walk(dl, sub);
            }
            folder.children.push(sub);
        } else if (a) {
            folder.links.push({ name: a.textContent.trim(), url: (a.getAttribute("href") || "").trim() });
        }
    };
    if (topDl) {
        walk(topDl, root);
    }
    return root;
}

// Chrome / Edge profile file: { roots: { bookmark_bar: {children}, other: {...}, synced: {...} } }
function parseChromeJson(data) {
    const root = bookmarkFolder("Bookmarks", true);
    const read = (node, folder) => {
        (node.children || []).forEach(child => {
            if (child.type === "url") {
                folder.links.push({ name: String(child.name || "").trim(), url: String(child.url || "").trim() });
            } else if (Array.isArray(child.children)) {
                const sub = bookmarkFolder(child.name, false);
                read(child, sub);
                folder.children.push(sub);
            }
        });
    };
    const labels = { bookmark_bar: "Bookmarks bar", other: "Other bookmarks", synced: "Mobile bookmarks" };
    Object.keys(data.roots).forEach(key => {
        const node = data.roots[key];
        if (node && Array.isArray(node.children)) {
            const folder = bookmarkFolder(node.name || labels[key] || key, true);
            read(node, folder);
            root.children.push(folder);
        }
    });
    return root;
}

// Firefox backup (Bookmarks > Manage > Backup): nested { title, children, uri }.
function parseFirefoxJson(data) {
    const rootNames = { toolbarFolder: "Bookmarks Toolbar", bookmarksMenuFolder: "Bookmarks Menu",
        unfiledBookmarksFolder: "Other Bookmarks", mobileFolder: "Mobile Bookmarks" };
    const read = (node, folder) => {
        (node.children || []).forEach(child => {
            if (child.uri) {
                folder.links.push({ name: String(child.title || "").trim(), url: String(child.uri).trim() });
            } else if (Array.isArray(child.children)) {
                const isRoot = !!rootNames[child.root];
                const sub = bookmarkFolder(isRoot ? rootNames[child.root] : (child.title || "Folder"), isRoot);
                read(child, sub);
                folder.children.push(sub);
            }
        });
    };
    const root = bookmarkFolder("Bookmarks", true);
    read(data, root);
    return root;
}

// ====================================================================== planning the import

const IMPORTABLE_SCHEMES = ["http:", "https:", "ftp:", "file:", "mailto:"];

function importableUrl(url) {
    try {
        return IMPORTABLE_SCHEMES.includes(new URL(url).protocol);
    } catch (e) {
        return false;
    }
}

// Same page, ignoring a trailing slash and the case of the host.
function urlKey(url) {
    try {
        const u = new URL(url);
        return (u.protocol + "//" + u.host.toLowerCase() + u.pathname.replace(/\/+$/, "") + u.search + u.hash);
    } catch (e) {
        return String(url).trim().replace(/\/+$/, "");
    }
}

function linkTitle(link) {
    if (link.name) {
        return link.name;
    }
    try {
        return new URL(link.url).hostname || link.url;
    } catch (e) {
        return link.url;
    }
}

// Work out what importing `tree` would do, without changing anything.
//   existing   the current link groups (cfg.linkGroups)
//   options    { layout: "boxes" | "onebox", oneBoxName, sameName: "merge" | "rename" }
// Returns { newGroups, additions: Map(existing group -> links), stats }.
function planBookmarkImport(tree, existing, options) {
    const stats = { boxes: 0, groups: 0, links: 0, merged: 0, duplicates: 0, notWeb: 0 };
    const byName = new Map(existing.map(g => [g.name, g]));
    const usedNames = new Set(existing.map(g => g.name));
    const newGroups = [];
    const additions = new Map();       // existing group -> links to add
    const groupUrls = new Map();       // group (new or existing) -> Set of url keys

    const urlsOf = (group) => {
        if (!groupUrls.has(group)) {
            groupUrls.set(group, new Set((group.links || []).map(l => urlKey(l.link))));
        }
        return groupUrls.get(group);
    };

    // Links of a folder that would be imported (web links, no repeats inside the folder).
    const usableLinks = (folder) => {
        const seen = new Set();
        const out = [];
        folder.links.forEach(l => {
            if (!importableUrl(l.url)) {
                stats.notWeb++;
                return;
            }
            const k = urlKey(l.url);
            if (seen.has(k)) {
                stats.duplicates++;
                return;
            }
            seen.add(k);
            out.push({ name: linkTitle(l), link: l.url });
        });
        return out;
    };

    // Does this folder (or a ticked folder inside it) have links to import?
    const hasContent = (folder) =>
        (folder.checked && folder.links.some(l => importableUrl(l.url)))
        || folder.children.some(hasContent);

    const uniqueName = (wanted, parentName) => {
        let base = String(wanted || "").trim() || "Untitled folder";
        if (base === "None") {
            base = "None (folder)";       // "None" means "no parent" in the config
        }
        if (!usedNames.has(base)) {
            return base;
        }
        if (parentName && parentName !== "None" && !usedNames.has(base + " (" + parentName + ")")) {
            return base + " (" + parentName + ")";
        }
        for (let n = 2; ; n++) {
            if (!usedNames.has(base + " (" + n + ")")) {
                return base + " (" + n + ")";
            }
        }
    };

    // Returns the group (new or existing) that links / subfolders go into.
    const groupFor = (wantedName, parentName, mayMerge) => {
        let name = String(wantedName || "").trim() || "Untitled folder";
        if (name === "None") {
            name = "None (folder)";       // as named on an earlier import
        }
        if (mayMerge && options.sameName === "merge" && byName.has(name)) {
            const target = byName.get(name);
            if (!additions.has(target)) {
                additions.set(target, []);
                stats.merged++;
            }
            return target;
        }
        const g = { name: uniqueName(name, parentName), parent: parentName || "None", order: 0,
            color: "", visibility: "Shown", links: [] };
        usedNames.add(g.name);
        newGroups.push(g);
        stats.groups++;
        if (g.parent === "None") {
            stats.boxes++;
        }
        return g;
    };

    const addLinks = (group, links) => {
        const have = urlsOf(group);
        links.forEach(l => {
            const k = urlKey(l.link);
            if (have.has(k)) {
                stats.duplicates++;
                return;
            }
            have.add(k);
            stats.links++;
            if (additions.has(group)) {
                additions.get(group).push(l);
            } else {
                group.links.push(l);
            }
        });
    };

    let topParent = "None";
    if (options.layout === "onebox" && hasContent(tree)) {
        topParent = groupFor(options.oneBoxName || "Bookmarks", "None", true).name;
    }

    const visit = (folder, parentName) => {
        if (!hasContent(folder)) {
            return;
        }
        let childParent = parentName;
        // Loose links at the very top of the file come after the browser's
        // folders (that's where browsers list them); elsewhere they come first.
        const linksLast = folder === tree;
        let looseLinks = null;
        if (folder.checked) {
            const links = usableLinks(folder);
            if (folder.container) {
                // The browser's own folder: its loose links get a group, but the
                // folders inside it are not nested under it.
                if (links.length) {
                    looseLinks = () => addLinks(groupFor(folder.name || "Bookmarks", parentName, true), links);
                }
            } else {
                const group = groupFor(folder.name, parentName, true);
                addLinks(group, links);
                childParent = group.name;
            }
        }
        if (looseLinks && !linksLast) {
            looseLinks();
        }
        folder.children.forEach(child => visit(child, childParent));
        if (looseLinks && linksLast) {
            looseLinks();
        }
    };
    visit(tree, topParent);

    // Groups that ended up with nothing (all duplicates) and nothing inside them
    // are dropped; repeat, since dropping one can leave its parent empty.
    let kept = newGroups;
    for (;;) {
        const parents = new Set(kept.map(g => g.parent));
        const next = kept.filter(g => g.links.length || parents.has(g.name));
        if (next.length === kept.length) {
            break;
        }
        kept = next;
    }
    stats.groups = kept.length;
    stats.boxes = kept.filter(g => g.parent === "None").length;
    for (const [g, links] of additions) {
        if (!links.length) {
            additions.delete(g);
            stats.merged--;
        }
    }
    return { newGroups: kept, additions: additions, stats: stats };
}

// ====================================================================== the dialog

let bookmarkTree = null;
let bookmarkFileName = "";
let undoSnapshot = null;

function openBookmarkImport() {
    const dlg = $("bookmarkDialog");
    bookmarkTree = null;
    bookmarkFileName = "";
    $("bmFileName").textContent = "No file chosen";
    $("bmError").textContent = "";
    $("bmChoose").hidden = false;
    $("bmTreeArea").hidden = true;
    $("bmImport").disabled = true;
    $("bmSummary").textContent = "";
    if (dlg.showModal) {
        dlg.showModal();
    } else {
        dlg.setAttribute("open", "");
    }
}

function closeBookmarkImport() {
    const dlg = $("bookmarkDialog");
    if (dlg.close) {
        dlg.close();
    } else {
        dlg.removeAttribute("open");
    }
}

async function readBookmarkFile(file) {
    $("bmError").textContent = "";
    try {
        if (file.size > 50 * 1024 * 1024) {
            throw new Error("the file is over 50 MB");
        }
        bookmarkTree = parseBookmarksFile(await file.text());
        bookmarkFileName = file.name;
        $("bmFileName").textContent = file.name;
        const count = countBookmarks(bookmarkTree);
        if (count.links === 0) {
            throw new Error("no bookmarks found in " + file.name);
        }
        renderBookmarkTree();
        $("bmTreeArea").hidden = false;
        updateBookmarkSummary();
    } catch (e) {
        bookmarkTree = null;
        $("bmTreeArea").hidden = true;
        $("bmImport").disabled = true;
        $("bmError").textContent = "Couldn't read " + file.name + ": " + e.message;
    }
}

function countBookmarks(folder) {
    return folder.children.map(countBookmarks).reduce((a, b) =>
        ({ links: a.links + b.links, folders: a.folders + b.folders }),
    { links: folder.links.length, folders: folder.children.length });
}

function renderBookmarkTree() {
    const setAll = (folder, on) => {
        folder.checked = on;
        folder.children.forEach(c => setAll(c, on));
    };
    const build = (folder, depth) => {
        const total = countBookmarks(folder).links;
        const li = el("li", {});
        const box = el("input", { type: "checkbox" });
        box.checked = folder.checked;
        box.addEventListener("change", () => {
            setAll(folder, box.checked);   // ticking or unticking a folder does the same inside it
            li.querySelectorAll("input[type=checkbox]").forEach(c => { c.checked = box.checked; });
            updateBookmarkSummary();
        });
        const label = el("label", { class: "bmFolder" }, box, " ",
            el("span", { class: "bmName" }, folder.name || "Untitled folder"),
            el("span", { class: "bmCount" }, " · " + folder.links.length + " here"
                + (total !== folder.links.length ? ", " + total + " in all" : "")),
            folder.container ? el("span", { class: "bmTag" }, " browser folder") : "");
        li.appendChild(label);
        if (folder.children.length) {
            li.appendChild(el("ul", {}, folder.children.map(c => build(c, depth + 1))));
        }
        return li;
    };
    const top = bookmarkTree.links.length ? [bookmarkTree] : bookmarkTree.children;
    if (!bookmarkTree.links.length) {
        bookmarkTree.checked = true;   // its folders are listed directly
    }
    $("bmTree").replaceChildren(...top.map(f => build(f, 0)));
}

function bookmarkOptions() {
    return {
        layout: document.querySelector("input[name=bmLayout]:checked").value,
        oneBoxName: $("bmOneBoxName").value.trim() || "Bookmarks",
        sameName: document.querySelector("input[name=bmSameName]:checked").value
    };
}

function updateBookmarkSummary() {
    if (!bookmarkTree) {
        return;
    }
    $("bmOneBoxName").disabled = bookmarkOptions().layout !== "onebox";
    const plan = planBookmarkImport(bookmarkTree, cfg.linkGroups, bookmarkOptions());
    const s = plan.stats;
    const parts = [];
    if (s.links === 0) {
        parts.push("Nothing to import with these choices.");
    } else {
        parts.push("Adds " + s.links + " link" + (s.links === 1 ? "" : "s") + " in "
            + s.groups + " new group" + (s.groups === 1 ? "" : "s")
            + " (" + s.boxes + " new box" + (s.boxes === 1 ? "" : "es") + ")"
            + (s.merged ? ", plus links added to " + s.merged + " existing group"
                + (s.merged === 1 ? "" : "s") : "") + ".");
    }
    const skipped = [];
    if (s.duplicates) {
        skipped.push(s.duplicates + " already there or repeated");
    }
    if (s.notWeb) {
        skipped.push(s.notWeb + (s.notWeb === 1 ? " bookmarklet or other non-web link"
            : " bookmarklets or other non-web links"));
    }
    if (skipped.length) {
        parts.push("Skips " + skipped.join(" and ") + ".");
    }
    if (s.boxes > 12) {
        parts.push("That's a lot of boxes; \"one box\" keeps them together.");
    }
    $("bmSummary").textContent = parts.join(" ");
    $("bmImport").disabled = s.links === 0;
}

function doBookmarkImport() {
    const plan = planBookmarkImport(bookmarkTree, cfg.linkGroups, bookmarkOptions());
    if (plan.stats.links === 0) {
        return;
    }
    undoSnapshot = { cfg: JSON.parse(JSON.stringify(cfg)), boxOrder: layout.map(boxKey),
        dirty: dirty };
    for (const [group, links] of plan.additions) {
        group.links.push(...links);
    }
    cfg.linkGroups.push(...plan.newGroups);
    closeBookmarkImport();
    changed(true);
    renderAll();
    const s = plan.stats;
    const bar = $("importBar");
    bar.replaceChildren(
        el("span", {}, "Imported " + s.links + " link" + (s.links === 1 ? "" : "s") + " from "
            + bookmarkFileName + ": " + s.groups + " new group" + (s.groups === 1 ? "" : "s")
            + (s.merged ? ", and links added to " + s.merged + " existing group"
                + (s.merged === 1 ? "" : "s") : "") + ". Check them, then Save. "),
        el("button", { type: "button", onclick: undoBookmarkImport }, "Undo import"));
    bar.hidden = false;
    showStatus("Imported bookmarks; not saved yet", "dirty");
    bar.scrollIntoView({ block: "center" });
}

function undoBookmarkImport() {
    if (!undoSnapshot) {
        return;
    }
    cfg = undoSnapshot.cfg;
    buildLayout(undoSnapshot.boxOrder);
    dirty = undoSnapshot.dirty;
    undoSnapshot = null;
    $("importBar").hidden = true;
    renderAll();
    showStatus(dirty ? "Import undone (earlier changes still unsaved)" : "Import undone",
        dirty ? "dirty" : "");
}

document.addEventListener("DOMContentLoaded", () => {
    $("importBookmarksBtn").addEventListener("click", openBookmarkImport);
    $("bmCancel").addEventListener("click", closeBookmarkImport);
    $("bmImport").addEventListener("click", doBookmarkImport);
    $("bmFile").addEventListener("change", () => {
        const file = $("bmFile").files[0];
        if (file) {
            readBookmarkFile(file);
        }
        $("bmFile").value = "";
    });
    $("bmPick").addEventListener("click", () => $("bmFile").click());
    $("bmAll").addEventListener("click", () => {
        const setAll = f => {
            f.checked = true;
            f.children.forEach(setAll);
        };
        setAll(bookmarkTree);
        renderBookmarkTree();
        updateBookmarkSummary();
    });
    $("bmNone").addEventListener("click", () => {
        const setNone = f => {
            f.checked = false;
            f.children.forEach(setNone);
        };
        setNone(bookmarkTree);
        renderBookmarkTree();
        updateBookmarkSummary();
    });
    document.querySelectorAll("input[name=bmLayout], input[name=bmSameName]").forEach(r =>
        r.addEventListener("change", updateBookmarkSummary));
    $("bmOneBoxName").addEventListener("input", updateBookmarkSummary);
});
