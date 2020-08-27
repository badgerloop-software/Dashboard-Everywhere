import io from 'socket.io';

const PORT = 3000;

const SERVER = io.listen(PORT);

SERVER.on('connection', (socket) => {
  console.log('client connected');
  socket.emit('welcome', 'welcome');
});
