// ==UserScript==
// @name         Midjourney Image and Data Downloader
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  Downloads image, prompt and srefs
// @author       https://github.com/dobrosketchkun
// @match        https://www.midjourney.com/jobs/*
// @grant        GM_download
// @license      The Uncertain Commons License https://gist.github.com/dobrosketchkun/d0c6aba085fb4a910926616a8b83c4c5
// ==/UserScript==

(function() {
    'use strict';

    // Helper function to save JSON data as a file
    function saveJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Main function to collect data and download
    function collectAndDownload() {
        const promptElement = document.querySelector('#lightboxPrompt p');
        const promptText = promptElement ? promptElement.innerText.trim() : "No prompt found";
        console.log("Prompt Text:", promptText);

        const allContainers = document.querySelectorAll('.flex-wrap.gap-1');
        let srefContainer = null;

        allContainers.forEach(container => {
            const srefButtons = container.querySelectorAll('button[title="Style reference"] span.line-clamp-2');
            if (srefButtons.length > 0) {
                srefContainer = container;
                console.log("Correct sref container found:", srefContainer);
            }
        });

        if (!srefContainer) {
            console.log("sref container not found.");
            return;
        }

        const srefElements = srefContainer.querySelectorAll('button[title="Style reference"] span.line-clamp-2');
        const srefs = Array.from(srefElements).map(el => el.innerText.trim());
        console.log("Final sref values:", srefs);

        const imageElement = document.querySelector('img[src*=".jpeg"]');
        const imageUrl = imageElement ? imageElement.src : null;

        if (!imageUrl) {
            console.log("Image URL not found.");
            return;
        }

        const srefsCombined = srefs.join('_');
        const urlParts = imageUrl.split('/');
        const hashPart = urlParts[urlParts.length - 2];
        const originalFilename = urlParts[urlParts.length - 1];

        const newFilename = `${srefsCombined}_${hashPart}_${originalFilename}`;
        console.log("New Filename:", newFilename);

        GM_download(imageUrl, newFilename);

        const jsonFilename = newFilename.replace(/\.jpeg$/, ''); // Remove .jpeg for JSON file
        const jsonData = {
            prompt: promptText,
            sref: srefs
        };
        saveJSON(jsonData, jsonFilename);
    }

    // Add cross-layout keyboard shortcut (Ctrl + ; or Ctrl + /)
    document.addEventListener('keydown', function(event) {
        const isCtrl = event.ctrlKey;
        const isSemiColonOrSlash = event.key === ';' || event.key === '/';
        const isRussianKeyEquivalent = event.key === 'ж' || event.key === '.';

        if (isCtrl && (isSemiColonOrSlash || isRussianKeyEquivalent)) {
            event.preventDefault();  // Prevent default behavior if needed
            collectAndDownload();
        }
    });

})();
