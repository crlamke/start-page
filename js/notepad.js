/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

// Notepad box: a text area with New, Open, Save and Save as for text files.
//
// - Open/Save use the File System Access API where the browser has it
//   (Chrome, Edge, Opera): Save writes straight back to the opened file.
//   Elsewhere Open uses the normal file chooser and Save downloads the file.
// - What you type is also kept as a draft in this browser (localStorage),
//   so reloading the page or closing the tab doesn't lose it.
// - Windows (CRLF) line endings in an opened file are kept when saving.
//
// Settings (userConfig.notepad, all optional):
//   title            box title (default "Notepad")
//   color            box color
//   visibility       "Hidden" leaves the notepad off the page
//   defaultFileName  name suggested when saving new text (default "notes.txt")

const NOTEPAD_DRAFT_KEY = "startPage.notepad.draft";
const NOTEPAD_MAX_BYTES = 5 * 1024 * 1024;
const NOTEPAD_FILE_TYPES = [{
    description: "Text files",
    accept: { "text/plain": [".txt", ".md", ".text", ".log", ".csv", ".json", ".sql"] }
}];

function notepadSettings() {
    const s = configValue("notepad", {});
    return (s && typeof s === "object") ? s : {};
}

function notepadIsShown() {
    return String(notepadSettings().visibility || "").toLowerCase() !== "hidden";
}

