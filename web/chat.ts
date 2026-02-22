// chat.ts -- Chat UI with real-time messaging, typing indicators, emoji, and sanitization
// All received text is sanitized via WASM sanitize_display_text + HTML escaping (WEB-15)
// Chat history stored in sessionStorage only (WEB-14 security)

import { getContext, sendWsBytesExport } from './app.js';
import {
    ChatSession,
    encryptChatMessage,
    decryptChatMessage,
    encodeChatText,
    encodeTypingIndicator,
    sanitizeDisplayText,
} from './wasm.js';

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
    sender: 'me' | 'peer';
    text: string;
    timestamp: number;
}

interface ChatState {
    messages: ChatMessage[];
    chatSession: ChatSession | null;
    typingTimer: ReturnType<typeof setTimeout> | null;
    peerTyping: boolean;
    peerTypingTimer: ReturnType<typeof setTimeout> | null;
    sendCounter: number;
    emojiPickerVisible: boolean;
}

// ============================================================================
// State
// ============================================================================

const state: ChatState = {
    messages: [],
    chatSession: null,
    typingTimer: null,
    peerTyping: false,
    peerTypingTimer: null,
    sendCounter: 0,
    emojiPickerVisible: false,
};

// Common emoji grid (50 emojis for the fallback picker)
const EMOJI_LIST = [
    '\u{1f600}', '\u{1f603}', '\u{1f604}', '\u{1f601}', '\u{1f606}',
    '\u{1f605}', '\u{1f602}', '\u{1f923}', '\u{1f60a}', '\u{1f607}',
    '\u{1f609}', '\u{1f60d}', '\u{1f618}', '\u{1f617}', '\u{1f61a}',
    '\u{1f619}', '\u{1f60b}', '\u{1f61b}', '\u{1f61c}', '\u{1f92a}',
    '\u{1f914}', '\u{1f928}', '\u{1f610}', '\u{1f611}', '\u{1f644}',
    '\u{1f62c}', '\u{1f925}', '\u{1f60c}', '\u{1f614}', '\u{1f62a}',
    '\u{1f634}', '\u{1f637}', '\u{1f912}', '\u{1f915}', '\u{1f922}',
    '\u{1f44d}', '\u{1f44e}', '\u{1f44b}', '\u{1f44f}', '\u{1f64f}',
    '\u{2764}',  '\u{1f494}', '\u{1f495}', '\u{1f525}', '\u{2b50}',
    '\u{1f389}', '\u{1f38a}', '\u{1f4af}', '\u{2714}',  '\u{274c}',
];

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize chat UI. Called after KEM handshake completes.
 * Creates a ChatSession from the session key.
 */
export function initChatUI(sessionKey: Uint8Array): void {
    state.chatSession = new ChatSession(sessionKey);
    state.messages = [];
    state.sendCounter = 0;

    // Load chat history from sessionStorage (if resuming)
    loadChatHistory();

    // Wire event listeners
    wireChatEvents();
}

/**
 * Clean up chat session on disconnect.
 */
export function destroyChatUI(): void {
    // Clear sessionStorage chat history
    sessionStorage.removeItem('tallow-chat-history');
    state.messages = [];
    state.chatSession = null;
    state.sendCounter = 0;

    // Clear typing indicators
    if (state.typingTimer) clearTimeout(state.typingTimer);
    if (state.peerTypingTimer) clearTimeout(state.peerTypingTimer);
}

// ============================================================================
// Event Wiring
// ============================================================================

function wireChatEvents(): void {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const btnSendChat = document.getElementById('btn-send-chat');
    const btnEmoji = document.getElementById('btn-emoji');

    if (chatInput) {
        chatInput.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Typing indicator: debounce 300ms
        chatInput.addEventListener('input', () => {
            handleTypingInput();
        });
    }

    if (btnSendChat) {
        btnSendChat.addEventListener('click', () => sendMessage());
    }

    if (btnEmoji) {
        btnEmoji.addEventListener('click', () => toggleEmojiPicker());
    }
}

// ============================================================================
// Send Message
// ============================================================================

/**
 * Encrypt and send a chat message.
 */
function sendMessage(): void {
    const input = document.getElementById('chat-input') as HTMLInputElement;
    if (!input || !input.value.trim() || !state.chatSession) return;

    const ctx = getContext();
    if (!ctx.sessionKey) return;

    const text = input.value.trim();
    input.value = '';

    // Get counter before encryption (for nonce construction)
    const counter = state.chatSession.sendCounter();

    // Encrypt via ChatSession (auto-increments send counter by 2)
    const ciphertext = state.chatSession.encryptMessage(text);

    // Build nonce from counter for the wire message
    const nonce = new Uint8Array(12);
    const counterView = new DataView(new ArrayBuffer(8));
    counterView.setBigUint64(0, BigInt(counter));
    nonce.set(new Uint8Array(counterView.buffer), 4);

    // Generate message ID
    const messageId = new Uint8Array(16);
    crypto.getRandomValues(messageId);

    // Encode as ChatText wire message
    const chatMsg = encodeChatText(messageId, counter, ciphertext, nonce);
    sendWsBytesExport(chatMsg);

    // Display locally
    addMessage('me', text);

    // Stop typing indicator
    sendTypingIndicator(false);
    state.sendCounter++;
}

// ============================================================================
// Receive Message
// ============================================================================

/**
 * Handle an incoming ChatText message from the peer.
 * Decrypts, sanitizes, and displays the message.
 */
