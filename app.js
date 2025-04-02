// Constants
const SECRET_PASSWORD = "123"; // Change this to your desired password
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const MESSAGE_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// DOM Elements
const timerScreen = document.getElementById('timerScreen');
const settingsScreen = document.getElementById('settingsScreen');
const chatScreen = document.getElementById('chatScreen');
const errorScreen = document.getElementById('errorScreen');
const timer = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const settingsBtn = document.getElementById('settingsBtn');
const backBtn = document.getElementById('backBtn');
const chatBackBtn = document.getElementById('chatBackBtn');
const deleteChatBtn = document.getElementById('deleteChatBtn');
const errorBackBtn = document.getElementById('errorBackBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const sendImageBtn = document.getElementById('sendImageBtn');
const voiceNoteBtn = document.getElementById('voiceNoteBtn');
const chatMessages = document.getElementById('chatMessages');
const settingsScroll = document.getElementById('settingsScroll');

// Timer Variables
let timeLeft = 25 * 60; // 25 minutes in seconds
let timerInterval;
let isRunning = false;

// Chat Variables
let lastActivity = Date.now();
let mediaRecorder;
let audioChunks = [];
let messages = [];
let typingTimeout;
let isTyping = false;

// DOM Elements for status indicators
const onlineStatus = document.getElementById('onlineStatus');
const typingIndicator = document.getElementById('typingIndicator');

// Initialize Firebase (you'll need to add your Firebase config)
const firebaseConfig = {
    apiKey: "AIzaSyBUowtEpraz67coT3nPUFv9sSgQfLraT5Y",
    authDomain: "chathub-5ce5a.firebaseapp.com",
    projectId: "chathub-5ce5a",
    storageBucket: "chathub-5ce5a.firebasestorage.app",
    messagingSenderId: "1084233256925",
    appId: "1:1084233256925:web:f7dd09b53a4056c409b034"
};

// Initialize Firebase only if config is provided
let db, auth;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        
        // Enable persistence for offline support
        db.enablePersistence()
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                } else if (err.code === 'unimplemented') {
                    console.log('The current browser does not support persistence.');
                }
            });
            
        console.log('Firebase initialized successfully');
    } else {
        db = firebase.firestore();
        auth = firebase.auth();
        console.log('Firebase already initialized');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
    showNotification('Failed to connect to chat service', 'error');
}

// Add error handling for Firebase operations
function handleFirebaseError(error, operation) {
    console.error(`Firebase ${operation} error:`, error);
    let errorMessage = 'An error occurred';
    
    if (error.code === 'permission-denied') {
        errorMessage = 'Access denied. Please check your permissions.';
    } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again.';
    } else if (error.code === 'not-found') {
        errorMessage = 'Resource not found.';
    }
    
    showNotification(errorMessage, 'error');
}

// Timer Functions
function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        timer.classList.remove('completed');
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            if (timeLeft === 0) {
                clearInterval(timerInterval);
                isRunning = false;
                startBtn.classList.remove('hidden');
                pauseBtn.classList.add('hidden');
                timer.classList.add('completed');
                showNotification('Timer completed! 🎉');
            }
        }, 1000);
    }
}

function pauseTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        timer.classList.remove('completed');
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = parseInt(document.getElementById('timerDuration').value) * 60;
    updateTimer();
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    timer.classList.remove('completed');
}

