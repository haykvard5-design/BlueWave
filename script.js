const socket = io();
let myShortId = '';
let addedUsers = [];
let isRegisterMode = false;

// ПЕРЕКЛЮЧЕНИЕ ВХОД / РЕГИСТРАЦИЯ
const toggleBtn = document.getElementById('toggle-auth');
const mainBtn = document.getElementById('main-btn');
const authStatus = document.getElementById('auth-status');

toggleBtn.onclick = () => {
    isRegisterMode = !isRegisterMode;
    if (isRegisterMode) {
        authStatus.innerText = "Создайте новый аккаунт";
        mainBtn.innerText = "ЗАРЕГИСТРИРОВАТЬСЯ";
        toggleBtn.innerText = "Уже есть аккаунт? Войти";
    } else {
        authStatus.innerText = "Добро пожаловать в мессенджер";
        mainBtn.innerText = "ВОЙТИ";
        toggleBtn.innerText = "Зарегистрироваться";
    }
};

// ОТПРАВКА ДАННЫХ
mainBtn.onclick = () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (user && pass) {
        const action = isRegisterMode ? 'register' : 'login';
        socket.emit(action, { user, pass });
    }
};

socket.on('auth-success', (data) => {
    myShortId = data.shortId;
    document.getElementById('my-id-display').innerText = "Ваш ID: " + myShortId;
    document.getElementById('auth').style.display = 'none';
    document.getElementById('chat').style.display = 'block';
});

socket.on('auth-error', (msg) => alert(msg));

// ЧАТ И КОНТАКТЫ
document.getElementById('settings-btn').onclick = () => document.getElementById('settings-modal').style.display = 'flex';
document.getElementById('close-settings').onclick = () => document.getElementById('settings-modal').style.display = 'none';

document.getElementById('confirm-add-btn').onclick = () => {
    const id = document.getElementById('add-user-id').value.trim();
    if (id && id !== myShortId && !addedUsers.includes(id)) {
        addedUsers.push(id);
        socket.emit('refresh-users');
    }
    document.getElementById('settings-modal').style.display = 'none';
};

document.getElementById('global-group').onclick = () => openChat('global', 'BlueWave Group', 'group');

socket.on('update-users', (users) => {
    const list = document.getElementById('user-list');
    list.innerHTML = '';
    users.forEach(u => {
        if (addedUsers.includes(u.shortId)) {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.innerHTML = `<div class="mini-cube"></div> <span>${u.name} (${u.shortId})</span>`;
            div.onclick = () => openChat(u.socketId, u.name, 'private');
            list.appendChild(div);
        }
    });
});

let currentChat = null;
function openChat(id, name, type) {
    currentChat = { id, type };
    document.getElementById('input-panel').style.display = 'flex';
    document.getElementById('chat-welcome').style.display = 'none';
    document.getElementById('target-user-name').innerText = name;
    document.getElementById('messages').innerHTML = '';
}

document.getElementById('send-btn').onclick = () => {
    const text = document.getElementById('msg-input').value.trim();
    if (!text || !currentChat) return;
    const event = currentChat.type === 'group' ? 'group-msg' : 'private-msg';
    socket.emit(event, { to: currentChat.id, text });
    if (currentChat.type === 'private') renderMsg("Вы", text, 'my');
    document.getElementById('msg-input').value = '';
};

socket.on('receive-msg', d => renderMsg(d.name, d.text, d.from === socket.id ? 'my' : 'their'));

function renderMsg(n, t, s) {
    const div = document.createElement('div');
    div.style.alignSelf = s === 'my' ? 'flex-end' : 'flex-start';
    div.innerHTML = `<div style="padding:10px; margin:5px; border-radius:15px; background:${s==='my'?'#007bff':'#eee'}; color:${s==='my'?'#fff':'#000'}"><b>${n}</b><br>${t}</div>`;
    document.getElementById('messages').appendChild(div);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}