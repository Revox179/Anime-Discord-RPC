console.log("Hello from the popup.js");

function update_anime_state(state) {
    if (state=="") {document.getElementById("anime_value").innerText = ""}
    else {document.getElementById("anime_value").innerText = "Watching " + state}
    return
}
function update_season_inp(state) {
    if (state == "") {document.getElementById("season_value").innerText = "";return}
    if (document.getElementById("progress_value").innerText) {
        document.getElementById("season_value").innerText = `, Season ${state}`
    }
    else {document.getElementById("season_value").innerText = `Season ${state}`}
    return;
}
function update_episode_inp() {
    cur = document.getElementById("cur_ep_inp").value;
    total = document.getElementById("total_ep_inp").value;
    // if no current episode is set -> dont show episode progress
    if (cur == "") {
        document.getElementById("progress_value").innerText = "";
    }
    // if also total is given
    else if (total) {
        document.getElementById("progress_value").innerText = `Episode (${cur} of ${total})`
    }
    // if only cur given
    else {
        document.getElementById("progress_value").innerText = `Episode ${cur}`
    }
    update_season_inp(document.getElementById("cur_season_inp").value)
    return;
}

// apply typing eventhandlers to inputs of main-page
document.getElementById("anime_input").addEventListener("keyup", (e)=>{
    browser.storage.local.set({"anime": e.target.value})
    update_anime_state(e.target.value);
})
document.getElementById("cur_season_inp").addEventListener("keyup", (e)=>{
    browser.storage.local.set({"season": e.target.value})
    update_season_inp(e.target.value);
})
document.getElementById("cur_ep_inp").addEventListener("keyup", (e)=>{
    browser.storage.local.set({"curepisode": e.target.value})
    update_episode_inp();
})
document.getElementById("total_ep_inp").addEventListener("keyup", (e)=>{
    browser.storage.local.set({"totepisode": e.target.value})
    update_episode_inp();
})
document.getElementById("anilist_link").addEventListener("keyup", (e)=>{
    browser.storage.local.set({"anilist": e.target.value})
})

function update_from_storage(value, item) {
    if (item != undefined) {
        document.getElementById(value).value = item;
    }
    update_anime_state(document.getElementById("anime_input").value);
    update_episode_inp();
    update_season_inp(document.getElementById("cur_season_inp").value);
}

function show_message(msg, color) {
    // fade in message
    document.getElementById("message").innerText = msg;
    document.getElementById("message").style.backgroundColor = color;
    document.getElementById("message").style.opacity = "100%"
    // hide after 2 seconds
    setTimeout( () => {
        document.getElementById("message").style.opacity = "0%"
    }, 2000)
}

function storage_err(err) {
    // show error-message to popup.js
    show_message("storage error!", "red")
    // log error to console
    console.error(`[popup.js] Storage-Error: ${err}`)
}

// update page with values from storage
function update_session() {
    browser.storage.local.get('hostname').then((item)=>{change_host(document.getElementById(item.hostname), storage_update=true)}, storage_err)
    browser.storage.local.get('anime').then((item)=>{update_from_storage("anime_input", item.anime)}, storage_err)
    browser.storage.local.get('curepisode').then((item)=>{update_from_storage("cur_ep_inp", item.curepisode)}, storage_err)
    browser.storage.local.get('totepisode').then((item)=>{update_from_storage("total_ep_inp", item.totepisode)}, storage_err)
    browser.storage.local.get('season').then((item)=>{update_from_storage("cur_season_inp", item.season)}, storage_err)
    browser.storage.local.get('anilist').then((item)=>{update_from_storage("anilist_link", item.anilist)}, storage_err)
    browser.storage.local.get('auto_rpc').then((item)=>{update_checkbox("auto_rpc", item.auto_rpc)}, storage_err)
    browser.storage.local.get('auto_streamsync').then((item)=>{update_checkbox("auto_streamsync", item.auto_streamsync)}, storage_err)
    browser.storage.local.get('dc_name').then((item)=>{update_dc_name(item.dc_name)}, storage_err)
    browser.storage.local.get('dc_tag').then((item)=>{update_dc_tag(item.dc_tag)}, storage_err)
    checkServerStatus()
}

// update rpc with values from input (maybe last session values)
window.onload = update_session

// Button event handling

