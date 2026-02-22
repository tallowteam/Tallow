// app.ts — Tallow Web Application
// Main entry point: state machine, WebSocket lifecycle, KEM handshake, UI wiring

import { initWasm, isWasmReady } from './wasm.js';
import {
    WasmKeyPair,
    kemEncapsulate,
    blake3DeriveRoomId,
    blake3Hash,
    hkdfDerive,
    TransferSession,
    encodeRoomJoin,
    encodeHandshakeInit,
    encodeHandshakeResponse,
    encodeHandshakeKem,
    encodeHandshakeComplete,
    encodePing,
    decodeMessage,
} from './wasm.js';

import {
    initTransferUI,
    handleFileSend,
    handleChunkReceived,
    handleTransferComplete,
    handleFileOffer,
    formatBytes,
} from './transfer.js';

import {
    initChatUI,
    destroyChatUI,
    receiveMessage as chatReceiveMessage,
    handlePeerTyping,
} from './chat.js';

import {
    initClipboardUI,
    shareClipboard as clipboardShare,
} from './clipboard.js';

// ============================================================================
// Types
// ============================================================================

type AppState =
    | 'landing'
    | 'code-entry'
    | 'connecting'
    | 'waiting'
    | 'handshake'
    | 'dashboard'
    | 'transferring'
    | 'complete';

type Role = 'sender' | 'receiver';

interface AppContext {
    state: AppState;
    role: Role | null;
    ws: WebSocket | null;
    sessionKey: Uint8Array | null;
    transferSession: any | null; // TransferSession WASM object
    keypair: any | null; // WasmKeyPair WASM object
    codePhrase: string;
    transferId: Uint8Array | null;
    peerFingerprint: string;
    chatCounter: number;
    relayUrl: string;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
}

// ============================================================================
// Globals
// ============================================================================

const ctx: AppContext = {
    state: 'landing',
    role: null,
    ws: null,
    sessionKey: null,
    transferSession: null,
    keypair: null,
    codePhrase: '',
    transferId: null,
    peerFingerprint: '',
    chatCounter: 0,
    relayUrl: 'ws://localhost:4434',
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
};

// Expose context for transfer.ts
export function getContext(): AppContext {
    return ctx;
}

export function getWebSocket(): WebSocket | null {
    return ctx.ws;
}

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
    // Load settings from localStorage
    loadSettings();

    // Check for deep link ?code=...
    const params = new URLSearchParams(window.location.search);
    const deepCode = params.get('code');

    // Initialize WASM
    try {
        await initWasm();
    } catch (e) {
        console.error('Failed to initialize WASM:', e);
        showError('Failed to load encryption module. Please refresh the page.');
        return;
    }

    // Wire up all UI event listeners
    wireEventListeners();

    // Detect online/offline status
    wireOnlineStatus();

    // Initialize theme
    const savedTheme = localStorage.getItem('tallow-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);

    // Handle deep link
    if (deepCode) {
        ctx.role = 'receiver';
        const codeInput = document.getElementById('code-input') as HTMLInputElement;
        if (codeInput) codeInput.value = deepCode;
        setState('code-entry');
    }

    // Initialize transfer UI module
    initTransferUI();
}

// ============================================================================
// State Machine
// ============================================================================

function setState(newState: AppState): void {
    ctx.state = newState;
    updateUI();
}

function updateUI(): void {
    const sections = ['landing', 'code-section', 'handshake-section', 'dashboard'];
    const sectionIds = {
        'landing': 'landing',
        'code-entry': 'code-section',
        'connecting': 'handshake-section',
        'waiting': 'handshake-section',
        'handshake': 'handshake-section',
        'dashboard': 'dashboard',
        'transferring': 'dashboard',
        'complete': 'dashboard',
    };

    // Hide all sections
    for (const id of sections) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }

    // Show the active section
    const activeId = sectionIds[ctx.state];
    if (activeId) {
        const el = document.getElementById(activeId);
        if (el) el.classList.remove('hidden');
    }
}

// ============================================================================
// Event Listeners
// ============================================================================

