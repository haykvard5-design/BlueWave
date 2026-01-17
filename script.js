const socket = io();

// ПЕРЕМЕННЫЕ
let myShortId = '';
let myName = '';
let addedContacts = [];
let isRegisterMode = false;
let currentChat = null;
let currentLanguage = 'ru';
let localStream = null;
let screenStream = null;
let peerConnection = null;
let incomingCall = null;
let allUsers = [];
let isScreenSharing = false;
let friendRequests = [];

// ПЕРЕВОДЫ
const translations = {
    ru: {
        welcomeText: 'Добро пожаловать в будущее общения',
        selectChat: 'Выберите чат',
        selectChatHint: 'Выберите контакт для начала общения',
        online: 'Online',
        offline: 'Offline',
        addContact: 'Отправить запрос в друзья',
        addContactId: 'ID контакта (например: ARN923)',
        addContactBtn: 'Отправить',
        incoming: 'Входящий звонок от',
        callEnded: 'Звонок завершен',
        settings: 'Настройки',
        language: 'Язык',
        info: 'Информация',
        changeId: 'Изменить ID',
        newId: 'Новый ID',
        confirmChangeId: 'Изменить',
        idChanged: 'ID успешно изменен!',
        login: 'ВОЙТИ',
        register: 'ЗАРЕГИСТРИРОВАТЬСЯ',
        haveAccount: 'Уже есть аккаунт? Войти',
        noAccount: 'Нет аккаунта? Зарегистрироваться',
        loginWelcome: 'Добро пожаловать в будущее общения',
        registerWelcome: 'Создайте новый аккаунт',
        aboutText: 'BlueWave v1.0 - Современный мессенджер с видеозвонками и отправкой картинок',
        messageInputPlaceholder: 'Напишите сообщение...',
        searchPlaceholder: '🔍 Поиск по ID...',
        contacts: 'Контакты',
        groups: 'Группы',
        friendRequests: 'Запросы в друзья',
        blueWaveGroup: 'BlueWave Group',
        selectChatMessage: 'Выберите контакт для начала общения',
        noNewIdProvided: 'Введите новый ID',
        sameIdAsCurrently: 'Это ваш текущий ID',
        contactAdded: 'Контакт добавлен!',
        enterContactId: 'Введите ID',
        alreadyAdded: 'Контакт уже добавлен',
        thisIsYourId: 'Это ваш ID',
        selectContactForCall: 'Выберите контакт',
        callError: 'Ошибка при инициировании звонка: ',
        fillAllFields: 'Заполните все поля',
        callEnded: 'Звонок завершен',
        callDeclined: 'Звонок отклонен',
        friendRequestSent: 'Запрос в друзья отправлен!',
        friendRequestReceived: 'Новый запрос в друзья!',
        friendAdded: 'Контакт добавлен!'
    },
    en: {
        welcomeText: 'Welcome to the future of communication',
        selectChat: 'Select chat',
        selectChatHint: 'Select a contact to start chatting',
        online: 'Online',
        offline: 'Offline',
        addContact: 'Send friend request',
        addContactId: 'Contact ID (e.g., ARN923)',
        addContactBtn: 'Send',
        incoming: 'Incoming call from',
        callEnded: 'Call ended',
        settings: 'Settings',
        language: 'Language',
        info: 'Information',
        changeId: 'Change ID',
        newId: 'New ID',
        confirmChangeId: 'Change',
        idChanged: 'ID successfully changed!',
        login: 'LOGIN',
        register: 'REGISTER',
        haveAccount: 'Have account? Login',
        noAccount: 'No account? Register',
        loginWelcome: 'Welcome to the future of communication',
        registerWelcome: 'Create a new account',
        aboutText: 'BlueWave v1.0 - Modern messenger with video calls and photo sharing',
        messageInputPlaceholder: 'Write a message...',
        searchPlaceholder: '🔍 Search by ID...',
        contacts: 'Contacts',
        groups: 'Groups',
        friendRequests: 'Friend Requests',
        blueWaveGroup: 'BlueWave Group',
        selectChatMessage: 'Select a contact to start chatting',
        noNewIdProvided: 'Enter a new ID',
        sameIdAsCurrently: 'This is your current ID',
        contactAdded: 'Contact added!',
        enterContactId: 'Enter ID',
        alreadyAdded: 'Contact already added',
        thisIsYourId: 'This is your ID',
        selectContactForCall: 'Select a contact',
        callError: 'Error initiating call: ',
        fillAllFields: 'Fill in all fields',
        callEnded: 'Call ended',
        callDeclined: 'Call declined',
        friendRequestSent: 'Friend request sent!',
        friendRequestReceived: 'New friend request!',
        friendAdded: 'Contact added!'
    }
};

