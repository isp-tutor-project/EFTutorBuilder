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
const constants_1 = require("constants");
const TData_DR_1 = require("./TData_DR");
const TData_MATSPRE_1 = require("./TData_MATSPRE");
const TData_RQTED1_1 = require("./TData_RQTED1");
const TData_RQTED2_1 = require("./TData_RQTED2");
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
        this.ACCT_MASTERLIST = "masterAcctList.json";
        this.ZIP_ROOT = "EdForge_DATA/"; // Trailing / is required
        this.USER_DATA = "EdForge_USERDATA";
        this.PROC_DATA = "EdForge_PROCDATA";
        this.MERGE_DATA = "EdForge_MERGEDATA";
        this.MERGE_MASTER = "EdForge_MERGEMASTER";
        this.DUPLICATE = "DUPLICATE";
        this.USERDATA_VERSION1 = "1.0.0";
        this.RECURSE = true;
        this.NORECURSE = false;
        this.tabletImages = []; // account for each tablet 
        this.stateImages = []; // state data for each tablet
        this.daySuffix = ["_0", "_1", "_2"];
        this.mergedAccts = {
            "version": this.USERDATA_VERSION1,
            "userLogins": [],
            "users": []
        };
        this.tutorData = {};
        this.tutorFileSuffix = ["DEDR", "MATS", "RQTED"];
        this.tutorDataSpecs = [
            { "suffixIn": "DEDR", "suffixOut": "DEDR", "dataSpec": TData_DR_1.TData_DR.tutorDataSpec },
            { "suffixIn": "MATS", "suffixOut": "MATS", "dataSpec": TData_MATSPRE_1.TData_MATSPRE.tutorDataSpec },
            { "suffixIn": "RQTED", "suffixOut": "RQTED1", "dataSpec": TData_RQTED1_1.TData_RQTED1.tutorDataSpec },
            { "suffixIn": "RQTED", "suffixOut": "RQTED2", "dataSpec": TData_RQTED2_1.TData_RQTED2.tutorDataSpec }
        ];
        // private tutorFileNames:string[] = ["tutorstate_DEDR.json","tutorstate_MATS.json","tutorstate_RQTED.json"];                                
        // Map students to guest accounts
        // 
        this.guestFixups = {
            // Nov 30 DeerLake conflicts
            // 
            "_0": {},
            // Dec 3 DeerLake guest fixups
            // 
            "_1": {},
            // Dec 4 DeerLake guest fixups
            // 
            "_2": {}
        };
        // Map students to other student accounts - i.e. One student was logged in as another.
        // 
        this.userFixups = {
            // Nov 30 DeerLake conflicts
            // 
            "_0": {},
            // Dec 3 DeerLake guest fixups
            // 
            "_1": {},
            // Dec 4 DeerLake guest fixups
            // 
            "_2": {}
        };
        // resolve which tablet to use when students login on multiple tablets.
        // 
        this.conflictResolution = {
            // Nov 30 DeerLake conflicts
            // 
            "_0": {},
            // Dec 3 DeerLake conflicts
            // 
            "_1": {},
            // Dec 4 DeerLake conflicts
            // 
            "_2": {}
        };
        // Ignore tablets in their entirety
        // 
        this.ignoreTablet = {
            // Nov 30 DeerLake ignores
            // 
            "_0": {},
            // Dec 3 DeerLake ignores
            // 
            "_1": {},
            // Dec 4 DeerLake ignores
            // 
            "_2": {}
        };
        // Ignore tablets in their entirety
        // 
        this.ignoreArchive = {
            // Nov 30 DeerLake ignores
            // 
            "_0": {},
            // Dec 3 DeerLake ignores
            // 
            "_1": {},
            // Dec 4 DeerLake conflicts
            // 
            "_2": {},
        };
        // Ignore dormant accounts where students have used guest logins 
        this.ignoreDormant = {
            // Nov 30 DeerLake ignores
            // 
            "_0": {},
            // Dec 3 DeerLake ignores
            // 
            "_1": {
                // ABSENT
                "CARDELLHI_MAY_13": true
                // UNKNOWN USER
            },
            // Dec 4 DeerLake ignores
            // 
            // These were logged in as GUESTS again
            //
            "_2": {
            // ABSENT
            // UNKNOWN USER
            }
        };
        this.ignoreLogin = {
            // Nov 30 DeerLake ignores
            // 
            "_0": {
                "SAG_FEB_1": "tablet_14"
            },
            // Dec 3 DeerLake ignores
            // These accounts were all created in error instead of using GUEST accounts.        
            // 
            "_1": {},
            // Dec 4 DeerLake ignores
            // 
            "_2": {}
        };
        // Ignore dormant accounts where students have used guest logins 
        //
        this.ignoreMastery = {
            // mastery students
            "MATTHEWAD_OCT_30": true,
            "ROYCEBR_FEB_8": true,
            "BAILEYSM_SEP_27": true
        };
        // These ID's are equivalent (i.e. denote the same individual)
        // 
        this.IDConflict = {};
        this.activeAccounts = {
            // Nov 30 DeerLake ignores
            // 
            "_0": {},
            // Dec 3 DeerLake ignores
            // 
            "_1": {},
            // Dec 4 DeerLake conflicts
            // 
            "_2": {}
        };
        this.sessionAccountList = {
            // Nov 30 DeerLake ignores
            // 
            "_0": {},
            // Dec 3 DeerLake ignores
            // 
            "_1": {},
            // Dec 4 DeerLake conflicts
            // 
            "_2": {}
        };
        this.masterAccountList = {};
        this.cwd = _cwd;
    }
    // Unpack the alldata.zip for each tablet in the EdForge_ZIPDATA folder into the 
    // EdForge_USERDATA folder.  This gives us all the user data in discrete folders.
    // 
    unpackData(srcBase, dst) {
        // unpack each days data into a named folder.
        // 
        for (let daySfx of this.daySuffix) {
            let srcPath = path.join(this.cwd, srcBase + daySfx);
            let dstPath = path.join(this.cwd, dst + daySfx);
            console.log("\n\n***********************Unpacking Session: " + daySfx + "\n");
            try {
                // enumerate the EdForge_ZIPDATA_# (# = daySfx) folder to find "tablet_#" subfolders
                // containing tablet ZIP data  (alldata.zip)
                // 
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
                                this.unpackTabletData(daySfx, folder, _path, dstPath);
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
        }
        return this.dataFolders;
    }
    // Find (if present) the requested iteration of a tutors data set (repetition) 
    //
    getTutorIterationData(studentId, tutorSfx, iteration) {
        let data = null;
        for (let daySfx of this.daySuffix) {
            // If there is a dataset for this day then see if it is the iteration requested
            //
            if (this.tutorData[studentId] && this.tutorData[studentId][tutorSfx] && this.tutorData[studentId][tutorSfx][daySfx]) {
                if (iteration === 0) {
                    data = this.tutorData[studentId][tutorSfx][daySfx];
                    break;
                }
                else {
                    iteration--;
                }
            }
        }
        return data;
    }
    mergeUserAccts() {
        let forceMerge = false;
        let buildImages = true;
        if (buildImages) {
            // Merge each days data into a named folder.
            // 
            for (let daySfx of this.daySuffix) {
                this.mergeErrors = 0;
                this.loadResolveAccts(daySfx);
                // Save the merged account database.
                // 
                this.saveMergedAcctImage(daySfx);
                if (this.mergeErrors === 0 || forceMerge) {
                    console.log("\n\n***********************************************");
                    console.log("MERGING FOLDERS\n\n");
                    this.mergeTutorStateData(daySfx);
                    console.log("\n\n***********************************************");
                    console.log("MERGE COMPLETE!\n\n");
                }
                else {
                    console.log("ERROR: Merge Conflicts exist - Correct and retry merge.");
                }
            }
            // Combine the merge images into a single master image that includes data across days
            // 
            this.combineMergeImage();
            this.saveMasterAcctList();
        }
        this.loadMasterAcctList();
        this.loadOntologyImage();
        this.loadAllSessionData();
        let processor = new DataProcessor_1.DataProcessor(this.ontology);
        // We aggregate all users into a single file.
        // 
        let dstPath = Utils_1.Utils.validatePath(this.cwd, this.PROC_DATA);
        // We have at most daySuffix versions of some user data - if they repeated everything every day of the
        // study.
        // 
        for (let iteration = 0; iteration < 3; iteration++) {
            for (let tutorDataEntry of this.tutorDataSpecs) {
                let tutorDataFile = path.join(this.cwd, this.PROC_DATA, "tutordata_" + tutorDataEntry.suffixOut + "_" + iteration + ".csv");
                let genFile = processor.createDataTarget(tutorDataFile);
                let masterDataFile = path.join(this.cwd, this.PROC_DATA, "masterydata_" + tutorDataEntry.suffixOut + "_" + iteration + ".csv");
                let masFile = processor.createDataTarget(masterDataFile);
                for (let studentId in this.masterAccountList) {
                    if (!this.ignoreMastery[studentId]) {
                        let tutorIterationData = this.getTutorIterationData(studentId, tutorDataEntry.suffixIn, iteration);
                        if (tutorIterationData)
                            processor.extractTutorStateData(genFile, tutorDataEntry.dataSpec, tutorIterationData, studentId, this.masterAccountList[studentId].condition);
                    }
                    else {
                        let tutorIterationData = this.getTutorIterationData(studentId, tutorDataEntry.suffixIn, iteration);
                        if (tutorIterationData)
                            processor.extractTutorStateData(masFile, tutorDataEntry.dataSpec, tutorIterationData, studentId, this.masterAccountList[studentId].condition);
                    }
                }
            }
        }
    }
    assignInstruction(csvName) {
        let srcPath = path.join(this.cwd, this.USER_DATA, csvName);
        let count = 0;
        let username;
        // unpack each days data into a named folder.
        // 
        for (let daySfx of this.daySuffix) {
            // TODO: fix this for daySfx
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
                this.saveMergedAcctImage(daySfx);
            });
        }
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
    // load beta1 masterAcctList.json image
    // 
    loadMasterAcctList() {
        let acctData = path.join(this.cwd, this.USER_DATA, this.ACCT_MASTERLIST);
        this.masterAccountList = JSON.parse(fs.readFileSync(acctData));
    }
    // load beta1 masterAcctList.json image
    // 
    saveMasterAcctList() {
        Utils_1.Utils.validatePath(this.cwd, this.USER_DATA);
        let dataPath = path.join(this.cwd, this.USER_DATA, this.ACCT_MASTERLIST);
        let dataUpdate = JSON.stringify(this.masterAccountList, null, '\t');
        fs.writeFileSync(dataPath, dataUpdate, 'utf8');
    }
    // load beta1 tutorstatedata.json image
    // 
    loadMergedAccts() {
        let acctData = path.join(this.cwd, this.MERGE_DATA, this.ACCT_FILENAME);
        this.mergedAccts = JSON.parse(fs.readFileSync(acctData));
    }
    // load beta1 tutorstatedata.json image
    // 
    saveMergedAcctImage(daySfx) {
        // We don't want tablet ID's in the merge image
        // TODO: use this in V1 merged accounts
        // Having the Tablet ID makes it easier to find the user data
        // 
        for (let user of this.mergedAccts.users) {
            // delete user.tabletId;
        }
        Utils_1.Utils.validatePath(this.cwd, this.MERGE_DATA + daySfx);
        let dataPath = path.join(this.cwd, this.MERGE_DATA + daySfx, this.ACCT_FILENAME);
        let dataUpdate = JSON.stringify(this.mergedAccts, null, '\t');
        fs.writeFileSync(dataPath, dataUpdate, 'utf8');
    }
    // load tutorstate_*.json image
    // 
    loadDataFile(srcPath) {
        let data = null;
        try {
            data = JSON.parse(fs.readFileSync(srcPath));
        }
        catch (err) {
            data = null;
        }
        return data;
    }
    // save tutorstate_*.json image
    // 
    saveDataFile(dst, data) {
        let dataUpdate = JSON.stringify(data, null, '\t');
        fs.writeFileSync(dst, dataUpdate, 'utf8');
    }
    loadSessionData(sessionFolder, daySfx) {
        var folderList = fs.readdirSync(sessionFolder);
        // Enumerate the user data folders for this session
        // 
        for (let studentId of folderList) {
            var filePath = path.join(sessionFolder, studentId);
            var stat = fs.statSync(filePath);
            //  Folders are assumed to be user account data folders
            // 
            if (stat.isDirectory()) {
                this.tutorData[studentId] = this.tutorData[studentId] || { "1stSession": daySfx };
                // Load all available tutordata for given student account - not all accounts will have all tutors
                // used on any particular day
                // 
                for (let tutorSfx of this.tutorFileSuffix) {
                    let tutorDataFile = path.join(sessionFolder, studentId, "tutorstate_" + tutorSfx + ".json");
                    let data = this.loadDataFile(tutorDataFile);
                    if (data) {
                        this.tutorData[studentId][tutorSfx] = this.tutorData[studentId][tutorSfx] || { "1stTutorSession": daySfx };
                        this.tutorData[studentId][tutorSfx][daySfx] = data;
                    }
                }
            }
        }
    }
    loadAllSessionData() {
        // Enumerate the sessions for the instruction - (i.e. the days instruction was given)
        // This corresponds to the merge-folders images.
        // 
        for (let daySfx of this.daySuffix) {
            let sessionFolder = path.join(this.cwd, this.MERGE_DATA + daySfx);
            console.log("Loading Session: " + daySfx);
            this.loadSessionData(sessionFolder, daySfx);
        }
    }
    combineUserFolder(src, dest, recurse) {
        var folderList = fs.readdirSync(src);
        let flags = 0; // default to destructive copying
        for (let entry of folderList) {
            var filePath = path.join(src, entry);
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                // copy recursively
                // 
                if (recurse) {
                    Utils_1.Utils.validatePath(path.join(dest, entry), null);
                    this.combineUserFolder(path.join(src, entry), path.join(dest, entry), recurse);
                }
            }
            else {
                try {
                    // Process the tutorstate data separately
                    // 
                    // if(!entry.startsWith("tutorstate")) {
                    fs.copyFileSync(path.join(src, entry), path.join(dest, entry), flags);
                    // }
                }
                catch (err) {
                    // Ignore dupliciates
                }
            }
        }
    }
    // transfer the users tutor state info to a "user-id" named folder in the common merge
    // image that may be loaded to the tablet EdForge_DATA path. 
    // 
    // NOTE!!! any merge conflicts should be resolved before this is processed - merge conflicts
    // occur when a user logs into more than one tablet 
    //
    combineMergeImage() {
        for (let i1 = this.daySuffix.length - 1; i1 >= 0; i1--) {
            console.log("Creating Merge Master:: " + this.daySuffix[i1]);
            // Copy the data in reverse day order without replacement - 
            //
            let mergePath = path.join(this.cwd, this.MERGE_DATA + this.daySuffix[i1]);
            var folderList = fs.readdirSync(mergePath);
            // Enumerate the user account folders in EdForge_MERGEMASTER.
            // 
            for (let entry of folderList) {
                let mergeDst = path.join(this.cwd, this.MERGE_MASTER, entry);
                let mergeSrc = path.join(this.cwd, this.MERGE_DATA + this.daySuffix[i1], entry);
                var stat = fs.statSync(mergeSrc);
                if (stat.isDirectory()) {
                    Utils_1.Utils.validatePath(mergeDst, null);
                    this.combineUserFolder(mergeSrc, mergeDst, true);
                }
                else {
                    // Do a non-destructive Copy 
                    // 
                    try {
                        fs.copyFileSync(mergeSrc, mergeDst, constants_1.COPYFILE_EXCL);
                    }
                    catch (err) {
                        // Ignore dupliciates
                    }
                }
            }
        }
    }
    copyFolder(user, src, dest, recurse) {
        var folderList = fs.readdirSync(src);
        var ignored = {};
        for (let entry of folderList) {
            var filePath = path.join(src, entry);
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                // copy recursively
                if (recurse) {
                    Utils_1.Utils.validatePath(path.join(dest, entry), null);
                    let ignore = this.copyFolder(user, path.join(src, entry), path.join(dest, entry), recurse);
                    Object.assign(ignored, ignore);
                }
            }
            else {
                // Decompose the filename to get 
                // 
                let reg = /(\w*)__(\w*)/;
                let nameParts = entry.match(reg);
                if (nameParts[1].includes("tablet")) {
                    console.log("Internal Error");
                }
                // Copy file image for a specific tablet:
                // Where there is a merge conflict we'll ignore all but the one selected to resolve
                // the conflict. i.e. There may be multiple named files from different tablets.
                // 
                if (user.tabletId === nameParts[2]) {
                    fs.copyFileSync(path.join(src, entry), path.join(dest, nameParts[1] + ".json"));
                }
                else {
                    ignored[nameParts[2]] = true;
                }
            }
        }
        return ignored;
    }
    // transfer the users tutor state info to a "user-id" named folder in the common merge
    // image that may be loaded to the tablet EdForge_DATA path. 
    // 
    // NOTE!!! any merge conflicts should be resolved before this is processed - merge conflicts
    // occur when a user logs into more than one tablet 
    //
    mergeTutorStateData(daySfx) {
        for (let user of this.mergedAccts.users) {
            let itablet = "";
            try {
                if (!this.ignoreDormant[daySfx][user.userName]) {
                    // Copy the data from the ORIGINAL data folder to the users named folder in 
                    // the merge image. n.b. Guest accounts etc are mapped to another user name.
                    //
                    let tutorStateData = path.join(this.cwd, this.USER_DATA + daySfx, user.userFolder);
                    let mergeStateData = path.join(this.cwd, this.MERGE_DATA + daySfx, user.userName);
                    Utils_1.Utils.validatePath(mergeStateData, null);
                    let ignored = this.copyFolder(user, tutorStateData, mergeStateData, true);
                    for (let ignore in ignored) {
                        if (itablet.length > 0)
                            itablet += ", ";
                        itablet += ignore;
                    }
                    console.log("User Merge Complete: " + user.userName + " :: From " + user.tabletId + ((itablet.length > 0) ? " :: Ignored " + itablet : ""));
                }
                else {
                    //  Silent ignore students that were absent
                }
            }
            catch (err) {
                console.log("Internal Error ***** merging:: " + user.userName + " :: " + err);
            }
        }
    }
    // Load all the isp_userdata.json files for all the tablets for a given day
    // 
    loadResolveAccts(daySfx) {
        // Load the this.tabletImages array with isp_userdata.json images for
        // each tablet
        // 
        this.loadAcctImages(daySfx);
        this.resolveAccts(daySfx);
    }
    resolveAccts(daySfx) {
        let userData;
        let rename = false;
        let newname = "";
        let condition = "";
        this.mergedAccts.users = [];
        this.mergedAccts.userLogins = [];
        // enumerate all known accounts.
        // 
        for (let tablet of this.tabletImages) {
            // Build a master account list across all the tablets.
            // 
            if (tablet.tabletId) {
                for (let user of tablet.users) {
                    this.masterAccountList[user.userName] = {};
                    if (!this.sessionAccountList[daySfx][user.userName]) {
                        this.sessionAccountList[daySfx][user.userName] = { "tablet": tablet.tabletId, "active": "" };
                    }
                }
            }
        }
        // Enumerate the tablet acct images - each tablet has a set of logins and associated 
        // user account state records
        // 
        for (let tablet of this.tabletImages) {
            // Build a master account list across all the tablets.
            // 
            if (tablet.tabletId) {
                let tabletLogins = {};
                // Enumerate all the logins for the given tablet.
                // 
                for (let user of tablet.userLogins) {
                    // Only process one login per user per tablet.
                    // 
                    if (!tabletLogins[user.userName]) {
                        tabletLogins[user.userName] = true;
                        // Resolve Guest account usages to student accounts.
                        // 
                        if (user.userName.startsWith("GUEST")) {
                            // If there is no resolution for the guest account - raise error
                            // i.e. there must be a mapping for the guest account login on the specific tablet.
                            // 
                            if (!(this.guestFixups[daySfx][user.userName] && this.guestFixups[daySfx][user.userName][tablet.tabletId]) && !this.ignoreTablet[daySfx][tablet.tabletId]) {
                                this.mergeErrors++;
                                console.log("WARNING: Unresolved Guest Account: " + user.userName + " used on: " + tablet.tabletId);
                            }
                        }
                        // Resolve normal user logins to a specific tablet image - check for conflicts in the process. i.e. logins on multiple 
                        // tablets that have no conflict resolution 
                        // 
                        else {
                            if (this.activeAccounts[daySfx][user.userName]) {
                                // If this isn't a duplicate login on this tablet it represents a conflict that must be resolved.
                                // 
                                if ((this.activeAccounts[daySfx][user.userName] !== tablet.tabletId) && !this.ignoreTablet[daySfx][tablet.tabletId]) {
                                    // If there is no resolution for the multiple-login - raise error
                                    // 
                                    if (!this.conflictResolution[daySfx][user.userName]) {
                                        this.mergeErrors++;
                                        console.log("WARNING: MERGE CONFLICT: " + user.userName + " - " + this.activeAccounts[daySfx][user.userName] + " : " + tablet.tabletId);
                                    }
                                }
                                continue;
                            }
                            else
                                this.activeAccounts[daySfx][user.userName] = tablet.tabletId;
                        }
                    }
                }
            }
        }
        console.log("\n\n*********************\nStarting Merge\n\n");
        // {"acctname":"guestnc_Jan_1",  "tablet":3,  "username":"briennesh_jan_1",},
        // guestFixups
        // Each tablet has a set of user accounts some new - some old - they may not all be
        // extant on all tablets. We need to merge these into a single image so any user
        // can login to any tablet to continue.
        // 
        for (let tablet of this.tabletImages) {
            // Check for data spec version - beta1 had no version id we had to parse the currScene to 
            // determine tablet users
            // 
            if (tablet.tabletId) {
                let tabletLogins = {};
                // Enumerate the actual logins to tablets.
                // 
                for (let user of tablet.userLogins) {
                    rename = false;
                    // Only process one login per user per tablet.
                    // 
                    if (!tabletLogins[user.userName]) {
                        tabletLogins[user.userName] = true;
                        if (this.ignoreMastery[user.userName]) {
                            // console.log("Ignoring Mastery Account: " + user.userName + " on " + tablet.tabletId);
                            // continue;
                            console.log("Mastery");
                        }
                        //  Resolve users logged in as another - rename login and user data record.
                        // 
                        else if (this.userFixups[daySfx][user.userName] && this.userFixups[daySfx][user.userName][tablet.tabletId]) {
                            rename = true;
                            newname = this.userFixups[daySfx][user.userName][tablet.tabletId].username.toUpperCase();
                            condition = this.userFixups[daySfx][user.userName][tablet.tabletId].condition;
                            console.log("Fixing Aliased Account: " + user.userName + " on: " + tablet.tabletId + " to: " + newname + " : " + condition);
                        }
                        // Resolve multiple login conflicts - Users logged into multuple tablets.
                        // Ignore all but one.
                        // 
                        else if (this.conflictResolution[daySfx][user.userName]) {
                            if (this.conflictResolution[daySfx][user.userName] !== tablet.tabletId) {
                                // console.log("Skipping Conflict: " + user.userName + " on: " + tablet.tabletId);
                                continue;
                            }
                            else {
                                // Resolve one copy - might be multiple logins by same user on tablet.
                                // 
                                console.log("Resolving Conflict: " + user.userName + " using: " + tablet.tabletId);
                                this.conflictResolution[daySfx][user.userName] = "done";
                            }
                        }
                        if (this.guestFixups[daySfx][user.userName]) {
                            if (this.guestFixups[daySfx][user.userName][tablet.tabletId]) {
                                if (this.guestFixups[daySfx][user.userName][tablet.tabletId].username.toUpperCase() !== "NONE") {
                                    rename = true;
                                    newname = this.guestFixups[daySfx][user.userName][tablet.tabletId].username.toUpperCase();
                                    condition = this.guestFixups[daySfx][user.userName][tablet.tabletId].condition;
                                    console.log("Fixing Guest Account::: " + user.userName + " on: " + tablet.tabletId + " to: " + newname + " : " + condition);
                                }
                                else {
                                    console.log("Skipping Unused Guest: " + user.userName + " on: " + tablet.tabletId);
                                    continue;
                                }
                            }
                            else
                                console.log("NOTICE: Skipping: " + user.userName + " on: " + tablet.tabletId);
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
                            // Tag the users Tablet Id for processing the folder merge
                            // 
                            userData.tabletId = tablet.tabletId;
                            if (rename) {
                                userData.userName = newname;
                                userData.instructionSeq = condition;
                                this.masterAccountList[newname] = {};
                                this.sessionAccountList[daySfx][newname] = { "tablet": tablet.tabletId, "active": "" };
                            }
                            // Skip Guest Accounts.
                            // 
                            if (userData.userName.startsWith("GUEST")) {
                                console.log("NOTICE: skipping GUEST: " + userData.userName + " on: " + tablet.tabletId);
                            }
                            // Note: Special processing - DEERE LAKE ONLY @@@@@@@@@@@@@@@@@@@ @@@@@@@@@@@@@@@@@@@@
                            // Skip created accounts on subsequent days.  default instruction was incorrect.
                            // 
                            // else if((daySfx !== "_0") && userData.instructionSeq === "tutor_seq_dayone.json") {
                            //     if(!this.ignoreMastery[user.userName] && !(this.ignoreLogin[daySfx][user.userName] && this.ignoreLogin[daySfx][user.userName] === tablet.tabletId)) {
                            //         console.log("WARNING: skipping bad Account Creation: " + userData.userName + " :: " +  userData.instructionSeq + " on: " + tablet.tabletId);
                            //     }
                            // }
                            else {
                                try {
                                    this.masterAccountList[userData.userName].active = true;
                                    this.masterAccountList[userData.userName].condition = userData.instructionSeq;
                                    this.masterAccountList[userData.userName][daySfx] = true;
                                    this.sessionAccountList[daySfx][userData.userName].active = true;
                                    this.mergedAccts.users.push(userData);
                                }
                                catch (err) {
                                    console.log("INTERNAL ERROR: MasterList Account Missing!: " + user.userName + " on: " + tablet.tabletId);
                                }
                            }
                        }
                        // Otherwise it represents a merge error which must be resolved
                        // 
                        else {
                            this.mergeErrors++;
                            console.log("ERROR: Account Missing!: " + user.userName + " on: " + tablet.tabletId);
                        }
                    }
                }
            }
            else {
                console.log("!!!!!!!!!!!!!!!!! ERROR: OLD VERSION FOUND");
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
                        if (this.ignoreMastery[user.userName]) {
                            // console.log("Ignoring Mastery Account: " + user.userName + " on " + tablet.tabletId);
                            continue;
                        }
                        // Only merge one copy of dormant accounts.
                        // 
                        if (!this.sessionAccountList[daySfx][user.userName].active) {
                            this.sessionAccountList[daySfx][user.userName].active = true;
                            if (!user.userName.startsWith("GUEST")) {
                                if (user.instructionSeq !== "tutor_seq_dayone.json") {
                                    if (this.ignoreDormant[daySfx][user.userName]) {
                                        console.log("Ignoring Dormant Account: " + user.userName + " on " + tablet.tabletId);
                                    }
                                    else {
                                        user.tabletId = tablet.tabletId;
                                        this.mergedAccts.users.push(user);
                                        console.log("Merging Dormant Account: " + user.userName + " on " + tablet.tabletId);
                                    }
                                }
                                else {
                                    if (!(this.ignoreLogin[daySfx][user.userName] && this.ignoreLogin[daySfx][user.userName] === tablet.tabletId)) {
                                        console.log("WARNING: Skipping Unresolved Account Error: " + user.userName + " :: " + user.instructionSeq + " on: " + tablet.tabletId);
                                    }
                                }
                            }
                            else {
                                // console.log("Skipping Guest Account: " + user.userName + " on: " + tablet.tabletId);
                            }
                        }
                    }
                    catch (err) {
                        // TODO : enumerate the fixups to ensure we didn't miss anything
                        // 
                        console.log("WARNING: Skipping Fixup: " + user.userName + " on " + tablet.tabletId + " ::: " + err);
                    }
                }
            }
        }
    }
    // Load all the tablet specific beta1 isp_userdata.json files into an array
    // 
    loadAcctImages(daySfx) {
        let userDataFolder = path.join(this.cwd, this.USER_DATA + daySfx);
        this.tabletImages = []; // reset the image 
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
                            // Keep a copy of the original source folder name for 
                            // the user data.  The USER may be renamed. e.g. it is a 
                            // guest account.  
                            //
                            for (let user of accts.users) {
                                user.userFolder = user.userName;
                            }
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
        // 
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
                            console.log("WARNING: DUPLICATE:: " + dupTutor + " : " + this.fileSource[tarPath] + " : " + this.tabletID);
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
                    // NOTE: Use file level labelling with tabletid instead of this
                    // 
                    // if(tarFolder.startsWith("GUEST")) {
                    //     tarFolder = "_" + tarFolder + "__" + this.tabletID;
                    // }
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
    //****************************************************
    //****************************************************
    //****************************************************
    // Unpacking tablet data.
    // 
    checkUserLogin(userID) {
        let result = false;
        for (let user of this.tabletAccts.userLogins) {
            if (user.userName === userID) {
                result = true;
                break;
            }
        }
        return result;
    }
    // load isp_userdata.json images 
    // 
    loadAcctImage(daySfx) {
        let acctData = path.join(this.cwd, this.USER_DATA + daySfx, this.ACCT_FILENAME);
        this.tabletAccts = JSON.parse(fs.readFileSync(acctData));
    }
    unpackUserData(zipBase, dst, recurse) {
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
                if (entry.isDirectory) {
                    srcArr = entry.entryName.split("/");
                    let userFolder = srcArr[srcArr.length - 2];
                    // Only process data from accts that were actually logged into on 
                    // this tablet image.
                    // 
                    if (this.checkUserLogin(userFolder)) {
                        // NOTE: Use file level labelling with tabletid instead of this
                        // 
                        // if(userFolder.startsWith("GUEST")) {
                        //     userFolder = "_" + userFolder + "__" + this.tabletID;
                        // }
                        dstPath = Utils_1.Utils.validatePath(dst, userFolder);
                        zipPath = path.join(zipBase, srcArr[srcArr.length - 2]);
                        zipPath = zipPath.replace(/\\/g, "/") + "/";
                        // We do the files in a separate loop to ensure the folder
                        // is created before any of its enclosed files/folders
                        // 
                        this.unpackFiles(zipPath, dstPath);
                        if (recurse)
                            this.unpackSubFolders(zipPath, dstPath, this.RECURSE);
                    }
                }
            }
        }
    }
    // Unpack the isp_userdata.json file from the tablet data image.
    // 
    unpackUserAccts(daySfx) {
        let acctPath = path.join(this.ZIP_ROOT, this.ACCT_FILENAME);
        let zipEntry = this.zipFile.getEntry(acctPath.replace("\\", "/"));
        if (zipEntry) {
            let outPath = path.join(this.cwd, this.USER_DATA + daySfx);
            Utils_1.Utils.validatePath(outPath, null);
            if (!this.zipFile.extractEntryTo(zipEntry, outPath, false, false)) {
                console.log("WARNING: File Already Exists: " + outPath);
            }
            // Load the Acct image so TabletUserAccts is available for 
            // checkUserLogin during unpackUserData
            //  
            this.loadAcctImage(daySfx);
            // Convert the filename to a tablet specific name - 
            // e.g  tablet_#__isp_userdata.json
            //
            // Each tablet contains account images (users array entries) for all students known from the previous days
            // work. along with guest account usages for the given tablet. 
            // (these must be converted to student named accounts).
            // 
            let oldPath = path.join(this.cwd, this.USER_DATA + daySfx, zipEntry.name);
            let newPath = path.join(this.cwd, this.USER_DATA + daySfx, this.tabletID + "__" + this.ACCT_FILENAME);
            fs.renameSync(oldPath, newPath);
        }
    }
    // Unpack the alldata.zip image for the given day on the given tablet
    // 
    unpackTabletData(daySfx, _tabletId, zipPath, dstPath) {
        let fpath = path.join(zipPath, this.ARCHIVE_FILENAME);
        this.tabletID = _tabletId;
        console.log("Unpacking Tablet: " + this.tabletID);
        // Selectively ignore tablets
        // 
        if (!this.ignoreArchive[daySfx][_tabletId]) {
            try {
                this.zipFile = new AdmZip(fpath);
                this.zipEntries = this.zipFile.getEntries();
                this.zipEntry = this.zipFile.getEntry(this.ZIP_ROOT);
                if (this.zipEntry) {
                    this.unpackUserAccts(daySfx);
                    this.unpackUserData(this.ZIP_ROOT, dstPath, this.RECURSE);
                }
            }
            catch (error) {
                console.log("Error = " + error);
            }
        }
        else {
            console.log("NOTICE: Ignoring tablet - " + _tabletId);
        }
    }
}
exports.DataManager = DataManager;
//# sourceMappingURL=DataManager.js.map