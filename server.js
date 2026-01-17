const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

app.use(express.static(__dirname));

let onlineUsers = {};
const DB_FILE = 'database.json';
const SALT_ROUNDS = 10;

// Функция для безопасного чтения БД
function readDB() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const defaultDB = { users: {}, messages: [] };
            fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
            return defaultDB;
        }
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
        console.error('Ошибка чтения БД:', err);
        return { users: {}, messages: [] };
    }
}

// Функция для безопасного сохранения БД
function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Ошибка записи БД:', err);
        return false;
    }
}

// Валидация username и password
function validateInput(user, pass) {
    if (typeof user !== 'string' || typeof pass !== 'string') {
        return { valid: false, error: 'Некорректные данные' };
    }
    if (user.length < 3 || user.length > 20) {
        return { valid: false, error: 'Логин: от 3 до 20 символов' };
    }
    if (pass.length < 4 || pass.length > 50) {
        return { valid: false, error: 'Пароль: от 4 до 50 символов' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(user)) {
        return { valid: false, error: 'Логин может содержать только буквы, цифры и _' };
    }
    return { valid: true };
}

io.on('connection', (socket) => {
    console.log('Пользователь подключен:', socket.id);

    // ЛОГИН
    socket.on('login', async (data) => {
        try {
            const validation = validateInput(data.user, data.pass);
            if (!validation.valid) {
                return socket.emit('auth-error', validation.error);
            }

            const db = readDB();
            
            if (!db.users[data.user]) {
                return socket.emit('auth-error', 'Пользователь не найден');
            }

            // Сравниваем хэширование пароля
            const isPasswordValid = await bcrypt.compare(data.pass, db.users[data.user].hash);
            
            if (!isPasswordValid) {
                return socket.emit('auth-error', 'Неверный пароль');
            }

            const shortId = data.user.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);
            onlineUsers[socket.id] = { 
                name: data.user, 
                shortId: shortId,
                loginTime: new Date()
            };

            socket.emit('auth-success', { shortId });
            updateUserList();
            console.log(`${data.user} успешно вошел`);

        } catch (err) {
            console.error('Ошибка логина:', err);
            socket.emit('auth-error', 'Ошибка сервера');
        }
    });

    // РЕГИСТРАЦИЯ
    socket.on('register', async (data) => {
        try {
            const validation = validateInput(data.user, data.pass);
            if (!validation.valid) {
                return socket.emit('auth-error', validation.error);
            }

            const db = readDB();
            
            if (db.users[data.user]) {
                return socket.emit('auth-error', 'Пользователь уже существует');
            }

            // Хэшируем пароль перед сохранением
            const hash = await bcrypt.hash(data.pass, SALT_ROUNDS);
            db.users[data.user] = { hash, createdAt: new Date() };
            
            if (writeDB(db)) {
                socket.emit('auth-success-register', 'Регистрация успешна! Теперь войдите.');
                console.log(`Новый пользователь зарегистрирован: ${data.user}`);
            } else {
                socket.emit('auth-error', 'Ошибка при сохранении');
            }

        } catch (err) {
            console.error('Ошибка регистрации:', err);
            socket.emit('auth-error', 'Ошибка сервера');
        }
    });

    // ПРИВАТНОЕ СООБЩЕНИЕ
    socket.on('private-msg', (d) => {
        try {
            if (!d.to || !d.text || typeof d.text !== 'string') {
                return socket.emit('msg-error', 'Некорректные данные сообщения');
            }

            const text = d.text.trim().substring(0, 500); // Ограничиваем размер
            if (!text) return;

            const sender = onlineUsers[socket.id];
            if (!sender) return;

            const message = {
                from: socket.id,
                to: d.to,
                senderName: sender.name,
                text: text,
                timestamp: new Date(),
                type: 'private'
            };

            // Сохраняем в БД
            const db = readDB();
            db.messages.push(message);
            writeDB(db);

            // Отправляем получателю
            socket.to(d.to).emit('receive-msg', {
                name: sender.name,
                text: text,
                from: socket.id,
                timestamp: message.timestamp
            });

        } catch (err) {
            console.error('Ошибка отправки приватного сообщения:', err);
            socket.emit('msg-error', 'Ошибка отправки');
        }
    });

    // ГРУППОВОЕ СООБЩЕНИЕ
    socket.on('group-msg', (d) => {
        try {
            if (!d.text || typeof d.text !== 'string') {
                return socket.emit('msg-error', 'Некорректные данные сообщения');
            }

            const text = d.text.trim().substring(0, 500);
            if (!text) return;

            const sender = onlineUsers[socket.id];
            if (!sender) return;

            const message = {
                from: socket.id,
                senderName: sender.name,
                text: text,
                timestamp: new Date(),
                type: 'group'
            };

            // Сохраняем в БД
            const db = readDB();
            db.messages.push(message);
            writeDB(db);

            // Отправляем всем
            io.emit('receive-msg', {
                name: sender.name,
                text: text,
                from: socket.id,
                timestamp: message.timestamp
            });

        } catch (err) {
            console.error('Ошибка отправки группового сообщения:', err);
            socket.emit('msg-error', 'Ошибка отправки');
        }
    });

    // ОБНОВЛЕНИЕ СПИСКА ПОЛЬЗОВАТЕЛЕЙ
    socket.on('refresh-users', () => {
        updateUserList();
    });

    function updateUserList() {
        const users = Object.entries(onlineUsers).map(([id, info]) => ({
            socketId: id,
            name: info.name,
            shortId: info.shortId,
            status: 'online'
        }));
        io.emit('update-users', users);
    }

    // ОТКЛЮЧЕНИЕ
    socket.on('disconnect', () => {
        const user = onlineUsers[socket.id];
        if (user) {
            console.log(`${user.name} отключился`);
            delete onlineUsers[socket.id];
            updateUserList();
        }
    });

    // ОБРАБОТКА ОШИБОК
    socket.on('error', (err) => {
        console.error('Socket ошибка:', err);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});