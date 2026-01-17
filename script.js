= Translation Object ==========
const translations = {
    en: {
        loginSubtitle: "Connect instantly, message securely",
        login: "Login",
        register: "Register",
        username: "Username (3-20 characters)",
        password: "Password (4-50 characters)",
        loginBtn: "Login",
        registerBtn: "Register",
        welcome: "Welcome",
        selectContact: "Select a contact to start chatting",
        typeMessage: "Type a message...",
        settings: "Settings",
        language: "Language",
        languageDesc: "English",
        profile: "Profile",
        profileDesc: "Manage your ID",
        about: "About",
        aboutDesc: "Version 1.0.0",
        selectLanguage: "Select Language",
        changeId: "Change ID",
        addContact: "Add Contact",
        change: "Change",
        add: "Add",
        invalidId: "ID must be 3-6 characters (letters and numbers)",
        idChanged: "ID updated successfully",
        contactAdded: "Contact added",
        contactNotFound: "Contact not found",
        incomingCall: "Incoming Call",
        audioCall: "Audio Call",
        videoCall: "Video Call",
        accept: "Accept",
        decline: "Decline",
        endCall: "End Call",
        noContacts: "No contacts yet",
        errorLogin: "Login failed. Check credentials.",
        errorRegister: "Registration failed. Username may be taken.",
        microphone: "Mute Microphone",
        camera: "Turn Off Camera",
        screenShare: "Share Screen",
        friendRequest: "Friend Request",
        from: "from",
        send: "Send",
        search: "Search ID or name..."
    },
    ru: {
        loginSubtitle: "Общайтесь мгновенно, безопасно",
        login: "Вход",
        register: "Регистрация",
        username: "Имя пользователя (3-20 символов)",
        password: "Пароль (4-50 символов)",
        loginBtn: "Вход",
        registerBtn: "Регистрация",
        welcome: "Добро пожаловать",
        selectContact: "Выберите контакт для начала общения",
        typeMessage: "Введите сообщение...",
        settings: "Настройки",
        language: "Язык",
        languageDesc: "Русский",
        profile: "Профиль",
        profileDesc: "Управляйте вашим ID",
        about: "О приложении",
        aboutDesc: "Версия 1.0.0",
        selectLanguage: "Выберите язык",
        changeId: "Изменить ID",
        addContact: "Добавить контакт",
        change: "Изменить",
        add: "Добавить",
        invalidId: "ID должен быть 3-6 символов (буквы и цифры)",
        idChanged: "ID успешно обновлён",
        contactAdded: "Контакт добавлен",
        contactNotFound: "Контакт не найден",
        incomingCall: "Входящий звонок",
        audioCall: "Аудиозвонок",
        videoCall: "Видеозвонок",
        accept: "Принять",
        decline: "Отклонить",
        endCall: "Завершить",
        noContacts: "Контактов еще нет",
        errorLogin: "Ошибка входа. Проверьте учетные данные.",
        errorRegister: "Ошибка регистрации. Имя пользователя может быть занято.",
        microphone: "Отключить микрофон",
        camera: "Отключить камеру",
        screenShare: "Общий доступ к экрану",
        friendRequest: "Запрос дружбы",
        from: "от",
        send: "Отправить",
        search: "Поиск ID или имени..."
    }
};

// ========== Global Variables ==========
let socket;
let currentUser = null;
let currentLanguage = 'en';
let selectedContactId = null;
let peerConnection = null;
let localStream = null;
let isCallActive = false;
let isMicMuted = false;
let isCameraOff = false;
let isScreenSharing = false;
let screenTrack = null;

const STUN_SERVERS = [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] }
];

