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

import { ItutorConfig } from "./IConfigTypes";

const { exec,
        spawn } = require('child_process');

const fs        = require('fs');
const path      = require('path');
const readline  = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const RX_MODULENAME:RegExp = /EFMod_\w*/;

const MODULEONLY:string    = "MODULEONLY";
const MODULETHIS:string    = "MODULETHIS";

const TUTORBASEFOLDER:string = "../../../";
const TUTORRELPATH:string    = "EFTutors";
const TUTORCONFIG:string     = "tutorconfig.json";
const TUTORMIXINS:string     = "code_mixins";
const TUTOREXTS:string       = "code_exts";
const TUTORPROMPT:string     = "\nEdForge Tutor Builder.\n\nSelect Tutor To Build:\n=======================\n"
const MODULEPROMPT:string    = "\nEdForge Tutor Data-Asset Compiler.\n\nSelect Module To Build:\n=======================\n"

const TSCONFIG:string     = "tsconfig.json";
const AUDIOBUILDER:string = "EFTutorBuilder/AudioBuilder/dist/builder.js";
const DATABUILDER:string  = "EFTutorBuilder/DataBuilder/dist/builder.js ";

let lModules:Array<string>      = new Array<string>();
let lTutors:Array<string> = new Array<string>();

let twd:string;
let rwd:string;
let modName:RegExpExecArray;

let libraryPath:string;
let tutorPath:string;
let configPath:string;
let modulePath:string;

let mixinsPath:string;
let extsPath:string;
let audioPath:string;
let dataPath:string;

let MIXIN_BUILD:number  = 0x01;
let EXT_BUILD:number    = 0x02;
let DATA_BUILD:number   = 0x04;
let AUDIO_BUILD:number  = 0x08;
let GLOBAL_BUILD:number = 0x10;

let completeFlag:number = 0;

let tutorConfig:ItutorConfig;


/**
 * When debugging the Tutor may not be defined as an argument.
 * (You may use a vscode launch configuration to set args[] to define a target)
 *
 * This function will provide a realtime listing of modules which may be built.
 * and prompt the user to select a build target.
 */
function getTutorToBuild() {
    calcTutorFolder();
    try {

        if(process.argv[2] && process.argv[2] === MODULETHIS) {
            listModules();
            if(!modName) {
                console.info("Error: command must be run from Root folder of Module.");
                terminate();
            }
            else {
                let target = lModules.indexOf(modName[0]);
                if(target >= 0) {
                    modulePath = lModules[target];
                    console.log(`\n\nBuilding: ${modulePath}\n`);
                    buildMixinResources(modulePath);
                    buildClassExtResources(modulePath);
                    buildDataResources(modulePath);
                    buildAudioResources(modulePath);

                    console.log("\n\Tutor Build Complete!\n");
                    setTimeout(terminate, 2000);
                }
            }
        }

        // If there is just one Module -- build it
        else {

            if(process.argv[2] || process.argv[2] === MODULEONLY) {
                listModules();

                let queryText:string = MODULEPROMPT;

                lModules.forEach((element:string, index:number) => {
                    queryText += (index+1) + ":\t" + element + "\n";
                });
                queryText += "\n>";

                rl.question(queryText, (answer:string) => {

                    let target = parseInt(answer)-1;

                    if(target >= 0 && target < lModules.length) {

                        modulePath = lModules[target];

                        // console.log(`\n\nBuilding: ${modulePath}\n`);
                        buildMixinResources(modulePath);
                        buildClassExtResources(modulePath);
                        buildDataResources(modulePath);
                        buildAudioResources(modulePath);
                    }
                    else {
                        console.error("\n\nInvalid selection!\n");
                        terminate();
                    }
                });
            }

            // If there is just one tutor -- build it
            else {
                listTutors();

                if(lTutors.length === 1) {

                    buildTutor(0);
                }
                // Otherwise if there is no argument to ID build target
                // query the user
                else if(!process.argv[2] || !lTutors.includes(process.argv[2])) {

                    let queryText:string = TUTORPROMPT;

                    lTutors.forEach((element:string, index:number) => {
                        queryText += (index+1) + ":\t" + element + "\n";
                    });
                    queryText += "\n>";

                    rl.question(queryText, (answer:string) => {

                        let target = parseInt(answer)-1;

                        if(target >= 0 && target < lTutors.length) {

                            buildTutor(target);
                        }
                        else {
                            console.error("\n\nInvalid selection!\n");
                            setTimeout(terminate, 2000);
                        }
                    });
                }
                else {
                    console.error("Error: invalid selection.");
                    setTimeout(terminate, 2000);
                }
            }
        }
    }
    catch(err) {
    }
}


