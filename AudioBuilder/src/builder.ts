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

import {convert} from "./converter";

import { findArray, 
         segment, 
         scriptInstance, 
         templValue, 
         cuePoint, 
         requestType, 
         segmentVal,
         templateType} from "./IAudioTypes";

const fs        = require('fs');
const path      = require('path');
const readline  = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const TEMPLATEVAR:string = "templateVar"; 

const NOVAR:string = "__novar";

const RX_SGMLTAGS   = /<[^>\r]*>/g;
const RX_HTMLTAGS   = /<\/?(p|b|i|br|style|span)>/g;
const RX_DUPWHITESP = /\s+/g;
const RX_WHITESPACE = /\s/g;
const RX_TEMPLATES  = /\{\{[^\}]*\}\}/g;
const RX_TEMPLTRIM  = /\s*(\{\{[^\}]*\}\})\s*/g;
const RX_TEMPLTAGS  = /\{\{|\}\}/g;
const RX_GSELECTOR  = /\{\{\$.*?_|\}\}/g;
const RX_CUEPOINTS  = /[^\.\"]/g;
const RX_DUPPUNCT   = /\s+([,\.])+\s/g;
const RX_MODULENAME = /EFMod_\w*/;

// REGEX to Decompose the selector
// 
const RX_GENSELECTOR = /\{\{((\$EF\w*?_)(([\w_\.\?]*)\|?([\w_\?]*)\|?([\w_\?]*)))\}\}/g;

const NDX_RAWTEMPLATE:number  = 0;      // e.g. "{{$EFO_S_A?|name|1}}"  | "{{$EFM_selectedArea.ontologyKey}}"
const NDX_RAWSELECTOR:number  = 1;      // e.g. "$EFO_S_A?|name|1"      | "$EFM_selectedArea.ontologyKey"
const NDX_SELECTORSIG:number  = 2;      // e.g. "$EFO_"                 | "$EFM_"
const NDX_SELECTOR:number     = 3;      // e.g. "S_A?|name|1"           | "selectedArea.ontologyKey"
const NDX_OBJSELECTOR:number  = 4;      // e.g. "S_A?"                  | "selectedArea.ontologyKey"
const NDX_PROPSELECTOR:number = 5;      // e.g. "name"                  | ""
const NDX_VARIANT:number      = 6;      // e.g. "1"                     | ""



// regex to decompose selectors - $EFO_<xxx>  $EFTR_<xxx> etc.  returns SelectorSig $1 and Selector $2
// this instance extracts it from a template instance.
// 
const RX_SELECTOR   = /(\$EF\w*?_)([^\}]*)/;            

const ASCII_a       = 97;
const ASCII_A       = 65;
const ZERO_SEGID    = 0;

const TAG_SPEAKSTART = "<speak>";
const TAG_SPEAKEND   = "</speak>";

const TUTORBASEFOLDER:string = "../../../";
const TUTORRELPATH:string    = "EFTutors";
const MODULEPROMPT:string    = "\nEdForge Tutor Script-Asset Compiler.\n\nSelect Module To Build:\n=======================\n"

const VOICES:string      = "EFAudio/EFscripts/languagevoice.json";
const SCRIPT:string      = "EFAudio/EFscripts/script.json";
const SCRIPTOUT:string   = "EFAudio/EFscripts/script_assets.json";
const ASSETS_PATH        = "EFAudio/EFassets";
const LIBRARY:string     = "EFbuild/_EFLIBRARYDATA.json";
const ONTOLOGY:string    = "EFbuild/_EFTUTORDATA.json";
const COMMONASSET:string = "common";

const GLOBALONTOLOGY_SELECTOR  = "$EFGO_";
const MODULEONTOLOGY_SELECTOR  = "$EFO_";
const TRACK_SELECTOR           = "$EFTR_";
const SCENESTATE_SELECTOR      = "$EFS_";
const MODULESTATE_SELECTOR     = "$EFM_";
const TUTORSTATE_SELECTOR      = "$EFT_";
const MODULELIBRARY_SELECTOR   = "$EFL_";
const GLOBALLIBRARY_SELECTOR   = "$EFG_";
const FOREIGNMODULE_SELECTOR   = "$EFFM_";


