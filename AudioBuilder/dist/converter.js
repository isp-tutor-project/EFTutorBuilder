"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lamejs = require("lamejs");
var WavHeader = lamejs.WavHeader;
var Mp3Encoder = lamejs.Mp3Encoder;
function convert(outFileName, waveFile, seg) {
    const fs = require('fs');
    var sampleBuf = new Uint8Array(waveFile).buffer;
    var w = WavHeader.readHeader(new DataView(sampleBuf));
    var audioSamples;
    var audioTrimmed;
    audioSamples = new Int16Array(sampleBuf, w.dataOffset, w.dataLen / 2);
    audioTrimmed = trim(audioSamples, w.sampleRate * .025, w.sampleRate * 0.025, -50, seg);
    var remaining = audioTrimmed.length;
    var lameEnc = new Mp3Encoder(w.channels, w.sampleRate, 128);
    var maxSamples = 1152; //can be anything but make it a multiple of 576 to make encoders life easier
    var fd = fs.openSync(outFileName, "w");
    var time = new Date().getTime();
    for (var i = 0; remaining >= maxSamples; i += maxSamples) {
        var left = audioTrimmed.subarray(i, i + maxSamples);
        var mp3buf = lameEnc.encodeBuffer(left);
        if (mp3buf.length > 0) {
            fs.writeSync(fd, new Buffer(mp3buf), 0, mp3buf.length);
        }
        remaining -= maxSamples;
    }
    var mp3buf = lameEnc.flush();
    if (mp3buf.length > 0) {
        fs.writeSync(fd, new Buffer(mp3buf), 0, mp3buf.length);
    }
    fs.closeSync(fd);
    time = new Date().getTime() - time;
    // console.log('done in ' + time + 'msec');
}
exports.convert = convert;
function trim(audioSource, minSilenceHead, minSilenceTail, dbSilence, seg) {
    let trimStart = 0;
    let trimEnd = audioSource.length - 1;
    let minVol = Math.pow(10, dbSilence / 20) * 32767;
    for (let i1 = 0; i1 < audioSource.length; i1++) {
        if (Math.abs(audioSource[i1]) < minVol) {
            trimStart = i1;
        }
        else
            break;
    }
    for (let i1 = audioSource.length - 1; i1 >= 0; i1--) {
        if (Math.abs(audioSource[i1]) < minVol) {
            trimEnd = i1;
        }
        else
            break;
    }
    if (trimStart > minSilenceHead) {
        trimStart -= minSilenceHead;
        // console.log("Trimming start: " + trimStart);
    }
    if (audioSource.length - trimEnd > minSilenceTail) {
        trimEnd += minSilenceTail;
        // console.log("Trimming end: " + (audioSource.length - trimEnd));
    }
    else
        trimEnd = audioSource.length - 1;
    let audioTrimmed = audioSource.subarray(trimStart, trimEnd);
    trimStart = 0;
    trimEnd = audioTrimmed.length - 1;
    for (let i1 = 0; i1 < audioTrimmed.length; i1++) {
        if (Math.abs(audioTrimmed[i1]) < minVol) {
            trimStart = i1;
        }
        else
            break;
    }
    for (let i1 = audioTrimmed.length - 1; i1 >= 0; i1--) {
        if (Math.abs(audioTrimmed[i1]) < minVol) {
            trimEnd = i1;
        }
        else
            break;
    }
    // console.log("Head Silence Actual: " + (trimStart / 24000));
    // console.log("Tail Silence Actual: " + ((audioTrimmed.length - trimEnd) / 24000));
    // console.log("Trimmed Length: " + (audioTrimmed.length / 24000));
    // console.log("Audio Length: " + ((audioTrimmed.length - trimStart - (audioTrimmed.length - trimEnd))/ 24000));
    // Update the cue points from ratio to segment relative timings.
    // in ms
    seg.duration = audioTrimmed.length / 24; // return trimmed duration in ms
    for (let cuePnt of seg.cues) {
        cuePnt.relTime = cuePnt.offset * seg.duration;
    }
    return audioTrimmed;
}
//# sourceMappingURL=converter.js.map