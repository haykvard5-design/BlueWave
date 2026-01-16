const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let users = {}; // Тут храним подключенных людей

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    // При входе или регистрации сохраняем имя
    socket.on('login', (data) => {
        users[socket.id] = data.user;
        io.emit('update-users', Object.entries(users).map(([id, name]) => ({id, name})));
    });

    socket.on('register', (data) => {
        users[socket.id] = data.user;
        io.emit('update-users', Object.entries(users).map(([id, name]) => ({id, name})));
    });

    // Отправка ЛС
    socket.on('private-message', (data) => {
        io.to(data.to).emit('receive-private-message', {
            from: socket.id,
            senderName: users[socket.id],
            text: data.text
        });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.entries(users).map(([id, name]) => ({id, name})));
    });
});

http.listen(process.env.PORT || 3000, () => console.log('Server running...'));