const socket = io(); // Авто-подключение к Render

const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');

// 1. Логика входа
loginBtn.onclick = () => {
    const name = usernameInput.value.trim();
    if (name) {
        socket.emit('login', name);
        authScreen.style.display = 'none';
        chatScreen.style.display = 'flex';
    } else {
        alert("Введите имя!");
    }
};

// 2. Отправка сообщений
const sendBtn = document.getElementById('send-btn');
const msgInput = document.getElementById('msg-input');
const messagesDiv = document.getElementById('messages');

sendBtn.onclick = () => {
    const msg = msgInput.value;
    if (msg) {
        socket.emit('chat message', msg);
        msgInput.value = '';
    }
};

socket.on('chat message', (data) => {
    const item = document.createElement('div');
    item.textContent = `${data.user}: ${data.text}`;
    messagesDiv.appendChild(item);
});

// 3. Видеозвонки (Упрощенно для начала)
const callBtn = document.getElementById('call-btn');
callBtn.onclick = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('local-video').srcObject = stream;
        // Здесь будет логика WebRTC для передачи потока
    } catch (err) {
        alert("Ошибка камеры: " + err.message);
    }
};