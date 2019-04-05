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

import { acctData, 
         TutorDataDescr, 
         sceneCache, 
         dataPacket }           from "./IAcctData";
import { TData_TED }            from "./TData_TED";
import { TData_RQ }             from "./TData_RQ";
import { TData_RQPRUNED }       from "./TData_RQPRUNED";
import { TData_DR }             from "./TData_DR";
import { TData_MATSPRE }        from "./TData_MATSPRE";
import { TData_MATSPST }        from "./TData_MATSPST";
import { TCONST }               from "./TCONST";

import { timeStamp } from "./admin";
import { DESTRUCTION } from "dns";


export class DataProcessor
{
	// This is a special signature to avoid typescript error "because <type> has no index signature."
	// on this[<element name>]
	// 
	[key: string]: any;

    private srcPath:string;
    private dstPath:string;
    private user:acctData;
    private userCond:string;
    private userTypeSpec:string[];

    private sceneName:string;
    private sceneInst:string;
    private sceneId:string;
    private sceneInstName:string;
    private sceneInstPath:string;
    private iteration:number;
    private outFile:number;

    private ontology:any;
    private sceneCache:any = {};
    private userName:string;
    private folder:string;

    private ID:number    = 0;
    private KEY:number   = 1;
    private VALUE:number = 2;

    private Values:any = {};

    private conditions:any[] = 
                                [
                                    {"condPfx":"TUTOR_SEQ_DL_CHOICE","cond":"EG_A1"},
                                    {"condPfx":"TUTOR_SEQ_DL_NOCHOICE","cond":"EG_A2"},
                                    {"condPfx":"TUTOR_SEQ_DL_BASELINE","cond":"EG_A3"}
                                ];



    constructor(ontology:any) {        
        this.ontology = ontology;
    }


    public extractData(srcFolder:string, user:acctData, userCond:string, typeSpec:string[]) {

        this.srcPath      = srcFolder;
        this.userCond     = userCond.toUpperCase();
        this.user         = user;
        this.userTypeSpec = typeSpec;

        switch(typeSpec[1]) {

            // case TCONST.TUTOR_MATSPRE:
            //     console.log("PROCESSING USER: " + user.userName + " | TUTOR: MATS-PRETEST" );
            //     this.extract(TData_MATSPRE.tutorDataSpec);
            //     break;

            // case TCONST.TUTOR_MATSPST:
            //     console.log("PROCESSING USER: " + user.userName + " | TUTOR: MATS-POSTTEST" );
            //     this.extract(TData_MATSPST.tutorDataSpec);
            //     break;

            // case TCONST.TUTOR_DR:
            //     console.log("PROCESSING USER: " + user.userName + " | TUTOR: DR" );
            //     this.extract(TData_DR.tutorDataSpec);
            //     break;

            case TCONST.TUTOR_RQ:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: RQ" );
                // this.extract(TData_RQ.tutorDataSpec);
                this.extractSceneData(TData_RQPRUNED.tutorDataSpec);
                break;

            // case TCONST.TUTOR_INTRO:
            //     console.log("PROCESSING USER: " + user.userName + " | TUTOR: INTRO" );
            //     break;

            // case TCONST.TUTOR_TED:
            //     console.log("PROCESSING USER: " + user.userName + " | TUTOR: TED" );
            //     this.extract(TData_TED.tutorDataSpec);
            //     break;
        }
    }

    public createDataTarget(dstFile:string) : number {

        this.outFile = fs.openSync(dstFile, 'w');

        // let dataHdr:string = "Tutor_Name" + "/" + "User_ID" + "/" + "User_Cond" + "/"  + "Data_Name" + "/" + "Data_Value" + "/" + "Time" + "/" + "Raw_Time" + "\n";

        // fs.writeSync(this.outFile, dataHdr);

        return this.outFile;
    }

    public createTutorDataTarget(dstFile:string) : void {

        this.outFile = fs.openSync(dstFile, 'w');

        let dataHdr:string = "Tutor_Name" + "/" + "User_ID" + "/" + "User_Cond" + "/"  + "Data_Name" + "/" + "Data_Value" + "/" + "Time" + "/" + "Raw_Time" + "\n";

        fs.writeSync(this.outFile, dataHdr);
    }

    public closeDataTarget() {
        fs.closeSync(this.outFile);
    }


    private buildSceneFileName() {

        this.sceneInstName = this.sceneName + "_" + this.iteration + "__" + this.user.tabletId + TCONST.JSONTYPE;
        this.sceneInstPath = path.join(this.srcPath, this.sceneInstName);

        return this.sceneInstPath;
    }

    public setUserPath(name:string, folder:string) {

        this.userName = name;
        this.folder   = folder;
    }

    private buildSceneInstanceId() {

        this.sceneInst = this.userName + "_" + this.folder + "_" + this.sceneName + "_" + this.iteration;

        return this.sceneInst;
    }

    private hasIteration() : boolean {

        let result:boolean = false;

        this.buildSceneFileName();

        result = fs.existsSync(this.sceneInstPath);

        return result;
    }


