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

const fs            = require('fs');
const path          = require('path');

import AdmZip = require("adm-zip");

import { userData, 
         stateData, 
         userState }        from "./IAcctData";
import { DataProcessor }    from "./DataProcessor";

import { TCONST }           from "./TCONST";



export class Utils
{

    public static validatePath(basePath:string, folder:string) : string {

        let pathArray:Array<string> = basePath.split("\\");
        let fPath:string;
    
        try {
            let stat = fs.statSync(basePath);
    
            if(stat.isDirectory) {
    
                if(folder) {
                    fPath = path.join(basePath,folder);

                    if(!fs.existsSync(fPath)) {
                        fs.mkdirSync(fPath);
                    }
                }
            }
        }
        catch(err) {
    
            let last = pathArray.pop();
            this.validatePath(pathArray.join("\\"), last);
    
            if(folder)
                fs.mkdirSync(basePath + "\\" + folder);
        }

        return fPath;
    }    
    



}