function buildTutor(tutorNdx:number) {

    tutorPath  = lTutors[tutorNdx];
    configPath = path.join(twd, TUTORRELPATH, tutorPath, TUTORCONFIG);

    console.log(`\n\nBuilding Tutor: ${tutorPath}\n\n`);
    console.log("Processing Dependencies:\n------------------------\n")

    tutorConfig = JSON.parse(fs.readFileSync(configPath));

    let dep:Array<string> = tutorConfig.dependencies;

    dep.forEach((moduleID:string, index:number) => {

        try {
            buildMixinResources(moduleID);
            buildClassExtResources(moduleID);
            buildDataResources(moduleID);
            buildAudioResources(moduleID);
        }
        catch(err) {

        }
    });
}


function terminateOnCompletion(processID:number) {

    completeFlag |= processID;

    if(completeFlag === 0xF) {
        console.log("Tutor Build Complete!");
        setTimeout(terminate, 2000);
    }
}


function terminate() {
    process.exit(0);
}


// console.log(`${moduleName} build process exited with ` +
// `code ${code} and signal ${signal}`);

function buildMixinResources(moduleName:string) {

    mixinsPath = path.join(twd, moduleName, TUTORMIXINS, TSCONFIG);

    try {
        const child = spawn(`tsc --project ${mixinsPath}`,{stdio: 'inherit', shell: true});

        child.on('exit', function (code:any, signal:any) {
            console.log(`${moduleName} Mixins Complete.`);

            terminateOnCompletion(MIXIN_BUILD);
        });
    }
    catch(err) {
        console.log("Error: " + err);
    }

};


function buildClassExtResources(moduleName:string) {

    extsPath = path.join(twd, moduleName, TUTOREXTS, TSCONFIG);

    try {
        const child = spawn(`tsc --project ${extsPath}`,{stdio: 'inherit', shell: true});

        child.on('exit', function (code:any, signal:any) {
            console.log(`${moduleName} Extensions Complete.`);

            terminateOnCompletion(EXT_BUILD);
          });
    }
    catch(err) {
        console.log("Error: " + err);
    }

};


// node EFTutorBuilder/TestBuilder/dist/compiler.js
function buildDataResources(moduleName:string) {

    let dataBuilderPath = path.join(twd, DATABUILDER);

    try {
        const child = spawn(`node ${dataBuilderPath} ${moduleName}`,{stdio: 'inherit', shell: true});

        child.on('exit', function (code:any, signal:any) {
            console.log(`${moduleName} - Data Resources Complete.`);

            terminateOnCompletion(DATA_BUILD);
        });
    }
    catch(err) {
        console.log("Error: " + err);
    }

};



function buildAudioResources(moduleName:string) {

    let audioBuilderPath = path.join(twd, AUDIOBUILDER);

    try {
        const child = spawn(`node ${audioBuilderPath} ${moduleName}`,{stdio: 'inherit', shell: true});

        child.on('exit', function (code:any, signal:any) {
            console.log(`${moduleName} Audio Resources Complete.`);

            terminateOnCompletion(AUDIO_BUILD);
          });
    }
    catch(err) {
        console.log("Error: " + err);
    }

};


function calcTutorFolder() : string {

    modName = RX_MODULENAME.exec(process.cwd());

    rwd = path.relative(process.cwd(), __dirname);
    // console.log("Relative working Directory  = " + rwd);

    twd = path.resolve(rwd,TUTORBASEFOLDER);
    // console.log("Tutor working Directory  = " + twd);

    return twd;
}


function listTutors() : Array<string>{

    let fpath:string = path.join(twd, TUTORRELPATH);

    try {
        let files:Array<string> = fs.readdirSync(fpath);

        files.forEach(file => {

            let _path = fpath +"/"+file;

            try {
                let stats:any = fs.statSync(_path);

                if(stats.isDirectory()) {

                    let configPath = path.join(_path, TUTORCONFIG);

                    try {
                        // Check if tutorconfig.json exists
                        //
                        fs.accessSync(configPath);

                        lTutors.push(file);
                    }
                   catch(err) {
                       // Ignore folder - not a tutor description folder
                   }
                }
            }
            catch(error) {

                console.log("Error = " + error);
            }
        });
    }
    catch(error) {

        console.log("Error = " + error);
    }

    return lTutors;
}

function listModules() : Array<string>{

    let fpath:string = path.join(twd);  //, TUTORRELPATH

    try {
        let files:Array<string> = fs.readdirSync(fpath);

        files.forEach(file => {

            let _path = path.join(fpath, file);
            try {
                let stats:any = fs.statSync(_path);

                if(stats.isDirectory()) {

                    if(file.startsWith("EFMod_")) {
                        lModules.push(file);
                    }
                }
            }
            catch(error) {

                console.log("Error = " + error);
            }
        });
    }
    catch(error) {

        console.log("Error = " + error);
    }

    return lModules;
}





getTutorToBuild();