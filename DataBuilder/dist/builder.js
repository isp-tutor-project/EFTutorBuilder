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
const { JSDOM } = jsdom;
const TUTORBASEFOLDER = "../../../";
const TUTORRELPATH = "EFTutors";
const MODULEPROMPT = "\nEdForge Tutor Data-Asset Compiler.\n\nSelect Module To Build:\n=======================\n";
const MODULE_SIGNATURE = "_MODULEDATA"; // one of Required Property  
const GLOBAL_SIGNATURE = "_GLOBALDATA"; // one of Required Property
const IMPORT_SIGNATURE = "_IMPORT";
const ONTOLOGY_SIGNATURE = "_ONTOLOGY";
const DATATYPE_GLOBAL = "GLOBAL";
const DATATYPE_MODULE = "MODULE";
const DATA_PATH = "EFdata";
const DATA_BUILD = "EFbuild";
const IMG_PATH = "images";
const RELIMG_PATH = "images/";
const DATA_GENFILE = "_EFTUTORDATA.json";
const LIBR_GENFILE = "_EFLIBRARYDATA.json";
const LIBR_SRCFILE = "LIBRARY.json";
const LIBRARY = "_LIBRARY";
const EXTERN_SIGNATURE = "$$EFX";
const HTML_EXT = ".html";
// custom HTML control types
// 
const EFTEXT_TYPE = "eftext";
const EFINPUT_TYPE = "efinput";
const EFLISTBOX_TYPE = "eflist";
const EFTABLE_TYPE = "eftable";
const MODULETHIS = "MODULETHIS";
const GLOBALTHIS = "GLOBALTHIS";
const CSS_CUSTOMSTYLE = "#customStyle";
const DOM_CTLCONTAINER = "#controlContainer";
let module_name;
let tutor_name;
let data_type;
const RX_MODULENAME = /EFMod_\w*/;
const RX_TUTORNAME = /EFTutors[\\/](\w*)/;
const RX_CONTROLNAME = /efcontrolname/ig;
const RX_CONTROLCLASS = /efcontrolclass/ig;
const RX_LIBRARYSIG = /\s*<\!-\s*edforge\s*external\s*->/i;
let lib_Loaded = false;
let library;
let libraryGen = { _LIBRARY: {} };
let data_assets = {};
let dataPath;
let libraryPath;
let libBuildPath;
let twd;
let rwd;
let modName;
let tutName;
let lModules = new Array();
let ldataModules = new Array();
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
        if (process.argv[2] && process.argv[2] === GLOBALTHIS) {
            data_type = DATATYPE_GLOBAL;
            module_name = tutName[0];
            tutor_name = tutName[1];
            console.log(`\n\nBuilding: ${module_name}\n`);
            buildDataAssets();
        }
        else if (process.argv[2] && process.argv[2] === MODULETHIS) {
            data_type = DATATYPE_MODULE;
            if (!modName) {
                console.info("Error: command must be run from Root folder of Module.");
            }
            else {
                let target = lModules.indexOf(modName[0]);
                if (target >= 0) {
                    module_name = lModules[target];
                    console.log(`Building: ${modName[0]}`);
                    buildDataAssets();
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
                        // console.log(`\n\nBuilding: ${target_name}\n`);
                        buildDataAssets();
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
                // console.log(`\n\nBuilding: ${target_name}\n`);
                buildDataAssets();
            }
        }
    }
    catch (err) {
    }
}
function buildDataAssets() {
    // setTimeout(terminate, 3000);
    let data;
    load_Library();
    listDataFiles();
    data_assets = {};
    data = processDataFiles(module_name, ldataModules);
    dataPath = path.join(twd, module_name, DATA_BUILD, DATA_GENFILE);
    updateProcessedData(data, dataPath);
    processLibraryDependencies(library[LIBRARY], libraryGen[LIBRARY]);
    libBuildPath = path.join(twd, module_name, DATA_BUILD, LIBR_GENFILE);
    updateProcessedData(libraryGen, libBuildPath);
    terminate();
}
function terminate() {
    console.log(`EFdata -- ${module_name} -- Processing Complete!`);
    process.exit(0);
}
function load_Library() {
    libraryPath = path.join(twd, module_name, DATA_PATH, LIBR_SRCFILE);
    // console.log("Loading Library Path: " + libraryPath);
    try {
        if (!lib_Loaded) {
            library = JSON.parse(fs.readFileSync(libraryPath));
            lib_Loaded = true;
        }
    }
    catch (err) {
        console.log("Error: " + err);
    }
}
function processDataFiles(moduleName, fileList) {
    let dataPath;
    // Combine data files into a single image.
    // 
    try {
        for (let file of fileList) {
            dataPath = path.join(twd, moduleName, DATA_PATH, file);
            let data = JSON.parse(fs.readFileSync(dataPath));
            // Check for Signature
            // 
            if (data[MODULE_SIGNATURE]) {
                data_assets = mergeDataObjects(data_assets, data, moduleName);
            }
            else if (data[GLOBAL_SIGNATURE]) {
                data_assets = mergeDataObjects(data_assets, data, moduleName);
            }
            // TODO: manage circular references
            // 
            if (data[IMPORT_SIGNATURE]) {
                data[IMPORT_SIGNATURE].forEach((importrequest) => {
                    let path = importrequest.split("|");
                    let files = path[1].split(",");
                    processDataFiles(path[0], files);
                });
            }
        }
        ;
    }
    catch (err) {
        console.error("Error: combining data sources: " + dataPath + " -- " + err);
        process.exit(1);
    }
    return data_assets;
}
function mergeDataObjects(data_assets, data, parent) {
    for (let element in data) {
        // don't clone IMPORT signatures.
        // 
        if (element === IMPORT_SIGNATURE)
            continue;
        if (data_assets[element]) {
            // if(!element.startsWith("_")) {
            //     console.error("ERROR: Ontology Conflict: " + element);
            // }
            if (isAnObject(data_assets[element])) {
                mergeDataObjects(data_assets[element], data[element], parent + "." + element);
            }
            else if (!element.startsWith("_")) {
                console.error("ERROR: Import Conflict: " + parent + "." + element);
            }
        }
        else {
            data_assets[element] = data[element];
        }
    }
    return data_assets;
}
function isAnObject(obj) {
    if (obj == null)
        return false;
    return obj.constructor.name.toLowerCase() === "object";
}
function processLibraryDependencies(library, libraryTar) {
    // Combine data files into a single image.
    // 
    try {
        // Walk all the different control types and scan each for controls
        // with external data.
        //
        for (let element in library) {
            let controlSpec = library[element];
            libraryTar[element] = controlSpec;
            // Support MultiSource controls - e.g. text controls may have arrays of datasources
            // 
            if (Array.isArray(controlSpec)) {
                controlSpec.forEach((controlItem, Index) => {
                    if (controlItem.src && controlItem.src.startsWith(EXTERN_SIGNATURE)) {
                        let pathArray = controlItem.src.split(".");
                        processExternalDep(pathArray[1], element, libraryTar[element].cssClass, libraryTar[element][Index], element);
                    }
                });
            }
            else if (isAnObject(controlSpec)) {
                if (controlSpec.src && controlSpec.src.startsWith(EXTERN_SIGNATURE)) {
                    let pathArray = controlSpec.src.split(".");
                    processExternalDep(pathArray[1], element, libraryTar[element].cssClass, libraryTar[element], element);
                }
                else if (!(controlSpec.datasource || controlSpec.layoutsource || controlSpec.htmlData)) {
                    processLibraryDependencies(library[element], libraryTar[element]);
                }
            }
            else {
                // console.log("Skipping leaf node: " + controlSpec);
            }
        }
    }
    catch (err) {
        console.error("Error: Parsing Library data: " + err);
        process.exit(1);
    }
    return libraryTar;
}
function processExternalDep(src, controlName, controlClass, libTargetElement, controlType) {
    let externPath = path.join(twd, module_name, DATA_PATH, src + HTML_EXT);
    let htmlData = fs.readFileSync(externPath, "utf8");
    if (RX_LIBRARYSIG.exec(htmlData)) {
        // Use the custom controls name to update the unique ID "efcontrolname" on the 
        // custom control CSS selector
        // 
        htmlData = htmlData.replace(RX_CONTROLNAME, controlName.toLowerCase());
        // This provides an alternate to using the control name - and allows aggregation
        // 
        if (controlClass)
            htmlData = htmlData.replace(RX_CONTROLCLASS, controlClass.toLowerCase());
        const dom = new JSDOM(htmlData);
        var elstyle = dom.window.document.querySelector(CSS_CUSTOMSTYLE);
        libTargetElement.htmlData = {};
        libTargetElement.htmlData.style = {};
        for (let rules of elstyle.sheet.cssRules) {
            let styleset = rules.style;
            console.log("\nSelector: " + rules.selectorText);
            let ruleSet = {};
            for (let i = styleset.length; i--;) {
                var nameString = styleset[i];
                ruleSet[nameString] = styleset[nameString];
                console.log('style: ' + nameString + ":" + styleset[nameString]);
            }
            libTargetElement.htmlData.style[rules.selectorText] = ruleSet;
        }
        var domRoot = dom.window.document.querySelector(DOM_CTLCONTAINER);
        // Change the base folder for img URLs - The live tutor accesses module
        // <img> data from the web root folder - not the relative folder used 
        // for authoring
        //
        var imageElements = domRoot.getElementsByTagName("img");
        console.log(imageElements.length);
        for (let i1 = 0; i1 < imageElements.length; i1++) {
            let imageName = imageElements[i1].src.substring(RELIMG_PATH.length);
            imageElements[i1].src = path.join(module_name, DATA_PATH, IMG_PATH, imageName);
            console.log(imageElements[i1].src);
        }
        // Process type-specific component properties
        // 
        switch (controlType) {
            case EFLISTBOX_TYPE:
                var selElement = domRoot.getElementsByTagName("select")[0] || domRoot;
                // var datasource = selElement.getAttribute("datasource");
                // if(datasource) {
                //     libTargetElement.datasource = datasource;
                // }
                for (let i1 = 0; i1 < selElement.length; i1++) {
                    var option = selElement[i1];
                    if (option.hidden == true) {
                        libTargetElement.placeholder = option.innerHTML;
                        break;
                    }
                }
                break;
            case EFTABLE_TYPE:
                // var selElement = domRoot.getElementsByTagName("table")[0] || domRoot;
                // var datasource = selElement.getAttribute("datasource");
                // if(datasource) {
                //     libTargetElement.datasource = datasource;
                // }
                break;
        }
        libTargetElement.htmlData.html = domRoot.innerHTML;
        // console.log("\n\n" + el.innerHTML);
    }
}
function updateProcessedData(data, path) {
    let dataUpdate = JSON.stringify(data, null, '\t');
    fs.writeFileSync(path, dataUpdate, 'utf8');
}
function calcTutorFolder() {
    let cwd = process.cwd();
    console.log("Current working Directory  = " + cwd);
    modName = RX_MODULENAME.exec(process.cwd());
    tutName = RX_TUTORNAME.exec(process.cwd());
    console.log(modName);
    console.log(tutName);
    rwd = path.relative(process.cwd(), __dirname);
    console.log("Relative working Directory  = " + rwd);
    twd = path.resolve(rwd, TUTORBASEFOLDER);
    console.log("Tutor working Directory  = " + twd);
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
function listDataFiles() {
    let fpath = path.join(twd, module_name, DATA_PATH);
    try {
        let files = fs.readdirSync(fpath);
        files.forEach(file => {
            let _path = fpath + "/" + file;
            try {
                let stats = fs.statSync(_path);
                if (!stats.isDirectory()) {
                    if (file === DATA_GENFILE || file === LIBR_GENFILE) {
                        return;
                    }
                    if (file.endsWith(".json")) {
                        ldataModules.push(file);
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
getModuleToBuild();
//# sourceMappingURL=builder.js.map