document.getElementById("stop_btn").addEventListener("click", ()=>{
    datas = { 
        "type": "clear"
    }

    fetch("http://127.0.0.1:8000/rpc_anime", {
        method: "POST", 
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( datas )
    })
    .then( response => {
        if (response.ok == true) { return response.json() }
        else { return response.statusText }
    })
    .then( json => {
            console.log("Responsed data: ", json)
            if (typeof json == 'string' || json instanceof String) {
                // Error from Request (like Internal Server Error)
                show_message(json, "red")
                return
            } if (json["processed"] == "true") {
                // if Process is true -> request was successfull
                show_message("Stopped!", "#5865f2")
            } else { 
                // Process is false (not true)
                show_message("invalid request!", "red") 
            }
    })
    .catch( err => {
        console.error("Error when fetching to Server: ", err)
        show_message("requesting server failed!", "red")
    })
})


// Function for sync data from current stream with data from local-storage
document.getElementById("sync_btn").addEventListener("click", ()=>{
    browser.storage.local.get('cur_stream_data').then(
        (item) => {
            // if item is empty
            if (Object.keys(item).length === 0) {
                show_message("no data available!", "red")
            }
            else {
                stream_data = item.cur_stream_data
                browser.storage.local.set({'anime': stream_data.anime})
                browser.storage.local.set({'curepisode': stream_data.cur_ep})
                browser.storage.local.set({'totepisode': stream_data.tot_ep})
                browser.storage.local.set({'season': stream_data.season})
                update_session()
                show_message("Synced!", "#5865f2")
            }
        },
        storage_err
    )
}) 

document.getElementById("update_btn").addEventListener("click", ()=>{
    console.log("update")
    datas = { 
        "type": "update",
        "host": document.getElementById("host_name").innerText.toLowerCase(), 
        "details": document.getElementById("anime_value").innerText, 
        "state": document.getElementById("progress").innerText.replace("\n", ""),
        "anilist": document.getElementById("anilist_link").value
    }

    fetch("http://127.0.0.1:8000/rpc_anime", {
        method: "POST", 
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( datas )
    })
    .then( response => {
        if (response.ok == true) { return response.json() }
        else { return response.statusText }
    })
    .then( json => {
            console.log("Responsed data: ", json)
            if (typeof json == 'string' || json instanceof String) {
                // Error from Request (like Internal Server Error)
                show_message(json, "red")
                return
            } if (json["processed"] == "true") {
                // if Process is true -> request was successfull
                show_message("Updated!", "#5865f2")
            } else { 
                // Process is false (not true)
                show_message("invalid request!", "red") 
            }
    })
    .catch( err => {
        console.error("Error when fetching to Server: ", err)
        show_message("requesting server failed!", "red")
    })
})


// Function for open/close functionallity of stream host selection
function open_hosts_selection(close=false) {
    el = document.getElementById("stream_hosts");
    if (close==true) {el.style.display = "none";return;}
    switch (getComputedStyle(el).display) {
        case "none":
            el.style.display = "block";
            break;
        case "block":
            el.style.display = "none";
            break;
    }
}

document.getElementById("open_host").addEventListener("click", open_hosts_selection)

// Function for change host after select a new value
function change_host(e, storage_update=false) {
    if (storage_update) {
        if (e == null) {
            // if no host is provided in local-storage -> set crunchyroll as standart
            browser.storage.local.set({"hostname": "crunchyroll"})
            document.getElementById("host_name").innerText = "Crunchyroll"
            return;
        } 
    } else { e = e.target }
    // update
    document.getElementById("cur_host").innerText = e.innerText.replace(/\s/g, "");
    document.getElementById("host_name").innerText = e.innerText.replace(/\s/g, "");
    // save value to localStorage
    browser.storage.local.set({"hostname": e.id})
    // change cur selected style and close menu
    document.getElementsByClassName("item-selected")[0].classList.remove("item-selected")
    e.classList.add("item-selected");
    Array(...document.getElementById("asset_holder").children).forEach(el => {
        if (el.id == `${e.innerText.replace(/\s/g, "").toLocaleLowerCase()}_logo`) {el.style.display = "block"}
        else {el.style.display = "none"}
    });
    open_hosts_selection(close=true);
}

document.getElementById("aniworld").addEventListener("click", (e)=>{change_host(e)})
document.getElementById("crunchyroll").addEventListener("click", (e)=>{change_host(e)})


// Functions for switch page between main and settingspage
document.getElementById("settingsicon").addEventListener("click", ()=>{
    document.getElementById("mainwindow").style.width = "0px";
    document.getElementById("mainwindow").style.opacity = "0%";
})

document.getElementById("arrow_back").addEventListener("click", ()=>{
    document.getElementById("mainwindow").style.width = "325px";
    document.getElementById("mainwindow").style.opacity = "100%";
})

