const CACHE = "favorit-platform-v6";
const CORE = ["./", "./index.html", "./styles.css", "./app.js", "./logo.png", "./image.png", "./manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(response => response || caches.match("./index.html")))
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "./#dashboard";
  event.waitUntil(clients.openWindow(url));
});

self.addEventListener("push", event => {
  let payload = { title: "ФК «Фаворит»", body: "У вас нове повідомлення", url: "./#notifications" };
  try { payload = { ...payload, ...event.data.json() }; } catch {}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "./logo.png",
      badge: "./logo.png",
      tag: "favorit-club",
      data: { url: payload.url }
    })
  );
});
