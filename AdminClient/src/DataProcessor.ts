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
         TutorData, 
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


export class DataProcessor
{
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
                this.extract(TData_RQPRUNED.tutorDataSpec);
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

    public createDataTarget(dstFolder:string) : void {

        this.dstPath       = dstFolder;
        let dstFile:string = "";

        dstFile = path.join(this.dstPath, TCONST.DATA_OUTPUT);

        this.outFile = fs.openSync(dstFile, 'w');

        let dataHdr:string = "Tutor_Name" + "/" + "User_ID" + "/" + "Tablet_ID" + "/" + "Scene_ID" + "/" + "User_Cond" + "/"  + "Data_Name" + "/" + "Data_Value" + "/" + "Time" + "/" + "Raw_Time" + "\n";

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


    private resolveObject(objPath:string, cacheData:sceneCache ) : any {

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
            obj = this.resolveObject(comParts[this.ID], cacheData);

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


    private resolveDataObj(descr:dataPacket, obj:any) : string {

        let result:string = "";

        if(descr.dataValue === "ontologyKey") {

            result = this.resolveOntologyKey(obj[descr.dataValue]);
        }
        else {
            result = (descr.dataValue != ""? obj[descr.dataValue]:"");
        }

        return result;
    }

    private extract(tutorDescr:TutorData) {

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
                                    + descr.dataName + "/" + this.resolveDataObj(descr, obj) + "/" + this.getTimeStamp(obj);

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

}