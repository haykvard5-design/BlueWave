const socket = io();
let isLoginMode = true;
let selectedUserId = null;
let currentChatType = 'none';
let addedUsers = [];

// Переключатель входа
document.getElementById('toggle-link').onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('main-btn').innerText = isLoginMode ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ";
    document.getElementById('toggle-link').innerText = isLoginMode ? "Зарегистрироваться" : "Войти";
};

// Вход
document.getElementById('main-btn').onclick = () => {
    const user = document.getElementById('username').value.trim();
    if (user) {
        socket.emit('login', { user });
        document.getElementById('auth').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
        document.getElementById('my-id-display').innerText = "Ваш ID: " + socket.id.substring(0, 6);
    }
};

// Настройки (Добавление по ID)
document.getElementById('settings-btn').onclick = () => document.getElementById('settings-modal').style.display = 'flex';
document.getElementById('close-settings').onclick = () => document.getElementById('settings-modal').style.display = 'none';

document.getElementById('confirm-add-btn').onclick = () => {
    const id = document.getElementById('add-user-id').value.trim();
    if (id && !addedUsers.includes(id)) {
        addedUsers.push(id);
        socket.emit('refresh-users');
    }
    document.getElementById('settings-modal').style.display = 'none';
    document.getElementById('add-user-id').value = '';
};

// Обновление списка контактов
socket.on('update-users', (users) => {
    const list = document.getElementById('user-list');
    list.innerHTML = '';
    users.forEach(u => {
        const sid = u.id.substring(0, 6);
        if (u.id !== socket.id && addedUsers.includes(sid)) {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.innerHTML = `<div class="mini-cube"></div> <span>${u.name} (ID: ${sid})</span>`;
            div.onclick = () => {
                selectedUserId = u.id;
                currentChatType = 'private';
                document.getElementById('input-panel').style.display = 'flex';
                document.getElementById('chat-welcome').style.display = 'none';
                document.getElementById('target-user-name').innerText = u.name;
                document.getElementById('messages').innerHTML = '';
                document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
                div.classList.add('active');
            };
            list.appendChild(div);
        }
    });
});

// Группа
document.getElementById('global-group').onclick = () => {
    selectedUserId = 'global';
    currentChatType = 'group';
    document.getElementById('input-panel').style.display = 'flex';
    document.getElementById('chat-welcome').style.display = 'none';
    document.getElementById('target-user-name').innerText = "BlueWave Group";
    document.getElementById('messages').innerHTML = '';
    document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
    document.getElementById('global-group').classList.add('active');
};

// Сообщения
document.getElementById('send-btn').onclick = () => {
    const text = document.getElementById('msg-input').value;
    if (!text) return;
    if (currentChatType === 'group') socket.emit('group-message', { text });
    else {
        socket.emit('private-message', { to: selectedUserId, text });
        appendMsg("Вы", text, "my-msg");
    }
    document.getElementById('msg-input').value = '';
};

socket.on('receive-private-message', data => {
    if (selectedUserId === data.from) appendMsg(data.senderName, data.text, "their-msg");
});

socket.on('receive-group-message', data => {
    if (currentChatType === 'group') appendMsg(data.senderName, data.text, data.senderId === socket.id ? "my-msg" : "their-msg");
});

function appendMsg(name, text, type) {
    const msg = document.createElement('div');
    msg.className = "message-row " + type;
    msg.innerHTML = `<div class="bubble"><b>${name}:</b><br>${text}</div>`;
    document.getElementById('messages').appendChild(msg);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}