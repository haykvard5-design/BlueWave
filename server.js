const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.json());
app.use(express.static(__dirname)); 

let users = { 'admin': '1234' }; 

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        res.json({ success: true });
    } else {
        res.json({ success: false, error: "Неверный логин или пароль" });
    }
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.json({ success: false, error: "Заполните все поля" });
    if (users[username]) {
        res.json({ success: false, error: "Пользователь уже существует" });
    } else {
        users[username] = password;
        res.json({ success: true });
    }
});

io.on('connection', (socket) => {
    socket.on('msg', (data) => {
        data.time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        io.emit('msg', data); 
    });
});

http.listen(3000, () => console.log('BlueWave запущен на http://localhost:3000'));