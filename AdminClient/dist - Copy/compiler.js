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
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function sampleFolderProcessor() {
    console.log("\n");
    process.argv.forEach(function (val, index, array) {
        console.log(index + ': ' + val);
    });
    let cwd = process.cwd();
    let rwd = "";
    console.log("CWD         = " + process.cwd());
    console.log("Directory   = " + __dirname);
    console.log("Executable  = " + __filename);
    rwd = path.relative(cwd, __dirname);
    console.log("Relative working Directory  = " + rwd);
    let twd = path.resolve(rwd, "../../../");
    console.log("Tutor working Directory  = " + twd);
    console.log("\n");
    listTree(twd + "/EFTutors", " ");
    console.log("\n");
}
function getTutorToBuild() {
    rl.question('\nSelect Tutor to Build:\n1.\tEFCodeTest\n2.\tEFPre_Post\n3.\tEFStd_Login\n\n>', (answer) => {
        // TODO: Log the answer in a database
        console.log(`Building Tutor: ${answer}`);
        rl.close();
    });
}
function sampleSubProcessor() {
    console.log("\n");
    const { exec } = require('child_process');
    exec('node EFMod_CodeTest/EFaudio/dist/test.js parm1 parm2 ', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error:\n${error}`);
            return;
        }
        console.log(`stdout:\n${stdout}`);
        console.log(`stderr:\n${stderr}`);
    });
}
function listTree(fpath, indent) {
    console.log((indent + path.basename(fpath)));
    try {
        let files = fs.readdirSync(fpath);
        files.forEach(file => {
            let _path = fpath + "/" + file;
            try {
                let stats = fs.statSync(_path);
                if (stats.isDirectory()) {
                    if (file.startsWith("EF"))
                        listTree(_path, indent + "|   ");
                }
            }
            catch (error) {
                console.log("Error = " + error);
            }
        });
        files.forEach(file => {
            let _path = fpath + "/" + file;
            try {
                let stats = fs.statSync(_path);
                if (!stats.isDirectory()) {
                    console.log(indent + "   >" + file);
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
}
sampleFolderProcessor();
//# sourceMappingURL=compiler.js.map