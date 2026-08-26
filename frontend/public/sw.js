const CACHE_NAME = "alkhaleej-static-v3";
const TRANSLATION_CACHE_NAME = "alkhaleej-i18n-v3";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== TRANSLATION_CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-operations") {
    event.waitUntil(processBackgroundSync());
  }
});

async function processBackgroundSync() {
  try {
    const dbRequest = indexedDB.open("AlKhaleejOfflineDB", 1);
    dbRequest.onsuccess = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("pending_queue")) return;
      const tx = db.transaction("pending_queue", "readonly");
      const store = tx.objectStore("pending_queue");
      const getAll = store.getAll();
      getAll.onsuccess = async () => {
        const items = getAll.result || [];
        if (items.length === 0) return;

        try {
          const rawApiUrl = (self.location.origin + "/api").replace(/\/+$/, "");
          const res = await fetch(`${rawApiUrl}/sync/batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          });
          const data = await res.json();
          if (data && data.success && Array.isArray(data.syncedIds)) {
            const delTx = db.transaction("pending_queue", "readwrite");
            const delStore = delTx.objectStore("pending_queue");
            data.syncedIds.forEach((id) => delStore.delete(id));
          }
        } catch (err) {}
      };
    };
  } catch (err) {}
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    return;
  }

  if (!url.protocol.startsWith("http")) return;

  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    return;
  }

  if (
    url.origin !== self.location.origin &&
    !url.hostname.includes("fonts.googleapis.com") &&
    !url.hostname.includes("fonts.gstatic.com")
  ) {
    return;
  }

  if (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      caches.open(TRANSLATION_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return new Response("", { status: 408, statusText: "Offline" });
        }
      })
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match("/index.html");
          return cached || new Response("<!DOCTYPE html><html><body>Offline</body></html>", {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return new Response("", { status: 408, statusText: "Offline" });
        });
    })
  );
});
