const socket = io();
let myShortId = '';
let selectedUserId = null;
let currentChatType = 'none';
let addedUsers = []; // Список ID, которые ты добавил вручную

// --- АВТОРИЗАЦИЯ (Твой дизайн) ---
document.getElementById('main-btn').onclick = () => {
    const user = document.getElementById('username').value.trim();
    if (user) {
        socket.emit('login', { user });
        document.getElementById('auth').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
    }
};

// Получаем твой ID от сервера при входе
socket.on('login-success', (data) => {
    myShortId = data.id;
    document.getElementById('my-id-display').innerText = "Ваш ID: " + myShortId;
});

// --- ЛОГИКА НАСТРОЕК (Шестеренка) ---
const settingsBtn = document.getElementById('settings-btn');
const modal = document.getElementById('settings-modal');
const closeBtn = document.getElementById('close-settings');
const addBtn = document.getElementById('confirm-add-btn');

settingsBtn.onclick = () => modal.style.display = 'flex';
closeBtn.onclick = () => modal.style.display = 'none';

// Добавление пользователя по ID
addBtn.onclick = () => {
    const targetId = document.getElementById('add-user-id').value.trim();
    // Нельзя добавить самого себя и пустой ID
    if (targetId && targetId !== myShortId && !addedUsers.includes(targetId)) {
        addedUsers.push(targetId);
        socket.emit('refresh-users'); // Запрос к серверу обновить список имен
        alert("Пользователь " + targetId + " добавлен!");
    }
    modal.style.display = 'none';
    document.getElementById('add-user-id').value = '';
};

// --- ПОИСК ПО ID ---
document.getElementById('search-input').oninput = function() {
    const searchValue = this.value.toLowerCase();
    const items = document.querySelectorAll('#user-list .user-item');
    
    items.forEach(item => {
        const userId = item.getAttribute('data-id').toLowerCase();
        if (userId.includes(searchValue)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
};

// --- ОБНОВЛЕНИЕ СПИСКА КОНТАКТОВ ---
socket.on('update-users', (users) => {
    const userList = document.getElementById('user-list');
    userList.innerHTML = ''; // Очищаем старый список

    users.forEach(u => {
        // Показываем человека только если его ID в твоем списке "Добавленных"
        if (addedUsers.includes(u.shortId)) {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.setAttribute('data-id', u.shortId); // Для поиска
            div.innerHTML = `
                <div class="mini-cube"></div> 
                <span>${u.name} (ID: ${u.shortId})</span>
            `;
            div.onclick = () => openChat(u.id, u.name, 'private', div);
            userList.appendChild(div);
        }
    });
});

// --- ОТКРЫТИЕ ЧАТА ---
function openChat(id, name, type, element) {
    selectedUserId = id;
    currentChatType = type;
    
    // Показываем панель ввода
    document.getElementById('input-panel').style.display = 'flex';
    document.getElementById('chat-welcome').style.display = 'none';
    document.getElementById('target-user-name').innerText = name;
    
    // Очищаем окно сообщений (или можно загружать историю)
    document.getElementById('messages').innerHTML = '';
    
    // Подсветка активного чата
    document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
}

// Клик по BlueWave Group (Глобальный чат)
document.getElementById('global-group').onclick = function() {
    openChat('global', 'BlueWave Group', 'group', this);
};

// --- ОТПРАВКА СООБЩЕНИЙ ---
document.getElementById('send-btn').onclick = () => {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    
    if (!text) return;

    if (currentChatType === 'group') {
        socket.emit('group-message', { text });
    } else if (currentChatType === 'private') {
        socket.emit('private-message', { to: selectedUserId, text });
        appendMsg("Вы", text, "my-msg");
    }
    
    input.value = '';
};

// --- ПОЛУЧЕНИЕ СООБЩЕНИЙ ---
socket.on('receive-private-message', (data) => {
    if (selectedUserId === data.from) {
        appendMsg(data.senderName, data.text, "their-msg");
    }
});

socket.on('receive-group-message', (data) => {
    if (currentChatType === 'group') {
        const type = (data.senderId === socket.id) ? "my-msg" : "their-msg";
        appendMsg(data.senderName, data.text, type);
    }
});

// Функция отрисовки сообщения (Пузырьки)
function appendMsg(name, text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = "message-row " + type;
    
    // Твой стиль пузырьков
    msgDiv.innerHTML = `
        <div class="bubble">
            <b>${name}</b><br>
            ${text}
        </div>
    `;
    
    const container = document.getElementById('messages');
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}