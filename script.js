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
        aboutText: 'BlueWave v1.0 - Современный мессенджер с видеозвонками'
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
        aboutText: 'BlueWave v1.0 - Modern messenger with video calls'
    }
};

function t(key) {
    return translations[currentLanguage][key] || key;
}

// ЭКРАН ВХОДА
document.getElementById('loginBtn').onclick = () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    
    if (!user || !pass) {
        alert('Заполните все поля');
        return;
    }

    // Пытаемся сначала залогиниться
    socket.emit('login', { user, pass });
};

// СМЕНА ЯЗЫКА
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentLanguage = this.dataset.lang;
        updateLanguage();
    });
});

function updateLanguage() {
    document.getElementById('welcomeText').textContent = t('welcomeText');
    document.getElementById('chatTitle').textContent = t('selectChat');
}

// ОБРАБОТКА ЛОГИНА
socket.on('auth-success', (data) => {
    myShortId = data.shortId;
    myName = data.userName || 'User';
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('chat-container').style.display = 'flex';
    document.getElementById('userIdDisplay').textContent = `ID: ${myShortId}`;
    document.getElementById('userNameDisplay').textContent = myName;
});

socket.on('auth-error', (msg) => {
    alert('Ошибка: ' + msg);
});

socket.on('auth-success-register', (msg) => {
    alert(msg);
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
            div.onclick = () => openChat(user.socketId, user.name, 'private', user.shortId);
            contactsList.appendChild(div);
        }
    });
});

// ОТКРЫТИЕ ЧАТА
function openChat(id, name, type, shortId) {
    currentChat = { id, type, shortId };
    
    document.querySelectorAll('.contact-item, .group-item').forEach(el => {
        el.classList.remove('active');
    });
    event?.target?.closest('.contact-item, .group-item')?.classList.add('active');
    
    document.getElementById('chatTitle').textContent = name;
    document.getElementById('chatStatus').textContent = t('online');
    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('messageInput').focus();
}

// ГЛОБАЛЬНАЯ ГРУППА
document.getElementById('globalGroupBtn').onclick = () => {
    openChat('global', 'BlueWave Group', 'group');
};

// ОТПРАВКА СООБЩЕНИЯ
document.getElementById('sendBtn').onclick = sendMessage;
document.getElementById('messageInput').onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
};

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

// НАСТРОЙКИ
document.getElementById('settingsBtn').onclick = () => {
    document.getElementById('settingsModal').classList.add('active');
};

document.getElementById('closeSettingsBtn').onclick = () => {
    document.getElementById('settingsModal').classList.remove('active');
};

// ДОБАВЛЕНИЕ КОНТАКТА
document.getElementById('addContactBtn').onclick = () => {
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

// ========== ЗВОНКИ ==========
const STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

// ИНИЦИИРОВАНИЕ ЗВОНКА
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
        alert('Ошибка при инициировании звонка');
    }
}

// КНОПКИ ЗВОНКОВ
document.getElementById('callBtn').onclick = () => initiateCall(false);
document.getElementById('videoCallBtn').onclick = () => initiateCall(true);

// УПРАВЛЕНИЕ МИКРОФОНОМ
document.getElementById('toggleMicBtn').onclick = () => {
    const btn = document.getElementById('toggleMicBtn');
    const audioTracks = localStream?.getAudioTracks() || [];
    
    if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        btn.classList.toggle('off');
        btn.style.opacity = audioTracks[0].enabled ? '1' : '0.5';
    }
};

// УПРАВЛЕНИЕ КАМЕРОЙ
document.getElementById('toggleCameraBtn').onclick = () => {
    const btn = document.getElementById('toggleCameraBtn');
    const videoTracks = localStream?.getVideoTracks() || [];
    
    if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        btn.classList.toggle('off');
        btn.style.opacity = videoTracks[0].enabled ? '1' : '0.5';
    }
};

// ЗАВЕРШЕНИЕ ЗВОНКА
document.getElementById('endCallBtn').onclick = () => {
    endCall();
};

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
    socket.emit('end-call', { to: currentChat.id });
}

// ВХОДЯЩИЙ ЗВОНОК
socket.on('incoming-audio-call', (data) => {
    incomingCall = data;
    document.getElementById('incomingCallName').textContent = data.from;
    document.getElementById('incomingCallModal').classList.add('active');
});

socket.on('incoming-video-call', (data) => {
    incomingCall = data;
    document.getElementById('incomingCallName').textContent = data.from;
    document.getElementById('incomingCallModal').classList.add('active');
});

// ОТВЕТИТЬ НА ЗВОНОК
document.getElementById('acceptBtn').onclick = async () => {
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

// ОТКЛОНИТЬ ЗВОНОК
document.getElementById('declineBtn').onclick = () => {
    document.getElementById('incomingCallModal').classList.remove('active');
    socket.emit('decline-call', { to: incomingCall.from });
};

// ОБРАБОТКА ОТВЕТА
socket.on('call-answered', async (data) => {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
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