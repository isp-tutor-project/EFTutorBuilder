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
const fs = require('fs');
const path = require('path');
const AdmZip = require("adm-zip");
class DataManager {
    constructor(_cwd) {
        this.dataFolders = new Array();
        this.TABLET_BASE = "tablet_";
        this.ARCHIVE_FILENAME = "isp_userdata.zip";
        this.ACCT_FILENAME = "isp_userdata.json";
        this.ZIP_ROOT = "EdForge_DATA/";
        this.USER_DATA = "EdForge_USERDATA/";
        this.RECURSE = true;
        this.NORECURSE = false;
        this.cwd = _cwd;
    }
    extractData(src, dst) {
        let srcPath = path.join(this.cwd, src);
        let dstPath = path.join(this.cwd, dst);
        try {
            let files = fs.readdirSync(srcPath);
            for (let folder of files) {
                // If this looks like a tablet folder then process it
                // 
                if (folder.startsWith(this.TABLET_BASE)) {
                    let _path = path.join(srcPath, folder);
                    try {
                        let stats = fs.statSync(_path);
                        // If it is a folder check it for user data
                        // 
                        if (stats.isDirectory()) {
                            this.extractTabletData(folder, _path, dstPath);
                        }
                    }
                    catch (error) {
                        console.log("Error = " + error);
                    }
                }
            }
            ;
        }
        catch (error) {
            console.error("Error = " + error);
        }
        return this.dataFolders;
    }
    validatePath(basePath, folder) {
        let pathArray = basePath.split("\\");
        let fPath;
        try {
            let stat = fs.statSync(basePath);
            if (stat.isDirectory) {
                if (folder) {
                    fPath = path.join(basePath, folder);
                    if (!fs.existsSync(fPath)) {
                        fs.mkdirSync(fPath);
                    }
                }
            }
        }
        catch (err) {
            let last = pathArray.pop();
            this.validatePath(pathArray.join("\\"), last);
            if (folder)
                fs.mkdirSync(basePath + "\\" + folder);
        }
        return fPath;
    }
    extractFiles(src, dstPath) {
        let srcPath;
        for (let entry of this.zipEntries) {
            if (!entry.isDirectory) {
                srcPath = path.dirname(entry.entryName) + "/";
                if (srcPath === src) {
                    try {
                        this.zipFile.extractEntryTo(entry, dstPath, false, false);
                    }
                    catch (err) {
                        console.log("File Already Exists: " + dstPath);
                    }
                }
            }
        }
    }
    extractSubFolders(zipBase, dst, recurse) {
        let srcPath;
        let dstPath;
        let zipPath;
        let srcArr;
        for (let entry of this.zipEntries) {
            // trim the filename or last folder name off entryName
            //
            srcPath = path.dirname(entry.entryName) + "/";
            // If this matches the target folder process the file
            // ( and folders if we are recursing)
            // 
            if (srcPath === zipBase) {
                if (entry.isDirectory && recurse) {
                    srcArr = entry.entryName.split("/");
                    let tarFolder = srcArr[srcArr.length - 2];
                    if (tarFolder.startsWith("GUEST")) {
                        tarFolder = "_" + this.tabletID + "__" + tarFolder;
                    }
                    dstPath = this.validatePath(dst, tarFolder);
                    zipPath = path.join(zipBase, srcArr[srcArr.length - 2]);
                    zipPath = zipPath.replace(/\\/g, "/") + "/";
                    // We do the files in a separate loop to ensure the folder
                    // is created before any of its enclosed files/folders
                    // 
                    this.extractFiles(zipPath, dstPath);
                    this.extractSubFolders(zipPath, dstPath, this.RECURSE);
                }
            }
        }
    }
    extractUserAccts() {
        let acctPath = path.join(this.ZIP_ROOT, this.ACCT_FILENAME);
        let zipEntry = this.zipFile.getEntry(acctPath.replace("\\", "/"));
        if (zipEntry) {
            let outPath = path.join(this.cwd, this.USER_DATA);
            if (!this.zipFile.extractEntryTo(zipEntry, outPath, false, false)) {
                console.log("File Already Exists: " + outPath);
            }
            let oldPath = path.join(this.cwd, this.USER_DATA, zipEntry.name);
            let newPath = path.join(this.cwd, this.USER_DATA, this.tabletID + "__" + this.ACCT_FILENAME);
            fs.renameSync(oldPath, newPath);
        }
    }
    extractTabletData(_tabletId, zipPath, dstPath) {
        let fpath = path.join(zipPath, this.ARCHIVE_FILENAME);
        this.tabletID = _tabletId;
        console.log("Processing Tablet: " + this.tabletID);
        try {
            this.zipFile = new AdmZip(fpath);
            this.zipEntries = this.zipFile.getEntries();
            this.zipEntry = this.zipFile.getEntry(this.ZIP_ROOT);
            if (this.zipEntry) {
                this.extractUserAccts();
                this.extractSubFolders(this.ZIP_ROOT, dstPath, this.RECURSE);
            }
        }
        catch (error) {
            console.error("Error = " + error);
        }
    }
}
exports.DataManager = DataManager;
//# sourceMappingURL=DataManager.js.map