export function receiveMessage(chatData: any): void {
    if (!state.chatSession) return;

    const ctx = getContext();
    if (!ctx.sessionKey) return;

    try {
        const ciphertext = new Uint8Array(chatData.ciphertext);
        const nonce = new Uint8Array(chatData.nonce);

        // Decrypt using the explicit nonce from the wire message
        // (matches CLI behavior: the nonce is carried in the ChatText message)
        const plaintext = state.chatSession.decryptMessageWithNonce(ciphertext, nonce);

        // WASM sanitization (strips ANSI escapes and control chars) -- WEB-15
        const sanitized = sanitizeDisplayText(plaintext);

        addMessage('peer', sanitized);

        // Clear typing indicator when message received
        setPeerTyping(false);
    } catch (e) {
        console.error('Failed to decrypt chat message:', e);
    }
}

// ============================================================================
// Typing Indicators (WEB-16)
// ============================================================================

/**
 * Handle local typing input. Debounces 300ms, sends typing=true.
 * After 2 seconds of no typing, sends typing=false.
 */
function handleTypingInput(): void {
    // Send typing=true (debounced -- only send if not already typing)
    if (!state.typingTimer) {
        sendTypingIndicator(true);
    }

    // Clear existing timer
    if (state.typingTimer) clearTimeout(state.typingTimer);

    // Set timer to send typing=false after 2 seconds of inactivity
    state.typingTimer = setTimeout(() => {
        sendTypingIndicator(false);
        state.typingTimer = null;
    }, 2000);
}

function sendTypingIndicator(typing: boolean): void {
    try {
        const msg = encodeTypingIndicator(typing);
        sendWsBytesExport(msg);
    } catch (_e) {
        // Ignore errors for optional typing indicators
    }
}

/**
 * Handle incoming typing indicator from peer.
 */
export function handlePeerTyping(data: any): void {
    setPeerTyping(!!data.typing);
}

function setPeerTyping(typing: boolean): void {
    state.peerTyping = typing;

    const el = document.getElementById('typing-indicator');
    if (el) {
        el.classList.toggle('hidden', !typing);
    }

    // Auto-clear after 5 seconds (in case we miss the stop indicator)
    if (typing) {
        if (state.peerTypingTimer) clearTimeout(state.peerTypingTimer);
        state.peerTypingTimer = setTimeout(() => {
            setPeerTyping(false);
        }, 5000);
    } else {
        if (state.peerTypingTimer) {
            clearTimeout(state.peerTypingTimer);
            state.peerTypingTimer = null;
        }
    }
}

// ============================================================================
// Message Display
// ============================================================================

function addMessage(sender: 'me' | 'peer', text: string): void {
    const msg: ChatMessage = {
        sender,
        text,
        timestamp: Date.now(),
    };

    state.messages.push(msg);
    renderMessage(msg);
    scrollToBottom();

    // Store in sessionStorage (NOT localStorage -- WEB-14 security)
    saveChatHistory();
}

function renderMessage(msg: ChatMessage): void {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${msg.sender === 'me' ? 'sent' : 'received'}`;

    const textEl = document.createElement('div');
    textEl.className = 'msg-text';
    // HTML escaping for XSS prevention (double sanitization: WASM + HTML escape)
    textEl.textContent = msg.text; // textContent auto-escapes HTML

    const timeEl = document.createElement('div');
    timeEl.className = 'msg-time';
    timeEl.textContent = formatTime(msg.timestamp);

    msgEl.appendChild(textEl);
    msgEl.appendChild(timeEl);
    container.appendChild(msgEl);
}

function renderAllMessages(): void {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.innerHTML = '';

    for (const msg of state.messages) {
        renderMessage(msg);
    }

    scrollToBottom();
}

function scrollToBottom(): void {
    const container = document.getElementById('chat-messages');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

// ============================================================================
// Emoji Picker
// ============================================================================

function toggleEmojiPicker(): void {
    state.emojiPickerVisible = !state.emojiPickerVisible;

    const picker = document.getElementById('emoji-picker');
    if (!picker) return;

    if (state.emojiPickerVisible) {
        picker.classList.remove('hidden');
        renderEmojiGrid();
    } else {
        picker.classList.add('hidden');
    }
}

function renderEmojiGrid(): void {
    const grid = document.getElementById('emoji-grid');
    if (!grid) return;

    // Only render once
    if (grid.children.length > 0) return;

    for (const emoji of EMOJI_LIST) {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.textContent = emoji;
        btn.title = emoji;
        btn.addEventListener('click', () => {
            insertEmoji(emoji);
        });
        grid.appendChild(btn);
    }
}

function insertEmoji(emoji: string): void {
    const input = document.getElementById('chat-input') as HTMLInputElement;
    if (!input) return;

    // Insert at cursor position
    const start = input.selectionStart || input.value.length;
    const end = input.selectionEnd || input.value.length;
    input.value = input.value.substring(0, start) + emoji + input.value.substring(end);

    // Move cursor after emoji
    input.selectionStart = input.selectionEnd = start + emoji.length;
    input.focus();

    // Close picker
    toggleEmojiPicker();
}

// ============================================================================
// Chat History (sessionStorage only -- WEB-14)
// ============================================================================

function saveChatHistory(): void {
    try {
        // Only keep last 200 messages in sessionStorage
        const toStore = state.messages.slice(-200);
        sessionStorage.setItem('tallow-chat-history', JSON.stringify(toStore));
    } catch (_e) {
        // sessionStorage full or unavailable -- silently ignore
    }
}

function loadChatHistory(): void {
    try {
        const stored = sessionStorage.getItem('tallow-chat-history');
        if (stored) {
            state.messages = JSON.parse(stored);
            renderAllMessages();
        }
    } catch (_e) {
        state.messages = [];
    }
}

// ============================================================================
// Utilities
// ============================================================================

function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}