function t(key) {
    return translations[currentLanguage][key] || key;
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
window.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeLanguage();
    initializeChat();
});

function initializeAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const toggleBtn = document.getElementById('toggleAuthBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (loginBtn) {
        loginBtn.onclick = handleAuthSubmit;
    }

    if (toggleBtn) {
        toggleBtn.onclick = toggleAuthMode;
    }

    if (usernameInput) {
        usernameInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleAuthSubmit();
        };
    }

    if (passwordInput) {
        passwordInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleAuthSubmit();
        };
    }

    updateAuthScreen();
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    updateAuthScreen();
}

function updateAuthScreen() {
    const loginBtn = document.getElementById('loginBtn');
    const toggleBtn = document.getElementById('toggleAuthBtn');
    const welcomeText = document.getElementById('welcomeText');

    if (isRegisterMode) {
        loginBtn.textContent = t('register');
        toggleBtn.textContent = t('haveAccount');
        welcomeText.textContent = t('registerWelcome');
    } else {
        loginBtn.textContent = t('login');
        toggleBtn.textContent = t('noAccount');
        welcomeText.textContent = t('loginWelcome');
    }
}

function handleAuthSubmit() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    
    if (!user || !pass) {
        alert(t('fillAllFields'));
        return;
    }

    const action = isRegisterMode ? 'register' : 'login';
    console.log(`Отправка ${action}:`, { user });
    socket.emit(action, { user, pass });
}

function initializeLanguage() {
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            langBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentLanguage = this.dataset.lang;
            updateAllLanguageText();
        });
    });
}

// ОБНОВЛЕНИЕ ВСЕГО ТЕКСТА ИНТЕРФЕЙСА ПРИ СМЕНЕ ЯЗЫКА
function updateAllLanguageText() {
    const welcomeText = document.getElementById('welcomeText');
    if (welcomeText) {
        if (isRegisterMode) {
            welcomeText.textContent = t('registerWelcome');
        } else {
            welcomeText.textContent = t('loginWelcome');
        }
    }

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.textContent = isRegisterMode ? t('register') : t('login');
    }

    const toggleBtn = document.getElementById('toggleAuthBtn');
    if (toggleBtn) {
        toggleBtn.textContent = isRegisterMode ? t('haveAccount') : t('noAccount');
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = t('searchPlaceholder');
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.placeholder = t('messageInputPlaceholder');
    }

    const contactsTitle = document.querySelector('.contacts-section .section-title');
    if (contactsTitle) {
        contactsTitle.textContent = t('contacts');
    }

    const groupsTitle = document.querySelector('.groups-section .section-title');
    if (groupsTitle) {
        groupsTitle.textContent = t('groups');
    }

    const friendRequestsTitle = document.querySelector('.friend-requests-section .section-title');
    if (friendRequestsTitle) {
        friendRequestsTitle.textContent = t('friendRequests');
    }

    const globalGroupBtn = document.getElementById('globalGroupBtn');
    if (globalGroupBtn) {
        const span = globalGroupBtn.querySelector('span');
        if (span) {
            span.textContent = t('blueWaveGroup');
        }
    }

    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle && chatTitle.textContent === 'Выберите чат') {
        chatTitle.textContent = t('selectChat');
    }

    const emptyState = document.querySelector('.empty-state p');
    if (emptyState) {
        emptyState.textContent = t('selectChatMessage');
    }

    const addContactBtn = document.getElementById('addContactBtn');
    if (addContactBtn) {
        addContactBtn.textContent = t('addContactBtn');
    }

    const changeIdBtn = document.getElementById('changeIdBtn');
    if (changeIdBtn) {
        changeIdBtn.textContent = t('confirmChangeId');
    }

    const addContactId = document.getElementById('addContactId');
    if (addContactId) {
        addContactId.placeholder = t('addContactId');
    }

    const newIdInput = document.getElementById('newIdInput');
    if (newIdInput) {
        newIdInput.placeholder = t('newId');
    }

    const settingsModalHeader = document.querySelector('#settingsModal .modal-header h2');
    if (settingsModalHeader) {
        settingsModalHeader.textContent = t('settings');
    }

    const infoSection = document.querySelector('.settings-section:last-child');
    if (infoSection) {
        const paragraphs = infoSection.querySelectorAll('p');
        if (paragraphs.length > 0) {
            paragraphs[1].textContent = t('aboutText');
        }
    }
}

