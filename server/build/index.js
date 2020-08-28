"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_1 = __importDefault(require("socket.io"));
var communication_1 = __importDefault(require("./communication"));
var PORT = 3000;
var SERVER = socket_io_1.default.listen(PORT);
var UDP_SERVER = new communication_1.default(4000);
UDP_SERVER.setOnMessage(function (msg) {
    SERVER.emit('packet', msg);
});
SERVER.on('connection', function (socket) {
    console.log('client connected');
    socket.emit('welcome', 'welcome');
});