const TYPE_MP3          = ".mp3";
const TYPE_WAV          = ".wav";

const MODULETHIS:string  = "MODULETHIS";

// Maintain a global template flag to avoid template duplication
// 
let templRendered:templateType;
let _duplicates:number = 0;

let libraryPath:string;
let lib_Loaded:boolean = false;
let library:any;

let ontologyPath:string;
let ont_Loaded:boolean = false;
let ontology:any;

let voices:any; 
let scripts:any;

let lModules:Array<string> = new Array<string>();

let templArray:Array<findArray>;
let ntemplArray:Array<findArray>;
let cueArray:Array<findArray>;
let wordArray:Array<string>;
let segmentArray:Array<segment>;

let filesRequested:number = 0;
let filesProcessed:number = 0;

let twd:string;
let rwd:string;
let modName:RegExpExecArray;

let voicesPath:string;
let scriptPath:string;
let scriptOutPath:string;
let assetsPath:string;
let module_name:string;

let promises: Array<Promise<any>> = [];
let requests: Array<any> = [];
let reqDelay:number;
let currRequest = 0;



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

        if(process.argv[2] && process.argv[2] === MODULETHIS) {

            if(!modName) {
                console.info("Error: command must be run from Root folder of Module.");
            }
            else {
                let target = lModules.indexOf(modName[0]);

                if(target >= 0) {
                    module_name = lModules[target];

                    console.log(`Building: ${modName[0]}`);
                    buildScript();
                }
            }
        }

        // If there is just one Module -- build it
        // 
        else {

            if(!process.argv[2] || !lModules.includes(process.argv[2])) {
                
                let queryText:string = MODULEPROMPT; 
                
                lModules.forEach((element:string, index:number) => {
                    queryText += (index+1) + ":\t" + element + "\n";
                });
                queryText += "\n>";

                rl.question(queryText, (answer:string) => {
                    
                    let target = parseInt(answer)-1;

                    if(target >= 0 && target < lModules.length) {
                    
                        module_name = lModules[target];

                        // console.log(`\n\nBuilding: ${modulePath}\n`);
                        buildScript();
                    }
                    else {
                        console.error("\n\nInvalid selection!\n");
                    }

                    rl.close();
                    });                
            }
            else {
                let target = lModules.indexOf(process.argv[2]);

                module_name = lModules[target];

                // console.log(`\n\nBuilding: ${modulePath}\n`);
                buildScript();
            }
        }
    }
    catch(err) {
                
    }
}


function buildScript() {

    let segID = ZERO_SEGID;
    let promises;

    voicesPath    = path.join(twd, module_name, VOICES);
    scriptPath    = path.join(twd, module_name, SCRIPT);
    scriptOutPath = path.join(twd, module_name, SCRIPTOUT);
    assetsPath    = path.join(twd, module_name, ASSETS_PATH);    

    try {
        voices  = JSON.parse(fs.readFileSync(voicesPath)); 
        scripts = JSON.parse(fs.readFileSync(scriptPath));

        load_Library();
        load_Ontology();
        
        rmdirSync(assetsPath, false);

        for(let scene in scripts) {

            for(let track in scripts[scene].tracks) {

                preProcessScript(scripts[scene].tracks[track].en);
            }        
        }    

        for(let scene in scripts) {

            for(let track in scripts[scene].tracks) {

                postProcessScript(scripts[scene].tracks[track].en, segID);
            }        
        }    
        
        requests   = [];
        currRequest = 0;

        generateSynthesisRequests(scripts, voices, requests);

        console.log(_duplicates + "Templates Ignored.");

        // This was set at request.length > 290 which would be the most in a minute but Google seems to have changed
        // there calcs to not ever allowing a rate that would exceed the threshold not actually exceeding it.
        // 
        if(requests.length) {
            if(requests.length > 0) reqDelay = 240;
                                 else reqDelay = 0;

            setTimeout(renderRequest, 0, currRequest );
        }
        else 
            setTimeout(terminate, 3000);
    }
    catch(err) {
        console.error("AUDIO ERROR: " + err);
    }
}


