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

import * as net        from "net";
import { CEF_Command } from "./admintypes";
import { WriteStream } from "fs";
import { ReadStream }  from "fs";



export class DataManager
{
    private cwd:string;
    private dataFolders:Array<string> = new Array<string>();
    private tabletID:string;

    private zipFile:AdmZip;
    private zipEntry:AdmZip.IZipEntry;
    private zipEntries:AdmZip.IZipEntry[];

    private readonly TABLET_BASE:string         = "tablet_";
    private readonly ARCHIVE_FILENAME:string    = "isp_userdata.zip";
    private readonly ACCT_FILENAME:string       = "isp_userdata.json";
    private readonly ZIP_ROOT:string            = "EdForge_DATA/";
    private readonly USER_DATA:string           = "EdForge_USERDATA/";

    private readonly RECURSE:boolean            = true;
    private readonly NORECURSE:boolean          = false;


    constructor(_cwd:string) {
        this.cwd = _cwd;

    }

    public extractData(src:string, dst:string) : Array<string>{

        let srcPath:string = path.join(this.cwd, src);  
        let dstPath:string = path.join(this.cwd, dst);  

        try {
            let files:Array<string> = fs.readdirSync(srcPath);

            for(let folder of files) {

                // If this looks like a tablet folder then process it
                // 
                if(folder.startsWith(this.TABLET_BASE)) {
                    
                    let _path = path.join(srcPath, folder);  

                    try {
                        let stats:any = fs.statSync(_path);

                        // If it is a folder check it for user data
                        // 
                        if(stats.isDirectory()) {

                            this.extractTabletData(folder, _path, dstPath);
                        }
                    }
                    catch(error) {

                        console.log("Error = " + error);
                    }
                }
            };
        }
        catch(error) {
            console.error("Error = " + error);
        }

        return this.dataFolders;
    }

    private validatePath(basePath:string, folder:string) : string {

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
    

    private extractFiles(src:string, dstPath:string) {

        let srcPath:string;

        for(let entry of this.zipEntries) {

            if(!entry.isDirectory) {
                srcPath = path.dirname(entry.entryName) + "/";

                if(srcPath === src) {

                    try {
                        this.zipFile.extractEntryTo(entry, dstPath, false, false);
                    }
                    catch(err) {
                        console.log("File Already Exists: " + dstPath);                        
                    }
                }
            }
        }
    }

    private extractSubFolders(zipBase:string, dst:string, recurse:boolean) {

        let srcPath:string;
        let dstPath:string;
        let zipPath:string;
        let srcArr:string[];

        for(let entry of this.zipEntries) {

            // trim the filename or last folder name off entryName
            //
            srcPath = path.dirname(entry.entryName) + "/";

            // If this matches the target folder process the file
            // ( and folders if we are recursing)
            // 
            if(srcPath === zipBase) {
                
                if(entry.isDirectory && recurse) {

                    srcArr = entry.entryName.split("/");

                    let tarFolder:string = srcArr[srcArr.length-2];

                    if(tarFolder.startsWith("GUEST")) {
                        tarFolder = "_" + this.tabletID + "__" + tarFolder;
                    }

                    dstPath = this.validatePath(dst, tarFolder);
                    zipPath = path.join(zipBase, srcArr[srcArr.length-2]);
                    zipPath = zipPath.replace(/\\/g,"/") + "/";

                    // We do the files in a separate loop to ensure the folder
                    // is created before any of its enclosed files/folders
                    // 
                    this.extractFiles(zipPath, dstPath);

                    this.extractSubFolders(zipPath, dstPath, this.RECURSE);
                }
            }
        }
    }

    private extractUserAccts() {

        let acctPath:string = path.join(this.ZIP_ROOT, this.ACCT_FILENAME);
        let zipEntry:AdmZip.IZipEntry = this.zipFile.getEntry(acctPath.replace("\\","/"));

        if(zipEntry) {

            let outPath = path.join(this.cwd, this.USER_DATA);
            if(!this.zipFile.extractEntryTo(zipEntry, outPath, false, false)) {
                console.log("File Already Exists: " + outPath);
            }

            let oldPath = path.join(this.cwd, this.USER_DATA, zipEntry.name);
            let newPath = path.join(this.cwd, this.USER_DATA, this.tabletID + "__" + this.ACCT_FILENAME);

            fs.renameSync(oldPath, newPath);
        }
    }

    private extractTabletData(_tabletId:string, zipPath:string, dstPath:string) : void {

        let fpath:string = path.join(zipPath, this.ARCHIVE_FILENAME);          

        this.tabletID = _tabletId;

        console.log("Processing Tablet: " + this.tabletID);

        try {
            this.zipFile    = new AdmZip(fpath);
            this.zipEntries = this.zipFile.getEntries(); 

            this.zipEntry = this.zipFile.getEntry(this.ZIP_ROOT);

            if(this.zipEntry) {

                this.extractUserAccts();
                this.extractSubFolders(this.ZIP_ROOT, dstPath, this.RECURSE);
            }
        }
        catch(error) {
            console.error("Error = " + error);
        }
    }






}
    