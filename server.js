const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const bcrypt = require('bcrypt');

app.use(express.static(__dirname));

let onlineUsers = {};
const DB_FILE = 'database.json';
const SALT_ROUNDS = 10;

function readDB() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const defaultDB = { users: {}, messages: [] };
            fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
            return defaultDB;
        }
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
        console.error('DB read error:', err);
        return { users: {}, messages: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('DB write error:', err);
        return false;
    }
}

function generateShortId(username) {
    return username.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);
}

function validateInput(user, pass) {
    if (typeof user !== 'string' || typeof pass !== 'string') {
        return { valid: false, error: 'Invalid data' };
    }
    if (user.length < 3 || user.length > 20) {
        return { valid: false, error: 'Username: 3-20 characters' };
    }
    if (pass.length < 4 || pass.length > 50) {
        return { valid: false, error: 'Password: 4-50 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(user)) {
        return { valid: false, error: 'Username: letters, numbers, _ only' };
    }
    return { valid: true };
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('login', async (data) => {
        try {
            const validation = validateInput(data.user, data.pass);
            if (!validation.valid) {
                return socket.emit('auth-error', validation.error);
            }

            const db = readDB();
            
            if (!db.users[data.user]) {
                return socket.emit('auth-error', 'User not found');
            }

            const isPasswordValid = await bcrypt.compare(data.pass, db.users[data.user].hash);
            
            if (!isPasswordValid) {
                return socket.emit('auth-error', 'Wrong password');
            }

            let shortId = db.users[data.user].shortId;
            if (!shortId) {
                shortId = generateShortId(data.user);
                db.users[data.user].shortId = shortId;
                writeDB(db);
            }

            onlineUsers[socket.id] = { 
                name: data.user, 
                shortId: shortId,
                loginTime: new Date()
            };

            socket.emit('auth-success', { 
                shortId,
                userName: data.user
            });
            updateUserList();

        } catch (err) {
            console.error('Login error:', err);
            socket.emit('auth-error', 'Server error');
        }
    });

    socket.on('register', async (data) => {
        try {
            const validation = validateInput(data.user, data.pass);
            if (!validation.valid) {
                return socket.emit('auth-error', validation.error);
            }

            const db = readDB();
            
            if (db.users[data.user]) {
                return socket.emit('auth-error', 'User already exists');
            }

            const shortId = generateShortId(data.user);
            const hash = await bcrypt.hash(data.pass, SALT_ROUNDS);
            db.users[data.user] = { 
                hash, 
                shortId: shortId,
                createdAt: new Date() 
            };
            
            if (writeDB(db)) {
                socket.emit('auth-success-register', 'Registration successful! Login now.');
                console.log(`New user: ${data.user} with ID: ${shortId}`);
            }

        } catch (err) {
            console.error('Register error:', err);
            socket.emit('auth-error', 'Server error');
        }
    });

    socket.on('private-msg', (d) => {
        try {
            if (!d.to || !d.text || typeof d.text !== 'string') return;

            const text = d.text.trim().substring(0, 500);
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

            const db = readDB();
            db.messages.push(message);
            writeDB(db);

            socket.to(d.to).emit('receive-msg', {
                name: sender.name,
                text: text,
                from: socket.id,
                timestamp: message.timestamp,
                type: 'private'
            });

        } catch (err) {
            console.error('Private msg error:', err);
        }
    });

    socket.on('group-msg', (d) => {
        try {
            if (!d.text || typeof d.text !== 'string') return;

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

            const db = readDB();
            db.messages.push(message);
            writeDB(db);

            io.emit('receive-msg', {
                name: sender.name,
                text: text,
                from: socket.id,
                timestamp: message.timestamp,
                type: 'group'
            });

        } catch (err) {
            console.error('Group msg error:', err);
        }
    });

    // ЗВОНКИ
    socket.on('audio-call', (data) => {
        socket.to(data.to).emit('incoming-audio-call', {
            from: onlineUsers[socket.id].name,
            offer: data.offer,
            isVideo: false
        });
    });

    socket.on('video-call', (data) => {
        socket.to(data.to).emit('incoming-video-call', {
            from: onlineUsers[socket.id].name,
            offer: data.offer,
            isVideo: true
        });
    });

    socket.on('answer-call', (data) => {
        socket.to(data.to).emit('call-answered', {
            answer: data.answer
        });
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.to).emit('ice-candidate', {
            candidate: data.candidate
        });
    });

    socket.on('end-call', (data) => {
        socket.to(data.to).emit('call-ended');
    });

    socket.on('decline-call', (data) => {
        socket.to(data.to).emit('call-declined');
    });

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

    socket.on('disconnect', () => {
        const user = onlineUsers[socket.id];
        if (user) {
            console.log(`${user.name} disconnected`);
            delete onlineUsers[socket.id];
            updateUserList();
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
