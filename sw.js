/**
 * Service worker: makes the app installable and usable with no network.
 *
 * Strategy is stale-while-revalidate: answer from the cache at once, refresh the
 * cached copy in the background. A new deploy therefore shows up on the second
 * visit without bumping a version by hand. Bump CACHE only to drop old entries.
 */

const CACHE = 'fpv-frequency-calc-v2';

const APP_SHELL = [
    './',
    'index.html',
    'manifest.webmanifest',
    'css/styles.css',
    'js/app.js',
    'js/ui.js',
    'js/channels.js',
    'js/interference.js',
    'js/matrix.js',
    'data/channels.json',
    'icons/icon.svg',
    'icons/icon-192.png',
    'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET' || !request.url.startsWith('http')) return;

    event.respondWith(
        caches.open(CACHE).then(async (cache) => {
            const cached = await cache.match(request);
            const refresh = fetch(request)
                .then((response) => {
                    // Opaque responses (cross-origin fonts) are cached too.
                    if (response.ok || response.type === 'opaque') {
                        cache.put(request, response.clone());
                    }
                    return response;
                })
                .catch(() => cached ?? Response.error());

            if (cached) {
                event.waitUntil(refresh);
                return cached;
            }
            return refresh;
        })
    );
});
