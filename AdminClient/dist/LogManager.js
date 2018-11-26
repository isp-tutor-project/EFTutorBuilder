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
const fs = require("fs");
const path = require("path");
class LogManager {
    constructor(_cwd) {
        this.USER_DATA = "EdForge_USERDATA/";
        this.BUILDLOG = "build.log";
        this.MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        this.cwd = _cwd;
        this.fd = fs.openSync(path.join(this.cwd, this.USER_DATA, this.BUILDLOG), "a");
        this.writeLog(this.timeStamp());
    }
    timeStamp() {
        let stamp = "\n\n||************* : ";
        var today = new Date();
        var yyyy = today.getFullYear();
        var hh = today.getHours();
        var mm = today.getMonth();
        var dd = today.getDate();
        var min = today.getMinutes();
        var sec = today.getSeconds();
        var mill = today.getMilliseconds();
        stamp += "DATE: " + yyyy + " " + this.MONTHS[mm] + " " + dd + " " + hh + ":" + min + ":" + sec + ":" + mill;
        return stamp;
    }
    writeLog(msg) {
        fs.writeFileSync(this.fd, msg + "\n");
    }
    close() {
        fs.closeSync(this.fd);
    }
}
exports.LogManager = LogManager;
//# sourceMappingURL=LogManager.js.map