    private cacheSceneData() : sceneCache {

        if(!this.sceneCache[this.sceneInst]) {
            this.sceneCache[this.sceneInst] = {
                "sceneName":this.sceneInst,
                "seqNdx":0,
                "iteration":this.iteration,
                "sceneData": JSON.parse(fs.readFileSync(this.sceneInstPath))
            }
        }

        return this.sceneCache[this.sceneInst];
    }

    private testCondition(cond:string) : boolean {

        let result:boolean = false;

        if(cond !== "") {

            let allCond:string[] = cond.toUpperCase().split("|");

            for(let cond of allCond) {

                if(cond === this.userCond) {

                    result = true;
                    break;
                }
            }
        }
        else {
            result = true;
        }

        return result;
    }


    private resolveSceneStateObject(objPath:string, cacheData:sceneCache ) : any {

        let dataPath:Array<string> = objPath.split(".");
        let baseObj = cacheData.sceneData;

        try {
            for(let i1 = 0 ; i1 < dataPath.length ; i1++) {

                if(dataPath[i1] === "$seq") {

                    baseObj = baseObj[dataPath[i1]][cacheData.seqNdx++];
                }
                else {
                    baseObj = baseObj[dataPath[i1]];
                }
            };
        }
        catch(err) {
            // We skip non-matching objects 
        }

        return baseObj;
    }



    private testValue(obj:any, comParts:string[]) : boolean {

        let result:boolean = false;

        // If we are searching the $seq array check the prop
        // 
        if(comParts.length > 1) {
            
            if(comParts[this.VALUE].endsWith(":")) {

                if(obj[comParts[this.KEY]].startsWith(comParts[this.VALUE])) {

                    let propSplit = obj[comParts[this.KEY]].split(":");

                    obj[comParts[this.KEY]] = propSplit[0];
                    obj["value"]            = propSplit[1];

                    comParts[this.VALUE] = propSplit[0];
                }
            }
            
            result = obj[comParts[this.KEY]] === comParts[this.VALUE];
        }
        else 
            result = true;

        return result;
    }


    private findDataSource(descr:dataPacket, cacheData:sceneCache) : any {

        let comParts:string[] = descr.dataSrc.split("|");
        let obj;

        do {
            obj = this.resolveSceneStateObject(comParts[this.ID], cacheData);

        }while(!this.testValue(obj, comParts));

        return obj;
    }


    private testConstraint(descr:dataPacket, obj:any) : boolean{

        let result:boolean = false;        
        let constr:string[];
        let constrTyped:any;

        // If there is a constraint on the packet - test it
        // 
        if(descr.dataConstr !== "") {

            constr = descr.dataConstr.split("|");

            if(constr[1].match(/(true)|(false)/)) {
                constrTyped = constr[1] === "true";
            }
            else if(constr[1].match(/\d*/)) {
                constrTyped = parseInt(constr[1]);
            }
            else constrTyped = constr[1];

            result = obj[constr[0]] === constrTyped;            
        }
        else
            result = true;

        return result;
    }


    private getTimeStamp(obj:any) : string {

        let stamp = "/\n";

        if(obj.time) {
            stamp = timeStamp(new Date(obj.time)) + "/" + obj.time + "\n";
        }

        return stamp;
    }


    private resolveOntologyKey(key:string) {

        let result:string = "";
        let root:any = this.ontology._ONTOLOGY;

        try {
            let keyParts:string[] = key.split("|");
            let ndxParts:string[] = keyParts[0].split("_");

            for(let prop of ndxParts) {

                root = root[prop];
            }

            result = root[keyParts[1]];
        }
        catch(err) {
            console.log("ERROR: bad OntologyKey: " + key);
        }   

        return result;
    }


    private extractSceneData(tutorDescr:TutorDataDescr) {

        let datapnt:string;

        for(let [index, descr] of tutorDescr.dataDescr.entries()) {
            
            if(this.testCondition(descr.Cond)) {

                this.iteration = 1;
                this.sceneName = descr.sceneId;
                this.sceneInst = this.buildSceneInstanceId();
                this.sceneId   = this.sceneName + "_" + this.iteration;

                let obj:any;

                while(this.hasIteration()) {
                    
                    let dataCache:sceneCache = this.cacheSceneData();

                    try {

                        do {
                            obj = this.findDataSource(descr, dataCache);

                        }while(!this.testConstraint(descr, obj));

                        datapnt = tutorDescr.tutorName + "/" + this.user.userName + "/" + this.user.tabletId + "/" + this.sceneId + "/" + this.userCond + "/" 
                                    + descr.dataName + "/" + this.resolveDataValue(descr, obj) + "/" + this.getTimeStamp(obj);

                        fs.writeSync(this.outFile, datapnt);
                    }
                    catch(err) {

                        console.log("ERROR: processing: " + descr.dataName + " at: " + index);
                    }

                    this.iteration++;
                }
            }
        }
    }

    
    private resolveUserCond(cond:string) {

        let result:string   = "unknown";
        let userCond:string = cond.toUpperCase();        

        for(let cond of this.conditions) {

            if(userCond.startsWith(cond.condPfx)) {
                result = cond.cond;
                break;
            }
        }

        return result;
    }


