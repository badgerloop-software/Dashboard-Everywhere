import io from 'socket.io';
import UdpServer from './communication';

const SOCKET_PORT = 3000;
const UDP_PORT = 4000;

const SERVER: io.Server = io(SOCKET_PORT);

const UDP_SERVER = new UdpServer(UDP_PORT);

UDP_SERVER.setOnMessage((msg: Buffer) => {
  SERVER.emit('packet', msg.toString());
});

SERVER.on('connection', (socket: io.Socket) => {
  console.log('client connected');
  socket.emit('welcome', 'welcome');
});

process.on('SIGINT', () => {
  SERVER.close();
  UDP_SERVER.closeServer();
});

console.log(`[INFO] Socket.io listening at port ${SOCKET_PORT}`);
