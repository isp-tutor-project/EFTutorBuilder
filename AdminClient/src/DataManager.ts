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
const readline      = require('readline');

import AdmZip = require("adm-zip");

import { userData, 
         stateData, 
         userState, 
         acctData}        from "./IAcctData";
import { DataProcessor }    from "./DataProcessor";

import { TCONST }           from "./TCONST";
import { Utils } from "./Utils";
import { isError } from "util";
import { ENGINE_METHOD_STORE } from "constants";



export class DataManager
{
    private cwd:string;
    private dataFolders:Array<string> = new Array<string>();
    private tabletID:string;
    private fileSource:any = {};
    private mergeErrors:number;
    private statedata:any = {"users":[]};

    private zipFile:AdmZip;
    private zipEntry:AdmZip.IZipEntry;
    private zipEntries:AdmZip.IZipEntry[];

    private readonly TABLET_BASE:string         = "tablet_";
    private readonly ARCHIVE_FILENAME:string    = "Alldata.zip";

    private readonly TUTORSTATE:string          = "tutorstatedata.json";
    private readonly ACCT_FILENAME:string       = "isp_userdata.json";
    private readonly GLOBALSTATE:string         = "tutor_state.json";
    private readonly ONTOLOGYSRC:string         = "_EFTUTORDATA.json";

    private readonly ZIP_ROOT:string            = "EdForge_DATA/";
    private readonly USER_DATA:string           = "EdForge_USERDATA/";
    private readonly PROC_DATA:string           = "EdForge_PROCDATA/";
    private readonly MERGE_DATA:string          = "EdForge_MERGEDATA/";

    private readonly DUPLICATE:string           = "DUPLICATE";
    private readonly USERDATA_VERSION1:string   = "1.0.0";

    private readonly RECURSE:boolean            = true;
    private readonly NORECURSE:boolean          = false;

    private ontology:any;
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
    

    // Unpack the alldata.zip for each tablet in the EdForge_ZIPDATA folder into the 
    // EdForge_USERDATA folder.  This gives us all the user data in discrete folders.
    // 
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

    public assignInstruction(csvName:String) {

        let srcPath:string = path.join(this.cwd, this.USER_DATA, csvName);  
        let count = 0;
        let username;

        this.loadMergedAccts();
        this.statedata = {"users":[]};

        var lineReader = readline.createInterface({
            input: require('fs').createReadStream(srcPath),
            crlfDelay: Infinity
        });
          
        lineReader.on('line', (line:string) => {
            let packet:string[] = line.split(",");
            count++;

            let name1:string[]   = packet[0].match(/\w+/);
            let name2:string[]   = packet[1].match(/\w+/);
            let month:string[]   = packet[2].match(/\w+/);
            let cond:string[]    = packet[8].match(/\w+/);
            let subcond:string[] = packet[9].match(/\w+/);

            let features:string;
            let instruction:string;

            if(!cond[0].toUpperCase().startsWith("HS")) {

                switch(cond[0]) {
                    case "C":
                    features    = "FTR_CHOICE";
                    instruction = "tutor_seq_DL_CHOICE.json";
                    break;

                    case "NC":
                    features  = "FTR_NOCHOICE";

                    if(subcond[0].toUpperCase().startsWith("GR")) {
                        features += ":FTR_NCPLANTS";    
                        instruction = "tutor_seq_DL_NOCHOICE_PLANTS.json";
                    }
                    else {
                        features += ":FTR_NCSODA";
                        instruction = "tutor_seq_DL_NOCHOICE_SODA.json";
                    }
                    break;

                    case "BL":
                    features  = "FTR_BASELINE";

                    if(subcond[0].toUpperCase().startsWith("GR")) {
                        features += ":FTR_NCPLANTS";    
                        instruction = "tutor_seq_DL_BASELINE_PLANTS.json";
                    }
                    else {
                        features += ":FTR_NCSODA";
                        instruction = "tutor_seq_DL_BASELINE_SODA.json";
                    }                    
                    break;

                    default:
                        console.log("ERROR: Format Violation.")
                        break;
                }

                username = name1[0].toUpperCase() + name2[0].slice(0,2).toUpperCase() + "_" + month[0].slice(0,3).toUpperCase() + "_" + packet[3];

                this.statedata.users.push({
                    "comment":"this is for xref only",
                    "userName": username,
                    "instruction": instruction
                });

                console.log(username + (username.length < 16? "\t\t":"\t") + instruction + (instruction.length < 33? "\t\t":"\t") + features );
            }
            else {
                username = name1[0].toUpperCase() + name2[0].slice(0,2).toUpperCase();

                if(month) { 
                  username += "_" + month[0].slice(0,3).toUpperCase() + "_" + packet[3];
                }

                instruction = "MASTERY";
                features    = "";

                this.statedata.users.push({
                    "comment":"this is for xref only",
                    "userName": username,
                    "instruction": instruction
                });

                console.log(username + "_MASTERY");
            }
        });

        lineReader.on('close', () => {
            console.log("EOF: " + count);

            let dataPath:string = path.join(this.cwd, this.USER_DATA, this.TUTORSTATE);  

            let dataUpdate:string = JSON.stringify(this.statedata, null, '\t');
        
            fs.writeFileSync(dataPath, dataUpdate, 'utf8');

            this.xrefSetConditions();

            // Finally save the merge and updated account image.
            // 
            this.saveMergedAcctImage();
        });
    }   