// Draft storage; quietly does nothing where the browser blocks storage.
function readNotepadDraft() {
    try {
        const raw = localStorage.getItem(NOTEPAD_DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function writeNotepadDraft(draft) {
    try {
        localStorage.setItem(NOTEPAD_DRAFT_KEY, JSON.stringify(draft));
        return true;
    } catch (e) {
        return false;
    }
}

function createNotepadBox() {
    const settings = notepadSettings();
    const defaultName = String(settings.defaultFileName || "notes.txt").trim() || "notes.txt";
    const box = createBox("notepadBox", "notepadBox", String(settings.title || "Notepad"),
            settings.color || "");

    const state = {
        fileName: defaultName,
        handle: null,          // FileSystemFileHandle when we may write back
        savedText: "",         // text as last opened or saved
        crlf: false,           // the file used Windows line endings
        hasFile: false         // text came from / went to a file
    };

    // ---------------------------------------------------------------- elements
    const button = (label, title) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.title = title;
        return b;
    };
    const newBtn = button("New", "Start a new note");
    const openBtn = button("Open…", "Open a text file");
    const saveBtn = button("Save", "Save (Ctrl+S)");
    const saveAsBtn = button("Save as…", "Save to a new file");
    const toolbar = document.createElement("div");
    toolbar.className = "notepadToolbar";
    toolbar.append(newBtn, openBtn, saveBtn, saveAsBtn);

    const textarea = document.createElement("textarea");
    textarea.className = "notepadText";
    textarea.spellcheck = true;
    textarea.setAttribute("aria-label", "Notepad text");
    textarea.placeholder = "Type a note…";

    const status = document.createElement("div");
    status.className = "notepadStatus";
    status.setAttribute("aria-live", "polite");
    const fileLabel = document.createElement("span");
    fileLabel.className = "notepadFile";
    const info = document.createElement("span");
    info.className = "notepadInfo";
    status.append(fileLabel, info);

    const fileInput = document.createElement("input");   // fallback for Open
    fileInput.type = "file";
    fileInput.accept = NOTEPAD_FILE_TYPES[0].accept["text/plain"].join(",") + ",text/*";
    fileInput.hidden = true;

    box.contentDiv.append(toolbar, textarea, status, fileInput);

    // ---------------------------------------------------------------- status
    let messageTimer = null;
    const isDirty = () => textarea.value !== state.savedText;
    const paintStatus = () => {
        fileLabel.textContent = (isDirty() ? "● " : "") + state.fileName;
        fileLabel.title = isDirty()
            ? "Unsaved changes (a draft is kept in this browser)"
            : (state.hasFile ? "Saved" : "Not saved to a file yet");
        if (!messageTimer) {
            const words = (textarea.value.match(/\S+/g) || []).length;
            info.textContent = words + (words === 1 ? " word" : " words");
        }
    };
    const flash = (message) => {
        clearTimeout(messageTimer);
        info.textContent = message;
        messageTimer = setTimeout(() => {
            messageTimer = null;
            paintStatus();
        }, 4000);
    };

    // ---------------------------------------------------------------- draft
    let draftTimer = null;
    const saveDraft = () => {
        writeNotepadDraft({ text: textarea.value, savedText: state.savedText,
            fileName: state.fileName, crlf: state.crlf, hasFile: state.hasFile });
    };
    const draft = readNotepadDraft();
    if (draft && typeof draft.text === "string") {
        textarea.value = draft.text;
        state.savedText = typeof draft.savedText === "string" ? draft.savedText : "";
        state.fileName = draft.fileName || defaultName;
        state.crlf = !!draft.crlf;
        state.hasFile = !!draft.hasFile;
        // The file handle can't be kept across reloads, so the next Save
        // asks where to write (suggesting the same name).
    }
    textarea.addEventListener("input", () => {
        paintStatus();
        clearTimeout(draftTimer);
        draftTimer = setTimeout(saveDraft, 400);
    });
    window.addEventListener("pagehide", saveDraft);

    // ---------------------------------------------------------------- actions
    const useText = (text, name, handle) => {
        state.crlf = /\r\n/.test(text);
        const clean = text.replace(/\r\n?/g, "\n");
        textarea.value = clean;
        state.savedText = clean;
        state.fileName = name;
        state.handle = handle || null;
        state.hasFile = true;
        saveDraft();
        paintStatus();
        flash("Opened");
    };

    const readFile = async (file, handle) => {
        if (file.size > NOTEPAD_MAX_BYTES) {
            flash("Too big for the notepad (over 5 MB)");
            return;
        }
        const text = await file.text();
        if (text.includes("\u0000")) {
            flash("That doesn't look like a text file");
            return;
        }
        useText(text, file.name, handle);
    };

    // Ask before throwing away unsaved text: the first click arms the button.
    const confirmFirst = (btn, action) => {
        const label = btn.textContent;
        let timer = null;
        btn.addEventListener("click", () => {
            if (!isDirty() || btn.classList.contains("armed")) {
                clearTimeout(timer);
                btn.classList.remove("armed");
                btn.textContent = label;
                action();
                return;
            }
            btn.classList.add("armed");
            btn.textContent = "Discard?";
            btn.title = "Click again to discard unsaved changes";
            timer = setTimeout(() => {
                btn.classList.remove("armed");
                btn.textContent = label;
            }, 3000);
        });
    };

    confirmFirst(newBtn, () => {
        textarea.value = "";
        state.savedText = "";
        state.fileName = defaultName;
        state.handle = null;
        state.crlf = false;
        state.hasFile = false;
        saveDraft();
        paintStatus();
        textarea.focus();
    });

    confirmFirst(openBtn, async () => {
        if (window.showOpenFilePicker) {
            let handle;
            try {
                [handle] = await window.showOpenFilePicker({ types: NOTEPAD_FILE_TYPES });
            } catch (e) {
                return;   // cancelled
            }
            await readFile(await handle.getFile(), handle);
        } else {
            fileInput.value = "";
            fileInput.click();
        }
    });
    fileInput.addEventListener("change", () => {
        if (fileInput.files[0]) {
            readFile(fileInput.files[0], null);
        }
    });

    const save = async (asNew) => {
        const text = state.crlf ? textarea.value.replace(/\n/g, "\r\n") : textarea.value;
        try {
            if (window.showSaveFilePicker && (asNew || !state.handle)) {
                state.handle = await window.showSaveFilePicker({
                    suggestedName: state.fileName, types: NOTEPAD_FILE_TYPES });
            }
            if (state.handle) {
                const writable = await state.handle.createWritable();
                await writable.write(text);
                await writable.close();
                state.fileName = state.handle.name;
                finishSave("Saved");
                return;
            }
        } catch (e) {
            if (e.name === "AbortError") {
                return;   // save dialog cancelled
            }
            console.error("Notepad save failed: " + e.message);
            state.handle = null;
        }
        // No File System Access API (or it failed): download the file.
        const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = state.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        finishSave("Downloaded");
    };
    const finishSave = (message) => {
        state.savedText = textarea.value;
        state.hasFile = true;
        saveDraft();
        paintStatus();
        flash(message);
    };

    saveBtn.addEventListener("click", () => save(false));
    saveAsBtn.addEventListener("click", () => save(true));
    textarea.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            save(e.shiftKey);
        }
    });

    paintStatus();
    return box.boxDiv;
}

function addNotepadBox(container) {
    if (!notepadIsShown()) {
        return;
    }
    const boxDiv = createNotepadBox();
    setBoxKey(boxDiv, "notepad", "");
    container.appendChild(boxDiv);
}
