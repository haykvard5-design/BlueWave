const socket = io();
let myShortId = '';
let selectedUserId = null;
let currentChatType = 'none';
let addedUsers = []; // Список сохраненных ID

// ВХОД
document.getElementById('main-btn').onclick = () => {
    const user = document.getElementById('username').value.trim();
    if (user) {
        socket.emit('login', { user });
        document.getElementById('auth').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
    }
};

socket.on('login-success', (data) => {
    myShortId = data.id;
    document.getElementById('my-id-display').innerText = "Ваш ID: " + myShortId;
});

// МОДАЛКА
document.getElementById('settings-btn').onclick = () => document.getElementById('settings-modal').style.display = 'flex';
document.getElementById('close-settings').onclick = () => document.getElementById('settings-modal').style.display = 'none';

// ДОБАВИТЬ ID (Исправлено)
document.getElementById('confirm-add-btn').onclick = () => {
    const id = document.getElementById('add-user-id').value.trim();
    if (id && id !== myShortId && !addedUsers.includes(id)) {
        addedUsers.push(id);
        socket.emit('refresh-users');
    }
    document.getElementById('settings-modal').style.display = 'none';
    document.getElementById('add-user-id').value = '';
};

// ПОИСК ПО ID (Исправлено)
document.getElementById('search-input').oninput = function() {
    const val = this.value.toLowerCase();
    document.querySelectorAll('#user-list .user-item').forEach(item => {
        const userId = item.getAttribute('data-id');
        item.style.display = userId.includes(val) ? 'flex' : 'none';
    });
};

// ОБНОВЛЕНИЕ КОНТАКТОВ
socket.on('update-users', (users) => {
    const list = document.getElementById('user-list');
    list.innerHTML = '';
    users.forEach(u => {
        if (addedUsers.includes(u.shortId)) {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.setAttribute('data-id', u.shortId);
            div.innerHTML = `<div class="mini-cube"></div> <span>${u.name} (${u.shortId})</span>`;
            div.onclick = () => openChat(u.id, u.name, 'private', div);
            list.appendChild(div);
        }
    });
});

// ОТКРЫТИЕ ЧАТА (Включая BlueWave Group)
function openChat(id, name, type, element) {
    selectedUserId = id;
    currentChatType = type;
    document.getElementById('input-panel').style.display = 'flex';
    document.getElementById('chat-welcome').style.display = 'none';
    document.getElementById('target-user-name').innerText = name;
    document.getElementById('messages').innerHTML = '';
    document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');
}

document.getElementById('global-group').onclick = function() {
    openChat('global', 'BlueWave Group', 'group', this);
};

// ОТПРАВКА
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
    msg.innerHTML = `<div class="bubble" style="padding:10px; margin:5px; border-radius:10px; background:${type==='my-msg'?'#007bff':'#eee'}; color:${type==='my-msg'?'#fff':'#000'}; width:fit-content; max-width:70%; ${type==='my-msg'?'margin-left:auto':''}"><b>${name}:</b><br>${text}</div>`;
    document.getElementById('messages').appendChild(msg);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}