// ========== DOM Elements ==========
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const authForm = document.getElementById('authForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const authError = document.getElementById('authError');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const authButton = document.getElementById('authButton');
const contactsList = document.getElementById('contactsList');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const imageBtn = document.getElementById('imageBtn');
const imageInput = document.getElementById('imageInput');
const callBtn = document.getElementById('callBtn');
const videoBtn = document.getElementById('videoBtn');
const settingsBtn = document.getElementById('settingsBtn');
const searchInput = document.getElementById('searchInput');

// Modal Elements
const settingsModal = document.getElementById('settingsModal');
const languagesModal = document.getElementById('languagesModal');
const profileModal = document.getElementById('profileModal');
const callModal = document.getElementById('callModal');
const incomingCallModal = document.getElementById('incomingCallModal');

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    setupEventListeners();
});

function initializeChat() {
    socket = io();

    // Socket Events
    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('login-success', (data) => {
        currentUser = data;
        console.log('User logged in:', currentUser);
        loginScreen.classList.remove('active');
        chatScreen.classList.add('active');
        updateProfileDisplay();
        loadContacts();
    });

    socket.on('register-success', (data) => {
        currentUser = data;
        console.log('User registered:', currentUser);
        loginScreen.classList.remove('active');
        chatScreen.classList.add('active');
        updateProfileDisplay();
    });

    socket.on('auth-error', (message) => {
        authError.textContent = message;
    });

    socket.on('user-list', (users) => {
        updateContactsList(users);
    });

    socket.on('refresh-users', (users) => {
        updateContactsList(users);
    });

    socket.on('private-message', (data) => {
        if (data.from === selectedContactId || selectedContactId === null) {
            renderMessage(data.fromName, data.text, 'other');
        }
    });

    socket.on('image-message', (data) => {
        renderImage(data.imageData, 'other', data.fromName);
    });

    socket.on('friend-request', (data) => {
        showFriendRequestNotification(data);
    });

    socket.on('friend-request-accepted', (data) => {
        console.log('Friend request accepted by', data.fromName);
    });

    socket.on('incoming-audio-call', (data) => {
        handleIncomingCall(data, 'audio');
    });

    socket.on('incoming-video-call', (data) => {
        handleIncomingCall(data, 'video');
    });

    socket.on('call-offer', async (data) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('call-answer', { to: data.from, answer: answer });
    });

    socket.on('call-answer', async (data) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('ice-candidate', async (data) => {
        try {
            if (data.candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        } catch (err) {
            console.error('Error adding ICE candidate:', err);
        }
    });

    socket.on('end-call', () => {
        endCall();
    });

    // Modal Navigation
    const settingsItems = document.querySelectorAll('.settings-item');
    settingsItems[0].onclick = () => {
        settingsModal.classList.remove('active');
        languagesModal.classList.add('active');
    };
    settingsItems[1].onclick = () => {
        settingsModal.classList.remove('active');
        profileModal.classList.add('active');
    };

    // Language Selection
    const languageOptions = document.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.dataset.lang;
            currentLanguage = lang;
            
            // Update checkmarks
            document.querySelectorAll('.language-check').forEach(check => {
                check.textContent = '';
            });
            document.getElementById(`check-${lang}`).textContent = '✓';
            
            updateAllLanguageText();
        });
    });

    // Profile Actions
    const changeIdBtn = document.getElementById('changeIdBtn');
    changeIdBtn.addEventListener('click', changeUserID);

    const addContactBtn = document.getElementById('addContactBtn');
    addContactBtn.addEventListener('click', addContact);

    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                document.getElementById(modalId).classList.remove('active');
            }
        });
    });

    // Modal Back Buttons
    document.querySelectorAll('.modal-back').forEach(btn => {
        btn.addEventListener('click', function() {
            const backTo = this.getAttribute('data-back-to');
            if (backTo) {
                document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
                document.getElementById(backTo).classList.add('active');
            }
        });
    });

    updateAllLanguageText();
}

