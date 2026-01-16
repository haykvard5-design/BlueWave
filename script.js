const socket = io();
let isLoginMode = true;
let selectedUserId = null;
let currentChatType = 'none'; // 'none', 'private', или 'group'

const mainBtn = document.getElementById('main-btn');
const toggleLink = document.getElementById('toggle-link');

// 1. РЕГИСТРАЦИЯ / ВХОД (НЕ ТРОГАЕМ ЛОГИКУ)
toggleLink.onclick = () => {
    isLoginMode = !isLoginMode;
    mainBtn.innerText = isLoginMode ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ";
    document.getElementById('form-subtitle').innerText = isLoginMode ? "Добро пожаловать в мессенджер" : "Заполните данные для регистрации";
    document.getElementById('toggle-text').innerText = isLoginMode ? "Нет аккаунта?" : "Уже есть аккаунт?";
    toggleLink.innerText = isLoginMode ? "Зарегистрироваться" : "Войти";
};

mainBtn.onclick = () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (user && pass) {
        socket.emit(isLoginMode ? 'login' : 'register', { user, pass });
        document.getElementById('auth').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
    } else {
        alert("Заполните поля!");
    }
};

// 2. ВЫБОР ГРУППЫ BLUEWAVE
document.getElementById('global-group').onclick = () => {
    selectedUserId = 'global';
    currentChatType = 'group';
    document.getElementById('target-user-name').innerText = "BlueWave Group";
    document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
    document.getElementById('global-group').classList.add('active');
    document.getElementById('messages').innerHTML = ''; 
};

// 3. ОБНОВЛЕНИЕ ЛЮДЕЙ В САЙДБАРЕ
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
                currentChatType = 'private';
                document.getElementById('target-user-name').innerText = u.name;
                document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
                div.classList.add('active');
                document.getElementById('messages').innerHTML = '';
            };
            userList.appendChild(div);
        }
    });
});

// 4. ОТПРАВКА СООБЩЕНИЙ
document.getElementById('send-btn').onclick = () => {
    const text = document.getElementById('msg-input').value.trim();
    if (!text || currentChatType === 'none') return;

    if (currentChatType === 'group') {
        socket.emit('group-message', { text: text });
    } else {
        socket.emit('private-message', { to: selectedUserId, text: text });
        appendMessage('Вы', text, 'my-msg');
    }
    document.getElementById('msg-input').value = '';
};

socket.on('receive-group-message', (data) => {
    if (currentChatType === 'group') {
        const type = data.senderId === socket.id ? 'my-msg' : 'their-msg';
        appendMessage(data.senderName, data.text, type);
    }
});

socket.on('receive-private-message', (data) => {
    if (currentChatType === 'private' && data.from === selectedUserId) {
        appendMessage(data.senderName, data.text, 'their-msg');
    } else {
        alert("Новое личное сообщение от " + data.senderName);
    }
});

function appendMessage(name, text, type) {
    const msg = document.createElement('div');
    msg.style.marginBottom = "10px";
    msg.innerHTML = `<div style="padding:10px; border-radius:10px; background:${type==='my-msg'?'#007bff':'#eee'}; color:${type==='my-msg'?'#fff':'#000'}; display:inline-block;"><b>${name}:</b> ${text}</div>`;
    document.getElementById('messages').appendChild(msg);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}