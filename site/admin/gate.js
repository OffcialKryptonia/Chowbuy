/* ChowBuy Admin gate. Shows only a sign-in form. The console (markup, sample data and scripts) is loaded after
   Supabase confirms the signed-in account is an admin. Real data is protected by the database, not by this page. */
(function(){
'use strict';
var DEFAULT_URL='https://nhaxcyfkbrbwlqbpizjo.supabase.co',DEFAULT_ANON='sb_publishable_fEoqE8u49jwFe1v36CacDg_seaMgyUS';   /* publishable by design */
var BE={url:DEFAULT_URL,anon:DEFAULT_ANON,who:''};
try{var b=JSON.parse(localStorage.getItem('cb-admin-be')||'{}');if(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(b.url||''))BE.url=b.url;if(b.anon&&String(b.anon).length>=20)BE.anon=b.anon;BE.who=b.who||''}catch(e){}
function $(s){return document.querySelector(s)}
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k)||'';if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){return ''}}
function show(which,msg){$('#busy').hidden=which!=='busy';$('#signin').hidden=which!=='form';if(which==='form'){$('#err').textContent=msg||'';var i=BE.who?$('#pw'):$('#em');if(i)i.focus()}}
function api(path,method,body,tok){
  return fetch(BE.url+path,{method:method||'GET',headers:{apikey:BE.anon,Authorization:'Bearer '+(tok||BE.anon),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})
   .then(function(r){return r.text().then(function(t){var j={};try{j=t?JSON.parse(t):{}}catch(e){}if(!r.ok){var e=new Error(j.message||j.msg||j.error_description||j.error||('Request failed ('+r.status+')'));e.status=r.status;throw e}return j})},
    function(){var e=new Error('Could not reach the server. Check your connection and try again.');e.status=0;throw e});
}
function keep(j,email){ss('cb-admin-tok',j.access_token);ss('cb-admin-rt',j.refresh_token||'');if(email){BE.who=email;try{localStorage.setItem('cb-admin-be',JSON.stringify({url:BE.url,anon:BE.anon,who:email}))}catch(e){}}}
function clear(){ss('cb-admin-tok',null);ss('cb-admin-rt',null);ss('cb-admin-mode',null)}
/* An admin account passes admin_me; any other account is refused by the database. */
function verify(tok){return api('/rest/v1/rpc/admin_me','POST',{},tok)}
function refresh(){var rt=ss('cb-admin-rt');if(!rt)return Promise.reject(new Error('no refresh'));return api('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:rt}).then(function(j){keep(j);return j.access_token})}
function loadScript(src){return new Promise(function(ok,no){var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=function(){no(new Error('Could not load '+src))};document.body.appendChild(s)})}
function boot(){
  show('busy');
  return fetch('console.html?v=20261042',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('The console could not be loaded.');return r.text()}).then(function(html){
    $('#gate').hidden=true;var root=$('#root');root.innerHTML=html;root.hidden=false;
    window.__CMS_ADMIN=1;
    return loadScript('../assets/content.js?v=20261022').then(function(){return loadScript('data.js?v=20261022')}).then(function(){return loadScript('admin.js?v=20261043')});
  }).catch(function(e){$('#gate').hidden=false;$('#root').hidden=true;$('#root').innerHTML='';show('form',e.message)});
}
function start(){
  var msg=ss('cb-admin-msg');ss('cb-admin-msg',null);
  var tok=ss('cb-admin-tok');
  if(!tok){show('form',msg);return}
  verify(tok).then(boot,function(e){
    if(e.status===401)return refresh().then(function(t){return verify(t)}).then(boot,function(){clear();show('form','Your session expired. Please sign in again.')});
    if(e.status===0){show('form',e.message);return}
    clear();show('form','This account is not an admin.');
  });
}
$('#f').addEventListener('submit',function(ev){
  ev.preventDefault();
  var em=$('#em').value.trim(),pw=$('#pw').value;
  if(!em||!pw){$('#err').textContent='Enter your email and password.';return}
  var go=$('#go');go.disabled=true;go.textContent='Signing in…';$('#err').textContent='';
  api('/auth/v1/token?grant_type=password','POST',{email:em,password:pw}).then(function(j){
    return verify(j.access_token).then(function(){keep(j,em);ss('cb-admin-mode',null);$('#pw').value='';return boot()},function(e){
      api('/auth/v1/logout','POST',{},j.access_token).catch(function(){});
      throw e.status===0?e:new Error('This account is not an admin.');
    });
  }).catch(function(e){$('#err').textContent=/invalid login/i.test(e.message)?'Wrong email or password.':e.message}).then(function(){go.disabled=false;go.textContent='Sign in'});
});
start();
})();
