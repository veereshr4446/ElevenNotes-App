/* ElevenNotes service worker: lets the app open offline. Live data (Supabase) and music are never cached. */
const CACHE = 'elevennotes-v1';
const ASSETS = ['./', 'index.html', 'css/style.css', 'js/config.js', 'js/data.js', 'js/app.js', 'manifest.json', 'images/logo.svg', 'images/profile.jpg',
    'images/icon-192.png', 'images/icon-512.png', 'images/avatar-boy-1.jpeg', 'images/avatar-boy-2.jpeg', 'images/avatar-boy-3.jpeg',
    'images/avatar-girl-1.jpeg', 'images/avatar-girl-2.jpeg', 'images/avatar-girl-3.jpeg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
    const r = e.request, u = new URL(r.url);
    if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('.mp3')) return;
    // network first so updates show up straight away; fall back to the saved copy when offline
    e.respondWith(fetch(r).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
        return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
