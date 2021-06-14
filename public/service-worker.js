const APP_PREFIX = 'Budget-Tracker';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "db.js",
    "favicon.ico",
    "index.js",
    "styles.css",
    ".manifest.webmanifest",
    "service-worker.js",
    "maskable_icon.png",
    "/icons/maskable_icon_x512.png",
    "/icons/maskable_icon_x384.png",
    "/icons/maskable_icon_x192.png",
    "/icons/maskable_icon_x128.png",
    "/icons/maskable_icon_x96.png",
    "/icons/maskable_icon_x72.png",
    "/icons/maskable_icon_x48.png",
];
const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1'

//Installation
self.addEventListener("install", function (evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("your files were pre-cached successfully");
                cache.addAll(FILES_TO_CACHE)
                    .then((result) => {
                        //debugger;
                        console.log("result of add all", result);
                    })
                    .catch((err) => {
                        //debugger;
                        console.log("Add all error: ", err);
                    });
            })
            .catch((err) => {
                console.log(err);
            })
    );
    self.skipWaiting();
});

//activate
self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.Clients.claim();
});

//fetch
self.addEventListener("fetch", function (evt) {
    if (evt.request.url.includes("/api/")) {
        evt.respondWith(
            caches
                .open(DATA_CACHE_NAME)
                .then((cache) => {
                    return fetch(evt.request)
                        .then((response) => {
                            //if response good clone it and store it in cache
                            if (response.status === 200) {
                                cache.put(evt.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch((err) => {
                            //network request failed try to get it from the cache
                            return cache.match(evt.request);
                        });
                })
                .catch((err) => console.log(err))
        );
        return;
    }
    evt.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(evt.request).then((response) => {
                return response || fetch(evt.request);
            });
        })
    );
});