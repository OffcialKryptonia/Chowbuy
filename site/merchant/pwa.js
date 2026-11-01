/* ChowBuy Merchant as an installable app (PWA).
   - Name, colours and icons come from Admin > Settings > Merchant app. They are published as a public file in the project's
     brand storage; if that file is missing or unreachable the built-in defaults (manifest.webmanifest) are used.
   - A short "Add to your phone" guide appears at most once a day until the app is installed. */
(function () {
  'use strict';
  var CFG_URL = 'https://nhaxcyfkbrbwlqbpizjo.supabase.co/storage/v1/object/public/brand/pwa/merchant.json';
  var ORIGIN = location.origin, BASE = ORIGIN + '/merchant/';
  var DEF = { name: 'ChowBuy Merchant', short: 'Merchant', description: 'Receive and manage ChowBuy orders.', theme: '#FF5A1F', background: '#FFFFFF',
    prompt: { enabled: true, hours: 24 }, icons: null };
  var LS = { get: function (k) { try { return localStorage.getItem(k) } catch (e) { return null } }, set: function (k, v) { try { localStorage.setItem(k, v) } catch (e) { /* private mode */ } } };
  var cfg = DEF, deferred = null;

  function merge(c) {
    c = c || {};
    return { v: c.v || 0, name: c.name || DEF.name, short: c.short || DEF.short, description: c.description || DEF.description,
      theme: /^#[0-9a-f]{6}$/i.test(c.theme || '') ? c.theme : DEF.theme, background: /^#[0-9a-f]{6}$/i.test(c.background || '') ? c.background : DEF.background,
      prompt: { enabled: !(c.prompt && c.prompt.enabled === false), hours: Math.min(168, Math.max(1, +(c.prompt && c.prompt.hours) || DEF.prompt.hours)) },
      icons: c.icons && c.icons.i192 && c.icons.i512 ? c.icons : null };
  }
  function meta(name, content) {
    var m = document.querySelector('meta[name="' + name + '"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', name); document.head.appendChild(m); }
    m.setAttribute('content', content);
  }
  function apply(c) {
    cfg = merge(c);
    meta('theme-color', cfg.theme); meta('apple-mobile-web-app-title', cfg.short); meta('application-name', cfg.short);
    var at = document.querySelector('link[rel="apple-touch-icon"]');
    if (at && cfg.icons && cfg.icons.apple) at.setAttribute('href', cfg.icons.apple);
    if (!cfg.v) return;   // nothing published from Admin yet: keep the static manifest
    var icons = cfg.icons ? [
      { src: cfg.icons.i192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: cfg.icons.i512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: cfg.icons.maskable || cfg.icons.i512, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ] : [
      { src: BASE + 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: BASE + 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: BASE + 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ];
    var man = { name: cfg.name, short_name: cfg.short, description: cfg.description, id: '/merchant/', start_url: BASE + '?source=pwa', scope: BASE, display: 'standalone',
      display_override: ['standalone', 'minimal-ui'], orientation: 'portrait', background_color: cfg.background, theme_color: cfg.theme, categories: ['business', 'food', 'productivity'], icons: icons };
    try {
      var url = URL.createObjectURL(new Blob([JSON.stringify(man)], { type: 'application/manifest+json' }));
      var l = document.querySelector('link[rel="manifest"]'); if (!l) { l = document.createElement('link'); l.rel = 'manifest'; document.head.appendChild(l); }
      l.setAttribute('href', url);
    } catch (e) { /* keep the static manifest */ }
  }

  /* ---- platform ---- */
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var isSafari = isIOS && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);
  function installed() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true || LS.get('cb-pwa-installed') === '1'; }

  /* ---- icons: real platform marks, drawn as SVG ---- */
  var IC = {
    android: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/></svg>',
    apple: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3.5M8.5 7 12 3.5 15.5 7"/><path d="M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H16"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
    dots: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.9" fill="currentColor"/><circle cx="12" cy="12" r="1.9" fill="currentColor"/><circle cx="12" cy="19" r="1.9" fill="currentColor"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2M12 6v6M9.5 9.5 12 12l2.5-2.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  /* ---- guide ---- */
  var CSS = '.pwa-bg{position:fixed;inset:0;z-index:9998;background:rgba(10,10,12,.55);display:flex;align-items:flex-end;justify-content:center;animation:pwaf .2s ease}' +
    '.pwa-sheet{width:100%;max-width:440px;background:var(--card,#fff);color:var(--fg,#1F1A17);border-radius:22px 22px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -12px 40px rgba(0,0,0,.25);animation:pwau .25s ease;font-family:inherit;line-height:1.35}' +
    '@media(min-width:560px){.pwa-bg{align-items:center}.pwa-sheet{border-radius:22px}}' +
    '.pwa-h{display:flex;gap:12px;align-items:center}.pwa-h img{width:52px;height:52px;border-radius:13px;flex:none}.pwa-h b{display:block;font-size:1.05rem}.pwa-h small{color:var(--muted,#6B625D)}' +
    '.pwa-x{margin-left:auto;background:none;border:0;color:var(--muted,#6B625D);width:36px;height:36px;border-radius:50%;padding:7px;cursor:pointer}.pwa-x:hover{background:rgba(127,127,127,.15)}' +
    '.pwa-p{margin:14px 0 4px;color:var(--muted,#6B625D);font-size:.92rem;line-height:1.45}' +
    '.pwa-os{display:flex;align-items:center;gap:8px;margin:16px 0 6px;font-weight:700;font-size:.9rem}.pwa-os svg{width:20px;height:20px}' +
    '.pwa-st{list-style:none;margin:0;padding:0;display:grid;gap:10px}.pwa-st li{display:flex;gap:12px;align-items:center;font-size:.93rem;line-height:1.35}' +
    '.pwa-n{flex:none;width:26px;height:26px;border-radius:50%;background:rgba(255,90,31,.14);color:#D94A0F;font-weight:800;font-size:.8rem;display:grid;place-items:center}' +
    '.pwa-i{flex:none;width:34px;height:34px;border-radius:10px;border:1px solid var(--line,#E4DAD3);display:grid;place-items:center;color:var(--fg,#1F1A17)}.pwa-i svg{width:20px;height:20px}' +
    '.pwa-act{display:flex;gap:10px;margin-top:18px}.pwa-act button{flex:1;border-radius:999px;padding:.8rem 1rem;font:inherit;font-weight:700;cursor:pointer;border:1px solid var(--line,#E4DAD3);background:transparent;color:inherit}' +
    '.pwa-act .pri{background:#FF5A1F;border-color:#FF5A1F;color:#fff}' +
    '.pwa-link{background:none;border:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;padding:0}' +
    '@keyframes pwau{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}@keyframes pwaf{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion:reduce){.pwa-bg,.pwa-sheet{animation:none}}';
  function css() { if (document.getElementById('pwa-css')) return; var s = document.createElement('style'); s.id = 'pwa-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function step(n, icon, html) { return '<li><span class="pwa-n">' + n + '</span><span class="pwa-i">' + icon + '</span><span>' + html + '</span></li>'; }

  function body() {
    var out = '';
    if (isIOS) {
      out += '<div class="pwa-os">' + IC.apple + 'iPhone and iPad</div><ul class="pwa-st">' +
        step(1, IC.share, 'Tap the <b>Share</b> button' + (isSafari ? ' at the bottom of Safari' : ' in your browser') + '.') +
        step(2, IC.plus, 'Scroll down and tap <b>Add to Home Screen</b>.') +
        step(3, IC.phone, 'Tap <b>Add</b>. Open ' + esc(cfg.short) + ' from your home screen.') + '</ul>' +
        (isSafari ? '' : '<p class="pwa-p">Tip: if you do not see Add to Home Screen, open this page in Safari.</p>');
    } else if (isAndroid) {
      out += '<div class="pwa-os">' + IC.android + 'Android</div><ul class="pwa-st">' +
        step(1, IC.dots, 'Tap the <b>menu</b> in Chrome (three dots).') +
        step(2, IC.phone, 'Tap <b>Install app</b> or <b>Add to Home screen</b>.') +
        step(3, IC.plus, 'Tap <b>Install</b>. Open ' + esc(cfg.short) + ' from your home screen.') + '</ul>';
    } else {
      out += '<div class="pwa-os">' + IC.phone + 'On your computer</div><ul class="pwa-st">' + step(1, IC.plus, 'Click the <b>Install</b> icon at the right of the address bar, then <b>Install</b>.') + '</ul>' +
        '<div class="pwa-os">' + IC.android + IC.apple + 'On your phone</div><p class="pwa-p" style="margin-top:0">Open this page on your phone to see the steps for Android or iPhone.</p>';
    }
    return out;
  }
  function close() { var b = document.getElementById('pwa-bg'); if (b) { b.remove(); document.removeEventListener('keydown', onKey); if (prevFocus && prevFocus.focus) try { prevFocus.focus() } catch (e) { /* gone */ } } }
  var prevFocus = null;
  function onKey(e) { if (e.key === 'Escape') close(); }
  function show(manual) {
    if (document.getElementById('pwa-bg')) return;
    if (installed() && !manual) return;
    if (!manual && !isIOS && !isAndroid && !deferred) return;   // desktop: only when the browser offers a real install
    css(); prevFocus = document.activeElement;
    var icon = (cfg.icons && cfg.icons.i192) || BASE + 'icons/icon-192.png';
    var bg = document.createElement('div'); bg.className = 'pwa-bg'; bg.id = 'pwa-bg';
    bg.innerHTML = '<div class="pwa-sheet" role="dialog" aria-modal="true" aria-labelledby="pwa-t"><div class="pwa-h"><img src="' + esc(icon) + '" alt="" width="52" height="52"><div><b id="pwa-t">Add ' + esc(cfg.name) + ' to your phone</b><small>Works like an app. No download from a store.</small></div>' +
      '<button type="button" class="pwa-x" data-pwa="later" aria-label="Close">' + IC.x + '</button></div>' +
      '<p class="pwa-p">Get new orders faster, with the order bell, a full-screen view and one tap from your home screen.</p>' + body() +
      '<div class="pwa-act"><button type="button" data-pwa="later">Maybe later</button>' + (deferred ? '<button type="button" class="pri" data-pwa="install">Install app</button>' : '<button type="button" class="pri" data-pwa="later">Got it</button>') + '</div></div>';
    bg.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-pwa]') : null;
      if (e.target === bg) return close();
      if (!t) return;
      if (t.getAttribute('data-pwa') === 'install' && deferred) { var d = deferred; deferred = null; d.prompt(); d.userChoice.then(function (r) { if (r && r.outcome === 'accepted') LS.set('cb-pwa-installed', '1'); close(); }, close); return; }
      close();
    });
    document.body.appendChild(bg); document.addEventListener('keydown', onKey);
    var f = bg.querySelector('.pri') || bg.querySelector('button'); if (f) f.focus();
    if (!manual) LS.set('cb-pwa-last', String(Date.now()));
  }
  function due() { if (!cfg.prompt.enabled || installed()) return false; var last = +LS.get('cb-pwa-last') || 0; return Date.now() - last >= cfg.prompt.hours * 3600e3; }

  /* ---- boot ---- */
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', function () { LS.set('cb-pwa-installed', '1'); deferred = null; close(); });
  try { var cached = JSON.parse(LS.get('cb-pwa-cfg') || 'null'); if (cached) apply(cached); else apply(DEF); } catch (e) { apply(DEF); }
  if (window.fetch) fetch(CFG_URL + '?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && typeof j === 'object') { LS.set('cb-pwa-cfg', JSON.stringify(j)); apply(j); } }).catch(function () { /* defaults stay */ });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/merchant/sw.js', { scope: '/merchant/' }).catch(function () { /* optional */ }); });
  }
  window.addEventListener('load', function () { setTimeout(function () { if (due()) show(false); }, 4000); });
  window.cbPwa = { show: function () { show(true); }, installed: installed };
})();