    private testTutorCondition(cond:string) : boolean {

        let result:boolean = false;

        if(cond !== "") {

            let allCond:string[] = cond.toUpperCase().split("|");

            for(let cond of allCond) {

                if(cond === "ANY") {

                    result = true;
                    break;
                }
                if(cond === this.userCond) {

                    result = true;
                    break;
                }
            }
        }
        else {
            result = true;
        }

        return result;
    }


   private resolveTutorStateObject(objPath:string, tutorData:any ) : any {

        let dataPath:Array<string> = objPath.split(".");

        try {
            for(let i1 = 0 ; i1 < dataPath.length ; i1++) {

                // If it is a seq object then we have to iterate until we hit the right one.
                // We only look at one per pass and keep the iteration index in $$index within 
                // the $seq object
                // 
                if(dataPath[i1] === "$seq") {

                    let ndx = tutorData.$seq.$$index = tutorData.$seq.$$index+1 || 0;

                    tutorData = tutorData[dataPath[i1]][ndx];
                }
                else {
                    tutorData = tutorData[dataPath[i1]];
                }
            };
        }
        catch(err) {
            // We skip non-matching objects 
        }

        return tutorData;
    }


    private resolveTutorStateData(descr:dataPacket, tutorData:any) : any {

        let comParts:string[] = descr.dataSrc.split("|");
        let obj;

        do {
            obj = this.resolveTutorStateObject(comParts[this.ID], tutorData);

        }while(!this.testValue(obj, comParts));

        return obj;
    }


    private postTV(index:string) : string {

        // Calc the 0-based TV index
        // 
        let Tv = parseInt(this.Values.TV) - 1;

        Tv += parseInt(index);
        Tv %= 4;

        return Tv.toString();
    }

    private postResult(TvRef:string) : string {

        let Tv = parseInt(this.Values[TvRef]);
        let SamDif:Array<boolean> = new Array<boolean>();
        let i1:number;
        let sum:number     = 0;
        let correct:string = "right";

        SamDif[0] = (this.Values["1A"] === this.Values["1B"]);
        SamDif[1] = (this.Values["2A"] === this.Values["2B"]);
        SamDif[2] = (this.Values["3A"] === this.Values["3B"]);
        SamDif[3] = (this.Values["4A"] === this.Values["4B"]);

        if(SamDif[Tv] === true) 
                    correct = "wrong";

        for(i1=0 ; i1 < 4 ; i1++) {
            sum = sum + (SamDif[i1]? 1:0);
        }

        if(sum !== 3) 
                correct = "wrong";

        return correct;
    }

    private postNumCorrect() : string {

        let count:number = 0;

        count += this.Values["PT1_RESULT"] === "right"? 1:0;
        count += this.Values["PT2_RESULT"] === "right"? 1:0;
        count += this.Values["PT3_RESULT"] === "right"? 1:0;
        count += this.Values["PT4_RESULT"] === "right"? 1:0;

        return count.toString();
    }


    private resolveDataValue(descr:dataPacket, obj:any) : string {

        let result:string = "";

        if(descr.process) {

            let parms:Array<string> = descr.parms.split(":");

            result = this[descr.process].apply(this, parms);
        }
        else if(descr.dataValue === "ontologyKey") {

            result = this.resolveOntologyKey(obj[descr.dataValue]);
        }
        else {

            if(descr.dataValue === "") {
                result = "";
            }
            else {
                if(obj[descr.dataValue]) {

                    if(typeof obj[descr.dataValue] === "boolean") {

                        if(obj[descr.dataValue] === true) result = "true";
                                                     else result = "false";
                    }
                    else {
                        result = obj[descr.dataValue];
                    }
                }
                else {
                    result = "";
                }
            }
        }

        if(descr.id) {
            this.Values[descr.id] = result;
        }

        return result;
    }

    
   public extractTutorStateData(file:number, tutorDescr:TutorDataDescr, tutorData:any, userName:string, cond:string) {

        let datapnt:string;
        let obj:any;

        try {
            this.userCond = this.resolveUserCond(cond || "unknown");
        }
        catch(err) {

            console.log("ERROR: processing: " + userName + " :: " + cond);
        }

        datapnt = tutorDescr.tutorName + "/" + userName + "/" + this.userCond;

        this.Values = {};

        for(let [index, descr] of tutorDescr.dataDescr.entries()) {
            
            if(this.testTutorCondition(descr.Cond)) {

                try {
                    do {
                        obj = this.resolveTutorStateData(descr, tutorData);

                    }while(!this.testConstraint(descr, obj));

                    datapnt += "/" + descr.dataName + "/" + this.resolveDataValue(descr, obj);                    
                }
                catch(err) {

                    console.log("ERROR: processing: " + userName + " :: " + descr.dataName + " at: " + index);
                }

                this.iteration++;
            }
        }

        datapnt += "\n";
        fs.writeSync(file, datapnt);        
    }


}