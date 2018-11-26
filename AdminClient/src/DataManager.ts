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

const fs            = require('fs');
const path          = require('path');

import AdmZip = require("adm-zip");

import { userData, 
         stateData, 
         userState }        from "./IAcctData";
import { DataProcessor }    from "./DataProcessor";

import { TCONST }           from "./TCONST";



export class DataManager
{
    private cwd:string;
    private dataFolders:Array<string> = new Array<string>();
    private tabletID:string;
    private fileSource:any = {};

    private zipFile:AdmZip;
    private zipEntry:AdmZip.IZipEntry;
    private zipEntries:AdmZip.IZipEntry[];

    private readonly TABLET_BASE:string         = "tablet_";
    private readonly ARCHIVE_FILENAME:string    = "isp_userdata.zip";

    private readonly TUTORSTATE:string          = "tutorstatedata.json";
    private readonly ACCT_FILENAME:string       = "isp_userdata.json";
    private readonly GLOBALSTATE:string         = "tutor_state.json";

    private readonly ZIP_ROOT:string            = "EdForge_DATA/";
    private readonly USER_DATA:string           = "EdForge_USERDATA/";
    private readonly PROC_DATA:string           = "EdForge_PROCDATA/";
    private readonly MERGE_DATA:string          = "EdForge_MERGEDATA/";

    private readonly DUPLICATE:string           = "DUPLICATE";
    private readonly USERDATA_VERSION1:string   = "1.0.0";

    private readonly RECURSE:boolean            = true;
    private readonly NORECURSE:boolean          = false;

    private acctImages:userData[] = [];     // account for each tablet 
    private accts:userData;

    private stateImages:stateData[] = [];   // state data for each tablet
    private state:stateData;

    private mergedAccts:userData = {
                                    "version":this.USERDATA_VERSION1,
                                    "userLogins":[],
                                    "users":[]
                                };

    private tabletAcctXref:any = {};                                    



    constructor(_cwd:string) {

        this.cwd = _cwd;
    }
    

    public extractTutorData() {

        this.loadStateImage();
        this.loadMergedAccts();

        this.resolveExtractData();

    }

    public mergeUserAccts() {

        this.loadResolveAccts();

        // Save the merged account database.
        // 
        this.saveMergedAcctImage();

    }
    

    private loadResolveAccts() {

        this.loadStateImage();
        this.loadAcctImages();

        this.resolveAccts();

    }    


    // load beta1 tutorstatedata.json image
    // 
    private loadStateImage() {

        let stateData:string = path.join(this.cwd, this.USER_DATA, this.TUTORSTATE);  

        this.state = JSON.parse(fs.readFileSync(stateData));
    }

    private getUserState(userName:string) : userState {

        let result:userState = null;

        for(let user of this.state.users) {

            if(user.userName === userName) {

                result = user;
                break;
            }
        }

        return result;
    }


    // load beta1 tutorstatedata.json image
    // 
    private loadMergedAccts() {

        let acctData:string = path.join(this.cwd, this.MERGE_DATA, this.ACCT_FILENAME);  

        this.mergedAccts = JSON.parse(fs.readFileSync(acctData));
    }


    // load beta1 tutorstatedata.json image
    // 
    private saveMergedAcctImage() {

        // We don't want tablet ID's in the merge image
        // TODO: use this in V1 merged accounts
        // Having the Tablet ID makes it easier to find the user data
        // 
        for(let user of this.mergedAccts.users) {
            // delete user.tabletId;
        }

        let dataPath:string = path.join(this.cwd, this.MERGE_DATA, this.ACCT_FILENAME);  

        let dataUpdate:string = JSON.stringify(this.mergedAccts, null, '\t');
    
        fs.writeFileSync(dataPath, dataUpdate, 'utf8');
    }


    // transfer the users tutor state info to a user id named folder in the common merge
    // image that may be loaded to the tablet EdForge_USERDATA path. This is just the state
    // data and does not include the log data.
    // 
    // NOTE!!! any merge conflicts should be resolved before this is processed - merge conflicts
    // occur when a user logs into more than one tablet 
    //
    private mergeTutorStateData() {

        for(let user of this.mergedAccts.users) {
            
            let tutorStateData:string  = path.join(this.cwd, this.USER_DATA, user.userName, this.GLOBALSTATE);  
            let mergeStateData:string = path.join(this.cwd, this.MERGE_DATA, user.userName, this.GLOBALSTATE);  

            this.validatePath(this.cwd, this.MERGE_DATA );
            this.validatePath(path.join(this.cwd, this.MERGE_DATA), user.userName );

            try {
                fs.copyFileSync(tutorStateData,mergeStateData);
            }
            catch(err) {
                console.log("ERROR: file transfer error " + err);
            }
        }
    }


