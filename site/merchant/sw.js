/* ChowBuy Merchant service worker. Network first, so the portal is always current; the cache only answers when the network is gone.
   Cross-origin calls (Supabase, storage, fonts) are never touched, so orders and sign-in are always live. */
var CACHE = 'cb-merchant-v1';
var SHELL = ['/merchant/', '/merchant/offline.html', '/merchant/icons/icon-192.png', '/merchant/sounds/new-order.mp3'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  if (u.pathname.indexOf('/merchant/') !== 0 && u.pathname.indexOf('/assets/') !== 0) return;
  e.respondWith(
    fetch(r).then(function (res) {
      if (res && res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(r).then(function (hit) {
        if (hit) return hit;
        if (r.mode === 'navigate') return caches.match('/merchant/offline.html');
        return Response.error();
      });
    })
  );
});
