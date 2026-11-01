/* ChowBuy Merchant: sign in, register, onboard, and hand over to the dashboard.
   Everything sensitive is enforced by the database (row-level security and checked functions); this page only collects and displays.
   Routes are hash routes (static hosting): #/login, #/signup, #/signup/business-type, #/onboarding/<step>, #/application-status, #/workspaces. */
(function(){
'use strict';
var API={url:'https://nhaxcyfkbrbwlqbpizjo.supabase.co',anon:'sb_publishable_fEoqE8u49jwFe1v36CacDg_seaMgyUS'};   /* publishable by design */
var REDIRECT='https://chowbuy.ng/auth';
function $(s,r){return (r||document).querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k)||'';if(v===null||v==='')sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){return ''}}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k)||'';if(v===null||v==='')localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return ''}}
var IC={
 store:'<path d="m3 9 1.5-5h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
 cart:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6"/>',
 pill:'<path d="m10.5 20.5-7-7a4.9 4.9 0 0 1 7-7l7 7a4.9 4.9 0 0 1-7 7zM8.5 8.5l7 7"/>',
 truck:'<path d="M1 3h13v13H1zM14 8h5l3 3v5h-8"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 alert:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',xc:'<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
 pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',up:'<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>'
};
function ic(n){return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">'+(IC[n]||IC.check)+'</svg>'}
function toast(m,type){var b=$('#atoasts');if(!b)return;var t=document.createElement('div');t.className='toast'+(type==='err'?' err':'');t.innerHTML=ic(type==='err'?'xc':'check')+'<span></span>';t.lastChild.textContent=m;while(b.children.length>2)b.removeChild(b.firstChild);b.appendChild(t);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},4200)}

/* ---------- types, labels ---------- */
var TYPES=[
 {k:'RESTAURANT',n:'Restaurant',i:'store',d:'Restaurants, food vendors, cafés, quick-service restaurants, bakeries and other eligible food-service businesses.'},
 {k:'GROCERY_SUPERMARKET',n:'Groceries / Super Mart',i:'cart',d:'Supermarkets, grocery stores, minimarts, foodstuff retailers and household-essentials merchants.'},
 {k:'PHARMACY',n:'Pharmacy',i:'pill',d:'Eligible pharmacies and authorised pharmaceutical retailers, subject to licensing and regulatory verification.'},
 {k:'PACKAGE_LOGISTICS',n:'Package & Logistics',i:'truck',d:'Parcel delivery, package dispatch, logistics providers and eligible delivery businesses.'}
];
function typeOf(k){for(var i=0;i<TYPES.length;i++)if(TYPES[i].k===k)return TYPES[i];return TYPES[0]}
var STATUS={DRAFT:['Draft','warn'],EMAIL_VERIFICATION_PENDING:['Verify email','warn'],SUBMITTED:['Submitted','info'],UNDER_REVIEW:['Under review','info'],ACTION_REQUIRED:['Action required','warn'],APPROVED:['Approved','ok'],REJECTED:['Not approved','bad'],SUSPENDED:['Suspended','bad']};
function pill(st){var s=STATUS[st]||[st,''];return '<span class="pill '+s[1]+'">'+esc(s[0])+'</span>'}
var DOCS={owner_id:['Owner’s government ID','NIN slip, passport, driver’s licence or voter’s card'],cac:['CAC registration certificate','Certificate of incorporation or business name'],food_permit:['Food business permit','NAFDAC or food handler certificate, or your state food permit'],
 pcn_premises:['Pharmacy premises licence','Current premises licence from the Pharmacists Council of Nigeria (PCN)'],pharmacist_licence:['Responsible pharmacist’s licence','Current practising licence of your superintendent pharmacist'],
 operating_permit:['Operating permit (optional)','Any permit that covers your dispatch or courier operation'],vehicle_docs:['Vehicle documents (optional)','Registration papers for your delivery vehicles'],logo:['Business logo (optional)','Square image, at least 400 pixels'],tin:['Tax ID (optional)','TIN certificate']};