function initializeChat() {
    // НАСТРОЙКИ
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');

    if (settingsBtn) {
        settingsBtn.onclick = () => {
            document.getElementById('settingsModal').classList.add('active');
        };
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.onclick = () => {
            document.getElementById('settingsModal').classList.remove('active');
        };
    }

    // Закрытие модалки при клике на фон
    window.onclick = (e) => {
        const settingsModal = document.getElementById('settingsModal');
        const incomingCallModal = document.getElementById('incomingCallModal');
        
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
        if (e.target === incomingCallModal) {
            incomingCallModal.classList.remove('active');
        }
    };

    // ИЗМЕНЕНИЕ ID
    const changeIdBtn = document.getElementById('changeIdBtn');
    if (changeIdBtn) {
        changeIdBtn.onclick = () => {
            const newId = document.getElementById('newIdInput').value.trim().toUpperCase();
            
            if (!newId) {
                alert(t('noNewIdProvided'));
                return;
            }
            
            if (newId === myShortId) {
                alert(t('sameIdAsCurrently'));
                return;
            }
            
            myShortId = newId;
            document.getElementById('userIdDisplay').textContent = `ID: ${myShortId}`;
            document.getElementById('newIdInput').value = '';
            alert(t('idChanged'));
            socket.emit('refresh-users');
        };
    }

    // ДОБАВЛЕНИЕ КОНТАКТА (Отправить запрос в друзья)
    const addContactBtn = document.getElementById('addContactBtn');
    if (addContactBtn) {
        addContactBtn.onclick = () => {
            const id = document.getElementById('addContactId').value.trim().toUpperCase();
            
            if (!id) {
                alert(t('enterContactId'));
                return;
            }
            
            if (id === myShortId) {
                alert(t('thisIsYourId'));
                return;
            }
            
            if (addedContacts.includes(id)) {
                alert(t('alreadyAdded'));
                return;
            }
            
            // Отправляем запрос в друзья
            socket.emit('send-friend-request', { 
                toId: id, 
                fromId: myShortId,
                fromName: myName 
            });
            
            document.getElementById('addContactId').value = '';
            alert(t('friendRequestSent'));
        };
    }

    // ПОИСК ПО ID
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim().toUpperCase();
            const contactsList = document.getElementById('contactsList');

            if (searchTerm === '') {
                socket.emit('refresh-users');
            } else {
                contactsList.innerHTML = '';
                
                allUsers.forEach(user => {
                    if (user.shortId.includes(searchTerm) && user.shortId !== myShortId) {
                        const div = document.createElement('div');
                        div.className = 'contact-item';
                        div.innerHTML = `
                            <div class="contact-avatar">👤</div>
                            <div class="contact-info">
                                <div class="contact-name">${user.name}</div>
                                <div class="contact-status">${user.shortId}</div>
                            </div>
                        `;
                        div.onclick = () => {
                            if (!addedContacts.includes(user.shortId)) {
                                socket.emit('send-friend-request', { 
                                    toId: user.shortId, 
                                    fromId: myShortId,
                                    fromName: myName 
                                });
                                alert(t('friendRequestSent'));
                            }
                            searchInput.value = '';
                            socket.emit('refresh-users');
                            document.querySelectorAll('.contact-item, .group-item').forEach(el => {
                                el.classList.remove('active');
                            });
                            openChat(user.socketId, user.name, 'private', user.shortId);
                        };
                        contactsList.appendChild(div);
                    }
                });
            }
        });
    }

    // ОТПРАВКА СООБЩЕНИЯ
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');

    if (sendBtn) {
        sendBtn.onclick = sendMessage;
    }

    if (messageInput) {
        messageInput.onkeypress = (e) => {
            if (e.key === 'Enter') sendMessage();
        };
    }

    // ОТПРАВКА КАРТИНКИ
    const imageBtn = document.getElementById('imageBtn');
    const imageInput = document.getElementById('imageInput');
    
    if (imageBtn) {
        imageBtn.onclick = () => {
            imageInput.click();
        };
    }

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && currentChat) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target.result;
                    const event_type = currentChat.type === 'group' ? 'group-image' : 'private-image';
                    socket.emit(event_type, { 
                        to: currentChat.id, 
                        image: imageData,
                        fileName: file.name 
                    });
                    renderImage(imageData, 'own');
                };
                reader.readAsDataURL(file);
            }
            imageInput.value = '';
        });
    }

    // ГЛОБАЛЬНАЯ ГРУППА
    const globalGroupBtn = document.getElementById('globalGroupBtn');
    if (globalGroupBtn) {
        globalGroupBtn.onclick = () => {
            document.querySelectorAll('.group-item, .contact-item').forEach(el => {
                el.classList.remove('active');
            });
            globalGroupBtn.classList.add('active');
            openChat('global', t('blueWaveGroup'), 'group');
        };
    }

    // ЗВОНКИ
    const callBtn = document.getElementById('callBtn');
    const videoCallBtn = document.getElementById('videoCallBtn');

    if (callBtn) {
        callBtn.onclick = () => initiateCall(false);
    }

    if (videoCallBtn) {
        videoCallBtn.onclick = () => initiateCall(true);
    }

    // УПРАВЛЕНИЕ МИКРОФОНОМ
    const toggleMicBtn = document.getElementById('toggleMicBtn');
    if (toggleMicBtn) {
        toggleMicBtn.onclick = () => {
            const audioTracks = localStream?.getAudioTracks() || [];
            
            if (audioTracks.length > 0) {
                audioTracks[0].enabled = !audioTracks[0].enabled;
                toggleMicBtn.classList.toggle('off');
                toggleMicBtn.style.opacity = audioTracks[0].enabled ? '1' : '0.5';
            }
        };
    }

    // УПРАВЛЕНИЕ КАМЕРОЙ
    const toggleCameraBtn = document.getElementById('toggleCameraBtn');
    if (toggleCameraBtn) {
        toggleCameraBtn.onclick = () => {
            const videoTracks = localStream?.getVideoTracks() || [];
            
            if (videoTracks.length > 0) {
                videoTracks[0].enabled = !videoTracks[0].enabled;
                toggleCameraBtn.classList.toggle('off');
                toggleCameraBtn.style.opacity = videoTracks[0].enabled ? '1' : '0.5';
            }
        };
    }

    // ПОКАЗ ЭКРАНА
    const toggleScreenBtn = document.getElementById('toggleScreenBtn');
    if (toggleScreenBtn) {
        toggleScreenBtn.onclick = toggleScreenShare;
    }

    // ЗАВЕРШЕНИЕ ЗВОНКА
    const endCallBtn = document.getElementById('endCallBtn');
    if (endCallBtn) {
        endCallBtn.onclick = () => {
            endCall();
        };
    }

    // ОТВЕТИТЬ НА ЗВОНОК
    const acceptBtn = document.getElementById('acceptBtn');
    if (acceptBtn) {
        acceptBtn.onclick = async () => {
            document.getElementById('incomingCallModal').classList.remove('active');
            document.getElementById('callModal').classList.add('active');
            
            try {
                const constraints = { audio: true, video: incomingCall.isVideo };
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
                document.getElementById('localVideo').srcObject = localStream;
                
                peerConnection = new RTCPeerConnection({ iceServers: STUN_SERVERS });
                
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });

                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('ice-candidate', {
                            to: incomingCall.from,
                            candidate: event.candidate
                        });
                    }
                };

                peerConnection.ontrack = (event) => {
                    document.getElementById('remoteVideo').srcObject = event.streams[0];
                };

                await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                socket.emit('answer-call', {
                    to: incomingCall.from,
                    answer: answer
                });

            } catch (err) {
                console.error('Ошибка при ответе:', err);
                endCall();
            }
        };
    }

    // ОТКЛОНИТЬ ЗВОНОК
    const declineBtn = document.getElementById('declineBtn');
    if (declineBtn) {
        declineBtn.onclick = () => {
            document.getElementById('incomingCallModal').classList.remove('active');
            socket.emit('decline-call', { to: incomingCall.from });
        };
    }
}

