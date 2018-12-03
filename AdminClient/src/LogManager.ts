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

import fs   = require("fs");
import path = require("path");
import { Utils } from "./Utils";


export class LogManager
{
    private fd:number;
    private cwd:string;

    private readonly USER_DATA:string           = "EdForge_USERDATA/";
    private readonly BUILDLOG:string            = "build.log";

    private readonly MONTHS:string[] = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    
    constructor(_cwd:string) {        

        this.cwd = _cwd;

        Utils.validatePath(this.cwd, this.USER_DATA);
        this.fd = fs.openSync(path.join(this.cwd, this.USER_DATA, this.BUILDLOG), "a");

        this.writeLog(this.timeStamp());
    }

    public timeStamp() : string {

        let stamp:string = "\n\n||************* : "

        var today = new Date();
        var yyyy = today.getFullYear();
        var hh   = today.getHours();
        var mm   = today.getMonth();
        var dd   = today.getDate();
        var min  = today.getMinutes();
        var sec  = today.getSeconds();
        var mill = today.getMilliseconds();

        stamp += "DATE: " + yyyy + " " + this.MONTHS[mm] + " " + dd + " " + hh + ":" + min + ":" + sec+ ":" + mill;
        
        return stamp;
    }

    public writeLog(msg:string) {

        fs.writeFileSync(this.fd,msg + "\n");
    }

    public close() {
        fs.closeSync(this.fd);
    }
}