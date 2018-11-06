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

import * as net        from "net";
import { CEF_Command } from "./admintypes";
import { WriteStream } from "fs";
import { ReadStream }  from "fs";
import { Socket } from "dgram";
import { ClientSocket } from "./ClientSocket";


export class ServerSocket 
{
    private connectBoundListener:(...args:any[]) =>{};
    private dataBoundListener:(...args:any[]) =>{};
    private closeBoundListener:(...args:any[]) =>{};
    private errorBoundListener:(...args:any[]) =>{};

    private server:net.Server; 
    private static clients:Socket[] = new Array<Socket>();
    private callback:Function;

    constructor(resultCallback:Function) {

        this.server = new net.Server();
        this.server.ref();

        this.callback = resultCallback;
    }

    public close() : void{

        this.server.close(this.closeBoundListener);
    }

    public listen(port:number, ip:string) {

        this.connectBoundListener = this.onConnect.bind(this);
        this.dataBoundListener    = this.onData.bind(this);
        this.closeBoundListener   = this.onClose.bind(this);
        this.errorBoundListener   = this.onError.bind(this);
        
        this.server.on("connection", this.connectBoundListener);
        this.server.on("close",      this.closeBoundListener);
        this.server.on("error",      this.errorBoundListener);

        this.server.listen(port, ip);
        console.log("Server Listening: " + port);
    }   

    private onConnect(socket:Socket) : void {
        console.log('User Connected');    

        ServerSocket.clients.push(socket);

        socket.on("data",       this.dataBoundListener);
        socket.on("close",      this.onClose);
    }

    private onData(data:any) : void  {    

        this.callback(data);
    }

    private onClose(result:Socket) {

        let found:boolean = false;
        let element:number;
        let socket:Socket = <Socket><any>this;
    
        for(let ndx = 0 ; ndx < ServerSocket.clients.length ; ndx++) {
            if(ServerSocket.clients[ndx] === socket) {

                ServerSocket.clients.splice(ndx);
                found = true;
                console.log('Client Shutdown: ' + ServerSocket.clients.length);
                break;
            }
        }

        if(!found) {
            console.log('Server Shutdown');        
        }   
    }

    private onError() {
        console.log('Error Occured');        
    }

    public pushCommand(command:string) {

    }


}
