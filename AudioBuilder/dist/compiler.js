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
const converter_1 = require("./converter");
const fs = require('fs');
const path = require('path');
const TEMPLATEVAR = "templateVar";
const LIBRARY_SRC = "$EFL";
const RX_SGMLTAGS = /<[^>\r]*>/g;
const RX_DUPWHITESP = /\s+/g;
const RX_WHITESPACE = /\s/g;
const RX_TEMPLATES = /\{\{[^\}]*\}\}/g;
const RX_TEMPLTRIM = /\s*(\{\{[^\}]*\}\})\s*/g;
const RX_TEMPLTAGS = /\{\{|\}\}/g;
const RX_CUEPOINTS = /[^\.\"]/g;
const RX_DUPPUNCT = /\s+([,\.])+\s/g;
const RX_MODULENAME = /EFMod_\w*/;
const ASSETS_PATH = "EFAudio/EFassets";
const TYPE_MP3 = ".mp3";
const TYPE_WAV = ".wav";
const ASCII_a = 97;
const ASCII_A = 65;
const ZERO_SEGID = 0;
const TAG_SPEAKSTART = "<speak>";
const TAG_SPEAKEND = "</speak>";
const voicesPath = "EFAudio/EFscripts/languagevoice.json";
const originalPath = "EFAudio/EFscripts/original.json";
const scriptPath = "EFAudio/EFscripts/script.json";
const assetPath = "EFAudio/EFscripts/script_assets.json";
const libraryPath = "EFdata/data_assets.json";
let lib_Loaded = false;
let library;
let voices;
let input;
let templArray;
let cueArray;
let wordArray;
let segmentArray;
let filesRequested = 0;
let filesProcessed = 0;
function compileScript() {
    let segID = ZERO_SEGID;
    let promises;
    voices = JSON.parse(fs.readFileSync(voicesPath));
    input = JSON.parse(fs.readFileSync(scriptPath));
    rmdirSync(ASSETS_PATH, false);
    let modName = RX_MODULENAME.exec(__dirname);
    // console.log(process.env);
    // console.log(__filename);
    // console.log(__dirname);
    for (let scene in input) {
        for (let track in input[scene].tracks) {
            preProcessScript(input[scene].tracks[track].en);
        }
    }
    for (let scene in input) {
        for (let track in input[scene].tracks) {
            postProcessScript(input[scene].tracks[track].en, segID);
        }
    }
    promises = synthesizeSegments(input, voices);
    Promise.all(promises).then(() => {
        updateProcessedScripts(assetPath);
        console.log("Assets Processing Complete!");
        // Strip the segmentation from the script - just to make it easier to read
        // We do this here so that the trim arrary is initialized
        // 
        for (let scene in input) {
            for (let track in input[scene].tracks) {
                input[scene].tracks[track].en.segments = [];
            }
        }
        updateProcessedScripts(scriptPath);
        console.log("Script Processing Complete!");
    });
}
function enumerateItems(regex, text) {
    let templArray = [];
    let templ;
    while ((templ = regex.exec(text)) !== null) {
        templArray.push(templ);
        templ.endIndex = regex.lastIndex;
        // console.log(`Found ${templ[0]} at: ${templ.index} Next starts at ${regex.lastIndex}.`);
    }
    return templArray;
}
function load_Library() {
    if (!lib_Loaded) {
        library = JSON.parse(fs.readFileSync(libraryPath));
        lib_Loaded = true;
    }
}
function resolveSource(inst) {
    let result;
    try {
        if (inst.html.startsWith(LIBRARY_SRC)) {
            let srcPath = inst.html.split(".");
            load_Library();
            let libval = library._LIBRARY[srcPath[1]][srcPath[2]];
            result = libval.html;
            inst.templates = libval.templates || {};
        }
        else {
            result = inst.html;
        }
    }
    catch (err) {
        console.error("Library Load Failed: " + err);
    }
    return result;
}
function preProcessScript(inst) {
    let html = resolveSource(inst);
    // Remove all HTML/SSML tags
    inst.text = html.replace(RX_SGMLTAGS, "");
    // Remove duplicate whitespace
    inst.text = inst.text.replace(RX_DUPWHITESP, " ");
    // Remove duplicate punctuation
    inst.text = inst.text.replace(RX_DUPPUNCT, "$1 ");
    // Trim spaces around Templates.
    // This eliminates confusion if the string begins or ends or 
    // is exclusively a template.   e.g. "  {{templatevar}}   "
    //
    inst.text = inst.text.replace(RX_TEMPLTRIM, "$1");
    // trim the template values themselves - don't want 
    // extraneous whitespace around template values.
    // 
    for (let item in inst.templates) {
        trimTemplateValues(inst.templates[item]);
        inst.templates[item].volume = inst.templates[item].volume || 1.0;
        inst.templates[item].notes = inst.templates[item].notes || "";
    }
    inst.cueSet = inst.cueSet || "";
    inst.segments = [];
    inst.timedSet = inst.timedSet || [];
    inst.templates = inst.templates || {};
    inst.trim = inst.trim || [];
    inst.volume = inst.volume || 1.0;
}
function trimTemplateValues(templ) {
    for (let item in templ.values) {
        templ.values[item] = templ.values[item].trim();
    }
}
function trimCuePoints(cueArray, inst) {
    let length = inst.text.length;
    // Ensure cue points aren't past the end of the utterance.
    //
    for (let cue of cueArray) {
        if (cue.index > length)
            cue.index = length;
    }
}
function postProcessScript(inst, segID) {
    wordArray = inst.text.split(RX_WHITESPACE);
    templArray = enumerateItems(RX_TEMPLATES, inst.text);
    for (let item of templArray) {
        item[1] = item[0].replace(RX_TEMPLTAGS, "");
    }
    cueArray = enumerateItems(RX_CUEPOINTS, inst.cueSet);
    trimCuePoints(cueArray, inst);
    segmentScript(inst, segID++);
    // Try to maintain user defined segment trims but 
    // If the trim array is empty or doesn't match the 
    // segment count we reset
    // 
    if (inst.trim.length != inst.segments.length) {
        inst.trim = new Array();
        for (let i1 = 0; i1 < inst.segments.length; i1++) {
            inst.trim.push(0);
        }
    }
    // We do a posthoc insertion of the trim values into the script 
    // segments.
    // 
    else {
        for (let i1 = 0; i1 < inst.segments.length; i1++) {
            let segVal = inst.segments[i1];
            for (let segVar in segVal) {
                if (segVar == TEMPLATEVAR)
                    continue;
                segVal[segVar].trim = inst.trim[i1];
            }
        }
    }
}
function segmentScript(inst, segID) {
    let start = 0;
    let end = inst.text.length;
    if (templArray.length) {
        start = 0;
        // enumerate the templates to segment the text for TTS synthesis and playback
        // 
        for (let templ of templArray) {
            // First add the text before the template if there is any
            // 
            end = templ.index;
            if (start < end)
                addSegment(inst, null, start, end, segID++);
            // then add the template itself
            start = templ.index;
            end = templ.endIndex;
            addSegment(inst, templ, start, end, segID++);
            start = end;
        }
    }
    // Finally add the text after the last template if there is any
    // 
    end = inst.text.length;
    if (start < end)
        addSegment(inst, null, start, end, segID++);
}
function addSegment(inst, templ, start, end, segID) {
    if (templ) {
        try {
            let templVals = inst.templates[templ[1]].values;
            let templVol = inst.templates[templ[1]].volume;
            inst.segments.push(composeSegment(templ[1], templVals, start, end, segID, templVol));
        }
        catch (error) {
            console.error("Possible missing Template: " + error);
        }
    }
    else {
        let segStr = segID.toString();
        let scriptSeg = inst.text.substring(start, end);
        inst.segments.push(composeSegment("__novar", { __novar: scriptSeg }, start, end, segID, 1.0));
    }
}
function composeSegment(templVar, templVals, start, end, segID, segVol) {
    let seg = { templateVar: templVar };
    let subSegID = ZERO_SEGID;
    for (let templValName in templVals) {
        let text = templVals[templValName];
        let cuePoints = composeCuePoints(text, start, end);
        let segStr = segID.toString() + ((templValName !== "__novar") ? charEncodeSegID(ASCII_a, subSegID++) : "");
        // console.log(`Adding Segment: ${text} - id:${segStr}`);
        seg[templValName] = {
            id: segStr,
            SSML: text,
            cues: cuePoints,
            duration: 0,
            trim: 0,
            volume: segVol
        };
    }
    return seg;
}
function composeCuePoints(templVar, start, end) {
    let cues = [];
    let length = end - start - 1;
    for (let cuePnt of cueArray) {
        if (cuePnt.index >= start && cuePnt.index < end) {
            let segCue = {
                name: cuePnt[0],
                offset: ((cuePnt.index - start) / (length)),
                relTime: 0
            };
            cues.push(segCue);
        }
    }
    return cues;
}
function charEncodeSegID(charBase, subindex) {
    let result = "";
    if (subindex >= 26)
        result = charEncodeSegID(ASCII_A, subindex / 26);
    result += String.fromCharCode(charBase + subindex % 26);
    return result;
}
function updateProcessedScripts(path) {
    let scriptUpdate = JSON.stringify(input, null, '\t');
    fs.writeFileSync(path, scriptUpdate, 'utf8');
}
function clone(obj) {
    var copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj)
        return obj;
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
            if (obj.hasOwnProperty(attr))
                copy[attr] = clone(obj[attr]);
        }
        return copy;
    }
    throw new Error("Unable to copy obj! Its type isn't supported.");
}
function synthesizeSegments(input, languages) {
    let outPath = ASSETS_PATH;
    let promises = [];
    for (let scene in input) {
        for (let track in input[scene].tracks) {
            for (let lang in input[scene].tracks[track]) {
                for (let seg of input[scene].tracks[track][lang].segments) {
                    for (let segVal in seg) {
                        if (seg[segVal].id) {
                            for (let language in languages) {
                                for (let voice in languages[language]) {
                                    let _request = clone(languages[language][voice].request);
                                    // \\ISP_TUTOR\\<moduleName>\\EFaudio\\EFassets\\<Lang>\\<sceneName>\\<<trackName>_s<segmentid>_v<voiceId>>[.mp3]
                                    let filePath = outPath + "\\" + lang + "\\" + scene;
                                    let fileName = "\\" + track + "_s" + seg[segVal].id + "_v" + voice;
                                    validatePath(filePath, null);
                                    _request.input.ssml = TAG_SPEAKSTART + seg[segVal].SSML + TAG_SPEAKEND;
                                    filesRequested++;
                                    promises.push(synthesizeVOICE(_request, filePath + fileName, seg[segVal]));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return promises;
}
function synthesizeVOICE(request, outputFile, seg) {
    const textToSpeech = require('@google-cloud/text-to-speech');
    const fs = require('fs');
    const client = new textToSpeech.TextToSpeechClient();
    console.log(`Processing Script  : ${request.input.ssml} to file: ${outputFile}`);
    let promise = client.synthesizeSpeech(request).then((response) => {
        filesProcessed++;
        converter_1.convert(outputFile + TYPE_MP3, response[0].audioContent, seg);
        // console.log(`Audio content  : ${request.input.ssml}`);
        // console.log(`Audio content written to file: ${outputFile}`);
        console.log(`Files Requested: ${filesRequested} -- Files Processed: ${filesProcessed}`);
        fs.writeFileSync(outputFile + TYPE_WAV, response[0].audioContent, 'binary', (err) => {
            if (err) {
                console.error('ERROR:', err);
                return;
            }
        });
    }).catch((err) => {
        console.error('ERROR:', err);
        return;
    });
    return promise;
}
function validatePath(path, folder) {
    let pathArray = path.split("\\");
    try {
        let stat = fs.statSync(path);
        if (stat.isDirectory) {
            if (folder)
                fs.mkdirSync(path + "\\" + folder);
        }
    }
    catch (err) {
        let last = pathArray.pop();
        validatePath(pathArray.join("\\"), last);
        if (folder)
            fs.mkdirSync(path + "\\" + folder);
    }
}
function rmdirSync(dir, delRoot) {
    var list = fs.readdirSync(dir);
    for (var i = 0; i < list.length; i++) {
        var filename = path.join(dir, list[i]);
        var stat = fs.statSync(filename);
        if (filename == "." || filename == "..") {
            // pass these files
        }
        else if (stat.isDirectory()) {
            // rmdir recursively
            rmdirSync(filename, true);
        }
        else {
            // rm fiilename
            fs.unlinkSync(filename);
        }
    }
    if (delRoot)
        fs.rmdirSync(dir);
}
;
compileScript();
//# sourceMappingURL=compiler.js.map