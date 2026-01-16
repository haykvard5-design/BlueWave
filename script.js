const socket = io();
let isLoginMode = true;
let selectedUserId = null;
let currentChatType = 'none';
let addedUsers = []; // Список ID, которых мы добавили

// Элементы настроек
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const confirmAddBtn = document.getElementById('confirm-add-btn');

// ОТКРЫТИЕ/ЗАКРЫТИЕ НАСТРОЕК
settingsBtn.onclick = () => settingsModal.style.display = 'flex';
closeSettings.onclick = () => settingsModal.style.display = 'none';

// ДОБАВЛЕНИЕ ПО ID
confirmAddBtn.onclick = () => {
    const idInput = document.getElementById('add-user-id').value.trim();
    if (idInput.length > 0) {
        if (!addedUsers.includes(idInput)) {
            addedUsers.push(idInput);
            alert("Пользователь добавлен в список!");
            socket.emit('refresh-users'); // Запрос на обновление списка
        }
        document.getElementById('add-user-id').value = '';
        settingsModal.style.display = 'none';
    }
};

// АВТОРИЗАЦИЯ
document.getElementById('main-btn').onclick = () => {
    const user = document.getElementById('username').value.trim();
    if (user) {
        socket.emit('login', { user });
        document.getElementById('auth').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
    }
};

socket.on('login-success', (data) => {
    // Сокращаем socket.id до 6 символов для удобства
    document.getElementById('my-id-display').innerText = "Ваш ID: " + socket.id.substring(0, 6);
});

// ОБНОВЛЕНИЕ СПИСКА (показываем только добавленных людей или всех, если хочешь)
socket.on('update-users', (users) => {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    
    users.forEach(u => {
        const shortId = u.id.substring(0, 6);
        // Показываем пользователя, если его ID в нашем списке "добавленных"
        if (u.id !== socket.id && addedUsers.includes(shortId)) {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.innerHTML = `<div class="mini-cube"></div> <span>${u.name} (ID: ${shortId})</span>`;
            div.onclick = () => {
                currentChatType = 'private';
                selectedUserId = u.id;
                document.getElementById('input-panel').style.display = 'flex';
                document.getElementById('chat-welcome').style.display = 'none';
                document.getElementById('target-user-name').innerText = u.name;
                document.getElementById('messages').innerHTML = '';
                document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
            };
            userList.appendChild(div);
        }
    });
});

// ГРУППОВОЙ ЧАТ
document.getElementById('global-group').onclick = () => {
    currentChatType = 'group';
    selectedUserId = 'global';
    document.getElementById('input-panel').style.display = 'flex';
    document.getElementById('chat-welcome').style.display = 'none';
    document.getElementById('target-user-name').innerText = "BlueWave Group";
    document.getElementById('messages').innerHTML = '';
    document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
    document.getElementById('global-group').classList.add('active');
};

// ОТПРАВКА СООБЩЕНИЙ (как в прошлом коде)
document.getElementById('send-btn').onclick = () => {
    const text = document.getElementById('msg-input').value;
    if (!text) return;
    if (currentChatType === 'group') {
        socket.emit('group-message', { text });
    } else {
        socket.emit('private-message', { to: selectedUserId, text });
        appendMsg("Вы", text, "my-msg");
    }
    document.getElementById('msg-input').value = '';
};

socket.on('receive-private-message', (data) => {
    if (selectedUserId === data.from) appendMsg(data.senderName, data.text, "their-msg");
});

socket.on('receive-group-message', (data) => {
    if (currentChatType === 'group') appendMsg(data.senderName, data.text, data.senderId === socket.id ? "my-msg" : "their-msg");
});

function appendMsg(name, text, type) {
    const msg = document.createElement('div');
    msg.className = "message-row " + type;
    msg.innerHTML = `<div class="bubble"><b>${name}:</b><br>${text}</div>`;
    document.getElementById('messages').appendChild(msg);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}