// update-Functions for inputs of settings-page
function update_dc_name(value) {
    if (value == undefined) {value="Username"}
    browser.storage.local.set({"dc_name": value});
    document.getElementById("dc_name_inp").value = value
    document.getElementById("username").innerText = value;
}
function update_dc_tag(value) {
    if (value == undefined) {value="0001"}
    browser.storage.local.set({"dc_tag": value});
    document.getElementById("dc_tag_inp").value = value
    document.getElementById("usertag").innerText = "#"+value;
}

// apply typing eventhandlers to inputs of settings-page
document.getElementById("dc_name_inp").addEventListener("keyup", (e)=>{update_dc_name(e.target.value)})
document.getElementById("dc_tag_inp").addEventListener("keyup", (e)=>{update_dc_tag(e.target.value)})

// Function for style checkbox as enabled
function enable_checkbox(id) {
    var box = document.getElementById(id);
    box.style.backgroundColor = "#5865f2";
    box.style.borderColor = "#5865f2";
    box.innerHTML = `<img src="images/icons/check.svg" width="20px" height="20px">`
}

// Function for style checkbox as disabled
function disable_checkbox(id) {
    var box = document.getElementById(id);
    box.style.backgroundColor = "#0000";
    box.style.borderColor = "#747f8d";
    box.innerHTML = "";
}

// Function for update state of checkbox-element
function update_checkbox(checkbox, item) {
    storage_json = {};
    // if no value is set -> set it initial to enabled
    if (item == undefined) { item = "enabled"; }
    // change checkbox style
    if (item == 'enabled') { enable_checkbox(checkbox); }
    else if (item == 'disabled') { disable_checkbox(checkbox); }
    // update storage
    storage_json[checkbox] = item;
    browser.storage.local.set(storage_json);
}

// Click-Handler for switching state of checkboxes
document.getElementById("auto_rpc").addEventListener("click", ()=>{
    browser.storage.local.get('auto_rpc').then(
        (item)=>{
            console.log(`auto_rpc in localstorage was changed. Value before: ${item.auto_rpc}`)
            if (item.auto_rpc=='enabled') {update_checkbox("auto_rpc", "disabled")}
            else {update_checkbox("auto_rpc", "enabled")}
        },
        storage_err
    )
})

document.getElementById("auto_streamsync").addEventListener("click", ()=>{
    browser.storage.local.get('auto_streamsync').then(
        (item)=>{
            console.log(`auto_streamsync in localstorage was changed. Value before: ${item.auto_streamsync}`)
            if (item.auto_streamsync=='enabled') {update_checkbox("auto_streamsync", "disabled")}
            else {update_checkbox("auto_streamsync", "enabled")}
        },
        storage_err
    )
})

// Click-Handler for open/close settings-group
var settings_groups = document.querySelectorAll(".group-title")
settings_groups.forEach(group => {
    group.addEventListener("click", (elmnt)=>{
        console.log(elmnt.target)
        elmnt.target.classList.toggle("group-active");
        var content = elmnt.target.parentElement.children[1];
        if (content.style.maxHeight){
            content.style.maxHeight = null;
            content.style.opacity = "0%";
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
            content.style.opacity = "100%";
        } 
    })
})

// Server Status
function checkServerStatus() {
    fetch("http://127.0.0.1:8000/status", {
        method: "POST", 
        headers: {
            'Accept': 'application/json'
        }
    })
    .then( response => {
        if (response.ok == true) { return response.json() }
        else { return response.statusText }
    })
    .then( json => {
        console.log("Responsed data: ", json)
        if (json.status == "ok") {
            document.getElementById("status_img").src = "images/icons/correct.svg";
            document.getElementById("status_img").classList.remove("rotating");
            document.getElementById("server_status").innerText = "Server is running!";
            document.getElementById("server_status").style.color = "#5bb66c";
        }
    })
    .catch( err => {
        console.error("Error when fetching to Server: ", err)
        document.getElementById("status_img").src = "images/icons/incorrect.svg";
        document.getElementById("status_img").classList.remove("rotating");
        document.getElementById("server_status").innerText = "Server can't be accessed!";
        document.getElementById("server_status").style.color = "red";
    })
}

// Server Status button handling
document.getElementById("check_status").addEventListener("click", checkServerStatus)
document.getElementById("shutdown_btn").addEventListener("click", ()=>{
    fetch("http://127.0.0.1:8000/exit").then(() => {checkServerStatus()})
    .catch( () => {checkServerStatus()})
})