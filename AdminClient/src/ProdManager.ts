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

import { EFInclude } from "./IProdTypes";


export class ProductionManager
{
    private readonly EF_INCLUDE:string         = "_EFInclude.json";

    private cwd:string;     // Current working directory
    private twd:string;     // Tutor working directory

    private zipFile:AdmZip;
    private zipEntry:AdmZip.IZipEntry;
    private zipEntries:AdmZip.IZipEntry[];

    private PROD_SRC:string           = ""; // same as twd

    private PROD_FULL:string          = "PRODUCTION/FULL/EdForge";
    private PROD_PART:string          = "PRODUCTION/PART/EdForge";
    private ZIP_DATA:string           = "EFdata";

    private wrk_folders:string[]      = [];

    private PRODFILE_FULL:string  = "EdForge.zip";
    private PRODFILE_PART:string  = "EdForge_PART.zip";

    private filesProcess:number;
    private filesSkipped:number;

    private efInclude:EFInclude;


    constructor(_cwd:string, _twd:string) {

        this.cwd = _cwd;
        this.twd = _twd;

        this.PROD_SRC = _twd;

        this.PROD_FULL  = path.join(this.cwd, this.PROD_FULL);
        this.PROD_PART  = path.join(this.cwd, this.PROD_PART);
        this.ZIP_DATA   = path.join(this.cwd, this.ZIP_DATA);

        this.PRODFILE_FULL  = path.join(this.ZIP_DATA, this.PRODFILE_FULL);
        this.PRODFILE_PART  = path.join(this.ZIP_DATA, this.PRODFILE_PART);

        this.wrk_folders.push(this.PROD_FULL,this.PROD_PART);
    }


    public generatePRODImage() {

        this.filesProcess = 0;
        this.filesSkipped = 0;

        this.loadEFInclude();

        this.rmdirSync(this.PROD_PART, true);
        this.validateFolders(this.wrk_folders);

        for(let path of this.efInclude.include) {

            this.processElement(this.PROD_SRC, this.PROD_FULL, this.PROD_PART, path.split(":"));
        }
        
        process.stdout.write("                                                                                                                                                 ");

        console.log("\n\n******************************************************");
        console.log("**************** Production Image Complete:");

        this.zipImage(this.PROD_FULL, this.PRODFILE_FULL, "\nCompressing Full Image");
        this.zipImage(this.PROD_PART, this.PRODFILE_PART, "Compressing Partial Image\n");
    
        console.log("Files Processed: " + this.filesProcess);
        console.log("Files Unchanged: " + this.filesSkipped);

        console.log("\n\n******************************************************");
    }

    private zipImage(srcfolder:string, tarfile:string, msg:string) {

        this.zipFile = new AdmZip();

        this.zipFile.addLocalFolder(srcfolder);
        console.log(msg);

        this.zipFile.writeZip(tarfile);
    }

    private loadEFInclude() {

        let efpath:string = path.join(this.twd, this.EF_INCLUDE);

        this.efInclude = JSON.parse(fs.readFileSync(efpath));
    }

    private validatePath(base:string, folder:string) {

        let pathArray:Array<string> = base.split("\\");
    
        try {
            let stat = fs.statSync(base);
    
            if(stat.isDirectory) {
    
                if(folder)
                    fs.mkdirSync(path.join(base,folder));
            }
        }
        catch(err) {
    
            let last = pathArray.pop();
            this.validatePath(pathArray.join("\\"), last);
    
            if(folder)
                fs.mkdirSync(path.join(base,folder));
        }
    }
    
    private validateFolders(folders:string[]) {

        for(let folder of folders) {

            this.validatePath(folder, null);
        }
    }

    private validateFilePath(filePath:string) {

        let pathArray:Array<string> = filePath.split("\\");

        pathArray.pop();
        this.validatePath(pathArray.join("\\"), null);
    }

