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
const fileList = [
    "/RQMod_corrections.json"
    // "/AlgaeExpScript_choice.json",
    // "/BalloonExpScript_choice.json",
    // "/CrystalsExpScript_choice.json"
    // "/GreenhouseExpScript_choice.json",
    // "/GreenhouseExpScript_nochoice.json",
    // "/IcemeltingExpScript_choice.json",
    // "/RampsExpScript_choice.json",
    // "/RQMod_Intro_choice.json",
    // "/RQMod_Intro_nochoice.json",
    // "/SinkingExpScript_choice.json",
    // "/SodaExpScript_choice.json"
];
const filePath = "scripts/RQMod_0.0.1";
// let filesRequested:number = 0;
// let filesProcessed:number = 0;
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
function synthesizeSsmlFile(fileList) {
    const textToSpeech = require('@google-cloud/text-to-speech');
    const fs = require('fs');
    const client = new textToSpeech.TextToSpeechClient();
    for (let file of fileList) {
        let input = JSON.parse(fs.readFileSync(filePath + file));
        for (let i1 = 0; i1 < input.request.length; i1++) {
            for (let utterance of input.utterance) {
                let _request = clone(input.request[i1]);
                let _outputFile;
                let nameParts = utterance[0].split('_');
                let name = nameParts[0] + "_" + _request.voice.ssmlGender + "_" + nameParts[1] + ".mp3";
                _outputFile = filePath + "_generated/" + name;
                _request.input.ssml = utterance[1];
                filesRequested++;
                synthesizeSpeech(_request, _outputFile);
            }
        }
    }
}
function synthesizeSpeech(request, outputFile) {
    const textToSpeech = require('@google-cloud/text-to-speech');
    const fs = require('fs');
    const client = new textToSpeech.TextToSpeechClient();
    console.log(`Audio content  : ${request.input.ssml}`);
    console.log(`Written to file: ${outputFile}`);
    client.synthesizeSpeech(request, (err, response) => {
        if (err) {
            console.error('ERROR:', err);
            return;
        }
        filesProcessed++;
        fs.writeFile(outputFile, response.audioContent, 'binary', (err) => {
            if (err) {
                console.error('ERROR:', err);
                return;
            }
            console.log(`Audio content  : ${request.input.ssml}`);
            console.log(`Audio content written to file: ${outputFile}`);
            console.log(`Files Requested: ${filesRequested} -- Files Processed: ${filesProcessed}`);
        });
    });
}
//# sourceMappingURL=processor.js.map