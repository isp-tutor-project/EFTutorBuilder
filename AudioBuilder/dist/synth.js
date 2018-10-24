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
// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');
// Creates a client
const client = new textToSpeech.TextToSpeechClient();
// The text to synthesize
const text = 'Hello. My name is Kevin!';
const SSML1 = `<speak>Here are <say-as interpret-as="characters">SSML</say-as> samples.<break time="300ms"/>
I can pause.<break time="500ms"/>
I can speak in cardinals. Your number is <say-as interpret-as="cardinal">10</say-as>.<break time="300ms"/>
Or I can speak in ordinals. You are <say-as interpret-as="ordinal">10</say-as> in line.<break time="300ms"/>
Or I can even speak in digits. The digits for ten are <say-as interpret-as="characters">10</say-as>.<break time="300ms"/>
I can also substitute phrases, like the <sub alias="World Wide Web Consortium">W3C</sub>.<break time="300ms"/>
Finally, I can speak a paragraph with two sentences<break time="300ms"/>
<p><s>This is sentence one.</s><break time="400ms"/><s>This is sentence two.</s></p>
</speak>`;
const SSML2 = `<speak><emphasis level="moderate">My name is Hal</emphasis>, <break time="200ms"/><prosody rate="medium" pitch="-2st">What's your name?</prosody></speak>`;
const SSML3 = "Within the area of, Plant growth, please select a topic by clicking on a picture below.";
const SSML4 = `<speak>This is a test to see if MetaData gets <metadata>cue1</metadata>embedded in the mp3.</speak>`;
const metaReq = [
    {
        input: { ssml: SSML4 },
        voice: { name: 'en-US-Wavenet-D',
            languageCode: 'en-US',
            ssmlGender: 'MALE' },
        audioConfig: { audioEncoding: 'MP3' },
    }
];
// Construct the request
const requests = [
    {
        input: { ssml: SSML3 },
        voice: { name: 'en-US-Wavenet-D',
            languageCode: 'en-US',
            ssmlGender: 'MALE' },
        audioConfig: { audioEncoding: 'MP3' },
    },
    {
        input: { ssml: SSML3 },
        voice: { name: 'en-US-Wavenet-A',
            languageCode: 'en-US',
            ssmlGender: 'MALE' },
        audioConfig: { audioEncoding: 'MP3' },
    },
    {
        input: { ssml: SSML3 },
        voice: { name: 'en-US-Wavenet-B',
            languageCode: 'en-US',
            ssmlGender: 'MALE' },
        audioConfig: { audioEncoding: 'MP3' },
    },
    {
        input: { ssml: SSML3 },
        voice: { name: 'en-US-Wavenet-C',
            languageCode: 'en-US',
            ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3' },
    },
    {
        input: { ssml: SSML3 },
        voice: { name: 'en-US-Wavenet-E',
            languageCode: 'en-US',
            ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3' },
    },
    {
        input: { ssml: SSML3 },
        voice: { name: 'en-US-Wavenet-F',
            languageCode: 'en-US',
            ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3' },
    },
    // GBR
    {
        input: { ssml: SSML3 },
        voice: { name: 'en-GB-Standard-A',
            languageCode: 'en-GB',
            ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3' },
    },
    {
        input: { ssml: SSML3 },
        voice: { name: 'en-GB-Standard-B',
            languageCode: 'en-GB',
            ssmlGender: 'MALE' },
        audioConfig: { audioEncoding: 'MP3' },
    },
    {
        input: { ssml: SSML3 },
        voice: { name: 'en-GB-Standard-C',
            languageCode: 'en-GB',
            ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3' },
    },
    {
        input: { ssml: SSML3 },
        voice: { name: 'en-GB-Standard-D',
            languageCode: 'en-GB',
            ssmlGender: 'MALE' },
        audioConfig: { audioEncoding: 'MP3' },
    }
];
//# sourceMappingURL=synth.js.map