function wireEventListeners(): void {
    // Role selection
    const btnSend = document.getElementById('btn-send');
    const btnReceive = document.getElementById('btn-receive');
    if (btnSend) btnSend.addEventListener('click', () => {
        ctx.role = 'sender';
        setState('code-entry');
    });
    if (btnReceive) btnReceive.addEventListener('click', () => {
        ctx.role = 'receiver';
        setState('code-entry');
    });

    // Back button
    const btnBack = document.getElementById('btn-back-landing');
    if (btnBack) btnBack.addEventListener('click', () => {
        ctx.role = null;
        setState('landing');
    });

    // Code tabs
    const tabs = document.querySelectorAll('.code-tabs .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = (tab as HTMLElement).dataset.tab;
            if (!tabName) return;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const enterPanel = document.getElementById('tab-enter');
            const genPanel = document.getElementById('tab-generate');
            if (enterPanel) enterPanel.classList.toggle('hidden', tabName !== 'enter');
            if (genPanel) genPanel.classList.toggle('hidden', tabName !== 'generate');
            if (tabName === 'generate') generateCodePhrase();
        });
    });

    // Connect button
    const btnConnect = document.getElementById('btn-connect');
    if (btnConnect) btnConnect.addEventListener('click', () => {
        const input = document.getElementById('code-input') as HTMLInputElement;
        if (input && input.value.trim()) {
            ctx.codePhrase = input.value.trim();
            startConnection();
        }
    });

    // Code input enter key
    const codeInput = document.getElementById('code-input') as HTMLInputElement;
    if (codeInput) codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && codeInput.value.trim()) {
            ctx.codePhrase = codeInput.value.trim();
            startConnection();
        }
    });

    // Wait for peer button
    const btnWait = document.getElementById('btn-wait');
    if (btnWait) btnWait.addEventListener('click', () => {
        const codeEl = document.getElementById('generated-code');
        if (codeEl && codeEl.textContent) {
            ctx.codePhrase = codeEl.textContent;
            startConnection();
        }
    });

    // Theme toggle
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) btnTheme.addEventListener('click', toggleTheme);

    // Settings
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsBackdrop = document.getElementById('settings-backdrop');
    if (btnSettings) btnSettings.addEventListener('click', () => toggleSettings(true));
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => toggleSettings(false));
    if (settingsBackdrop) settingsBackdrop.addEventListener('click', () => toggleSettings(false));

    // Settings save
    const settingRelay = document.getElementById('setting-relay') as HTMLInputElement;
    if (settingRelay) settingRelay.addEventListener('change', () => {
        ctx.relayUrl = settingRelay.value;
        localStorage.setItem('tallow-relay', settingRelay.value);
    });
    const settingTheme = document.getElementById('setting-theme') as HTMLSelectElement;
    if (settingTheme) settingTheme.addEventListener('change', () => {
        setTheme(settingTheme.value);
    });

    // Chat event listeners are wired by chat.ts initChatUI() after handshake

    // Clipboard
    const btnClipboard = document.getElementById('btn-share-clipboard');
    if (btnClipboard) btnClipboard.addEventListener('click', shareClipboard);

    // File transfer buttons
    const btnAccept = document.getElementById('btn-accept');
    const btnReject = document.getElementById('btn-reject');
    if (btnAccept) btnAccept.addEventListener('click', acceptTransfer);
    if (btnReject) btnReject.addEventListener('click', rejectTransfer);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcut);

    // Command palette
    const cmdSearch = document.getElementById('cmd-search') as HTMLInputElement;
    const cmdBackdrop = document.getElementById('cmd-backdrop');
    if (cmdSearch) cmdSearch.addEventListener('input', filterCommands);
    if (cmdBackdrop) cmdBackdrop.addEventListener('click', () => toggleCommandPalette(false));
}

// ============================================================================
// WebSocket Lifecycle
// ============================================================================

function startConnection(): void {
    setState('connecting');
    updateHandshakeStep('connect', 'active');

    const url = ctx.relayUrl;
    try {
        ctx.ws = new WebSocket(url);
        ctx.ws.binaryType = 'arraybuffer';

        ctx.ws.onopen = onWsOpen;
        ctx.ws.onmessage = onWsMessage;
        ctx.ws.onclose = onWsClose;
        ctx.ws.onerror = onWsError;
    } catch (e) {
        showError(`Failed to connect: ${e}`);
        setState('code-entry');
    }
}

function onWsOpen(): void {
    ctx.reconnectAttempts = 0;
    updateHandshakeStep('connect', 'done');
    updateHandshakeStep('waiting', 'active');

    // Derive room ID from code phrase
    const roomId = blake3DeriveRoomId(ctx.codePhrase);

    // Send RoomJoin message
    const joinMsg = encodeRoomJoin(roomId, undefined);
    sendWsBytes(joinMsg);

    setState('waiting');
}