function setupEventListeners() {
    // Auth Form
    loginTab.addEventListener('click', () => {
        switchAuthMode('login');
    });

    registerTab.addEventListener('click', () => {
        switchAuthMode('register');
    });

    authForm.addEventListener('submit', handleAuthSubmit);

    // Chat Events
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    imageBtn.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', sendImage);

    // Call Buttons
    callBtn.addEventListener('click', () => initiateCall(false));
    videoBtn.addEventListener('click', () => initiateCall(true));

    // Settings
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const contactItems = document.querySelectorAll('.contact-item');
        
        contactItems.forEach(item => {
            const name = item.dataset.name.toLowerCase();
            const id = item.dataset.id.toLowerCase();
            
            if (name.includes(query) || id.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Incoming Call Buttons
    document.getElementById('acceptCallBtn').addEventListener('click', acceptCall);
    document.getElementById('declineCallBtn').addEventListener('click', declineCall);

    // Call Controls
    document.getElementById('toggleMicBtn').addEventListener('click', toggleMicrophone);
    document.getElementById('toggleCameraBtn').addEventListener('click', toggleCamera);
    document.getElementById('toggleScreenBtn').addEventListener('click', toggleScreenShare);
    document.getElementById('endCallBtn').addEventListener('click', endCall);
}

// ========== Authentication ==========
function switchAuthMode(mode) {
    const isLogin = mode === 'login';
    
    loginTab.classList.toggle('active', isLogin);
    registerTab.classList.toggle('active', !isLogin);
    
    authButton.textContent = isLogin ? 
        translations[currentLanguage].loginBtn : 
        translations[currentLanguage].registerBtn;
    
    authForm.dataset.mode = mode;
    authError.textContent = '';
}

function handleAuthSubmit(e) {
    e.preventDefault();
    
    const user = username.value.trim();
    const pass = password.value.trim();
    const mode = authForm.dataset.mode || 'login';

    if (!user || !pass) {
        authError.textContent = 'Please fill in all fields';
        return;
    }

    if (mode === 'login') {
        socket.emit('login', { username: user, password: pass });
    } else {
        socket.emit('register', { username: user, password: pass });
    }

    username.value = '';
    password.value = '';
}

// ========== Contacts & Messages ==========
function loadContacts() {
    socket.emit('get-users');
}

function updateContactsList(users) {
    contactsList.innerHTML = '';
    
    if (!users || Object.keys(users).length === 0) {
        contactsList.innerHTML = `<div style="padding: 16px; color: #65676b; text-align: center;">${translations[currentLanguage].noContacts}</div>`;
        return;
    }

    Object.values(users).forEach(user => {
        if (user.id !== currentUser.id) {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item';
            contactItem.dataset.id = user.id;
            contactItem.dataset.name = user.username;
            
            const initial = user.username[0].toUpperCase();
            
            contactItem.innerHTML = `
                <div class="contact-avatar">${initial}</div>
                <div class="contact-info">
                    <div class="contact-name">${user.username}</div>
                    <div class="contact-id">${user.id}</div>
                </div>
            `;

            contactItem.addEventListener('click', () => selectContact(user.id, user.username));
            contactsList.appendChild(contactItem);
        }
    });
}

function selectContact(contactId, contactName) {
    selectedContactId = contactId;
    
    document.querySelectorAll('.contact-item').forEach(item => {
        item.classList.remove('active');
    });
    
    event.currentTarget.classList.add('active');
    
    document.getElementById('chatTitle').textContent = contactName;
    document.getElementById('chatStatus').textContent = `Chatting with ${contactName}`;
    messagesContainer.innerHTML = '';
}

function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text) return;
    if (!selectedContactId) {
        alert('Please select a contact first');
        return;
    }

    socket.emit('private-message', {
        to: selectedContactId,
        text: text
    });

    renderMessage(currentUser.username, text, 'own');
    messageInput.value = '';
}

function sendImage() {
    if (!selectedContactId) {
        alert('Please select a contact first');
        return;
    }

    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;
        socket.emit('image-message', {
            to: selectedContactId,
            imageData: imageData
        });
        renderImage(imageData, 'own', currentUser.username);
    };
    reader.readAsDataURL(file);
    imageInput.value = '';
}

