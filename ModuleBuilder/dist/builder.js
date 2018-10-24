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
const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const HEXCHARS = "0123456789ABCDEF";
const ANDOMDOCUMENT = "DOMDocument.xml";
const EFLOADERCONFIG = "EFconfig.json";
const MODULEPROMPT = "\nEdForge Module Initializer.\n\nSelect Module To Initialize:\n=======================\n";
const TUTORBASEFOLDER = "../../../";
const TUTORRELPATH = "EFTutors";
const MODULETHIS = "MODULETHIS";
const RX_MODULENAME = /EFMod_\w*/;
let module_name;
let twd;
let rwd;
let modName;
let lModules = new Array();
/**
 * When debugging the module may not be defined as an argument.
 * (You may use a vscode launch configuration to set args[] to define a target)
 *
 * This function will provide a realtime listing of modules which may be built.
 * and prompt the user to select a build target.
 */
function getModuleToBuild() {
    calcTutorFolder();
    listModules();
    try {
        if (process.argv[2] && process.argv[2] === MODULETHIS) {
            if (!modName) {
                console.info("Error: command must be run from Root folder of Module.");
                terminate();
            }
            else {
                let target = lModules.indexOf(modName[0]);
                if (target >= 0) {
                    module_name = lModules[target];
                    console.log(`Building: ${modName[0]}`);
                    generateModuleGUID();
                }
            }
        }
        // If there is just one Module -- build it
        // 
        else {
            if (!process.argv[2] || !lModules.includes(process.argv[2])) {
                let queryText = MODULEPROMPT;
                lModules.forEach((element, index) => {
                    queryText += (index + 1) + ":\t" + element + "\n";
                });
                queryText += "\n>";
                rl.question(queryText, (answer) => {
                    let target = parseInt(answer) - 1;
                    if (target >= 0 && target < lModules.length) {
                        module_name = lModules[target];
                        console.log(`\n\nBuilding: ${module_name}\n`);
                        generateModuleGUID();
                    }
                    else {
                        console.error("\n\nInvalid selection!\n");
                        terminate();
                    }
                    rl.close();
                });
            }
            else {
                let target = lModules.indexOf(process.argv[2]);
                module_name = lModules[target];
                console.log(`\n\nBuilding: ${module_name}\n`);
                generateModuleGUID();
            }
        }
    }
    catch (err) {
    }
}
function terminate() {
    process.exit(0);
}
function calcTutorFolder() {
    modName = RX_MODULENAME.exec(process.cwd());
    rwd = path.relative(process.cwd(), __dirname);
    // console.log("Relative working Directory  = " + rwd);
    twd = path.resolve(rwd, TUTORBASEFOLDER);
    // console.log("Tutor working Directory  = " + twd);
    return twd;
}
function listModules() {
    let fpath = path.join(twd); //, TUTORRELPATH
    try {
        let files = fs.readdirSync(fpath);
        files.forEach(file => {
            let _path = fpath + "/" + file;
            try {
                let stats = fs.statSync(_path);
                if (stats.isDirectory()) {
                    if (file.startsWith("EFMod_")) {
                        lModules.push(file);
                    }
                }
            }
            catch (error) {
                console.log("Error = " + error);
            }
        });
    }
    catch (error) {
        console.log("Error = " + error);
    }
    return lModules;
}
function genGUID() {
    let GUID = "";
    for (let i1 = 0; i1 < 32; i1++) {
        GUID += HEXCHARS.charAt(Math.floor(Math.random() * HEXCHARS.length));
    }
    return GUID;
}
/**
 * THere are 2 points in the AnimateCC v18.0.1 EdForge module DOMdocument that require updating to
 * ensure the projects generated GUID is unique.
 *
 * The  fileGUID="A92278A09E00DEC3430093590DA2ADC5" attribute on the XML document itself and
 * in the Module Components parameter data passed to the Module Component on initialization
 * by Animate Component Boot code
 *
 */
function generateModuleGUID() {
    let domDocPath = path.join(twd, module_name, ANDOMDOCUMENT);
    console.info(domDocPath);
    // *****************************************************
    // Update the AnimateCC project XMLDocument
    // 
    var DOMParser = require('xmldom').DOMParser;
    var XMLSerializer = require('xmldom').XMLSerializer;
    let parser = new DOMParser();
    let serializer = new XMLSerializer();
    // Read the DOMDocument file and parse it into XML
    // 
    let _document = fs.readFileSync(domDocPath, "utf8");
    var doc = parser.parseFromString(_document, 'text/xml');
    var _fileGUID = genGUID();
    console.info(_fileGUID);
    //  Set the guid on the document itself
    doc.documentElement.setAttribute('fileGUID', _fileGUID);
    // There is only one parametersAsXML node in this document
    // TODO: manage other cases
    // 
    var element = doc.documentElement.getElementsByTagName("parametersAsXML");
    // extract the CData 
    var compXML = element[0].childNodes[0].data;
    // Note this is a special case - there is no containing outer document.
    // i.e. it is a list of <property> elements.
    // 
    let cdata = parser.parseFromString(compXML, 'text/xml');
    // Get the Inspectables from the parsed CData and set the defaultValue
    // Note: this is sensitive to the efModule.js AnimateCC custom component 
    // implementation.
    // 
    let inspectables = cdata.documentElement.getElementsByTagName("Inspectable");
    inspectables[0].setAttribute('defaultValue', _fileGUID);
    element[0].childNodes[0].data = serializer.serializeToString(cdata);
    // Generate the new DOMDocument from the XML
    let update = serializer.serializeToString(doc.documentElement);
    // console.info(update);
    try {
        fs.writeFileSync(domDocPath, update, 'utf8');
    }
    catch (err) {
        if (err) {
            console.error('ERROR:', err);
            return;
        }
    }
    // *****************************************************
    // Update/Add the associated anModule entry in <MOD>/Efconfig.json
    let loaderPath = path.join(twd, module_name, EFLOADERCONFIG);
    console.info(loaderPath);
    let loaderJSON = fs.readFileSync(loaderPath, "utf8");
    var loaderDoc = JSON.parse(loaderJSON);
    loaderDoc.compID = _fileGUID;
    // Generate the new DOMDocument from the XML
    // 
    let loaderUpdate = JSON.stringify(loaderDoc, null, '\t');
    console.info(loaderUpdate);
    try {
        fs.writeFileSync(loaderPath, loaderUpdate, 'utf8');
    }
    catch (err) {
        if (err) {
            console.error('ERROR:', err);
            return;
        }
    }
    console.info("Update Complete");
}
getModuleToBuild();
//# sourceMappingURL=builder.js.map