var OPTIONAL=['operating_permit','vehicle_docs','logo','tin'];
var STATES=['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
var BANKS=['Access Bank','Citibank Nigeria','Ecobank Nigeria','Fidelity Bank','First Bank of Nigeria','First City Monument Bank (FCMB)','Globus Bank','Guaranty Trust Bank (GTBank)','Heritage Bank','Keystone Bank','Kuda Microfinance Bank','Moniepoint Microfinance Bank','OPay','PalmPay','Polaris Bank','Providus Bank','Stanbic IBTC Bank','Standard Chartered Bank','Sterling Bank','Union Bank of Nigeria','United Bank for Africa (UBA)','Unity Bank','Wema Bank','Zenith Bank'];
var STEPS=[['business','Business information'],['owner','Owner or representative'],['location','Location'],['specific','Business details'],['documents','Documents'],['settlement','Payout account'],['review','Review and submit']];

/* ---------- network ---------- */
var ME=null,APP=null,CURID='',off=false;   /* off: the dashboard owns the page, so this script stops listening */
function raw(path,method,body,tok){
  return fetch(API.url+path,{method:method||'GET',headers:{apikey:API.anon,Authorization:'Bearer '+(tok||API.anon),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})
   .then(function(r){return r.text().then(function(t){var j={};try{j=t?JSON.parse(t):{}}catch(e){}
     if(!r.ok){var e=new Error(j.message||j.msg||j.error_description||j.error||('Request failed ('+r.status+')'));e.status=r.status;e.code=j.error_code||j.code||'';throw e}return j})},
   function(){var e=new Error('Could not reach the server. Check your connection and try again.');e.status=0;throw e});
}
var refreshing=null;
function keep(j,remember){ss('cb-merch-tok',j.access_token);ss('cb-merch-rt',j.refresh_token||'');if(remember===true)ls('cb-merch-rt',j.refresh_token||'');else if(remember===false)ls('cb-merch-rt',null);else if(ls('cb-merch-rt'))ls('cb-merch-rt',j.refresh_token||'')}
function clearSession(){ss('cb-merch-tok',null);ss('cb-merch-rt',null);ss('cb-merch-store',null);ls('cb-merch-rt',null)}
function refresh(){
  var rt=ss('cb-merch-rt')||ls('cb-merch-rt');if(!rt)return Promise.reject(new Error('no refresh token'));
  if(!refreshing)refreshing=raw('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:rt}).then(function(j){keep(j);refreshing=null;return j.access_token},function(e){refreshing=null;throw e});
  return refreshing;
}
function api(path,method,body,retried){
  var tok=ss('cb-merch-tok');
  return raw(path,method,body,tok).catch(function(e){
    if(e.status===401&&tok&&!retried)return refresh().then(function(){return api(path,method,body,true)},function(){sessionEnded();throw e});
    throw e});
}
function rpc(fn,args){return api('/rest/v1/rpc/'+fn,'POST',args||{})}
function sessionEnded(){clearSession();ME=null;APP=null;ss('cb-merch-msg','Your session expired. Please sign in again.');go('/login')}
function friendly(e){var m=e&&e.message||'Something went wrong.';if(/invalid login/i.test(m))return 'Wrong email or password.';if(/email not confirmed/i.test(m))return 'Verify your email first. We sent you a link when you registered.';if(/rate limit|too many/i.test(m))return 'Too many attempts. Please wait a few minutes and try again.';return m}

/* ---------- routing ---------- */
function path(){var h=location.hash.replace(/^#/,'').split('?')[0];return h||'/'}
function go(p){if(location.hash==='#'+p)route();else location.hash='#'+p}
function set(html,wide){var m=$('#au');m.innerHTML=html;try{m.focus({preventScroll:true})}catch(e){}window.scrollTo(0,0)}
function head(){var w=$('#who');if(ME){w.hidden=false;w.innerHTML='<span>'+esc(ME.email)+'</span><button type="button" class="btn sm" data-act="signout">Sign out</button>'}else{w.hidden=true;w.innerHTML=''}}
var PUBLIC={'/':1,'/login':1,'/signup':1,'/forgot':1,'/verify':1};
function route(){
  var p=path();head();
  if(!ss('cb-merch-tok')&&!ls('cb-merch-rt')){ME=null;if(!PUBLIC[p]){ss('cb-merch-next',p);return go('/login')}return view(p)}
  if(ME)return view(p);
  set('<div class="au-busy" role="status"><span class="sk"></span>Checking your account…</div>');
  (ss('cb-merch-tok')?Promise.resolve():refresh()).then(function(){return rpc('merchant_me')}).then(function(me){ME=me;head();return view(p)},function(e){
    if(e.status===0){set(card('<h1>Can’t reach ChowBuy</h1><p class="lead">'+esc(e.message)+'</p><button type="button" class="btn pri" data-act="retry">Try again</button>'));return}
    clearSession();ME=null;head();if(PUBLIC[p])view(p);else{ss('cb-merch-next',p);go('/login')}});
}
function card(inner,cls){return '<section class="au-card'+(cls?' '+cls:'')+'">'+inner+'</section>'}
function view(p){
  if(!ME){
    if(p==='/signup')return vSignup();if(p==='/login')return vLogin();if(p==='/forgot')return vForgot();if(p==='/verify')return vVerify(ss('cb-merch-pending'));return vEntry();
  }
  if(p==='/'||p==='/login'||p==='/signup'||p==='/verify'||p==='/forgot')return landing();
  if(p==='/workspaces')return vWorkspaces();
  if(p==='/signup/business-type')return vTypes();
  if(p==='/application-status')return withApp(vStatus);
  if(p==='/onboarding')return withApp(function(){go('/onboarding/'+nextStep())});
  var m=p.match(/^\/onboarding\/([a-z]+)$/);if(m&&STEPS.some(function(s){return s[0]===m[1]}))return withApp(function(){vStep(m[1])});
  landing();
}
/* Where should a signed-in account go? One approved business: its dashboard. One application: its next screen. Several: choose. None: register. */
function destFor(w){if(w.status==='APPROVED')return 'dash:'+w.id;if(w.status==='DRAFT'||w.status==='ACTION_REQUIRED')return '/onboarding';return '/application-status'}
function landing(){
  var next=ss('cb-merch-next');
  if(!ME.emailConfirmed){return vVerify(ME.email,true)}
  var ws=ME.workspaces||[],inv=ME.invitations||[];
  if(!ws.length&&!inv.length)return go('/signup/business-type');
  if(ws.length===1&&!inv.length)return open(ws[0]);
  if(next&&next!=='/'&&next!=='/login'){ss('cb-merch-next',null);return go(next)}
  go('/workspaces');
}
function open(w){CURID=w.id;ss('cb-merch-store',w.id);var d=destFor(w);if(d.indexOf('dash:')===0)return dashboard(w);go(d)}
function withApp(fn){
  if(!CURID||!(ME.workspaces||[]).some(function(w){return w.id===CURID}))CURID=ss('cb-merch-store')||((ME.workspaces||[])[0]||{}).id||'';
  if(!CURID)return go('/workspaces');
  if(APP&&APP.merchant===CURID)return fn();
  set('<div class="au-busy" role="status"><span class="sk"></span>Loading your application…</div>');
  rpc('merchant_app_get',{p_merchant:CURID}).then(function(a){APP=a;fn()},function(e){set(card('<h1>We couldn’t open that business</h1><p class="lead">'+esc(friendly(e))+'</p><a class="btn" href="#/workspaces">Choose another</a>'))});
}
function loadApp(){return rpc('merchant_app_get',{p_merchant:CURID}).then(function(a){APP=a;return a})}
function refreshMe(){return rpc('merchant_me').then(function(me){ME=me;head();return me})}

/* ---------- public screens ---------- */
function vEntry(){
  set('<div class="au-hero"><img src="../assets/logo.png" alt="ChowBuy"><h1>Welcome to ChowBuy Merchant</h1><p>Manage your business, receive orders, and grow with ChowBuy.</p>'+
   '<div class="au-cta"><a class="btn pri" href="#/signup">Create Merchant Account</a><a class="btn" href="#/login">Sign In</a></div>'+
   '<ul class="au-points"><li>'+ic('check')+'<span>Restaurants, groceries, pharmacies and package delivery.</span></li><li>'+ic('check')+'<span>Every business is reviewed by ChowBuy before it goes live.</span></li><li>'+ic('check')+'<span>Already registered? Sign in. You never need to register twice.</span></li></ul></div>');
}
function pwField(id,label,auto){return '<div class="f"><label for="'+id+'">'+label+'</label><div class="pw"><input id="'+id+'" name="'+id+'" type="password" autocomplete="'+auto+'" required><button type="button" data-act="showpw" data-id="'+id+'" aria-label="Show password" aria-pressed="false">Show</button></div></div>'}
function vLogin(){
  var msg=ss('cb-merch-msg');ss('cb-merch-msg',null);var who=ls('cb-merch-who');
  set(card('<h1>Sign in</h1><p class="lead">Use the account you registered your business with.</p>'+(msg?'<div class="au-note warn" role="status">'+esc(msg)+'</div>':'')+
   '<form class="au-form" data-form="login" novalidate><div class="f"><label for="em">Email address</label><input id="em" name="em" type="email" autocomplete="username" autocapitalize="off" value="'+esc(who)+'" required></div>'+pwField('pw','Password','current-password')+
   '<label class="au-check"><input type="checkbox" name="remember" checked><span>Keep me signed in on this device</span></label><p class="au-err" role="alert" id="err"></p><button type="submit" class="btn pri" style="width:100%;padding:.85rem">Sign in</button></form>'+
   '<div class="au-links"><a href="#/forgot">Forgot password?</a><span>New here? <a class="au-link" href="#/signup">Create Merchant Account</a></span></div>'));
  var i=$(who?'#pw':'#em');if(i)i.focus();
}
function vSignup(){
  set(card('<h1>Create your merchant account</h1><p class="lead">Step 1 of 2. Your sign-in details. Next you will choose your business type and tell us about it.</p>'+
   '<form class="au-form" data-form="signup" novalidate><div class="row2"><div class="f"><label for="fn">First name</label><input id="fn" name="fn" autocomplete="given-name" required maxlength="40"></div><div class="f"><label for="ln">Last name</label><input id="ln" name="ln" autocomplete="family-name" required maxlength="40"></div></div>'+
   '<div class="f"><label for="em">Email address</label><input id="em" name="em" type="email" autocomplete="email" autocapitalize="off" required maxlength="120"><small>We will send a link to confirm it.</small></div>'+
   '<div class="f"><label for="ph">Phone number</label><input id="ph" name="ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="0803 123 4567" required maxlength="20"></div>'+
   pwField('pw','Password','new-password')+pwField('pw2','Confirm password','new-password')+'<small class="muted">At least 8 characters, with a letter and a number.</small>'+
   '<label class="au-check"><input type="checkbox" name="terms" required><span>I agree to the <a href="../terms.html" target="_blank" rel="noopener">Terms of Service</a> and <a href="../privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>'+
   '<p class="au-err" role="alert" id="err"></p><button type="submit" class="btn pri" style="width:100%;padding:.85rem">Create account</button></form>'+
   '<div class="au-links"><span>Already have an account? <a class="au-link" href="#/login">Sign in</a></span></div>'));
  $('#fn').focus();
}
function vVerify(email,signedIn){
  email=email||'';
  set(card('<div class="stat"><div class="big">'+ic('mail')+'</div><h1>Check your email</h1><p>We sent a confirmation link to <b>'+esc(email)+'</b>. Open it, then come back here'+(signedIn?' and refresh this page.':' and sign in.')+'</p></div>'+
   '<p class="au-err" id="err" role="alert"></p><div class="au-cta" style="margin:0 auto"><button type="button" class="btn pri" data-act="'+(signedIn?'recheck':'tologin')+'">'+(signedIn?'I’ve confirmed my email':'Go to sign in')+'</button><button type="button" class="btn" data-act="resend" data-email="'+esc(email)+'">Send the link again</button></div>'+(signedIn?'<div class="au-links"><span></span><button type="button" class="au-link" data-act="signout">Use a different account</button></div>':'')));
}
function vForgot(){
  set(card('<h1>Reset your password</h1><p class="lead">Enter your email and we will send you a link to choose a new password.</p><form class="au-form" data-form="forgot" novalidate><div class="f"><label for="em">Email address</label><input id="em" name="em" type="email" autocomplete="username" required></div><p class="au-err" role="alert" id="err"></p><button type="submit" class="btn pri" style="width:100%;padding:.85rem">Send reset link</button></form><div class="au-links"><a href="#/login">Back to sign in</a><span></span></div>'));
  $('#em').focus();
}

/* ---------- signed-in screens ---------- */
function vTypes(){
  var sel=ss('cb-merch-type')||'';
  set(card('<h1>What kind of business do you run?</h1><p class="lead">Pick the one that fits best. You can register another business later, separately.</p>'+
   '<div class="types" role="radiogroup" aria-label="Business type">'+TYPES.map(function(t){return '<button type="button" class="type" role="radio" aria-checked="'+(sel===t.k)+'" data-act="pick" data-k="'+t.k+'"><span class="tick">'+ic('check')+'</span><span class="tic">'+ic(t.i)+'</span><b>'+esc(t.n)+'</b><span class="d">'+esc(t.d)+'</span></button>'}).join('')+'</div>'+
   '<p class="au-err" role="alert" id="err"></p><div class="au-act"><a class="au-link" href="#/workspaces">'+((ME.workspaces||[]).length?'My businesses':'')+'</a><button type="button" class="btn pri" data-act="start" id="goBtn"'+(sel?'':' disabled')+'>Continue</button></div>','wide'));
}
function vWorkspaces(){
  var ws=ME.workspaces||[],inv=ME.invitations||[];
  set(card('<h1>Your businesses</h1><p class="lead">Choose where to work, or register a new business.</p>'+
   (inv.length?'<div class="au-note warn"><b>You have been invited to join:</b></div><div class="ws">'+inv.map(function(i){return '<div class="wsi"><span class="tic">'+ic(typeOf(i.type).i)+'</span><span class="tx"><b>'+esc(i.name)+'</b><small>Invited as '+esc(i.role)+'</small></span><button type="button" class="btn sm pri" data-act="inv" data-id="'+esc(i.id)+'" data-v="1">Accept</button><button type="button" class="btn sm" data-act="inv" data-id="'+esc(i.id)+'" data-v="0">Decline</button></div>'}).join('')+'</div>':'')+
   '<div class="ws">'+ws.map(function(w){return '<button type="button" class="wsi" data-act="open" data-id="'+esc(w.id)+'"><span class="tic">'+ic(typeOf(w.type).i)+'</span><span class="tx"><b>'+esc(w.name)+'</b><small>'+esc(typeOf(w.type).n)+' · '+esc(w.role)+'</small></span>'+pill(w.status)+'</button>'}).join('')+'</div>'+
   '<div class="au-act"><span></span><a class="btn" href="#/signup/business-type">Register another business</a></div>'));
}
function nextStep(){
  var d=(APP&&APP.data)||{},docs=APP.docs||[],need=APP.required||[];
  if(!d.business)return 'business';if(!d.owner)return 'owner';if(!d.location)return 'location';if(!d.specific)return 'specific';
  var have=docs.map(function(x){return x.doc});if(need.some(function(n){return have.indexOf(n)<0}))return 'documents';
  if(!APP.settlement)return 'settlement';return 'review';
}
function stepDone(k){
  var d=APP.data||{},have=(APP.docs||[]).map(function(x){return x.doc});
  if(k==='documents')return (APP.required||[]).every(function(n){return have.indexOf(n)>=0});
  if(k==='settlement')return !!APP.settlement;if(k==='review')return false;return !!d[k];
}
function frame(cur,inner){
  var done=0;STEPS.forEach(function(s){if(stepDone(s[0]))done++});
  return '<div class="onb"><nav class="steps" aria-label="Application steps">'+STEPS.map(function(s,i){var on=s[0]===cur,dn=stepDone(s[0]);return '<a href="#/onboarding/'+s[0]+'" class="'+(on?'on ':'')+(dn?'done':'')+'"'+(on?' aria-current="step"':'')+'><span class="n">'+(dn&&!on?ic('check'):(i+1))+'</span>'+esc(s[1])+'</a>'}).join('')+'</nav>'+
   '<section class="au-card"><div><small class="muted">'+esc(typeOf(APP.type).n)+' · '+esc(APP.name||'New business')+'</small><div class="bar" style="margin-top:.5rem"><i style="width:'+Math.round(done/(STEPS.length-1)*100)+'%"></i></div></div>'+
   (APP.status==='ACTION_REQUIRED'?'<div class="au-note warn" role="status"><b>ChowBuy asked for changes:</b> '+esc(APP.note||'Please review your application.')+'</div>':'')+inner+'</section></div>';
}
function fld(id,label,val,o){o=o||{};return '<div class="f"><label for="'+id+'">'+label+'</label><input id="'+id+'" name="'+id+'" value="'+esc(val==null?'':val)+'" '+(o.attrs||'')+'>'+(o.hint?'<small>'+o.hint+'</small>':'')+'</div>'}
function sel(id,label,val,opts,o){o=o||{};return '<div class="f"><label for="'+id+'">'+label+'</label><select id="'+id+'" name="'+id+'"><option value="">Choose…</option>'+opts.map(function(x){var isA=Array.isArray(x),v=isA?x[0]:x,t=isA?x[1]:x;return '<option value="'+esc(v)+'"'+(String(val)===String(v)?' selected':'')+'>'+esc(t)+'</option>'}).join('')+'</select>'+(o.hint?'<small>'+o.hint+'</small>':'')+'</div>'}
function checks(name,label,vals,opts){return '<div class="f"><label>'+label+'</label><div class="chips">'+opts.map(function(o){return '<label><input type="checkbox" name="'+name+'" value="'+esc(o[0])+'"'+((vals||[]).indexOf(o[0])>=0?' checked':'')+'> '+esc(o[1])+'</label>'}).join('')+'</div></div>'}
function nav(prev,label){return '<p class="au-err" role="alert" id="err"></p><div class="au-act">'+(prev?'<a class="btn" href="#/onboarding/'+prev+'">Back</a>':'<span></span>')+'<button type="submit" class="btn pri">'+(label||'Save and continue')+'</button></div>'}
function vStep(k){
  if(APP.status!=='DRAFT'&&APP.status!=='ACTION_REQUIRED')return go('/application-status');
  var d=APP.data||{},b=d.business||{},o=d.owner||{},l=d.location||{},s=d.specific||{},html='';
  var T=APP.type;
  if(k==='business'){
    html='<h1>Business information</h1><p class="lead">Tell us about the business you want to run on ChowBuy.</p><form class="au-form" data-form="business" novalidate>'+
     '<div class="row2">'+fld('trading_name','Store or trading name',b.trading_name,{attrs:'maxlength="80" required'})+fld('registered_name','Registered business name (if different)',b.registered_name,{attrs:'maxlength="120"'})+'</div>'+
     '<div class="f"><label for="description">Describe your business</label><textarea id="description" name="description" maxlength="500" required>'+esc(b.description||'')+'</textarea><small>What you sell and what customers can expect. 10 to 500 characters.</small></div>'+
     sel('cac_status','CAC registration status',b.cac_status,[['registered','Registered with CAC'],['in_progress','Registration in progress'],['sole_proprietor','Sole proprietor, not registered']],{hint:'Choose what is true. We never ask you to invent a number.'})+
     '<div id="cacwrap"'+(b.cac_status==='registered'?'':' hidden')+'>'+fld('cac_number','CAC registration number',b.cac_number,{attrs:'maxlength="20" placeholder="RC1234567"'})+'</div>'+
     '<div class="row2">'+fld('business_email','Business email',b.business_email||ME.email,{attrs:'type="email" maxlength="120" required'})+fld('business_phone','Business phone',b.business_phone,{attrs:'type="tel" inputmode="tel" maxlength="20" required'})+'</div>'+
     fld('website','Website or social page (optional)',b.website,{attrs:'type="url" placeholder="https://" maxlength="200"'})+nav(null)+'</form>';
  }else if(k==='owner'){
    html='<h1>Owner or authorised representative</h1><p class="lead">Who is registering this business?</p><form class="au-form" data-form="owner" novalidate>'+
     '<div class="row2">'+fld('full_name','Full legal name',o.full_name||ME.name,{attrs:'maxlength="80" required'})+fld('phone','Phone number',o.phone,{attrs:'type="tel" inputmode="tel" maxlength="20" required'})+'</div>'+
     '<div class="row2">'+fld('email','Email address',o.email||ME.email,{attrs:'type="email" maxlength="120" required'})+sel('position','Your position',o.position,[['owner','Owner'],['director','Director'],['manager','Manager'],['representative','Authorised representative']])+'</div>'+
     sel('id_type','Identity document you will upload',o.id_type,[['nin','National ID (NIN)'],['passport','International passport'],['drivers_licence','Driver’s licence'],['voters_card','Voter’s card']],{hint:'You upload the document itself on the Documents step. We never ask you to type the number here.'})+
     '<div class="au-note">If you are a manager or authorised representative, you are recorded as a representative and not as the legal owner.</div>'+
     '<label class="au-check"><input type="checkbox" name="authorized"'+(o.authorized?' checked':'')+'><span>I confirm that I am authorised to register this business on ChowBuy.</span></label>'+nav('business')+'</form>';
  }else if(k==='location'){
    html='<h1>Business location</h1><p class="lead">Where do customers collect orders, or where do you dispatch from?</p><form class="au-form" data-form="location" novalidate>'+
     '<div class="row2">'+fld('country','Country','Nigeria',{attrs:'readonly'})+sel('state','State or region',l.state,STATES)+'</div>'+
     '<div class="row2">'+fld('city','City',l.city,{attrs:'maxlength="40" placeholder="e.g. Lagos" required'})+fld('area','Area or neighbourhood',l.area,{attrs:'maxlength="60" placeholder="e.g. Lekki Phase 1" required'})+'</div>'+
     fld('address','Full business address',l.address,{attrs:'maxlength="200" required'})+
     '<div class="row2">'+fld('postal','Postal code (optional)',l.postal,{attrs:'maxlength="10" inputmode="numeric"'})+fld('branch','Branch name (optional)',l.branch,{attrs:'maxlength="60"'})+'</div>'+
     '<div class="row2">'+fld('lat','Latitude (optional)',l.lat==null?'':l.lat,{attrs:'inputmode="decimal"'})+fld('lng','Longitude (optional)',l.lng==null?'':l.lng,{attrs:'inputmode="decimal"'})+'</div>'+
     '<button type="button" class="btn sm" data-act="geo" style="justify-self:start">'+ic('pin')+' Use my current location</button>'+
     (l.city?(l.serviceable?'<div class="au-note good">ChowBuy currently serves <b>'+esc(l.city)+'</b>.</div>':'<div class="au-note warn"><b>'+esc(l.city)+'</b> is not served yet. You can still apply; we will tell you when it opens.</div>'):'')+nav('owner')+'</form>';
  }else if(k==='specific'){
    html='<h1>'+esc(typeOf(T).n)+' details</h1><p class="lead">A few things specific to your kind of business.</p><form class="au-form" data-form="specific" novalidate>'+specificFields(T,s)+nav('location')+'</form>';
  }else if(k==='documents'){
    var have={};(APP.docs||[]).forEach(function(x){have[x.doc]=x});
    var list=(APP.required||[]).concat(optionalFor(T).filter(function(x){return (APP.required||[]).indexOf(x)<0}));
    html='<h1>Documents</h1><p class="lead">Photos or PDFs, up to 8 MB each. They are stored privately and only ChowBuy’s review team can open them.</p><div class="docs">'+list.map(function(dk){var x=have[dk],opt=OPTIONAL.indexOf(dk)>=0;
      return '<div class="doc"><div><b>'+esc(DOCS[dk][0])+(opt?'':' <span class="pill acc">Required</span>')+'</b><small>'+esc(x&&x.status==='declined'&&x.note?'Declined: '+x.note:DOCS[dk][1])+'</small></div><div class="acts">'+(x?'<span class="pill '+(x.status==='approved'?'ok':x.status==='declined'?'bad':'info')+'">'+(x.status==='approved'?'Approved':x.status==='declined'?'Declined':'Sent')+'</span>':'')+
      (x&&x.status==='approved'?'':'<label class="btn sm'+(x?'':' pri')+'" tabindex="0">'+ic('up')+' '+(x?'Replace':'Upload')+'<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" data-act="upload" data-doc="'+dk+'"></label>')+'</div></div>'}).join('')+'</div>'+
      '<p class="au-err" role="alert" id="err"></p><div class="au-act"><a class="btn" href="#/onboarding/specific">Back</a><a class="btn pri" href="#/onboarding/settlement">Continue</a></div>';
  }else if(k==='settlement'){
    var st=APP.settlement;
    html='<h1>Payout account</h1><p class="lead">Where ChowBuy pays your earnings. We verify the account name before your first payout.</p>'+(st?'<div class="au-note"><b>'+esc(st.beneficiary)+'</b> · '+esc(st.bank)+' · account ending <b>'+esc(st.last4)+'</b><br>Status: <b>'+(st.status==='VERIFIED'?'Verified':st.status==='FAILED'?'Could not be verified. '+esc(st.note):'Pending verification')+'</b>. Saving new details restarts verification.</div>':'')+
     '<form class="au-form" data-form="settlement" novalidate>'+fld('beneficiary','Account name',st?st.beneficiary:'',{attrs:'maxlength="80" required',hint:'Exactly as the bank shows it.'})+
     '<div class="f"><label for="bank">Bank</label><input id="bank" name="bank" list="banks" value="'+esc(st?st.bank:'')+'" maxlength="60" required><datalist id="banks">'+BANKS.map(function(x){return '<option value="'+esc(x)+'">'}).join('')+'</datalist></div>'+
     fld('account','10-digit account number','',{attrs:'inputmode="numeric" maxlength="12" autocomplete="off" required',hint:'For your safety we only show the last four digits after you save.'})+nav('documents',st?'Update account':'Save and continue')+'</form>'+(st?'<div class="au-act"><span></span><a class="btn pri" href="#/onboarding/review">Continue to review</a></div>':'');
  }else if(k==='review'){
    html=vReview();
  }
  set(frame(k,html));
  var cs=$('#cac_status');if(cs)cs.addEventListener('change',function(){$('#cacwrap').hidden=cs.value!=='registered'});
}
function optionalFor(t){return t==='PACKAGE_LOGISTICS'?['operating_permit','vehicle_docs','logo']:t==='PHARMACY'?['logo']:['logo','tin']}
function specificFields(T,s){
  var a=function(v){return v||[]};
  if(T==='RESTAURANT')return fld('cuisines','Cuisine categories',a(s.cuisines).join(', '),{attrs:'maxlength="200" placeholder="Local Swallows, Grills, Pizza" required',hint:'Separate with commas. Up to 8.'})+
   '<div class="row2">'+fld('hours','Opening days and hours',s.hours,{attrs:'maxlength="80" placeholder="Mon to Sat, 8am to 10pm" required'})+fld('prep_minutes','Usual preparation time (minutes)',s.prep_minutes,{attrs:'inputmode="numeric" maxlength="3" required'})+'</div>'+
   '<div class="row2">'+sel('prep_model','Food preparation model',s.prep_model,[['kitchen','Restaurant kitchen'],['cloud_kitchen','Cloud or delivery-only kitchen'],['bakery_counter','Bakery or counter service']])+sel('menu_status','Menu setup',s.menu_status,[['ready','Menu is ready to upload'],['building','Still building my menu'],['none','Not started']])+'</div>'+
   checks('fulfil','Fulfilment',[s.delivery?'delivery':'',s.pickup?'pickup':''],[['delivery','Delivery by ChowBuy riders'],['pickup','Customer pickup']]);
  if(T==='GROCERY_SUPERMARKET')return '<div class="row2">'+sel('store_category','Store category',s.store_category,[['supermarket','Supermarket'],['minimart','Minimart'],['foodstuff','Foodstuff retailer'],['household','Household essentials'],['specialty','Specialty store']])+fld('hours','Operating hours',s.hours,{attrs:'maxlength="80" required'})+'</div>'+
   fld('product_categories','Product categories',a(s.product_categories).join(', '),{attrs:'maxlength="240" placeholder="Staples, Drinks, Fresh produce" required',hint:'Separate with commas. Up to 12.'})+
   '<div class="row2">'+sel('inventory_pref','How do you manage inventory?',s.inventory_pref,[['manual','By hand in the dashboard'],['barcode','Barcode scanning'],['pos_sync','My own POS system']])+sel('catalog_status','Product catalogue',s.catalog_status,[['ready','Ready to upload'],['building','Still building it'],['none','Not started']])+'</div>'+
   checks('fulfil','Special handling',[s.cold_chain?'cold':''],[['cold','I can keep chilled or frozen goods']]);
  if(T==='PHARMACY')return '<div class="au-note warn">Pharmacies stay restricted until ChowBuy has reviewed your licences. You cannot list medicines before approval.</div><div class="row2">'+sel('pharmacy_category','Pharmacy category',s.pharmacy_category,[['community','Community pharmacy'],['hospital','Hospital pharmacy'],['chain','Pharmacy chain branch'],['online','Online pharmacy']])+fld('hours','Operating hours',s.hours,{attrs:'maxlength="80" required'})+'</div>'+
   '<div class="row2">'+fld('premises_licence_no','Premises licence number',s.premises_licence_no,{attrs:'maxlength="40" required'})+fld('licence_expiry','Licence expiry date',s.licence_expiry,{attrs:'type="date" required'})+'</div>'+
   '<div class="row2">'+fld('pharmacist_name','Responsible pharmacist’s full name',s.pharmacist_name,{attrs:'maxlength="80" required'})+fld('pharmacist_reg_no','Pharmacist registration number',s.pharmacist_reg_no,{attrs:'maxlength="40" required'})+'</div>';
  return fld('logistics_name','Logistics business name',s.logistics_name,{attrs:'maxlength="80" required'})+
   checks('service_types','Service types',a(s.service_types),[['same_day','Same-day delivery'],['next_day','Next-day delivery'],['intercity','Intercity'],['bulk','Bulk or freight']])+
   fld('operating_regions','Operating regions',a(s.operating_regions).join(', '),{attrs:'maxlength="240" placeholder="Lagos, Ogun, Abuja" required',hint:'States or cities you serve, separated by commas.'})+
   checks('package_types','Package types you accept',a(s.package_types),[['documents','Documents'],['parcels','Parcels'],['fragile','Fragile items'],['food','Food'],['bulky','Bulky items']])+
   '<div class="row2">'+fld('fleet_size','Fleet or rider capacity',s.fleet_size,{attrs:'inputmode="numeric" maxlength="5" required',hint:'How many vehicles or riders you can dispatch.'})+fld('hours','Operating hours',s.hours,{attrs:'maxlength="80" required'})+'</div>'+
   checks('fulfil','Pickup and drop-off',[s.pickup_dropoff?'both':''],[['both','I can handle both pickup and drop-off']]);
}
function vReview(){
  var d=APP.data||{},b=d.business||{},o=d.owner||{},l=d.location||{},s=d.specific||{},st=APP.settlement,miss=APP.missing||[];
  function sec(t,k,rows){return '<section><h3>'+t+'<a class="btn sm" href="#/onboarding/'+k+'">Edit</a></h3><div class="kv">'+rows.map(function(r){return '<span>'+esc(r[0])+'</span><b>'+esc(r[1]||'Not provided')+'</b>'}).join('')+'</div></section>'}
  var cacTxt={registered:'Registered ('+(b.cac_number||'')+')',in_progress:'Registration in progress',sole_proprietor:'Sole proprietor'}[b.cac_status]||'';
  var sp=[];Object.keys(s).forEach(function(k){var v=s[k];sp.push([k.replace(/_/g,' ').replace(/^./,function(c){return c.toUpperCase()}),Array.isArray(v)?v.join(', '):typeof v==='boolean'?(v?'Yes':'No'):v])});
  var have={};(APP.docs||[]).forEach(function(x){have[x.doc]=x});
  return '<h1>Review and submit</h1><p class="lead">Check everything. You can edit any section before you submit.</p>'+
   (miss.length?'<div class="au-note warn" role="status"><b>Still needed before you can submit:</b><ul class="miss">'+miss.map(function(m){var t=m.indexOf('Document: ')===0?'Upload: '+(DOCS[m.slice(10)]||[m.slice(10)])[0]:m;return '<li>'+esc(t)+'</li>'}).join('')+'</ul></div>':'<div class="au-note good">Everything required is in. Submit when you are ready.</div>')+
   '<div class="rev">'+
   sec('Account','owner',[['Name',ME.name],['Email',ME.email],['Business type',typeOf(APP.type).n]])+
   sec('Business','business',[['Store name',b.trading_name],['Registered name',b.registered_name],['CAC',cacTxt],['Business email',b.business_email],['Business phone',b.business_phone],['Website',b.website]])+
   sec('Owner or representative','owner',[['Name',o.full_name],['Phone',o.phone],['Email',o.email],['Position',o.position],['Authorised to register',o.authorized?'Confirmed':'']])+
   sec('Location','location',[['Address',l.address],['Area',l.area],['City',l.city],['State',l.state],['Served today',l.city?(l.serviceable?'Yes':'Not yet. We will tell you when it opens.'):'']])+
   sec(typeOf(APP.type).n+' details','specific',sp)+
   sec('Documents','documents',(APP.required||[]).map(function(dk){var x=have[dk];return [DOCS[dk][0],x?(x.status==='approved'?'Approved':'Sent for review'):'Missing']}))+
   sec('Payout account','settlement',[['Account name',st&&st.beneficiary],['Bank',st&&st.bank],['Account',st?'•••• '+st.last4:''],['Verification',st?'Pending ChowBuy verification':'']])+'</div>'+
   '<form class="au-form" data-form="submit" novalidate><label class="au-check"><input type="checkbox" name="decl"><span>I declare that the information and documents I have provided are true, and that I am authorised to submit this application. I understand ChowBuy may verify them and that submitting is not approval.</span></label>'+
   '<p class="au-err" role="alert" id="err"></p><div class="au-act"><a class="btn" href="#/onboarding/settlement">Back</a><button type="submit" class="btn pri"'+(miss.length?' disabled':'')+'>Submit for Review</button></div></form>';
}
var STT=null;
function vStatus(){
  clearTimeout(STT);
  var st=APP.status,t=typeOf(APP.type),big='',h='',p='',extra='';
  var order=['SUBMITTED','UNDER_REVIEW','APPROVED'];
  if(st==='SUBMITTED'||st==='UNDER_REVIEW'){big='<div class="big">'+ic('clock')+'</div>';h='Application submitted';p='Your business information has been submitted. We’ll notify you when there is an update.';}
  else if(st==='ACTION_REQUIRED'){big='<div class="big a">'+ic('alert')+'</div>';h='Action required';p='Additional information is required before we can continue reviewing your application.';extra='<div class="au-note warn" style="text-align:left"><b>From ChowBuy:</b> '+esc(APP.note||'Please review your application.')+'</div><a class="btn pri" href="#/onboarding">Update my application</a>';}
  else if(st==='APPROVED'){big='<div class="big g">'+ic('check')+'</div>';h='You’re approved';p='Your ChowBuy Merchant account is approved. Complete any remaining setup steps to start operating.';extra='<button type="button" class="btn pri" data-act="dash">Open my dashboard</button>';}
  else if(st==='REJECTED'){big='<div class="big r">'+ic('xc')+'</div>';h='Application not approved';p='We could not approve this application.';extra='<div class="au-note bad" style="text-align:left"><b>Reason:</b> '+esc(APP.note||'No reason was recorded.')+'</div><p class="muted">If you think this is a mistake, or you have fixed the problem, contact merchants@chowbuy.ng and we can reopen it.</p>';}
  else if(st==='SUSPENDED'){big='<div class="big r">'+ic('alert')+'</div>';h='Account suspended';p='This business is suspended and cannot take orders for now.';extra='<div class="au-note bad" style="text-align:left"><b>Reason:</b> '+esc(APP.note||'Contact support for details.')+'</div><p class="muted">Contact merchants@chowbuy.ng to resolve this.</p>';}
  else{go('/onboarding');return}
  var tl=(st==='SUBMITTED'||st==='UNDER_REVIEW'||st==='APPROVED')?'<ul class="tl">'+[['SUBMITTED','Submitted'],['UNDER_REVIEW','Under review'],['APPROVED','Approved']].map(function(x,i){var ci=order.indexOf(st),on=order.indexOf(x[0])===ci,dn=order.indexOf(x[0])<ci;return '<li class="'+(on?'on':dn?'done':'')+'"><i></i>'+x[1]+'</li>'}).join('')+'</ul>':'';
  set(card('<div class="stat">'+big+'<h1>'+h+'</h1><p>'+p+'</p><small class="muted">'+esc(APP.name||'')+' · '+esc(t.n)+'</small>'+tl+extra+'</div><div class="au-links"><a href="#/workspaces">My businesses</a><button type="button" class="au-link" data-act="reload">Refresh status</button></div>'));
  if(st==='SUBMITTED'||st==='UNDER_REVIEW')STT=setTimeout(function(){if(path()==='/application-status'){APP=null;ME=null;route()}},30000);
}

/* ---------- dashboard hand-off ---------- */
function loadScript(src){return new Promise(function(ok,no){var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=function(){no(new Error('Could not load '+src))};document.body.appendChild(s)})}
function dashboard(w){
  off=true;
  set('<div class="au-busy" role="status"><span class="sk"></span>Opening '+esc(w.name)+'…</div>');
  return fetch('dashboard.html?v=20261043',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('The dashboard could not be loaded.');return r.text()}).then(function(html){
    $('#gate').hidden=true;var root=$('#root');root.innerHTML=html;root.hidden=false;ss('cb-merch-store',w.id);if(location.hash.indexOf('/dashboard')>=0||/^#\/(login|workspaces|application-status|onboarding.*)?$/.test(location.hash))location.hash='#/';
    window.removeEventListener('hashchange',route);
    return loadScript('data.js?v=20261043').then(function(){return loadScript('merchant.js?v=20261062')});
  }).catch(function(e){off=false;window.addEventListener('hashchange',route);$('#gate').hidden=false;$('#root').hidden=true;$('#root').innerHTML='';set(card('<h1>Couldn’t open the dashboard</h1><p class="lead">'+esc(e.message)+'</p><button type="button" class="btn pri" data-act="reload">Try again</button>'))});
}

/* ---------- actions ---------- */
function formData(f){
  var d={};[].forEach.call(f.elements,function(e){if(!e.name||e.type==='button'||e.type==='submit')return;
    if(e.type==='checkbox'){if(d[e.name]===undefined&&f.querySelectorAll('input[name="'+e.name+'"]').length>1)d[e.name]=[];if(Array.isArray(d[e.name])){if(e.checked)d[e.name].push(e.value)}else d[e.name]=e.checked}
    else d[e.name]=e.value});return d;
}
function listOf(v){return String(v||'').split(',').map(function(x){return x.trim()}).filter(Boolean)}
function setBusy(f,on,label){var b=f.querySelector('button[type=submit]');if(b){b.disabled=on;if(label!==undefined){if(on){b.dataset.t=b.textContent;b.innerHTML='<span class="sk"></span>'+label}else b.textContent=b.dataset.t||b.textContent}}}
function showErr(m){var e=$('#err');if(e)e.textContent=m||''}
var PWRE=/^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
var FORMS={
 login:function(f){
   var d=formData(f);if(!d.em.trim()||!d.pw)return showErr('Enter your email and password.');
   setBusy(f,true,'Signing in…');showErr('');
   raw('/auth/v1/token?grant_type=password','POST',{email:d.em.trim(),password:d.pw}).then(function(j){keep(j,!!d.remember);ls('cb-merch-who',d.em.trim());ME=null;APP=null;CURID='';ss('cb-merch-store',null);route()},function(e){setBusy(f,false,'');showErr(friendly(e));var p=$('#pw');if(p){p.value='';p.focus()}});
 },
 signup:function(f){
   var d=formData(f),em=d.em.trim().toLowerCase();
   if(!d.fn.trim()||!d.ln.trim())return showErr('Enter your first and last name.');
   if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(em))return showErr('Enter a valid email address.');
   var ph=d.ph.replace(/\D/g,'');if(ph.indexOf('234')===0)ph=ph.slice(3);else if(ph.charAt(0)==='0')ph=ph.slice(1);
   if(!/^[789][01]\d{8}$/.test(ph))return showErr('Enter a valid Nigerian phone number, for example 0803 123 4567.');
   if(!PWRE.test(d.pw))return showErr('Use at least 8 characters with a letter and a number.');
   if(d.pw!==d.pw2)return showErr('The two passwords do not match.');
   if(!d.terms)return showErr('Please accept the Terms of Service and Privacy Policy.');
   setBusy(f,true,'Creating account…');showErr('');
   raw('/auth/v1/signup?redirect_to='+encodeURIComponent(REDIRECT),'POST',{email:em,password:d.pw,data:{full_name:d.fn.trim()+' '+d.ln.trim(),phone:'+234'+ph}}).then(function(j){
     if(j.access_token){keep(j,true);ls('cb-merch-who',em);ME=null;return route()}
     /* An address that already has an account comes back with no identities: never create a second one. */
     if(j.user&&Array.isArray(j.user.identities)&&!j.user.identities.length||j.identities&&!j.identities.length){setBusy(f,false,'');showErr('');var e=$('#err');e.innerHTML='An account with this email already exists. <a class="au-link" href="#/login">Sign in instead</a>, or <a class="au-link" href="#/forgot">reset your password</a>.';return}
     ls('cb-merch-who',em);ss('cb-merch-pending',em);go('/verify');
   },function(e){setBusy(f,false,'');showErr(/already|registered/i.test(e.message)?'An account with this email already exists. Sign in instead.':friendly(e))});
 },
 forgot:function(f){
   var d=formData(f);if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(d.em.trim()))return showErr('Enter a valid email address.');
   setBusy(f,true,'Sending…');
   raw('/auth/v1/recover?redirect_to='+encodeURIComponent(REDIRECT),'POST',{email:d.em.trim()}).then(function(){f.innerHTML='<div class="au-note good" role="status">If an account uses that email, a reset link is on its way. Check your inbox and spam folder.</div><a class="btn" href="#/login">Back to sign in</a>'},function(e){setBusy(f,false,'');showErr(friendly(e))});
 },
 business:function(f){var d=formData(f);saveSection(f,'business',{trading_name:d.trading_name,registered_name:d.registered_name,description:d.description,cac_status:d.cac_status,cac_number:d.cac_number,business_email:d.business_email,business_phone:d.business_phone,website:d.website},'owner')},
 owner:function(f){var d=formData(f);saveSection(f,'owner',{full_name:d.full_name,phone:d.phone,email:d.email,position:d.position,id_type:d.id_type,authorized:!!d.authorized},'location')},
 location:function(f){var d=formData(f);saveSection(f,'location',{country:'Nigeria',state:d.state,city:d.city,area:d.area,address:d.address,postal:d.postal,branch:d.branch,lat:d.lat,lng:d.lng},'specific')},
 specific:function(f){
   var d=formData(f),T=APP.type,p={};
   if(T==='RESTAURANT')p={cuisines:listOf(d.cuisines),hours:d.hours,prep_minutes:d.prep_minutes,prep_model:d.prep_model,menu_status:d.menu_status,delivery:(d.fulfil||[]).indexOf('delivery')>=0,pickup:(d.fulfil||[]).indexOf('pickup')>=0};
   else if(T==='GROCERY_SUPERMARKET')p={store_category:d.store_category,product_categories:listOf(d.product_categories),hours:d.hours,inventory_pref:d.inventory_pref,catalog_status:d.catalog_status,cold_chain:(d.fulfil||[]).indexOf('cold')>=0};
   else if(T==='PHARMACY')p={pharmacy_category:d.pharmacy_category,hours:d.hours,premises_licence_no:d.premises_licence_no,licence_expiry:d.licence_expiry,pharmacist_name:d.pharmacist_name,pharmacist_reg_no:d.pharmacist_reg_no};
   else p={logistics_name:d.logistics_name,service_types:d.service_types||[],operating_regions:listOf(d.operating_regions),package_types:d.package_types||[],fleet_size:d.fleet_size,hours:d.hours,pickup_dropoff:(d.fulfil||[]).indexOf('both')>=0};
   saveSection(f,'specific',p,'documents');
 },
 settlement:function(f){
   var d=formData(f);setBusy(f,true,'Saving…');showErr('');
   rpc('merchant_settlement_save',{p_merchant:CURID,p_beneficiary:d.beneficiary,p_bank:d.bank,p_account:d.account}).then(function(){return loadApp()}).then(function(){toast('Payout account saved. It will be verified by ChowBuy.');go('/onboarding/review')},function(e){setBusy(f,false,'');showErr(friendly(e))});
 },
 submit:function(f){
   var d=formData(f);if(!d.decl)return showErr('Tick the declaration to continue.');
   setBusy(f,true,'Submitting…');showErr('');
   rpc('merchant_app_submit',{p_merchant:CURID}).then(function(){return Promise.all([loadApp(),refreshMe()])}).then(function(){go('/application-status')},function(e){setBusy(f,false,'');showErr(friendly(e))});
 }
};
function saveSection(f,sec,data,nextStepKey){
  setBusy(f,true,'Saving…');showErr('');
  rpc('merchant_app_save',{p_merchant:CURID,p_section:sec,p_data:data}).then(function(){return Promise.all([loadApp(),refreshMe()])}).then(function(){
    if(sec==='location'&&APP.data.location&&!APP.data.location.serviceable)toast('Saved. We do not serve that city yet, but you can still apply.');
    go('/onboarding/'+nextStepKey)},function(e){setBusy(f,false,'');showErr(friendly(e))});
}
var ACTS={
 signout:function(){var t=ss('cb-merch-tok');if(t)raw('/auth/v1/logout','POST',{},t).catch(function(){});clearSession();ME=null;APP=null;CURID='';ss('cb-merch-next',null);head();go('/')},
 retry:function(){route()},reload:function(){APP=null;ME=null;route()},tologin:function(){go('/login')},
 recheck:function(){ME=null;route()},
 showpw:function(el){var i=$('#'+el.getAttribute('data-id'));var on=i.type==='password';i.type=on?'text':'password';el.textContent=on?'Hide':'Show';el.setAttribute('aria-pressed',on);el.setAttribute('aria-label',on?'Hide password':'Show password')},
 resend:function(el){var em=el.getAttribute('data-email');if(!em)return showErr('Enter your email on the sign-in page first.');el.disabled=true;
   raw('/auth/v1/resend','POST',{type:'signup',email:em}).then(function(){toast('Sent again. Check your inbox and spam folder.')},function(e){showErr(friendly(e))}).then(function(){setTimeout(function(){el.disabled=false},30000)})},
 pick:function(el){ss('cb-merch-type',el.getAttribute('data-k'));[].forEach.call(document.querySelectorAll('.type'),function(t){t.setAttribute('aria-checked',t===el)});var b=$('#goBtn');if(b)b.disabled=false},
 start:function(el){
   var k=ss('cb-merch-type');if(!k)return showErr('Choose a business type to continue.');
   el.disabled=true;el.innerHTML='<span class="sk"></span>Setting up…';showErr('');
   rpc('merchant_app_start',{p_type:k}).then(function(r){CURID=r.merchant;ss('cb-merch-store',CURID);APP=null;return refreshMe()}).then(function(){ss('cb-merch-type',null);go('/onboarding/business')},function(e){el.disabled=false;el.textContent='Continue';showErr(friendly(e))});
 },
 open:function(el){var w=(ME.workspaces||[]).filter(function(x){return x.id===el.getAttribute('data-id')})[0];if(w){APP=null;open(w)}},
 inv:function(el){var yes=el.getAttribute('data-v')==='1';el.disabled=true;rpc('merchant_invite_respond',{p_merchant:el.getAttribute('data-id'),p_accept:yes}).then(refreshMe).then(function(){toast(yes?'You have joined the team.':'Invitation declined.');route()},function(e){el.disabled=false;toast(friendly(e),'err')})},
 dash:function(){var w=(ME.workspaces||[]).filter(function(x){return x.id===CURID})[0];if(w)dashboard(w)},
 geo:function(el){if(!navigator.geolocation)return toast('Location is not available on this device. Enter the address by hand.','err');el.disabled=true;navigator.geolocation.getCurrentPosition(function(p){$('#lat').value=p.coords.latitude.toFixed(6);$('#lng').value=p.coords.longitude.toFixed(6);el.disabled=false;toast('Location added.')},function(){el.disabled=false;toast('Could not get your location. You can still enter the address by hand.','err')},{timeout:10000})}
};
function upload(input){
  var f=input.files[0],dk=input.getAttribute('data-doc');if(!f)return;
  if(!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(f.type))return showErr('Use a JPG, PNG, WebP photo or a PDF.');
  if(f.size>8*1024*1024)return showErr('That file is larger than 8 MB.');
  showErr('');var lab=input.parentNode;lab.classList.add('btn');var old=lab.innerHTML;lab.innerHTML='<span class="sk"></span>Uploading…';
  var ext=f.type==='application/pdf'?'pdf':f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg',key=CURID+'/'+dk+'-'+Date.now()+'.'+ext;
  function put(retried){return fetch(API.url+'/storage/v1/object/kyc/'+key,{method:'POST',headers:{apikey:API.anon,Authorization:'Bearer '+ss('cb-merch-tok'),'Content-Type':f.type,'x-upsert':'false'},body:f}).then(function(r){
    if(r.status===401&&!retried)return refresh().then(function(){return put(true)});if(!r.ok)throw new Error('Upload failed. Try a smaller file or try again.')})}
  put().then(function(){return rpc('merchant_doc_submit',{p_merchant:CURID,p_doc:dk,p_path:key})}).then(function(){return loadApp()}).then(function(){toast('Sent for review.');vStep('documents')},function(e){lab.innerHTML=old;showErr(friendly(e))});
}
document.addEventListener('click',function(e){if(off)return;var t=e.target.closest('[data-act]');if(!t||t.tagName==='INPUT')return;var a=ACTS[t.getAttribute('data-act')];if(a){e.preventDefault();a(t)}});
document.addEventListener('change',function(e){if(off)return;var t=e.target;if(t.matches&&t.matches('input[data-act=upload]'))upload(t)});
document.addEventListener('submit',function(e){if(off)return;var f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();var h=FORMS[f.getAttribute('data-form')];if(h)h(f)});
window.addEventListener('hashchange',route);
route();
})();
