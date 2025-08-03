const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cors = require('cors');
const { Server } = require('socket.io');

app.use(cors());
app.use(express.static('public')); // or serve specific files

const io = new Server(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', socket => {
  socket.on('join', roomId => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);

    socket.on('offer', data => {
      io.to(data.target).emit('offer', { sender: socket.id, offer: data.offer });
    });

    socket.on('answer', data => {
      io.to(data.target).emit('answer', { sender: socket.id, answer: data.answer });
    });

    socket.on('ice-candidate', data => {
      io.to(data.target).emit('ice-candidate', { sender: socket.id, candidate: data.candidate });
    });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
