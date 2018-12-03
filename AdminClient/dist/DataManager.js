//*********************************************************************************
//
//  Copyright(c) 2008,2018 Kevin Willows. All Rights Reserved
//
//	License: Proprietary
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
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
const AdmZip = require("adm-zip");
const DataProcessor_1 = require("./DataProcessor");
const TCONST_1 = require("./TCONST");
const Utils_1 = require("./Utils");
class DataManager {
    constructor(_cwd) {
        this.dataFolders = new Array();
        this.fileSource = {};
        this.statedata = { "users": [] };
        this.TABLET_BASE = "tablet_";
        this.ARCHIVE_FILENAME = "Alldata.zip";
        this.TUTORSTATE = "tutorstatedata.json";
        this.ACCT_FILENAME = "isp_userdata.json";
        this.GLOBALSTATE = "tutor_state.json";
        this.ONTOLOGYSRC = "_EFTUTORDATA.json";
        this.ZIP_ROOT = "EdForge_DATA/";
        this.USER_DATA = "EdForge_USERDATA/";
        this.PROC_DATA = "EdForge_PROCDATA/";
        this.MERGE_DATA = "EdForge_MERGEDATA/";
        this.DUPLICATE = "DUPLICATE";
        this.USERDATA_VERSION1 = "1.0.0";
        this.RECURSE = true;
        this.NORECURSE = false;
        this.tabletImages = []; // account for each tablet 
        this.stateImages = []; // state data for each tablet
        this.mergedAccts = {
            "version": this.USERDATA_VERSION1,
            "userLogins": [],
            "users": []
        };
        this.acctFixups = {
            "GUESTNC_JAN_1": { "tablet_17": { "username": "briennesh_jan_1", "condition": "tutor_seq_DL_BASELINE_SODA.json" } },
            "GUESTC_JAN_1": { "tablet_3": { "username": "calebke_jan_1", "condition": "tutor_seq_DL_BASELINE_SODA.json" },
                "tablet_7": { "username": "ericku_jan_1", "condition": "tutor_seq_DL_BASELINE_SODA.json" },
                "tablet_11": { "username": "jasonca_jan_1", "condition": "tutor_seq_DL_BASELINE_SODA.json" } },
            "GUESTBL_JAN_2": { "tablet_5": { "username": "genevieveza_jan_1", "condition": "tutor_seq_DL_BASELINE_SODA.json" } },
            "GUESTBL_JAN_3": { "tablet_22": { "username": "laneybe_jan_1", "condition": "tutor_seq_DL_BASELINE_SODA.json" } }
        };
        this.conflictResolution = {
            "TANNERHA_OCT_1": "tablet_10",
            "CALEBKE_FEB_17": "none"
        };
        // Guest Account:GUESTNC_JAN_1 on: tablet_17
        // Guest Account:GUESTC_JAN_1 on: tablet_3
        // Guest Account:GUESTC_JAN_1 on: tablet_7
        // Guest Account:GUESTC_JAN_1 on: tablet_11
        // Guest Account:GUESTBL_JAN_2 on: tablet_5
        // Guest Account:GUESTBL_JAN_3 on: tablet_22
        // Guest Account:GUESTC_JAN_2 on: tablet_6      ??
        // MERGE CONFLICT: TANNERHA_OCT_1 - tablet_10 : tablet_26
        // MERGE CONFLICT: TANNERHA_OCT_1 - tablet_10 : tablet_26
        // MERGE CONFLICT: CALEBKE_FEB_17 - tablet_11 : tablet_30
        // MERGE CONFLICT: CALEBKE_FEB_17 - tablet_11 : tablet_30
        // MERGE CONFLICT: STEPHSI_JAN_1 - tablet_16 : tablet_30
        // MERGE CONFLICT: GUESTC_JAN_1 - tablet_11 : tablet_3
        // MERGE CONFLICT: GUESTC_JAN_1 - tablet_11 : tablet_7
        this.activeAccounts = {};
        this.masterAccountList = {};
        this.cwd = _cwd;
    }
    // Unpack the alldata.zip for each tablet in the EdForge_ZIPDATA folder into the 
    // EdForge_USERDATA folder.  This gives us all the user data in discrete folders.
    // 
    unpackData(src, dst) {
        let srcPath = path.join(this.cwd, src);
        let dstPath = path.join(this.cwd, dst);
        try {
            let files = fs.readdirSync(srcPath);
            for (let folder of files) {
                // If this looks like a tablet folder then process it
                // 
                if (folder.startsWith(this.TABLET_BASE)) {
                    let _path = path.join(srcPath, folder);
                    try {
                        let stats = fs.statSync(_path);
                        // If it is a folder check it for user data
                        // 
                        if (stats.isDirectory()) {
                            this.unpackTabletData(folder, _path, dstPath);
                        }
                    }
                    catch (error) {
                        console.log("Error = " + error);
                    }
                }
            }
        }
        catch (error) {
            console.log("Error = " + error);
        }
        return this.dataFolders;
    }
    assignInstruction(csvName) {
        let srcPath = path.join(this.cwd, this.USER_DATA, csvName);
        let count = 0;
        let username;
        this.loadMergedAccts();
        this.statedata = { "users": [] };
        var lineReader = readline.createInterface({
            input: require('fs').createReadStream(srcPath),
            crlfDelay: Infinity
        });
        lineReader.on('line', (line) => {
            let packet = line.split(",");
            count++;
            let name1 = packet[0].match(/\w+/);
            let name2 = packet[1].match(/\w+/);
            let month = packet[2].match(/\w+/);
            let cond = packet[8].match(/\w+/);
            let subcond = packet[9].match(/\w+/);
            let features;
            let instruction;
            if (!cond[0].toUpperCase().startsWith("HS")) {
                switch (cond[0]) {
                    case "C":
                        features = "FTR_CHOICE";
                        instruction = "tutor_seq_DL_CHOICE.json";
                        break;
                    case "NC":
                        features = "FTR_NOCHOICE";
                        if (subcond[0].toUpperCase().startsWith("GR")) {
                            features += ":FTR_NCPLANTS";
                            instruction = "tutor_seq_DL_NOCHOICE_PLANTS.json";
                        }
                        else {
                            features += ":FTR_NCSODA";
                            instruction = "tutor_seq_DL_NOCHOICE_SODA.json";
                        }
                        break;
                    case "BL":
                        features = "FTR_BASELINE";
                        if (subcond[0].toUpperCase().startsWith("GR")) {
                            features += ":FTR_NCPLANTS";
                            instruction = "tutor_seq_DL_BASELINE_PLANTS.json";
                        }
                        else {
                            features += ":FTR_NCSODA";
                            instruction = "tutor_seq_DL_BASELINE_SODA.json";
                        }
                        break;
                    default:
                        console.log("ERROR: Format Violation.");
                        break;
                }
                username = name1[0].toUpperCase() + name2[0].slice(0, 2).toUpperCase() + "_" + month[0].slice(0, 3).toUpperCase() + "_" + packet[3];
                this.statedata.users.push({
                    "comment": "this is for xref only",
                    "userName": username,
                    "instruction": instruction
                });
                console.log(username + (username.length < 16 ? "\t\t" : "\t") + instruction + (instruction.length < 33 ? "\t\t" : "\t") + features);
            }
            else {
                username = name1[0].toUpperCase() + name2[0].slice(0, 2).toUpperCase();
                if (month) {
                    username += "_" + month[0].slice(0, 3).toUpperCase() + "_" + packet[3];
                }
                instruction = "MASTERY";
                features = "";
                this.statedata.users.push({
                    "comment": "this is for xref only",
                    "userName": username,
                    "instruction": instruction
                });
                console.log(username + "_MASTERY");
            }
        });
        lineReader.on('close', () => {
            console.log("EOF: " + count);
            let dataPath = path.join(this.cwd, this.USER_DATA, this.TUTORSTATE);
            let dataUpdate = JSON.stringify(this.statedata, null, '\t');
            fs.writeFileSync(dataPath, dataUpdate, 'utf8');
            this.xrefSetConditions();
            // Finally save the merge and updated account image.
            // 
            this.saveMergedAcctImage();
        });
    }
    xrefSetConditions() {
        for (let merge of this.mergedAccts.users) {
            let match = this.findStateDataByName(merge.userName);
            if (match) {
                merge.currSessionNdx = 0; // one time only - we are adding this to the image posthoc
                merge.instructionSeq = match.instruction;
            }
            else {
                console.log("ERROR: User Not Found: " + merge.userName);
            }
        }
        this.listMissingClassMatches();
    }
    listMissingClassMatches() {
        let result;
        for (let user of this.statedata.users) {
            if (!user.matched) {
                console.log("ERROR: Class List Entry Not Found: " + user.userName);
            }
        }
        return result;
    }
    findStateDataByName(userName) {
        let result;
        for (let user of this.statedata.users) {
            if (user.userName === userName) {
                user.matched = true;
                result = user;
                break;
            }
        }
        return result;
    }
    extractTutorData() {
        this.loadStateImage();
        this.loadMergedAccts();
        this.loadOntologyImage();
        this.resolveExtractData();
    }
    mergeUserAccts() {
        this.mergeErrors = 0;
        this.loadResolveAccts();
        // Save the merged account database.
        // 
        this.saveMergedAcctImage();
        if (this.mergeErrors === 0) {
            this.mergeTutorStateData();
            console.log("\n\n***********************************************");
            console.log("MERGE COMPLETE!\n\n");
        }
        else {
            console.log("ERROR: Merge Conflicts exist - Correct and retry merge.");
        }
    }
    loadResolveAccts() {
        // this.loadStateImage();
        this.loadAcctImages();
        this.resolveAccts();
    }
    // load beta1 tutorstatedata.json image
    // 
    loadStateImage() {
        let stateData = path.join(this.cwd, this.USER_DATA, this.TUTORSTATE);
        this.state = JSON.parse(fs.readFileSync(stateData));
    }
    loadOntologyImage() {
        let ontologyData = path.join(this.cwd, this.USER_DATA, this.ONTOLOGYSRC);
        this.ontology = JSON.parse(fs.readFileSync(ontologyData));
    }
    getUserState(userName) {
        let result = null;
        for (let user of this.state.users) {
            if (user.userName === userName) {
                result = user;
                break;
            }
        }
        return result;
    }
    // load beta1 tutorstatedata.json image
    // 
    loadMergedAccts() {
        let acctData = path.join(this.cwd, this.MERGE_DATA, this.ACCT_FILENAME);
        this.mergedAccts = JSON.parse(fs.readFileSync(acctData));
    }
    // load beta1 tutorstatedata.json image
    // 
    saveMergedAcctImage() {
        // We don't want tablet ID's in the merge image
        // TODO: use this in V1 merged accounts
        // Having the Tablet ID makes it easier to find the user data
        // 
        for (let user of this.mergedAccts.users) {
            // delete user.tabletId;
        }
        Utils_1.Utils.validatePath(this.cwd, this.MERGE_DATA);
        let dataPath = path.join(this.cwd, this.MERGE_DATA, this.ACCT_FILENAME);
        let dataUpdate = JSON.stringify(this.mergedAccts, null, '\t');
        fs.writeFileSync(dataPath, dataUpdate, 'utf8');
    }
    copyFolder(src, dest, recurse) {
        try {
            var folderList = fs.readdirSync(src);
            for (let entry of folderList) {
                var filePath = path.join(src, entry);
                var stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    // copy recursively
                    if (recurse) {
                        fs.mkdirSync(path.join(dest, entry));
                        this.copyFolder(path.join(src, entry), path.join(dest, entry), recurse);
                    }
                }
                else {
                    // copy filename
                    fs.copyFileSync(path.join(src, entry), path.join(dest, entry));
                }
            }
        }
        catch (err) {
            console.log("ERROR: Copying User Data Folder: " + err);
        }
    }
    // transfer the users tutor state info to a "user-id" named folder in the common merge
    // image that may be loaded to the tablet EdForge_DATA path. 
    // 
    // NOTE!!! any merge conflicts should be resolved before this is processed - merge conflicts
    // occur when a user logs into more than one tablet 
    //
    mergeTutorStateData() {
        for (let user of this.mergedAccts.users) {
            let tutorStateData = path.join(this.cwd, this.USER_DATA, user.userName);
            let mergeStateData = path.join(this.cwd, this.MERGE_DATA, user.userName);
            Utils_1.Utils.validatePath(mergeStateData, null);
            this.copyFolder(tutorStateData, mergeStateData, true);
        }
    }
    // private acctFixups:any = [
    //     {"acctname":"guestnc_Jan_1",  "tablet":17, "username":"briennesh_jan_1",},
    //     {"acctname":"guestc_Jan_1",   "tablet":3,  "username":"calebke_jan_1",},
    //     {"acctname":"guestc_Jan_1",   "tablet":7,  "username":"ericku_jan_1",},
    //     {"acctname":"guestc_Jan_1",   "tablet":11, "username":"jasonca_jan_1",},
    //     {"acctname":"guestbl_Jan_2",  "tablet":5,  "username":"genevieveza_jan_1",},
    //     {"acctname":"guestbl_Jan_3",  "tablet":22, "username":"laneybe_jan_1",}
    // ]                 
    // private conflictResolution:any = {
    //     "TANNERHA_OCT_1":"tablet_10",
    //     "CALEBKE_FEB_17":"none"
    // }
    // Guest Account:GUESTNC_JAN_1 on: tablet_17
    // Guest Account:GUESTC_JAN_1 on: tablet_3
    // Guest Account:GUESTC_JAN_1 on: tablet_7
    // Guest Account:GUESTC_JAN_1 on: tablet_11
    // Guest Account:GUESTBL_JAN_2 on: tablet_5
    // Guest Account:GUESTBL_JAN_3 on: tablet_22
    // Guest Account:GUESTC_JAN_2 on: tablet_6      ??
    // MERGE CONFLICT: TANNERHA_OCT_1 - tablet_10 : tablet_26
    // MERGE CONFLICT: TANNERHA_OCT_1 - tablet_10 : tablet_26
    // MERGE CONFLICT: CALEBKE_FEB_17 - tablet_11 : tablet_30
    // MERGE CONFLICT: CALEBKE_FEB_17 - tablet_11 : tablet_30
    // MERGE CONFLICT: STEPHSI_JAN_1 - tablet_16 : tablet_30
    // MERGE CONFLICT: GUESTC_JAN_1 - tablet_11 : tablet_3
    // MERGE CONFLICT: GUESTC_JAN_1 - tablet_11 : tablet_7
    resolveAccts() {
        let userData;
        let acctCount = 0;
        let rename = false;
        let newname = "";
        let condition = "";
        // enumerate all known accounts.
        // 
        for (let tablet of this.tabletImages) {
            // Build a master account list across all the tablets.
            // 
            if (tablet.tabletId) {
                for (let user of tablet.users) {
                    if (!this.masterAccountList[user.userName]) {
                        this.masterAccountList[user.userName] = { "tablet": tablet.tabletId, "active": "" };
                        acctCount++;
                    }
                }
            }
        }
        // 
        for (let tablet of this.tabletImages) {
            // Build a master account list across all the tablets.
            // 
            if (tablet.tabletId) {
                for (let user of tablet.userLogins) {
                    if (user.userName.startsWith("GUEST")) {
                        console.log("Guest Account:" + user.userName + " on: " + tablet.tabletId);
                    }
                    if (this.activeAccounts[user.userName]) {
                        // If this isn't a duplicate login on this tablet it represents a conflict that must be resolved.
                        // 
                        if (this.activeAccounts[user.userName] !== tablet.tabletId) {
                            this.mergeErrors++;
                            console.log("MERGE CONFLICT: " + user.userName + " - " + this.activeAccounts[user.userName] + " : " + tablet.tabletId);
                        }
                        continue;
                    }
                    else
                        this.activeAccounts[user.userName] = tablet.tabletId;
                }
            }
        }
        console.log("\n\n*********************\nStarting Merge\n\n");
        // {"acctname":"guestnc_Jan_1",  "tablet":3,  "username":"briennesh_jan_1",},
        // acctFixups
        // Each tablet has a set of user accounts some new - some old - they may not all be
        // extant on all tablets. We need to merge these into a single image so any user
        // can login to any tablet to continue.
        // 
        for (let tablet of this.tabletImages) {
            // Check for data spec version - beta1 had no version id we had to parse the currScene to 
            // determine tablet users
            // 
            if (tablet.tabletId) {
                // private acctFixups:any = {
                //     "GUESTNC_JAN_1": {"tablet_17":{"username":"briennesh_jan_1",  "condition":"tutor_seq_DL_BASELINE_SODA.json"}},
                //     "GUESTC_JAN_1":  {"tablet_3": {"username":"calebke_jan_1",    "condition":"tutor_seq_DL_CHOICE.json"},
                //                       "tablet_7": {"username":"ericku_jan_1",     "condition":"tutor_seq_DL_NOCHOICE_SODA.json"},
                //                       "tablet_11":{"username":"jasonca_jan_1",    "condition":"tutor_seq_DL_BASELINE_SODA.json"}},
                //     "GUESTBL_JAN_2": {"tablet_5": {"username":"genevieveza_jan_1","condition":"tutor_seq_DL_BASELINE_SODA.json"}},
                //     "GUESTBL_JAN_3": {"tablet_22":{"username":"laneybe_jan_1",    "condition":"tutor_seq_DL_NOCHOICE_SODA.json"}}
                // }                                
                // private conflictResolution:any = {
                //     "TANNERHA_OCT_1":"tablet_10",
                //     "CALEBKE_FEB_17":"none"
                // }
                // Enumerate the actual logins to tablets.
                // 
                for (let user of tablet.userLogins) {
                    rename = false;
                    if (this.conflictResolution[user.userName]) {
                        if (this.conflictResolution[user.userName] !== tablet.tabletId) {
                            console.log("Skipping Conflict: " + user.userName + " on:" + tablet.tabletId);
                            continue;
                        }
                        else {
                            // Resolve one copy - might be multiple logins by same user on tablet.
                            // 
                            console.log("Resolving Conflict: " + user.userName + " using:" + tablet.tabletId);
                            this.conflictResolution[user.userName] = "done";
                        }
                    }
                    if (this.acctFixups[user.userName]) {
                        if (this.acctFixups[user.userName][tablet.tabletId]) {
                            rename = true;
                            newname = this.acctFixups[user.userName][tablet.tabletId].username.toUpperCase();
                            condition = this.acctFixups[user.userName][tablet.tabletId].condition;
                            console.log("Fixing Account: " + user.userName + "on:" + tablet.tabletId + " to:" + newname + " : " + condition);
                        }
                        else
                            console.log("Skipping: " + user.userName + " on:" + tablet.tabletId);
                    }
                    userData = null;
                    // Locate the user data for the login.  The user array keeps the actual student state info
                    // which is what we want to merge.  We throw away the userLogins.
                    // 
                    for (let entry of tablet.users) {
                        if (entry.userName === user.userName) {
                            userData = entry;
                            break;
                        }
                    }
                    // If the user state data is found we add it to the merged image
                    // 
                    if (userData) {
                        this.masterAccountList[userData.userName].active = true;
                        // Tag the users Tablet Id for data processing
                        // 
                        userData.tabletId = tablet.tabletId;
                        if (rename) {
                            userData.userName = newname;
                            userData.instructionSeq = condition;
                        }
                        // TODO: REMOVE
                        // Dec 3 2018 One time force to account for bug in homeScreen module
                        // This should not be used after this date !!!!!!!   
                        // 
                        else
                            userData.currSessionNdx = 1;
                        //Skip Guest Accounts.
                        // 
                        if (userData.userName.startsWith("GUEST")) {
                            console.log("skipping GUEST");
                        }
                        if (userData.instructionSeq === "tutor_seq_dayone.json") {
                            console.log("skipping bad Account");
                        }
                        else {
                            this.mergedAccts.users.push(userData);
                        }
                    }
                    // Otherwise it represents a merge error which must be resolved
                    // 
                    else {
                        this.mergeErrors++;
                        console.log("ERROR: Account Missing!");
                    }
                }
            }
            else {
                console.log("!!!!!!!!!!!!!!!!! ERROR: OLD VERSION FOUND");
                // enumerate the users to find individuals that used this tablet. In the Beta this is 
                // the best means to identify tablets that were actually used.
                //             
                for (let user of tablet.users) {
                    if (user.currScene != "") {
                        if (this.activeAccounts[user.userName]) {
                            console.log("MERGE CONFLICT: " + user.userName + " - " + this.activeAccounts[user.userName] + " : " + tablet.tabletId);
                        }
                        else
                            this.activeAccounts[user.userName] = tablet.tabletId;
                        // Tag the users Tablet Id for data processing
                        // 
                        user.tabletId = tablet.tabletId;
                        this.mergedAccts.users.push(user);
                    }
                }
            }
        }
        // Merge the dormant accounts
        // 
        for (let tablet of this.tabletImages) {
            // Build a master account list across all the tablets.
            // 
            if (tablet.tabletId) {
                for (let user of tablet.users) {
                    try {
                        // Only merge one copy of dormant accounts.
                        // 
                        if (!this.masterAccountList[user.userName].active) {
                            this.masterAccountList[user.userName].active = true;
                            if (!user.userName.startsWith("GUEST")) {
                                if (user.instructionSeq !== "tutor_seq_dayone.json") {
                                    user.tabletId = tablet.tabletId;
                                    this.mergedAccts.users.push(user);
                                    console.log("Merging Dormant Account: " + user.userName + " on " + tablet.tabletId);
                                }
                                else {
                                    console.log("Skipping Bad Account: " + user.userName + " : " + user.instructionSeq);
                                }
                            }
                            else {
                                console.log("Skipping Guest Account: " + user.userName);
                            }
                        }
                    }
                    catch (err) {
                        // TODO : enumerate the fixups to ensure we didn't miss anything
                        // 
                        console.log("Skipping Fixup: " + user.userName);
                    }
                }
            }
        }
    }
    // Load all the tablet specific beta1 isp_userdata.json files into an array
    // 
    loadAcctImages() {
        let userDataFolder = path.join(this.cwd, this.USER_DATA);
        try {
            let folder = fs.readdirSync(userDataFolder);
            for (let entry of folder) {
                // If this looks like a user account file process it
                // 
                if (entry.startsWith(this.TABLET_BASE)) {
                    let _path = path.join(userDataFolder, entry);
                    try {
                        let stats = fs.statSync(_path);
                        // If it is a folder check it for user data
                        // 
                        if (!stats.isDirectory()) {
                            let accts = JSON.parse(fs.readFileSync(_path));
                            let match = entry.match(/tablet_\d*/);
                            if (match.length > 0)
                                accts.tabletId = match[0];
                            this.tabletImages.push(accts);
                        }
                    }
                    catch (error) {
                        console.log("Error = " + error);
                    }
                }
            }
            ;
        }
        catch (error) {
            console.log("Error = " + error);
        }
        return this.dataFolders;
    }
    resolveExtractData() {
        let processor = new DataProcessor_1.DataProcessor(this.ontology);
        let userCond;
        // We aggregate all users into a single file.
        // 
        let dstPath = Utils_1.Utils.validatePath(this.cwd, this.PROC_DATA);
        processor.createDataTarget(dstPath);
        // We don't want tablet ID's in the merge image
        // TODO: use this in V1 merged accounts
        for (let user of this.mergedAccts.users) {
            let srcPath = path.join(this.cwd, this.USER_DATA, user.userName);
            let state = this.getUserState(user.userName);
            if (state) {
                userCond = state.tutorState["experimentalGroup.ontologyKey"];
            }
            else {
                console.log("ERROR: user State Invalid: " + user.userName);
                throw ("invalid user state");
            }
            try {
                let files = fs.readdirSync(srcPath);
                for (let folder of files) {
                    let _srcpath = path.join(srcPath, folder);
                    try {
                        let stats = fs.statSync(_srcpath);
                        // If it is a folder it is assumed to be a tutor log 
                        // folder
                        // 
                        if (stats.isDirectory()) {
                            // decompose the tutor / school 
                            // 
                            let tutorInst = folder.match(/(\w*)_(\w*)/);
                            processor.setUserPath(user.userName, folder);
                            processor.extractData(_srcpath, user, userCond, tutorInst);
                        }
                        // the only "file" that should be in this folder is tutor_state.json
                        // we ignore it here.
                    }
                    catch (error) {
                        console.log("resolveExtractTutors - Error = " + error);
                    }
                }
            }
            catch (error) {
                console.log("resolveExtractTutors - Error = " + error);
            }
        }
        processor.closeDataTarget();
    }
    unpackFiles(src, dstPath) {
        let srcPath;
        let tarPath;
        let dupNotification = false;
        for (let entry of this.zipEntries) {
            if (!entry.isDirectory) {
                srcPath = path.dirname(entry.entryName) + "/";
                if (srcPath === src) {
                    tarPath = path.join(dstPath, entry.name);
                    // Check for duplicate entries
                    // 
                    if (this.fileSource[tarPath]) {
                        // When finding the first duplicate, we rename the existing file
                        // with the tablet ID appended which is found in the fileSource entry
                        // 
                        // if(this.fileSource[tarPath] !== this.DUPLICATE) {
                        //     let oldPath = path.join(dstPath, entry.name);
                        //     let newName = entry.name + "__" + this.fileSource[tarPath];
                        //     let newPath = path.join(dstPath, newName);
                        //     fs.renameSync(oldPath, newPath);
                        // }
                        if (!dupNotification) {
                            dupNotification = true;
                            let pathParts = srcPath.split("/");
                            let dupTutor = pathParts[1] + "|" + pathParts[2];
                            console.log("WARNING DUPLICATE: " + dupTutor + " : " + this.fileSource[tarPath] + " : " + this.tabletID);
                        }
                        // indicate that this is a duplicate entry - tag it for possible 
                        // multiple duplications
                        // 
                        this.fileSource[tarPath] = this.DUPLICATE;
                    }
                    else {
                        this.fileSource[tarPath] = this.tabletID;
                    }
                    try {
                        this.zipFile.extractEntryTo(entry, dstPath, false, false);
                        // Tag the output with the tablet ID.
                        // 
                        let namePart = entry.name.match(/\w*\d*_*\d*/);
                        let oldPath = path.join(dstPath, entry.name);
                        let newPath = path.join(dstPath, namePart[0] + "__" + this.tabletID + TCONST_1.TCONST.JSONTYPE);
                        fs.renameSync(oldPath, newPath);
                    }
                    catch (err) {
                        // This should never happen
                        // 
                        console.log("ERROR EXTRACTING FILE: " + dstPath);
                    }
                }
            }
        }
    }
    unpackSubFolders(zipBase, dst, recurse) {
        let srcPath;
        let dstPath;
        let zipPath;
        let srcArr;
        for (let entry of this.zipEntries) {
            // trim the filename or last folder name off entryName
            //
            srcPath = path.dirname(entry.entryName) + "/";
            // If this matches the target folder process the file
            // ( and folders if we are recursing)
            // 
            if (srcPath === zipBase) {
                if (entry.isDirectory && recurse) {
                    srcArr = entry.entryName.split("/");
                    let tarFolder = srcArr[srcArr.length - 2];
                    if (tarFolder.startsWith("GUEST")) {
                        tarFolder = "_" + tarFolder + "__" + this.tabletID;
                    }
                    dstPath = Utils_1.Utils.validatePath(dst, tarFolder);
                    zipPath = path.join(zipBase, srcArr[srcArr.length - 2]);
                    zipPath = zipPath.replace(/\\/g, "/") + "/";
                    // We do the files in a separate loop to ensure the folder
                    // is created before any of its enclosed files/folders
                    // 
                    this.unpackFiles(zipPath, dstPath);
                    this.unpackSubFolders(zipPath, dstPath, this.RECURSE);
                }
            }
        }
    }
    unpackUserAccts() {
        let acctPath = path.join(this.ZIP_ROOT, this.ACCT_FILENAME);
        let zipEntry = this.zipFile.getEntry(acctPath.replace("\\", "/"));
        if (zipEntry) {
            let outPath = path.join(this.cwd, this.USER_DATA);
            if (!this.zipFile.extractEntryTo(zipEntry, outPath, false, false)) {
                console.log("File Already Exists: " + outPath);
            }
            let oldPath = path.join(this.cwd, this.USER_DATA, zipEntry.name);
            let newPath = path.join(this.cwd, this.USER_DATA, this.tabletID + "__" + this.ACCT_FILENAME);
            fs.renameSync(oldPath, newPath);
        }
    }
    unpackTabletData(_tabletId, zipPath, dstPath) {
        let fpath = path.join(zipPath, this.ARCHIVE_FILENAME);
        this.tabletID = _tabletId;
        console.log("Processing Tablet: " + this.tabletID);
        try {
            this.zipFile = new AdmZip(fpath);
            this.zipEntries = this.zipFile.getEntries();
            this.zipEntry = this.zipFile.getEntry(this.ZIP_ROOT);
            if (this.zipEntry) {
                this.unpackUserAccts();
                this.unpackSubFolders(this.ZIP_ROOT, dstPath, this.RECURSE);
            }
        }
        catch (error) {
            console.log("Error = " + error);
        }
    }
}
exports.DataManager = DataManager;
//# sourceMappingURL=DataManager.js.map