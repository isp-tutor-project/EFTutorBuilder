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
const AdmZip = require("adm-zip");
const DataProcessor_1 = require("./DataProcessor");
const TCONST_1 = require("./TCONST");
class DataManager {
    constructor(_cwd) {
        this.dataFolders = new Array();
        this.fileSource = {};
        this.TABLET_BASE = "tablet_";
        this.ARCHIVE_FILENAME = "isp_userdata.zip";
        this.TUTORSTATE = "tutorstatedata.json";
        this.ACCT_FILENAME = "isp_userdata.json";
        this.GLOBALSTATE = "tutor_state.json";
        this.ZIP_ROOT = "EdForge_DATA/";
        this.USER_DATA = "EdForge_USERDATA/";
        this.PROC_DATA = "EdForge_PROCDATA/";
        this.MERGE_DATA = "EdForge_MERGEDATA/";
        this.DUPLICATE = "DUPLICATE";
        this.USERDATA_VERSION1 = "1.0.0";
        this.RECURSE = true;
        this.NORECURSE = false;
        this.acctImages = []; // account for each tablet 
        this.stateImages = []; // state data for each tablet
        this.mergedAccts = {
            "version": this.USERDATA_VERSION1,
            "userLogins": [],
            "users": []
        };
        this.tabletAcctXref = {};
        this.cwd = _cwd;
    }
    extractTutorData() {
        this.loadStateImage();
        this.loadMergedAccts();
        this.resolveExtractData();
    }
    mergeUserAccts() {
        this.loadResolveAccts();
        // Save the merged account database.
        // 
        this.saveMergedAcctImage();
    }
    loadResolveAccts() {
        this.loadStateImage();
        this.loadAcctImages();
        this.resolveAccts();
    }
    // load beta1 tutorstatedata.json image
    // 
    loadStateImage() {
        let stateData = path.join(this.cwd, this.USER_DATA, this.TUTORSTATE);
        this.state = JSON.parse(fs.readFileSync(stateData));
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
        let dataPath = path.join(this.cwd, this.MERGE_DATA, this.ACCT_FILENAME);
        let dataUpdate = JSON.stringify(this.mergedAccts, null, '\t');
        fs.writeFileSync(dataPath, dataUpdate, 'utf8');
    }
    // transfer the users tutor state info to a user id named folder in the common merge
    // image that may be loaded to the tablet EdForge_USERDATA path. This is just the state
    // data and does not include the log data.
    // 
    // NOTE!!! any merge conflicts should be resolved before this is processed - merge conflicts
    // occur when a user logs into more than one tablet 
    //
    mergeTutorStateData() {
        for (let user of this.mergedAccts.users) {
            let tutorStateData = path.join(this.cwd, this.USER_DATA, user.userName, this.GLOBALSTATE);
            let mergeStateData = path.join(this.cwd, this.MERGE_DATA, user.userName, this.GLOBALSTATE);
            this.validatePath(this.cwd, this.MERGE_DATA);
            this.validatePath(path.join(this.cwd, this.MERGE_DATA), user.userName);
            try {
                fs.copyFileSync(tutorStateData, mergeStateData);
            }
            catch (err) {
                console.log("ERROR: file transfer error " + err);
            }
        }
    }
    resolveAccts() {
        // Each tablet has a set of user accounts some new - some old - they may not all be
        // extant on all tablets. We need to merge these into a single image so any user
        // can login to any tablet to continue.
        // 
        for (let tablet of this.acctImages) {
            // Check for data spec version - beta1 had no version id we had to parse the currScene to 
            // determine tablet users
            // 
            if (tablet.version) {
                // version 1 uses the userLogin array to determine tablet users
                // 
                switch (tablet.version) {
                    case this.USERDATA_VERSION1:
                        break;
                }
            }
            else {
                // enumerate the users to find individuals that used this tablet. In the Beta this is 
                // the best means to identify tablets that were actually used.
                //             
                for (let user of tablet.users) {
                    if (user.currScene != "") {
                        if (this.tabletAcctXref[user.userName]) {
                            console.log("MERGE CONFLICT: " + user.userName + " - " + this.tabletAcctXref[user.userName] + " : " + tablet.tabletId);
                        }
                        else
                            this.tabletAcctXref[user.userName] = tablet.tabletId;
                        // Tag the users Tablet Id for data processing
                        // 
                        user.tabletId = tablet.tabletId;
                        this.mergedAccts.users.push(user);
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
                            this.acctImages.push(accts);
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
        let processor = new DataProcessor_1.DataProcessor();
        let userCond;
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
                            let dstPath = this.validatePath(this.cwd, this.PROC_DATA);
                            processor.extractData(_srcpath, dstPath, user, userCond, tutorInst);
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
    }
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
    validatePath(basePath, folder) {
        let pathArray = basePath.split("\\");
        let fPath;
        try {
            let stat = fs.statSync(basePath);
            if (stat.isDirectory) {
                if (folder) {
                    fPath = path.join(basePath, folder);
                    if (!fs.existsSync(fPath)) {
                        fs.mkdirSync(fPath);
                    }
                }
            }
        }
        catch (err) {
            let last = pathArray.pop();
            this.validatePath(pathArray.join("\\"), last);
            if (folder)
                fs.mkdirSync(basePath + "\\" + folder);
        }
        return fPath;
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
                    dstPath = this.validatePath(dst, tarFolder);
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