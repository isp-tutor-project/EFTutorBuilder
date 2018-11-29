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

const fs        = require('fs');
const path      = require('path');

import * as net        from "net";
import { CEF_Command } from "./admintypes";
import { WriteStream } from "fs";
import { ReadStream }  from "fs";


export class ClientSocket 
{
    
    private connectBoundListener:(...args:any[]) =>{};
    private dataBoundListener:(...args:any[]) =>{};
    private closeBoundListener:(...args:any[]) =>{};
    private errorBoundListener:(...args:any[]) =>{};
    private timeoutBoundListener:(...args:any[]) =>{};

    private client:net.Socket; 

    private static readonly RESTART:string          = "RESTART";
    private static readonly START_STATE:string      = "STATE0";
    private static readonly COMMAND_WAIT:string     = "STATE1";
    private static readonly COMMAND_PACKET:string   = "STATE2";
    private static readonly PROCESS_COMMAND:string  = "STATE3";

    // note: these are the inverse of the server side.
    // i.e. Server state4 == SENDDATA
    // i.e. Server state5 == RECVDATA
    // 
    private static readonly COMMAND_RECVSTART:string = "STATE4";
    private static readonly COMMAND_RECVDATA:string  = "STATE5";
    private static readonly COMMAND_RECVACK:string   = "STATE6";

    private static readonly COMMAND_SENDSTART:string = "STATE7";
    private static readonly COMMAND_SENDDATA:string  = "STATE8";
    private static readonly COMMAND_SENDACK:string   = "STATE9";    

    private static readonly COMMAND_STALLED:string   = "STATE10";
    
    private wstream:WriteStream;
    private readDesc:number;
    private callback:Function;  // processNextDevice

    private sendAck:string;
    private chunk:Buffer;
    private size:number;
    private bytesAvail:number;
    private bytesSent:number;

    private cmdJson:string;
    private command:CEF_Command;
    private recvSize:number = -1;
    private recvPath:string;
    private cwd:string;

    private cmdPacket:Buffer;
    private cmdArray:Array<string> = new Array<string>();
    private clientState:string     = ClientSocket.START_STATE;

    constructor(_callback:Function) {

        this.cwd = process.cwd();

        this.callback = _callback;

        try {
            this.client = new net.Socket();
            this.client.setTimeout(3000);

        } catch(e) {

            console.log("Error: " + e);
        }
    }


    public connect(port:number, ip:string) {

        this.connectBoundListener = this.onConnect.bind(this);
        this.dataBoundListener    = this.onData.bind(this);
        this.closeBoundListener   = this.onClose.bind(this);
        this.errorBoundListener   = this.onError.bind(this);
        this.timeoutBoundListener = this.onTimeout.bind(this);
        
        this.client.on("connect", this.connectBoundListener);
        this.client.on("data",    this.dataBoundListener);
        this.client.on("close",   this.closeBoundListener);
        this.client.on("error",   this.errorBoundListener);
        this.client.on("timeout", this.timeoutBoundListener);

        this.client.connect(port, ip);
    }   


    private onConnect() : void {
        console.log('Connected');    
    }


    private checkState(data:Buffer, state:string) : Buffer {

        let str = data.toString();

        // If the expected state is in the message then trim it and continue
        // 
        if(str.startsWith(state)) {
            if(state ==='STATE1')
                 console.log('Entering Wait State');                        

            data = data.slice(state.length);
        }
        else {
            console.log('State Mismatch: ' + this.clientState + "  Pier is: " + str);       

            this.client.destroy(); // kill client after server's response
            this.clientState = ClientSocket.RESTART;

            data = Buffer.alloc(0);

            // callback to process next device - fail this packet
            // 
            this.callback(false);                    
        }

        return data;
    }


    private validatePath(root:string, pathArr:string[]) {
        
        for(let i1 = 0 ; i1 < pathArr.length ; i1++) {

            root = path.join(root, pathArr[i1]);
            
            try {
                if(!fs.existsSync(root))
                            fs.mkdirSync(root);
            }
            catch(e) {                
                fs.mkdirSync(root);
            }    
        }
    }


