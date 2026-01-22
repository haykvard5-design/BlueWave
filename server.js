const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.use(express.static(__dirname));

let onlineUsers = {};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        let db = JSON.parse(fs.readFileSync('database.json'));
        if (db.users[data.user] === data.pass) {
            const shortId = data.user.substring(0, 3) + Math.floor(100 + Math.random() * 900);
            onlineUsers[socket.id] = { name: data.user, shortId: shortId };
            socket.emit('auth-success', { shortId });
            updateUserList();
        } else {
            socket.emit('auth-error', 'Ошибка входа');
        }
    });

    socket.on('register', (data) => {
        let db = JSON.parse(fs.readFileSync('database.json'));
        if (db.users[data.user]) return socket.emit('auth-error', 'Уже есть такой');
        db.users[data.user] = data.pass;
        fs.writeFileSync('database.json', JSON.stringify(db, null, 2));
        socket.emit('auth-error', 'Регистрация успешна! Теперь войдите.');
    });

    socket.on('private-msg', d => {
        socket.to(d.to).emit('receive-msg', { name: onlineUsers[socket.id].name, text: d.text, from: socket.id });
    });

    socket.on('group-msg', d => {
        io.emit('receive-msg', { name: onlineUsers[socket.id].name, text: d.text, from: socket.id });
    });

    function updateUserList() {
        const users = Object.entries(onlineUsers).map(([id, info]) => ({ socketId: id, name: info.name, shortId: info.shortId }));
        io.emit('update-users', users);
    }

    socket.on('disconnect', () => { delete onlineUsers[socket.id]; updateUserList(); });
});

http.listen(process.env.PORT || 3000);