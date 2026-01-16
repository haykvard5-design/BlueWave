const socket = io();
let isLoginMode = true;
let selectedUserId = null;

const mainBtn = document.getElementById('main-btn');
const toggleLink = document.getElementById('toggle-link');

// 1. ПЕРЕКЛЮЧЕНИЕ: ВХОД / РЕГИСТРАЦИЯ
toggleLink.onclick = () => {
    isLoginMode = !isLoginMode;
    mainBtn.innerText = isLoginMode ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ";
    document.getElementById('form-subtitle').innerText = isLoginMode ? "Добро пожаловать" : "Регистрация нового профиля";
    document.getElementById('toggle-text').innerText = isLoginMode ? "Нет аккаунта?" : "Уже есть аккаунт?";
    toggleLink.innerText = isLoginMode ? "Зарегистрироваться" : "Войти";
};

// 2. ВХОД / РЕГИСТРАЦИЯ
mainBtn.onclick = () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (user && pass) {
        socket.emit(isLoginMode ? 'login' : 'register', { user, pass });
        document.getElementById('auth').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
    }
};

// 3. ПОИСК И ОБНОВЛЕНИЕ СПИСКА
socket.on('update-users', (users) => {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    users.forEach(u => {
        if (u.id !== socket.id) {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.innerHTML = `<div class="mini-cube"></div> <span>${u.name}</span>`;
            div.onclick = () => {
                selectedUserId = u.id;
                document.getElementById('target-user-name').innerText = u.name;
                document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
                div.classList.add('active');
            };
            userList.appendChild(div);
        }
    });
});

// 4. ЛИЧНЫЕ СООБЩЕНИЯ
document.getElementById('send-btn').onclick = () => {
    const text = document.getElementById('msg-input').value;
    if (text && selectedUserId) {
        socket.emit('private-message', { to: selectedUserId, text: text });
        appendMessage('Вы', text, 'my-msg');
        document.getElementById('msg-input').value = '';
    }
};

socket.on('receive-private-message', (data) => {
    if (data.from === selectedUserId) {
        appendMessage(data.senderName, data.text, 'their-msg');
    } else {
        alert("Новое сообщение от " + data.senderName);
    }
});

function appendMessage(name, text, type) {
    const msg = document.createElement('div');
    msg.className = `msg-bubble ${type}`;
    msg.innerHTML = `<b>${name}:</b> ${text}`;
    document.getElementById('messages').appendChild(msg);
}