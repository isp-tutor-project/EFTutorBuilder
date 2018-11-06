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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const net = __importStar(require("net"));
class ClientSocket {
    constructor() {
        this.recvSize = -1;
        this.cmdArray = new Array();
        this.clientState = ClientSocket.START_STATE;
        this.client = new net.Socket();
    }
    connect(port, ip) {
        this.connectBoundListener = this.onConnect.bind(this);
        this.dataBoundListener = this.onData.bind(this);
        this.closeBoundListener = this.onClose.bind(this);
        this.client.on("connect", this.connectBoundListener);
        this.client.on("data", this.dataBoundListener);
        this.client.on("close", this.closeBoundListener);
        this.client.connect(port, ip);
    }
    onConnect() {
        console.log('Connected');
    }
    checkState(data, state) {
        let str = data.toString();
        // If the expected state is in the message then trim it and continue
        // 
        if (str.startsWith(state)) {
            if (state === 'STATE1')
                console.log('Entering Wait State');
            data = data.slice(state.length);
        }
        else {
            console.log('State Mismatch: ' + this.clientState);
            this.client.destroy(); // kill client after server's response
            this.clientState = ClientSocket.RESTART;
            data = Buffer.alloc(0);
        }
        return data;
    }
    onData(data) {
        let arr = new Uint32Array(1);
        let datacheck = true;
        switch (this.clientState) {
            case ClientSocket.START_STATE:
                data = this.checkState(data, ClientSocket.START_STATE);
                // Write the byte order signature
                var sig = new Uint32Array([5231]);
                this.client.write(new Buffer(sig.buffer));
                this.clientState = ClientSocket.COMMAND_WAIT;
                break;
            case ClientSocket.COMMAND_WAIT:
                data = this.checkState(data, ClientSocket.COMMAND_WAIT);
                if (this.cmdArray.length) {
                    this.cmdJson = this.cmdArray.shift();
                    this.command = JSON.parse(this.cmdJson);
                    this.cmdPacket = Buffer.from(this.cmdJson, "UTF8");
                    // Write the command length
                    arr[0] = this.cmdPacket.length;
                    this.client.write(new Buffer(arr.buffer));
                    this.clientState = ClientSocket.COMMAND_PACKET;
                }
                else {
                    this.clientState = ClientSocket.COMMAND_STALLED;
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
                switch (this.command.command) {
                    case "PUSH":
                        this.chunk = Buffer.alloc(1024);
                        this.bytesAvail = this.command.size;
                        this.bytesSent = 0;
                        this.readDesc = fs.openSync(this.command.from, 'r');
                        this.clientState = ClientSocket.COMMAND_SENDDATA;
                        break;
                    case "PULL":
                        this.clientState = ClientSocket.COMMAND_RECVSTART;
                        this.wstream = fs.createWriteStream(this.command.to);
                        break;
                }
                // Write simple acknowledgement
                this.client.write("ACK");
                break;
            case ClientSocket.COMMAND_SENDDATA:
                data = this.checkState(data, ClientSocket.COMMAND_SENDDATA);
                if (this.bytesAvail > 0) {
                    this.size = fs.readSync(this.readDesc, this.chunk, 0, 1024, null);
                    this.bytesAvail -= this.size;
                    this.bytesSent += this.size;
                    if (this.size > 0)
                        this.client.write(this.chunk);
                    console.log("Bytes Written/Sent: " + this.bytesSent + " :: " + this.client.bytesWritten);
                    this.clientState = ClientSocket.COMMAND_SENDACK;
                }
                if (this.bytesAvail <= 0) {
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
                this.recvSize = parseInt(data.toString(), 10);
                console.log('Receiving Data Size: ' + this.recvSize);
                this.client.write("ACK");
                this.clientState = ClientSocket.COMMAND_RECVDATA;
                break;
            case ClientSocket.COMMAND_RECVDATA:
                datacheck = false;
                if (this.recvSize > 0) {
                    this.wstream.write(data);
                    this.recvSize -= data.length;
                }
                if (this.recvSize <= 0) {
                    console.log('File Complete: ' + this.command.to);
                    this.wstream.end();
                    this.clientState = ClientSocket.COMMAND_WAIT;
                }
                else
                    this.client.write("ACK");
                break;
        }
        // Check for remaining commands
        // 
        if (this.clientState === ClientSocket.RESTART)
            this.clientState = ClientSocket.START_STATE;
        else if (datacheck && (data.length > 0)) {
            this.onData(data);
        }
    }
    onClose() {
        console.log('Connection closed');
    }
    pushCommand(command) {
        this.cmdArray.push(command);
        if (this.clientState === ClientSocket.COMMAND_STALLED) {
            this.clientState = ClientSocket.COMMAND_WAIT;
            this.onData(this.clientState);
        }
    }
}
ClientSocket.RESTART = "RESTART";
ClientSocket.START_STATE = "STATE0";
ClientSocket.COMMAND_WAIT = "STATE1";
ClientSocket.COMMAND_PACKET = "STATE2";
ClientSocket.PROCESS_COMMAND = "STATE3";
// note: these are the inverse of the server side.
// i.e. Server state4 == SENDDATA
// i.e. Server state5 == RECVDATA
// 
ClientSocket.COMMAND_RECVSTART = "STATE4";
ClientSocket.COMMAND_RECVDATA = "STATE5";
ClientSocket.COMMAND_RECVACK = "STATE6";
ClientSocket.COMMAND_SENDSTART = "STATE7";
ClientSocket.COMMAND_SENDDATA = "STATE8";
ClientSocket.COMMAND_SENDACK = "STATE9";
ClientSocket.COMMAND_STALLED = "STATE10";
exports.ClientSocket = ClientSocket;
//# sourceMappingURL=client.js.map