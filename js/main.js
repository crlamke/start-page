/*
 * The MIT License - See LICENSE file in project root for details
 * Copyright 2021 Chris Lamke <https://chris.lamke.org>
 */
"use strict";

document.addEventListener("DOMContentLoaded", initializePage);

function initializePage() {
    const container = document.createElement("main");
    container.className = "box-container";
    container.id = "box-container";
    document.body.appendChild(container);

    if (!haveUserConfig()) {
        showMissingConfigNotice(container);
        return;
    }
    loadUserConfig();
    applyUserConfig(container);
}
