/* ChowBuy web push (Merchant and Admin) through OneSignal. Reads the provider and App ID from the public config Admin controls, signs the
   device in with the user id (external id) so the server can target the person, and offers a one-tap "Turn on alerts" button because
   browsers (and iPhone Home Screen apps) only allow the permission prompt after a tap. */
(function () {
  var API = { url: 'https://nhaxcyfkbrbwlqbpizjo.supabase.co', anon: 'sb_publishable_fEoqE8u49jwFe1v36CacDg_seaMgyUS' };
  var started = false;
  function jwtSub(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub || ''; } catch (e) { return ''; } }
  function loadSdk() {
    return new Promise(function (ok, bad) {
      if (window.OneSignalDeferred && window.__cbOs) return ok();
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      var s = document.createElement('script'); s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'; s.defer = true;
      s.onload = function () { window.__cbOs = 1; ok(); }; s.onerror = bad; document.head.appendChild(s);
    });
  }
  function banner(OneSignal) {
    if (document.getElementById('cb-push-ask')) return;
    var b = document.createElement('div'); b.id = 'cb-push-ask';
    b.setAttribute('style', 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:14px;background:var(--card,#fff);color:var(--fg,#1f1a17);border:1px solid var(--line,#eadfd7);box-shadow:0 8px 28px rgba(0,0,0,.18);font:600 14px/1.3 system-ui,sans-serif');
    b.innerHTML = '<span>Get new-order alerts on this device</span><span style="display:flex;gap:8px"><button type="button" id="cb-push-no" style="border:0;background:none;color:inherit;opacity:.7;font:inherit;padding:8px">Not now</button><button type="button" id="cb-push-yes" style="border:0;border-radius:10px;background:#ff5a1f;color:#fff;font:inherit;padding:9px 14px">Turn on</button></span>';
    document.body.appendChild(b);
    document.getElementById('cb-push-no').onclick = function () { try { localStorage.setItem('cb-push-dismiss', String(Date.now())); } catch (e) {} b.remove(); };
    document.getElementById('cb-push-yes').onclick = function () { b.remove(); OneSignal.Notifications.requestPermission(); };
  }
  /* opts.token: the signed-in user's access token (JWT). Call again after sign in; it is safe to call many times. */
  function start(opts) {
    var uid = jwtSub((opts && opts.token) || ''); if (!uid || started) return; started = true;
    fetch(API.url + '/rest/v1/rpc/get_public_config', { method: 'POST', headers: { apikey: API.anon, 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) { return r.json(); })
      .then(function (c) {
        var p = (c && c.push) || {}; if (p.provider !== 'onesignal' || !p.onesignalAppId) { started = false; return; }
        return loadSdk().then(function () {
          window.OneSignalDeferred.push(function (OneSignal) {
            OneSignal.init({ appId: p.onesignalAppId, serviceWorkerPath: 'OneSignalSDKWorker.js', serviceWorkerParam: { scope: '/' }, allowLocalhostAsSecureOrigin: true, notifyButton: { enable: false } })
              .then(function () { return OneSignal.login(uid); })
              .then(function () {
                var perm = OneSignal.Notifications.permission, recent = 0; try { recent = +localStorage.getItem('cb-push-dismiss') || 0; } catch (e) {}
                if (!perm && OneSignal.Notifications.permissionNative !== 'denied' && Date.now() - recent > 3 * 864e5) banner(OneSignal);
              });
          });
        });
      }).catch(function () { started = false; });
  }
  function stop() { started = false; try { window.OneSignalDeferred && window.OneSignalDeferred.push(function (O) { O.logout(); }); } catch (e) {} }
  window.cbPushWeb = { start: start, stop: stop };
  /* Self-starting: Merchant and Admin keep their session token in sessionStorage; start once a signed-in user appears, stop when they sign out. */
  var KEYS = ['cb-merch-tok', 'cb-admin-tok'], tick = 0;
  setInterval(function () {
    var t = ''; try { for (var i = 0; i < KEYS.length && !t; i++) t = sessionStorage.getItem(KEYS[i]) || ''; } catch (e) {}
    if (t && !started) start({ token: t }); else if (!t && started) { stop(); }
    tick++;
  }, 3000);
})();
