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

import { TCONST }               from "./TCONST";
import { acctData, TutorData, sceneCache, dataPacket }  from "./IAcctData";
import { TData_TED }            from "./TData_TED";
import { TData_RQ }             from "./TData_RQ";
import { TData_DR }             from "./TData_DR";
import { TData_MATSPRE }        from "./TData_MATSPRE";
import { TData_MATSPST }        from "./TData_MATSPST";




export class DataProcessor
{

    private srcPath:string;
    private dstPath:string;
    private user:acctData;
    private userCond:string;
    private userTypeSpec:string[];

    private sceneName:string;
    private sceneInst:string;
    private sceneInstName:string;
    private sceneInstPath:string;
    private iteration:number;
    private outFile:number;

    private sceneCache:any = {};

    private ID:number    = 0;
    private KEY:number   = 1;
    private VALUE:number = 2;


    constructor() {        
    }


    public extractData(srcFolder:string, dstFolder:string, user:acctData, userCond:string, typeSpec:string[]) {

        this.srcPath      = srcFolder;
        this.dstPath      = dstFolder;
        this.userCond     = userCond.toUpperCase();
        this.user         = user;
        this.userTypeSpec = typeSpec;

        this.createDataTarget();

        switch(typeSpec[1]) {

            case TCONST.TUTOR_MATSPRE:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: MATS-PRETEST" );
                this.extract(TData_MATSPRE.tutorDataSpec);
                break;

            case TCONST.TUTOR_MATSPST:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: MATS-POSTTEST" );
                this.extract(TData_MATSPST.tutorDataSpec);
                break;

            case TCONST.TUTOR_DR:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: DR" );
                this.extract(TData_DR.tutorDataSpec);
                break;

            case TCONST.TUTOR_RQ:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: RQ" );
                this.extract(TData_RQ.tutorDataSpec);
                break;

            case TCONST.TUTOR_INTRO:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: INTRO" );
                break;

            case TCONST.TUTOR_TED:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: TED" );
                this.extract(TData_TED.tutorDataSpec);
                break;
        }
    }

    private createDataTarget() : void {

        let filePath:string = "";

        filePath = this.dstPath + "_" + this.iteration + "__" + this.user.tabletId;

        // this.outFile = fs.openSync(filePath);
    }

    private buildSceneFileName() {

        this.sceneInstName = this.sceneName + "_" + this.iteration + "__" + this.user.tabletId + TCONST.JSONTYPE;
        this.sceneInstPath = path.join(this.srcPath, this.sceneInstName);

        return this.sceneInstPath;
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

        let allCond:string[] = cond.toUpperCase().split("|");

        for(let cond of allCond) {

            if(cond === this.userCond) {

                result = true;
                break;
            }
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



    private findDataSource(descr:dataPacket, cacheData:sceneCache) : any {

        let comParts:string[] = descr.dataSrc.split("|");
        let obj;

        do {
            obj = this.resolveObject(comParts[this.ID], cacheData);

        }while(obj[comParts[this.KEY]] != comParts[this.VALUE]);

        return obj;
    }

    private extract(tutorDescr:TutorData) {

        for(let dataDescr of tutorDescr.dataDescr) {
            
            if(this.testCondition(dataDescr.Cond)) {

                this.iteration = 1;
                this.sceneName = dataDescr.sceneId;
                this.sceneInst = this.sceneName + this.iteration;

                let obj:any;

                while(this.hasIteration()) {
                    
                    let dataCache:sceneCache = this.cacheSceneData();
                    let constr:string[] = dataDescr.dataConstr.split("|");
                    let constrTyped:any;

                    if(constr[1].match(/(true)|(false)/)) {
                        constrTyped = constr[1] === "true";
                    }
                    else if(constr[1].match(/\d*/)) {
                        constrTyped = parseInt(constr[1]);
                    }
                    else constrTyped = constr[1];


                    do {
                        obj = this.findDataSource(dataDescr, dataCache);

                    }while(obj[constr[0]] != constrTyped);

                    this.iteration++;
                }
            }
        }
    }

}