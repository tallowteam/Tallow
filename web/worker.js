"use strict";
// worker.ts — Tallow Service Worker
// Provides offline shell caching and cache versioning for PWA support.
/// <reference lib="WebWorker" />
// TypeScript service worker global scope
const sw = self;
const CACHE_NAME = 'tallow-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/transfer.js',
    '/clipboard.js',
    '/chat.js',
    '/wasm.js',
    '/pkg/tallow_web_bg.wasm',
    '/pkg/tallow_web.js',
    '/manifest.json',
];
// Install: pre-cache all shell assets
sw.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
    // Activate immediately without waiting for old SW to release
    sw.skipWaiting();
});
// Activate: clean up old caches
sw.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k)))).then(() => {
        // Claim clients immediately so refreshed pages use the new SW
        return sw.clients.claim();
    }));
});
// Fetch: network-first for navigation, cache-first for assets
sw.addEventListener('fetch', (event) => {
    const request = event.request;
    // Skip non-GET requests
    if (request.method !== 'GET')
        return;
    // Skip WebSocket upgrade requests
    if (request.headers.get('Upgrade') === 'websocket')
        return;
    if (request.mode === 'navigate') {
        // Network-first for HTML navigation — fall back to cached index.html
        event.respondWith(fetch(request)
            .catch(() => caches.match('/index.html')));
    }
    else {
        // Cache-first for static assets — fall back to network
        event.respondWith(caches.match(request).then(cached => {
            if (cached)
                return cached;
            return fetch(request).then(response => {
                // Cache successful responses for future offline use
                if (response.ok && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, clone);
                    });
                }
                return response;
            });
        }));
    }
});
