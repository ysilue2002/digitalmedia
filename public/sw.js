/* QDAY Service Worker (PWA + Push) */

const CACHE_NAME = "qday-static-v1";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/live.html",
  "/history.html",
  "/styles.css",
  "/client.js",
  "/logo-qday.svg",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {})
      .finally(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Stale-while-revalidate for same-origin GET.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => null);
      return cached || (await fetchPromise) || new Response("Offline", { status: 503 });
    })()
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "QDAY", body: "Nouvelle activite." };
  }
  const title = data.title || "QDAY";
  const tag = data.tag || (data.type ? `qday-${data.type}` : "qday");
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag,
    renotify: true,
    vibrate: [80, 40, 80],
    actions: [
      { action: "open", title: "Ouvrir" },
      { action: "reply", title: "Repondre" },
    ],
    timestamp: Date.now(),
    data: {
      url: data.url || "/live.html",
    },
  };
  if (data.imageUrl) options.image = data.imageUrl;
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/live.html";
  event.waitUntil(
    (async () => {
      const clientsArr = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientsArr) {
        if ("focus" in client) {
          try {
            await client.focus();
            client.navigate(url).catch(() => {});
            return;
          } catch {}
        }
      }
      self.clients.openWindow(url).catch(() => {});
    })()
  );
});