    private rmdirSync(dir:string, delRoot:boolean) {
    
        try {
            var list = fs.readdirSync(dir);
    
            for(var i = 0; i < list.length; i++) {
    
                var filename = path.join(dir, list[i]);
                var stat = fs.statSync(filename);
                
                if(filename == "." || filename == "..") {
                    // ignore
                } else if(stat.isDirectory()) {
                    // rmdir recursively
                    this.rmdirSync(filename, true);
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
    

    private getPathListing(path:string) : string[] {

        let result:string[];



        return result;
    }

    private pruneFULLImage(listSrc:string[], listFUL:string[], fullPath:string) :string[] {

        let prunedImg:string[] = [];

        for(let item of listSrc) {

            let fnd = listFUL.indexOf(item);

            if(fnd > 0) {

                prunedImg.push(listFUL.slice(fnd,fnd+1)[0]);                
            }
        }

        for(let item of listFUL) {

            //TODO implement pruning;

        }

        return prunedImg;
    }


    private processFile(basePath:string, fullPath:string, partPath:string) {

        try {
            var statSrc = fs.statSync(basePath);
        }
        catch(err) {                
            console.log("TERMINAL ERROR: " + err);
        }

        try {
            var statFUL = fs.statSync(fullPath);
        }
        catch(err) {                
            // If this is a new folder it may not exist yet
            statFUL = {"mtimeMs":0};
        }

        if(statSrc.mtimeMs != statFUL.mtimeMs) {

            this.filesProcess++;

            this.validateFilePath(fullPath);
            this.validateFilePath(partPath);

            fs.copyFileSync(basePath, fullPath);
            fs.copyFileSync(basePath, partPath);

            // fs.utimesSync(fullPath, statSrc.atimeMs, statSrc.mtimeMs);
            // fs.utimesSync(partPath, statSrc.atimeMs, statSrc.mtimeMs);
        }
        else {
            this.filesSkipped++;
        }
    }


    private processFolder(basePath:string, fullPath:string, partPath:string) {

        try {
            var listSrc = fs.readdirSync(basePath);
        }
        catch(err) {                
            console.log("TERMINAL ERROR: " + err);
        }

        try {
            var listFUL = fs.readdirSync(fullPath);
        }
        catch(err) {                
            // If this is a new folder it may not exist yet
            listFUL = [];
        }

        if(listFUL.length > 0)
            listFUL = this.pruneFULLImage(listSrc, listFUL, fullPath);

        for(let item of listSrc) {

            var pathSrc = path.join(basePath, item);
            var pathFUL = path.join(fullPath, item);
            var pathPRT = path.join(partPath, item);

            var stat = fs.statSync(pathSrc);
            
            if(pathSrc == "." || pathSrc == "..") {
                // ignore
            } else if(stat.isDirectory()) {

                this.processFolder( pathSrc, pathFUL, pathPRT);
            } else {

                this.processFile( pathSrc, pathFUL, pathPRT);
            }
        }
    }


    private processElement(basePath:string, fullPath:string, partPath:string, pathParts:string[]) {

        let part0 = pathParts.shift();

        let partPathSrc = path.join(basePath, part0);
        let partPathFUL = path.join(fullPath, part0);
        let partPathPAR = path.join(partPath, part0);

        try {
            var statSrc = fs.statSync(partPathSrc);
            }
        catch(err) {                
            console.log("TERMINAL ERROR: " + err);
        }

        // we assume files and folders will never morph into each other.
        // 
        if(statSrc.isDirectory()) {

            if(pathParts.length === 0) {

                process.stdout.write("Processing Folder: " + partPathSrc + "\r");
                this.processFolder(partPathSrc, partPathFUL, partPathPAR);
            }
            else {

                this.processElement(partPathSrc, partPathFUL, partPathPAR, pathParts);
            }

        } else {

            process.stdout.write("Processing File: " + partPathSrc + "\r");
            this.processFile(partPathSrc, partPathFUL, partPathPAR);
        }        
    }


}