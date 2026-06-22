// Self-destroying service worker. Replaces any stale SW left by the previous
// site on koreabylocal.com (same origin). Unregisters itself, clears caches,
// and reloads open clients. Harmless for users who never had a SW here.
self.addEventListener("install", function () {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(function (k) { return caches.delete(k); }));
      } catch (e) {}
      try {
        await self.registration.unregister();
      } catch (e) {}
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach(function (c) { try { c.navigate(c.url); } catch (e) {} });
      } catch (e) {}
    })()
  );
});
