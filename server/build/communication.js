"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dgram_1 = __importDefault(require("dgram"));
var UdpServer = /** @class */ (function () {
    function UdpServer(port) {
        this.server = this.createUDPSocket(port);
    }
    UdpServer.prototype.createUDPSocket = function (port) {
        var _this = this;
        var server = dgram_1.default.createSocket('udp4');
        server.on('error', function (error) {
            console.log("[ERROR] " + error.message);
            _this.server.close();
        });
        server.on('message', function (msg, info) {
            console.log("[INFO] Data recieved from client " + msg.toString());
            console.log('[INFO] Recieved %d bytes from %s:%d', msg.length, info.address, info.port);
        });
        server.on('close', function () {
            console.log('[INFO] UDP Socket is closed');
        });
        server.bind(port);
        console.log("[INFO] UDP Socket Listening at port " + port);
        return server;
    };
    UdpServer.prototype.closeServer = function () {
        this.server.close();
    };
    UdpServer.prototype.setOnMessage = function (onMessage) {
        this.server.on('message', onMessage);
    };
    return UdpServer;
}());
exports.default = UdpServer;
