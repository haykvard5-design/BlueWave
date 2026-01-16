const socket = io();

let isLoginMode = true;

const mainBtn = document.getElementById('main-btn');
const toggleLink = document.getElementById('toggle-link');
const toggleText = document.getElementById('toggle-text');
const formSubtitle = document.getElementById('form-subtitle');

// ПЕРЕКЛЮЧЕНИЕ МЕЖДУ ВХОДОМ И РЕГИСТРАЦИЕЙ
toggleLink.onclick = () => {
    isLoginMode = !isLoginMode;
    mainBtn.innerText = isLoginMode ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ";
    formSubtitle.innerText = isLoginMode ? "Добро пожаловать в мессенджер" : "Заполните данные для регистрации";
    toggleText.innerText = isLoginMode ? "Нет аккаунта?" : "Уже есть аккаунт?";
    toggleLink.innerText = isLoginMode ? "Зарегистрироваться" : "Войти";
};

// ОБРАБОТКА ВХОДА
mainBtn.onclick = () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user && pass) {
        // Отправляем данные на сервер (server.js должен это поддерживать)
        socket.emit(isLoginMode ? 'login' : 'register', { user, pass });
        
        // Скрываем авторизацию и показываем чат
        document.getElementById('auth').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
        console.log("Вход под именем:", user);
    } else {
        alert("Пожалуйста, заполните логин и пароль!");
    }
}

// ВИДЕОЗВОНКИ
const callBtn = document.getElementById('callBtn');
const videoContainer = document.getElementById('video-container');

callBtn.onclick = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoContainer.style.display = 'flex';
        document.getElementById('local-video').srcObject = stream;
    } catch (e) {
        alert("Не удалось получить доступ к камере. Убедитесь, что вы используете HTTPS.");
    }
};

document.getElementById('hangup-btn').onclick = () => {
    const stream = document.getElementById('local-video').srcObject;
    if (stream) stream.getTracks().forEach(track => track.stop());
    videoContainer.style.display = 'none';
};

// ОТПРАВКА СООБЩЕНИЙ
document.getElementById('send-btn').onclick = () => {
    const text = document.getElementById('msg-input').value;
    if (text) {
        socket.emit('chat message', text);
        document.getElementById('msg-input').value = '';
    }
};

socket.on('chat message', (data) => {
    const msg = document.createElement('div');
    msg.style.padding = "10px";
    msg.style.marginBottom = "10px";
    msg.style.background = "white";
    msg.style.borderRadius = "10px";
    msg.innerText = `${data.user || 'Я'}: ${data.text}`;
    document.getElementById('messages').appendChild(msg);
});