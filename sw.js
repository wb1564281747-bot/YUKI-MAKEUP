const CACHE_NAME = "makeup-shop-pwa-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];

// 这些 CDN 资源也缓存，保证离线可打开
const CDN_ASSETS = [
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.css",
  "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([...CORE_ASSETS, ...CDN_ASSETS]);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 仅处理 GET
  if (req.method !== "GET") return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      // 成功则写入缓存
      if (fresh && fresh.status === 200) cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      // 离线兜底：回退到主页
      const fallback = await cache.match("./index.html");
      return fallback || new Response("离线且无缓存。请联网打开一次。", { status: 200 });
    }
  })());
});