// ========== ОБРАБОТКА SOCKET СОБЫТИЙ ==========

socket.on('connect', () => {
    console.log('Подключено к серверу');
});

socket.on('disconnect', () => {
    console.log('Отключено от сервера');
});

socket.on('auth-success', (data) => {
    console.log('Вход успешен:', data);
    myShortId = data.shortId;
    myName = data.userName || 'User';
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('chat-container').style.display = 'flex';
    document.getElementById('userIdDisplay').textContent = `ID: ${myShortId}`;
    document.getElementById('userNameDisplay').textContent = myName;
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

socket.on('auth-error', (msg) => {
    console.log('Ошибка входа:', msg);
    alert('Ошибка: ' + msg);
});

socket.on('auth-success-register', (msg) => {
    console.log('Регистрация успешна');
    alert(msg);
    isRegisterMode = false;
    updateAuthScreen();
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

// ОБНОВЛЕНИЕ СПИСКА КОНТАКТОВ
socket.on('update-users', (users) => {
    allUsers = users;
    const contactsList = document.getElementById('contactsList');
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput || searchInput.value.trim() === '') {
        // Удаляем старые контакты, но сохраняем запросы
        const friendRequestsSection = contactsList.querySelector('.friend-requests-section');
        contactsList.innerHTML = '';
        
        if (friendRequestsSection) {
            contactsList.appendChild(friendRequestsSection);
        }
        
        users.forEach(user => {
            if (addedContacts.includes(user.shortId) && user.shortId !== myShortId) {
                const div = document.createElement('div');
                div.className = 'contact-item';
                div.innerHTML = `
                    <div class="contact-avatar">👤</div>
                    <div class="contact-info">
                        <div class="contact-name">${user.name}</div>
                        <div class="contact-status">${user.shortId}</div>
                    </div>
                `;
                div.onclick = () => {
                    document.querySelectorAll('.contact-item, .group-item').forEach(el => {
                        el.classList.remove('active');
                    });
                    div.classList.add('active');
                    openChat(user.socketId, user.name, 'private', user.shortId);
                };
                contactsList.appendChild(div);
            }
        });
    }
});

// ОТКРЫТИЕ ЧАТА
function openChat(id, name, type, shortId) {
    currentChat = { id, type, shortId };
    
    document.getElementById('chatTitle').textContent = name;
    document.getElementById('chatStatus').textContent = t('online');
    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('messageInput').focus();
}

// ОТПРАВКА СООБЩЕНИЯ
function sendMessage() {
    const text = document.getElementById('messageInput').value.trim();
    if (!text || !currentChat) return;

    const event = currentChat.type === 'group' ? 'group-msg' : 'private-msg';
    socket.emit(event, { to: currentChat.id, text });
    
    renderMessage('Вы', text, 'own');
    document.getElementById('messageInput').value = '';
}

// ПОЛУЧЕНИЕ СООБЩЕНИЯ
socket.on('receive-msg', (data) => {
    if (currentChat && ((currentChat.type === 'private' && currentChat.id === data.from) || 
                       (currentChat.type === 'group' && data.type === 'group'))) {
        renderMessage(data.name, data.text, 'other');
    }
});

socket.on('receive-image', (data) => {
    if (currentChat && ((currentChat.type === 'private' && currentChat.id === data.from) || 
                       (currentChat.type === 'group' && data.type === 'group'))) {
        renderImage(data.image, 'other', data.name);
    }
});

function renderMessage(name, text, side) {
    const container = document.getElementById('messagesContainer');
    
    if (container.querySelector('.empty-state')) {
        container.innerHTML = '';
    }

    const div = document.createElement('div');
    div.className = `message ${side === 'own' ? 'own' : 'other'}`;
    
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
        <div class="message-bubble">
            ${side === 'other' ? `<strong>${name}</strong><br>` : ''}
            ${text}
            <span class="message-time">${time}</span>
        </div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function renderImage(imageData, side, name = 'User') {
    const container = document.getElementById('messagesContainer');
    
    if (container.querySelector('.empty-state')) {
        container.innerHTML = '';
    }

    const div = document.createElement('div');
    div.className = `message ${side === 'own' ? 'own' : 'other'}`;
    
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
        <div class="message-bubble">
            ${side === 'other' ? `<strong>${name}</strong><br>` : ''}
            <img src="${imageData}" style="max-width: 100%; border-radius: 8px; margin-top: 4px;">
            <span class="message-time">${time}</span>
        </div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// ========== ЗАПРОСЫ В ДРУЗЬЯ ==========
socket.on('receive-friend-request', (data) => {
    friendRequests.push({
        fromId: data.fromId,
        fromName: data.fromName
    });

    const contactsList = document.getElementById('contactsList');
    
    let friendRequestsSection = contactsList.querySelector('.friend-requests-section');
    if (!friendRequestsSection) {
        friendRequestsSection = document.createElement('div');
        friendRequestsSection.className = 'friend-requests-section';
        friendRequestsSection.innerHTML = `<div class="section-title">${t('friendRequests')}</div>`;
        contactsList.insertBefore(friendRequestsSection, contactsList.firstChild);
    }

    const div = document.createElement('div');
    div.className = 'friend-request-item';
    div.innerHTML = `
        <div class="contact-avatar">👤</div>
        <div class="contact-info">
            <div class="contact-name">${data.fromName}</div>
            <div class="contact-status">${data.fromId}</div>
        </div>
        <div class="friend-request-actions">
            <button class="btn-accept-friend">✓</button>
            <button class="btn-decline-friend">✕</button>
        </div>
    `;

    const acceptBtn = div.querySelector('.btn-accept-friend');
    const declineBtn = div.querySelector('.btn-decline-friend');

    acceptBtn.onclick = (e) => {
        e.stopPropagation();
        addedContacts.push(data.fromId);
        socket.emit('accept-friend-request', { toId: data.fromId });
        div.remove();
        alert(t('friendAdded'));
        socket.emit('refresh-users');
    };

    declineBtn.onclick = (e) => {
        e.stopPropagation();
        socket.emit('decline-friend-request', { toId: data.fromId });
        div.remove();
        friendRequests = friendRequests.filter(r => r.fromId !== data.fromId);
    };

    friendRequestsSection.appendChild(div);
});

socket.on('friend-request-accepted', (data) => {
    if (!addedContacts.includes(data.fromId)) {
        addedContacts.push(data.fromId);
    }
    socket.emit('refresh-users');
});

// ========== ЗВОНКИ ==========
const STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

async function initiateCall(isVideo) {
    if (!currentChat) {
        alert(t('selectContactForCall'));
        return;
    }

    try {
        const constraints = {
            audio: true,
            video: isVideo ? { width: 640, height: 480 } : false
        };

        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('localVideo').srcObject = localStream;
        
        peerConnection = new RTCPeerConnection({ iceServers: STUN_SERVERS });
        
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    to: currentChat.id,
                    candidate: event.candidate
                });
            }
        };

        peerConnection.ontrack = (event) => {
            document.getElementById('remoteVideo').srcObject = event.streams[0];
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        const callType = currentChat.type === 'group' ? (isVideo ? 'group-video-call' : 'group-audio-call') : (isVideo ? 'video-call' : 'audio-call');
        socket.emit(callType, {
            to: currentChat.id,
            offer: offer
        });

        document.getElementById('callModal').classList.add('active');
        document.getElementById('callTitle').textContent = `Звонок ${currentChat.shortId || 'группе'}...`;
        document.getElementById('answerCallBtn').style.display = 'none';

    } catch (err) {
        console.error('Ошибка звонка:', err);
        alert(t('callError') + err.message);
    }
}

async function toggleScreenShare() {
    if (!peerConnection) {
        alert('Нет активного звонка');
        return;
    }

    try {
        if (isScreenSharing) {
            screenStream.getTracks().forEach(track => track.stop());
            
            const videoTrack = localStream.getVideoTracks()[0];
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
                await sender.replaceTrack(videoTrack);
            }
            
            isScreenSharing = false;
            document.getElementById('toggleScreenBtn').style.opacity = '1';
        } else {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                video: { cursor: 'always' },
                audio: false 
            });
            
            const screenTrack = screenStream.getVideoTracks()[0];
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
                await sender.replaceTrack(screenTrack);
            }
            
            isScreenSharing = true;
            document.getElementById('toggleScreenBtn').style.opacity = '0.5';
            
            screenTrack.onended = async () => {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    await sender.replaceTrack(videoTrack);
                    isScreenSharing = false;
                    document.getElementById('toggleScreenBtn').style.opacity = '1';
                }
            };
        }
    } catch (err) {
        console.error('Ошибка показа экрана:', err);
        alert('Ошибка при показе экрана: ' + err.message);
    }
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
    }
    document.getElementById('callModal').classList.remove('active');
    document.getElementById('remoteVideo').srcObject = null;
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('toggleScreenBtn').style.opacity = '1';
    isScreenSharing = false;
    if (currentChat) {
        socket.emit('end-call', { to: currentChat.id });
    }
}