function terminate() {

    process.exit(0);
}


function finish() {

    Promise.all(promises).then(() => {

        updateProcessedScripts(scriptOutPath);
        console.log("\n\nAssets Processing Complete!");

        // Strip the segmentation from the script - just to make it easier to read
        // We do this here so that the trim array is initialized
        // 
        for(let scene in scripts) {

            for(let track in scripts[scene].tracks) {

                scripts[scene].tracks[track].en.segments  = [];    
                scripts[scene].tracks[track].en.templates = {};
            }        
        }    
        updateProcessedScripts(scriptPath);
        console.log("Script Processing Complete!\n\n");    

        setTimeout(terminate, 3000);
    });
}


// Note that if we exceed the quota limit we throttle the rendering rate
// so the requests don't fail.
// 
function renderRequest(currRequest:number) {

    promises.push( synthesizeVOICE(requests[currRequest]) );

    if(currRequest < requests.length-1)
        setTimeout(renderRequest, reqDelay, currRequest+1 );
    else 
        finish();
}


function synthesizeVOICE(_request:any) : Promise<any>  {

    let request:requestType = _request.request; 
    let outputFile:string   = _request.path;
    let seg:segmentVal      = _request.seg;
    let src:string          = _request.src;
    let tar:string          = _request.tar;

    const textToSpeech = require('@google-cloud/text-to-speech');
    const fs = require('fs');
  
    const client:any = new textToSpeech.TextToSpeechClient();  
    
    // console.log(`Processing Script  : ${request.input.ssml} to file: ${outputFile}`);
    console.log(" Packet Source: " + src + " > " + tar);
    console.log(`Requested SSML: ${request.input.ssml}`);

    let promise = client.synthesizeSpeech(request).then((response:any) => {
    
        filesProcessed++;

        convert(outputFile+TYPE_MP3, response[0].audioContent, seg);

        // console.log(`Audio content  : ${request.input.ssml}`);
        // console.log(`Audio content written to file: ${outputFile}`);
        // process.stdout.write(`\rFiles Requested: ${filesRequested} -- Files Processed: ${filesProcessed}`);
        // console.log(`Files Requested: ${filesRequested} -- Files Processed: ${filesProcessed}`);          

        // TODO: Make wav output conditional on script attribute  e.g. "wav":true/false
        // fs.writeFileSync(outputFile+TYPE_WAV, response[0].audioContent, 'binary', (err:string) => {
        //   if (err) {
        //     console.error('ERROR:', err);
        //     return;
        //   }
        // });

    }).catch((err:any) => {
        console.error('ERROR:', err);
        return;
      });

    return promise;
}
 




function load_Library() {

    libraryPath   = path.join(twd, module_name, LIBRARY);    

    console.log("Loading Library Path: " + libraryPath);
    try {
        if(!lib_Loaded) {
            library    = JSON.parse(fs.readFileSync(libraryPath));
            lib_Loaded = true;
        }
    }
    catch(err) {
        console.log("Error: " + err);
    }

}


function load_Ontology() {

    ontologyPath   = path.join(twd, module_name, ONTOLOGY);    

    console.log("Loading Ontology Path: " + ontologyPath);
    try {
        if(!ont_Loaded) {
            ontology    = JSON.parse(fs.readFileSync(ontologyPath));
            ont_Loaded = true;
        }
    }
    catch(err) {
        console.log("Error: " + err);
    }

}

function calcTutorFolder() : string {

    modName = RX_MODULENAME.exec(process.cwd());
    
    rwd = path.relative(process.cwd(), __dirname);
    // console.log("Relative working Directory  = " + rwd);

    twd = path.resolve(rwd,TUTORBASEFOLDER);
    // console.log("Tutor working Directory  = " + twd);

    return twd;
}


