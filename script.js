const socket = io();

// ПЕРЕМЕННЫЕ
let myShortId = '';
let myName = '';
let addedContacts = [];
let isRegisterMode = false;
let currentChat = null;
let currentLanguage = 'ru';
let localStream = null;
let peerConnection = null;
let incomingCall = null;

// ПЕРЕВОДЫ
const translations = {
    ru: {
        welcomeText: 'Добро пожаловать в будущее общения',
        selectChat: 'Выберите чат',
        selectChatHint: 'Выберите контакт для начала общения',
        online: 'Online',
        offline: 'Offline',
        addContact: 'Добавить контакт',
        addContactId: 'ID контакта (например: ARN923)',
        addContactBtn: 'Добавить',
        incoming: 'Входящий звонок от',
        callEnded: 'Звонок завершен',
        settings: 'Настройки',
        language: 'Язык',
        info: 'Информация',
        aboutText: 'BlueWave v1.0 - Современный мессенджер с видеозвонками',
        login: 'ВОЙТИ',
        register: 'ЗАРЕГИСТРИРОВАТЬСЯ',
        haveAccount: 'Уже есть аккаунт? Войти',
        noAccount: 'Нет аккаунта? Зарегистрироваться',
        loginWelcome: 'Добро пожаловать в будущее общения',
        registerWelcome: 'Создайте новый аккаунт'
    },
    en: {
        welcomeText: 'Welcome to the future of communication',
        selectChat: 'Select chat',
        selectChatHint: 'Select a contact to start chatting',
        online: 'Online',
        offline: 'Offline',
        addContact: 'Add contact',
        addContactId: 'Contact ID (e.g., ARN923)',
        addContactBtn: 'Add',
        incoming: 'Incoming call from',
        callEnded: 'Call ended',
        settings: 'Settings',
        language: 'Language',
        info: 'Information',
        aboutText: 'BlueWave v1.0 - Modern messenger with video calls',
        login: 'LOGIN',
        register: 'REGISTER',
        haveAccount: 'Have account? Login',
        noAccount: 'No account? Register',
        loginWelcome: 'Welcome to the future of communication',
        registerWelcome: 'Create a new account'
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
        alert('Заполните все поля');
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
            updateLanguage();
        });
    });
}

function updateLanguage() {
    updateAuthScreen();
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

    // ДОБАВЛЕНИЕ КОНТАКТА
    const addContactBtn = document.getElementById('addContactBtn');
    if (addContactBtn) {
        addContactBtn.onclick = () => {
            const id = document.getElementById('addContactId').value.trim().toUpperCase();
            
            if (!id) {
                alert('Введите ID');
                return;
            }
            
            if (id === myShortId) {
                alert('Это ваш ID');
                return;
            }
            
            if (addedContacts.includes(id)) {
                alert('Контакт уже добавлен');
                return;
            }
            
            addedContacts.push(id);
            document.getElementById('addContactId').value = '';
            socket.emit('refresh-users');
            alert(`Контакт ${id} добавлен!`);
        };
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

    // ГЛОБАЛЬНАЯ ГРУППА
    const globalGroupBtn = document.getElementById('globalGroupBtn');
    if (globalGroupBtn) {
        globalGroupBtn.onclick = () => {
            openChat('global', 'BlueWave Group', 'group');
            document.querySelectorAll('.group-item, .contact-item').forEach(el => {
                el.classList.remove('active');
            });
            globalGroupBtn.classList.add('active');
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
    const contactsList = document.getElementById('contactsList');
    contactsList.innerHTML = '';
    
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
});

// ОТКРЫТИЕ ЧАТА
function openChat(id, name, type, shortId) {
    currentChat = { id, type, shortId };
    
    document.getElementById('chatTitle').textContent = name;
    document.getElementById('chatStatus').textContent = 'Online';
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

// ========== ЗВОНКИ ==========
const STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

async function initiateCall(isVideo) {
    if (!currentChat || currentChat.type === 'group') {
        alert('Выберите контакт');
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

        socket.emit(isVideo ? 'video-call' : 'audio-call', {
            to: currentChat.id,
            offer: offer
        });

        document.getElementById('callModal').classList.add('active');
        document.getElementById('callTitle').textContent = `Звонок ${currentChat.shortId}...`;
        document.getElementById('answerCallBtn').style.display = 'none';

    } catch (err) {
        console.error('Ошибка звонка:', err);
        alert('Ошибка при инициировании звонка: ' + err.message);
    }
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
    }
    document.getElementById('callModal').classList.remove('active');
    document.getElementById('remoteVideo').srcObject = null;
    document.getElementById('localVideo').srcObject = null;
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

// ЗАВЕРШЕНИЕ ЗВОНКА ДРУГОЙ СТОРОНОЙ
socket.on('call-ended', () => {
    endCall();
    alert('Звонок завершен');
});

socket.on('call-declined', () => {
    endCall();
    alert('Звонок отклонен');
});