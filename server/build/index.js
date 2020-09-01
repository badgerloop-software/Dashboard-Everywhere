"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_1 = __importDefault(require("socket.io"));
var communication_1 = __importDefault(require("./communication"));
var SOCKET_PORT = 3000;
var UDP_PORT = 4000;
var SERVER = socket_io_1.default.listen(SOCKET_PORT);
var UDP_SERVER = new communication_1.default(UDP_PORT);
UDP_SERVER.setOnMessage(function (msg) {
    SERVER.emit('packet', msg.toString());
});
SERVER.on('connection', function (socket) {
    console.log('client connected');
    socket.emit('welcome', 'welcome');
});
process.on('SIGINT', function () {
    SERVER.close();
    UDP_SERVER.closeServer();
});
console.log("[INFO] Socket.io listening at port " + SOCKET_PORT);