function onWsMessage(event: MessageEvent): void {
    if (!(event.data instanceof ArrayBuffer)) return;

    const data = new Uint8Array(event.data);
    // Strip 4-byte length prefix if present (relay adds it for QUIC interop)
    let payload = data;
    if (data.length > 4) {
        const prefixLen = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
        if (prefixLen === data.length - 4) {
            payload = data.slice(4);
        }
    }

    try {
        const msg = decodeMessage(payload) as any;
        dispatchMessage(msg);
    } catch (e) {
        console.warn('Failed to decode message:', e);
    }
}

function onWsClose(event: CloseEvent): void {
    if (ctx.state === 'transferring') {
        // Auto-reconnect during transfer
        if (ctx.reconnectAttempts < ctx.maxReconnectAttempts) {
            ctx.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, ctx.reconnectAttempts), 30000);
            setTimeout(() => startConnection(), delay);
            updateConnectionDot('connecting');
        } else {
            showError('Connection lost. Please try again.');
            updateConnectionDot('disconnected');
        }
    } else {
        updateConnectionDot('disconnected');
    }
}

function onWsError(event: Event): void {
    console.error('WebSocket error:', event);
}

function sendWsBytes(bytes: Uint8Array): void {
    if (ctx.ws && ctx.ws.readyState === WebSocket.OPEN) {
        ctx.ws.send(bytes);
    }
}

// Export for use by clipboard.ts and chat.ts
export function sendWsBytesExport(bytes: Uint8Array): void {
    sendWsBytes(bytes);
}

// ============================================================================
// Message Dispatch
// ============================================================================

function dispatchMessage(msg: any): void {
    // postcard Message is deserialized by serde-wasm-bindgen as tagged objects
    // The structure varies by variant. We check known key patterns.
    if (msg === 'PeerArrived') {
        onPeerArrived();
    } else if (msg === 'PeerDeparted') {
        showError('Peer disconnected.');
    } else if (msg === 'Ping') {
        // Respond with Pong
        const pong = encodePing(); // encodePong actually
        sendWsBytes(pong);
    } else if (msg === 'Pong') {
        // Keepalive response, ignore
    } else if (typeof msg === 'object' && msg !== null) {
        // Tagged enum variants from serde-wasm-bindgen
        if ('RoomJoined' in msg) {
            const inner = msg.RoomJoined;
            if (inner.peer_present) {
                onPeerArrived();
            }
            // else: waiting for peer
        } else if ('HandshakeInit' in msg) {
            onHandshakeInit(msg.HandshakeInit);
        } else if ('HandshakeResponse' in msg) {
            onHandshakeResponse(msg.HandshakeResponse);
        } else if ('HandshakeKem' in msg) {
            onHandshakeKem(msg.HandshakeKem);
        } else if ('HandshakeComplete' in msg) {
            onHandshakeComplete(msg.HandshakeComplete);
        } else if ('HandshakeFailed' in msg) {
            showError(`Handshake failed: ${msg.HandshakeFailed.reason}`);
        } else if ('FileOffer' in msg) {
            handleFileOffer(msg.FileOffer);
        } else if ('FileAccept' in msg) {
            // Peer accepted our file offer — start sending chunks
            handleFileSend();
        } else if ('FileReject' in msg) {
            showError(`Transfer rejected: ${msg.FileReject.reason}`);
        } else if ('Chunk' in msg) {
            handleChunkReceived(msg.Chunk);
        } else if ('Ack' in msg) {
            // Ack received — could update progress on sender side
        } else if ('TransferComplete' in msg) {
            handleTransferComplete(msg.TransferComplete);
        } else if ('ChatText' in msg) {
            onChatReceived(msg.ChatText);
        } else if ('TypingIndicator' in msg) {
            onTypingIndicator(msg.TypingIndicator);
        }
    }
}

// ============================================================================
// KEM Handshake
// ============================================================================

function onPeerArrived(): void {
    updateHandshakeStep('waiting', 'done');
    updateHandshakeStep('kex', 'active');
    setState('handshake');

    // The sender initiates the handshake
    if (ctx.role === 'sender') {
        initiateHandshake();
    }
    // Receiver waits for HandshakeInit
}

