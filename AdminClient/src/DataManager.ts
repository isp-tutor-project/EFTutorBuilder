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

import { tabletData, 
         stateData, 
         userState, 
         acctData,
         TutorData}         from "./IAcctData";
import { DataProcessor }    from "./DataProcessor";

import { TCONST }           from "./TCONST";
import { Utils }            from "./Utils";
import { triggerAsyncId }   from "async_hooks";
import { isError }          from "util";
import { COPYFILE_EXCL }    from "constants";
import { TData_DR }         from "./TData_DR";
import { TData_MATSPRE }    from "./TData_MATSPRE";
import { TData_RQTED1 }     from "./TData_RQTED1";
import { TData_RQTED2 }     from "./TData_RQTED2";



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
    private readonly ACCT_MASTERLIST:string     = "masterAcctList.json";

    private readonly ZIP_ROOT:string            = "EdForge_DATA/";      // Trailing / is required
    private readonly USER_DATA:string           = "EdForge_USERDATA";
    private readonly PROC_DATA:string           = "EdForge_PROCDATA";
    private readonly MERGE_DATA:string          = "EdForge_MERGEDATA";
    private readonly MERGE_MASTER:string        = "EdForge_MERGEMASTER";

    private readonly DUPLICATE:string           = "DUPLICATE";
    private readonly USERDATA_VERSION1:string   = "1.0.0";

    private readonly RECURSE:boolean            = true;
    private readonly NORECURSE:boolean          = false;

    private ontology:any;
    private tabletImages:tabletData[] = [];     // account for each tablet 
    private accts:tabletData;

    private stateImages:stateData[] = [];   // state data for each tablet
    private state:stateData;

    private tabletAccts:tabletData;
    private daySuffix:string[] = ["_0","_1","_2"];

    private mergedAccts:tabletData = {
                                    "version":this.USERDATA_VERSION1,
                                    "userLogins":[],
                                    "users":[]
                                };

    private tutorData:any = {};

    
    private tutorFileSuffix:string[] = ["DEDR","MATS","RQTED"];          
    
    private tutorDataSpecs:any[] = [
        {"suffixIn":"DEDR", "suffixOut":"DEDR",   "dataSpec":TData_DR.tutorDataSpec},
        {"suffixIn":"MATS", "suffixOut":"MATS",   "dataSpec":TData_MATSPRE.tutorDataSpec},
        {"suffixIn":"RQTED","suffixOut":"RQTED1", "dataSpec":TData_RQTED1.tutorDataSpec},
        {"suffixIn":"RQTED","suffixOut":"RQTED2", "dataSpec":TData_RQTED2.tutorDataSpec}
    ];
    

    // private tutorFileNames:string[] = ["tutorstate_DEDR.json","tutorstate_MATS.json","tutorstate_RQTED.json"];                                
    
    // Map students to guest accounts
    // 
    private guestFixups:any = {

        // Nov 30 DeerLake conflicts
        // 
        "_0":{            
        },

        // Dec 3 DeerLake guest fixups
        // 
        "_1": {
            "GUESTNC_JAN_1": {"tablet_17": {"username":"jasonca_jan_1",      "condition":"tutor_seq_DL_BASELINE_SODA.json"}},
            "GUESTC_JAN_1":  {"tablet_11": {"username":"calebke_jan_1",      "condition":"tutor_seq_DL_BASELINE_SODA.json"},
                              "tablet_7":  {"username":"ericku_jan_1",       "condition":"tutor_seq_DL_BASELINE_SODA.json"},
                              "tablet_3":  {"username":"briennesh_jan_1",    "condition":"tutor_seq_DL_BASELINE_SODA.json"}},
            "GUESTC_JAN_2" : {"tablet_6":  {"username":"natalinatr_jan_1",   "condition":"tutor_seq_DL_BASELINE_SODA.json"}},
            "GUESTBL_JAN_2": {"tablet_5":  {"username":"genevieveza_jan_1",  "condition":"tutor_seq_DL_BASELINE_SODA.json"}},
            "GUESTBL_JAN_3": {"tablet_22": {"username":"laneybe_jan_1",      "condition":"tutor_seq_DL_BASELINE_SODA.json"}}
        },

        // Dec 4 DeerLake guest fixups
        // 
        "_2": {
            "GUESTBL_JAN_1": {"tablet_25": {"username":"briennesh_jan_2",  "condition":"tutor_seq_DL_BASELINE_SODA.json"},
                              "tablet_16": {"username":"ANGELOTR_jan_2",   "condition":"tutor_seq_DL_BASELINE_SODA.json"},
                              "tablet_28": {"username":"none",             "condition":""},
                              "tablet_3":  {"username":"none",             "condition":""}},

            "GUESTNC_JAN_1": {"tablet_5":  {"username":"ericku_jan_2",     "condition":"tutor_seq_DL_NOCHOICE_SODA.json"},
                              "tablet_31": {"username":"none",             "condition":""}},

            "GUESTC_JAN_1" : {"tablet_26": {"username":"natalinatr_jan_2", "condition":"tutor_seq_DL_CHOICE.json"}},

            "GUESTC_JAN_2" : {"tablet_14": {"username":"none",             "condition":""},
                              "tablet_26": {"username":"none",             "condition":""},
                              "tablet_29": {"username":"none",             "condition":""},
                              "tablet_7":  {"username":"none",             "condition":""}}
        }
    }                                


    // Map students to other student accounts - i.e. One student was logged in as another.
    // 
    private userFixups:any = {

        // Nov 30 DeerLake conflicts
        // 
        "_0":{            
        },

        // Dec 3 DeerLake guest fixups
        // 
        "_1": {
        },

        // Dec 4 DeerLake guest fixups
        // 
        "_2": {
            "ADAMSC_MAR_21" : {"tablet_12": {"username":"CALEBKE_FEB_17", "condition":"tutor_seq_DL_CHOICE_SODA.json"}}
        }
    }                                


    // resolve which tablet to use when students login on multiple tablets.
    // 
    private conflictResolution:any = {

        // Nov 30 DeerLake conflicts
        // 
        "_0":{            
        },

        // Dec 3 DeerLake conflicts
        // 
        "_1": {
            "TANNERHA_OCT_1":"tablet_10",
            "CALEBKE_FEB_17":"none",
            "STEPHSI_JAN_1":"none"
        },

        // Dec 4 DeerLake conflicts
        // 
        "_2": {
            "JASONCA_JAN_1":"tablet_3",
            "XANDERBA_OCT_19":"tablet_3",
            "ELIASHU_NOV_26":"tablet_3",
            "ANNAFU_OCT_12":"tablet_6",
            "COURTNEYOR_DEC_30":"tablet_7",

            "ADAMSC_MAR_21":"tablet_16",
            "ALTONCA_JUN_14":"tablet_12",
            "NICHOLASDE_JUN_18":"tablet_18",

            "ABIGAILAT_JUN_9":"tablet_16",
            "ABIGAILTH_MAR_7":"tablet_26",
            "ADENES_JUL_13":"tablet_19",
            "ALEXMC_OCT_12":"tablet_14",
            "ANNAHL_JAN_25":"tablet_14",
            "BRITTNEYSC_MAR_11":"tablet_24",
            "BROOKEDI_APR_26": "tablet_2",
            "BROOKEYU_JUN_11":"tablet_19",
            "CAROLYNMC_APR_19":"tablet_19",
            "COLINMA_APR_15":"tablet_12",
            "JACKZA_JUN_5":"tablet_27",
            "KAILEYME_DEC_24":"tablet_18",
            "KILEYBI_MAY_5":"tablet_11",
            "ZACHSA_OCT_5":"tablet_25",

            "GENEVIEVEZA_JAN_1":"tablet_23",
            "LANEYBE_JAN_1":"tablet_11",

            "GABRIELDA_JAN_28":"tablet_20",
            "MACKENZIEBU_JAN_7":"tablet_14",
            "AYDENST_APR_12":"tablet_8"
        }
    }


    // Ignore tablets in their entirety
    // 
    private ignoreTablet:any = {

        // Nov 30 DeerLake ignores
        // 
        "_0":{            
        },

        // Dec 3 DeerLake ignores
        // 
        "_1": {
        },

        // Dec 4 DeerLake ignores
        // 
        "_2": {
        }
    };

    // Ignore tablets in their entirety
    // 
    private ignoreArchive:any = {

        // Nov 30 DeerLake ignores
        // 
        "_0":{},

        // Dec 3 DeerLake ignores
        // 
        "_1":{},

        // Dec 4 DeerLake conflicts
        // 
        "_2":{},
    };

    // Ignore dormant accounts where students have used guest logins 
    private ignoreDormant:any = {

        // Nov 30 DeerLake ignores
        // 
        "_0":{
            "ERFGTT_FEB_1":true
        },

        // Dec 3 DeerLake ignores
        // 
        "_1":{
            // ABSENT
            "ROBBIEGU_APR_21":true,
            "BROOKEDI_APR_26":true,
            "ANGELOTR_DEC_14":true,
            "RYDERTA_JUL_10":true,
            "TAYLORPE_MAY_4":true,
            "MACKENZIEBU_JAN_7":true,
            "ELIASHU_NOV_26":true,
            "GEORGEGE_JUN_6":true,
            "CHRISTIANAWI_JUN_21":true,

            // UNKNOWN USER
            "ERFGTT_FEB_1":true,
            "TEST_JAN_1":true
        },

        // Dec 4 DeerLake ignores
        // 
        // These were logged in as GUESTS again
        //
        "_2":{
            // ABSENT
            "EMILYBL_MAR_8":true,
            "LAYLAHMI_DEC_28":true,
            "CALEBKE_JAN_1":true,
            "PAYTONCE_MAR_2":true,
            "GEORGEGE_JUN_6":true,
            "ERICKU_JAN_1":true,

            "BRIENNESH_JAN_1":true,
            "ANGELOTR_DEC_14":true,
            
            // UNKNOWN USER
            "ERFGTT_FEB_1":true,
            "TEST_JAN_1":true
        }
    }

    private ignoreLogin:any = {

        // Nov 30 DeerLake ignores
        // 
        "_0":{},

        // Dec 3 DeerLake ignores
        // These accounts were all created in error instead of using GUEST accounts.        
        // 
        "_1":{
            "CALEBKE_FEB_17":"tablet_11",
            "JASONCA_NOV_18":"tablet_17",
            "LANEYBE_MAR_14":"tablet_22",
            "ERICKU_FEB_10":"tablet_26",
            "STEHSI_JAN_1":"tablet_29",
            "STEPHSI_JAN_1":"tablet_16",
            "ALVIAAD_JUN_27":"tablet_29",
            "ALIVIAAA_JUN_27":"tablet_29",
            "BRIENNESH_JUL_1":"tablet_3",
            "ABBYAS_DEC_13":"tablet_3",
            "NATALINATR_AUG_4":"tablet_6",
            "TEST_JAN_1":"tablet_10"
        },

        // Dec 4 DeerLake ignores
        // 
        "_2":{
            "ELIMC_MAY_22":"tablet_16",     // Created account - not allowed
            "BRIENNESH_JUL_1":"tablet_3",   // Created account - not allowed
            "BRIENNESH_JAN_2":"tablet_3"    // Logged in as guestbl_jan_1 tablet 25
        }
    }

    // Ignore dormant accounts where students have used guest logins 
    //
    private ignoreMastery:any = {

        // mastery students
        "LAYNELO_DEC_20":true,
        "ALYSSAWE_NOV_5":true,
        "ANITAZH_SEP_1":true,
        "BLAKEGO_APR_1":true,
        "CALEBCH_OCT_5":true,
        "JENNAHO_JUN_11":true,
        "KATELYNZE_MAY_24":true,
        "OWENNE_APR_17":true,
        "RACHAELHA_JUN_4":true,
        "ROBERTGU_APR_21":true,
        "JACKSONLY_OCT_28":true,
        "GRACEHA_FEB_20":true,
        "ALEXISSV_SEP_13":true,
        "WILLIAMSC_NOV_21":true,
        "ZACHWA_DEC_4":true,
        "DAMIANCR_APR_6":true,
        "ELIZABETHST_SEP_30":true,
        "LUKERI_OCT_16":true, 
        "DAYANNASH_JAN_28":true,
        "DYLANSC_JUL_26":true,
        "EMILYCA_SEP_2":true,
        "GIANNAFI_MAY_25":true,
        "CHRISTIANDI_AUG_29":true,
        "GIOVANNIPO_DEC_1":true,
        "TRISTANNE_JAN_3":true,
        "BROOKEM_DEC_1":true, 
        "QWAYLENDO_JAN_15":true,
        "BENJAMINFO_APR_23":true,
        "EMMAFE_SEP_28":true,
        "ADAMLI_APR_17":true,
        "JACOBWA_AUG_17":true
    };
    

    // These ID's are equivalent (i.e. denote the same individual)
    // 
    private IDConflict:any = {

        "ANGELOTR_DEC_14": "ANGELOTR_JAN_2",
        "ANGELOTR_JAN_2" : "ANGELOTR_DEC_14",

        "BRIENNESH_JAN_1":"BRIENNESH_JAN_2",
        "BRIENNESH_JAN_2":"BRIENNESH_JAN_1",

        "CALEBKE_FEB_17":"CALEBKE_JAN_1",
        "CALEBKE_JAN_1":"CALEBKE_FEB_17",

        "ERICKU_JAN_1":"ERICKU_JAN_2",
        "ERICKU_JAN_2":"ERICKU_JAN_1",

        "NATALINATR_JAN_1":"NATALINATR_JAN_2",
        "NATALINATR_JAN_2":"NATALINATR_JAN_1"
    };


    private activeAccounts:any  = {

        // Nov 30 DeerLake ignores
        // 
        "_0":{},

        // Dec 3 DeerLake ignores
        // 
        "_1":{},

        // Dec 4 DeerLake conflicts
        // 
        "_2":{}

    };                                    
    private sessionAccountList:any = {

        // Nov 30 DeerLake ignores
        // 
        "_0":{},

        // Dec 3 DeerLake ignores
        // 
        "_1":{},

        // Dec 4 DeerLake conflicts
        // 
        "_2":{}
    };
    private masterAccountList:any = {};


    constructor(_cwd:string) {

        this.cwd = _cwd;
    }
    

    // Unpack the alldata.zip for each tablet in the EdForge_ZIPDATA folder into the 
    // EdForge_USERDATA folder.  This gives us all the user data in discrete folders.
    // 
    public unpackData(srcBase:string, dst:string) : Array<string>{

        // unpack each days data into a named folder.
        // 
        for(let daySfx of this.daySuffix) {

            let srcPath:string = path.join(this.cwd, srcBase + daySfx);  
            let dstPath:string = path.join(this.cwd, dst + daySfx);  

            console.log("\n\n***********************Unpacking Session: " + daySfx + "\n");

            try {

                // enumerate the EdForge_ZIPDATA_# (# = daySfx) folder to find "tablet_#" subfolders
                // containing tablet ZIP data  (alldata.zip)
                // 
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

                                this.unpackTabletData(daySfx, folder, _path, dstPath);
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
        }

        return this.dataFolders;
    }


    // Find (if present) the requested iteration of a tutors data set (repetition) 
    //
    private getTutorIterationData(studentId:string, tutorSfx:string, iteration:number) : any {

        let data:any = null;

        for(let daySfx of this.daySuffix) {

            // If there is a dataset for this day then see if it is the iteration requested
            //
            if(this.tutorData[studentId] && this.tutorData[studentId][tutorSfx] && this.tutorData[studentId][tutorSfx][daySfx]) {

                if(iteration === 0) {

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


    public mergeUserAccts() {

        let forceMerge:boolean  = false;
        let buildImages:boolean = true;

        if(buildImages) {

            // Merge each days data into a named folder.
            // 
            for(let daySfx of this.daySuffix) {

                this.mergeErrors = 0;
                this.loadResolveAccts(daySfx);

                // Save the merged account database.
                // 
                this.saveMergedAcctImage(daySfx);

                if(this.mergeErrors === 0 || forceMerge) {

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

        let processor:DataProcessor = new DataProcessor(this.ontology);

        // We aggregate all users into a single file.
        // 
        let dstPath:string = Utils.validatePath(this.cwd, this.PROC_DATA);

        // We have at most daySuffix versions of some user data - if they repeated everything every day of the
        // study.
        // 
        for(let iteration = 0 ; iteration < 3 ; iteration++) {

            for(let tutorDataEntry of this.tutorDataSpecs) {

                let tutorDataFile:string = path.join(this.cwd, this.PROC_DATA, "tutordata_" + tutorDataEntry.suffixOut + "_" + iteration + ".csv");
                let genFile:number = processor.createDataTarget(tutorDataFile);

                let masterDataFile:string = path.join(this.cwd, this.PROC_DATA, "masterydata_" + tutorDataEntry.suffixOut + "_" + iteration + ".csv");
                let masFile:number = processor.createDataTarget(masterDataFile);

                for(let studentId in this.masterAccountList) {
        
                    if(!this.ignoreMastery[studentId]) {
                        let tutorIterationData:any = this.getTutorIterationData(studentId, tutorDataEntry.suffixIn, iteration);  
                        
                        if(tutorIterationData)
                            processor.extractTutorStateData(genFile, tutorDataEntry.dataSpec, tutorIterationData, studentId, this.masterAccountList[studentId].condition);            
                    }
                    else {
                        let tutorIterationData:any = this.getTutorIterationData(studentId, tutorDataEntry.suffixIn, iteration);  
                        
                        if(tutorIterationData)
                            processor.extractTutorStateData(masFile, tutorDataEntry.dataSpec, tutorIterationData, studentId, this.masterAccountList[studentId].condition);            
                    }
                }
            }
        }
    }


    public assignInstruction(csvName:String) {

        let srcPath:string = path.join(this.cwd, this.USER_DATA, csvName);  
        let count = 0;
        let username;

        // unpack each days data into a named folder.
        // 
        for(let daySfx of this.daySuffix) {

            // TODO: fix this for daySfx
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
                this.saveMergedAcctImage(daySfx);
            });
        }
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


    // load beta1 masterAcctList.json image
    // 
    private loadMasterAcctList() {

        let acctData:string = path.join(this.cwd, this.USER_DATA, this.ACCT_MASTERLIST);  

        this.masterAccountList = JSON.parse(fs.readFileSync(acctData));
    }


    // load beta1 masterAcctList.json image
    // 
    private saveMasterAcctList() {

        Utils.validatePath(this.cwd, this.USER_DATA);

        let dataPath:string = path.join(this.cwd, this.USER_DATA, this.ACCT_MASTERLIST);  

        let dataUpdate:string = JSON.stringify(this.masterAccountList, null, '\t');
    
        fs.writeFileSync(dataPath, dataUpdate, 'utf8');
    }



    // load beta1 tutorstatedata.json image
    // 
    private loadMergedAccts() {

        let acctData:string = path.join(this.cwd, this.MERGE_DATA, this.ACCT_FILENAME);  

        this.mergedAccts = JSON.parse(fs.readFileSync(acctData));
    }


    // load beta1 tutorstatedata.json image
    // 
    private saveMergedAcctImage(daySfx:string) {

        // We don't want tablet ID's in the merge image
        // TODO: use this in V1 merged accounts
        // Having the Tablet ID makes it easier to find the user data
        // 
        for(let user of this.mergedAccts.users) {
            // delete user.tabletId;
        }

        Utils.validatePath(this.cwd, this.MERGE_DATA + daySfx);

        let dataPath:string = path.join(this.cwd, this.MERGE_DATA + daySfx, this.ACCT_FILENAME);  

        let dataUpdate:string = JSON.stringify(this.mergedAccts, null, '\t');
    
        fs.writeFileSync(dataPath, dataUpdate, 'utf8');
    }


    // load tutorstate_*.json image
    // 
    private loadDataFile(srcPath:string) : any {

        let data:any = null;

        try {
            data = JSON.parse(fs.readFileSync(srcPath));
        }
        catch(err) {

            data = null;
        }

        return data;
    }


    // save tutorstate_*.json image
    // 
    private saveDataFile(dst:string, data:any) {

        let dataUpdate:string = JSON.stringify(data, null, '\t');

        fs.writeFileSync(dst, dataUpdate, 'utf8');
    }


    private loadSessionData(sessionFolder:string, daySfx:string) : void {

        var folderList   = fs.readdirSync(sessionFolder);

        // Enumerate the user data folders for this session
        // 
        for(let studentId of folderList) {

            var filePath = path.join(sessionFolder, studentId);
            var stat = fs.statSync(filePath);
            
            //  Folders are assumed to be user account data folders
            // 
            if(stat.isDirectory()) {

                this.tutorData[studentId] = this.tutorData[studentId] || {"1stSession":daySfx};

                // Load all available tutordata for given student account - not all accounts will have all tutors
                // used on any particular day
                // 
                for(let tutorSfx of this.tutorFileSuffix) {

                    let tutorDataFile:string = path.join(sessionFolder, studentId, "tutorstate_" + tutorSfx + ".json");

                    let data = this.loadDataFile(tutorDataFile);

                    if(data) {
                        this.tutorData[studentId][tutorSfx] = this.tutorData[studentId][tutorSfx] || {"1stTutorSession":daySfx};

                        this.tutorData[studentId][tutorSfx][daySfx] = data;
                    }
                }
            }
        }
    }


    private loadAllSessionData() {

        // Enumerate the sessions for the instruction - (i.e. the days instruction was given)
        // This corresponds to the merge-folders images.
        // 
        for(let daySfx of this.daySuffix) {

            let sessionFolder:string = path.join(this.cwd, this.MERGE_DATA + daySfx);
            
            console.log("Loading Session: " + daySfx);

            this.loadSessionData(sessionFolder, daySfx);
        }    
    }


    private combineUserFolder(src:string, dest:string, recurse:boolean) : void {

        var folderList   = fs.readdirSync(src);
        let flags:number = 0;                   // default to destructive copying

        for(let entry of folderList) {

            var filePath = path.join(src, entry);
            var stat = fs.statSync(filePath);
            
            if(stat.isDirectory()) {

                // copy recursively
                // 
                if(recurse) {
                    Utils.validatePath(path.join(dest,entry), null);

                    this.combineUserFolder(path.join(src,entry),path.join(dest,entry), recurse);
                }

            } else {

                try {
                    // Process the tutorstate data separately
                    // 
                    // if(!entry.startsWith("tutorstate")) {

                        fs.copyFileSync(path.join(src,entry), path.join(dest,entry), flags);
                    // }
                }
                catch(err) {
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
    private combineMergeImage() {

        for(let i1 = this.daySuffix.length-1 ; i1 >= 0 ; i1--) {

            console.log("Creating Merge Master:: " + this.daySuffix[i1]);

            // Copy the data in reverse day order without replacement - 
            //
            let mergePath:string = path.join(this.cwd, this.MERGE_DATA + this.daySuffix[i1]);  

            var folderList = fs.readdirSync(mergePath);

            // Enumerate the user account folders in EdForge_MERGEMASTER.
            // 
            for(let entry of folderList) {

                let mergeDst:string = path.join(this.cwd, this.MERGE_MASTER, entry);  
                let mergeSrc:string = path.join(this.cwd, this.MERGE_DATA + this.daySuffix[i1], entry);  

                var stat = fs.statSync(mergeSrc);
            
                if(stat.isDirectory()) {
    
                    Utils.validatePath(mergeDst, null);

                    this.combineUserFolder(mergeSrc, mergeDst, true);
        
                } else {
    
                    // Do a non-destructive Copy 
                    // 
                    try {
                        fs.copyFileSync(mergeSrc, mergeDst, COPYFILE_EXCL);
                    }
                    catch(err) {
                        // Ignore dupliciates
                    }
                }
    
            }
        }
    }


    private copyFolder(user:acctData, src:string, dest:string, recurse:boolean) : any {

        var folderList = fs.readdirSync(src);
        var ignored:any = {};

        for(let entry of folderList) {

            var filePath = path.join(src, entry);
            var stat = fs.statSync(filePath);
            
            if(stat.isDirectory()) {

                // copy recursively
                if(recurse) {
                    Utils.validatePath(path.join(dest,entry), null);

                    let ignore = this.copyFolder(user, path.join(src,entry),path.join(dest,entry), recurse);

                    Object.assign(ignored, ignore);
                }

            } else {

                // Decompose the filename to get 
                // 
                let reg = /(\w*)__(\w*)/;

                let nameParts:string[] = entry.match(reg);

                if(nameParts[1].includes("tablet")) {
                    console.log("Internal Error");
                }

                // Copy file image for a specific tablet:
                // Where there is a merge conflict we'll ignore all but the one selected to resolve
                // the conflict. i.e. There may be multiple named files from different tablets.
                // 
                if(user.tabletId === nameParts[2]) {
                    fs.copyFileSync(path.join(src,entry),path.join(dest,nameParts[1]+".json"));
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
    private mergeTutorStateData(daySfx:string) {

        for(let user of this.mergedAccts.users) {
            
            let itablet:string = "";

            try {

                if(!this.ignoreDormant[daySfx][user.userName]) {

                    // Copy the data from the ORIGINAL data folder to the users named folder in 
                    // the merge image. n.b. Guest accounts etc are mapped to another user name.
                    //
                    let tutorStateData:string = path.join(this.cwd, this.USER_DATA + daySfx, user.userFolder);  
                    let mergeStateData:string = path.join(this.cwd, this.MERGE_DATA + daySfx, user.userName);  

                    Utils.validatePath(mergeStateData, null);

                    let ignored:any = this.copyFolder(user, tutorStateData, mergeStateData, true);

                    for(let ignore in ignored) {

                        if(itablet.length > 0) itablet += ", ";
                        
                        itablet += ignore;
                    }

                    console.log("User Merge Complete: " + user.userName + " :: From " + user.tabletId + ((itablet.length > 0)? " :: Ignored " + itablet:""));
                }
                else {
                    //  Silent ignore students that were absent
                }
            }
            catch(err) {
                console.log("Internal Error ***** merging:: " + user.userName + " :: " + err);
            }
        }
    }


    // Load all the isp_userdata.json files for all the tablets for a given day
    // 
    private loadResolveAccts(daySfx:string) {
        
        // Load the this.tabletImages array with isp_userdata.json images for
        // each tablet
        // 
        this.loadAcctImages(daySfx);
        this.resolveAccts(daySfx);
    }    


    private resolveAccts(daySfx:string) {

        let userData:acctData;

        let rename:boolean   = false;
        let newname:string   = "";
        let condition:string = "";

        this.mergedAccts.users      = [];
        this.mergedAccts.userLogins = [];

        // enumerate all known accounts.
        // 
        for(let tablet of this.tabletImages) {

            // Build a master account list across all the tablets.
            // 
            if(tablet.tabletId) {

                for(let user of tablet.users) {                    

                    this.masterAccountList[user.userName] = {};

                    if(!this.sessionAccountList[daySfx][user.userName]) {
                        this.sessionAccountList[daySfx][user.userName] = {"tablet":tablet.tabletId, "active": "" };
                    }
                }
            }
        }

        // Enumerate the tablet acct images - each tablet has a set of logins and associated 
        // user account state records
        // 
        for(let tablet of this.tabletImages) {

            // Build a master account list across all the tablets.
            // 
            if(tablet.tabletId) {

                let tabletLogins:any = {};

                // Enumerate all the logins for the given tablet.
                // 
                for(let user of tablet.userLogins) {                    

                    // Only process one login per user per tablet.
                    // 
                    if(!tabletLogins[user.userName]) {

                        tabletLogins[user.userName] = true;

                        // Resolve Guest account usages to student accounts.
                        // 
                        if(user.userName.startsWith("GUEST")) {

                            // If there is no resolution for the guest account - raise error
                            // i.e. there must be a mapping for the guest account login on the specific tablet.
                            // 
                            if(!(this.guestFixups[daySfx][user.userName] && this.guestFixups[daySfx][user.userName][tablet.tabletId]) && !this.ignoreTablet[daySfx][tablet.tabletId]) {

                                this.mergeErrors++;
                                console.log("WARNING: Unresolved Guest Account: " +  user.userName + " used on: " + tablet.tabletId);
                            }
                        }
                        
                        // Resolve normal user logins to a specific tablet image - check for conflicts in the process. i.e. logins on multiple 
                        // tablets that have no conflict resolution 
                        // 
                        else {
                            if(this.activeAccounts[daySfx][user.userName]) {

                                // If this isn't a duplicate login on this tablet it represents a conflict that must be resolved.
                                // 
                                if((this.activeAccounts[daySfx][user.userName] !== tablet.tabletId) && !this.ignoreTablet[daySfx][tablet.tabletId]) {

                                    // If there is no resolution for the multiple-login - raise error
                                    // 
                                    if(!this.conflictResolution[daySfx][user.userName]) {

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
        for(let tablet of this.tabletImages) {

            // Check for data spec version - beta1 had no version id we had to parse the currScene to 
            // determine tablet users
            // 
            if(tablet.tabletId) {
                
                let tabletLogins:any = {};

                // Enumerate the actual logins to tablets.
                // 
                for(let user of tablet.userLogins) {                    

                    rename = false;

                    // Only process one login per user per tablet.
                    // 
                    if(!tabletLogins[user.userName]) {

                        tabletLogins[user.userName] = true;

                        if(this.ignoreMastery[user.userName]) {

                            // console.log("Ignoring Mastery Account: " + user.userName + " on " + tablet.tabletId);
                            // continue;
                            console.log("Mastery");
                        }

                        //  Resolve users logged in as another - rename login and user data record.
                        // 
                        else if(this.userFixups[daySfx][user.userName] && this.userFixups[daySfx][user.userName][tablet.tabletId]) {

                            rename    = true;
                            newname   = this.userFixups[daySfx][user.userName][tablet.tabletId].username.toUpperCase();
                            condition = this.userFixups[daySfx][user.userName][tablet.tabletId].condition;             
                            
                            console.log("Fixing Aliased Account: " + user.userName + " on: " + tablet.tabletId + " to: " + newname + " : " + condition);      
                        }   

                        // Resolve multiple login conflicts - Users logged into multuple tablets.
                        // Ignore all but one.
                        // 
                        else if(this.conflictResolution[daySfx][user.userName]) {
                            
                            if(this.conflictResolution[daySfx][user.userName] !== tablet.tabletId) {
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

                        if(this.guestFixups[daySfx][user.userName]) {

                            if(this.guestFixups[daySfx][user.userName][tablet.tabletId]) {

                                if(this.guestFixups[daySfx][user.userName][tablet.tabletId].username.toUpperCase() !== "NONE") {
                                    rename    = true;
                                    newname   = this.guestFixups[daySfx][user.userName][tablet.tabletId].username.toUpperCase();
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
                        for(let entry of tablet.users) {

                            if(entry.userName === user.userName) {
                                userData = entry;
                                break;
                            }
                        }

                        // If the user state data is found we add it to the merged image
                        // 
                        if(userData) {

                            // Tag the users Tablet Id for processing the folder merge
                            // 
                            userData.tabletId = tablet.tabletId;

                            if(rename) {
                                userData.userName       = newname;
                                userData.instructionSeq = condition;

                                this.masterAccountList[newname] = {};
                                this.sessionAccountList[daySfx][newname] = {"tablet":tablet.tabletId, "active": "" };
                            }

                            // Skip Guest Accounts.
                            // 
                            if(userData.userName.startsWith("GUEST")) {
                                console.log("NOTICE: skipping GUEST: " + userData.userName + " on: " + tablet.tabletId);
                            }

                            // Note: Special processing @@@@@@@@@@@@@@@@@@@ @@@@@@@@@@@@@@@@@@@@
                            // Skip created accounts on subsequent days.  default instruction was incorrect.
                            // 
                            else if((daySfx !== "_0") && userData.instructionSeq === "tutor_seq_dayone.json") {
                                
                                if(!this.ignoreMastery[user.userName] && !(this.ignoreLogin[daySfx][user.userName] && this.ignoreLogin[daySfx][user.userName] === tablet.tabletId)) {

                                    console.log("WARNING: skipping bad Account Creation: " + userData.userName + " :: " +  userData.instructionSeq + " on: " + tablet.tabletId);
                                }
                            }
                            else {
                                try {
                                    this.masterAccountList[userData.userName].active          = true;
                                    this.masterAccountList[userData.userName].condition       = userData.instructionSeq;
                                    this.masterAccountList[userData.userName][daySfx]         = true;

                                    this.sessionAccountList[daySfx][userData.userName].active = true;

                                    this.mergedAccts.users.push(userData);     
                                }
                                catch(err) {

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
        for(let tablet of this.tabletImages) {

            // Build a master account list across all the tablets.
            // 
            if(tablet.tabletId) {

                for(let user of tablet.users) {        

                    try {

                        if(this.ignoreMastery[user.userName]) {

                            // console.log("Ignoring Mastery Account: " + user.userName + " on " + tablet.tabletId);
                            continue;
                        }

                        // Only merge one copy of dormant accounts.
                        // 
                        if(!this.sessionAccountList[daySfx][user.userName].active) {

                            this.sessionAccountList[daySfx][user.userName].active = true;

                            if(!user.userName.startsWith("GUEST")) {

                                if(user.instructionSeq !== "tutor_seq_dayone.json") {

                                    if(this.ignoreDormant[daySfx][user.userName]) {

                                        console.log("Ignoring Dormant Account: " + user.userName + " on " + tablet.tabletId);
                                    } 
                                    else {
                                        user.tabletId = tablet.tabletId;
                                        this.mergedAccts.users.push(user);

                                        console.log("Merging Dormant Account: " + user.userName + " on " + tablet.tabletId);
                                    }
                                }
                                else {
                                    if(!(this.ignoreLogin[daySfx][user.userName] && this.ignoreLogin[daySfx][user.userName] === tablet.tabletId)) {

                                        console.log("WARNING: Skipping Unresolved Account Error: " + user.userName + " :: " + user.instructionSeq + " on: " + tablet.tabletId);    
                                    }
                                }                                
                            }
                            else {
                                // console.log("Skipping Guest Account: " + user.userName + " on: " + tablet.tabletId);
                            }
                        }                    
                    }
                    catch(err) {
                        // TODO : enumerate the fixups to ensure we didn't miss anything
                        // 
                        console.log("WARNING: Skipping Fixup: " + user.userName  + " on " + tablet.tabletId + " ::: " + err);
                    }
                }
            }
        }
    }


    // Load all the tablet specific beta1 isp_userdata.json files into an array
    // 
    private loadAcctImages(daySfx:string) {

        let userDataFolder:string  = path.join(this.cwd, this.USER_DATA + daySfx);  

        this.tabletImages = []; // reset the image 

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

                            let accts:tabletData = JSON.parse(fs.readFileSync(_path));

                            let match:string[] = entry.match(/tablet_\d*/);                            

                            if(match.length > 0)
                                accts.tabletId = match[0];

                            // Keep a copy of the original source folder name for 
                            // the user data.  The USER may be renamed. e.g. it is a 
                            // guest account.  
                            //
                            for(let user of accts.users) {
                                user.userFolder = user.userName;
                            }

                            this.tabletImages.push(accts);
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
        // 
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

                    // NOTE: Use file level labelling with tabletid instead of this
                    // 
                    // if(tarFolder.startsWith("GUEST")) {
                    //     tarFolder = "_" + tarFolder + "__" + this.tabletID;
                    // }

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


    //****************************************************
    //****************************************************
    //****************************************************
    // Unpacking tablet data.
    // 

    private checkUserLogin(userID:string) {

        let result:boolean = false;

        for(let user of this.tabletAccts.userLogins) {

            if(user.userName === userID) {
                result = true;
                break;
            }
        }

        return result;
    }


    // load isp_userdata.json images 
    // 
    private loadAcctImage(daySfx:string) {

        let acctData:string = path.join(this.cwd, this.USER_DATA + daySfx, this.ACCT_FILENAME);  

        this.tabletAccts = JSON.parse(fs.readFileSync(acctData));
    }


    private unpackUserData(zipBase:string, dst:string, recurse:boolean) {

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
                
                if(entry.isDirectory) {

                    srcArr = entry.entryName.split("/");

                    let userFolder:string = srcArr[srcArr.length-2];

                    // Only process data from accts that were actually logged into on 
                    // this tablet image.
                    // 
                    if(this.checkUserLogin(userFolder)) {

                        // NOTE: Use file level labelling with tabletid instead of this
                        // 
                        // if(userFolder.startsWith("GUEST")) {
                        //     userFolder = "_" + userFolder + "__" + this.tabletID;
                        // }

                        dstPath = Utils.validatePath(dst, userFolder);
                        zipPath = path.join(zipBase, srcArr[srcArr.length-2]);
                        zipPath = zipPath.replace(/\\/g,"/") + "/";

                        // We do the files in a separate loop to ensure the folder
                        // is created before any of its enclosed files/folders
                        // 
                        this.unpackFiles(zipPath, dstPath);

                        if(recurse)
                            this.unpackSubFolders(zipPath, dstPath, this.RECURSE);
                    }
                }
            }
        }
    }


    // Unpack the isp_userdata.json file from the tablet data image.
    // 
    private unpackUserAccts(daySfx:string) {

        let acctPath:string = path.join(this.ZIP_ROOT, this.ACCT_FILENAME);
        let zipEntry:AdmZip.IZipEntry = this.zipFile.getEntry(acctPath.replace("\\","/"));

        if(zipEntry) {

            let outPath = path.join(this.cwd, this.USER_DATA + daySfx);

            Utils.validatePath(outPath,null);

            if(!this.zipFile.extractEntryTo(zipEntry, outPath, false, false)) {
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
    private unpackTabletData(daySfx:string, _tabletId:string, zipPath:string, dstPath:string) : void {

        let fpath:string = path.join(zipPath, this.ARCHIVE_FILENAME);          

        this.tabletID = _tabletId;

        console.log("Unpacking Tablet: " + this.tabletID);

        // Selectively ignore tablets
        // 
        if(!this.ignoreArchive[daySfx][_tabletId]) {

            try {
                this.zipFile    = new AdmZip(fpath);
                this.zipEntries = this.zipFile.getEntries(); 

                this.zipEntry = this.zipFile.getEntry(this.ZIP_ROOT);

                if(this.zipEntry) {

                    this.unpackUserAccts(daySfx);
                    this.unpackUserData(this.ZIP_ROOT, dstPath, this.RECURSE);
                }
            }
            catch(error) {
                console.log("Error = " + error);
            }
        }
        else {
            console.log("NOTICE: Ignoring tablet - " + _tabletId);
        }
    }
}
    