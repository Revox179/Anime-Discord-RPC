var last_stand = false
function communicateToBackground(host, anime, cur_ep=null, max_ep=null, season=null, episode=null) {
    // first send check-request to check if tab is audible
    browser.runtime.sendMessage({"cmd": "check"})
    .then((response) => {
        console.info("Playing_state: ", response)
        if (response==true && last_stand==false) {
            // if tab is now audible and before not -> start rpc
            browser.storage.local.get("anilist").then(
                url => {
                    if (url.anilist == undefined) {url.anilist = ""}
                    // start RPC with current data when audio start
                    if (host == "aniworld") {
                        browser.runtime.sendMessage({
                            "cmd": "update", 
                            "args": { 
                                "type": "update",
                                "host": "aniworld", 
                                "details": anime, 
                                "state": `Episode (${cur_ep} of ${max_ep}), Season ${season}`,
                                "anilist": url.anilist
                            }
                        })
                    }
                    if (host == "crunchyroll") {
                        browser.runtime.sendMessage({
                            "cmd": "update", 
                            "args": { 
                                "type": "update",
                                "host": "crunchyroll", 
                                "details": anime, 
                                "state": `Episode: ${episode}`,
                                "anilist": url.anilist
                            }
                        })
                    }
                }
            )
        } else if (response==false && last_stand==true) {
            // clear RPC when audio stopped
            browser.runtime.sendMessage({"cmd": "clear"})
        }
        last_stand = response;
    })
}

/* Observing-Function to wait for an element to appear */
function waitElement(selector, callback) {
    // New MutationObserver to observe changes in DOM
    var observer = new MutationObserver(mutations => {
        // For each mutation occurs in DOM, check if element is present
        mutations.forEach(mutation => {
            var element = mutation.target.querySelector(selector);
            if (element) {
                observer.disconnect();
                callback(element);
            }
        });
    });
    // start observing
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

window.onload = ()=>{
    if (document.location.host == "aniworld.to") {
        console.clear()
        streamBox = document.getElementsByClassName("inSiteWebStream")
        if (streamBox.length > 0) {
            infos = document.getElementsByClassName("hosterSiteTitle")[0]
            if (infos.getAttribute("data-season") != "0") { // if season is selected, not film
                // get current stream data
                var anime = document.getElementsByClassName("series-title")[0].children[0].innerText;
                    season = infos.getAttribute("data-season");
                    cur_ep = document.getElementsByClassName("active")[1].innerText;
                    max_ep = document.getElementsByClassName("active")[1].parentElement.parentElement.childElementCount -1;

                console.log("Anime: ", anime);
                console.log("Season: ", season);
                console.log("Cur Episode: ", cur_ep);
                console.log("Max Episode: ", max_ep);

                // save current stream data to local-storage for sync-function from popup.js
                browser.storage.local.set({
                    "cur_stream_data": {
                        "anime": anime,
                        "cur_ep": cur_ep,
                        "tot_ep": max_ep,
                        "season": season
                    }
                })

                // check every 5 seconds if audio is playing
                checkPlaying = setInterval(() => {
                    // first check if auto_rpc is enabled
                    browser.storage.local.get('auto_rpc').then(
                        (item) => {
                            // if undefined -> set initial to enabled
                            if (item.auto_rpc == undefined) {
                                browser.storage.local.set({"auto_rpc": "enabled"})
                                item.auto_rpc = 'enabled'
                            }
                            // if enabled start requesting with background.js
                            if (item.auto_rpc == 'enabled') {communicateToBackground("aniworld", anime, cur_ep, max_ep, season)}
                        }
                    )
                }, 5000);
            }
        }
    }

    if (document.location.host == "www.crunchyroll.com") {
        console.clear()
        waitElement('.erc-current-media-info', (infobox) => {
            var anime = document.querySelector("a.show-title-link").innerText
                episode = document.querySelector(".erc-current-media-info h1.title").innerText

            console.log("Anime: ", anime)
            console.log("Episode: ", episode)

            // save current stream data to local-storage for sync-function from popup.js
            browser.storage.local.set({
                "cur_stream_data": {
                    "anime": anime,
                    "cur_ep": "",
                    "tot_ep": "",
                    "season": ""
                }
            })

            // check every 5 seconds if audio is playing
            checkPlaying = setInterval(() => {
                // first check if auto_rpc is enabled
                browser.storage.local.get('auto_rpc').then(
                    (item) => {
                        // if undefined -> set initial to enabled
                        if (item.auto_rpc == undefined) {
                            browser.storage.local.set({"auto_rpc": "enabled"})
                            item.auto_rpc = 'enabled'
                        }
                        // if enabled start requesting with background.js
                        if (item.auto_rpc == 'enabled') {communicateToBackground("crunchyroll", anime, null, null, null, episode)}
                    }
                )
            }, 5000);
        })
    }
}

// if tab/window was closed stop RPC (only if auto_rpc is enabled)
window.onbeforeunload = () => {
    // first check if auto_rpc is enabled
    browser.storage.local.get('auto_rpc').then(
        (item) => {
            // if undefined -> set initial to enabled
            if (item.auto_rpc == undefined) {
                browser.storage.local.set({"auto_rpc": "enabled"})
                item.auto_rpc = 'enabled'
            }
            // if enabled start -> stop contingently running RPC
            if (item.auto_rpc == 'enabled') {browser.runtime.sendMessage({"cmd": "clear"})}
        }
    )
}