async function initiateHandshake(): Promise<void> {
    // Generate ephemeral keypair
    ctx.keypair = WasmKeyPair.generate();
    const publicKeyBytes = ctx.keypair.publicKeyBytes();

    // Generate random nonce (16 bytes)
    const nonce = new Uint8Array(16);
    crypto.getRandomValues(nonce);

    // CPace placeholder (32 zero bytes — full CPace not implemented in browser yet)
    const cpacePublic = new Uint8Array(32);

    // KEM capabilities (minimal: just hybrid ML-KEM-1024 + X25519)
    const kemCapabilities = new Uint8Array([0, 2]); // Algorithm ID 2

    // Send HandshakeInit
    const initMsg = encodeHandshakeInit(2, kemCapabilities, cpacePublic, nonce);
    sendWsBytes(initMsg);
}

function onHandshakeInit(init: any): void {
    // Receiver gets HandshakeInit: generate keypair, send response
    ctx.keypair = WasmKeyPair.generate();
    const publicKeyBytes = ctx.keypair.publicKeyBytes();

    // Generate random nonce
    const nonce = new Uint8Array(16);
    crypto.getRandomValues(nonce);

    // CPace placeholder
    const cpacePublic = new Uint8Array(32);

    // Send HandshakeResponse with our public key
    const respMsg = encodeHandshakeResponse(2, cpacePublic, publicKeyBytes, nonce);
    sendWsBytes(respMsg);
}

function onHandshakeResponse(resp: any): void {
    // Sender receives response: encapsulate to peer's public key
    const peerPubKey = new Uint8Array(resp.kem_public_key);
    const encapsulated = kemEncapsulate(peerPubKey);
    const ciphertext = encapsulated.ciphertext();
    const sharedSecret = encapsulated.sharedSecret();

    // Derive session key via HKDF
    const sessionKey = hkdfDerive(
        sharedSecret,
        new Uint8Array(0), // no salt
        new TextEncoder().encode('tallow-session-key-v2'),
        32
    );
    ctx.sessionKey = sessionKey;

    // Compute confirmation (BLAKE3 keyed hash of shared secret)
    const confirmation = blake3Hash(
        new Uint8Array([...sharedSecret, ...new TextEncoder().encode('sender-confirm')])
    );

    // Send HandshakeKem with ciphertext and confirmation
    const kemMsg = encodeHandshakeKem(ciphertext, confirmation);
    sendWsBytes(kemMsg);

    // Compute peer fingerprint
    ctx.peerFingerprint = bytesToHex(blake3Hash(peerPubKey).slice(0, 16));
}

function onHandshakeKem(kem: any): void {
    // Receiver: decapsulate to get shared secret
    if (!ctx.keypair) return;

    const ciphertext = new Uint8Array(kem.kem_ciphertext);
    const sharedSecret = ctx.keypair.decapsulate(ciphertext);

    // Derive session key
    const sessionKey = hkdfDerive(
        sharedSecret,
        new Uint8Array(0),
        new TextEncoder().encode('tallow-session-key-v2'),
        32
    );
    ctx.sessionKey = sessionKey;

    // Compute our confirmation
    const confirmation = blake3Hash(
        new Uint8Array([...sharedSecret, ...new TextEncoder().encode('receiver-confirm')])
    );

    // Send HandshakeComplete
    const completeMsg = encodeHandshakeComplete(confirmation);
    sendWsBytes(completeMsg);

    // Handshake complete for receiver
    finishHandshake();
}

function onHandshakeComplete(complete: any): void {
    // Sender: handshake complete
    finishHandshake();
}

function finishHandshake(): void {
    updateHandshakeStep('kex', 'done');
    updateHandshakeStep('ready', 'done');
    updateConnectionDot('connected');

    // Generate random transfer ID
    ctx.transferId = new Uint8Array(16);
    crypto.getRandomValues(ctx.transferId);

    // Create TransferSession
    if (ctx.sessionKey && ctx.transferId) {
        ctx.transferSession = new TransferSession(ctx.sessionKey, ctx.transferId);
    }

    // Initialize chat with session key
    if (ctx.sessionKey) {
        initChatUI(ctx.sessionKey);
    }

    // Initialize clipboard UI
    initClipboardUI();

    // Update peer fingerprint display
    const fpEl = document.getElementById('peer-fingerprint');
    if (fpEl) fpEl.textContent = ctx.peerFingerprint || 'Connected (fingerprint pending)';

    setState('dashboard');
}

