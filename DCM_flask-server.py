#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Sep 20 18:40:56 2022

@author: Revox179
"""
import sys
from requests import request
from pypresence import Presence
import time
from flask import *
from flask_cors import CORS
import socket
import asyncio

PORT = 8000
APPLICATION_IDs = {
    'aniworld': '1020359247059497071',
    'crunchyroll': '1076049094281277531'
}
rpc = None

app = Flask(__name__)
CORS(app, resources={r"/rpc_anime": {"origins": "*"}})
CORS(app, resources={r"/status": {"origins": "*"}})
shutdown = False


@app.route('/')
def home():
    return render_template('home.html')


@app.route('/rpc')
def rpc_default():
    return render_template('rpc_default.html')


@app.route('/rpc_anime', methods=['POST', 'GET'])
def rpc_anime():
    global rpc
    if request.method == "POST":
        result = request.get_json()

        if result["type"] == "update":
            print("\033[92m[INFO]:\033[00m Updating-Request received")
            # args include all parameter for the rpc.update()-Function
            args = [
                result["host"],
                f"{result['host']} logo",
                result["details"],
                result["state"],
                int(time.time())
            ]
            # include AniList-Button if link is provided
            args.append(None if result["anilist"] == "" else [{"label": "My AniList", "url": result["anilist"]}])

            if rpc is not None:
                try:
                    rpc.clear()
                    rpc.close()
                    rpc = None
                    print(f"\033[92m[INFO]:\033[00m Closed connection to Disord RPC with {result['host']}")
                except Exception:
                    print("\033[91m[ERROR]:\033[00m No connection to Discord Gateway...")
            
            if result["host"] in APPLICATION_IDs:
                # create new event loop for rpc
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                # start new rpc connection and update it with values from args
                rpc = Presence(APPLICATION_IDs[result["host"]], loop=loop)
                rpc.connect()
                print(f"\033[92m[INFO]:\033[00m Connected to Disord RPC with {result['host']}")
                rpc.update(
                    large_image=args[0],
                    large_text=args[1],
                    details=args[2],
                    state=args[3],
                    start=args[4],
                    buttons=args[5]
                )
                print(f"\033[92m[INFO]:\033[00m Started Disord RPC with {result['host']}")
            else:
                print(f"\033[91m[ERROR]:\033[00m No valid Host: {result['host']}")
                return jsonify({'processed': 'false'})

        elif result["type"] == "clear":
            print("\033[92m[INFO]:\033[00m Clear-Request received")
            if rpc is not None:
                try:
                    rpc.clear()
                    rpc.close()
                    rpc = None
                    print("\033[92m[INFO]:\033[00m Closed connection to last Disord RPC connection")
                except Exception:
                    print("\033[91m[ERROR]:\033[00m No connection to Discord Gateway...")
            else:
                print("\033[92m[INFO]:\033[00m No known running RPC-Connection to close")
        else: 
            print("\033[91m[ERROR]:\033[00m Request with no valid/known Type received")
            return jsonify({'processed': 'false'})

        return jsonify({'processed': 'true'})
    return render_template('rpc_anime.html')

# Route to check status of server from Firefox-Extension
@app.route("/status", methods=['POST'])
def status():
    return jsonify({'status': 'ok'})

# Shutdown Flask Server -> Solution worked fine found here
# https://stackoverflow.com/questions/15562446/how-to-stop-flask-application-without-using-ctrl-c#answer-69812984
@app.route("/exit")
def exit_app():
    global shutdown
    shutdown = True
    return "Shutdown..."

@app.teardown_request
def teardown(_):
    import os
    if shutdown:
        print("\033[91m[STOPPED]:\033[00m Shutdown Server")
        os._exit(0)

# Function to check if port is already in use
def check_port(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0

if __name__ == '__main__':
    if check_port(PORT):
        print(f"\033[91m[ERROR]:\033[00m Port {PORT} is already in use")
        sys.exit(1)

    print("\033[92m[INFO]:\033[00m Start Flask server on port 8000")
    app.run(port=PORT)
    print("\033[91m[STOPPED]:\033[00m Shutdown Server")