    private onData(data:any) : void  {    

        let arr:Uint32Array   = new Uint32Array(1);        
        let datacheck:boolean = true;

        switch(this.clientState) {

            case ClientSocket.START_STATE:

                data = this.checkState(data, ClientSocket.START_STATE);

                // Write the byte order signature
                var sig = new Uint32Array([5231]);
                this.client.write(new Buffer(sig.buffer));

                this.clientState = ClientSocket.COMMAND_WAIT;
                break;

            case ClientSocket.COMMAND_WAIT:

                data = this.checkState(data, ClientSocket.COMMAND_WAIT);

                if(this.cmdArray.length) {

                    this.cmdJson = this.cmdArray.shift();
                    this.command = JSON.parse(this.cmdJson);

                    this.cmdPacket = Buffer.from(this.cmdJson,"UTF8")

                    // Write the command length
                    arr[0] = this.cmdPacket.length;
                    this.client.write(new Buffer(arr.buffer));

                    this.clientState = ClientSocket.COMMAND_PACKET;
                }
                else {
                    // STALLED STATE - Out of commands
                    // callback to process next device
                    // 
                    this.callback(true);                    
                }
                break;

            case ClientSocket.COMMAND_PACKET:

                data = this.checkState(data, ClientSocket.COMMAND_PACKET);

                // Write the command data
                this.client.write(this.cmdPacket);
                this.clientState = ClientSocket.PROCESS_COMMAND;
                break;

            case ClientSocket.PROCESS_COMMAND:

                data = this.checkState(data, ClientSocket.PROCESS_COMMAND);

                switch(this.command.command) {

                    case "PUSH":
                    case "INSTALL":

                        this.chunk = Buffer.alloc(1024);    
                        this.bytesAvail = this.command.size;
                        this.bytesSent  = 0;
        
                        this.readDesc = fs.openSync(path.join(this.cwd, this.command.from),'r');
    
                        this.clientState = ClientSocket.COMMAND_SENDDATA;
                        break;

                    case "PULL":
                        let pathparts:string[] = this.command.to.split("/");
                        let tablPart = "tablet_"+this.command.tabletId;
                        let pathArr:string[] = pathparts.slice(0,pathparts.length - 1);
                        pathArr.push(tablPart);

                        this.validatePath(this.cwd, pathArr);

                        let filePart = pathparts.slice(pathparts.length - 1).join();
                        this.recvPath = path.join(pathArr.join("/"), filePart);

                        this.clientState = ClientSocket.COMMAND_RECVSTART;
                        this.wstream     = fs.createWriteStream(path.join(this.cwd, this.recvPath));
                        break;

                    case "CLEAN":
                        this.clientState = ClientSocket.COMMAND_WAIT;
                        break;

                }

                // Write simple acknowledgement
                this.client.write("ACK");                    
                break;


            case ClientSocket.COMMAND_SENDDATA:

                data = this.checkState(data, ClientSocket.COMMAND_SENDDATA);

                if(this.bytesAvail > 0) {
                    this.size = fs.readSync(this.readDesc, this.chunk, 0, 1024, null, );
                    
                    this.bytesAvail -= this.size;
                    this.bytesSent  += this.size;

                    if(this.size > 0)
                        this.client.write(this.chunk);

                    process.stdout.write("Bytes Sent: " + this.bytesSent + "\r");

                    this.clientState = ClientSocket.COMMAND_SENDACK;
                }

                if(this.bytesAvail <= 0) {
                    fs.closeSync(this.readDesc);

                    this.clientState = ClientSocket.COMMAND_WAIT;
                }
                break;

            case ClientSocket.COMMAND_SENDACK:

                data = this.checkState(data, ClientSocket.COMMAND_SENDACK);

                this.client.write("ACK");                    
                this.clientState = ClientSocket.COMMAND_SENDDATA;            
                break;



            case ClientSocket.COMMAND_RECVSTART:
                datacheck = false;

                this.recvSize = parseInt(data.toString() ,10);          
                console.log('Receiving Data Size: ' + this.recvSize);                     

                this.client.write("ACK");                    
                this.clientState = ClientSocket.COMMAND_RECVDATA;
                break;

            case ClientSocket.COMMAND_RECVDATA:
                datacheck = false;

                if(this.recvSize > 0) {

                    this.wstream.write(data);
                    this.recvSize -= data.length;
                }

                if(this.recvSize <= 0) {
                    console.log('File Complete: ' + this.recvPath);                     

                    this.wstream.end();
                    this.clientState = ClientSocket.COMMAND_WAIT;
                }
                else 
                    this.client.write("ACK");                    
                
            break;
        }


        // Check for remaining commands
        // 
        if(this.clientState === ClientSocket.RESTART)
            this.clientState = ClientSocket.START_STATE;
            
        else if(datacheck && (data.length > 0)) {

            this.onData(data);
        }
    }

    private onClose(e:any) {
        //  console.log('Connection closed: ' + e);        
    }

    private onError(e:any) {
        console.log('ERROR: Connection closed: ' + e);        

        // callback to process next device - fail this packet
        // 
        this.callback(false);                    
    }

    private onTimeout() {
        // console.log('ERROR: Connection timed out:');        
    }

    public pushCommand(command:string) {

        this.cmdArray.push(command);

        if(this.clientState === ClientSocket.COMMAND_STALLED) {
            
            this.clientState = ClientSocket.COMMAND_WAIT;
            this.onData(this.clientState);
        }
    }

}