// ============================================================================
// Chat (delegated to chat.ts module)
// ============================================================================

function onChatReceived(chatData: any): void {
    chatReceiveMessage(chatData);
}

function onTypingIndicator(data: any): void {
    handlePeerTyping(data);
}

// ============================================================================
// Clipboard (delegated to clipboard.ts module)
// ============================================================================

async function shareClipboard(): Promise<void> {
    await clipboardShare();
}

// ============================================================================
// Transfer Accept/Reject
// ============================================================================

function acceptTransfer(): void {
    if (!ctx.transferSession) return;

    const msg = ctx.transferSession.prepareFileAccept();
    sendWsBytes(msg);

    // Hide offer, show progress
    const offer = document.getElementById('receive-offer');
    const progress = document.getElementById('transfer-progress');
    if (offer) offer.classList.add('hidden');
    if (progress) progress.classList.remove('hidden');

    setState('transferring');
}

function rejectTransfer(): void {
    if (!ctx.transferSession) return;

    const msg = ctx.transferSession.prepareFileReject('User rejected transfer');
    sendWsBytes(msg);

    const offer = document.getElementById('receive-offer');
    if (offer) offer.classList.add('hidden');
}

// ============================================================================
// Handshake UI Helpers
// ============================================================================

function updateHandshakeStep(step: string, status: 'active' | 'done'): void {
    const stepEl = document.querySelector(`.step[data-step="${step}"]`);
    if (!stepEl) return;

    stepEl.classList.remove('active', 'done');
    stepEl.classList.add(status);
}

function updateConnectionDot(status: 'connected' | 'connecting' | 'disconnected'): void {
    const dots = document.querySelectorAll('.connection-dot');
    dots.forEach(dot => {
        dot.classList.remove('connected', 'connecting', 'disconnected');
        dot.classList.add(status);
    });
}

// ============================================================================
// Code Generation
// ============================================================================

function generateCodePhrase(): void {
    // Simple code phrase generation using random numbers and words
    const adjectives = ['alpha', 'beta', 'gamma', 'delta', 'echo', 'foxtrot',
        'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike',
        'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra',
        'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu'];

    const num = Math.floor(Math.random() * 100);
    const w1 = adjectives[Math.floor(Math.random() * adjectives.length)];
    const w2 = adjectives[Math.floor(Math.random() * adjectives.length)];
    const code = `${num}-${w1}-${w2}`;

    const codeEl = document.getElementById('generated-code');
    if (codeEl) codeEl.textContent = code;

    // Generate QR code (simple SVG-based)
    const qrEl = document.getElementById('qr-code');
    if (qrEl) {
        const deepLink = `https://tallow.manisahome.com?code=${encodeURIComponent(code)}`;
        qrEl.innerHTML = generateQRPlaceholder(deepLink);
    }
}

function generateQRPlaceholder(url: string): string {
    // Simple placeholder — in production, use a proper QR library
    // For now, show the URL as a styled link
    return `<div style="padding: 0.5rem; text-align: center; font-size: 0.75rem; color: #64748b; background: #f1f5f9; border-radius: 8px; max-width: 200px;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">&#x25A3;</div>
        <div>QR Code</div>
        <div style="word-break: break-all; margin-top: 0.25rem;">${url}</div>
    </div>`;
}

// ============================================================================
// Theme
// ============================================================================

function toggleTheme(): void {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
}

function setTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tallow-theme', theme);
    updateThemeButton(theme);

    const select = document.getElementById('setting-theme') as HTMLSelectElement;
    if (select) select.value = theme;
}

function updateThemeButton(theme: string): void {
    const btn = document.getElementById('btn-theme');
    if (btn) btn.innerHTML = theme === 'dark' ? '&#x2600;' : '&#x263D;';
}

// ============================================================================
// Settings
// ============================================================================

function toggleSettings(show: boolean): void {
    const panel = document.getElementById('settings-panel');
    const backdrop = document.getElementById('settings-backdrop');
    if (panel) panel.classList.toggle('hidden', !show);
    if (backdrop) backdrop.classList.toggle('hidden', !show);
}

function loadSettings(): void {
    const relay = localStorage.getItem('tallow-relay');
    if (relay) {
        ctx.relayUrl = relay;
        const input = document.getElementById('setting-relay') as HTMLInputElement;
        if (input) input.value = relay;
    }
}

