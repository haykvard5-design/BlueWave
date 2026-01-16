const socket = io();
let isLoginMode = true;
let selectedUserId = null;
let currentChatType = 'none';

// Элементы UI
const mainBtn = document.getElementById('main-btn');
const toggleLink = document.getElementById('toggle-link');
const inputPanel = document.getElementById('input-panel');
const callBtn = document.getElementById('callBtn');
const welcomeText = document.getElementById('chat-welcome');
const messagesContainer = document.getElementById('messages');

// 1. АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ (Твой старый дизайн)
toggleLink.onclick = () => {
    isLoginMode = !isLoginMode;
    mainBtn.innerText = isLoginMode ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ";
    document.getElementById('form-subtitle').innerText = isLoginMode ? "Добро пожаловать в мессенджер" : "Создайте новый профиль";
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
        alert("Заполните все поля!");
    }
};

// 2. ФУНКЦИЯ АКТИВАЦИИ ЧАТА (Скрывает приветствие, показывает ввод)
function activateChatUI(name, isGroup) {
    currentChatType = isGroup ? 'group' : 'private';
    
    // Показываем панель ввода
    inputPanel.style.display = 'flex';
    if (welcomeText) welcomeText.style.display = 'none';
    
    // Обновляем шапку
    document.getElementById('target-user-name').innerText = name;
    messagesContainer.innerHTML = ''; // Очистка экрана для нового чата
    
    // Кнопка звонка только для людей
    callBtn.style.display = isGroup ? 'none' : 'block';
}

// 3. КЛИК ПО ГРУППЕ BLUEWAVE
document.getElementById('global-group').onclick = () => {
    selectedUserId = 'global';
    activateChatUI("BlueWave Group", true);
    
    document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
    document.getElementById('global-group').classList.add('active');
};

// 4. ОБНОВЛЕНИЕ СПИСКА ЛЮДЕЙ (Личные сообщения)
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
                activateChatUI(u.name, false);
                document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
                div.classList.add('active');
            };
            userList.appendChild(div);
        }
    });
});

// 5. ОТПРАВКА СООБЩЕНИЙ
document.getElementById('send-btn').onclick = sendMessage;
document.getElementById('msg-input').onkeypress = (e) => { if(e.key === 'Enter') sendMessage(); };

function sendMessage() {
    const text = document.getElementById('msg-input').value.trim();
    if (!text || currentChatType === 'none') return;

    if (currentChatType === 'group') {
        socket.emit('group-message', { text: text });
    } else {
        socket.emit('private-message', { to: selectedUserId, text: text });
        appendMessage('Вы', text, 'my-msg');
    }
    document.getElementById('msg-input').value = '';
}

// 6. ПОЛУЧЕНИЕ СООБЩЕНИЙ
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
        // Уведомление, если пришло сообщение из другого чата
        alert(`Новое сообщение от ${data.senderName}`);
    }
});

// 7. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function appendMessage(name, text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message-row ${type}`;
    msgDiv.innerHTML = `
        <div class="bubble">
            <small>${name}</small>
            <p>${text}</p>
        </div>
    `;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 8. ВИДЕОЗВОНКИ
callBtn.onclick = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('video-container').style.display = 'flex';
        document.getElementById('local-video').srcObject = stream;
    } catch (e) { alert("Ошибка доступа к камере"); }
};

document.getElementById('hangup-btn').onclick = () => {
    const stream = document.getElementById('local-video').srcObject;
    if(stream) stream.getTracks().forEach(t => t.stop());
    document.getElementById('video-container').style.display = 'none';
};