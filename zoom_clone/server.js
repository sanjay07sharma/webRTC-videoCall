const express = require('express');
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server);
const { v4:uuidV4 } = require('uuid')

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-connected', userId);

    socket.on('screen-shared', stream => {
      socket.broadcast.to(roomId).emit('user-screen-shared', userId, stream);
    });

    socket.on('screen-stopped', () => {
      socket.broadcast.to(roomId).emit('user-screen-stopped', userId);
    });

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId);
    });
  });

})
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
})


app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
})


server.listen(8099)