// ============================================================================
// Command Palette
// ============================================================================

const commands = [
    { name: 'Send Files', icon: '\u{1F4E4}', shortcut: 'Ctrl+S', action: () => { toggleCommandPalette(false); if (ctx.state === 'dashboard') triggerFilePicker(); } },
    { name: 'Receive Files', icon: '\u{1F4E5}', action: () => { toggleCommandPalette(false); } },
    { name: 'Share Clipboard', icon: '\u{1F4CB}', shortcut: 'Ctrl+V', action: () => { toggleCommandPalette(false); shareClipboard(); } },
    { name: 'Settings', icon: '\u{2699}', action: () => { toggleCommandPalette(false); toggleSettings(true); } },
    { name: 'Toggle Theme', icon: '\u{1F3A8}', action: () => { toggleCommandPalette(false); toggleTheme(); } },
    { name: 'Disconnect', icon: '\u{26D4}', action: () => { toggleCommandPalette(false); disconnect(); } },
];

function toggleCommandPalette(show: boolean): void {
    const palette = document.getElementById('command-palette');
    const backdrop = document.getElementById('cmd-backdrop');
    const search = document.getElementById('cmd-search') as HTMLInputElement;
    if (palette) palette.classList.toggle('hidden', !show);
    if (backdrop) backdrop.classList.toggle('hidden', !show);
    if (show && search) {
        search.value = '';
        search.focus();
        renderCommands(commands);
    }
}

function filterCommands(): void {
    const search = document.getElementById('cmd-search') as HTMLInputElement;
    if (!search) return;
    const query = search.value.toLowerCase();
    const filtered = commands.filter(c => c.name.toLowerCase().includes(query));
    renderCommands(filtered);
}

function renderCommands(cmds: typeof commands): void {
    const results = document.getElementById('cmd-results');
    if (!results) return;
    results.innerHTML = '';
    for (const cmd of cmds) {
        const item = document.createElement('div');
        item.className = 'cmd-item';
        item.innerHTML = `
            <span class="cmd-icon">${cmd.icon}</span>
            <span>${cmd.name}</span>
            ${cmd.shortcut ? `<span class="cmd-shortcut">${cmd.shortcut}</span>` : ''}
        `;
        item.addEventListener('click', cmd.action);
        results.appendChild(item);
    }
}

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

function handleKeyboardShortcut(e: KeyboardEvent): void {
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl && e.key === 'k') {
        e.preventDefault();
        const palette = document.getElementById('command-palette');
        const isHidden = palette?.classList.contains('hidden');
        toggleCommandPalette(!!isHidden);
    } else if (isCtrl && e.key === 's') {
        e.preventDefault();
        if (ctx.state === 'dashboard') triggerFilePicker();
    } else if (e.key === 'Escape') {
        // Close any open overlay
        toggleCommandPalette(false);
        toggleSettings(false);
    }
}

// ============================================================================
// Online/Offline Detection
// ============================================================================

function wireOnlineStatus(): void {
    const banner = document.getElementById('offline-banner');

    window.addEventListener('offline', () => {
        if (banner) banner.classList.remove('hidden');
    });

    window.addEventListener('online', () => {
        if (banner) banner.classList.add('hidden');
        // Auto-reconnect if was in active session
        if (ctx.state === 'transferring' || ctx.state === 'dashboard') {
            startConnection();
        }
    });
}

// ============================================================================
// Error Display
// ============================================================================

function showError(message: string): void {
    // Simple error display — could be enhanced with toast notifications
    console.error('[Tallow]', message);
    const statusEl = document.getElementById('clipboard-status');
    if (statusEl && ctx.state === 'dashboard') {
        statusEl.textContent = message;
        statusEl.style.color = 'var(--error)';
    }
}

// ============================================================================
// Utility
// ============================================================================

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function triggerFilePicker(): void {
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) input.click();
}

function disconnect(): void {
    if (ctx.ws) {
        ctx.ws.close();
        ctx.ws = null;
    }
    ctx.sessionKey = null;
    ctx.transferSession = null;
    ctx.keypair = null;
    ctx.transferId = null;
    destroyChatUI();
    setState('landing');
}

// ============================================================================
// Start
// ============================================================================

document.addEventListener('DOMContentLoaded', init);