// ВХОДЯЩИЙ ЗВОНОК
socket.on('incoming-audio-call', (data) => {
    incomingCall = {
        ...data,
        from: data.from,
        isVideo: false
    };
    document.getElementById('incomingCallName').textContent = data.from;
    document.getElementById('incomingCallModal').classList.add('active');
});

socket.on('incoming-video-call', (data) => {
    incomingCall = {
        ...data,
        from: data.from,
        isVideo: true
    };
    document.getElementById('incomingCallName').textContent = data.from;
    document.getElementById('incomingCallModal').classList.add('active');
});

socket.on('incoming-group-audio-call', (data) => {
    incomingCall = {
        ...data,
        from: data.from,
        isVideo: false,
        isGroup: true
    };
    document.getElementById('incomingCallName').textContent = `${data.from} (групповой звонок)`;
    document.getElementById('incomingCallModal').classList.add('active');
});

socket.on('incoming-group-video-call', (data) => {
    incomingCall = {
        ...data,
        from: data.from,
        isVideo: true,
        isGroup: true
    };
    document.getElementById('incomingCallName').textContent = `${data.from} (групповой видеозвонок)`;
    document.getElementById('incomingCallModal').classList.add('active');
});

// ОБРАБОТКА ОТВЕТА
socket.on('call-answered', async (data) => {
    try {
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    } catch (err) {
        console.error('Ошибка при установке ответа:', err);
    }
});

// ICE КАНДИДАТЫ
socket.on('ice-candidate', async (data) => {
    try {
        if (peerConnection && data.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    } catch (err) {
        console.error('Ошибка ICE:', err);
    }
});

// ЗАВЕРШЕНИЕ ЗВОНКА
socket.on('call-ended', () => {
    endCall();
    alert(t('callEnded'));
});

socket.on('call-declined', () => {
    endCall();
    alert(t('callDeclined'));
});