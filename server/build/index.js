"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_1 = __importDefault(require("socket.io"));
var PORT = 3000;
var SERVER = socket_io_1.default.listen(PORT);
SERVER.on('connection', function (socket) {
    console.log('client connected');
    socket.emit('welcome', 'welcome');
});