    private xrefSetConditions() {

        for(let merge of this.mergedAccts.users) {

            let match = this.findStateDataByName(merge.userName);

            if(match) {
                merge.currSessionNdx = 0;   // one time only - we are adding this to the image posthoc
                merge.instructionSeq = match.instruction;
            }
            else {
                console.log("ERROR: User Not Found: " + merge.userName);
            }
        }

        this.listMissingClassMatches();
    }
    private listMissingClassMatches() : any {

        let result:any;

        for(let user of this.statedata.users) {

            if(!user.matched) {
                console.log("ERROR: Class List Entry Not Found: " + user.userName);
            }
        }

        return result;
    }

    private findStateDataByName(userName:string) : any {

        let result:any;

        for(let user of this.statedata.users) {

            if(user.userName === userName) {
                user.matched = true;
                result       = user;
                break;
            }
        }

        return result;
    }



    public extractTutorData() {

        this.loadStateImage();
        this.loadMergedAccts();
        this.loadOntologyImage();

        this.resolveExtractData();
    }

    public mergeUserAccts() {

        this.mergeErrors = 0;
        this.loadResolveAccts();

        // Save the merged account database.
        // 
        this.saveMergedAcctImage();
        if(this.mergeErrors === 0) {
            this.mergeTutorStateData();

            console.log("\n\n***********************************************");
            console.log("MERGE COMPLETE!\n\n");
        }
        else {
            console.log("ERROR: Merge Conflicts exist - Correct and retry merge.");
        }

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

    private loadOntologyImage() {

        let ontologyData:string = path.join(this.cwd, this.USER_DATA, this.ONTOLOGYSRC);  

        this.ontology = JSON.parse(fs.readFileSync(ontologyData));
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

        Utils.validatePath(this.cwd, this.MERGE_DATA);

        let dataPath:string = path.join(this.cwd, this.MERGE_DATA, this.ACCT_FILENAME);  

        let dataUpdate:string = JSON.stringify(this.mergedAccts, null, '\t');
    
        fs.writeFileSync(dataPath, dataUpdate, 'utf8');
    }


    private copyFolder(src:string, dest:string, recurse:boolean) {

        try {
            var folderList = fs.readdirSync(src);
    
            for(let entry of folderList) {
    
                var filePath = path.join(src, entry);
                var stat = fs.statSync(filePath);
                
                if(stat.isDirectory()) {

                    // copy recursively
                    if(recurse) {
                        fs.mkdirSync(path.join(dest,entry));

                        this.copyFolder(path.join(src,entry),path.join(dest,entry), recurse);
                    }

                } else {
                    // copy filename
                    fs.copyFileSync(path.join(src,entry),path.join(dest,entry));
                }
            }
        }
        catch(err) {
            console.log("ERROR: Copying User Data Folder: " + err);
        }
    }


    // transfer the users tutor state info to a "user-id" named folder in the common merge
    // image that may be loaded to the tablet EdForge_DATA path. 
    // 
    // NOTE!!! any merge conflicts should be resolved before this is processed - merge conflicts
    // occur when a user logs into more than one tablet 
    //
    private mergeTutorStateData() {

        for(let user of this.mergedAccts.users) {
            
            let tutorStateData:string  = path.join(this.cwd, this.USER_DATA, user.userName);  
            let mergeStateData:string = path.join(this.cwd, this.MERGE_DATA, user.userName);  

            Utils.validatePath(mergeStateData, null);

            this.copyFolder(tutorStateData, mergeStateData, true);
        }
    }


    private resolveAccts() {

        let userData:acctData;

        // Each tablet has a set of user accounts some new - some old - they may not all be
        // extant on all tablets. We need to merge these into a single image so any user
        // can login to any tablet to continue.
        // 
        for(let tablet of this.acctImages) {

            // Check for data spec version - beta1 had no version id we had to parse the currScene to 
            // determine tablet users
            // 
            if(tablet.tabletId) {

                // Enumerate the actual logins to tablets.
                // 
                for(let user of tablet.userLogins) {                    

                    // If we have already seen this user check for merge conflicts.
                    // 
                    if(this.tabletAcctXref[user.userName]) {

                        // If this isn't a duplicate login on this tablet it represents a conflict that must be resolved.
                        // 
                        if(this.tabletAcctXref[user.userName] !== tablet.tabletId) {
                            this.mergeErrors++;
                            console.log("MERGE CONFLICT: " + user.userName + " - " + this.tabletAcctXref[user.userName] + " : " + tablet.tabletId);
                        }
                        continue;
                    }                    
                    else 
                        this.tabletAcctXref[user.userName] = tablet.tabletId;

                    userData = null;

                    // Locate the user data for the login.  The user array keeps the actual student state info
                    // which is what we want to merge.  We throw away the userLogins.
                    // 
                    for(let entry of tablet.users) {

                        if(entry.userName === user.userName) {
                            userData = entry;
                            break;
                        }
                    }

                    // If the user state data is found we add it to the merged image
                    // 
                    if(userData) {
                        // Tag the users Tablet Id for data processing
                        // 
                        userData.tabletId = tablet.tabletId;
                        this.mergedAccts.users.push(userData);                        
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

        let processor:DataProcessor = new DataProcessor(this.ontology);
        let userCond:string;

        // We aggregate all users into a single file.
        // 
        let dstPath:string     = Utils.validatePath(this.cwd, this.PROC_DATA);
        processor.createDataTarget(dstPath);

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

                            processor.setUserPath(user.userName, folder);
                            processor.extractData(_srcpath, user, userCond, tutorInst);
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

        processor.closeDataTarget();

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

                    dstPath = Utils.validatePath(dst, tarFolder);
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
    