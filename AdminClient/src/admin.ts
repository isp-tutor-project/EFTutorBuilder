//*********************************************************************************
//
//  Copyright(c) 2008,2018 Kevin Willows. All Rights Reserved
//
//	License: Proprietary
//
//  THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//
//*********************************************************************************

'use strict';

const fs        = require('fs');
const path      = require('path');
const readline  = require('readline');
const net       = require('net');

import { ClientSocket } from './ClientSocket';
import { ServerSocket } from './ServerSocket';
import { cpus } from 'os';
import { FSWatcher } from 'fs';

const INSTALL:string        = "INSTALL";
const PUSH:string           = "PUSH";
const PULL:string           = "PULL";
const SEND:string           = "SEND";
const RETRY:string          = "RETRY";
const SCAN:string           = "SCAN";

const IPLIB_SRCFILE:string  = "ip_library.json";

const TUTORBASEFOLDER:string = "../../../";
const DATA_PATH:string       = "EFdata";
const CMD_TYPE:string        = ".json";

let dataPath:string;

let ipLib:any;
let tabletList:any[];
let tabletCurr:number;
let deviceQueue:number[] = [];

let lib_Loaded:boolean = false;

let comSet:any;
let fRetryOnly:boolean = false;
let com_Loaded:boolean = false;

let libraryGen:any     = {_LIBRARY:{}};
let data_assets:any    = {};

let twd:string;
let rwd:string;
let cwd:string;


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * When debugging the module may not be defined as an argument. 
 * (You may use a vscode launch configuration to set args[] to define a target)
 *
 * This function will provide a realtime listing of modules which may be built.
 * and prompt the user to select a build target.
 */
function processCommandLine() {

    let success:boolean = false;

    calcTutorFolder();
    load_IpLibrary();

    try {

        if(process.argv[2]) {

            switch(process.argv[2]) {
                case SCAN:
                    readIPs();
                    break;

                case RETRY: 
                    // Do a SEND but only to failed tablets.
                    // 
                    fRetryOnly = true;

                case SEND: 
                case PULL:

                    // This is kept alive by the client socket which will continually process the 
                    // tablet queue until it is exhausted when the process will terminate as there 
                    // are no background queues waiting.
                    //
                    if(process.argv[3]) {

                        load_CmdSet(process.argv[3]);
                        queueDevices();
                        processNextDevice(true);

                        success = true;
                    }
                    if(!success) {
                        console.log("PUSH target is missing: " + process.argv[3] + ".json");
                    }
                    break;
            }
        }
    }
    catch(e) {
        console.log("ERROR: " + e);
    }
}


function preProcessCommands() {

    for(let ndx= 0 ; ndx < comSet.commands.length ; ndx++) {

        switch(comSet.commands[ndx].command) {

            case INSTALL:
            case PUSH:
                let dataPath = path.join(cwd, comSet.commands[ndx].from); 
    
                let stats = fs.statSync(dataPath);
    
                comSet.commands[ndx].size = stats.size;
                break;    
        }
    }    
}


// Generate a queue of tabletList device-indices to be processed sequentially
// TODO: change to only queue failed devices on retry
// 
function queueDevices() {

    if(comSet.targets === "all") {

        for(let i1 = tabletList.length-1 ; i1 >= 0  ; i1--) {
            deviceQueue.push(i1);
        }
    }
    else {
        let tdev:number[] = comSet.tabletIDs;

        for(let i1 = tdev.length-1; i1 >= 0 ; i1--) {

            for(let i2 = 0 ; i2 < tabletList.length ; i2++) {
                if(tdev[i1] == tabletList[i2].Id) {

                    deviceQueue.push(i2);
                }
            }
        }
    }

    console.log(`${deviceQueue.length} devices queued for processing:`);
}


function sendCommandSet(tabletNdx:number) {
    
    var client = new ClientSocket(processNextDevice);

    try {
        // Track current tablet to flag errors
        // 
        tabletCurr = tabletNdx;
        tabletList[tabletCurr].failed = false;

        client.connect(12007, tabletList[tabletNdx].ip); 

        let Id = tabletList[tabletNdx].Id;
        let ip = tabletList[tabletNdx].ip;

        console.log(`Processing Device ID: ${Id} :: ${ip}`);

        // push the command to the socket queue
        // 
        for(let com= 0 ; com < comSet.commands.length ; com++) {

            comSet.commands[com].tabletId = Id;

            let command:string = JSON.stringify(comSet.commands[com], null, '\t');

            client.pushCommand(command);
        }    
    } catch(e) {

        console.log("Error: " + e);
    }        
}


