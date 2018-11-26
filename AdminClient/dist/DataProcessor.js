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
const TCONST_1 = require("./TCONST");
const TData_TED_1 = require("./TData_TED");
const TData_RQ_1 = require("./TData_RQ");
const TData_DR_1 = require("./TData_DR");
const TData_MATSPRE_1 = require("./TData_MATSPRE");
const TData_MATSPST_1 = require("./TData_MATSPST");
class DataProcessor {
    constructor() {
        this.sceneCache = {};
        this.ID = 0;
        this.KEY = 1;
        this.VALUE = 2;
    }
    extractData(srcFolder, dstFolder, user, userCond, typeSpec) {
        this.srcPath = srcFolder;
        this.dstPath = dstFolder;
        this.userCond = userCond.toUpperCase();
        this.user = user;
        this.userTypeSpec = typeSpec;
        this.createDataTarget();
        switch (typeSpec[1]) {
            case TCONST_1.TCONST.TUTOR_MATSPRE:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: MATS-PRETEST");
                this.extract(TData_MATSPRE_1.TData_MATSPRE.tutorDataSpec);
                break;
            case TCONST_1.TCONST.TUTOR_MATSPST:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: MATS-POSTTEST");
                this.extract(TData_MATSPST_1.TData_MATSPST.tutorDataSpec);
                break;
            case TCONST_1.TCONST.TUTOR_DR:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: DR");
                this.extract(TData_DR_1.TData_DR.tutorDataSpec);
                break;
            case TCONST_1.TCONST.TUTOR_RQ:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: RQ");
                this.extract(TData_RQ_1.TData_RQ.tutorDataSpec);
                break;
            case TCONST_1.TCONST.TUTOR_INTRO:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: INTRO");
                break;
            case TCONST_1.TCONST.TUTOR_TED:
                console.log("PROCESSING USER: " + user.userName + " | TUTOR: TED");
                this.extract(TData_TED_1.TData_TED.tutorDataSpec);
                break;
        }
    }
    createDataTarget() {
        let filePath = "";
        filePath = this.dstPath + "_" + this.iteration + "__" + this.user.tabletId;
        // this.outFile = fs.openSync(filePath);
    }
    buildSceneFileName() {
        this.sceneInstName = this.sceneName + "_" + this.iteration + "__" + this.user.tabletId + TCONST_1.TCONST.JSONTYPE;
        this.sceneInstPath = path.join(this.srcPath, this.sceneInstName);
        return this.sceneInstPath;
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
        let allCond = cond.toUpperCase().split("|");
        for (let cond of allCond) {
            if (cond === this.userCond) {
                result = true;
                break;
            }
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
    findDataSource(descr, cacheData) {
        let comParts = descr.dataSrc.split("|");
        let obj;
        do {
            obj = this.resolveObject(comParts[this.ID], cacheData);
        } while (obj[comParts[this.KEY]] != comParts[this.VALUE]);
        return obj;
    }
    extract(tutorDescr) {
        for (let dataDescr of tutorDescr.dataDescr) {
            if (this.testCondition(dataDescr.Cond)) {
                this.iteration = 1;
                this.sceneName = dataDescr.sceneId;
                this.sceneInst = this.sceneName + this.iteration;
                let obj;
                while (this.hasIteration()) {
                    let dataCache = this.cacheSceneData();
                    let constr = dataDescr.dataConstr.split("|");
                    let constrTyped;
                    if (constr[1].match(/(true)|(false)/)) {
                        constrTyped = constr[1] === "true";
                    }
                    else if (constr[1].match(/\d*/)) {
                        constrTyped = parseInt(constr[1]);
                    }
                    else
                        constrTyped = constr[1];
                    do {
                        obj = this.findDataSource(dataDescr, dataCache);
                    } while (obj[constr[0]] != constrTyped);
                    this.iteration++;
                }
            }
        }
    }
}
exports.DataProcessor = DataProcessor;
//# sourceMappingURL=DataProcessor.js.map