function update_anime_state(state) {
    if (state == "") { document.getElementById("anime_value").innerText = "" }
    else { document.getElementById("anime_value").innerText = "Watching " + state }
    return
}
function update_season_inp(state) {
    if (state == "") { document.getElementById("season_value").innerText = ""; return }
    if (document.getElementById("progress_value").innerText) {
        document.getElementById("season_value").innerText = `, Season ${state}`
    }
    else { document.getElementById("season_value").innerText = `Season ${state}` }
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

// apply typing eventhandlers to inputs
document.getElementById("anime_input").addEventListener("keyup", (e) => {
    update_anime_state(e.target.value);
})
document.getElementById("cur_season_inp").addEventListener("keyup", (e) => {
    update_season_inp(e.target.value);
})
document.getElementById("cur_ep_inp").addEventListener("keyup", (e) => {
    update_episode_inp();
})
document.getElementById("total_ep_inp").addEventListener("keyup", (e) => {
    update_episode_inp();
})

// update rpc with values from input (maybe last session values)
window.onload = () => {
    update_anime_state(document.getElementById("anime_input").value);
    update_episode_inp();
    update_season_inp(document.getElementById("cur_season_inp").value);
}

document.getElementById("update_btn").addEventListener("click", (_e) => {
    datas = {
        "type": "update",
        "host": document.getElementById("host_name").innerText.toLowerCase(),
        "details": document.getElementById("anime_value").innerText,
        "state": document.getElementById("progress").innerText.replace("\n", ""),
        "anilist": document.getElementById("anilist_link").value
    }

    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
        if (e["srcElement"]["readyState"] == 4 && e["srcElement"]["status"] == 200) {
            var response = e["srcElement"]["response"];
            console.log("Responsed data: ", response)
            if (response["processed"] == "true") {
                elmnts = document.getElementsByClassName("update");
                Array(...elmnts).forEach(elmnt => {
                    console.log(elmnt);
                    elmnt.style.opacity = "100%";
                });
                setTimeout(() => {
                    Array(...elmnts).forEach(elmnt => {
                        console.log(elmnt);
                        elmnt.style.opacity = "0%";
                    });
                }, 1500)
            }
        }
    }
    xhr.addEventListener("error", (err) => {
        console.log(err)
    })
    xhr.responseType = 'json';
    xhr.open("POST", "http://127.0.0.1:8000/rpc_anime");
    xhr.setRequestHeader("content-type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(datas));
    console.log("Sended Datas: ", datas);
})

document.getElementById("clear_btn").addEventListener("click", (_) => {
    datas = {
        "type": "clear"
    }

    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
        if (e["srcElement"]["readyState"] == 4 && e["srcElement"]["status"] == 200) {
            var response = e["srcElement"]["response"];
            console.log("Responsed data: ", response)
            if (response["processed"] == "true") {
                elmnts = document.getElementsByClassName("clear");
                Array(...elmnts).forEach(elmnt => {
                    console.log(elmnt);
                    elmnt.style.opacity = "100%";
                });
                setTimeout(() => {
                    Array(...elmnts).forEach(elmnt => {
                        console.log(elmnt);
                        elmnt.style.opacity = "0%";
                    });
                }, 1500)
            }
        }
    }
    xhr.responseType = 'json';
    xhr.open("POST", "http://127.0.0.1:8000/rpc_anime");
    xhr.setRequestHeader("content-type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(datas));
    console.log("Sended Datas: ", datas);
})

// Function for open/close functionallity of stream host selection
function open_hosts_selection(close = false) {
    el = document.getElementById("stream_hosts");
    if (close == true) { el.style.display = "none"; return; }
    switch (getComputedStyle(el).display) {
        case "none":
            el.style.display = "block";
            break;
        case "block":
            el.style.display = "none";
            break;
    }
}

// Function for change host after select a new value
function change_host(e) {
    document.getElementById("cur_host").innerText = e.innerText
    document.getElementsByClassName("selection-selected_elmnt")[0].classList.remove("selection-selected_elmnt")
    e.classList.add("selection-selected_elmnt");
    Array(...document.getElementById("asset_holder").children).forEach(el => {
        if (el.id == `${e.innerText.toLocaleLowerCase()}_logo`) { el.style.display = "block" }
        else { el.style.display = "none" }
    });
    document.getElementById("host_name").innerText = e.innerText
    open_hosts_selection(close = true);
}