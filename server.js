const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Redirect to random room if none provided
app.get('/', (req, res) => {
  const room = req.query.room;
  if (!room) {
    const randomRoom = Math.random().toString(36).substring(2, 8);
    return res.redirect(`/?room=${randomRoom}`);
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);

    socket.on('offer', (data) => {
      socket.to(data.target).emit('offer', {
        sender: socket.id,
        offer: data.offer
      });
    });

    socket.on('answer', (data) => {
      socket.to(data.target).emit('answer', {
        sender: socket.id,
        answer: data.answer
      });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.target).emit('ice-candidate', {
        sender: socket.id,
        candidate: data.candidate
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(4000, () => {
  console.log('🚀 Server running at http://localhost:4000');
});