// Screen Navigation
function showScreen(screen) {
    [timerScreen, settingsScreen, chatScreen, errorScreen].forEach(s => {
        s.classList.add('hidden');
    });
    screen.classList.remove('hidden');
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white font-medium`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Authentication Functions
async function signInAnonymously() {
    try {
        const userCredential = await auth.signInAnonymously();
        console.log('Signed in anonymously:', userCredential.user.uid);
        return true;
    } catch (error) {
        console.error('Error signing in anonymously:', error);
        showNotification('Failed to connect to chat', 'error');
        return false;
    }
}

// Settings Functions
function initializeSettings() {
    const secretOption = document.createElement('div');
    secretOption.className = 'secret-option';
    secretOption.innerHTML = `
        <div class="text-center">
            <i class="fas fa-heart text-pink-500 text-2xl mb-2"></i>
            <p class="text-sm text-gray-400">Scroll to the bottom to find something special...</p>
        </div>
    `;
    settingsScroll.appendChild(secretOption);

    // Show secret option when scrolled to bottom
    settingsScroll.addEventListener('scroll', () => {
        const isAtBottom = settingsScroll.scrollHeight - settingsScroll.scrollTop === settingsScroll.clientHeight;
        if (isAtBottom) {
            secretOption.classList.add('visible');
        }
    });

    secretOption.addEventListener('click', async () => {
        const password = prompt('Enter the secret password:');
        if (password === SECRET_PASSWORD) {
            if (!db) {
                showNotification('Chat features require Firebase setup', 'error');
                return;
            }
            const signedIn = await signInAnonymously();
            if (signedIn) {
                showScreen(chatScreen);
                initializeChat();
                showNotification('Welcome to our secret chat! 💝');
            }
        } else {
            showScreen(errorScreen);
            showNotification('Incorrect password!', 'error');
        }
    });
}

// Update online status
function updateOnlineStatus() {
    if (!db || !auth.currentUser) return;
    
    const userStatusRef = db.collection('status').doc(auth.currentUser.uid);
    const isOnline = true;
    
    userStatusRef.set({
        online: isOnline,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Set up presence system
    db.collection('status').onSnapshot((snapshot) => {
        const onlineUsers = snapshot.docs.filter(doc => doc.data().online).length;
        onlineStatus.textContent = `${onlineUsers} online`;
        onlineStatus.className = onlineUsers > 1 ? 'text-xs text-green-400' : 'text-xs text-gray-300';
    });
}

// Handle typing indicator
function handleTyping() {
    if (!db || !auth.currentUser) return;
    
    const userStatusRef = db.collection('status').doc(auth.currentUser.uid);
    
    if (!isTyping) {
        isTyping = true;
        userStatusRef.update({ typing: true });
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        userStatusRef.update({ typing: false });
    }, 3000);
}

// Listen for typing status
function setupTypingListener() {
    if (!db || !auth.currentUser) return;
    
    db.collection('status').onSnapshot((snapshot) => {
        const otherUserTyping = snapshot.docs.some(doc => 
            doc.id !== auth.currentUser.uid && doc.data().typing
        );
        
        typingIndicator.style.display = otherUserTyping ? 'block' : 'none';
    });
}

// Chat Functions
function initializeChat() {
    if (!db) {
        showNotification('Chat features require Firebase setup', 'error');
        return;
    }
    
    lastActivity = Date.now();
    messages = [];
    chatMessages.innerHTML = '';
    setupInactivityTimer();
    setupKeyboardShortcuts();
    setupMessageListeners();
    updateOnlineStatus();
    setupTypingListener();
}

function setupInactivityTimer() {
    const inactivityCheck = setInterval(() => {
        const timeSinceLastActivity = Date.now() - lastActivity;
        if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
            showScreen(timerScreen);
            clearInterval(inactivityCheck);
            showNotification('Chat closed due to inactivity');
        } else if (timeSinceLastActivity > INACTIVITY_TIMEOUT - 60000) {
            showNotification('Chat will close in 1 minute due to inactivity', 'error');
        }
    }, 60000);
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            showScreen(timerScreen);
            showNotification('Chat closed');
        }
    });
}

function setupMessageListeners() {
    if (!db) return;
    
    db.collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot(
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const message = {
                            ...change.doc.data(),
                            id: change.doc.id
                        };
                        if (!messages.some(m => m.id === message.id)) {
                            addMessageToChat(message);
                        }
                    }
                });
            },
            (error) => {
                handleFirebaseError(error, 'listen to messages');
            }
        );
}

function addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.senderId === auth.currentUser?.uid ? 'sent' : 'received'}`;
    
    // Add sender name for received messages
    if (message.senderId !== auth.currentUser?.uid) {
        const senderName = document.createElement('div');
        senderName.className = 'text-xs text-gray-400 mb-1';
        senderName.textContent = message.senderId === 'user1' ? 'You' : 'Your Partner';
        messageElement.appendChild(senderName);
    }
    
    if (message.type === 'text') {
        messageElement.textContent = message.content;
    } else if (message.type === 'image') {
        const img = document.createElement('img');
        img.src = message.content;
        img.className = 'image-message';
        messageElement.appendChild(img);
    } else if (message.type === 'voice') {
        const audio = document.createElement('audio');
        audio.src = message.content;
        audio.controls = true;
        messageElement.appendChild(audio);
    }

    chatMessages.insertBefore(messageElement, chatMessages.firstChild);
    messages.push(message);
}

async function sendMessage(type, content) {
    if (!db || !auth.currentUser) {
        showNotification('Chat features require Firebase setup', 'error');
        return;
    }

    const message = {
        type,
        content,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.uid === 'user1' ? 'You' : 'Your Partner',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const docRef = await db.collection('messages').add(message);
        messageInput.value = '';
    } catch (error) {
        handleFirebaseError(error, 'send message');
    }
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
settingsBtn.addEventListener('click', () => showScreen(settingsScreen));
backBtn.addEventListener('click', () => showScreen(timerScreen));
chatBackBtn.addEventListener('click', () => showScreen(timerScreen));
errorBackBtn.addEventListener('click', () => showScreen(timerScreen));

sendBtn.addEventListener('click', () => {
    const content = messageInput.value.trim();
    if (content) {
        sendMessage('text', content);
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const content = messageInput.value.trim();
        if (content) {
            sendMessage('text', content);
        }
    }
});

sendImageBtn.addEventListener('click', () => {
    if (!db || !auth.currentUser) {
        showNotification('Chat features require Firebase setup', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                sendMessage('image', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

voiceNoteBtn.addEventListener('click', async () => {
    if (!db || !auth.currentUser) {
        showNotification('Chat features require Firebase setup', 'error');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onload = (e) => {
                sendMessage('voice', e.target.result);
            };
            reader.readAsDataURL(audioBlob);
        };

        mediaRecorder.start();
        voiceNoteBtn.classList.add('recording');
        setTimeout(() => {
            mediaRecorder.stop();
            voiceNoteBtn.classList.remove('recording');
        }, 30000);
    } catch (error) {
        console.error('Error accessing microphone:', error);
        showNotification('Failed to access microphone', 'error');
    }
});

deleteChatBtn.addEventListener('click', async () => {
    if (!db || !auth.currentUser) {
        showNotification('Chat features require Firebase setup', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete all messages?')) {
        try {
            const snapshot = await db.collection('messages').get();
            const batch = db.batch();
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            chatMessages.innerHTML = '';
            messages = [];
            showNotification('Chat history deleted');
        } catch (error) {
            handleFirebaseError(error, 'delete messages');
        }
    }
});

// Update activity timestamp
document.addEventListener('mousemove', () => lastActivity = Date.now());
document.addEventListener('keypress', () => lastActivity = Date.now());
document.addEventListener('touchstart', () => lastActivity = Date.now());

// Add event listener for typing
messageInput.addEventListener('input', handleTyping);

// Initialize
initializeSettings();
updateTimer(); 