// Callback from client socket
function processNextDevice(success:boolean) {

    let nextTablet:number;

    if(!success) {
        tabletList[tabletCurr].failed = true;
    }
    if(deviceQueue.length <= 0) {

        console.log(`\n\n***********************************************\nProcessing Complete: All Devices Processed\n`);

        // If errors occurred save for retry
        // 
        save_IpLibrary();      
        return;              
    }
    // We only process one tablet per pass but in retry mode
    // all the non-failed need to be skipped
    // 
    else while(deviceQueue.length > 0) {

        nextTablet = deviceQueue.pop();

        if(fRetryOnly && !tabletList[nextTablet].failed) {
            continue;
        }
        else {
            break;
        }
    }     

    rl.question('\n\n***********************************************\nProcess TabletID:' + tabletList[nextTablet].Id +"? Y/N> ", (answer:string) => {

        if(answer.toLowerCase() === "y") {

            sendCommandSet(nextTablet);    
        }
        else {

            tabletCurr = nextTablet;
            processNextDevice(false);
        }
    });      

}

function readIPs() {

    var server = new ServerSocket(resultCallback);

    server.listen(12007, "10.0.0.254");
}


function resultCallback(msg:Buffer): void {

    let found:boolean    = false;
    let timestamp:string = timeStamp();
    let msgstr:string    = msg.toString().toLowerCase();

    try {
        let ipmac:Array<string>  = msgstr.split("|");

        let ip:string  = ipmac[0];
        let mac:string = ipmac[1].toLowerCase();

        for(let i1 = 0; i1 < tabletList.length ; i1++) {

            let tablet:any= tabletList[i1];

            if(mac === tablet.mac) {
                tablet.ip = ip;
                if(tablet.created === "") {
                    tablet.created = timestamp;
                }
                tablet.lastseen = timestamp;
                found = true;
                console.log("Registered: " + msgstr);
                break;
            }
        }

        if(!found) {
            tabletList.push({
                "Id": tabletList.length+1,
                "mac": mac,
                "ip": ip,
                "owner": "lab",
                "created": timestamp,
                "lastseen": timestamp
            });
            console.log("Added New: " + msgstr);
        }

        save_IpLibrary();
    }
    catch(e) {
        console.log("ERROR: msg format error: ");
    }
}


function timeStamp() {

    // Create a date object with the current time
    var now = new Date();
    var timestr:Array<string> = new Array<string>();

    // Create an array with the current month, day and time
    var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];

    // Create an array with the current hour, minute and second
    var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

    // Determine AM or PM suffix based on the hour
    var suffix = ( time[0] < 12 ) ? "AM" : "PM";

    // Convert hour from military time
    time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;

    // If hour is 0, set it to 12
    time[0] = time[0] || 12;

    for(let i1 = 0 ; i1 < 3 ; i1 ++) {
        timestr[i1] = time[i1].toString();
    }

    // If seconds and minutes are less than 10, add a zero
    for ( var i = 1; i < 3; i++ ) {
        if ( time[i] < 10 ) {
            timestr[i] = "0" + time[i];
        }
    }

    // Return the formatted string
    return `${date.join("/")}  ${timestr.join(":")} ${suffix}`;
}

function load_IpLibrary() {

    dataPath = path.join(cwd, DATA_PATH, IPLIB_SRCFILE);    
    console.log("Loading IP Library Path: " + dataPath);

    try {
        if(!lib_Loaded) {
            ipLib    = JSON.parse(fs.readFileSync(dataPath));
            lib_Loaded = true;

            tabletList = ipLib.tablets;
        }
    }
    catch(err) {
        console.log("Error: " + err);
    }
}


function load_CmdSet(file:string) {

    // Build the path and ensure it ends with .json    
    // 
    if(!file.endsWith(CMD_TYPE)) file += CMD_TYPE;
    dataPath = path.join(cwd, DATA_PATH, file);        

    console.log("Loading Command Set: " + dataPath);

    try {
        if(!com_Loaded) {
            comSet     = JSON.parse(fs.readFileSync(dataPath));
            com_Loaded = true;

            // Get the file sizes for PUSH INSTALL Commands
            // 
            preProcessCommands();
        }
    }
    catch(err) {
        console.log("Error: " + err);
    }
}


function save_IpLibrary() {

    dataPath = path.join(cwd, DATA_PATH, IPLIB_SRCFILE);    

    let dataUpdate:string = JSON.stringify(ipLib, null, '\t');

    fs.writeFileSync(dataPath, dataUpdate, 'utf8');
}



function calcTutorFolder() : string {

    cwd = process.cwd();
    console.log("Current working Directory  = " + cwd);

    rwd = path.relative(process.cwd(), __dirname);
    console.log("Relative working Directory  = " + rwd);

    twd = path.resolve(rwd,TUTORBASEFOLDER);
    console.log("Tutor working Directory  = " + twd);

    return twd;
}


processCommandLine();