const socket = io();
let myId = '';
let addedUsers = [];

// ВХОД
document.getElementById('main-btn').onclick = () => {
    const user = document.getElementById('username').value.trim();
    if (user) {
        socket.emit('login', { user });
        document.getElementById('auth').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
    }
};

socket.on('login-success', d => {
    myId = d.id;
    document.getElementById('my-id-display').innerText = "Ваш ID: " + myId;
});

// МОДАЛКА
document.getElementById('settings-btn').onclick = () => document.getElementById('settings-modal').style.display = 'flex';
document.getElementById('close-settings').onclick = () => document.getElementById('settings-modal').style.display = 'none';

// ДОБАВЛЕНИЕ
document.getElementById('confirm-add-btn').onclick = () => {
    const val = document.getElementById('add-user-id').value.trim();
    if (val && val !== myId && !addedUsers.includes(val)) {
        addedUsers.push(val);
        socket.emit('refresh-users');
    }
    document.getElementById('settings-modal').style.display = 'none';
};

// ПОИСК
document.getElementById('search-input').oninput = function() {
    const val = this.value.toLowerCase();
    document.querySelectorAll('#user-list .user-item').forEach(el => {
        el.style.display = el.getAttribute('data-id').includes(val) ? 'flex' : 'none';
    });
};

// ГРУППА
document.getElementById('global-group').onclick = function() {
    openChat('global', 'BlueWave Group', 'group', this);
};

socket.on('update-users', users => {
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

let chatInfo = {};
function openChat(id, name, type, el) {
    chatInfo = { id, type };
    document.getElementById('input-panel').style.display = 'flex';
    document.getElementById('chat-welcome').style.display = 'none';
    document.getElementById('target-user-name').innerText = name;
    document.getElementById('messages').innerHTML = '';
    document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
    if(el) el.classList.add('active');
}

document.getElementById('send-btn').onclick = () => {
    const txt = document.getElementById('msg-input').value;
    if (!txt) return;
    if (chatInfo.type === 'group') socket.emit('group-message', { text: txt });
    else {
        socket.emit('private-message', { to: chatInfo.id, text: txt });
        renderMsg("Вы", txt, 'my');
    }
    document.getElementById('msg-input').value = '';
};

socket.on('receive-private-message', d => renderMsg(d.senderName, d.text, 'their'));
socket.on('receive-group-message', d => renderMsg(d.senderName, d.text, d.senderId === socket.id ? 'my' : 'their'));

function renderMsg(n, t, s) {
    const div = document.createElement('div');
    div.style.textAlign = s === 'my' ? 'right' : 'left';
    div.innerHTML = `<div style="display:inline-block; padding:10px; margin:5px; border-radius:15px; background:${s==='my'?'#007bff':'#eee'}; color:${s==='my'?'#fff':'#000'}"><b>${n}</b><br>${t}</div>`;
    document.getElementById('messages').appendChild(div);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}