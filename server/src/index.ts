import io from 'socket.io';
import UdpServer from './communication';

const PORT = 3000;

const SERVER = io.listen(PORT);

const UDP_SERVER = new UdpServer(4000);

UDP_SERVER.setOnMessage((msg) => {
  SERVER.emit('packet', msg);
});

SERVER.on('connection', (socket) => {
  console.log('client connected');
  socket.emit('welcome', 'welcome');
});
