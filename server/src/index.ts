import io from 'socket.io';
import UdpServer from './communication';

const PORT = 3000;

const SERVER = io.listen(PORT);

const UDP_SERVER = new UdpServer(4000);

UDP_SERVER.setOnMessage((msg) => {
  SERVER.emit('packet', msg.toString());
});

SERVER.on('connection', (socket) => {
  console.log('client connected');
  socket.emit('welcome', 'welcome');
});

process.on('SIGINT', () => {
  SERVER.close();
  UDP_SERVER.closeServer();
});
