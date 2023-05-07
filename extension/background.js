// wait for messages of content.js
browser.runtime.onMessage.addListener((data, _sender, sendResponse) => {
    console.info("Command of received data: ", data.cmd)
    if (data.cmd == "check") {
        sendResponse(browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT })
            .then(tabs => browser.tabs.get(tabs[0].id))
            .then(tab => { console.log(String(tab.audible)); return tab.audible }))
    } else if (data.cmd == "update") {
        // before starting check if auto_streamsync is enabled -> if not use storage-value
        browser.storage.local.get('auto_streamsync').then(
            (item) => {
                // if undefined set initial to enabled
                if (item.auto_streamsync == undefined) {
                    browser.storage.local.set({"auto_streamsync": "enabled"})
                    item.auto_streamsync = "enabled"
                } 
                browser.storage.local.get('hostname')
                .then((host) => {
                        // if undefined set initial to crunchyroll
                        if (host.hostname == undefined) {
                            browser.storage.local.set({"hostname": "crunchyroll"})
                            host.hostname = "crunchyroll"
                        }
                        // only if auto_streamsync is disabled edit datas
                        if (item.auto_streamsync == 'disabled') { data.args.host = host.hostname; }
                        return data.args
                    })
                .then((datas) => {
                    console.info("Args: ", datas)
                    updateRPC(datas)
                })
            }
        )
    } else if (data.cmd == "clear") {
        clearRPC()
    }
});

// function for updating Presence
function updateRPC(datas) {
    fetch("http://127.0.0.1:8000/rpc_anime", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datas)
    }).then(
        (response) => {
            console.log("Responsed data: ", response)
        }
    )
}

// function for clearing Presence
function clearRPC() {
    datas = {
        "type": "clear"
    }

    fetch("http://127.0.0.1:8000/rpc_anime", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datas)
    }).then(
        (response) => {
            console.log("Responsed data: ", response)
        }
    )
}