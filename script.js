const socket = io();
let isLoginMode = true;
let selectedUserId = null;
let currentChatType = 'none';

// Элементы
const mainBtn = document.getElementById('main-btn');
const toggleLink = document.getElementById('toggle-link');
const inputPanel = document.getElementById('input-panel');
const welcomeText = document.getElementById('chat-welcome');

// 1. АВТОРИЗАЦИЯ
toggleLink.onclick = () => {
    isLoginMode = !isLoginMode;
    mainBtn.innerText = isLoginMode ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ";
    document.getElementById('toggle-text').innerText = isLoginMode ? "Нет аккаунта?" : "Уже есть аккаунт?";
    toggleLink.innerText = isLoginMode ? "Зарегистрироваться" : "Войти";
};

mainBtn.onclick = () => {
    const user = document.getElementById('username').value.trim();
    if (user) {
        socket.emit(isLoginMode ? 'login' : 'register', { user });
        document.getElementById('auth').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
        document.getElementById('my-id-display').innerText = "Ваш ID: " + socket.id.substring(0, 6);
    }
};

// 2. ФУНКЦИЯ ВКЛЮЧЕНИЯ ЧАТА
function openChat(name, type, id) {
    currentChatType = type;
    selectedUserId = id;
    inputPanel.style.display = 'flex';
    welcomeText.style.display = 'none';
    document.getElementById('target-user-name').innerText = name;
    document.getElementById('messages').innerHTML = '';
    document.getElementById('callBtn').style.display = (type === 'private') ? 'block' : 'none';
}

// 3. КЛИК ПО ГРУППЕ
document.getElementById('global-group').onclick = () => {
    openChat("BlueWave Group", "group", "global");
    document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
    document.getElementById('global-group').classList.add('active');
};

// 4. ОБНОВЛЕНИЕ СПИСКА И ПОИСК ПО ID
socket.on('update-users', (users) => {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    users.forEach(u => {
        if (u.id !== socket.id) {
            const shortId = u.id.substring(0, 6);
            const div = document.createElement('div');
            div.className = 'user-item';
            div.setAttribute('data-id', shortId);
            div.innerHTML = `<div class="mini-cube"></div> <span>${u.name} (ID: ${shortId})</span>`;
            div.onclick = () => {
                openChat(u.name, "private", u.id);
                document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
            };
            userList.appendChild(div);
        }
    });
});

document.getElementById('search-input').oninput = function() {
    const val = this.value.toLowerCase();
    document.querySelectorAll('#user-list .user-item').forEach(item => {
        const id = item.getAttribute('data-id').toLowerCase();
        item.style.display = id.includes(val) ? 'flex' : 'none';
    });
};

// 5. СООБЩЕНИЯ
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