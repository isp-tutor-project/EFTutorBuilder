import { ClientSocket } from './client';

//*********************************************************************************
//
//  Copyright(c) 2008,2018 Kevin Willows. All Rights Reserved
//
//	License: Proprietary
//
//  THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//
//*********************************************************************************

'use strict';

const fs        = require('fs');
const path      = require('path');
const readline  = require('readline');
const net       = require('net');

var client = new ClientSocket();

// client.pushCommand('{"command":"INSTALL", filename:"Edforge123.apk", "size":20315012}');
// client.pushCommand('{"command":"PULL", filename:"Edforge123.apk", "size":122}');
// client.pushCommand('{"command":"PULL", folder:"Edforge_DATA", filename:"userdata.zip"}');
//  client.pushCommand('{"command":"PUSH", folder:"Edforge_LOGS", filename:"userdata.zip", "size":3423444122}');

client.pushCommand('{"command":"PUSH", "from":"EdForge.zip",  "to":"/EdForge_DATA/", "compress":false, "extract":true, "recurse":true, "size":220740454}');

client.pushCommand('{"command":"PUSH", "from":"test3.zip",  "to":"/EdForge_DATA/", "compress":false, "extract":true, "recurse":true, "size":12147}');

// client.pushCommand('{"command":"PULL", "from":"/EdForge/dist",              "to":"test2.zip", "compress":true, "recurse":true}');
// client.pushCommand('{"command":"PULL", "from":"/EdForge/EFMod_Algae",       "to":"test3.zip", "compress":true, "recurse":true}');
// client.pushCommand('{"command":"PULL", "from":"/EdForge/node_modules",      "to":"test4.zip", "compress":true, "recurse":true}');


client.connect(12007, "192.168.2.18");
