// TravelHub Service Worker — Push notifications + offline cache

const CACHE_NAME = "travelhub-v1";

// Install: no pre-caching (dynamic caching only)
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Push notification received
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "TravelHub";
  const options = {
    body: data.body || "Новое уведомление",
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",
    data: data.url || "/",
    tag: data.tag || "travelhub-notification",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification clicked — open the URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Fetch: network-first with cache fallback (same-origin only)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;

  // Only cache same-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
