const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let users = {};

io.on('connection', (socket) => {
    socket.on('login', (name) => {
        users[socket.id] = name;
        console.log(`${name} вошел в чат`);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', { user: users[socket.id], text: msg });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});