    private resolveAccts() {

        // Each tablet has a set of user accounts some new - some old - they may not all be
        // extant on all tablets. We need to merge these into a single image so any user
        // can login to any tablet to continue.
        // 
        for(let tablet of this.acctImages) {

            // Check for data spec version - beta1 had no version id we had to parse the currScene to 
            // determine tablet users
            // 
            if(tablet.version) {

                // version 1 uses the userLogin array to determine tablet users
                // 
                switch(tablet.version) {
                    case this.USERDATA_VERSION1:

                    break;
                }
            }
            else {
                // enumerate the users to find individuals that used this tablet. In the Beta this is 
                // the best means to identify tablets that were actually used.
                //             
                for(let user of tablet.users) {

                    if(user.currScene != "") {

                        if(this.tabletAcctXref[user.userName]) {

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
    private loadAcctImages() {

        let userDataFolder:string  = path.join(this.cwd, this.USER_DATA);  

        try {

            let folder:Array<string> = fs.readdirSync(userDataFolder);

            for(let entry of folder) {

                // If this looks like a user account file process it
                // 
                if(entry.startsWith(this.TABLET_BASE)) {
                    
                    let _path = path.join(userDataFolder, entry);  

                    try {
                        let stats:any = fs.statSync(_path);

                        // If it is a folder check it for user data
                        // 
                        if(!stats.isDirectory()) {

                            let accts:userData = JSON.parse(fs.readFileSync(_path));

                            let match:string[] = entry.match(/tablet_\d*/);                            

                            if(match.length > 0)
                                accts.tabletId = match[0];

                            this.acctImages.push(accts);
                        }
                    }
                    catch(error) {

                        console.log("Error = " + error);
                    }
                }
            };
        }
        catch(error) {
            console.log("Error = " + error);
        }

        return this.dataFolders;
    }


    public resolveExtractData() {

        let processor:DataProcessor = new DataProcessor();
        let userCond:string;

        // We don't want tablet ID's in the merge image
        // TODO: use this in V1 merged accounts
        for(let user of this.mergedAccts.users) {

            let srcPath:string = path.join(this.cwd, this.USER_DATA, user.userName);      
            let state:userState = this.getUserState(user.userName);

            if(state) {
                userCond = state.tutorState["experimentalGroup.ontologyKey"];
            }
            else {
                console.log("ERROR: user State Invalid: " + user.userName);
                throw("invalid user state");
            }

            try {
                let files:Array<string> = fs.readdirSync(srcPath);
    
                for(let folder of files) {
                            
                    let _srcpath:string = path.join(srcPath, folder);  

                    try {
                        let stats:any = fs.statSync(_srcpath);

                        // If it is a folder it is assumed to be a tutor log 
                        // folder
                        // 
                        if(stats.isDirectory()) {

                            // decompose the tutor / school 
                            // 
                            let tutorInst:string[] = folder.match(/(\w*)_(\w*)/);
                            let dstPath:string     = this.validatePath(this.cwd, this.PROC_DATA);

                            processor.extractData(_srcpath, dstPath, user, userCond, tutorInst);
                        }
                        // the only "file" that should be in this folder is tutor_state.json
                        // we ignore it here.
                    }
                    catch(error) {

                        console.log("resolveExtractTutors - Error = " + error);
                    }
                }
            }
            catch(error) {
                console.log("resolveExtractTutors - Error = " + error);
            }    
        }
    }


    public unpackData(src:string, dst:string) : Array<string>{

        let srcPath:string = path.join(this.cwd, src);  
        let dstPath:string = path.join(this.cwd, dst);  

        try {
            let files:Array<string> = fs.readdirSync(srcPath);

            for(let folder of files) {

                // If this looks like a tablet folder then process it
                // 
                if(folder.startsWith(this.TABLET_BASE)) {
                    
                    let _path = path.join(srcPath, folder);  

                    try {
                        let stats:any = fs.statSync(_path);

                        // If it is a folder check it for user data
                        // 
                        if(stats.isDirectory()) {

                            this.unpackTabletData(folder, _path, dstPath);
                        }
                    }
                    catch(error) {

                        console.log("Error = " + error);
                    }
                }
            }
        }
        catch(error) {
            console.log("Error = " + error);
        }

        return this.dataFolders;
    }

    private validatePath(basePath:string, folder:string) : string {

        let pathArray:Array<string> = basePath.split("\\");
        let fPath:string;
    
        try {
            let stat = fs.statSync(basePath);
    
            if(stat.isDirectory) {
    
                if(folder) {
                    fPath = path.join(basePath,folder);

                    if(!fs.existsSync(fPath)) {
                        fs.mkdirSync(fPath);
                    }
                }
            }
        }
        catch(err) {
    
            let last = pathArray.pop();
            this.validatePath(pathArray.join("\\"), last);
    
            if(folder)
                fs.mkdirSync(basePath + "\\" + folder);
        }

        return fPath;
    }    
    

    private unpackFiles(src:string, dstPath:string) {

        let srcPath:string;
        let tarPath:string;
        let dupNotification:boolean = false;

        for(let entry of this.zipEntries) {

            if(!entry.isDirectory) {

                srcPath = path.dirname(entry.entryName) + "/";

                if(srcPath === src) {

                    tarPath   = path.join(dstPath, entry.name);

                    // Check for duplicate entries
                    // 
                    if(this.fileSource[tarPath]) {

                        // When finding the first duplicate, we rename the existing file
                        // with the tablet ID appended which is found in the fileSource entry
                        // 
                        // if(this.fileSource[tarPath] !== this.DUPLICATE) {

                        //     let oldPath = path.join(dstPath, entry.name);
                        //     let newName = entry.name + "__" + this.fileSource[tarPath];
                        //     let newPath = path.join(dstPath, newName);

                        //     fs.renameSync(oldPath, newPath);
                        // }

                        if(!dupNotification) {
                            dupNotification = true;

                            let pathParts:string[] = srcPath.split("/");
                            let dupTutor:string    = pathParts[1] + "|" + pathParts[2];

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
                        let namePart:string[] = entry.name.match(/\w*\d*_*\d*/);

                        let oldPath = path.join(dstPath, entry.name);
                        let newPath = path.join(dstPath, namePart[0] + "__" + this.tabletID + TCONST.JSONTYPE);
                        
                        fs.renameSync(oldPath, newPath);

                    }
                    catch(err) {
                        // This should never happen
                        // 
                        console.log("ERROR EXTRACTING FILE: " + dstPath);                        
                    }
                }
            }
        }
    }


    private unpackSubFolders(zipBase:string, dst:string, recurse:boolean) {

        let srcPath:string;
        let dstPath:string;
        let zipPath:string;
        let srcArr:string[];

        for(let entry of this.zipEntries) {

            // trim the filename or last folder name off entryName
            //
            srcPath = path.dirname(entry.entryName) + "/";

            // If this matches the target folder process the file
            // ( and folders if we are recursing)
            // 
            if(srcPath === zipBase) {
                
                if(entry.isDirectory && recurse) {

                    srcArr = entry.entryName.split("/");

                    let tarFolder:string = srcArr[srcArr.length-2];

                    if(tarFolder.startsWith("GUEST")) {
                        tarFolder = "_" + tarFolder + "__" + this.tabletID;
                    }

                    dstPath = this.validatePath(dst, tarFolder);
                    zipPath = path.join(zipBase, srcArr[srcArr.length-2]);
                    zipPath = zipPath.replace(/\\/g,"/") + "/";

                    // We do the files in a separate loop to ensure the folder
                    // is created before any of its enclosed files/folders
                    // 
                    this.unpackFiles(zipPath, dstPath);

                    this.unpackSubFolders(zipPath, dstPath, this.RECURSE);
                }
            }
        }
    }

    private unpackUserAccts() {

        let acctPath:string = path.join(this.ZIP_ROOT, this.ACCT_FILENAME);
        let zipEntry:AdmZip.IZipEntry = this.zipFile.getEntry(acctPath.replace("\\","/"));

        if(zipEntry) {

            let outPath = path.join(this.cwd, this.USER_DATA);
            if(!this.zipFile.extractEntryTo(zipEntry, outPath, false, false)) {
                console.log("File Already Exists: " + outPath);
            }

            let oldPath = path.join(this.cwd, this.USER_DATA, zipEntry.name);
            let newPath = path.join(this.cwd, this.USER_DATA, this.tabletID + "__" + this.ACCT_FILENAME);

            fs.renameSync(oldPath, newPath);
        }
    }

    private unpackTabletData(_tabletId:string, zipPath:string, dstPath:string) : void {

        let fpath:string = path.join(zipPath, this.ARCHIVE_FILENAME);          

        this.tabletID = _tabletId;

        console.log("Processing Tablet: " + this.tabletID);

        try {
            this.zipFile    = new AdmZip(fpath);
            this.zipEntries = this.zipFile.getEntries(); 

            this.zipEntry = this.zipFile.getEntry(this.ZIP_ROOT);

            if(this.zipEntry) {

                this.unpackUserAccts();
                this.unpackSubFolders(this.ZIP_ROOT, dstPath, this.RECURSE);
            }
        }
        catch(error) {
            console.log("Error = " + error);
        }
    }






}
    