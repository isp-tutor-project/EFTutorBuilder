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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const net = require('net');
const ClientSocket_1 = require("./ClientSocket");
const ServerSocket_1 = require("./ServerSocket");
const DataManager_1 = require("./DataManager");
const LogManager_1 = require("./LogManager");
const ProdManager_1 = require("./ProdManager");
const TCONST_1 = require("./TCONST");
const UNPACKDATA = "UNPACKDATA";
const ASSIGN_COND = "ASSIGN_COND";
const MERGEACCTS = "MERGEACCTS";
const EXTRACTDATA = "EXTRACTDATA";
const GEN_PRODIMAGE = "GEN_PRODIMAGE";
const USERGEN = "USERGEN";
const INSTALL = "INSTALL";
const PUSH = "PUSH";
const PULL = "PULL";
const CLEAN = "CLEAN";
const SEND = "SEND";
const RETRY = "RETRY";
const SCAN = "SCAN";
const IPLIB_SRCFILE = "ip_library.json";
const USERID_SRCFILE = "isp_userdata.json";
const GENSTATE_SRCFILE = "genstatedata.json";
const USERSTATE_SRCFILE = "tutorstatedata.json";
const TUTORBASEFOLDER = "../../../";
const DATA_PATH = "EFdata";
const CMD_TYPE = ".json";
const EF_ZIPDATA = "EdForge_ZIPDATA";
const EF_USERDATA = "EdForge_USERDATA";
const EF_CONDCSV = "ConditionAssignment.csv";
let dataPath;
let logManager;
let dataManager;
let productionManager;
let ipLib;
let tabletList;
let tabletCurr;
let deviceQueue = [];
let lib_Loaded = false;
let comSet;
let fRetryOnly = false;
let com_Loaded = false;
let libraryGen = { _LIBRARY: {} };
let data_assets = {};
let twd;
let rwd;
let cwd;
let sysConsole = console.log;
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
    let success = false;
    calcTutorFolder();
    load_IpLibrary();
    logManager = new LogManager_1.LogManager(cwd);
    dataManager = new DataManager_1.DataManager(cwd);
    productionManager = new ProdManager_1.ProductionManager(cwd, twd);
    console.log = logLocal;
    try {
        if (process.argv[2]) {
            switch (process.argv[2]) {
                // You pull the user data from each tablet into the EdForge_DATA folder.
                // This produces a sub-folder for each tablet with a zip containing the 
                // tablets EdForge_DATA folder.
                // 
                // Transfer this to a Study-named folder in EFData and commit
                // 
                // Transfer the tablet folders to EdForge_ZIPDATA and execute UNPACKDATA to get 
                // all the discrete user data folders with their tutor states.
                // 
                case UNPACKDATA:
                    console.log("||** NOTICE: Unpacking User Data In Progress");
                    dataManager.unpackData(EF_ZIPDATA, EF_USERDATA);
                    logManager.close();
                    rl.close();
                    break;
                case MERGEACCTS:
                    console.log("||** NOTICE: Merging Accounts In Progress");
                    dataManager.mergeUserAccts();
                    logManager.close();
                    rl.close();
                    break;
                case EXTRACTDATA:
                    console.log("||** NOTICE: Data Extraction In Progress");
                    dataManager.extractTutorData();
                    logManager.close();
                    rl.close();
                    break;
                case ASSIGN_COND:
                    console.log("||** NOTICE: Assignment of User Condition In Progress");
                    dataManager.assignInstruction(EF_CONDCSV);
                    // logManager.close();
                    // rl.close();
                    break;
                // This produces the EdForge.zip EdForge_PART.zip tutor images 
                // 
                case GEN_PRODIMAGE:
                    console.log("||** NOTICE: Production Image Generation In Progress");
                    productionManager.generatePRODImage();
                    logManager.close();
                    rl.close();
                    break;
                case USERGEN:
                    console.log("||** NOTICE: Generating User State Data In Progress");
                    generateUserState();
                    break;
                case SCAN:
                    readIPs();
                    break;
                case RETRY:
                    // Do a SEND but only to failed tablets.
                    // 
                    fRetryOnly = true;
                case SEND:
                case PULL:
                case CLEAN:
                    // This is kept alive by the client socket which will continually process the 
                    // tablet queue until it is exhausted at which point the process will terminate as there 
                    // are no background queues waiting.
                    //
                    if (process.argv[3]) {
                        load_CmdSet(process.argv[3]);
                        processNextDevice(true);
                        success = true;
                    }
                    if (!success) {
                        console.log("PUSH target is missing: " + process.argv[3] + ".json");
                    }
                    break;
            }
        }
    }
    catch (e) {
        console.log("ERROR: " + e);
    }
}
function logLocal(msg) {
    logManager.writeLog(msg);
    sysConsole(msg);
}
// const USERID_SRCFILE:string  = "isp_userdata.json";
// const GENSTATE_SRCFILE:string  = "genstatedata.json";
// const USERSTATE_SRCFILE:string = "tutorstatedata.json";
// 
function generateUserState() {
    let userData;
    let genState;
    let tutorState = {};
    userData = load_Data(USERID_SRCFILE);
    genState = load_Data(GENSTATE_SRCFILE);
    tutorState.users = [];
    // Clear the current user
    // 
    userData.currUser = {
        "userName": "",
        "currTutorNdx": 0,
        "currScene": "",
        "instructionSeq": ""
    };
    for (let user of userData.users) {
        let username = user.userName;
        let features;
        user.userName = username.replace("-", "_").toUpperCase();
        switch (user.instructionSeq) {
            case "tutor_seq_all_choice.json":
                genState.tutorState["experimentalGroup.ontologyKey"] = "EG_A1";
                genState.moduleState["selectedArea.index"] = 0;
                genState.moduleState["selectedArea.ontologyKey"] = "";
                genState.moduleState["selectedTopic.index"] = 0;
                genState.moduleState["selectedTopic.ontologyKey"] = "";
                genState.moduleState["selectedVariable.index"] = 0;
                genState.moduleState["selectedVariable.ontologyKey"] = "";
                features = ["FTR_CHOICE"];
                break;
            case "tutor_seq_all_nochoice.json":
                genState.tutorState["experimentalGroup.ontologyKey"] = "EG_A2";
                genState.moduleState["selectedArea.index"] = 4;
                genState.moduleState["selectedArea.ontologyKey"] = "S_A4|name";
                genState.moduleState["selectedTopic.index"] = 1;
                genState.moduleState["selectedTopic.ontologyKey"] = "S_A4_T1|name";
                genState.moduleState["selectedVariable.index"] = 1;
                genState.moduleState["selectedVariable.ontologyKey"] = "S_A4_T1_V1|name";
                genState.moduleState["selectedRQ.ontologyKey"] = "S_A4_T1_RQ1";
                features = ["FTR_NOCHOICE", "FTR_GRHOUSE"];
                break;
            case "tutor_seq_all_baseline.json":
                genState.tutorState["experimentalGroup.ontologyKey"] = "EG_A3";
                genState.moduleState["selectedArea.index"] = 4;
                genState.moduleState["selectedArea.ontologyKey"] = "S_A4|name";
                genState.moduleState["selectedTopic.index"] = 1;
                genState.moduleState["selectedTopic.ontologyKey"] = "S_A4_T1|name";
                genState.moduleState["selectedVariable.index"] = 1;
                genState.moduleState["selectedVariable.ontologyKey"] = "S_A4_T1_V1|name";
                genState.moduleState["selectedRQ.ontologyKey"] = "S_A4_T1_RQ1";
                features = ["FTR_BASELINE", "FTR_GRHOUSE"];
                break;
        }
        let newObj = { userName: "", tutorState: {}, moduleState: {}, "features": features };
        newObj.userName = user.userName;
        Object.assign(newObj.tutorState, genState.tutorState);
        Object.assign(newObj.moduleState, genState.moduleState);
        tutorState.users.push(newObj);
    }
    save_Data(USERID_SRCFILE, userData);
    save_Data(USERSTATE_SRCFILE, tutorState);
    console.log("User Generation Complete!");
}
function load_Data(dataFile) {
    let dataObj;
    dataPath = path.join(cwd, DATA_PATH, dataFile);
    console.log("Loading User Data: " + dataPath);
    try {
        dataObj = JSON.parse(fs.readFileSync(dataPath));
    }
    catch (err) {
        console.log("Error: " + err);
    }
    return dataObj;
}
function save_Data(dataFile, dataObj) {
    dataPath = path.join(cwd, DATA_PATH, dataFile);
    let dataUpdate = JSON.stringify(dataObj, null, '\t');
    fs.writeFileSync(dataPath, dataUpdate, 'utf8');
}
function preProcessCommands() {
    for (let ndx = 0; ndx < comSet.commands.length; ndx++) {
        switch (comSet.commands[ndx].command) {
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
    if (comSet.targets === "all") {
        for (let i1 = tabletList.length - 1; i1 >= 0; i1--) {
            deviceQueue.push(i1);
        }
    }
    else {
        let tdev = comSet.tabletIDs;
        for (let i1 = tdev.length - 1; i1 >= 0; i1--) {
            for (let i2 = 0; i2 < tabletList.length; i2++) {
                if (tdev[i1] == tabletList[i2].tabletId) {
                    deviceQueue.push(i2);
                }
            }
        }
    }
    console.log(`${deviceQueue.length} devices queued for processing:`);
}
function sendCommandSet(tabletNdx) {
    var client = new ClientSocket_1.ClientSocket(processNextDevice);
    try {
        // Track current tablet to flag errors
        // 
        tabletCurr = tabletNdx;
        tabletList[tabletCurr].failed = false;
        client.connect(12007, tabletList[tabletNdx].ip);
        let Id = tabletList[tabletNdx].tabletId;
        let ip = tabletList[tabletNdx].ip;
        console.log(`Processing Device ID: ${Id} :: ${ip}`);
        // push the command to the socket queue
        // 
        for (let com = 0; com < comSet.commands.length; com++) {
            let commandOkay = true;
            comSet.commands[com].tabletId = Id;
            if (comSet.commands[com].command === "PULL") {
                if (client.buildTargetPath(comSet.commands[com]) === TCONST_1.TCONST.ISEXTANT) {
                    console.log("ERROR: Tablet Id Duplicated - check ID");
                    commandOkay = false;
                }
            }
            if (commandOkay) {
                let command = JSON.stringify(comSet.commands[com], null, '\t');
                client.pushCommand(command);
            }
        }
    }
    catch (e) {
        console.log("Error: " + e);
    }
}
function findTabletByNetID(index) {
    let resultNdx = -1;
    for (let i1 = 0; i1 < tabletList.length; i1++) {
        if (tabletList[i1].netId === index) {
            resultNdx = i1;
            break;
        }
    }
    return resultNdx;
}
// Callback from client socket
function processNextDevice(success) {
    let netIndex;
    let tabletNdx;
    let inputError = false;
    do {
        rl.question('\n\n***********************************************\nEnter TabletID to process: > ', (answer) => {
            netIndex = parseInt(answer);
            if (isNaN(netIndex)) {
                setTimeout(processNextDevice, 0, false);
            }
            else {
                tabletNdx = findTabletByNetID(netIndex);
                if (tabletNdx > 0) {
                    sendCommandSet(tabletNdx);
                    inputError = false;
                }
                else {
                    console.log("ERROR: Device not Found.");
                    setTimeout(processNextDevice, 0, false);
                }
            }
        });
    } while (inputError);
}
function readIPs() {
    var server = new ServerSocket_1.ServerSocket(resultCallback);
    server.listen(12007, "10.0.0.254");
}
function resultCallback(msg) {
    let found = false;
    let timestamp = timeStamp(new Date());
    let msgstr = msg.toString().toLowerCase();
    try {
        let ipmac = msgstr.split("|");
        let ip = ipmac[0];
        let mac = ipmac[1].toLowerCase();
        for (let i1 = 0; i1 < tabletList.length; i1++) {
            let tablet = tabletList[i1];
            if (mac === tablet.mac) {
                tablet.ip = ip;
                if (tablet.created === "") {
                    tablet.created = timestamp;
                }
                tablet.lastseen = timestamp;
                found = true;
                console.log("Registered: " + msgstr);
                break;
            }
        }
        if (!found) {
            // tabletList.push({
            //     "tabletId": tabletList.length+1,
            //     "mac": mac,
            //     "ip": ip,
            //     "owner": "lab",
            //     "created": timestamp,
            //     "lastseen": timestamp
            // });
            console.log("Added New: " + msgstr);
        }
        save_IpLibrary();
    }
    catch (e) {
        console.log("ERROR: msg format error: ");
    }
}
function timeStamp(now) {
    var timestr = new Array();
    // Create an array with the current month, day and time
    var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];
    // Create an array with the current hour, minute and second
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];
    // Determine AM or PM suffix based on the hour
    var suffix = (time[0] < 12) ? "AM" : "PM";
    // Convert hour from military time
    time[0] = (time[0] < 12) ? time[0] : time[0] - 12;
    // If hour is 0, set it to 12
    time[0] = time[0] || 12;
    for (let i1 = 0; i1 < 3; i1++) {
        timestr[i1] = time[i1].toString();
    }
    // If seconds and minutes are less than 10, add a zero
    for (var i = 1; i < 3; i++) {
        if (time[i] < 10) {
            timestr[i] = "0" + time[i];
        }
    }
    // Return the formatted string
    return `${date.join(":")}  ${timestr.join(":")} ${suffix}`;
}
exports.timeStamp = timeStamp;
function load_IpLibrary() {
    dataPath = path.join(cwd, DATA_PATH, IPLIB_SRCFILE);
    console.log("Loading IP Library Path: " + dataPath);
    try {
        if (!lib_Loaded) {
            ipLib = JSON.parse(fs.readFileSync(dataPath));
            lib_Loaded = true;
            tabletList = ipLib.tablets;
        }
    }
    catch (err) {
        console.log("Error: " + err);
    }
}
function load_CmdSet(file) {
    // Build the path and ensure it ends with .json    
    // 
    if (!file.endsWith(CMD_TYPE))
        file += CMD_TYPE;
    dataPath = path.join(cwd, DATA_PATH, file);
    console.log("Loading Command Set: " + dataPath);
    try {
        if (!com_Loaded) {
            comSet = JSON.parse(fs.readFileSync(dataPath));
            com_Loaded = true;
            // Get the file sizes for PUSH INSTALL Commands
            // 
            preProcessCommands();
        }
    }
    catch (err) {
        console.log("Error: " + err);
    }
}
function save_IpLibrary() {
    dataPath = path.join(cwd, DATA_PATH, IPLIB_SRCFILE);
    let dataUpdate = JSON.stringify(ipLib, null, '\t');
    fs.writeFileSync(dataPath, dataUpdate, 'utf8');
}
function calcTutorFolder() {
    cwd = process.cwd();
    console.log("Current working Directory  = " + cwd);
    rwd = path.relative(process.cwd(), __dirname);
    console.log("Relative working Directory  = " + rwd);
    twd = path.resolve(rwd, TUTORBASEFOLDER);
    console.log("Tutor working Directory  = " + twd);
    return twd;
}
processCommandLine();
//# sourceMappingURL=admin.js.map