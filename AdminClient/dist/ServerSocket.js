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
class ServerSocket {
    constructor(resultCallback) {
        this.server = new net.Server();
        this.server.ref();
        this.callback = resultCallback;
    }
    close() {
        this.server.close(this.closeBoundListener);
    }
    listen(port, ip) {
        this.connectBoundListener = this.onConnect.bind(this);
        this.dataBoundListener = this.onData.bind(this);
        this.closeBoundListener = this.onClose.bind(this);
        this.errorBoundListener = this.onError.bind(this);
        this.server.on("connection", this.connectBoundListener);
        this.server.on("close", this.closeBoundListener);
        this.server.on("error", this.errorBoundListener);
        this.server.listen(port, ip);
        console.log("Server Listening: " + port);
    }
    onConnect(socket) {
        console.log('User Connected');
        ServerSocket.clients.push(socket);
        socket.on("data", this.dataBoundListener);
        socket.on("close", this.onClose);
    }
    onData(data) {
        this.callback(data);
    }
    onClose(result) {
        let found = false;
        let element;
        let socket = this;
        for (let ndx = 0; ndx < ServerSocket.clients.length; ndx++) {
            if (ServerSocket.clients[ndx] === socket) {
                ServerSocket.clients.splice(ndx);
                found = true;
                console.log('Client Shutdown: ' + ServerSocket.clients.length);
                break;
            }
        }
        if (!found) {
            console.log('Server Shutdown');
        }
    }
    onError() {
        console.log('Error Occured');
    }
    pushCommand(command) {
    }
}
ServerSocket.clients = new Array();
exports.ServerSocket = ServerSocket;
//# sourceMappingURL=ServerSocket.js.map