function listModules() : Array<string>{

    let fpath:string = path.join(twd);  //, TUTORRELPATH

    try {
        let files:Array<string> = fs.readdirSync(fpath);

        files.forEach(file => {

            let _path = fpath +"/"+file;

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

        console.error("Error = " + error);

    }

    return lModules;
}


function enumerateItems(regex:RegExp, text:string) : Array<findArray> {

    let templArray:Array<findArray> = [];
    let templ:findArray;

    while((templ = regex.exec(text)) !== null) {

        templArray.push(templ);
        templ.endIndex = regex.lastIndex;
        // console.log(`Found ${templ[NDX_RAWTEMPLATE]} at: ${templ.index} Next starts at ${regex.lastIndex}.`);
    }

    return templArray;
}


function resolveSource(inst:scriptInstance) : string {

    let result:string = inst.html;

    try {
        if(inst.datasource) {

            // let srcPath:Array<string> = inst.datasource.split(".");

            // let libval = library._LIBRARY[srcPath[1]][srcPath[2]];
            let libval = resolveSelector(null, inst.datasource);

            if(!libval.htmlData || !libval.htmlData.html) {
                console.error("ERROR: HTML Datasource Malformed: " + inst.datasource);
            }
            else 
                result = libval.htmlData.html;

            inst.templates = libval.templates || {};
        }
        else {
            result = inst.html;
        }
    }
    catch(err) {

        console.error("Library Load Failed: " + err);
    }

    return result;
}


function preProcessScript(inst:scriptInstance) {

    let html:string = resolveSource(inst);

    if(html) {

        let match = html.match(RX_HTMLTAGS);
        if(match)
            console.log(match);

        // Remove all HTML/SSML tags
        inst.text = html.replace(RX_HTMLTAGS,"");

        // Remove duplicate whitespace
        inst.text = inst.text.replace(RX_DUPWHITESP," ");

        // Remove duplicate punctuation
        inst.text = inst.text.replace(RX_DUPPUNCT,"$1 ");
        
        // Trim spaces around Templates.
        // This eliminates confusion if the string begins or ends or 
        // is exclusively a template.   e.g. "  {{templatevar}}   "
        //
        inst.text = inst.text.replace(RX_TEMPLTRIM,"$1");

        // trim the template values themselves - don't want 
        // extraneous whitespace around template values.
        // 
        for(let item in inst.templates) {
            trimTemplateValues(inst.templates[item]);
        }

        inst.cueSet = inst.cueSet    || "";
        inst.cueSet = preFillCueSet(inst.text, inst.cueSet);

        templRendered = {};
        inst.segments = [];

        inst.timedSet  = inst.timedSet  || [];
        inst.templates = inst.templates || {};
        inst.trim      = inst.trim      || [];
        inst.volume    = inst.volume    || [];
    }
    else {
        console.error("ERROR: Library reference cannot be resolved. " + inst);
    }
}


// Note that templates should always resolve to a specific string - Therefore we 
// maintain only a single instance in a common _templates object.
// 
function resolveTemplates(inst:scriptInstance) : string {

    let result:string = inst.text;  // Don't change non-templates

    let templArray:Array<findArray>;

    templArray = enumerateTemplates(RX_TEMPLATES, inst.text);

    composeTemplateCollections(inst, templArray);

    return result;
}

function enumerateTemplates(regex:RegExp, text:string) : Array<findArray> {

    let templArray:Array<findArray> = [];
    let templ:findArray;

    while((templ = regex.exec(text)) !== null) {

        templArray.push(templ);
        templ.endIndex = regex.lastIndex;
        // console.log(`Found ${templ[NDX_RAWTEMPLATE]} at: ${templ.index} Next starts at ${regex.lastIndex}.`);
    }

    return templArray;
}


function composeTemplateCollections(inst:scriptInstance, templArray:Array<findArray>) : void {


    if(templArray && templArray.length) {

        // enumerate the templates to segment the text for TTS synthesis and playback
        // 
        for(let templ of templArray) {

            console.log(templ[NDX_RAWTEMPLATE]);

            // First add the text before or between template(s) if there is any
            // 
            resolveSelector(inst, templ[NDX_RAWTEMPLATE]);
        }
    }
}


function resolveSelector(inst:scriptInstance, template:string ) : any{

    let dataPath:Array<string>;
    let result:any = null;

    let selectorVal:RegExpExecArray = RX_SELECTOR.exec(template);

    if(selectorVal) {
        switch(selectorVal[1]) {

            case MODULEONTOLOGY_SELECTOR:                

                let currTemplate = inst.templates[selectorVal[0]] = inst.templates[selectorVal[0]] || {};

                // Extract the varray with the object selector and property key
                // Extract the query array with the selector elements
                // 
                let vArray:Array<string> = selectorVal[2].split("|");
                let qArray:Array<string> = vArray[0].split("_");
    
                resolveOntologyCollection(vArray[0], ontology._ONTOLOGY, qArray, vArray[1], currTemplate, "");
                break;   

            case GLOBALONTOLOGY_SELECTOR:                

                break;   

            case TRACK_SELECTOR:

                break;

            case SCENESTATE_SELECTOR:

                break;

            case MODULESTATE_SELECTOR:
                break;
            
            case TUTORSTATE_SELECTOR:

                break;
            
            case FOREIGNMODULE_SELECTOR:

                break;

            case MODULELIBRARY_SELECTOR:

                result = resolveObject(library._LIBRARY, selectorVal[2]);
                break;
            
            case GLOBALLIBRARY_SELECTOR:

            break;
        }
    }

    return result;
}


function resolveObject(baseObj:any, objPath:string ) : any {

    let dataPath:Array<string> = objPath.split(".");

    try {
        dataPath.forEach((element:string) => {

            baseObj = baseObj[element];
        });
    }
    catch(err) {
        console.error("Object Resolution Error: " + err + " -- " + objPath);
        throw(err);
    }

    return baseObj;
}


function resolveOntologyCollection(oSelector:string, ontologyRoot:any, qArray:Array<string>, propertyId:string, currTemplate:any, templateId:string) : void {

    let result:any = oSelector;

    try {
        if(qArray.length > 0) {

            if(qArray[0].includes("?")) {

                let query:string = qArray[0].replace(/\?/, ".*");

                for(let prop in ontologyRoot) {

                    if(prop.match(new RegExp(query)))
                        resolveOntologyCollection(oSelector, ontologyRoot[prop], qArray.slice(1), propertyId, currTemplate, `${templateId}${prop}`);
                }
            }
            else {

                resolveOntologyCollection(oSelector, ontologyRoot[qArray[0]], qArray.slice(1), propertyId, currTemplate, `${templateId}${qArray[0]}`)
            }
        }
        else if(ontologyRoot[propertyId]) {

            let templateName = templateId+propertyId;

            templRendered[templateName] = false;
            currTemplate[templateName]  =  templRendered[templateName] || ontologyRoot[propertyId];
        }
    }
    catch(err) {
        console.error("AUDIO ERROR: " + err + " -- " + oSelector);
        throw(err);
    }
}





function preFillCueSet(text:string, cueSet:string) : string {

    if(cueSet === "") {
        for(let i1 = 0 ; i1 < text.length ; i1++) {
            cueSet += ".";
        }
    }
    return cueSet;
}


function trimTemplateValues(templ:templValue) {

    for(let item in templ) {
        templ[item] = templ[item].trim();
    }
}

function trimCuePoints(cueArray:Array<findArray>, inst:scriptInstance) {

    let length = inst.text.length;

    // Ensure cue points aren't past the end of the utterance.
    //
    for(let cue of cueArray) {
        if(cue.index > length)
            cue.index = length;
    }
}


function postProcessScript(inst:scriptInstance, segID:number) {
        
    resolveTemplates(inst);

    wordArray  = inst.text.split(RX_WHITESPACE);

    templArray = enumerateItems(RX_GENSELECTOR, inst.text);
    
    cueArray = enumerateItems(RX_CUEPOINTS, inst.cueSet);
    trimCuePoints(cueArray, inst);

    segmentScript(inst, segID++);

    // Try to maintain user defined segment trims but 
    // If the trim array is empty or doesn't match the 
    // segment count we reset
    // 
    if(inst.trim.length != inst.segments.length) {

        inst.trim = new Array<number>();

        for(let i1 = 0 ; i1 < inst.segments.length ; i1++) {
            inst.trim.push(0);
        }
    }
    // Try to maintain user defined segment volumes but 
    // If the volume array is empty or doesn't match the 
    // segment count we reset
    // 
    if(inst.volume.length != inst.segments.length) {

        inst.volume = new Array<number>();

        for(let i1 = 0 ; i1 < inst.segments.length ; i1++) {
            inst.volume.push(1.0);
        }
    }

    // We do a posthoc insertion of the trim|volume values into the script 
    // segments.
    // 
    for(let i1 = 0 ; i1 < inst.segments.length ; i1++) {

        let segVal = inst.segments[i1];

        for(let segVar in segVal) {

            if(segVar == TEMPLATEVAR) continue;
            (segVal[segVar] as segmentVal).trim   = inst.trim[i1];
            (segVal[segVar] as segmentVal).volume = inst.volume[i1];
        }
    }
}


function segmentScript(inst:scriptInstance, segID:number) {

    let start:number = 0;
    let end:number   = inst.text.length;

    if(templArray.length) {
        start    = 0;

        // enumerate the templates to segment the text for TTS synthesis and playback
        // 
        for(let templ of templArray) {

            // First add the text before the template if there is any
            // 
            end = templ.index;            
            if(start < end)
                addSegment(inst, null, start, end, segID++ );

            // then add the template itself
            start = templ.index;
            end   = templ.endIndex;

            addSegment(inst, templ, start, end, segID++ );

            start = end;
        }
    }

    // Finally add the text after the last template if there is any
    // 
    end = inst.text.length;            
    if(start < end)
        addSegment(inst, null, start, end, segID++ );
}


function addSegment(inst:scriptInstance, templ:findArray, start:number, end:number, segID:number ) {

    if(templ) {

        try {
            let templVals:templValue = inst.templates[templ[NDX_RAWSELECTOR]];

            inst.segments.push(composeSegment(templ[NDX_RAWSELECTOR], templVals, start, end, segID));
        }
        catch(error) {

            console.error("Possible missing Template: " + error);
        }
    }
    else {

        let segStr    = segID.toString();
        let scriptSeg = inst.text.substring(start, end);

        inst.segments.push(composeSegment(NOVAR,{__novar:scriptSeg}, start, end, segID));
    }
}


function composeSegment(templVar:string, templVals:templValue, start:number, end:number,  segID:number) : segment {

    let seg:segment     = {templateVar:templVar};
    let subSegID:number = ZERO_SEGID;

    for(let templValName in templVals) {

        let text = templVals[templValName];

        let cuePoints:Array<cuePoint> = composeCuePoints(text,start,end);

        let segStr:string = segID.toString() + ((templValName !== NOVAR)? charEncodeSegID(ASCII_a, subSegID++):"");

        // console.log(`Adding Segment: ${text} - id:${segStr}`);

        seg[templValName] = {
            fileid:segStr,
            SSML:text,
            cues:cuePoints,
            duration:0,
            trim:0,
            volume:1.0
        }
    }

    return seg;
}


function composeCuePoints(templVar:string, start:number, end:number ) : Array<cuePoint> {

    let cues:Array<cuePoint> = [];
    let length:number = end - start - 1;

    for(let cuePnt of cueArray) {
        if(cuePnt.index >= start && cuePnt.index < end) {

            let segCue:cuePoint = {
                name   : cuePnt[0],
                offset : ((cuePnt.index - start) / (length)),
                relTime : 0
            };

            cues.push(segCue);
        }
    }

    return cues;
}


function charEncodeSegID(charBase:number, subindex:number) : string {

    let result:string = "";

    if(subindex >= 26)
        result = charEncodeSegID(ASCII_A, subindex/26);

    result += String.fromCharCode(charBase + subindex % 26);

    return result;
}


function updateProcessedScripts(path:string) {

    let scriptUpdate:string = JSON.stringify(scripts, null, '\t');

    fs.writeFileSync(path, scriptUpdate, 'utf8');
}


function clone(obj:any):any {
    var copy:any;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


// \\ISP_TUTOR\\<moduleName>\\EFaudio\\EFassets\\<Lang>\\<sceneName>\\<<trackName>_s<segmentid>_v<voiceId>>[.mp3]
// 
function generateSynthesisRequests(input:any, languages:any, requests:Array<any>) {

    for(let scene in input) {

        for(let track in input[scene].tracks) {

            if(!input[scene].tracks[track]) {                    
                console.error(`script error at: scene:${scene} track:${track}`);
                throw("SCRIPT ERROR");
            }

            for(let lang in input[scene].tracks[track]) {

                if(!input[scene].tracks[track][lang].segments) {                    
                    console.error(`script error at: scene:${scene} track:${track} lang:${lang}`);
                    throw("SCRIPT ERROR");
                }

                for(let seg of input[scene].tracks[track][lang].segments) {

                    for(let segVal in seg) {

                        if(seg[segVal].fileid) {

                            for(let language in languages) {

                                for(let voice in languages[language]) {

                                    let _request:requestType = clone(languages[language][voice].request);
                                    let filePath:string;
                                    let fileName:string;

                                    if(segVal === NOVAR) {
                                        filePath = path.join(twd, module_name, ASSETS_PATH, lang, scene);
                                        fileName = track + "_s" + seg[segVal].fileid + "_v" + voice;
                                    }
                                    else {
                                        if(templRendered[segVal]) {
                                            _duplicates++;
                                            continue;
                                        }
                                        else {
                                            filePath = path.join(twd, module_name, ASSETS_PATH, lang, COMMONASSET);
                                            fileName = segVal + "_v" + voice;
                                        }
                                    }

                                    validatePath(filePath, null);

                                    _request.input.ssml = TAG_SPEAKSTART + seg[segVal].SSML + TAG_SPEAKEND;
                                    
                                    filesRequested++;

                                    requests.push(
                                                    {
                                                    "request":_request,
                                                    "path": path.join(filePath, fileName), 
                                                    "seg":seg[segVal],
                                                    "src":seg.templateVar,
                                                    "tar":fileName
                                                    }
                                                );
                                }
                            }
                            // Once all languages and voices are rendered set flag so we don't duplicate recorderings
                            // 
                            templRendered[segVal] = true;
                        }
                    }
                }
            }        
        }        
    }    

}


function validatePath(path:string, folder:string) {

    let pathArray:Array<string> = path.split("\\");

    try {
        let stat = fs.statSync(path);

        if(stat.isDirectory) {

            if(folder)
                fs.mkdirSync(path + "\\" + folder);
        }
    }
    catch(err) {

        let last = pathArray.pop();
        validatePath(pathArray.join("\\"), last);

        if(folder)
            fs.mkdirSync(path + "\\" + folder);
    }
}


function rmdirSync(dir:string, delRoot:boolean) {

    try {
        var list = fs.readdirSync(dir);

        for(var i = 0; i < list.length; i++) {

            var filename = path.join(dir, list[i]);
            var stat = fs.statSync(filename);
            
            if(filename == "." || filename == "..") {
                // ignore
            } else if(stat.isDirectory()) {
                // rmdir recursively
                rmdirSync(filename, true);
            } else {
                // rm filename
                fs.unlinkSync(filename);
            }
        }
        if(delRoot)
            fs.rmdirSync(dir);
    }
    catch(err) {
        // Ignore missing folder
    }
};

getModuleToBuild();