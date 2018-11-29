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
const TData_RQPRUNED_1 = require("./TData_RQPRUNED");
const TCONST_1 = require("./TCONST");
const admin_1 = require("./admin");
class DataProcessor {
    constructor(ontology) {
        this.sceneCache = {};
        this.ID = 0;
        this.KEY = 1;
        this.VALUE = 2;
        this.ontology = ontology;
    }
    extractData(srcFolder, user, userCond, typeSpec) {
        this.srcPath = srcFolder;
        this.userCond = userCond.toUpperCase();
        this.user = user;
        this.userTypeSpec = typeSpec;
        switch (typeSpec[1]) {
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
            case TCONST_1.TCONST.TUTOR_RQ:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: RQ");
                // this.extract(TData_RQ.tutorDataSpec);
                this.extract(TData_RQPRUNED_1.TData_RQPRUNED.tutorDataSpec);
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
    createDataTarget(dstFolder) {
        this.dstPath = dstFolder;
        let dstFile = "";
        dstFile = path.join(this.dstPath, TCONST_1.TCONST.DATA_OUTPUT);
        this.outFile = fs.openSync(dstFile, 'w');
        let dataHdr = "Tutor_Name" + "/" + "User_ID" + "/" + "Tablet_ID" + "/" + "Scene_ID" + "/" + "User_Cond" + "/" + "Data_Name" + "/" + "Data_Value" + "/" + "Time" + "/" + "Raw_Time" + "\n";
        fs.writeSync(this.outFile, dataHdr);
    }
    closeDataTarget() {
        fs.closeSync(this.outFile);
    }
    buildSceneFileName() {
        this.sceneInstName = this.sceneName + "_" + this.iteration + "__" + this.user.tabletId + TCONST_1.TCONST.JSONTYPE;
        this.sceneInstPath = path.join(this.srcPath, this.sceneInstName);
        return this.sceneInstPath;
    }
    setUserPath(name, folder) {
        this.userName = name;
        this.folder = folder;
    }
    buildSceneInstanceId() {
        this.sceneInst = this.userName + "_" + this.folder + "_" + this.sceneName + "_" + this.iteration;
        return this.sceneInst;
    }
    hasIteration() {
        let result = false;
        this.buildSceneFileName();
        result = fs.existsSync(this.sceneInstPath);
        return result;
    }
    cacheSceneData() {
        if (!this.sceneCache[this.sceneInst]) {
            this.sceneCache[this.sceneInst] = {
                "sceneName": this.sceneInst,
                "seqNdx": 0,
                "iteration": this.iteration,
                "sceneData": JSON.parse(fs.readFileSync(this.sceneInstPath))
            };
        }
        return this.sceneCache[this.sceneInst];
    }
    testCondition(cond) {
        let result = false;
        if (cond !== "") {
            let allCond = cond.toUpperCase().split("|");
            for (let cond of allCond) {
                if (cond === this.userCond) {
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
    resolveObject(objPath, cacheData) {
        let dataPath = objPath.split(".");
        let baseObj = cacheData.sceneData;
        try {
            for (let i1 = 0; i1 < dataPath.length; i1++) {
                if (dataPath[i1] === "$seq") {
                    baseObj = baseObj[dataPath[i1]][cacheData.seqNdx++];
                }
                else {
                    baseObj = baseObj[dataPath[i1]];
                }
            }
            ;
        }
        catch (err) {
            // We skip non-matching objects 
        }
        return baseObj;
    }
    testValue(obj, comParts) {
        let result = false;
        // If we are searching the $seq array check the prop
        // 
        if (comParts.length > 1) {
            if (comParts[this.VALUE].endsWith(":")) {
                if (obj[comParts[this.KEY]].startsWith(comParts[this.VALUE])) {
                    let propSplit = obj[comParts[this.KEY]].split(":");
                    obj[comParts[this.KEY]] = propSplit[0];
                    obj["value"] = propSplit[1];
                    comParts[this.VALUE] = propSplit[0];
                }
            }
            result = obj[comParts[this.KEY]] === comParts[this.VALUE];
        }
        else
            result = true;
        return result;
    }
    findDataSource(descr, cacheData) {
        let comParts = descr.dataSrc.split("|");
        let obj;
        do {
            obj = this.resolveObject(comParts[this.ID], cacheData);
        } while (!this.testValue(obj, comParts));
        return obj;
    }
    testConstraint(descr, obj) {
        let result = false;
        let constr;
        let constrTyped;
        // If there is a constraint on the packet - test it
        // 
        if (descr.dataConstr !== "") {
            constr = descr.dataConstr.split("|");
            if (constr[1].match(/(true)|(false)/)) {
                constrTyped = constr[1] === "true";
            }
            else if (constr[1].match(/\d*/)) {
                constrTyped = parseInt(constr[1]);
            }
            else
                constrTyped = constr[1];
            result = obj[constr[0]] === constrTyped;
        }
        else
            result = true;
        return result;
    }
    getTimeStamp(obj) {
        let stamp = "/\n";
        if (obj.time) {
            stamp = admin_1.timeStamp(new Date(obj.time)) + "/" + obj.time + "\n";
        }
        return stamp;
    }
    resolveOntologyKey(key) {
        let result = "";
        let root = this.ontology._ONTOLOGY;
        try {
            let keyParts = key.split("|");
            let ndxParts = keyParts[0].split("_");
            for (let prop of ndxParts) {
                root = root[prop];
            }
            result = root[keyParts[1]];
        }
        catch (err) {
            console.log("ERROR: bad OntologyKey: " + key);
        }
        return result;
    }
    resolveDataObj(descr, obj) {
        let result = "";
        if (descr.dataValue === "ontologyKey") {
            result = this.resolveOntologyKey(obj[descr.dataValue]);
        }
        else {
            result = (descr.dataValue != "" ? obj[descr.dataValue] : "");
        }
        return result;
    }
    extract(tutorDescr) {
        let datapnt;
        for (let [index, descr] of tutorDescr.dataDescr.entries()) {
            if (this.testCondition(descr.Cond)) {
                this.iteration = 1;
                this.sceneName = descr.sceneId;
                this.sceneInst = this.buildSceneInstanceId();
                this.sceneId = this.sceneName + "_" + this.iteration;
                let obj;
                while (this.hasIteration()) {
                    let dataCache = this.cacheSceneData();
                    try {
                        do {
                            obj = this.findDataSource(descr, dataCache);
                        } while (!this.testConstraint(descr, obj));
                        datapnt = tutorDescr.tutorName + "/" + this.user.userName + "/" + this.user.tabletId + "/" + this.sceneId + "/" + this.userCond + "/"
                            + descr.dataName + "/" + this.resolveDataObj(descr, obj) + "/" + this.getTimeStamp(obj);
                        fs.writeSync(this.outFile, datapnt);
                    }
                    catch (err) {
                        console.log("ERROR: processing: " + descr.dataName + " at: " + index);
                    }
                    this.iteration++;
                }
            }
        }
    }
}
exports.DataProcessor = DataProcessor;
//# sourceMappingURL=DataProcessor.js.map