function renderMessage(name, text, side) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${side}`;
    
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':'// ========== Translation Object ==========
const translations = {
    en: {
        loginSubtitle: "Connect instantly, message securely",
        login: "Login",
        register: "Register",
        username: "Username (3-20 characters)",
        password: "Password (4-50 characters)",
        loginBtn: "Login",
        registerBtn: "Register",
        welcome: "Welcome",
        selectContact: "Select a contact to start chatting",
        typeMessage: "Type a message...",
        settings: "Settings",
        language: "Language",
        languageDesc: "English",
        profile: "Profile",
        profileDesc: "Manage your ID",
        about: "About",
        aboutDesc: "Version 1.0.0",
        selectLanguage: "Select Language",
        changeId: "Change ID",
        addContact: "Add Contact",
        change: "Change",
        add: "Add",
        invalidId: "ID must be 3-6 characters (letters and numbers)",
        idChanged: "ID updated successfully",
        contactAdded: "Contact added",
        contactNotFound: "Contact not found",
        incomingCall: "Incoming Call",
        audioCall: "Audio Call",
        videoCall: "Video Call",
        accept: "Accept",
        decline: "Decline",
        endCall: "End Call",
        noContacts: "No contacts yet",
        errorLogin: "Login failed. Check credentials.",
        errorRegister: "Registration failed. Username may be taken.",
        microphone: "Mute Microphone",
        camera: "Turn Off Camera",
        screenShare: "Share Screen",
        friendRequest: "Friend Request",
        from: "from",
        send: "Send",
        search: "Search ID or name..."
    },
    ru: {
        loginSubtitle: "Общайтесь мгновенно, безопасно",
        login: "Вход",
        register: "Регистрация",
        username: "Имя пользователя (3-20 символов)",
        password: "Пароль (4-50 символов)",
        loginBtn: "Вход",
        registerBtn: "Регистрация",
        welcome: "Добро пожаловать",
        selectContact: "Выберите контакт для начала общения",
        typeMessage: "Введите сообщение...",
        settings: "Настройки",
        language: "Язык",
        languageDesc: "Русский",
        profile: "Профиль",
        profileDesc: "Управляйте вашим ID",
        about: "О приложении",
        aboutDesc: "Версия 1.0.0",
        selectLanguage: "Выберите язык",
        changeId: "Изменить ID",
        addContact: "Добавить контакт",
        change: "Изменить",
        add: "Добавить",
        invalidId: "ID должен быть 3-6 символов (буквы и цифры)",
        idChanged: "ID успешно обновлён",
        contactAdded: "Контакт добавлен",
        contactNotFound: "Контакт не найден",
        incomingCall: "Входящий звонок",
        audioCall: "Аудиозвонок",
        videoCall: "Видеозвонок",
        accept: "Принять",
        decline: "Отклонить",
        endCall: "Завершить",
        noContacts: "Контактов еще нет",
        errorLogin: "Ошибка входа. Проверьте учетные данные.",
        errorRegister: "Ошибка регистрации. Имя пользователя может быть занято.",
        microphone: "Отключить микрофон",
        camera: "Отключить камеру",
        screenShare: "Общий доступ к экрану",
        friendRequest: "Запрос дружбы",
        from: "от",
        send: "Отправить",
        search: "Поиск ID или имени..."
    }
};

// ========== Global Variables ==========
let socket;
let currentUser = null;
let currentLanguage = 'en';
let selectedContactId = null;
let peerConnection = null;
let localStream = null;
let isCallActive = false;
let isMicMuted = false;
let isCameraOff = false;
let isScreenSharing = false;
let screenTrack = null;

const STUN_SERVERS = [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] }
];

// ========== DOM Elements ==========
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const authForm = document.getElementById('authForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const authError = document.getElementById('authError');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const authButton = document.getElementById('authButton');
const contactsList = document.getElementById('contactsList');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const imageBtn = document.getElementById('imageBtn');
const imageInput = document.getElementById('imageInput');
const callBtn = document.getElementById('callBtn');
const videoBtn = document.getElementById('videoBtn');
const settingsBtn = document.getElementById('settingsBtn');
const searchInput = document.getElementById('searchInput');

// Modal Elements
const settingsModal = document.getElementById('settingsModal');
const languagesModal = document.getElementById('languagesModal');
const profileModal = document.getElementById('profileModal');
const callModal = document.getElementById('callModal');
const incomingCallModal = document.getElementById('incomingCallModal');

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    setupEventListeners();
});

function initializeChat() {
    socket = io();

    // Socket Events
    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('login-success', (data) => {
        currentUser = data;
        console.log('User logged in:', currentUser);
        loginScreen.classList.remove('active');
        chatScreen.classList.add('active');
        updateProfileDisplay();
        loadContacts();
    });

    socket.on('register-success', (data) => {
        currentUser = data;
        console.log('User registered:', currentUser);
        loginScreen.classList.remove('active');
        chatScreen.classList.add('active');
        updateProfileDisplay();
    });

    socket.on('auth-error', (message) => {
        authError.textContent = message;
    });

    socket.on('user-list', (users) => {
        updateContactsList(users);
    });

    socket.on('refresh-users', (users) => {
        updateContactsList(users);
    });

    socket.on('private-message', (data) => {
        if (data.from === selectedContactId || selectedContactId === null) {
            renderMessage(data.fromName, data.text, 'other');
        }
    });

    socket.on('image-message', (data) => {
        renderImage(data.imageData, 'other', data.fromName);
    });

    socket.on('friend-request', (data) => {
        showFriendRequestNotification(data);
    });

    socket.on('friend-request-accepted', (data) => {
        console.log('Friend request accepted by', data.fromName);
    });

    socket.on('incoming-audio-call', (data) => {
        handleIncomingCall(data, 'audio');
    });

    socket.on('incoming-video-call', (data) => {
        handleIncomingCall(data, 'video');
    });

    socket.on('call-offer', async (data) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('call-answer', { to: data.from, answer: answer });
    });

    socket.on('call-answer', async (data) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('ice-candidate', async (data) => {
        try {
            if (data.candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        } catch (err) {
            console.error('Error adding ICE candidate:', err);
        }
    });

    socket.on('end-call', () => {
        endCall();
    });

    // Modal Navigation
    const settingsItems = document.querySelectorAll('.settings-item');
    settingsItems[0].onclick = () => {
        settingsModal.classList.remove('active');
        languagesModal.classList.add('active');
    };
    settingsItems[1].onclick = () => {
        settingsModal.classList.remove('active');
        profileModal.classList.add('active');
    };

    // Language Selection
    const languageOptions = document.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.dataset.lang;
            currentLanguage = lang;
            
            // Update checkmarks
            document.querySelectorAll('.language-check').forEach(check => {
                check.textContent = '';
            });
            document.getElementById(`check-${lang}`).textContent = '✓';
            
            updateAllLanguageText();
        });
    });

    // Profile Actions
    const changeIdBtn = document.getElementById('changeIdBtn');
    changeIdBtn.addEventListener('click', changeUserID);

    const addContactBtn = document.getElementById('addContactBtn');
    addContactBtn.addEventListener('click', addContact);

    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                document.getElementById(modalId).classList.remove('active');
            }
        });
    });

    // Modal Back Buttons
    document.querySelectorAll('.modal-back').forEach(btn => {
        btn.addEventListener('click', function() {
            const backTo = this.getAttribute('data-back-to');
            if (backTo) {
                document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
                document.getElementById(backTo).classList.add('active');
            }
        });
    });

    updateAllLanguageText();
}

function setupEventListeners() {
    // Auth Form
    loginTab.addEventListener('click', () => {
        switchAuthMode('login');
    });

    registerTab.addEventListener('click', () => {
        switchAuthMode('register');
    });

    authForm.addEventListener('submit', handleAuthSubmit);

    // Chat Events
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    imageBtn.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', sendImage);

    // Call Buttons
    callBtn.addEventListener('click', () => initiateCall(false));
    videoBtn.addEventListener('click', () => initiateCall(true));

    // Settings
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const contactItems = document.querySelectorAll('.contact-item');
        
        contactItems.forEach(item => {
            const name = item.dataset.name.toLowerCase();
            const id = item.dataset.id.toLowerCase();
            
            if (name.includes(query) || id.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Incoming Call Buttons
    document.getElementById('acceptCallBtn').addEventListener('click', acceptCall);
    document.getElementById('declineCallBtn').addEventListener('click', declineCall);

    // Call Controls
    document.getElementById('toggleMicBtn').addEventListener('click', toggleMicrophone);
    document.getElementById('toggleCameraBtn').addEventListener('click', toggleCamera);
    document.getElementById('toggleScreenBtn').addEventListener('click', toggleScreenShare);
    document.getElementById('endCallBtn').addEventListener('click', endCall);
}

// ========== Authentication ==========
function switchAuthMode(mode) {
    const isLogin = mode === 'login';
    
    loginTab.classList.toggle('active', isLogin);
    registerTab.classList.toggle('active', !isLogin);
    
    authButton.textContent = isLogin ? 
        translations[currentLanguage].loginBtn : 
        translations[currentLanguage].registerBtn;
    
    authForm.dataset.mode = mode;
    authError.textContent = '';
}

function handleAuthSubmit(e) {
    e.preventDefault();
    
    const user = username.value.trim();
    const pass = password.value.trim();
    const mode = authForm.dataset.mode || 'login';

    if (!user || !pass) {
        authError.textContent = 'Please fill in all fields';
        return;
    }

    if (mode === 'login') {
        socket.emit('login', { username: user, password: pass });
    } else {
        socket.emit('register', { username: user, password: pass });
    }

    username.value = '';
    password.value = '';
}

// ========== Contacts & Messages ==========
function loadContacts() {
    socket.emit('get-users');
}

function updateContactsList(users) {
    contactsList.innerHTML = '';
    
    if (!users || Object.keys(users).length === 0) {
        contactsList.innerHTML = `<div style="padding: 16px; color: #65676b; text-align: center;">${translations[currentLanguage].noContacts}</div>`;
        return;
    }

    Object.values(users).forEach(user => {
        if (user.id !== currentUser.id) {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item';
            contactItem.dataset.id = user.id;
            contactItem.dataset.name = user.username;
            
            const initial = user.username[0].toUpperCase();
            
            contactItem.innerHTML = `
                <div class="contact-avatar">${initial}</div>
                <div class="contact-info">
                    <div class="contact-name">${user.username}</div>
                    <div class="contact-id">${user.id}</div>
                </div>
            `;

            contactItem.addEventListener('click', () => selectContact(user.id, user.username));
            contactsList.appendChild(contactItem);
        }
    });
}

function selectContact(contactId, contactName) {
    selectedContactId = contactId;
    
    document.querySelectorAll('.contact-item').forEach(item => {
        item.classList.remove('active');
    });
    
    event.currentTarget.classList.add('active');
    
    document.getElementById('chatTitle').textContent = contactName;
    document.getElementById('chatStatus').textContent = `Chatting with ${contactName}`;
    messagesContainer.innerHTML = '';
}

function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text) return;
    if (!selectedContactId) {
        alert('Please select a contact first');
        return;
    }

    socket.emit('private-message', {
        to: selectedContactId,
        text: text
    });

    renderMessage(currentUser.username, text, 'own');
    messageInput.value = '';
}

function sendImage() {
    if (!selectedContactId) {
        alert('Please select a contact first');
        return;
    }

    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;
        socket.emit('image-message', {
            to: selectedContactId,
            imageData: imageData
        });
        renderImage(imageData, 'own', currentUser.username);
    };
    reader.readAsDataURL(file);
    imageInput.value = '';
}

function renderMessage(name, text, side) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${side}`;
    
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':'