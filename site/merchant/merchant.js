(function(){
var $=function(s,r){return (r||document).querySelector(s)};
function find(a,id){for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null}
function clone(o){return JSON.parse(JSON.stringify(o))}
/* ---------- icons (lucide style) ---------- */
var IC={
grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
list:'<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
building:'<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/>',
tags:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
sparkles:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M17 5h4M5 17v4M3 19h4"/>',
bike:'<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 17.5V14l-3-3 4-3 2 3h2"/>',
pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
wallet:'<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M16 13h2"/>',
swap:'<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
bag:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
x:'<path d="M18 6 6 18M6 6l12 12"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
check:'<path d="M20 6 9 17l-5-5"/>',
checkc:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
xc:'<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
trend:'<path d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6"/>',
utensils:'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
cart:'<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
pill:'<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7zM8.5 8.5l7 7"/>',
box:'<path d="M21 8 12 3 3 8v8l9 5 9-5zM3.3 7 12 12l8.7-5M12 22V12"/>',
alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
trash:'<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
ext:'<path d="M7 17 17 7M7 7h10v10"/>',
star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3L5.8 21 7 14.2 2 9.3l6.9-1z"/>',
edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
zap:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6"/>',
down:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
ban:'<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
eye:'<path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
eyeoff:'<path d="M17.9 17.9A10 10 0 0 1 12 20C6 20 2 12 2 12a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c6 0 10 8 10 8a18 18 0 0 1-2.2 3.2M1 1l22 22"/>',
copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
store:'<path d="m3 9 1.5-5h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>'
};
function ic(n,c){return '<svg class="ic'+(c?' '+c:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(IC[n]||IC.sparkles)+'</svg>'}

/* ---------- helpers ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',')}
function ngn(n){return '₦'+num(n)}
function cmp(n){n=Math.abs(n)>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'k':String(Math.round(n));return '₦'+n}
function fdt(ts){return new Date(ts).toLocaleString('en-GB',{timeZone:'Africa/Lagos',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false})}
function fdate(s){var d=new Date(s+'T12:00:00');return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
function initials(n){var p=String(n).replace(/[^A-Za-z0-9 ]/g,'').split(/\s+/).filter(Boolean);return ((p[0]||'?')[0]+((p[1]||'')[0]||'')).toUpperCase()}
var VC={restaurant:'#FF5A1F',grocery:'#12A150',pharmacy:'#2563EB',package:'#7C3AED'};
var VI={restaurant:'utensils',grocery:'cart',pharmacy:'pill',package:'box'};
var VS={restaurant:'Restaurant',grocery:'Grocery',pharmacy:'Pharmacy',package:'Package'};
function tile(n,v){return '<span class="tile" style="background:'+(VC[v]||'#475569')+'">'+esc(initials(n))+'</span>'}
function vbadge(v){return '<span class="vb">'+ic(VI[v])+esc(V[v])+'</span>'}
var PC={completed:'ok',processing:'info',pending:'warn',cancelled:'bad',active:'ok',suspended:'bad',verified:'ok',rejected:'bad',onboarding:'warn',live:'ok',pipeline:'info',paused:'warn',disabled:'bad',coming_soon:'warn',failed:'bad',COMPLETED:'ok',PENDING:'warn',FAILED:'bad',REVERSED:'info',OPEN:'ok',LOCKED:'warn',PLACED:'info',DELIVERED:'ok',CANCELLED:'bad'};
function pill(t,c,icon){return '<span class="pill '+(c||PC[t]||'')+'">'+(icon?ic(icon):'')+esc(String(t).replace(/_/g,' '))+'</span>'}
function btn(label,act,id,cls,extra){return '<button type="button" class="btn sm '+(cls||'')+'" data-act="'+act+'"'+(id!=null?' data-id="'+esc(id)+'"':'')+(extra||'')+'>'+label+'</button>'}
function sw(on,act,id,label){return '<button type="button" class="sw" role="switch" aria-checked="'+(!!on)+'" aria-label="'+esc(label)+'" data-act="'+act+'" data-id="'+esc(id)+'"></button>'}
function head(t,sub,acts){return '<div class="ph"><div><h1>'+t+'</h1>'+(sub?'<p>'+sub+'</p>':'')+'</div><div class="acts">'+(acts||'')+'</div></div>'}
function kpi(l,v,d,icon,cls,sub){return '<div class="card kpi"><div class="l"><span>'+l+'</span><span class="ico '+(cls||'')+'">'+ic(icon)+'</span></div><div class="v mono">'+v+'</div>'+(d?'<span class="delta">'+ic('trend')+d+'</span>':'')+(sub?'<small class="muted">'+sub+'</small>':'')+'</div>'}
function mini(l,v,sub,icon){return '<div class="card mini"><span class="ico">'+ic(icon)+'</span><div><b class="mono">'+v+'</b><span>'+l+'</span><small>'+sub+'</small></div></div>'}
function tabs(key,opts,sm){var cur=T(key,opts[0][0]);return '<div class="tabs'+(sm?' sm':'')+'" role="group">'+opts.map(function(o){return '<button type="button" data-act="tab" data-k="'+key+'" data-v="'+o[0]+'" aria-pressed="'+(cur===o[0])+'">'+o[1]+'</button>'}).join('')+'</div>'}
function search(key,ph){return '<label class="srch">'+ic('search')+'<span class="sr">Search</span><input type="search" data-fid="q-'+key+'" data-in="q:'+key+'" placeholder="'+esc(ph)+'" value="'+esc(U.q[key]||'')+'" autocomplete="off"></label>'}
function empty(icon,t,m,b){return '<div class="empty">'+ic(icon)+'<b>'+t+'</b><span>'+m+'</span>'+(b||'')+'</div>'}
function paged(list,key,per){var p=Math.max(1,U.page[key]||1),pages=Math.max(1,Math.ceil(list.length/per));if(p>pages)p=pages;U.page[key]=p;return{rows:list.slice((p-1)*per,p*per),p:p,pages:pages,from:list.length?(p-1)*per+1:0,to:Math.min(list.length,p*per),n:list.length}}
function pager(pg,key){return '<div class="foot"><span>Showing '+pg.from+'–'+pg.to+' of '+pg.n+'</span><div class="acts">'+btn('Previous','pg',key,'',' data-d="-1"'+(pg.p<=1?' disabled':''))+'<span>Page '+pg.p+' / '+pg.pages+'</span>'+btn('Next','pg',key,'',' data-d="1"'+(pg.p>=pg.pages?' disabled':''))+'</div></div>'}
function log(t,k){S.activity.unshift([t,k||'settings','Just now']);if(S.activity.length>30)S.activity.length=30}
function inp(id,label,val,extra){return '<div class="f"><label for="'+id+'">'+label+'</label><input id="'+id+'" name="'+id+'" value="'+esc(val==null?'':val)+'" '+(extra||'')+'></div>'}
function sel(id,label,opts,cur){return '<div class="f"><label for="'+id+'">'+label+'</label><select id="'+id+'" name="'+id+'">'+opts.map(function(o){var v=o[0],l=o[1];return '<option value="'+esc(v)+'"'+(v===cur?' selected':'')+'>'+esc(l)+'</option>'}).join('')+'</select></div>'}

/* ---------- toast & modal ---------- */
function toast(msg,type){
  var box=$('#toasts');if(!box)return;var t=document.createElement('div');
  t.className='toast'+(type==='err'?' err':'');t.innerHTML=ic(type==='err'?'xc':type==='warn'?'alert':'checkc')+'<span></span>';t.lastChild.textContent=msg;
  while(box.children.length>3)box.removeChild(box.firstChild);
  box.appendChild(t);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},3800);
}
var Mfn=null,Mret=null;
function openM(html,fn){
  Mret=document.activeElement;Mfn=fn;
  $('#mbody').innerHTML='<form id="mf" novalidate>'+html+'</form>';
  var ft=$('#mf .ft');if(ft){var e=document.createElement('p');e.className='err';e.id='merr';e.setAttribute('role','alert');ft.parentNode.insertBefore(e,ft)}
  $('#mwrap').classList.add('show');
  var f=$('#mf input:not([type=hidden]),#mf select,#mf textarea')||$('#mf button[type=submit]');if(f)setTimeout(function(){f.focus()},30);
}
function closeM(){$('#mwrap').classList.remove('show');Mfn=null;if(Mret&&Mret.focus&&document.body.contains(Mret))Mret.focus()}
function confirmM(t,m,ok,fn,danger){openM('<h3>'+t+'</h3><p class="muted">'+m+'</p><div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn '+(danger?'danger':'pri')+'">'+ok+'</button></div>',function(){fn()})}
function fd(form){var o={};[].forEach.call(form.elements,function(el){if(!el.name)return;if(el.type==='radio'){if(el.checked)o[el.name]=el.value}else o[el.name]=el.value});return o}
function upd(fn){fn();save();refresh()}


/* ---------- extra icons ---------- */
Object.assign(IC,{
printer:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
volume:'<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
volumeoff:'<path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/>',
clip:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h4"/>',
truck:'<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
camera:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
chart:'<path d="M3 3v18h18M7 14l4-4 4 4 5-6"/>',
bank:'<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-7 10 7z"/>',
rot:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
zoomin:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
zoomout:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6"/>',
chev:'<path d="m9 18 6-6-6-6"/>',
up:'<path d="m18 15-6-6-6 6"/>',
dn:'<path d="m6 9 6 6 6-6"/>',
tag:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
msg:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.4 1-3 0 1.4 1 2.5 2.5 2.5z"/>',
store2:'<path d="m3 9 1.5-5h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>'
});
var V={restaurant:'Restaurant',grocery:'Super Mart',pharmacy:'Pharmacy',package:'Package & Logistics'};

/* ---------- state ---------- */
var KEY='cb-merchant-v1';
function fnv(s){var h=2166136261;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function load(){try{var j=localStorage.getItem(KEY);if(j){var o=JSON.parse(j);if(o&&o.v===2&&o.s&&o.s.items)return o.s}}catch(e){}return window.MSEED('restaurant')}
var S=load(),warned=false;
var LV={on:false,me:null,store:null,orders:null,products:null,seen:null};
function save(){if(LV.on)return;try{localStorage.setItem(KEY,JSON.stringify({v:2,s:S}))}catch(e){if(!warned){warned=true;toast('Browser storage is full. Changes last only until you close this tab.','warn')}}}
var U={q:{},tab:{},page:{},md:null,reveal:{}};
var T=function(k,d){return U.tab[k]||d};
function log(t,k){S.activity.unshift({t:t,k:k||'bell',at:Date.now()});if(S.activity.length>40)S.activity.length=40}
function note(t,k){S.notifs.unshift({id:'N'+Date.now()+Math.floor(Math.random()*99),t:t,k:k||'bell',at:Date.now(),read:false});if(S.notifs.length>30)S.notifs.length=30}
function upd(fn){fn();save();refresh()}
function ago(ts){var m=Math.max(0,Math.round((Date.now()-ts)/60000));if(m<1)return 'just now';if(m<60)return m+' min ago';var h=Math.floor(m/60);return h<24?h+' hr'+(h>1?'s':'')+' ago':Math.floor(h/24)+' d ago'}
function clock(ts){return new Date(ts).toLocaleTimeString('en-GB',{timeZone:'Africa/Lagos',hour:'2-digit',minute:'2-digit'})}
function dstr(ts){return new Date(ts).toLocaleString('en-GB',{timeZone:'Africa/Lagos',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
function dl(name,text,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/csv'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)}
function csvOut(name,rows){dl(name,'﻿'+rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n'))}
function printHtml(title,body){var w=window.open('','_blank');if(!w){toast('Allow pop-ups to print.','warn');return}w.document.write('<!doctype html><title>'+esc(title)+'</title><style>body{font:14px/1.5 system-ui,sans-serif;margin:24px;color:#111}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left}h1{font-size:20px}.r{text-align:right}</style>'+body+'<script>setTimeout(function(){window.print()},300)<\/script>');w.document.close()}
var ROLE={owner:'Owner',manager:'Store Manager',kitchen:'Kitchen / Dispatch',pharmacist:'Pharmacist'};
function role(){return S.me.role}
function can(a){var r=role(),M={
  withdraw:['owner'],money:['owner'],staff:['owner'],settings:['owner'],price:['owner','manager'],stock86:['owner','manager','kitchen','pharmacist'],
  refund:['owner','manager'],promo:['owner','manager'],reject:['owner','manager','kitchen','pharmacist'],revenue:['owner','manager'],rx:['owner','pharmacist'],catalog:['owner','manager','pharmacist']};
  return (M[a]||[]).indexOf(r)>=0}
function noPerm(m){toast(m||'Your role cannot do that. Switch role from your profile menu to demo it.','warn')}
function vtxt(){var v=S.vertical;return {
  order:v==='package'?'shipment':'order',orders:v==='package'?'Shipments':v==='restaurant'?'Kitchen queue':'Live orders',
  item:v==='restaurant'?'dish':'product',items:v==='restaurant'?'Menu':'Products & SKUs',catalogue:v==='restaurant'?'Menu':'Catalogue'}}
function brSel(){return find(S.branches,S.branch)||S.branches[0]}
function bf(){return brSel().f||1}
function dim(ts){return Math.round((ts-Date.now())/60000)}

/* ---------- chime ---------- */
var AC=null;
var BELL=null;
function synthChime(){
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var t=AC.currentTime;
    [[880,0],[1175,.16],[1568,.32]].forEach(function(n){var o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=n[0];g.gain.setValueAtTime(0,t+n[1]);g.gain.linearRampToValueAtTime(.18,t+n[1]+.02);g.gain.exponentialRampToValueAtTime(.001,t+n[1]+.3);o.connect(g);g.connect(AC.destination);o.start(t+n[1]);o.stop(t+n[1]+.32)})}catch(e){}
}
/* The default new-order tone is sounds/new-order.mp3 (bell). If the browser blocks or cannot play it, the synthesized chime is the fallback. */
function chime(force){
  if(!S.sound&&!force)return;
  try{
    BELL=BELL||new Audio('sounds/new-order.mp3');BELL.currentTime=0;
    var p=BELL.play();if(p&&p.catch)p.catch(synthChime);
  }catch(e){synthChime()}
}

/* ---------- modal with optional re-render draft ---------- */
var Mfn=null,Mret=null,Mhtml=null;
function openM(html,fn,wide){
  Mret=Mret||document.activeElement;Mfn=fn;
  $('#mbody').innerHTML='<form id="mf" novalidate>'+html+'</form>';
  $('#mbody').classList.toggle('wide',!!wide);
  var ft=$('#mf .ft');if(ft){var e=document.createElement('p');e.className='err';e.id='merr';e.setAttribute('role','alert');ft.parentNode.insertBefore(e,ft)}
  $('#mwrap').classList.add('show');
  var f=$('#mf input:not([type=hidden]):not([type=file]),#mf select,#mf textarea');if(f&&!U.noFocus)setTimeout(function(){f.focus()},30);
}
function closeM(){$('#mwrap').classList.remove('show');Mfn=null;U.md=null;if(Mret&&Mret.focus&&document.body.contains(Mret))Mret.focus();Mret=null}
function mre(builder){var y=$('#mbody').scrollTop;U.noFocus=1;var fn=Mfn;openM(builder(),fn,$('#mbody').classList.contains('wide'));U.noFocus=0;$('#mbody').scrollTop=y}
function mfoot(ok,cls,cancel){return '<div class="ft"><button type="button" class="btn" data-m="x">'+(cancel||'Cancel')+'</button><button type="submit" class="btn '+(cls||'pri')+'">'+ok+'</button></div>'}
function fdata(form){var o={};[].forEach.call(form.elements,function(el){if(!el.name)return;if(el.type==='radio'){if(el.checked)o[el.name]=el.value}else if(el.type==='checkbox'){o[el.name]=el.checked}else o[el.name]=el.value});return o}
function confirmM(t,m,ok,fn,danger){openM('<h3>'+t+'</h3><p class="muted">'+m+'</p>'+mfoot(ok,danger?'danger':'pri'),function(){fn()})}
function chk(name,label,on,extra){return '<label class="chk"><input type="checkbox" name="'+name+'"'+(on?' checked':'')+(extra||'')+'><span>'+label+'</span></label>'}

/* ---------- image helper ---------- */
function compress(file,cb,max){
  if(!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type)){toast('Use a JPG, PNG, WebP or SVG image.','err');return}
  if(file.size>8*1048576){toast('That image is over 8 MB.','err');return}
  var fr=new FileReader();
  fr.onload=function(){if(file.type==='image/svg+xml'){cb(fr.result);return}
    var im=new Image();im.onload=function(){var s=Math.min(1,(max||900)/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*s));c.height=Math.max(1,Math.round(im.naturalHeight*s));var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.74))};
    im.onerror=function(){toast('That image could not be read.','err')};im.src=fr.result};
  fr.readAsDataURL(file);
}
function dropzone(id,label,cur){return '<div class="drop" data-drop="'+id+'" tabindex="0" role="button" aria-label="'+esc(label)+'">'+(cur?'<img src="'+esc(cur)+'" alt="">':'<span>'+ic('upload')+'</span>')+'<div><b>'+esc(label)+'</b><small>Drag a photo here or click to browse · JPG, PNG, WebP</small></div><input type="file" accept="image/*" hidden data-file="'+id+'"></div>'}

/* ---------- charts ---------- */
function areaChart(a,b,labels){
  var W=640,H=240,pl=46,pr=12,pt=14,pb=28,max=Math.max.apply(0,a.concat(b)),step=Math.pow(10,String(Math.round(max)).length-1),mx=Math.ceil(max/step)*step||1;
  var x=function(i){return pl+i*(W-pl-pr)/(a.length-1)},y=function(v){return pt+(H-pt-pb)*(1-v/mx)};
  var path=function(v){var d='M'+x(0)+','+y(v[0]);for(var i=1;i<v.length;i++){var m=(x(i-1)+x(i))/2;d+=' C'+m+','+y(v[i-1])+' '+m+','+y(v[i])+' '+x(i)+','+y(v[i])}return d};
  var g='';for(var k=0;k<=4;k++){var vv=mx/4*k,yy=y(vv);g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yy+'" y2="'+yy+'" style="stroke:var(--line)"/><text x="'+(pl-8)+'" y="'+(yy+3)+'" text-anchor="end">'+cmp(vv)+'</text>'}
  var area=path(a)+' L'+x(a.length-1)+','+(H-pb)+' L'+x(0)+','+(H-pb)+'Z';
  var lb=labels.map(function(l,i){return '<text x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle">'+l+'</text>'}).join('');
  var dots=a.map(function(v,i){return '<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3.6" style="fill:var(--card);stroke:var(--accent);stroke-width:2.4"><title>'+labels[i]+': '+ngn(v)+'</title></circle>'}).join('');
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Sales this week compared with last week"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6A00" stop-opacity=".32"/><stop offset="1" stop-color="#FF6A00" stop-opacity="0"/></linearGradient></defs>'+g+'<path d="'+area+'" fill="url(#ga)"/><path d="'+path(b)+'" fill="none" style="stroke:var(--muted)" stroke-width="2" stroke-dasharray="5 5"/><path d="'+path(a)+'" fill="none" stroke="#FF6A00" stroke-width="3"/>'+dots+lb+'</svg>';
}
function barChart(vals,start,aria){
  var W=640,H=210,pl=8,pb=24,pt=10,max=Math.max.apply(0,vals)||1,bw=(W-pl*2)/vals.length;
  var b=vals.map(function(v,i){var h=(H-pb-pt)*v/max,hr=start+i,lab=(hr%12||12)+(hr<12?'a':'p'),pk=(hr>=12&&hr<=14)||(hr>=18&&hr<=21);return '<rect x="'+(pl+i*bw+3)+'" y="'+(H-pb-h)+'" width="'+(bw-6)+'" height="'+h+'" rx="5" style="fill:'+(pk?'#FF6A00':'var(--line)')+'"><title>'+lab+': '+v+' orders</title></rect><text x="'+(pl+i*bw+bw/2)+'" y="'+(H-8)+'" text-anchor="middle">'+lab+'</text>'}).join('');
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+(aria||'Orders by hour')+'">'+b+'</svg>';
}
function donut(parts,center,sub){
  var acc=0,cols=['#FF6A00','#12A150','#2563EB','#7C3AED','#B7791F'];
  var tot=parts.reduce(function(a,p){return a+p[1]},0)||1;
  var c=parts.map(function(p,i){var s=p[1]/tot*100,o=25-acc;acc+=s;return '<circle cx="21" cy="21" r="15.9155" fill="none" stroke="'+cols[i%5]+'" stroke-width="5" stroke-dasharray="'+Math.max(0,s-.6)+' '+(100-s+.6)+'" stroke-dashoffset="'+o+'"><title>'+esc(p[0])+': '+p[1]+'</title></circle>'}).join('');
  return '<svg class="chart" viewBox="0 0 42 42" style="max-width:13rem;margin:0 auto" role="img" aria-label="Share breakdown"><circle cx="21" cy="21" r="15.9155" fill="none" style="stroke:var(--fill)" stroke-width="5"/>'+c+'<text x="21" y="21" text-anchor="middle" style="font:800 5px var(--display);fill:var(--fg)">'+center+'</text><text x="21" y="26" text-anchor="middle" style="font:600 2.4px var(--body);fill:var(--muted)">'+(sub||'')+'</text></svg>';
}
function stars(n,sz){var o='';for(var i=1;i<=5;i++)o+='<svg class="ic st'+(i<=Math.round(n)?' on':'')+'" viewBox="0 0 24 24" '+(sz?'style="width:'+sz+'"':'')+' aria-hidden="true">'+IC.star+'</svg>';return '<span class="stars" aria-label="'+n+' out of 5">'+o+'</span>'}
function barcode(txt){var h=fnv(txt),o='',x=0,i;for(i=0;i<46;i++){h=Math.imul(h^(h>>>13),1274126177)>>>0;var w=1+(h&3),dark=i%2===0;if(dark)o+='<rect x="'+x+'" y="0" width="'+w+'" height="40"/>';x+=w}return '<svg class="bc" viewBox="0 0 '+x+' 40" preserveAspectRatio="none" role="img" aria-label="Barcode '+esc(txt)+'">'+o+'</svg>'}

/* ---------- router & shell ---------- */
var A={},INP={},CHG={},FORMS={};
function visible(r){return(!LV.on||!!r.lf)&&(!r.v||r.v.indexOf(S.vertical)>=0)}
function cur(){var h=location.hash.replace(/^#\/?/,'').split('?')[0].replace(/\/$/,'');if(h==='dashboard')h='';if(h==='settings/profile')h='settings';return ROUTES.filter(function(r){return r.p===h})[0]||null}
function lbl(r){return typeof r.n==='function'?r.n():r.n}
function buildNav(){
  var g='',html='';
  ROUTES.forEach(function(r){if(r.hide||!visible(r))return;if(r.g!==g){g=r.g;html+='<div class="grp">'+g+'</div>'}
    html+='<a href="#/'+r.p+'" data-p="'+r.p+'">'+ic(typeof r.i==='function'?r.i():r.i)+'<span>'+esc(lbl(r))+'</span>'+(r.badge?'<em class="nb" data-badge="'+r.badge+'"></em>':'')+'</a>'});
  $('#nav').innerHTML=html;
  var bt=['','orders','menu','wallet'],h='';
  [['', 'grid','Home'],[S.vertical==='package'?'shipments':'orders','list',S.vertical==='package'?'Shipments':'Orders'],[S.vertical==='restaurant'?'menu':S.vertical==='package'?'branches':'products',S.vertical==='package'?'pin':'bag',S.vertical==='package'?'Branches':'Catalogue'],[LV.on?'settings':'wallet',LV.on?'settings':'wallet',LV.on?'Settings':'Wallet']].forEach(function(b){h+='<a href="#/'+b[0]+'" data-p="'+b[0]+'">'+ic(b[1])+'<span>'+b[2]+'</span></a>'});
  h+='<button type="button" data-act="more">'+ic('menu')+'<span>More</span></button>';$('#btm').innerHTML=h;
}
function pendingCount(){return S.orders.filter(function(o){return o.status==='new'}).length+(S.vertical==='pharmacy'?0:0)}
function renderBar(){
  var st=S.store.status,b=brSel();
  $('#stat').innerHTML=[['open','Open','checkc'],['rush','Rush','flame'],['paused','Paused','ban']].map(function(x){return '<button type="button" data-act="status" data-id="'+x[0]+'" aria-pressed="'+(st===x[0])+'" class="s-'+x[0]+'">'+ic(x[2])+'<span>'+x[1]+'</span></button>'}).join('');
  $('#brSel').innerHTML=S.branches.map(function(x){return '<option value="'+x.id+'"'+(x.id===S.branch?' selected':'')+'>'+esc(x.name)+'</option>'}).join('');
  $('#snd').innerHTML=ic(S.sound?'volume':'volumeoff');$('#snd').setAttribute('aria-pressed',!!S.sound);$('#snd').setAttribute('aria-label',S.sound?'Mute order chime':'Unmute order chime');
  $('#ctxName').textContent=S.store.name;$('#ctxSub').textContent=V[S.vertical]+' · '+b.name;
  $('#ctxIcon').innerHTML=ic(VI[S.vertical]);$('#ctxIcon').style.background=VC[S.vertical];
  $('#avTop').textContent=initials(S.me.name);
  $('#roleTag').textContent=ROLE[role()];
  var m=$('#profMenu');m.innerHTML='<div class="hd"><b>'+esc(S.me.name)+'</b><small class="muted">'+esc(S.me.email)+'</small></div><div class="grp2">View dashboard as</div>'+Object.keys(ROLE).filter(function(r){return r!=='pharmacist'||S.vertical==='pharmacy'}).map(function(r){return '<button type="button" class="it" data-act="role" data-id="'+r+'" aria-pressed="'+(role()===r)+'">'+ic(role()===r?'checkc':'users')+ROLE[r]+'</button>'}).join('')+'<hr><button type="button" class="it" data-act="goto" data-id="settings">'+ic('settings')+'Store settings</button><button type="button" class="it" data-act="switchBiz">'+ic('store')+'My businesses</button><button type="button" class="it" data-act="goto" data-id="support">'+ic('help')+'Support & help</button><button type="button" class="it" data-act="testSound">'+ic('volume')+'Test order sound</button><button type="button" class="it mob" data-act="theme">'+ic('moon')+'Switch theme</button><button type="button" class="it" data-act="signout">'+ic('logout')+'Sign out (demo)</button>';
  var un=S.notifs.filter(function(n){return!n.read}).length,d=$('#nbadge');d.textContent=un;d.style.display=un?'':'none';
  $('#notifList').innerHTML=S.notifs.length?S.notifs.slice(0,12).map(function(n){return '<button type="button" class="it'+(n.read?'':' unread')+'" data-act="readN" data-id="'+n.id+'" style="width:100%;text-align:left">'+ic(n.read?'check':n.k)+'<span>'+esc(n.t)+'<small class="muted" style="display:block">'+ago(n.at)+'</small></span></button>'}).join(''):'<p class="muted" style="padding:1rem">No notifications yet.</p>';
  if(LV.on){
    $('#stat').innerHTML=[['open','Open','checkc'],['paused','Paused','ban']].map(function(x){return '<button type="button" data-act="status" data-id="'+x[0]+'" aria-pressed="'+(st===x[0])+'" class="s-'+x[0]+'">'+ic(x[2])+'<span>'+x[1]+'</span></button>'}).join('');
    $('#brSel').innerHTML=LV.me.stores.map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===LV.store.id?' selected':'')+'>'+esc(x.name)+'</option>'}).join('');
    m.innerHTML='<div class="hd"><b>'+esc(S.me.name)+'</b><small class="muted">'+esc(S.me.email)+'</small></div><button type="button" class="it" data-act="goto" data-id="settings">'+ic('settings')+'Store settings</button><button type="button" class="it" data-act="testSound">'+ic('volume')+'Test order sound</button><button type="button" class="it mob" data-act="theme">'+ic('moon')+'Switch theme</button><button type="button" class="it" data-act="switchBiz">'+ic('store')+'My businesses</button><button type="button" class="it" data-act="signout">'+ic('logout')+'Sign out</button>';
  }
  renderLiveBox();
  var np=pendingCount();[].forEach.call(document.querySelectorAll('[data-badge]'),function(e){e.textContent=np;e.style.display=np?'':'none'});
  document.documentElement.style.setProperty('--vc',VC[S.vertical]);
  var banner=$('#banner');banner.className='banner'+(st==='open'?'':' show '+st);banner.innerHTML=st==='rush'?ic('flame')+'<span>Rush mode is on. Customers see <b>+15 min</b> on every delivery estimate.</span>'+btn('Back to open','status','open','sm'):st==='paused'?ic('ban')+'<span>You are paused'+(S.store.pauseReason?' ('+esc(S.store.pauseReason)+')':'')+'. New orders are blocked.</span>'+btn('Reopen store','status','open','sm pri'):'';
}
function locked(r){
  return '<div class="card pad lockc">'+ic('lock')+'<h3>Restricted for '+esc(ROLE[role()])+'</h3><p class="muted">'+esc(lbl(r))+' is available to '+r.roles.map(function(x){return ROLE[x]}).join(', ')+'. Use the profile menu to view the dashboard as another role.</p><button type="button" class="btn pri" data-act="role" data-id="owner">Switch to Owner view</button></div>';
}
function render(keep){
  var r=cur(),main=$('#view');
  if(r&&!visible(r)){location.hash='#/';return}
  document.querySelectorAll('#nav a,#btm a').forEach(function(a){var on=r&&a.getAttribute('data-p')===r.p;a.classList.toggle('on',!!on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  if(r){main.innerHTML=(r.roles&&r.roles.indexOf(role())<0)?head(esc(lbl(r)),'')+locked(r):(LV.on?r.lf:r.f)();document.title=lbl(r)+' · ChowBuy Merchant'}
  else{main.innerHTML=head('Page not found','That page does not exist.')+'<div class="card">'+empty('search','Nothing here','Head back to your dashboard.','<a class="btn pri" href="#/">Go to dashboard</a>')+'</div>';document.title='Not found · ChowBuy Merchant'}
  $('#crumb').textContent=r?lbl(r):'Not found';
  renderBar();
  if(!keep)window.scrollTo(0,0);
}
function refresh(){
  var a=document.activeElement,fid=a&&a.getAttribute&&a.getAttribute('data-fid'),s,e;
  try{s=a.selectionStart;e=a.selectionEnd}catch(x){}
  var y=window.scrollY;render(true);window.scrollTo(0,y);
  if(fid){var n=document.querySelector('[data-fid="'+fid+'"]');if(n){n.focus();try{if(s!=null)n.setSelectionRange(s,e)}catch(x){}}}
}
function setVertical(v){
  var keep={store:S.store,me:S.me,sound:S.sound,notifs:S.notifs,banks:S.banks,wallet:S.wallet,staff:S.staff,hours:S.hours,pin:S.pin,tickets:S.tickets};
  S=window.MSEED(v);S.me=keep.me;S.sound=keep.sound;S.wallet=keep.wallet;S.banks=keep.banks;S.pin=keep.pin;S.tickets=keep.tickets;S.notifs=keep.notifs;S.hours=keep.hours;
  S.store=Object.assign(S.store,{status:'open',pauseReason:''});
  if(S.me.role==='pharmacist'&&v!=='pharmacy')S.me.role='owner';
  save();buildNav();
}
window.addEventListener('hashchange',function(){closeSide();$('#pop').classList.remove('show');$('#profMenu').classList.remove('show');render(false)});

/* ---------- global actions ---------- */
Object.assign(A,{
 tab:function(el){U.tab[el.getAttribute('data-k')]=el.getAttribute('data-v');U.page={};refresh()},
 pg:function(el){var k=el.getAttribute('data-id');U.page[k]=(U.page[k]||1)+Number(el.getAttribute('data-d'));refresh()},
 clear:function(el){var k=el.getAttribute('data-id');U.q[k]='';U.page={};refresh()},
 goto:function(el){$('#profMenu').classList.remove('show');location.hash='#/'+el.getAttribute('data-id')},
 more:function(){openSide()},
 theme:function(){setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark',true)},
 bell:function(){var p=$('#pop'),s=!p.classList.contains('show');p.classList.toggle('show',s);$('#bell').setAttribute('aria-expanded',s);$('#profMenu').classList.remove('show')},
 prof:function(){var p=$('#profMenu'),s=!p.classList.contains('show');p.classList.toggle('show',s);$('#pop').classList.remove('show')},
 readN:function(el){var n=find(S.notifs,el.getAttribute('data-id'));if(n){n.read=true;save();renderBar()}},
 readAll:function(){S.notifs.forEach(function(n){n.read=true});save();renderBar();toast('All notifications marked as read.')},
 sound:function(){S.sound=!S.sound;save();renderBar();toast(S.sound?'Order chime on.':'Order chime muted.');if(S.sound)chime()},
 testSound:function(){chime(true);toast('Test chime played. If you heard nothing, check your volume.')},
 role:function(el){var r=el.getAttribute('data-id');S.me.role=r;save();$('#profMenu').classList.remove('show');render(true);toast('Viewing as '+ROLE[r]+'.')},
 signout:function(){$('#profMenu').classList.remove('show');toast('This is a demo, so there is no session to end. Data stays in this browser.')},
 status:function(el){
   var v=el.getAttribute('data-id');if(v===S.store.status)return;
   if(v==='paused'){openM('<h3>Pause new orders</h3><p class="muted">Customers will see your store as closed until you reopen it. Orders already accepted continue.</p><div class="f" style="margin-top:1rem"><label for="pr">Reason</label><select id="pr" name="reason"><option>Out of gas</option><option>Kitchen full</option><option>Power outage</option><option>Holiday</option><option>Other</option></select></div>'+mfoot('Pause store','danger'),function(d){upd(function(){S.store.status='paused';S.store.pauseReason=d.reason;log('Store paused: '+d.reason,'ban')});toast('Store paused. Customers cannot place new orders.')});return}
   upd(function(){S.store.status=v;S.store.pauseReason='';log(v==='rush'?'Rush mode on (+15 min ETA)':'Store reopened','zap')});
   toast(v==='rush'?'Rush mode on. Customer ETAs now show +15 minutes.':'Store is open for orders.');
 },
 storefront:function(){
   var top=S.items.filter(function(i){return i.available!==false}).slice(0,4);
   openM('<h3>Customer storefront preview</h3><p class="muted">This is how '+esc(S.store.name)+' appears to customers right now.</p><div class="sf"><div class="sf-cover" style="'+(S.store.cover?'background-image:url('+esc(S.store.cover)+')':'background:linear-gradient(135deg,'+VC[S.vertical]+',#FF8A00)')+'"></div><div class="sf-b"><div class="acts" style="justify-content:space-between"><b style="font:800 1.15rem var(--display)">'+esc(S.store.name)+'</b>'+(S.store.status==='paused'?'<span class="pill bad">Closed</span>':S.store.status==='rush'?'<span class="pill warn">Busy</span>':'<span class="pill ok">Open</span>')+'</div><p class="muted">'+stars(avgRating(),'.9rem')+' '+avgRating().toFixed(1)+' · '+esc(brSel().name)+' · '+(S.vertical==='package'?'Pickup in 15 min':(S.store.eta+(S.store.status==='rush'?15:0))+' min delivery')+'</p>'+(S.vertical==='package'?'':'<div class="sf-items">'+top.map(function(i){return '<div><span>'+esc(i.name)+'</span><b class="mono">'+ngn(i.price)+'</b></div>'}).join('')+'</div>')+'</div></div><div class="ft"><button type="button" class="btn" data-m="x">Close</button><a class="btn pri" href="../app/checkout.html" target="_blank" rel="noopener">'+ic('ext')+'Open demo checkout</a></div>');
 }
});
function avgRating(){var r=S.reviews;return r.length?r.reduce(function(a,x){return a+x.rating},0)/r.length:4.6}
INP.q=function(k,v){U.q[k]=v;U.page={};refresh()};

/* ---------- global events ---------- */
document.addEventListener('click',function(e){
  var t=e.target,m=t.closest&&t.closest('[data-m]');
  if(m&&$('#mwrap').contains(m)){if(m.getAttribute('data-m')==='x'){closeM();return}var mf=MA[m.getAttribute('data-m')];if(mf){mf(m,e);return}}
  if($('#mwrap').classList.contains('show')&&t===$('#mwrap')){closeM();return}
  var dz=t.closest&&t.closest('[data-drop]');if(dz&&!t.closest('input')){var inp=dz.querySelector('input[type=file]');if(inp)inp.click();return}
  var a=t.closest&&t.closest('[data-act]');
  if(a){if(a.disabled)return;var fn=A[a.getAttribute('data-act')];if(fn){fn(a,e);return}}
  if(!(t.closest&&(t.closest('#pop')||t.closest('#bell'))))$('#pop').classList.remove('show');
  if(!(t.closest&&(t.closest('#profMenu')||t.closest('#avTop'))))$('#profMenu').classList.remove('show');
});
var MA={};
document.addEventListener('submit',function(e){
  var f=e.target;
  if(f.id==='mf'){e.preventDefault();var r=Mfn&&Mfn(fdata(f),f);if(typeof r==='string'){var er=$('#merr');if(er)er.textContent=r;return}if(r!==false)closeM();return}
  var n=f.getAttribute&&f.getAttribute('data-form');if(n&&FORMS[n]){e.preventDefault();FORMS[n](f)}
});
document.addEventListener('input',function(e){var t=e.target,k=t.getAttribute&&t.getAttribute('data-in');if(!k||t.composing)return;var i=k.indexOf(':');INP[k.slice(0,i)](k.slice(i+1),t.value,t)});
document.addEventListener('change',function(e){
  var t=e.target,k=t.getAttribute&&t.getAttribute('data-ch');
  if(t.id==='brSel'&&LV.on){var ns=LV.me.stores.filter(function(x){return x.id===t.value})[0];if(ns){LV.store=ns;lset('cb-merch-store',ns.id);LV.seen=null;liveLoad().then(function(){buildNav();refresh();toast('Showing '+ns.name+'.')},liveErr)}return}
  if(t.id==='brSel'){S.branch=t.value;save();refresh();toast('Showing '+brSel().name+'.');return}
  if(k){var i=k.indexOf(':');CHG[k.slice(0,i)](k.slice(i+1),t.value,t);return}
  var s=t.getAttribute&&t.getAttribute('data-file');if(s){FILES[s]&&FILES[s](t.files&&t.files[0],t)}
});
var FILES={};
['dragover','dragenter'].forEach(function(n){document.addEventListener(n,function(e){var d=e.target.closest&&e.target.closest('[data-drop]');if(d){e.preventDefault();d.classList.add('over')}})});
['dragleave','drop'].forEach(function(n){document.addEventListener(n,function(e){var d=e.target.closest&&e.target.closest('[data-drop]');if(d){e.preventDefault();d.classList.remove('over');if(n==='drop'){var id=d.getAttribute('data-drop');FILES[id]&&FILES[id](e.dataTransfer.files[0])}}})});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if($('#mwrap').classList.contains('show'))closeM();$('#pop').classList.remove('show');$('#profMenu').classList.remove('show');closeSide()}
  var t=e.target;if((e.key==='Enter'||e.key===' ')&&t.getAttribute&&t.getAttribute('data-drop')){e.preventDefault();t.querySelector('input').click()}
});
function openSide(){$('#side').classList.add('open');$('#scrim').classList.add('show');$('#burger').setAttribute('aria-expanded','true')}
function closeSide(){$('#side').classList.remove('open');$('#scrim').classList.remove('show');var b=$('#burger');if(b)b.setAttribute('aria-expanded','false')}
var mq=window.matchMedia('(prefers-color-scheme: dark)'),savedTheme=null;
try{savedTheme=localStorage.getItem('cb-theme')}catch(e){}
function setTheme(t,keep){document.documentElement.setAttribute('data-theme',t);var b=$('#theme');if(b){b.innerHTML=ic(t==='dark'?'sun':'moon');b.setAttribute('aria-label',t==='dark'?'Switch to light theme':'Switch to dark theme')}if(keep){savedTheme=t;try{localStorage.setItem('cb-theme',t)}catch(e){}}}

/* ---------- order helpers ---------- */
function otot(o){return o.sub+o.fee}
var OST=[['new','New'],['accepted','Accepted'],['preparing','Preparing'],['ready','Ready'],['out','Out for delivery'],['completed','Completed'],['cancelled','Cancelled']];
var OPILL={new:'warn',accepted:'info',preparing:'info',ready:'acc',out:'info',completed:'ok',cancelled:'bad'};
function dueLbl(o){
  if(o.status==='new')return ['Waiting '+Math.max(0,Math.round((Date.now()-o.ts)/60000))+'m',dim(o.ts)<-8?'over':'soon'];
  if(o.status==='accepted'||o.status==='preparing'){var d=dim(o.due);return d<0?['Overdue '+(-d)+'m','over']:[d+'m left',d<5?'soon':'ok']}
  if(o.status==='ready')return ['Ready for pickup','ok'];
  if(o.status==='out')return ['Out for delivery','ok'];
  return ['',''];
}
function cdBadge(o){var l=dueLbl(o);return l[0]?'<span class="cd '+l[1]+'" data-oid="'+esc(o.id)+'">'+ic('clock')+'<span>'+l[0]+'</span></span>':''}
function tick(){[].forEach.call(document.querySelectorAll('[data-oid]'),function(e){var o=find(S.orders,e.getAttribute('data-oid'));if(!o)return;var l=dueLbl(o);e.className='cd '+l[1];e.lastChild.textContent=l[0]})}
function lineHtml(l){return '<li><b>'+l.qty+'×</b> '+esc(l.name)+(l.mods.length?'<small class="muted"> + '+l.mods.map(esc).join(', ')+'</small>':'')+'<span class="mono">'+ngn((l.price+l.extra)*l.qty)+'</span></li>'}
function logo(){return S.store.logo?'<img src="'+esc(S.store.logo)+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">':esc(initials(S.store.name))}

/* ---------- dashboard ---------- */
function vDash(){
  var pk=S.vertical==='package',rev=can('revenue'),list=pk?S.ships:S.orders,f=bf();
  var live=pk?S.ships.filter(function(s){return s.status!=='delivered'}):S.orders.filter(function(o){return['new','accepted','preparing','ready'].indexOf(o.status)>=0});
  var sum=pk?S.ships.reduce(function(a,s){return a+shipFare(s)},0):S.orders.filter(function(o){return o.status!=='cancelled'}).reduce(function(a,o){return a+otot(o)},0);
  var gross=Math.round(1420000*f)+sum,cnt=Math.round(96*f)+list.length;
  var pend=pk?S.ships.filter(function(s){return s.status==='pending'}).length:S.orders.filter(function(o){return o.status==='new'}).length;
  var prep=pk?S.ships.filter(function(s){return['assigned','picked','transit'].indexOf(s.status)>=0}).length:S.orders.filter(function(o){return o.status==='accepted'||o.status==='preparing'}).length;
  var rdy=pk?0:S.orders.filter(function(o){return o.status==='ready'||o.status==='out'}).length;
  var done=pk?S.ships.filter(function(s){return s.status==='delivered'}).length:S.orders.filter(function(o){return o.status==='completed'}).length;
  var aov=cnt?Math.round(gross/cnt):0,rt=avgRating(),sat=S.reviews.length?Math.round(S.reviews.filter(function(r){return r.rating>=4}).length/S.reviews.length*100):0;
  var T7=[310,420,380,510,640,760,590].map(function(x){return Math.round(x*3200*f)}),L7=[290,380,400,450,560,690,610].map(function(x){return Math.round(x*3100*f)});
  var hrs=[3,6,14,31,44,38,22,15,12,19,34,51,47,28,12,5].map(function(x){return Math.max(1,Math.round(x*f))});
  var top=S.items.slice().sort(function(a,b){return b.sold-a.sold}).slice(0,5),tm=Math.max.apply(0,top.map(function(i){return i.sold}))||1;
  var ribbon=live.slice().sort(function(a,b){return pk?a.ts-b.ts:(a.due||a.ts)-(b.due||b.ts)}).slice(0,10);
  var h=head('Good '+(new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening')+', '+esc(S.me.name.split(' ')[0]),esc(S.store.name)+' · '+esc(brSel().name),'<a class="btn pri" href="#/'+(pk?'shipments':'orders')+'">'+ic('list')+'Open '+vtxt().orders.toLowerCase()+'</a>')+
  '<div class="grid g5">'+(rev?kpi('Gross sales today',ngn(gross),'+12.4% vs yesterday','trend','g'):kpi('Active '+vtxt().order+'s',live.length,'','list','g'))+
  kpi((pk?'Shipments':'Orders')+' today',cnt,'','bag')+
  kpi('Ticket time',(18+(S.store.status==='rush'?15:0))+' min',(rev?'AOV '+ngn(aov)+' · ':'')+'avg prep to ready','clock')+
  kpi('Store rating',rt.toFixed(1)+' / 5',sat+'% satisfied','star','n')+
  (can('withdraw')?'<div class="card kpi"><div class="l"><span>Wallet balance</span><span class="ico g">'+ic('wallet')+'</span></div><div class="v mono">'+ngn(S.wallet.available)+'</div><button type="button" class="btn pri sm" data-act="withdraw">'+ic('bank')+'Withdraw funds</button></div>':kpi('Wallet','Hidden','Owner only','lock'))+'</div>'+
  '<div class="card pad" style="margin-top:1rem"><div class="acts" style="justify-content:space-between"><div><h3>'+(pk?'Dispatch ribbon':S.vertical==='restaurant'?'Live kitchen ribbon':'Live order ribbon')+'</h3><p class="sub">Most urgent first. Tap a card to act.</p></div><div class="acts"><span class="pill warn">'+pend+' pending</span><span class="pill info">'+prep+' in progress</span><span class="pill acc">'+rdy+' ready/out</span><span class="pill ok">'+done+' done</span></div></div>'+
  (ribbon.length?'<div class="ribbon">'+ribbon.map(function(o){return pk?'<a class="rb" href="#/shipments"><b class="mono">'+esc(o.id)+'</b><span>'+esc(o.to.split(',')[0])+'</span>'+pill(o.status,PCship[o.status])+'</a>':'<a class="rb" href="#/orders" data-oid-wrap><b class="mono">'+esc(o.id)+'</b><span>'+esc(o.customer)+'</span>'+cdBadge(o)+'</a>'}).join('')+'</div>':empty('checkc','Queue is clear','New '+vtxt().order+'s will appear here with a chime.'))+'</div>'+
  (rev?'<div class="grid g2-1" style="margin-top:1rem"><div class="card pad"><div class="acts" style="justify-content:space-between"><div><h3>Weekly sales</h3><p class="sub">This week vs last week</p></div><div class="lg"><i style="background:#FF6A00"></i>This week <i class="d"></i>Last week</div></div>'+areaChart(T7,L7,['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])+'</div>'+
  '<div class="card pad"><h3>Top sellers</h3><p class="sub">Units sold and margin</p>'+(top.length?donut(top.map(function(i){return [i.name,i.sold]}),top.reduce(function(a,i){return a+i.sold},0),'units')+'<ol class="lead">'+top.map(function(i){var m=i.price?Math.round((i.price-i.cost)/i.price*100):0;return '<li><span>'+esc(i.name)+'</span><i style="--w:'+Math.round(i.sold/tm*100)+'%"></i><b class="mono">'+i.sold+'</b><small class="muted">'+m+'% margin</small></li>'}).join('')+'</ol>':empty('bag','No items yet','Add products to see your best sellers.'))+'</div></div>':'')+
  '<div class="grid g2" style="margin-top:1rem"><div class="card pad"><h3>Peak hours</h3><p class="sub">Lunch 12pm–2pm and dinner 6pm–9pm are highlighted</p>'+barChart(hrs,7,'Orders by hour of day')+'</div>'+
  '<div class="card pad"><h3>Recent activity</h3><ul class="feed">'+S.activity.slice(0,7).map(function(a){return '<li>'+ic(a.k)+'<span>'+esc(a.t)+'</span><small class="muted">'+ago(a.at)+'</small></li>'}).join('')+'</ul></div></div>';
  return h;
}
var PCship={pending:'warn',assigned:'info',picked:'info',transit:'info',delivered:'ok'};

/* ---------- orders ---------- */
function ost(){return LV.on?OST.filter(function(x){return x[0]!=='accepted'}):OST}
function vOrders(){
  var t=T('ord','new'),q=(U.q.ord||'').toLowerCase(),pf=T('ordP','all');
  var counts={};ost().forEach(function(s){counts[s[0]]=S.orders.filter(function(o){return o.status===s[0]}).length});
  var rows=S.orders.filter(function(o){return o.status===t&&(pf==='all'||o.pay===pf)&&(!q||(o.id+' '+o.customer+' '+o.lines.map(function(l){return l.name}).join(' ')).toLowerCase().indexOf(q)>=0)}).sort(function(a,b){return t==='completed'||t==='cancelled'?b.ts-a.ts:(a.due||a.ts)-(b.due||b.ts)});
  return head(vtxt().orders,'Accept, prepare and hand over every '+vtxt().order+'.',btn(ic('printer')+'Print all new','printNew','','')+btn(ic('volume')+'Test sound','testSound'))+
  '<div class="bar"><div class="tabs" role="group">'+ost().map(function(s){return '<button type="button" data-act="tab" data-k="ord" data-v="'+s[0]+'" aria-pressed="'+(t===s[0])+'" class="'+(s[0]==='new'&&counts.new?'pulse':'')+'">'+s[1]+' <em>'+counts[s[0]]+'</em></button>'}).join('')+'</div>'+search('ord','Search #CB-84920, customer or item')+
  '<label class="sr" for="pf">Payment</label><select id="pf" class="in" data-ch="opf:x" aria-label="Payment type"><option value="all">All payments</option>'+['Card','Transfer','Wallet','Cash on Delivery'].map(function(p){return '<option'+(pf===p?' selected':'')+'>'+p+'</option>'}).join('')+'</select></div>'+
  (rows.length?'<div class="ocards">'+rows.map(oCard).join('')+'</div>':'<div class="card">'+empty(t==='new'?'checkc':'list',t==='new'?'No new orders':'Nothing in '+ost().filter(function(s){return s[0]===t})[0][1],q?'No match for your search.':'New orders arrive here with a chime. Keep the store open to receive them.',q?btn('Clear search','clear','ord'):'<button type="button" class="btn pri" data-act="simNow">'+ic('zap')+'Simulate an incoming order</button>')+'</div>');
}
CHG.opf=function(k,v){U.tab.ordP=v;refresh()};
function oCard(o){
  var acts='';
  if(o.status==='new')acts=btn(ic('check')+'Accept','accept',o.id,'pri')+btn(ic('xc')+'Reject','reject',o.id,'danger');
  else if(o.status==='accepted')acts=btn(ic('flame')+'Start preparing','prepare',o.id,'pri')+btn('Cancel','reject',o.id,'danger');
  else if(o.status==='preparing')acts=btn(ic('checkc')+'Mark ready','ready',o.id,'pri');
  else if(o.status==='ready')acts=btn(ic('bike')+'Hand to rider','handoff',o.id,'pri');
  else if(o.status==='out')acts=btn(ic('checkc')+'Mark delivered','deliver',o.id,'pri');
  else if(o.status==='completed')acts=btn(ic('swap')+'Refund','refund',o.id);
  if(LV.on){var cx=(o.stage==='received'||o.stage==='preparing')?btn(ic('xc')+'Cancel','reject',o.id,'danger'):'';
    acts=o.status==='new'?btn(ic('check')+'Start preparing','accept',o.id,'pri')+cx:o.status==='preparing'?btn(ic('checkc')+'Mark ready','ready',o.id,'pri')+cx:o.status==='ready'?cx:''}
  return '<article class="oc '+o.status+'"><header><div><b class="mono">'+esc(o.id)+'</b><small class="muted"> · '+ago(o.ts)+'</small></div>'+pill(o.status,OPILL[o.status])+'</header>'+
  '<div class="acts" style="justify-content:space-between"><div><b>'+esc(o.customer)+'</b><div class="muted" style="font-size:.82rem">'+ic('pin')+' '+esc(o.addr)+'</div></div>'+(o.phone?'<a class="ib sm" href="tel:'+esc(o.phone.replace(/\s/g,''))+'" aria-label="Call '+esc(o.customer)+'" data-act="call" data-id="'+esc(o.id)+'">'+ic('phone')+'</a>':'')+'</div>'+
  '<div class="acts"><span class="pill '+(o.paid?'ok':'warn')+'">'+esc(o.pay)+' · '+(o.paid?'paid':'collect '+ngn(otot(o)))+'</span>'+cdBadge(o)+'</div>'+
  '<ul class="ol">'+o.lines.map(lineHtml).join('')+'</ul>'+(o.note?'<p class="onote">'+ic('msg')+esc(o.note)+'</p>':'')+
  '<div class="muted" style="font-size:.82rem">'+(o.rider?ic('bike')+' '+esc(o.rider.name)+' · '+esc(o.rider.plate):o.status==='cancelled'?esc(o.cancelReason):ic('search')+' Searching for nearby rider')+'</div>'+
  '<footer><b class="mono">'+ngn(otot(o))+'</b><div class="acts">'+acts+btn(ic('printer'),'ticket',o.id,'',' aria-label="Print ticket"')+btn('Details','odetail',o.id)+'</div></footer></article>';
}
function ordLog(o,msg){log(o.id+' '+msg,'list')}
Object.assign(A,{
 call:function(el){toast('Dialling '+find(S.orders,el.getAttribute('data-id')).customer+'…')},
 accept:function(el){
   var o=find(S.orders,el.getAttribute('data-id'));
   if(S.store.status==='paused'){noPerm('Store is paused. Reopen it before accepting orders.');return}
   openM('<h3>Accept '+esc(o.id)+'</h3><p class="muted">Set the kitchen prep time. The customer is notified immediately.</p><div class="radios" style="margin:1rem 0">'+[15,25,40].map(function(m,i){return '<label class="rad"><input type="radio" name="prep" value="'+m+'"'+(i===1?' checked':'')+'><span>'+m+' min</span></label>'}).join('')+'<label class="rad"><input type="radio" name="prep" value="custom"><span>Custom</span></label></div><div class="f"><label for="pc">Custom minutes</label><input id="pc" name="custom" inputmode="numeric" placeholder="e.g. 30"></div>'+mfoot('Accept order'),function(d){
     var m=d.prep==='custom'?parseInt(d.custom,10):parseInt(d.prep,10);if(!(m>=5&&m<=120))return 'Enter a prep time between 5 and 120 minutes.';
     upd(function(){o.status='accepted';o.prep=m;o.acceptedAt=Date.now();o.due=Date.now()+m*60000;ordLog(o,'accepted ('+m+' min prep)')});U.tab.ord='accepted';refresh();toast(o.id+' accepted. Customer told to expect it in about '+Math.round(m+S.store.eta/2+(S.store.status==='rush'?15:0))+' min.')});
 },
 prepare:function(el){var o=find(S.orders,el.getAttribute('data-id'));upd(function(){o.status='preparing';ordLog(o,'started preparing')});U.tab.ord='preparing';refresh();toast('Preparing '+o.id+'. Timer is running.')},
 ready:function(el){var o=find(S.orders,el.getAttribute('data-id'));upd(function(){o.status='ready';o.rider=o.rider||{name:['Musa Ibrahim','Kelechi Obi','Dayo Fashola','Sani Garba'][fnv(o.id)%4],plate:'LSD-'+(100+fnv(o.id)%899)+'XY',eta:6};ordLog(o,'marked ready')});U.tab.ord='ready';refresh();toast(o.id+' ready. SMS and push sent to '+o.rider.name+' and '+o.customer.split(' ')[0]+'.')},
 handoff:function(el){var o=find(S.orders,el.getAttribute('data-id'));upd(function(){o.status='out';ordLog(o,'handed to '+o.rider.name)});U.tab.ord='out';refresh();toast(o.rider.name+' is on the way to the customer.')},
 deliver:function(el){var o=find(S.orders,el.getAttribute('data-id'));upd(function(){o.status='completed';S.wallet.pending+=Math.round(o.sub*(1-commRate()/100));ordLog(o,'delivered');note(o.id+' delivered. '+ngn(Math.round(o.sub*(1-commRate()/100)))+' pending settlement.','checkc')});U.tab.ord='completed';refresh();toast(o.id+' marked delivered.')},
 reject:function(el){
   var o=find(S.orders,el.getAttribute('data-id'));
   openM('<h3>Cancel '+esc(o.id)+'</h3><p class="muted">The customer is refunded automatically. Pick a reason so they understand.</p><div class="radios col" style="margin:1rem 0">'+['Item out of stock','Store closing early','Power interruption','Other'].map(function(r,i){return '<label class="rad"><input type="radio" name="reason" value="'+r+'"'+(i===0?' checked':'')+'><span>'+r+'</span></label>'}).join('')+'</div><div class="f"><label for="rn">Note to customer (optional)</label><input id="rn" name="note" maxlength="120"></div>'+mfoot('Cancel order','danger','Keep order'),function(d){
     upd(function(){o.status='cancelled';o.cancelReason=d.reason;ordLog(o,'cancelled: '+d.reason)});U.tab.ord='cancelled';refresh();toast(o.id+' cancelled and customer refunded.')});
 },
 refund:function(el){
   if(!can('refund')){noPerm('Only the Owner or a Store Manager can issue refunds.');return}
   var o=find(S.orders,el.getAttribute('data-id'));
   openM('<h3>Refund '+esc(o.id)+'</h3><p class="muted">Order total '+ngn(otot(o))+'. The amount is deducted from your wallet.</p><div class="f" style="margin-top:1rem"><label for="ra">Refund amount (₦)</label><input id="ra" name="amt" inputmode="numeric" value="'+otot(o)+'"></div><div class="f"><label for="rr">Reason</label><select id="rr" name="why"><option>Item missing</option><option>Quality issue</option><option>Late delivery</option><option>Other</option></select></div>'+mfoot('Issue refund'),function(d){
     var a=parseInt(String(d.amt).replace(/\D/g,''),10);if(!(a>0&&a<=otot(o)))return 'Enter an amount up to '+ngn(otot(o))+'.';
     upd(function(){S.wallet.available-=a;S.wallet.ledger.unshift({id:'L'+Date.now(),t:'Refund '+o.id+' ('+d.why+')',amt:a,at:Date.now(),dir:-1});ordLog(o,'refunded '+ngn(a))});toast(ngn(a)+' refunded to '+o.customer+'.')});
 },
 odetail:function(el){
   var o=find(S.orders,el.getAttribute('data-id')),st=['new','accepted','preparing','ready','out','completed'],idx=st.indexOf(o.status);
   openM('<h3>'+esc(o.id)+' <span class="pill '+OPILL[o.status]+'">'+o.status+'</span></h3><div class="steps">'+st.map(function(s,i){return '<span class="'+(i<=idx?'on':'')+'">'+s+'</span>'}).join('')+'</div><div class="kv"><span>Customer</span><b>'+esc(o.customer)+'</b><span>Phone</span><b>'+esc(o.phone)+'</b><span>Delivery address</span><b>'+esc(o.addr)+'</b><span>Placed</span><b>'+dstr(o.ts)+'</b><span>Payment</span><b>'+esc(o.pay)+(o.paid?' (paid)':' (collect on delivery)')+'</b><span>Rider</span><b>'+(o.rider?esc(o.rider.name+' · '+o.rider.plate):'Searching for nearby rider')+'</b>'+(o.prep?'<span>Prep time</span><b>'+o.prep+' min</b>':'')+'</div><ul class="ol" style="margin-top:1rem">'+o.lines.map(lineHtml).join('')+'</ul>'+(o.note?'<p class="onote">'+ic('msg')+esc(o.note)+'</p>':'')+'<div class="kv tot"><span>Subtotal</span><b class="mono">'+ngn(o.sub)+'</b><span>Delivery fee</span><b class="mono">'+ngn(o.fee)+'</b><span>Total</span><b class="mono">'+ngn(otot(o))+'</b><span>Your payout after '+commRate()+'% commission</span><b class="mono">'+ngn(Math.round(o.sub*(1-commRate()/100)))+'</b></div><div class="ft"><button type="button" class="btn" data-m="x">Close</button><button type="button" class="btn pri" data-m="print" data-id="'+esc(o.id)+'">'+ic('printer')+'Print ticket</button></div>');
 },
 ticket:function(el){showTicket(el.getAttribute('data-id'))},
 printNew:function(){var n=S.orders.filter(function(o){return o.status==='new'});if(!n.length){toast('No new orders to print.','warn');return}showTicket(n[0].id,n)},
 simNow:function(){simOrder(true)}
});
MA.print=function(el){showTicket(el.getAttribute('data-id'))};
function commRate(){return {restaurant:15,grocery:8,pharmacy:10,package:12}[S.vertical]}
function showTicket(id,many){
  var os=many||[find(S.orders,id)];
  var one=function(o){return '<div class="ticket"><div class="tc"><b class="tn">'+esc(S.store.name)+'</b><div>'+esc(brSel().name)+'</div><div>'+esc(S.store.phone)+'</div></div><hr><div class="tc"><b style="font-size:15px">KITCHEN ORDER</b><div class="mono" style="font-size:18px;font-weight:800">'+esc(o.id)+'</div>'+barcode(o.id)+'</div><hr><div>Placed: '+dstr(o.ts)+'</div><div>Customer: '+esc(o.customer)+'</div><div>Phone: '+esc(o.phone)+'</div><div>Pay: '+esc(o.pay)+(o.paid?' (PAID)':' (COLLECT '+ngn(otot(o))+')')+'</div><hr>'+
    o.lines.map(function(l){return '<div class="tl"><b>'+l.qty+' x '+esc(l.name.toUpperCase())+'</b>'+l.mods.map(function(m){return '<div class="tm"><b>+ '+esc(m)+'</b></div>'}).join('')+'</div>'}).join('')+
    (o.note?'<div class="tnote"><b>NOTE:</b> '+esc(o.note)+'</div>':'')+'<hr><div class="tr"><span>Subtotal</span><span>'+ngn(o.sub)+'</span></div><div class="tr"><span>Delivery</span><span>'+ngn(o.fee)+'</span></div><div class="tr"><b>TOTAL</b><b>'+ngn(otot(o))+'</b></div><hr><div>Deliver to: '+esc(o.addr)+'</div><div class="tc" style="margin-top:8px">Printed '+dstr(Date.now())+'<br>Powered by ChowBuy</div></div>'};
  openM('<h3>Print kitchen order</h3><p class="muted">80 mm thermal receipt preview. Your printer driver does the rest.</p><div class="tkwrap">'+os.map(one).join('')+'</div><div class="ft"><button type="button" class="btn" data-m="x">Close</button><button type="button" class="btn pri" data-m="doprint">'+ic('printer')+'Print'+(os.length>1?' '+os.length+' tickets':'')+'</button></div>');
  if(!many)toast('Ticket ready to print.');
}
MA.doprint=function(){document.body.classList.add('printing');window.print();setTimeout(function(){document.body.classList.remove('printing')},500)};
var simN=0;
function simOrder(force){
  if(S.vertical==='package'){if(force||S.store.status!=='paused'){var i=simN++;S.ships.unshift({id:'PKG-'+(78000+Math.floor(Math.random()*999)),ts:Date.now(),status:'pending',from:S.branches[0].addr,to:'14 Adetokunbo Ademola St, Ikoyi',sender:'Walk-in customer',senderPhone:'+234 803 000 1111',recipient:'Ada Nwankwo',recipPhone:'+234 805 222 3333',weight:2,size:'Small',cat:'Documents',fragile:false,express:true,km:6.2,pod:'4-digit OTP Confirmation',rider:null,otp:'4821'});save();chime();note('New shipment request received.','box');toast('New shipment request received.');if(cur()&&cur().p==='shipments')refresh()}return}
  if(!force&&(S.store.status==='paused'||!S.items.length))return;
  if(!force&&S.orders.filter(function(o){return o.status==='new'}).length>=8)return;
  var i=100+simN++,p=S.items.filter(function(x){return x.available}),q=[],sub=0;
  for(var k=0;k<2&&p.length;k++){var it=p[Math.floor(Math.random()*p.length)];q.push({id:it.id,name:it.name,qty:1+Math.floor(Math.random()*2),price:it.price,mods:[],extra:0,note:''});sub+=it.price*q[q.length-1].qty}
  var names=['Ugochi Anene','Tobi Ogunleye','Rabi Sule','Chika Madu'],o={id:'#CB-'+(85000+Math.floor(Math.random()*900)),ts:Date.now(),status:'new',customer:names[i%4],phone:'+234 80'+(2+i%7)+' 555 '+(1000+i*11),addr:['9 Akin Adesola St, Victoria Island','Plot 12, Freedom Way, Lekki Phase 1','21 Mobolaji Bank Anthony Way, Ikeja'][i%3],pay:['Card','Transfer','Wallet','Cash on Delivery'][i%4],paid:i%4!==3,lines:q,sub:sub,fee:900,note:'',prep:0,acceptedAt:0,due:0,rider:null,cancelReason:''};
  S.orders.unshift(o);note('New order '+o.id+' from '+o.customer+' ('+ngn(otot(o))+')','bag');log('New order '+o.id+' received','bag');save();chime();toast('New order '+o.id+' from '+o.customer+'.');
  var r=cur();if(r&&(r.p===''||r.p==='orders')&&!$('#mwrap').classList.contains('show')&&!(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)))refresh();else renderBar();
}

/* ---------- catalogue (menu / products) ---------- */
function catOpts(){return S.cats.map(function(c){return [c.name,c.name]})}
function vCatalog(){
  var rest=S.vertical==='restaurant',t=T('cat','all'),q=(U.q.cat||'').toLowerCase(),flt=T('catF','all');
  var vis=S.cats.filter(function(c){return c.show});
  var rows=S.items.filter(function(i){return(t==='all'||i.cat===t)&&(!q||(i.name+' '+i.sku+' '+i.barcode).toLowerCase().indexOf(q)>=0)&&(flt==='all'||(flt==='out'&&!i.available)||(flt==='low'&&i.stock<=i.reorder))});
  var title=rest?'Menu':'Products & SKUs';
  return head(title,rest?'Dishes, add-ons and daily availability.':'Every SKU with barcode, pack size and stock.',(can('catalog')?btn(ic('plus')+'Add '+vtxt().item,'itemNew','','pri'):'')+btn(ic('tags')+'Categories','goto','categories'))+
  '<div class="bar"><div class="tabs" role="group"><button type="button" data-act="tab" data-k="cat" data-v="all" aria-pressed="'+(t==='all')+'">All <em>'+S.items.length+'</em></button>'+vis.map(function(c){return '<button type="button" data-act="tab" data-k="cat" data-v="'+esc(c.name)+'" aria-pressed="'+(t===c.name)+'">'+esc(c.name)+' <em>'+S.items.filter(function(i){return i.cat===c.name}).length+'</em></button>'}).join('')+'</div>'+search('cat','Search name, SKU or barcode')+
  '<select class="in" data-ch="catf:x" aria-label="Filter"><option value="all">All items</option><option value="out"'+(flt==='out'?' selected':'')+'>Out of stock / 86\'d</option><option value="low"'+(flt==='low'?' selected':'')+'>Low stock</option></select></div>'+
  (rows.length?'<div class="igrid">'+rows.map(iCard).join('')+'</div>':'<div class="card">'+empty('bag',S.items.length?'No match':'Your '+(rest?'menu':'catalogue')+' is empty',S.items.length?'Try another category or clear filters.':'Add your first '+vtxt().item+' to start selling.',can('catalog')?btn(ic('plus')+'Add '+vtxt().item,'itemNew','','pri'):'')+'</div>');
}
CHG.catf=function(k,v){U.tab.catF=v;refresh()};
function iCard(i){
  var rest=S.vertical==='restaurant',m=i.price?Math.round((i.price-i.cost)/i.price*100):0,low=i.stock<=i.reorder;
  return '<article class="ic2'+(i.available?'':' off')+'"><div class="ph2">'+(i.img?'<img src="'+esc(i.img)+'" alt="">':'<span style="background:'+VC[S.vertical]+'">'+esc(initials(i.name))+'</span>')+(i.available?'':'<em class="ban2">'+(rest?"86'd":'Out of stock')+'</em>')+'</div><div class="ib2"><div class="acts" style="justify-content:space-between;flex-wrap:nowrap"><b>'+esc(i.name)+'</b><b class="mono">'+ngn(i.price)+'</b></div><p class="muted" style="font-size:.82rem">'+esc(i.desc||i.pack||i.cat)+'</p><div class="acts">'+i.diet.map(function(d){return '<span class="pill '+(d==='Spicy'?'bad':d==='Rx only'?'info':'ok')+'">'+esc(d)+'</span>'}).join('')+(i.rx?'<span class="pill info">Rx</span>':'')+(i.controlled?'<span class="pill bad">Controlled</span>':'')+(low?'<span class="pill warn">Low stock</span>':'')+'</div><div class="muted" style="font-size:.78rem">'+(rest?'Prep '+i.prep+' min · ':'SKU '+esc(i.sku)+' · ')+'Stock '+i.stock+' · Margin '+m+'%</div></div><footer><label class="tg2"><button type="button" class="sw" role="switch" aria-checked="'+i.available+'" data-act="avail" data-id="'+i.id+'" aria-label="'+(rest?'Available (turn off to 86)':'In stock')+' '+esc(i.name)+'"></button><span>'+(i.available?'Available':(rest?"86'd":'Hidden'))+'</span></label><div class="acts">'+(can('catalog')?btn(ic('edit'),'itemEdit',i.id,'',' aria-label="Edit '+esc(i.name)+'"')+btn(ic('copy'),'itemDup',i.id,'',' aria-label="Duplicate"')+btn(ic('trash'),'itemDel',i.id,'danger',' aria-label="Delete"'):'')+'</div></footer></article>';
}
Object.assign(A,{
 avail:function(el){
   if(!can('stock86')){noPerm();return}
   var i=find(S.items,el.getAttribute('data-id'));
   if(i.available){openM('<h3>'+(S.vertical==='restaurant'?'86 ':'Mark out of stock: ')+esc(i.name)+'</h3><p class="muted">It disappears from customer search straight away.</p><div style="margin:1rem 0">'+chk('restore','Restore tomorrow automatically',true)+'</div>'+mfoot('Confirm','danger'),function(d){upd(function(){i.available=false;i.restore=!!d.restore;log(i.name+' marked unavailable','ban')});toast(i.name+' hidden from customers'+(d.restore?'. It returns tomorrow automatically.':'.'))})}
   else upd(function(){i.available=true;i.restore=false;log(i.name+' back on sale','checkc');toast(i.name+' is back on sale.')});
 },
 itemNew:function(){U.md=blankItem();showItem(false)},
 itemEdit:function(el){U.md=clone(find(S.items,el.getAttribute('data-id')));showItem(true)},
 itemDup:function(el){var i=clone(find(S.items,el.getAttribute('data-id')));i.id='I'+Date.now();i.name+=' (copy)';i.sku=i.sku?i.sku+'-C':'';i.barcode='';upd(function(){S.items.push(i)});toast(i.name+' created.')},
 itemDel:function(el){var i=find(S.items,el.getAttribute('data-id'));confirmM('Delete '+esc(i.name)+'?','It is removed from your '+vtxt().catalogue.toLowerCase()+' and from customer search.','Delete',function(){upd(function(){S.items=S.items.filter(function(x){return x.id!==i.id});log(i.name+' deleted','trash')});toast(i.name+' deleted.')},true)}
});
function blankItem(){return {id:'I'+Date.now(),name:'',cat:(S.cats[0]||{}).name||'',price:'',cost:'',sku:'',barcode:'',stock:20,reserved:0,reorder:10,pack:'',prep:15,diet:[],desc:'',vat:true,cal:'',allergens:'',available:true,restore:false,img:'',mods:[],rx:false,controlled:false,sold:0,batches:[]}}
function showItem(edit){
  var wasMd=U.md;
  openM(itemForm(edit),function(){
    var d=U.md;d.name=String(d.name).trim();
    if(d.name.length<2)return 'Give it a name.';
    var p=parseInt(String(d.price).replace(/\D/g,''),10);if(!(p>0))return 'Enter a selling price greater than zero.';
    d.price=p;d.cost=parseInt(String(d.cost).replace(/\D/g,''),10)||0;d.stock=parseInt(d.stock,10)||0;d.reorder=parseInt(d.reorder,10)||0;d.prep=parseInt(d.prep,10)||0;
    if(!d.cat)return 'Choose a category.';
    for(var g=0;g<d.mods.length;g++){var gr=d.mods[g];if(!String(gr.n).trim())return 'Name every add-on group.';if(!gr.opts.length)return 'Add at least one option to "'+gr.n+'".'}
    if(d.sku&&S.items.some(function(x){return x.sku===d.sku&&x.id!==d.id}))return 'That SKU is already used.';
    upd(function(){var ix=S.items.map(function(x){return x.id}).indexOf(d.id);if(ix>=0)S.items[ix]=d;else S.items.push(d);log(d.name+(edit?' updated':' added'),'tags')});
    toast(d.name+(edit?' saved.':' added to your '+vtxt().catalogue.toLowerCase()+'.'));
  },true);
}
function itemForm(edit){
  var d=U.md,rest=S.vertical==='restaurant',ph=S.vertical==='pharmacy';
  var tf=function(k,l,ex,cl){return '<div class="f'+(cl?' '+cl:'')+'"><label for="m-'+k+'">'+l+'</label><input id="m-'+k+'" data-fid="m-'+k+'" data-in="md:'+k+'" value="'+esc(d[k])+'" '+(ex||'')+'></div>'};
  var h='<h3>'+(edit?'Edit ':'New ')+vtxt().item+'</h3><div class="mgrid">'+tf('name','Name','maxlength="70"','w2')+'<div class="f"><label for="m-cat">Category</label><select id="m-cat" data-ch="mds:cat">'+S.cats.map(function(c){return '<option'+(c.name===d.cat?' selected':'')+'>'+esc(c.name)+'</option>'}).join('')+'</select></div>'+
   '<div class="f w3"><label for="m-desc">Description</label><textarea id="m-desc" rows="2" data-fid="m-desc" data-in="md:desc" maxlength="200">'+esc(d.desc)+'</textarea></div>'+
   '<div class="w3">'+dropzone('mdimg','Item photo',d.img)+(d.img?'<button type="button" class="btn sm" data-m="rmimg" style="margin-top:.5rem">Remove photo</button>':'')+'</div>'+
   tf('price','Selling price (₦)','inputmode="numeric"')+(can('price')?tf('cost','Cost price (₦, optional)','inputmode="numeric"'):'')+'<div class="f"><label>VAT</label>'+chk('vat','Prices include 7.5% VAT',d.vat,' data-ch="mdc:vat"')+'</div>'+
   (rest?tf('prep','Prep time (min)','inputmode="numeric"'):tf('pack','Pack size / unit'))+(rest?'':tf('sku','SKU')+tf('barcode','Barcode (EAN-13)','inputmode="numeric"'))+tf('stock',rest?'Portions available today':'In stock','inputmode="numeric"')+tf('reorder','Low-stock warning at','inputmode="numeric"')+
   tf('cal','Calories','placeholder="e.g. 640 kcal"')+tf('allergens','Allergens','placeholder="e.g. Fish, Gluten"')+'</div>'+
   '<div class="f" style="margin-top:.9rem"><label>Tags</label><div class="acts">'+(rest?['Halal','Spicy','Vegetarian']:['OTC','Rx only','Halal']).map(function(t){return chk('d-'+t,t,d.diet.indexOf(t)>=0,' data-ch="mdd:'+t+'"')}).join('')+(ph?chk('rx','Requires prescription',d.rx,' data-ch="mdc:rx"')+chk('controlled','Controlled drug',d.controlled,' data-ch="mdc:controlled"'):'')+'</div></div>';
  if(rest){h+='<div class="mods"><div class="acts" style="justify-content:space-between"><div><h4>Modifiers & add-ons</h4><small class="muted">Required choices, single or multi-select with limits.</small></div><button type="button" class="btn sm" data-m="addg">'+ic('plus')+'Add group</button></div>';
    d.mods.forEach(function(g,gi){h+='<div class="mg"><div class="mgrid" style="grid-template-columns:2fr 1fr 1fr 1fr auto"><div class="f"><label>Group name</label><input data-fid="g'+gi+'n" data-in="mg:'+gi+'|n" value="'+esc(g.n)+'" placeholder="e.g. Choose protein"></div><div class="f"><label>Choice</label><select data-ch="mgs:'+gi+'|type"><option value="single"'+(g.type==='single'?' selected':'')+'>Single choice</option><option value="multi"'+(g.type==='multi'?' selected':'')+'>Multi choice</option></select></div><div class="f"><label>Rule</label><select data-ch="mgs:'+gi+'|req"><option value="1"'+(g.req?' selected':'')+'>Required</option><option value="0"'+(!g.req?' selected':'')+'>Optional</option></select></div><div class="f"><label>Max picks</label><input data-fid="g'+gi+'m" data-in="mg:'+gi+'|max" inputmode="numeric" value="'+esc(g.max)+'"'+(g.type==='single'?' disabled':'')+'></div><button type="button" class="ib sm" data-m="delg" data-i="'+gi+'" aria-label="Remove group" style="align-self:end">'+ic('trash')+'</button></div><ul class="opts">'+g.opts.map(function(o,oi){return '<li><input data-fid="g'+gi+'o'+oi+'n" data-in="mo:'+gi+'|'+oi+'|0" value="'+esc(o[0])+'" placeholder="Option"><input data-fid="g'+gi+'o'+oi+'p" data-in="mo:'+gi+'|'+oi+'|1" inputmode="numeric" value="'+esc(o[1])+'" placeholder="+₦"><button type="button" class="ib sm" data-m="delo" data-i="'+gi+'|'+oi+'" aria-label="Remove option">'+ic('x')+'</button></li>'}).join('')+'</ul><button type="button" class="btn sm" data-m="addo" data-i="'+gi+'">'+ic('plus')+'Add option</button></div>'});h+='</div>'}
  return h+mfoot(edit?'Save changes':'Add '+vtxt().item);
}
function mdRe(){mre(function(){return itemForm(!!find(S.items,U.md.id))})}
INP.md=function(k,v){U.md[k]=v};
INP.mg=function(k,v){var p=k.split('|'),g=U.md.mods[+p[0]];g[p[1]]=p[1]==='max'?(parseInt(v,10)||1):v};
INP.mo=function(k,v){var p=k.split('|'),o=U.md.mods[+p[0]].opts[+p[1]];o[+p[2]]=+p[2]===1?(parseInt(String(v).replace(/\D/g,''),10)||0):v};
CHG.mds=function(k,v){U.md[k]=v};
CHG.mdc=function(k,v,el){U.md[k]=el.checked};
CHG.mdd=function(k,v,el){var a=U.md.diet,i=a.indexOf(k);if(el.checked&&i<0)a.push(k);if(!el.checked&&i>=0)a.splice(i,1)};
CHG.mgs=function(k,v){var p=k.split('|'),g=U.md.mods[+p[0]];if(p[1]==='req')g.req=v==='1';else{g.type=v;if(v==='single')g.max=1;else if(g.max<2)g.max=3}mdRe()};
MA.addg=function(){U.md.mods.push({n:'',type:'single',req:false,max:1,opts:[['',0]]});mdRe()};
MA.delg=function(el){U.md.mods.splice(+el.getAttribute('data-i'),1);mdRe()};
MA.addo=function(el){U.md.mods[+el.getAttribute('data-i')].opts.push(['',0]);mdRe()};
MA.delo=function(el){var p=el.getAttribute('data-i').split('|');U.md.mods[+p[0]].opts.splice(+p[1],1);mdRe()};
MA.rmimg=function(){U.md.img='';mdRe()};
FILES.mdimg=function(f){if(!f)return;compress(f,function(url){U.md.img=url;mdRe();toast('Photo added.')})};

/* ---------- categories ---------- */
function vCategories(){
  var rows=S.cats;
  return head('Categories','Group your '+vtxt().item+'s. Order here is the order customers see.',btn(ic('plus')+'Add category','catNew','','pri'))+
  '<div class="card">'+(rows.length?'<div class="tw"><table class="t"><thead><th>Order</th><th>Category</th><th class="r">Items</th><th>Visible</th><th></th></thead><tbody>'+rows.map(function(c,i){var n=S.items.filter(function(x){return x.cat===c.name}).length;return '<tr><td><div class="acts"><button type="button" class="ib sm" data-act="catMove" data-id="'+c.id+'" data-d="-1"'+(i?'':' disabled')+' aria-label="Move up">'+ic('up')+'</button><button type="button" class="ib sm" data-act="catMove" data-id="'+c.id+'" data-d="1"'+(i<rows.length-1?'':' disabled')+' aria-label="Move down">'+ic('dn')+'</button></div></td><td><b>'+esc(c.name)+'</b></td><td class="r mono">'+n+'</td><td>'+sw(c.show,'catVis',c.id,'Show '+c.name+' to customers')+'</td><td><div class="acts">'+btn(ic('edit')+'Rename','catRen',c.id)+btn(ic('trash'),'catDel',c.id,'danger',' aria-label="Delete '+esc(c.name)+'"')+'</div></td></tr>'}).join('')+'</tbody></table></div>':empty('tags','No categories','Create one to organise your catalogue.',btn(ic('plus')+'Add category','catNew','','pri')))+'</div>';
}
Object.assign(A,{
 catNew:function(){openM('<h3>New category</h3><div class="f" style="margin-top:1rem"><label for="cn">Name</label><input id="cn" name="name" maxlength="40"></div>'+mfoot('Add category'),function(d){var n=d.name.trim();if(n.length<2)return 'Enter a category name.';if(S.cats.some(function(c){return c.name.toLowerCase()===n.toLowerCase()}))return 'That category exists.';upd(function(){S.cats.push({id:'C'+Date.now(),name:n,show:true})});toast(n+' added.')})},
 catRen:function(el){var c=find(S.cats,el.getAttribute('data-id'));openM('<h3>Rename category</h3><div class="f" style="margin-top:1rem"><label for="cn">Name</label><input id="cn" name="name" value="'+esc(c.name)+'" maxlength="40"></div>'+mfoot('Save'),function(d){var n=d.name.trim();if(n.length<2)return 'Enter a name.';upd(function(){S.items.forEach(function(i){if(i.cat===c.name)i.cat=n});c.name=n});toast('Renamed to '+n+'.')})},
 catMove:function(el){var id=el.getAttribute('data-id'),d=+el.getAttribute('data-d'),i=S.cats.map(function(c){return c.id}).indexOf(id),j=i+d;if(j<0||j>=S.cats.length)return;upd(function(){var t=S.cats[i];S.cats[i]=S.cats[j];S.cats[j]=t})},
 catVis:function(el){var c=find(S.cats,el.getAttribute('data-id'));upd(function(){c.show=!c.show});toast(c.name+(c.show?' is visible to customers.':' is hidden from customers.'))},
 catDel:function(el){var c=find(S.cats,el.getAttribute('data-id')),n=S.items.filter(function(x){return x.cat===c.name}).length;if(n){toast('Move or delete the '+n+' item(s) in '+c.name+' first.','err');return}confirmM('Delete '+esc(c.name)+'?','This category is empty and will be removed.','Delete',function(){upd(function(){S.cats=S.cats.filter(function(x){return x.id!==c.id})});toast('Category deleted.')},true)}
});

/* ---------- inventory ---------- */
function nearExp(i){var b=(i.batches||[]).filter(function(x){return x.qty>0}).sort(function(a,b){return a.exp-b.exp})[0];return b?b.exp:0}
function vInventory(){
  var q=(U.q.inv||'').toLowerCase(),f=T('invF','all'),rest=S.vertical==='restaurant',now=Date.now();
  var low=S.items.filter(function(i){return i.stock<=i.reorder}),exp=S.items.filter(function(i){var e=nearExp(i);return e&&e-now<14*86400000});
  var rows=S.items.filter(function(i){return(!q||(i.name+' '+i.sku+' '+i.barcode).toLowerCase().indexOf(q)>=0)&&(f==='all'||(f==='low'&&i.stock<=i.reorder)||(f==='exp'&&exp.indexOf(i)>=0))});
  var pg=paged(rows,'inv',10);
  return head('Inventory & stock','SKUs, barcodes, reorder alerts'+(rest?'.':' and expiry tracking.'),btn(ic('scan')+'Scan barcode','scanCam')+btn(ic('upload')+'Import CSV','impCsv')+btn(ic('down')+'Export CSV','expCsv')+btn(ic('plus')+'Receive stock','recv','','pri'))+
  '<div class="grid g4">'+kpi('SKUs',S.items.length,'','box')+kpi('Low stock',low.length,'','alert',low.length?'':'g')+(rest?kpi('86\'d today',S.items.filter(function(i){return !i.available}).length,'','ban'):kpi('Expiring in 14 days',exp.length,'','clock',exp.length?'':'g'))+kpi('Stock value (cost)',ngn(S.items.reduce(function(a,i){return a+i.cost*i.stock},0)),'','wallet')+'</div>'+
  (low.length?'<div class="card pad alertc" style="margin-top:1rem"><div class="acts" style="justify-content:space-between"><div><h3>'+ic('alert')+' Reorder alerts</h3><p class="sub">'+low.length+' item(s) at or below the warning level: '+low.slice(0,4).map(function(i){return esc(i.name)}).join(', ')+(low.length>4?'…':'')+'</p></div>'+btn(ic('file')+'Create purchase list','po','','pri')+'</div></div>':'')+
  '<form class="bar" data-form="scan" style="margin-top:1rem"><label class="srch">'+ic('scan')+'<span class="sr">Scan or type barcode</span><input name="code" placeholder="Scan or type a barcode / SKU, then press Enter" autocomplete="off" inputmode="numeric"></label><button class="btn" type="submit">Find</button>'+search('inv','Filter by name')+'<div class="tabs sm"><button type="button" data-act="tab" data-k="invF" data-v="all" aria-pressed="'+(f==='all')+'">All</button><button type="button" data-act="tab" data-k="invF" data-v="low" aria-pressed="'+(f==='low')+'">Low stock</button>'+(rest?'':'<button type="button" data-act="tab" data-k="invF" data-v="exp" aria-pressed="'+(f==='exp')+'">Expiring</button>')+'</div></form>'+
  '<div class="card" style="margin-top:1rem">'+(pg.rows.length?'<div class="tw"><table class="t" style="min-width:56rem"><thead><tr><th>Item</th><th>SKU</th><th>Barcode</th><th class="r">In stock</th><th class="r">In carts</th><th class="r">Warn at</th>'+(rest?'':'<th>Next expiry</th>')+'<th>Status</th><th></th></tr></thead><tbody>'+pg.rows.map(function(i){var e=nearExp(i),st=i.stock<=0?['bad','Out']:i.stock<=i.reorder?['warn','Low']:['ok','Healthy'];return '<tr><td><b>'+esc(i.name)+'</b><div class="muted" style="font-size:.78rem">'+esc(i.cat)+'</div></td><td class="mono">'+esc(i.sku||'—')+'</td><td class="mono">'+esc(i.barcode||'—')+'</td><td class="r mono">'+i.stock+'</td><td class="r mono">'+Math.min(i.reserved||Math.floor(i.stock*.1),i.stock)+'</td><td class="r mono">'+i.reorder+'</td>'+(rest?'':'<td>'+(e?'<span class="'+(e-now<14*86400000?'expsoon':'')+'">'+new Date(e).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'})+'</span>':'—')+'</td>')+'<td><span class="pill '+st[0]+'">'+st[1]+'</span></td><td><div class="acts">'+btn('Receive','recv',i.id)+btn('Adjust','adj',i.id)+'</div></td></tr>'}).join('')+'</tbody></table></div>'+pager(pg,'inv'):empty('box','No items match','Clear the filter or import a CSV.',btn('Clear','clear','inv')))+'</div>';
}
FORMS.scan=function(f){var c=f.elements.code.value.trim();if(!c)return;var i=S.items.filter(function(x){return x.barcode===c||x.sku.toLowerCase()===c.toLowerCase()})[0];if(!i){toast('No item with code '+c+'. Check the number or add the item first.','err');return}f.elements.code.value='';adjustModal(i)};
function adjustModal(i){openM('<h3>Adjust stock: '+esc(i.name)+'</h3><p class="muted">Currently '+i.stock+' in stock. Set the counted quantity.</p><div class="mgrid" style="margin-top:1rem"><div class="f"><label for="as">Counted quantity</label><input id="as" name="qty" inputmode="numeric" value="'+i.stock+'"></div><div class="f"><label for="ar">Reason</label><select id="ar" name="why"><option>Stock count</option><option>Damaged</option><option>Expired</option><option>Theft / loss</option><option>Other</option></select></div></div>'+mfoot('Save count'),function(d){var q=parseInt(d.qty,10);if(!(q>=0))return 'Enter a number of zero or more.';upd(function(){var diff=q-i.stock;i.stock=q;if(i.batches&&i.batches[0]){i.batches[0].qty=Math.max(0,i.batches[0].qty+diff)}if(q===0)i.available=false;log(i.name+' stock set to '+q+' ('+d.why+')','box')});toast(i.name+' stock updated to '+q+'.')})}
Object.assign(A,{
 adj:function(el){adjustModal(find(S.items,el.getAttribute('data-id')))},
 recv:function(el){
   var id=el.getAttribute('data-id'),rest=S.vertical==='restaurant';
   openM('<h3>Receive stock</h3><div class="mgrid" style="margin-top:1rem"><div class="f w2"><label for="rs">Item</label><select id="rs" name="id">'+S.items.map(function(i){return '<option value="'+i.id+'"'+(i.id===id?' selected':'')+'>'+esc(i.name)+'</option>'}).join('')+'</select></div><div class="f"><label for="rq">Quantity received</label><input id="rq" name="qty" inputmode="numeric"></div>'+(rest?'':'<div class="f"><label for="rb">Batch / lot no.</label><input id="rb" name="batch" placeholder="e.g. B245"></div><div class="f"><label for="re">Expiry date</label><input id="re" name="exp" type="date"></div>')+'</div>'+mfoot('Add to stock'),function(d){
     var q=parseInt(d.qty,10);if(!(q>0))return 'Enter the quantity received.';var i=find(S.items,d.id);if(!i)return 'Choose an item.';
     var exp=d.exp?new Date(d.exp+'T12:00:00').getTime():0;if(!rest&&i.rx&&!exp)return 'Medicines need an expiry date.';
     upd(function(){i.stock+=q;i.available=true;i.batches=i.batches||[];i.batches.push({no:d.batch||'B'+Date.now().toString().slice(-4),qty:q,exp:exp||0});log(q+' × '+i.name+' received','box')});toast(q+' × '+i.name+' added to stock.')})},
 po:function(){var rows=[['SKU','Item','In stock','Warn at','Suggested order qty']].concat(S.items.filter(function(i){return i.stock<=i.reorder}).map(function(i){return [i.sku,i.name,i.stock,i.reorder,Math.max(i.reorder*3-i.stock,i.reorder)]}));csvOut('purchase-list.csv',rows);toast('Purchase list downloaded ('+(rows.length-1)+' items).')},
 expCsv:function(){csvOut('inventory.csv',[['sku','name','category','barcode','stock','reorder','price','cost']].concat(S.items.map(function(i){return [i.sku,i.name,i.cat,i.barcode,i.stock,i.reorder,i.price,i.cost]})));toast('Inventory exported.')},
 impCsv:function(){openM('<h3>Import inventory CSV</h3><p class="muted">Columns: <code>sku,name,stock,price,cost,reorder</code>. Rows with a known SKU update that item; new SKUs create items. Max 500 rows.</p><div style="margin:1rem 0">'+dropzone('csv','Choose a CSV file')+'</div><div class="ft"><button type="button" class="btn" data-m="x">Close</button><button type="button" class="btn" data-m="tpl">Download template</button></div>')},
 scanCam:function(){
   if(!('BarcodeDetector' in window)||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Camera scanning is not supported in this browser. Use a USB or Bluetooth scanner (it types into the box above) or type the code.','warn');$('[name=code]')&&$('[name=code]').focus();return}
   openM('<h3>Scan a barcode</h3><video id="cam" playsinline muted style="width:100%;border-radius:12px;background:#000"></video><p class="muted" id="camm">Point the camera at a barcode.</p><div class="ft"><button type="button" class="btn" data-m="stopcam">Close</button></div>');
   navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(function(st){var v=$('#cam');if(!v){st.getTracks().forEach(function(t){t.stop()});return}v.srcObject=st;v.play();U.cam=st;var det=new window.BarcodeDetector();(function loop(){if(!U.cam)return;det.detect(v).then(function(r){if(r&&r[0]){var c=r[0].rawValue;stopCam();closeM();var i=S.items.filter(function(x){return x.barcode===c||x.sku===c})[0];if(i)adjustModal(i);else toast('Scanned '+c+' but no matching item.','err')}else setTimeout(loop,300)}).catch(function(){setTimeout(loop,500)})})()}).catch(function(){var m=$('#camm');if(m)m.textContent='Camera permission was denied.'});
 }
});
function stopCam(){if(U.cam){U.cam.getTracks().forEach(function(t){t.stop()});U.cam=null}}
MA.stopcam=function(){stopCam();closeM()};
MA.tpl=function(){csvOut('inventory-template.csv',[['sku','name','stock','price','cost','reorder'],['SKU-001','Example item','25','1500','900','10']])};
FILES.csv=function(f){
  if(!f)return;var fr=new FileReader();fr.onload=function(){
    var lines=String(fr.result).replace(/^﻿/,'').split(/\r?\n/).filter(function(l){return l.trim()});if(lines.length<2){toast('That file has no rows.','err');return}
    var hd=lines[0].split(',').map(function(x){return x.trim().toLowerCase().replace(/"/g,'')});if(hd.indexOf('sku')<0){toast('The first column must be "sku".','err');return}
    var up=0,nw=0;lines.slice(1,501).forEach(function(l){var c=l.split(',').map(function(x){return x.trim().replace(/^"|"$/g,'')}),o={};hd.forEach(function(h,i){o[h]=c[i]});if(!o.sku)return;var i=S.items.filter(function(x){return x.sku===o.sku})[0];
      if(i){if(o.stock!=null&&o.stock!=='')i.stock=parseInt(o.stock,10)||0;if(o.price)i.price=parseInt(o.price,10)||i.price;if(o.cost)i.cost=parseInt(o.cost,10)||i.cost;if(o.reorder)i.reorder=parseInt(o.reorder,10)||i.reorder;up++}
      else if(o.name){var n=blankItem();n.id='I'+Date.now()+nw;n.sku=o.sku;n.name=o.name;n.stock=parseInt(o.stock,10)||0;n.price=parseInt(o.price,10)||0;n.cost=parseInt(o.cost,10)||0;n.reorder=parseInt(o.reorder,10)||10;S.items.push(n);nw++}});
    save();closeM();refresh();toast('Import done: '+up+' updated, '+nw+' new.')};
  fr.readAsText(f);
};

/* ---------- pharmacy prescriptions ---------- */
var RXST=[['pending','Pending'],['clarify','Clarify'],['verified','Verified'],['rejected','Rejected']],RXP={pending:'warn',clarify:'info',verified:'ok',rejected:'bad'};
function rxSvg(r){
  var y=70,lines=r.drugs.map(function(d,i){var s='<text x="34" y="'+(y+i*58)+'" class="rxh">'+(i+1)+'. '+esc(d.name)+'</text><text x="52" y="'+(y+i*58+22)+'" class="rxs">'+esc(d.sig)+'</text>';return s}).join('');
  return '<svg viewBox="0 0 420 520" class="rxpaper" role="img" aria-label="Prescription from '+esc(r.doctor)+' for '+esc(r.patient)+'"><rect width="420" height="520" fill="#FFFDF6"/><rect x="0" y="0" width="420" height="64" fill="#E9F1FB"/><text x="24" y="28" class="rxt">'+esc(r.clinic)+'</text><text x="24" y="48" class="rxs2">'+esc(r.doctor)+' · '+esc(r.clinicReg||'No registration')+'</text><text x="34" y="'+(y-18)+'" class="rxbig">℞</text><g transform="translate(0,22)">'+lines+'</g><text x="24" y="460" class="rxs2">Patient: '+esc(r.patient)+' ('+r.age+' yrs)</text><text x="24" y="480" class="rxs2">Date: '+dstr(r.ts).slice(0,6)+' · Signed: '+(r.doctor==='Unreadable'?'~':esc(r.doctor.replace('Dr. ','')))+'</text><path d="M300 470c20-30 40 10 70-20s20 20 30 0" stroke="#243b6b" stroke-width="2" fill="none"/>'+(r.doctor==='Unreadable'?'<rect x="0" y="0" width="420" height="520" fill="#fff" opacity=".55"/>':'')+'</svg>';
}
function vRx(){
  var t=T('rx','pending'),list=S.rx.filter(function(r){return r.status===t}),sel=find(S.rx,U.rxSel)||list[0];
  if(sel&&sel.status!==t&&!list.length)sel=null;
  var c={};RXST.forEach(function(s){c[s[0]]=S.rx.filter(function(r){return r.status===s[0]}).length});
  var h=head('Prescriptions','Pharmacist verification queue. Every controlled drug needs a licensed sign-off.',btn(ic('zap')+'Simulate upload','rxSim'))+
   '<div class="bar"><div class="tabs">'+RXST.map(function(s){return '<button type="button" data-act="tab" data-k="rx" data-v="'+s[0]+'" aria-pressed="'+(t===s[0])+'">'+s[1]+' <em>'+c[s[0]]+'</em></button>'}).join('')+'</div></div>';
  if(!list.length)return h+'<div class="card">'+empty('clip','No '+t+' prescriptions','New uploads from customers show up here.',btn(ic('zap')+'Simulate an upload','rxSim','','pri'))+'</div>';
  if(!sel||sel.status!==t)sel=list[0];
  var ctrl=sel.drugs.some(function(d){return d.controlled||(find(S.items,d.itemId)||{}).controlled});
  var ck=sel.chk||{};
  var all=ck.identity&&ck.doctor&&ck.dose&&(!ctrl||ck.ctrl);
  var z=U.rxz||1,rot=U.rxr||0;
  return h+'<div class="rxwrap"><div class="card rxlist"><ul>'+list.map(function(r){return '<li><button type="button" data-act="rxSel" data-id="'+r.id+'" aria-pressed="'+(r.id===sel.id)+'"><b>'+esc(r.patient)+'</b><span class="muted">'+r.id+' · '+ago(r.ts)+'</span><span>'+r.drugs.map(function(d){return esc(d.name.split(' ')[0])}).join(', ')+(r.drugs.some(function(d){return d.controlled||(find(S.items,d.itemId)||{}).controlled})?' <i class="pill bad">Controlled</i>':'')+'</span></button></li>'}).join('')+'</ul></div>'+
  '<div class="rxmain"><div class="card pad"><div class="acts" style="justify-content:space-between"><div><h3>'+esc(sel.id)+' · '+esc(sel.patient)+'</h3><p class="sub">'+esc(sel.doctor)+' · '+esc(sel.clinic)+'</p></div>'+pill(sel.status,RXP[sel.status])+'</div>'+
  '<div class="rxview"><div class="rxtools">'+btn(ic('zoomin'),'rxz','','',' data-d="0.25" aria-label="Zoom in"')+btn(ic('zoomout'),'rxz','','',' data-d="-0.25" aria-label="Zoom out"')+btn(ic('rot'),'rxrot','','',' aria-label="Rotate"')+btn('Reset','rxreset')+'<small class="muted">Scroll or drag to pan</small></div><div class="rxbox" id="rxbox"><div style="transform:scale('+z+') rotate('+rot+'deg);transform-origin:center;width:100%;transition:transform .15s">'+rxSvg(sel)+'</div></div></div></div>'+
  '<div class="card pad"><h3>Validation checklist</h3>'+(ctrl?'<div class="warnbox">'+ic('alert')+'<span><b>Controlled drug detected.</b> Release needs the pharmacist\'s PCN number and digital signature.</span></div>':'')+
  '<div class="checks">'+[['identity','Patient identity matches the account ('+esc(sel.patient)+', '+sel.age+' yrs)'],['doctor','Prescriber and clinic verified ('+esc(sel.clinicReg||'unregistered')+')'],['dose','Drug, strength and dosage are clear and appropriate']].concat(ctrl?[['ctrl','Controlled drug quantity within legal limit and prescription is original']]:[]).map(function(x){return '<label class="chk"><input type="checkbox" data-ch="rxck:'+x[0]+'"'+(ck[x[0]]?' checked':'')+(sel.status==='verified'||sel.status==='rejected'?' disabled':'')+'><span>'+x[1]+'</span></label>'}).join('')+'</div>'+
  '<h4 style="margin-top:1rem">Prescribed</h4><ul class="ol">'+sel.drugs.map(function(d){var it=find(S.items,d.itemId);return '<li><b>'+esc(d.name)+'</b><small class="muted"> '+esc(d.sig)+'</small><span class="pill '+(it&&it.stock>0?'ok':'bad')+'">'+(it?(it.stock>0?it.stock+' in stock':'Out of stock'):'Not stocked')+'</span></li>'}).join('')+'</ul>'+
  (sel.clarify?'<p class="onote">'+ic('msg')+esc(sel.clarify)+'</p>':'')+(sel.reason?'<p class="onote">'+ic('ban')+'Rejected: '+esc(sel.reason)+'</p>':'')+(sel.link?'<p class="onote">'+ic('link')+'Checkout link sent: <span class="mono">'+esc(sel.link)+'</span> '+btn('Copy','copy','','sm',' data-v="'+esc(sel.link)+'"')+'</p>':'')+
  (sel.status==='pending'||sel.status==='clarify'?'<div class="acts" style="margin-top:1rem">'+btn(ic('checkc')+'Verify & build cart','rxVerify',sel.id,'pri',all?'':' data-blocked="1"')+btn(ic('msg')+'Clarify','rxClar',sel.id)+btn(ic('xc')+'Reject','rxRej',sel.id,'danger')+'<a class="btn" href="tel:'+esc(sel.phone.replace(/\s/g,''))+'" data-act="call2" data-id="'+esc(sel.patient)+'">'+ic('phone')+'Call patient</a></div>'+(all?'':'<small class="muted">Tick every checklist item to enable verification.</small>'):'<small class="muted">'+(sel.signed?'Signed by '+esc(sel.signed)+' · '+esc(sel.pcnUsed):'')+'</small>')+'</div></div></div>';
}
CHG.rxck=function(k,v,el){var r=find(S.rx,U.rxSel)||S.rx.filter(function(x){return x.status===T('rx','pending')})[0];r.chk=r.chk||{};r.chk[k]=el.checked;save();refresh()};
Object.assign(A,{
 rxSel:function(el){U.rxSel=el.getAttribute('data-id');U.rxz=1;U.rxr=0;refresh()},
 rxz:function(el){U.rxz=Math.min(3,Math.max(.5,(U.rxz||1)+parseFloat(el.getAttribute('data-d'))));refresh()},
 rxrot:function(){U.rxr=((U.rxr||0)+90)%360;refresh()},
 rxreset:function(){U.rxz=1;U.rxr=0;refresh()},
 call2:function(el){toast('Dialling '+el.getAttribute('data-id')+'…')},
 rxSim:function(){var n=S.rx.length+1,r={id:'RX-'+(3305+n),patient:['Rabi Sule','Chika Madu','Tobi Ogunleye'][n%3],age:20+n*3,phone:'+234 803 777 '+(1000+n),doctor:'Dr. N. Eze',clinic:'Garki Hospital, Abuja',clinicReg:'MDCN 44120',ts:Date.now(),status:'pending',drugs:[{name:'Loratadine 10mg x10',qty:1,sig:'1 tab daily',itemId:'I8'}],clarify:'',reason:''};upd(function(){S.rx.unshift(r);note('New prescription '+r.id+' from '+r.patient,'clip')});chime();U.tab.rx='pending';U.rxSel=r.id;refresh();toast('New prescription uploaded: '+r.id)},
 rxVerify:function(el){
   if(!can('rx')){noPerm('Only a Pharmacist (or the Owner) can verify prescriptions.');return}
   var r=find(S.rx,el.getAttribute('data-id'));
   if(el.getAttribute('data-blocked')){toast('Complete the validation checklist first.','warn');return}
   U.cart=r.drugs.map(function(d){return {itemId:d.itemId,qty:d.qty,sig:d.sig}});
   var form=function(){var tot=0;var rows=U.cart.map(function(c,i){var it=find(S.items,c.itemId)||{name:'(removed)',price:0,stock:0};tot+=it.price*c.qty;return '<tr><td><select data-ch="rxc:'+i+'|item">'+S.items.map(function(x){return '<option value="'+x.id+'"'+(x.id===c.itemId?' selected':'')+(x.stock<=0?' disabled':'')+'>'+esc(x.name)+(x.stock<=0?' (out)':'')+'</option>'}).join('')+'</select></td><td><input style="width:3.5rem" data-in="rxc:'+i+'|qty" value="'+c.qty+'" inputmode="numeric" aria-label="Quantity"></td><td><input data-in="rxc:'+i+'|sig" value="'+esc(c.sig)+'" aria-label="Dosage"></td><td class="mono r">'+ngn(it.price*c.qty)+'</td><td><button type="button" class="ib sm" data-m="rxdel" data-i="'+i+'" aria-label="Remove">'+ic('x')+'</button></td></tr>'}).join('');
     return '<h3>Verify & build cart · '+esc(r.id)+'</h3><p class="muted">Choose exactly what is dispensed. The customer gets a payment link.</p><div class="tw"><table class="t"><thead><tr><th>Medication</th><th>Qty</th><th>Dosage</th><th class="r">Price</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div><button type="button" class="btn sm" data-m="rxadd" style="margin-top:.6rem">'+ic('plus')+'Add medication</button><div class="kv tot" style="margin-top:1rem"><span>Cart total</span><b class="mono">'+ngn(tot)+'</b></div><div class="mgrid" style="margin-top:1rem"><div class="f"><label for="pc">Pharmacist PCN number</label><input id="pc" name="pcn" value="'+esc(S.store.pcn)+'"></div><div class="f"><label for="sg">Digital signature (type full name)</label><input id="sg" name="sig" value="'+esc(S.store.pharmacist)+'"></div></div>'+chk('ok','I have checked dosage, interactions and legal limits',false)+mfoot('Verify & send payment link')};
   U.rxform=form;
   openM(form(),function(d){
     if(!U.cart.length)return 'Add at least one medication.';
     if(!/^PCN\s?\d{3,}/i.test(d.pcn.trim()))return 'Enter a valid PCN number, e.g. PCN 24518.';
     if(d.sig.trim().length<4)return 'Type your full name as a digital signature.';
     if(!d.ok)return 'Confirm the dispensing check.';
     for(var i=0;i<U.cart.length;i++){var it=find(S.items,U.cart[i].itemId);if(!it||it.stock<(parseInt(U.cart[i].qty,10)||1))return (it?it.name:'An item')+' does not have enough stock.'}
     upd(function(){r.status='verified';r.cart=clone(U.cart);r.signed=d.sig.trim();r.pcnUsed=d.pcn.trim().toUpperCase();r.link=new URL('../app/checkout.html?rx='+r.id,location.href).href;log('Prescription '+r.id+' verified by '+r.signed,'checkc');note('Payment link sent to '+r.patient+' for '+r.id,'link')});U.tab.rx='verified';U.rxSel=r.id;refresh();toast('Verified. Payment link sent to '+r.patient+'.')},true);
 },
 rxClar:function(el){var r=find(S.rx,el.getAttribute('data-id'));openM('<h3>Ask '+esc(r.patient)+' to clarify</h3><p class="muted">Send an instant note, or call them to discuss dosage or alternatives.</p><div class="f" style="margin-top:1rem"><label for="cl">Message</label><textarea id="cl" name="msg" rows="3" placeholder="e.g. Do you have any penicillin allergy?"></textarea></div>'+mfoot('Send note'),function(d){if(d.msg.trim().length<5)return 'Write a short message.';upd(function(){r.status='clarify';r.clarify=d.msg.trim();log('Clarification requested on '+r.id,'msg')});U.tab.rx='clarify';refresh();toast('Note sent to '+r.patient+'.')})},
 rxRej:function(el){var r=find(S.rx,el.getAttribute('data-id'));openM('<h3>Reject '+esc(r.id)+'</h3><div class="radios col" style="margin:1rem 0">'+['Expired prescription','Illegible prescription','Unregistered clinic','Controlled drug without valid script','Other'].map(function(x,i){return '<label class="rad"><input type="radio" name="why" value="'+x+'"'+(i===0?' checked':'')+'><span>'+x+'</span></label>'}).join('')+'</div>'+mfoot('Reject prescription','danger'),function(d){upd(function(){r.status='rejected';r.reason=d.why;log(r.id+' rejected: '+d.why,'xc')});U.tab.rx='rejected';refresh();toast(r.id+' rejected. The customer was told why.')})}
});
CHG.rxc=function(k,v){var p=k.split('|'),c=U.cart[+p[0]];c[p[1]]=v;if(p[1]==='item')c.itemId=v;U.cart=U.cart;mre(U.rxform)};
INP.rxc=function(k,v){var p=k.split('|'),c=U.cart[+p[0]];if(p[1]==='qty')c.qty=parseInt(v,10)||1;else c[p[1]]=v};
MA.rxdel=function(el){U.cart.splice(+el.getAttribute('data-i'),1);mre(U.rxform)};
MA.rxadd=function(){var it=S.items.filter(function(x){return x.stock>0})[0];if(it)U.cart.push({itemId:it.id,qty:1,sig:'As directed'});mre(U.rxform)};

/* ---------- package shipments ---------- */
var SHST=[['pending','New'],['assigned','Rider assigned'],['picked','Picked up'],['transit','In transit'],['delivered','Delivered']];
function shipFare(s){return Math.round((1000+120*s.km+s.weight*50)*(s.express?1.3:1)/50)*50+(s.fragile?300:0)}
var RIDERS=[['Musa Ibrahim','Bike',1.2],['Kelechi Obi','Bike',2.4],['Dayo Fashola','Van',3.1],['Sani Garba','Bike',4.0],['Femi Coker','Bike',5.2]];
function vShip(){
  var t=T('ship','pending'),q=(U.q.ship||'').toLowerCase(),c={};
  SHST.forEach(function(s){c[s[0]]=S.ships.filter(function(x){return x.status===s[0]}).length});
  var rows=S.ships.filter(function(s){return s.status===t&&(!q||(s.id+' '+s.recipient+' '+s.sender).toLowerCase().indexOf(q)>=0)});
  return head('Shipments','Parcels, dispatch and proof of delivery.',btn(ic('plus')+'New shipment','shipNew','','pri'))+
  '<div class="grid g4">'+kpi('Awaiting dispatch',c.pending,'','box',c.pending?'':'g')+kpi('On the road',c.assigned+c.picked+c.transit,'','bike')+kpi('Delivered today',c.delivered,'','checkc','g')+kpi('Riders nearby',RIDERS.length,'within 6 km','users')+'</div>'+
  '<div class="bar" style="margin-top:1rem"><div class="tabs">'+SHST.map(function(s){return '<button type="button" data-act="tab" data-k="ship" data-v="'+s[0]+'" aria-pressed="'+(t===s[0])+'">'+s[1]+' <em>'+c[s[0]]+'</em></button>'}).join('')+'</div>'+search('ship','Search PKG-77201 or name')+'</div>'+
  (rows.length?'<div class="ocards">'+rows.map(shCard).join('')+'</div>':'<div class="card">'+empty('box','No shipments here','Create a waybill to start dispatching.',btn(ic('plus')+'New shipment','shipNew','','pri'))+'</div>');
}
function shCard(s){
  var a='';
  if(s.status==='pending')a=btn(ic('bike')+'Assign rider','shAssign',s.id,'pri');
  else if(s.status==='assigned')a=btn(ic('check')+'Confirm pickup','shNext',s.id,'pri');
  else if(s.status==='picked')a=btn(ic('truck')+'Start transit','shNext',s.id,'pri');
  else if(s.status==='transit')a=btn(ic('camera')+'Proof of delivery','shPod',s.id,'pri');
  return '<article class="oc '+(s.status==='delivered'?'completed':s.status==='pending'?'new':'preparing')+'"><header><div><b class="mono">'+esc(s.id)+'</b><small class="muted"> · '+ago(s.ts)+'</small></div>'+pill(s.status,PCship[s.status])+'</header>'+
  '<div class="route"><div><small class="muted">Pickup</small><b>'+esc(s.from)+'</b><small>'+esc(s.sender)+' · '+esc(s.senderPhone)+'</small></div><div><small class="muted">Drop-off</small><b>'+esc(s.to)+'</b><small>'+esc(s.recipient)+' · '+esc(s.recipPhone)+'</small></div></div>'+
  '<div class="acts"><span class="pill">'+s.weight+' kg</span><span class="pill">'+s.size+'</span><span class="pill">'+s.cat+'</span>'+(s.fragile?'<span class="pill bad">'+ic('alert')+'Fragile</span>':'')+(s.express?'<span class="pill acc">'+ic('zap')+'Express</span>':'')+'</div>'+
  '<div class="kv"><span>Distance</span><b>'+s.km+' km</b><span>Courier fare</span><b class="mono">'+ngn(shipFare(s))+'</b><span>Rider</span><b>'+(s.rider?esc(s.rider):'Not assigned')+'</b><span>Proof of delivery</span>'+(s.status==='delivered'||s.status==='transit'?'<b>'+esc(s.pod)+'</b>':'<select class="in" data-ch="pod:'+s.id+'" aria-label="Proof of delivery">'+['Photo + Signature','Photo Only','4-digit OTP Confirmation'].map(function(p){return '<option'+(p===s.pod?' selected':'')+'>'+p+'</option>'}).join('')+'</select>')+'</div>'+
  '<footer><span class="muted" style="font-size:.8rem">'+(s.podDone?'POD: '+esc(s.podDone):'')+'</span><div class="acts">'+a+btn(ic('printer'),'waybill',s.id,'',' aria-label="Print waybill"')+'</div></footer></article>';
}
CHG.pod=function(k,v){var s=find(S.ships,k);s.pod=v;save();toast('Proof of delivery set to '+v+'.')};
Object.assign(A,{
 shNext:function(el){var s=find(S.ships,el.getAttribute('data-id')),nx={assigned:'picked',picked:'transit'};upd(function(){s.status=nx[s.status];log(s.id+' '+(s.status==='picked'?'picked up':'in transit'),'box')});U.tab.ship=s.status;refresh();toast(s.id+(s.status==='picked'?' picked up. Recipient notified.':' is on the way.'))},
 shAssign:function(el){
   var s=find(S.ships,el.getAttribute('data-id'));
   openM('<h3>Dispatch '+esc(s.id)+'</h3><p class="muted">'+s.km+' km · fare '+ngn(shipFare(s))+'. Choose a nearby rider.</p><div class="radios col" style="margin:1rem 0">'+RIDERS.map(function(r,i){return '<label class="rad"><input type="radio" name="rider" value="'+r[0]+'"'+(i===0?' checked':'')+'><span><b>'+r[0]+'</b> · '+r[1]+' · '+r[2]+' km away · ETA '+Math.round(r[2]*3+2)+' min</span></label>'}).join('')+'</div>'+mfoot('Assign rider'),function(d){upd(function(){s.rider=d.rider;s.status='assigned';log(d.rider+' assigned to '+s.id,'bike')});U.tab.ship='assigned';refresh();toast(d.rider+' is heading to the pickup point.')});
 },
 shPod:function(el){
   var s=find(S.ships,el.getAttribute('data-id')),otp=/OTP/.test(s.pod);
   openM('<h3>Proof of delivery · '+esc(s.id)+'</h3><p class="muted">Method: <b>'+esc(s.pod)+'</b></p>'+(otp?'<div class="f" style="margin-top:1rem"><label for="po">Enter the 4-digit code from the recipient</label><input id="po" name="otp" inputmode="numeric" maxlength="4" placeholder="Demo code: '+s.otp+'"></div>':'<div class="f" style="margin-top:1rem"><label>Delivery photo</label><div id="podp">'+dropzone('pod','Add a photo of the parcel at the door')+'</div></div>'+(/Signature/.test(s.pod)?'<div class="f"><label for="ps">Recipient signature (type name)</label><input id="ps" name="sig"></div>':''))+mfoot('Confirm delivery'),function(d){
     if(otp){if(d.otp!==s.otp)return 'That code does not match.'}else{if(!U.podImg)return 'Add the delivery photo.';if(/Signature/.test(s.pod)&&String(d.sig||'').trim().length<2)return 'Type the recipient name as signature.'}
     upd(function(){s.status='delivered';s.podDone=otp?'OTP '+d.otp+' confirmed':(d.sig?'Photo + signed by '+d.sig:'Photo captured');log(s.id+' delivered','checkc');S.wallet.pending+=Math.round(shipFare(s)*(1-commRate()/100))});U.podImg=null;U.tab.ship='delivered';refresh();toast(s.id+' delivered and proof saved.')});
   U.podImg=null;
 },
 waybill:function(el){var s=find(S.ships,el.getAttribute('data-id'));openM('<h3>Waybill</h3><div class="tkwrap"><div class="ticket"><div class="tc"><b class="tn">'+esc(S.store.name)+'</b><div>WAYBILL</div><div class="mono" style="font-size:18px;font-weight:800">'+esc(s.id)+'</div>'+barcode(s.id)+'</div><hr><div><b>FROM</b> '+esc(s.from)+'<br>'+esc(s.sender)+' '+esc(s.senderPhone)+'</div><hr><div><b>TO</b> '+esc(s.to)+'<br>'+esc(s.recipient)+' '+esc(s.recipPhone)+'</div><hr><div>'+s.weight+' kg · '+s.size+' · '+s.cat+'</div><div>'+(s.fragile?'*** FRAGILE *** ':'')+(s.express?'*** EXPRESS ***':'')+'</div><div class="tr"><b>FARE</b><b>'+ngn(shipFare(s))+'</b></div><div>POD: '+esc(s.pod)+'</div></div></div><div class="ft"><button type="button" class="btn" data-m="x">Close</button><button type="button" class="btn pri" data-m="doprint">'+ic('printer')+'Print</button></div>')},
 shipNew:function(){
   var fare=function(){var d=U.sn;return shipFare({km:+d.km||0,weight:+d.weight||0,express:d.express,fragile:d.fragile})};
   U.sn={km:6,weight:2,express:false,fragile:false};
   openM('<h3>New shipment</h3><div class="mgrid" style="margin-top:1rem"><div class="f w2"><label for="sf">Pickup address</label><input id="sf" name="from" value="'+esc(S.branches[0].addr)+'"></div><div class="f"><label for="ss">Sender name</label><input id="ss" name="sender"></div><div class="f"><label for="sp">Sender phone</label><input id="sp" name="sp" inputmode="tel"></div><div class="f w2"><label for="st">Drop-off address</label><input id="st" name="to"></div><div class="f"><label for="sr">Recipient name</label><input id="sr" name="recipient"></div><div class="f"><label for="srp">Recipient phone</label><input id="srp" name="rp" inputmode="tel"></div><div class="f"><label for="sk">Distance (km)</label><input id="sk" name="km" data-in="sn:km" value="6" inputmode="decimal"></div><div class="f"><label for="sw">Weight (kg)</label><input id="sw" name="weight" data-in="sn:weight" value="2" inputmode="decimal"></div><div class="f"><label for="sz">Size</label><select id="sz" name="size"><option>Small</option><option>Medium</option><option>Large</option></select></div><div class="f"><label for="sc">Category</label><select id="sc" name="cat"><option>Documents</option><option>Electronics</option><option>Clothing</option></select></div></div><div class="acts" style="margin-top:.8rem">'+chk('fragile','Fragile',false,' data-ch="snc:fragile"')+chk('express','Express (+30%)',false,' data-ch="snc:express"')+'</div><div class="f" style="margin-top:.8rem"><label for="spd">Proof of delivery</label><select id="spd" name="pod"><option>Photo + Signature</option><option>Photo Only</option><option>4-digit OTP Confirmation</option></select></div><div class="kv tot"><span>Calculated courier fare</span><b class="mono" id="snfare">'+ngn(fare())+'</b></div>'+mfoot('Create waybill'),function(d){
     if(d.from.trim().length<6||d.to.trim().length<6)return 'Enter both addresses.';if(d.sender.trim().length<2||d.recipient.trim().length<2)return 'Enter sender and recipient names.';
     if(!(parseFloat(d.km)>0))return 'Enter the distance in km.';
     var s={id:'PKG-'+(78100+S.ships.length*3),ts:Date.now(),status:'pending',from:d.from,to:d.to,sender:d.sender,senderPhone:d.sp,recipient:d.recipient,recipPhone:d.rp,weight:parseFloat(d.weight)||1,size:d.size,cat:d.cat,fragile:!!d.fragile,express:!!d.express,km:parseFloat(d.km),pod:d.pod,rider:null,otp:String(1000+Math.floor(Math.random()*8999))};
     upd(function(){S.ships.unshift(s);log(s.id+' created','box')});U.tab.ship='pending';refresh();toast(s.id+' created. Fare '+ngn(shipFare(s))+'.')});
   U.snFare=fare;
 }
});
INP.sn=function(k,v){U.sn[k]=v;var e=$('#snfare');if(e)e.textContent=ngn(U.snFare())};
CHG.snc=function(k,v,el){U.sn[k]=el.checked;var e=$('#snfare');if(e)e.textContent=ngn(U.snFare())};
FILES.pod=function(f){if(!f)return;compress(f,function(url){U.podImg=url;var b=$('#podp');if(b)b.innerHTML='<div class="drop"><img src="'+url+'" alt="Delivery photo"><div><b>Photo attached</b><small>Looks good</small></div></div>';toast('Photo attached.')},700)};

/* ---------- wallet & payouts ---------- */
var BANKS=['GTBank','Access Bank','Zenith Bank','First Bank','UBA','Kuda','Moniepoint','OPay','PalmPay','Wema Bank'];
function pinHash(p){return String(fnv('cb'+p))}
function vWallet(){
  var W=S.wallet,cr=commRate(),ex=10000,com=ex*cr/100,vat=com*.075;
  return head('Merchant wallet','Your earnings, held funds and instant withdrawals.',btn(ic('bank')+'Withdraw funds','withdraw','','pri')+'<a class="btn" href="#/payouts">'+ic('file')+'Payouts & statements</a>')+
  '<div class="grid g4">'+kpi('Available to withdraw',ngn(W.available),'','wallet','g')+kpi('Pending settlement',ngn(W.pending),'Card & transfer in escrow','clock')+kpi('Lifetime earnings',ngn(W.lifetime),'','trend')+kpi('Commission paid',ngn(W.commission),cr+'% platform fee','tags','n')+'</div>'+
  '<div class="grid g2" style="margin-top:1rem"><div class="card pad"><h3>Where your money goes</h3><p class="sub">Example: a ₦10,000 '+vtxt().order+'</p><div class="kv tot"><span>Order value</span><b class="mono">'+ngn(ex)+'</b><span>Platform fee ('+cr+'%)</span><b class="mono">−'+ngn(com)+'</b><span>VAT on fee (7.5%)</span><b class="mono">−'+ngn(vat)+'</b><span>Net to your wallet</span><b class="mono">'+ngn(ex-com-vat)+'</b></div><p class="muted" style="font-size:.82rem;margin-top:.8rem">Card and transfer orders settle after delivery is confirmed. Cash on delivery is collected by you and the fee is deducted from your wallet.</p></div>'+
  '<div class="card pad"><h3>Ledger</h3><ul class="feed">'+W.ledger.slice(0,8).map(function(l){return '<li>'+ic(l.dir>0?'down':'upload')+'<span>'+esc(l.t)+'</span><b class="mono '+(l.dir>0?'pos':'neg')+'">'+(l.dir>0?'+':'−')+ngn(l.amt)+'</b></li>'}).join('')+'</ul></div></div>';
}
function bankName(b){return b.bank+' ····'+b.no.slice(-4)}
Object.assign(A,{
 withdraw:function(){
   if(!can('withdraw')){noPerm('Only the Owner can withdraw funds.');return}
   if(!S.banks.length){toast('Add a bank account first.','warn');A.bankAdd();return}
   if(!S.pin){A.pinSet(function(){A.withdraw()});return}
   openM('<h3>Withdraw funds</h3><p class="muted">Available: <b>'+ngn(S.wallet.available)+'</b>. Instant transfer, no fee.</p><div class="mgrid" style="margin-top:1rem"><div class="f w3"><label for="wb">To account</label><select id="wb" name="bank">'+S.banks.map(function(b){return '<option value="'+b.id+'"'+(b.def?' selected':'')+'>'+esc(bankName(b)+' · '+b.name)+'</option>'}).join('')+'</select></div><div class="f w3"><label for="wa">Amount (₦)</label><input id="wa" name="amt" inputmode="numeric" placeholder="Minimum ₦1,000"><div class="acts" style="margin-top:.4rem"><button type="button" class="btn sm" data-m="wq" data-p="25">25%</button><button type="button" class="btn sm" data-m="wq" data-p="50">50%</button><button type="button" class="btn sm" data-m="wq" data-p="100">All</button></div></div><div class="f w3"><label for="wp">4-digit PIN</label><input id="wp" name="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div></div>'+mfoot('Withdraw now'),function(d){
     var a=parseInt(String(d.amt).replace(/\D/g,''),10);if(!(a>=1000))return 'Minimum withdrawal is ₦1,000.';if(a>S.wallet.available)return 'That is more than your available balance.';
     if(pinHash(d.pin)!==S.pin)return 'Incorrect PIN.';
     var b=find(S.banks,d.bank);
     openM('<div class="proc"><div class="spin"></div><h3>Sending '+ngn(a)+'…</h3><p class="muted">Instant transfer to '+esc(bankName(b))+'</p></div>');
     setTimeout(function(){var ref='PO-'+(9022+S.payouts.length);S.wallet.available-=a;S.payouts.unshift({id:ref,amt:a,bank:b.bank,at:Date.now(),status:'completed',fee:0,to:b.name,no:b.no});S.wallet.ledger.unshift({id:'L'+Date.now(),t:'Withdrawal to '+b.bank,amt:a,at:Date.now(),dir:-1});log('Withdrawal '+ref+' of '+ngn(a),'bank');note('Payout '+ref+' of '+ngn(a)+' sent to '+b.bank,'bank');save();refresh();receipt(S.payouts[0])},1300);
     return false});
 },
 pinSet:function(after){openM('<h3>Create your withdrawal PIN</h3><p class="muted">A 4-digit PIN protects every withdrawal. Demo only: it is stored as a hash in this browser.</p><div class="mgrid" style="margin-top:1rem"><div class="f"><label for="p1">New PIN</label><input id="p1" name="p1" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div><div class="f"><label for="p2">Repeat PIN</label><input id="p2" name="p2" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div></div>'+mfoot('Save PIN'),function(d){if(!/^\d{4}$/.test(d.p1))return 'Use exactly 4 digits.';if(/^(\d)\1{3}$/.test(d.p1)||d.p1==='1234')return 'Pick a PIN that is harder to guess.';if(d.p1!==d.p2)return 'The PINs do not match.';S.pin=pinHash(d.p1);save();toast('PIN saved.');if(typeof after==='function')setTimeout(after,50)})},
 bankAdd:function(){
   openM('<h3>Add bank account</h3><div class="mgrid" style="margin-top:1rem"><div class="f w3"><label for="bk">Bank</label><select id="bk" name="bank">'+BANKS.map(function(b){return '<option>'+b+'</option>'}).join('')+'</select></div><div class="f w3"><label for="bn">Account number (10 digits)</label><input id="bn" name="no" data-in="nuban:x" inputmode="numeric" maxlength="10" autocomplete="off"><div class="nres" id="nres" aria-live="polite">Enter 10 digits to verify the account name.</div></div></div>'+mfoot('Save account'),function(d){
     if(!/^\d{10}$/.test(d.no))return 'Account numbers have 10 digits.';if(S.banks.some(function(b){return b.no===d.no&&b.bank===d.bank}))return 'That account is already saved.';
     if(!U.nres)return 'Wait for the account name to be verified.';
     upd(function(){S.banks.push({id:'K'+Date.now(),bank:d.bank,no:d.no,name:U.nres,def:!S.banks.length});log(d.bank+' account added','bank')});toast(U.nres+' ('+d.bank+') saved.')});
   U.nres=null;
 },
 bankDef:function(el){upd(function(){S.banks.forEach(function(b){b.def=b.id===el.getAttribute('data-id')})});toast('Default payout account updated.')},
 bankDel:function(el){var b=find(S.banks,el.getAttribute('data-id'));confirmM('Remove '+esc(bankName(b))+'?','You can add it again later.','Remove',function(){upd(function(){S.banks=S.banks.filter(function(x){return x.id!==b.id});if(S.banks.length&&!S.banks.some(function(x){return x.def}))S.banks[0].def=true});toast('Account removed.')},true)},
 sched:function(el){var v=el.getAttribute('data-id');upd(function(){S.schedule=v});toast('Auto-sweep set to '+({daily:'daily at 10:00 PM',weekly:'weekly on Mondays',manual:'manual only'})[v]+'.')},
 expLedger:function(){csvOut('ledger.csv',[['Date','Description','Direction','Amount (NGN)']].concat(S.wallet.ledger.map(function(l){return [dstr(l.at),l.t,l.dir>0?'Credit':'Debit',l.amt]})));toast('Ledger downloaded. Opens in Excel.')},
 pdfLedger:function(){printHtml('ChowBuy statement','<h1>'+esc(S.store.name)+' · Wallet statement</h1><p>Generated '+dstr(Date.now())+'</p><table><tr><th>Date</th><th>Description</th><th class="r">Amount</th></tr>'+S.wallet.ledger.map(function(l){return '<tr><td>'+dstr(l.at)+'</td><td>'+esc(l.t)+'</td><td class="r">'+(l.dir>0?'+':'−')+ngn(l.amt)+'</td></tr>'}).join('')+'</table><p>Available: '+ngn(S.wallet.available)+' · Pending: '+ngn(S.wallet.pending)+'</p>');toast('Statement opened. Choose "Save as PDF" in the print dialog.')},
 expPayouts:function(){csvOut('payouts.csv',[['Reference','Date','Bank','Amount (NGN)','Status']].concat(S.payouts.map(function(p){return [p.id,dstr(p.at),p.bank,p.amt,p.status]})));toast('Payout history downloaded.')},
 rcpt:function(el){receipt(find(S.payouts,el.getAttribute('data-id')))}
});
INP.nuban=function(k,v){var r=$('#nres');if(!r)return;U.nres=null;if(!/^\d{10}$/.test(v)){r.className='nres';r.textContent='Enter 10 digits to verify the account name.';return}
  r.className='nres wait';r.textContent='Verifying with NIBSS…';var key=v;
  setTimeout(function(){var el=$('#nres');if(!el)return;var cur=$('#bn');if(!cur||cur.value!==key)return;var nm=(v.slice(-1)==='7'||v.slice(-1)==='0')?S.store.name+' Ltd':['Chiamaka Eze','Adaeze Foods Ltd','Okon Trading Enterprise','Halima Bello Ventures'][fnv(v)%4];U.nres=nm;el.className='nres ok';el.innerHTML=ic('checkc')+'<b>'+esc(nm)+'</b>'},650)};
MA.wq=function(el){var p=+el.getAttribute('data-p'),a=Math.floor(S.wallet.available*p/100/100)*100;$('#wa').value=a};
function receipt(p){
  openM('<div class="rcpt"><span class="rc-ic">'+ic('checkc')+'</span><h3>Withdrawal successful</h3><b class="mono" style="font-size:1.6rem">'+ngn(p.amt)+'</b><div class="kv"><span>Reference</span><b class="mono">'+esc(p.id)+'</b><span>To</span><b>'+esc(p.bank)+(p.no?' ····'+esc(String(p.no).slice(-4)):'')+'</b><span>Account name</span><b>'+esc(p.to||S.store.name+' Ltd')+'</b><span>Date</span><b>'+dstr(p.at)+'</b><span>Fee</span><b>₦0</b><span>Status</span><b>'+esc(p.status)+'</b></div></div><div class="ft"><button type="button" class="btn" data-m="x">Close</button><button type="button" class="btn" data-m="rdl" data-id="'+esc(p.id)+'">'+ic('down')+'Download</button><button type="button" class="btn pri" data-m="rpr" data-id="'+esc(p.id)+'">'+ic('printer')+'Print</button></div>');
}
MA.rdl=function(el){var p=find(S.payouts,el.getAttribute('data-id'));dl(p.id+'-receipt.txt','ChowBuy withdrawal receipt\nReference: '+p.id+'\nAmount: '+ngn(p.amt)+'\nBank: '+p.bank+'\nDate: '+dstr(p.at)+'\nStatus: '+p.status+'\n','text/plain')};
MA.rpr=function(el){var p=find(S.payouts,el.getAttribute('data-id'));printHtml('Receipt '+p.id,'<h1>Withdrawal receipt</h1><table><tr><td>Reference</td><td>'+esc(p.id)+'</td></tr><tr><td>Amount</td><td>'+ngn(p.amt)+'</td></tr><tr><td>Bank</td><td>'+esc(p.bank)+'</td></tr><tr><td>Date</td><td>'+dstr(p.at)+'</td></tr><tr><td>Status</td><td>'+esc(p.status)+'</td></tr></table>')};
function vPayouts(){
  var cr=commRate();
  return head('Bank payouts & settlements','Saved accounts, auto-sweep schedule and statements.',btn(ic('plus')+'Add bank account','bankAdd')+btn(ic('bank')+'Withdraw','withdraw','','pri'))+
  '<div class="grid g2"><div class="card pad"><h3>Bank accounts</h3><p class="sub">Verified Nigerian commercial and fintech accounts.</p>'+(S.banks.length?'<ul class="banks">'+S.banks.map(function(b){return '<li><span class="bico">'+ic('bank')+'</span><div><b>'+esc(b.bank)+' ····'+esc(b.no.slice(-4))+'</b><small class="muted">'+esc(b.name)+'</small></div>'+(b.def?'<span class="pill ok">Default</span>':btn('Make default','bankDef',b.id,'sm'))+btn(ic('trash'),'bankDel',b.id,'sm danger',' aria-label="Remove account"')+'</li>'}).join('')+'</ul>':empty('bank','No bank accounts','Add one to withdraw your earnings.',btn(ic('plus')+'Add bank account','bankAdd','','pri')))+'</div>'+
  '<div class="card pad"><h3>Auto-sweep schedule</h3><p class="sub">When your available balance is paid to your default account.</p><div class="radios col" style="margin-top:1rem">'+[['daily','Daily at 10:00 PM'],['weekly','Weekly on Mondays'],['manual','Manual, on demand only']].map(function(s){return '<label class="rad"><input type="radio" name="sched" data-act="sched" data-id="'+s[0]+'"'+(S.schedule===s[0]?' checked':'')+'><span>'+s[1]+'</span></label>'}).join('')+'</div></div></div>'+
  '<div class="card pad" style="margin-top:1rem"><h3>Commission & fees</h3><p class="sub">Transparent: no hidden charges.</p><div class="tw"><table class="t"><thead><tr><th>Vertical</th><th class="r">Platform fee</th><th class="r">VAT on fee</th><th>Your rate</th></tr></thead><tbody>'+[['restaurant',15],['grocery',8],['pharmacy',10],['package',12]].map(function(x){return '<tr class="'+(x[0]===S.vertical?'hl':'')+'"><td>'+V[x[0]]+(x[0]===S.vertical?' <span class="pill acc">You</span>':'')+'</td><td class="r mono">'+x[1]+'%</td><td class="r mono">7.5%</td><td class="mono">Net '+(100-x[1]-x[1]*.075).toFixed(2)+'%</td></tr>'}).join('')+'</tbody></table></div></div>'+
  '<div class="card" style="margin-top:1rem"><div class="acts" style="justify-content:space-between;padding:1.2rem 1.3rem 0"><div><h3>Payout history</h3><p class="sub">Tax-ready statements</p></div><div class="acts">'+btn(ic('down')+'Excel / CSV','expPayouts')+btn(ic('file')+'Ledger CSV','expLedger')+btn(ic('printer')+'PDF statement','pdfLedger')+'</div></div>'+(S.payouts.length?'<div class="tw"><table class="t"><thead><tr><th>Reference</th><th>Date</th><th>Bank</th><th class="r">Amount</th><th>Status</th><th></th></tr></thead><tbody>'+S.payouts.map(function(p){return '<tr><td class="mono">'+esc(p.id)+'</td><td>'+dstr(p.at)+'</td><td>'+esc(p.bank)+'</td><td class="r mono">'+ngn(p.amt)+'</td><td>'+pill(p.status,'ok')+'</td><td>'+btn('Receipt','rcpt',p.id,'sm')+'</td></tr>'}).join('')+'</tbody></table></div>':empty('bank','No payouts yet','Withdraw funds to see them here.'))+'</div>';
}

/* ---------- analytics ---------- */
function vAnalytics(){
  var r=T('an','7'),f=bf(),days={today:1,yday:1,'7':7,month:30,custom:1},d=days[r];
  if(r==='custom'&&U.anFrom&&U.anTo){d=Math.max(1,Math.round((new Date(U.anTo)-new Date(U.anFrom))/86400000)+1)}
  var jit=r==='yday'?.94:r==='today'?.62:1,rev=Math.round(1420000*f*d*jit*(r==='month'?.97:1)),cr=commRate(),cost=Math.round(rev*.38),net=Math.round(rev-rev*cr/100*1.075-cost),aov=S.items.length?Math.round(S.items.reduce(function(a,i){return a+i.price},0)/S.items.length*2.3):6400,ords=Math.round(rev/aov),rad=(brSel().radius*.62).toFixed(1);
  var n=Math.min(d,14)||1,series=[],prev=[],lab=[];for(var i=0;i<Math.max(n,2);i++){series.push(Math.round(rev/Math.max(n,2)*(.8+((fnv('a'+i+r)%40)/100))));prev.push(Math.round(rev/Math.max(n,2)*(.7+((fnv('b'+i+r)%40)/100))));lab.push(d<=1?(8+i*2)+'h':'D'+(i+1))}
  if(d<=1){series=[0,1,2,3,4,5,6].map(function(i){return Math.round(rev/7*(.5+((fnv('c'+i+r)%80)/100)))});prev=series.map(function(x,i){return Math.round(x*(.8+(i%3)*.1))});lab=['8a','10a','12p','2p','4p','6p','8p']}
  var hrs=[3,6,14,31,44,38,22,15,12,19,34,51,47,28,12,5].map(function(x){return Math.max(1,Math.round(x*f*Math.max(1,d/3)))});
  var canc=[['Vendor fault (delayed prep)',46],['Rider unavailable',27],['Customer cancellation',27]];
  return head('Analytics & insights','Revenue, profit and customer behaviour.',btn(ic('down')+'Export CSV','anCsv'))+
  '<div class="bar"><div class="tabs">'+[['today','Today'],['yday','Yesterday'],['7','Last 7 days'],['month','This month'],['custom','Custom range']].map(function(x){return '<button type="button" data-act="tab" data-k="an" data-v="'+x[0]+'" aria-pressed="'+(r===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>'+(r==='custom'?'<div class="acts"><label class="sr" for="af">From</label><input id="af" class="in" type="date" data-ch="anf:from" value="'+esc(U.anFrom||'')+'"><label class="sr" for="at">To</label><input id="at" class="in" type="date" data-ch="anf:to" value="'+esc(U.anTo||'')+'"></div>':'')+'</div>'+
  (r==='custom'&&!(U.anFrom&&U.anTo)?'<div class="card" style="margin-top:1rem">'+empty('chart','Pick a date range','Choose a start and end date to see your numbers.')+'</div>':
  '<div class="grid g4" style="margin-top:1rem">'+kpi('Revenue',ngn(rev),'+8.1% vs previous period','trend','g')+kpi('Net profit',ngn(net),'after fees, VAT and cost','wallet')+kpi(vtxt().order[0].toUpperCase()+vtxt().order.slice(1)+'s',num(ords),'','bag')+kpi('Avg delivery radius',rad+' km','','pin')+'</div>'+
  '<div class="grid g2-1" style="margin-top:1rem"><div class="card pad"><h3>Revenue</h3><p class="sub">Selected period vs the one before</p>'+areaChart(series,prev,lab)+'</div><div class="card pad"><h3>Customers</h3><p class="sub">New diners vs repeat loyalists</p>'+donut([['New',38],['Repeat',62]],'62%','repeat')+'<div class="acts" style="justify-content:center;margin-top:.6rem"><span class="pill acc">New 38%</span><span class="pill ok">Repeat 62%</span></div></div></div>'+
  '<div class="grid g2" style="margin-top:1rem"><div class="card pad"><h3>Peak ordering hours</h3><p class="sub">12pm lunch rush and 8pm dinner peak highlighted</p>'+barChart(hrs,7,'Orders by hour')+'</div><div class="card pad"><h3>Cancellations</h3><p class="sub">Why orders were cancelled</p><ul class="lead">'+canc.map(function(c){return '<li><span>'+c[0]+'</span><i style="--w:'+c[1]*2+'%"></i><b class="mono">'+c[1]+'%</b></li>'}).join('')+'</ul><p class="muted" style="font-size:.82rem;margin-top:.8rem">Cut vendor-fault cancellations by raising prep estimates when busy or using Rush mode.</p></div></div>');
}
CHG.anf=function(k,v){U['an'+k[0].toUpperCase()+k.slice(1)]=v;refresh()};
A.anCsv=function(){var r=T('an','7');csvOut('analytics-'+r+'.csv',[['Metric','Value'],['Range',r],['Store',S.store.name],['Branch',brSel().name],['Exported',dstr(Date.now())]]);toast('Analytics exported.')};

/* ---------- reviews ---------- */
function vReviews(){
  var f=T('rv','all'),L=S.reviews,hist=[5,4,3,2,1].map(function(n){return [n,L.filter(function(r){return r.rating===n}).length]}),mx=Math.max.apply(0,hist.map(function(h){return h[1]}))||1;
  var rows=L.filter(function(r){return f==='all'||(f==='open'&&!r.reply)||(f==='low'&&r.rating<=3)||(f==='disp'&&r.dispute)});
  return head('Reviews & reputation','Reply to customers and flag abusive comments.')+
  '<div class="grid g2-1"><div class="card pad rvs"><div class="big">'+avgRating().toFixed(1)+'</div><div>'+stars(avgRating(),'1.3rem')+'<p class="muted">'+L.length+' reviews · '+Math.round(L.filter(function(r){return r.rating>=4}).length/(L.length||1)*100)+'% positive</p></div></div><div class="card pad"><h3>Rating split</h3><ul class="lead">'+hist.map(function(h){return '<li><span>'+h[0]+' ★</span><i style="--w:'+Math.round(h[1]/mx*100)+'%"></i><b class="mono">'+h[1]+'</b></li>'}).join('')+'</ul></div></div>'+
  '<div class="bar" style="margin-top:1rem"><div class="tabs">'+[['all','All'],['open','Needs reply'],['low','3★ and below'],['disp','Disputed']].map(function(x){return '<button type="button" data-act="tab" data-k="rv" data-v="'+x[0]+'" aria-pressed="'+(f===x[0])+'">'+x[1]+'</button>'}).join('')+'</div></div>'+
  (rows.length?'<div class="rvl">'+rows.map(function(r){return '<article class="card pad"><div class="acts" style="justify-content:space-between"><div class="acts">'+tile(r.name,S.vertical)+'<div><b>'+esc(r.name)+'</b><div class="muted" style="font-size:.8rem">'+ago(r.at)+' · '+esc(r.item)+'</div></div></div>'+stars(r.rating)+'</div><p style="margin:.7rem 0">'+esc(r.text)+'</p>'+(r.reply?'<div class="reply">'+ic('store')+'<div><b>'+esc(S.store.name)+' replied</b><p>'+esc(r.reply)+'</p></div></div>':'')+(r.dispute?'<span class="pill info">'+ic('clock')+'Moderation requested: '+esc(r.dispute)+'</span>':'')+'<div class="acts" style="margin-top:.7rem">'+btn(ic('msg')+(r.reply?'Edit reply':'Reply'),'rvReply',r.id,r.reply?'':'pri')+(r.reply?btn('Delete reply','rvDelReply',r.id,'danger'):'')+(r.dispute?'':btn(ic('alert')+'Dispute','rvDispute',r.id))+'</div></article>'}).join('')+'</div>':'<div class="card" style="margin-top:1rem">'+empty('star','No reviews here','Nothing matches this filter.',btn('Show all','tab','','',' data-k="rv" data-v="all"'))+'</div>');
}
Object.assign(A,{
 rvReply:function(el){var r=find(S.reviews,el.getAttribute('data-id'));openM('<h3>Reply to '+esc(r.name)+'</h3><p class="muted">"'+esc(r.text)+'"</p><div class="f" style="margin-top:1rem"><label for="rp">Your public reply</label><textarea id="rp" name="reply" rows="4" maxlength="300">'+esc(r.reply||(r.rating>=4?'Thank you for ordering with us, '+r.name.split(' ')[0]+"! We're glad you enjoyed it.":'Sorry about this, '+r.name.split(' ')[0]+'. Please message us so we can make it right.'))+'</textarea></div>'+mfoot('Post reply'),function(d){if(d.reply.trim().length<5)return 'Write a short reply.';upd(function(){r.reply=d.reply.trim();log('Replied to '+r.name,'msg')});toast('Reply posted publicly.')})},
 rvDelReply:function(el){var r=find(S.reviews,el.getAttribute('data-id'));confirmM('Delete your reply?','The review stays, your reply is removed.','Delete',function(){upd(function(){r.reply=''});toast('Reply deleted.')},true)},
 rvDispute:function(el){var r=find(S.reviews,el.getAttribute('data-id'));openM('<h3>Dispute this review</h3><p class="muted">ChowBuy moderators review disputes within 2 working days.</p><div class="f" style="margin-top:1rem"><label for="dr">Why should it be removed?</label><select id="dr" name="why"><option>Abusive or offensive language</option><option>Spam or off-topic</option><option>Not a customer of this store</option><option>Contains personal information</option></select></div><div class="f"><label for="dd">Details (optional)</label><textarea id="dd" name="more" rows="3" maxlength="300"></textarea></div>'+mfoot('Submit dispute'),function(d){upd(function(){r.dispute=d.why;log('Review from '+r.name+' disputed','alert')});toast('Dispute sent to ChowBuy moderation.')})}
});

/* ---------- promotions ---------- */
var PT={pct:'% off',amt:'₦ off',freedel:'Free delivery'};
function vPromos(){
  var rows=S.promos;
  return head('Promotions & flash deals','Discounts that bring customers back.',btn(ic('plus')+'New promotion','promoNew','','pri'))+
  (rows.length?'<div class="pgrid">'+rows.map(function(p){var left=p.ends-Date.now();return '<article class="card pad promo'+(p.on?'':' off')+'"><div class="acts" style="justify-content:space-between"><span class="pill '+(p.flash?'bad':'acc')+'">'+(p.flash?ic('flame')+'Flash deal':ic('tag')+'Promotion')+'</span>'+sw(p.on,'promoTog',p.id,'Activate '+p.title)+'</div><h3 style="margin-top:.6rem">'+esc(p.title)+'</h3><p class="muted" style="font-size:.85rem">'+(p.type==='pct'?p.value+'% off':p.type==='amt'?ngn(p.value)+' off':'Free delivery')+(p.min?' · min order '+ngn(p.min):'')+'</p><div class="acts" style="margin-top:.6rem"><span class="code mono">'+esc(p.code)+'</span>'+btn(ic('copy'),'copy','','sm',' data-v="'+esc(p.code)+'" aria-label="Copy code"')+'</div><div class="muted" style="font-size:.8rem;margin-top:.6rem">'+p.uses+' uses · '+(left<=0?'Ended':left<86400000?'Ends in '+Math.max(1,Math.round(left/3600000))+' hr':'Ends '+new Date(p.ends).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}))+'</div><div class="acts" style="margin-top:.7rem">'+btn(ic('edit')+'Edit','promoEdit',p.id)+btn(ic('copy')+'Duplicate','promoDup',p.id)+btn(ic('trash'),'promoDel',p.id,'danger',' aria-label="Delete"')+'</div></article>'}).join('')+'</div>':'<div class="card">'+empty('tag','No promotions yet','Create a discount or a flash deal to lift orders.',btn(ic('plus')+'New promotion','promoNew','','pri'))+'</div>');
}
function promoForm(p,edit){return '<h3>'+(edit?'Edit':'New')+' promotion</h3><div class="mgrid" style="margin-top:1rem"><div class="f w3"><label for="pt">Title</label><input id="pt" name="title" value="'+esc(p.title)+'" maxlength="60"></div><div class="f"><label for="py">Type</label><select id="py" name="type">'+Object.keys(PT).map(function(k){return '<option value="'+k+'"'+(p.type===k?' selected':'')+'>'+PT[k]+'</option>'}).join('')+'</select></div><div class="f"><label for="pv">Value</label><input id="pv" name="value" inputmode="numeric" value="'+esc(p.value||'')+'" placeholder="10 or 500"></div><div class="f"><label for="pm">Min order (₦)</label><input id="pm" name="min" inputmode="numeric" value="'+esc(p.min||'')+'"></div><div class="f"><label for="pc">Promo code</label><input id="pc" name="code" value="'+esc(p.code)+'" maxlength="16" style="text-transform:uppercase"></div><div class="f"><label for="pe">Runs for (hours)</label><input id="pe" name="hrs" inputmode="numeric" value="'+esc(Math.max(1,Math.round((p.ends-Date.now())/3600000)))+'"></div></div><div style="margin-top:.8rem">'+chk('flash','Flash deal (countdown badge on your store)',p.flash)+chk('on','Active now',p.on!==false)+'</div>'+mfoot(edit?'Save':'Create promotion')}
function promoSave(p,edit){return function(d){var t=d.title.trim();if(t.length<3)return 'Give the promotion a title.';var v=parseInt(d.value,10)||0;if(d.type==='pct'&&(v<1||v>70))return 'Percentage must be between 1 and 70.';if(d.type==='amt'&&v<50)return 'Enter the amount off in naira.';var code=d.code.trim().toUpperCase();if(!/^[A-Z0-9]{4,16}$/.test(code))return 'Code: 4 to 16 letters or numbers.';if(S.promos.some(function(x){return x.code===code&&x.id!==p.id}))return 'That code is in use.';var h=parseInt(d.hrs,10);if(!(h>=1&&h<=24*90))return 'Duration: 1 to 2160 hours.';
  upd(function(){Object.assign(p,{title:t,type:d.type,value:v,min:parseInt(d.min,10)||0,code:code,ends:Date.now()+h*3600000,flash:!!d.flash,on:!!d.on});if(!edit)S.promos.unshift(p);log('Promotion '+code+(edit?' updated':' created'),'tag')});toast(code+(edit?' saved.':' is live.'))}}
Object.assign(A,{
 promoNew:function(){if(!can('promo')){noPerm();return}var p={id:'P'+Date.now(),title:'',type:'pct',value:10,min:0,code:'',on:true,ends:Date.now()+7*86400000,uses:0,flash:false};openM(promoForm(p,false),promoSave(p,false))},
 promoEdit:function(el){if(!can('promo')){noPerm();return}var p=find(S.promos,el.getAttribute('data-id'));openM(promoForm(p,true),promoSave(p,true))},
 promoTog:function(el){var p=find(S.promos,el.getAttribute('data-id'));upd(function(){p.on=!p.on});toast(p.code+(p.on?' is live.':' paused.'))},
 promoDup:function(el){var p=clone(find(S.promos,el.getAttribute('data-id')));p.id='P'+Date.now();p.code=p.code+'2';p.title+=' (copy)';p.uses=0;upd(function(){S.promos.unshift(p)});toast('Duplicated as '+p.code+'.')},
 promoDel:function(el){if(!can('promo')){noPerm();return}var p=find(S.promos,el.getAttribute('data-id'));confirmM('Delete '+esc(p.code)+'?','Customers can no longer use this code.','Delete',function(){upd(function(){S.promos=S.promos.filter(function(x){return x.id!==p.id})});toast('Promotion deleted.')},true)},
 copy:function(el){var v=el.getAttribute('data-v');(navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(function(){toast('Copied.')},function(){toast('Copy this manually: '+v,'warn')})}
});

/* ---------- branches ---------- */
var BST={open:'ok',busy:'warn',closed:'bad'};
function vBranches(){
  var L=S.branches,mx=Math.max.apply(0,L.map(function(b){return b.rev}));
  return head('Branches','Manage every location and compare performance.',btn(ic('plus')+'Add branch','brNew','','pri'))+
  '<div class="bgrid">'+L.map(function(b){return '<article class="card pad"><div class="acts" style="justify-content:space-between"><h3>'+esc(b.name)+'</h3>'+pill(b.status,BST[b.status])+'</div><p class="muted" style="font-size:.85rem">'+esc(b.addr)+'</p><div class="kv"><span>Manager</span><b>'+esc(b.mgr)+'</b><span>Phone</span><b>'+esc(b.phone)+'</b><span>Delivery radius</span><b>'+b.radius+' km</b><span>Rating</span><b>'+b.rate+' ★</b></div><div class="acts" style="margin-top:.8rem">'+(b.id===S.branch?'<span class="pill acc">Viewing</span>':btn('Switch to','brSwitch',b.id))+btn(ic('edit')+'Edit','brEdit',b.id)+btn(b.status==='closed'?'Reopen':'Close','brTog',b.id,b.status==='closed'?'':'danger')+'</div></article>'}).join('')+'</div>'+
  '<div class="card pad" style="margin-top:1rem"><h3>Branch comparison</h3><p class="sub">Revenue this month</p><ul class="lead">'+L.map(function(b){return '<li><span>'+esc(b.name)+'</span><i style="--w:'+Math.round(b.rev/mx*100)+'%"></i><b class="mono">'+ngn(b.rev)+'</b></li>'}).join('')+'</ul></div>';
}
function brForm(b,edit){return '<h3>'+(edit?'Edit branch':'New branch')+'</h3><div class="mgrid" style="margin-top:1rem"><div class="f w3"><label for="bn">Branch name</label><input id="bn" name="name" value="'+esc(b.name)+'"></div><div class="f w3"><label for="ba">Address</label><input id="ba" name="addr" value="'+esc(b.addr)+'"></div><div class="f"><label for="bm">Manager</label><input id="bm" name="mgr" value="'+esc(b.mgr)+'"></div><div class="f"><label for="bp">Phone</label><input id="bp" name="phone" inputmode="tel" value="'+esc(b.phone)+'" placeholder="+234 803 000 0000"></div><div class="f"><label for="br">Delivery radius (km)</label><input id="br" name="radius" inputmode="numeric" value="'+esc(b.radius)+'"></div></div>'+mfoot(edit?'Save branch':'Add branch')}
function brSave(b,edit){return function(d){if(d.name.trim().length<3)return 'Enter a branch name.';if(d.addr.trim().length<8)return 'Enter the full address.';if(!/^\+?[\d\s]{10,16}$/.test(d.phone.trim()))return 'Enter a valid phone number, e.g. +234 803 000 0000.';var r=parseInt(d.radius,10);if(!(r>=1&&r<=40))return 'Radius must be 1 to 40 km.';
  upd(function(){Object.assign(b,{name:d.name.trim(),addr:d.addr.trim(),mgr:d.mgr.trim()||'Unassigned',phone:d.phone.trim(),radius:r});if(!edit){S.branches.push(b)}log('Branch '+b.name+(edit?' updated':' added'),'pin')});toast(b.name+(edit?' saved.':' added. Invite staff to run it.'))}}
Object.assign(A,{
 brNew:function(){if(!can('settings')){noPerm('Only the Owner can add branches.');return}var b={id:'B'+Date.now(),name:'',addr:'',mgr:'',phone:'',status:'open',radius:6,f:.4,rev:0,rate:0,lat:'6.5',lng:'3.4'};openM(brForm(b,false),brSave(b,false))},
 brEdit:function(el){var b=find(S.branches,el.getAttribute('data-id'));openM(brForm(b,true),brSave(b,true))},
 brSwitch:function(el){S.branch=el.getAttribute('data-id');save();refresh();toast('Showing '+brSel().name+'.')},
 brTog:function(el){var b=find(S.branches,el.getAttribute('data-id'));if(b.status!=='closed'&&S.branches.filter(function(x){return x.status!=='closed'}).length<2){toast('Keep at least one branch open.','warn');return}upd(function(){b.status=b.status==='closed'?'open':'closed'});toast(b.name+(b.status==='closed'?' closed.':' reopened.'))}
});

/* ---------- service areas ---------- */
function vAreas(){
  var b=brSel();
  return head('Service areas','Where you deliver and what it costs.',btn(ic('check')+'Save changes','areaSave','','pri'))+
  '<div class="grid g2"><div class="card pad"><h3>Delivery radius</h3><p class="sub">From '+esc(b.name)+'</p><div class="rad-big"><b class="mono" id="radv">'+S.radius+' km</b></div><input type="range" min="1" max="25" value="'+S.radius+'" data-in="rad:x" aria-label="Delivery radius in kilometres" style="width:100%"><div class="map" aria-hidden="true"><i class="ring" id="ring" style="--s:'+(.2+S.radius/25*.8)+'"></i><i class="pinx"></i></div></div>'+
  '<div class="card pad"><h3>Surge &amp; rain surcharge</h3><p class="sub">Extra delivery fee during demand spikes or bad weather</p><div class="acts" style="justify-content:space-between;margin:.8rem 0"><b>Enable surcharge</b>'+sw(S.surge.on,'surgeTog','','Enable surcharge')+'</div><div class="f"><label for="sga">Amount (₦)</label><input id="sga" inputmode="numeric" data-in="surge:x" value="'+S.surge.amt+'"'+(S.surge.on?'':' disabled')+'></div></div></div>'+
  '<div class="card" style="margin-top:1rem"><div style="padding:1.2rem 1.3rem 0"><h3>Neighbourhoods</h3><p class="sub">Toggle each area and set its minimum order</p></div><div class="tw"><table class="t"><thead><tr><th>Area</th><th>Delivering</th><th>Minimum order</th></tr></thead><tbody>'+S.hoods.map(function(h){return '<tr><td>'+esc(h.name)+'</td><td>'+sw(h.on,'hoodTog',h.id,'Deliver to '+h.name)+'</td><td><input class="in" style="width:7rem" inputmode="numeric" data-in="hmin:'+h.id+'" value="'+h.min+'" aria-label="Minimum order for '+esc(h.name)+'"></td></tr>'}).join('')+'</tbody></table></div></div>';
}
INP.rad=function(k,v){S.radius=+v;var e=$('#radv');if(e)e.textContent=v+' km';var r=$('#ring');if(r)r.style.setProperty('--s',.2+v/25*.8)};
INP.surge=function(k,v){S.surge.amt=parseInt(v,10)||0};
INP.hmin=function(k,v){find(S.hoods,k).min=parseInt(v,10)||0};
A.surgeTog=function(){upd(function(){S.surge.on=!S.surge.on});toast('Surcharge '+(S.surge.on?'on.':'off.'))};
A.hoodTog=function(el){var h=find(S.hoods,el.getAttribute('data-id'));upd(function(){h.on=!h.on});toast(h.name+(h.on?' added.':' removed.'))};
A.areaSave=function(){if(S.surge.on&&!(S.surge.amt>=50&&S.surge.amt<=2000)){toast('Surcharge must be ₦50 to ₦2,000.','warn');return}brSel().radius=S.radius;log('Service area saved ('+S.radius+' km, '+S.hoods.filter(function(h){return h.on}).length+' areas)','pin');save();refresh();toast('Service area saved.')};

/* ---------- staff ---------- */
var PERM=[['Orders & kitchen',[1,1,1,1]],['Menu / products',[1,1,0,1]],['Prescriptions',[1,0,0,1]],['Promotions',[1,1,0,0]],['Wallet & payouts',[1,0,0,0]],['Staff & settings',[1,0,0,0]]];
function vStaff(){
  var roles=Object.keys(ROLE).filter(function(r){return r!=='pharmacist'||S.vertical==='pharmacy'});
  return head('Staff & permissions','Who can do what in your store.',btn(ic('plus')+'Invite staff','stInvite','','pri'))+
  '<div class="card"><div class="tw"><table class="t"><thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Status</th><th></th></tr></thead><tbody>'+S.staff.map(function(s){var br=find(S.branches,s.branch);return '<tr><td><div class="acts">'+tile(s.name,S.vertical)+'<div><b>'+esc(s.name)+'</b><div class="muted" style="font-size:.8rem">'+esc(s.email)+'</div></div></div></td><td>'+(s.role==='owner'?'<span class="pill acc">Owner</span>':'<select class="in" data-ch="strole:'+s.id+'" aria-label="Role for '+esc(s.name)+'">'+roles.filter(function(r){return r!=='owner'}).map(function(r){return '<option value="'+r+'"'+(s.role===r?' selected':'')+'>'+ROLE[r]+'</option>'}).join('')+'</select>')+'</td><td>'+esc(br?br.name:'All')+'</td><td>'+pill(s.status,s.status==='active'?'ok':'warn')+'</td><td>'+(s.role==='owner'?'':btn(s.status==='invited'?'Resend':'Suspend','stAct',s.id,'sm')+btn(ic('trash'),'stDel',s.id,'sm danger',' aria-label="Remove"'))+'</td></tr>'}).join('')+'</tbody></table></div></div>'+
  '<div class="card pad" style="margin-top:1rem"><h3>Permission matrix</h3><div class="tw"><table class="t pm"><thead><tr><th>Capability</th>'+['Owner','Manager','Kitchen','Pharmacist'].map(function(r){return '<th>'+r+'</th>'}).join('')+'</tr></thead><tbody>'+PERM.map(function(p){return '<tr><td>'+p[0]+'</td>'+p[1].map(function(x){return '<td>'+(x?'<span class="yes">'+ic('check')+'<span class="sr">Yes</span></span>':'<span class="no">–<span class="sr">No</span></span>')+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></div>';
}
CHG.strole=function(k,v){var s=find(S.staff,k);s.role=v;log(s.name+' is now '+ROLE[v],'users');save();toast(s.name+' is now '+ROLE[v]+'.')};
Object.assign(A,{
 stInvite:function(){
   if(!can('staff')){noPerm('Only the Owner can invite staff.');return}
   openM('<h3>Invite staff</h3><div class="mgrid" style="margin-top:1rem"><div class="f w3"><label for="sn">Full name</label><input id="sn" name="name"></div><div class="f w3"><label for="se">Email</label><input id="se" name="email" type="email" inputmode="email"></div><div class="f"><label for="sr">Role</label><select id="sr" name="role">'+['manager','kitchen'].concat(S.vertical==='pharmacy'?['pharmacist']:[]).map(function(r){return '<option value="'+r+'">'+ROLE[r]+'</option>'}).join('')+'</select></div><div class="f"><label for="sb">Branch</label><select id="sb" name="branch">'+S.branches.map(function(b){return '<option value="'+b.id+'">'+esc(b.name)+'</option>'}).join('')+'</select></div></div>'+mfoot('Create invite'),function(d){
     if(d.name.trim().length<2)return 'Enter their name.';if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(d.email.trim()))return 'Enter a valid email address.';if(S.staff.some(function(s){return s.email.toLowerCase()===d.email.trim().toLowerCase()}))return 'That email is already on your team.';
     var s={id:'T'+Date.now(),name:d.name.trim(),email:d.email.trim(),branch:d.branch,role:d.role,status:'invited'};S.staff.push(s);log('Invited '+s.name+' as '+ROLE[s.role],'users');save();refresh();
     var link='https://chowbuy.pages.dev/merchant/#/join?t='+s.id.slice(1);
     setTimeout(function(){openM('<h3>Invite ready</h3><p class="muted">Share this link with '+esc(s.name)+'. It works for 48 hours.</p><div class="linkbox mono" id="ilink">'+esc(link)+'</div><div class="ft"><button type="button" class="btn" data-m="x">Done</button><button type="button" class="btn" data-m="icopy" data-v="'+esc(link)+'">'+ic('copy')+'Copy link</button><a class="btn pri" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent('Join '+S.store.name+' on ChowBuy Merchant: '+link)+'">'+ic('msg')+'WhatsApp</a></div>')},30);return false});
 },
 stAct:function(el){var s=find(S.staff,el.getAttribute('data-id'));if(s.status==='invited'){toast('Invite resent to '+s.email+'.');return}upd(function(){s.status='suspended'});toast(s.name+' suspended.')},
 stDel:function(el){if(!can('staff')){noPerm();return}var s=find(S.staff,el.getAttribute('data-id'));confirmM('Remove '+esc(s.name)+'?','They lose access immediately.','Remove',function(){upd(function(){S.staff=S.staff.filter(function(x){return x.id!==s.id})});toast(s.name+' removed.')},true)}
});
MA.icopy=function(el){var v=el.getAttribute('data-v');(navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(function(){toast('Link copied.')},function(){toast('Select the link and copy it.','warn')})};

/* ---------- settings ---------- */
function vSettings(){
  var st=S.store;
  return head('Store settings','Profile, branding, opening hours and alerts.')+
  '<form data-form="profile" class="card pad" novalidate><h3>Store profile</h3><div class="mgrid" style="margin-top:1rem">'+inp('sn','Store name',st.name)+inp('sp','Phone',st.phone,' inputmode="tel"')+inp('se','Email',st.email,' type="email"')+inp('sa','Address',st.addr)+inp('sr','CAC registration',st.rc)+inp('seta','Average prep + delivery ETA (min)',st.eta,' inputmode="numeric"')+'</div><div class="f"><label for="sbio">About your store</label><textarea id="sbio" name="sbio" rows="3" maxlength="200">'+esc(st.bio)+'</textarea></div><button class="btn pri" type="submit">Save profile</button></form>'+
  '<div class="grid g2" style="margin-top:1rem"><div class="card pad"><h3>Logo</h3>'+dropzone('logo','Upload your logo',st.logo)+'</div><div class="card pad"><h3>Cover photo</h3>'+dropzone('cover','Upload a cover photo',st.cover)+'</div></div>'+
  '<div class="card" style="margin-top:1rem"><div style="padding:1.2rem 1.3rem 0"><h3>Opening hours</h3><p class="sub">Turn on split shifts for a midday break</p></div><div class="tw"><table class="t"><thead><tr><th>Day</th><th>Open</th><th>Hours</th><th>Split shift</th><th>Second shift</th></tr></thead><tbody>'+S.hours.map(function(h,i){return '<tr><td><b>'+h.d+'</b></td><td>'+sw(h.open,'hrTog',i,'Open on '+h.d)+'</td><td>'+(h.open?'<input class="in tm" type="time" data-ch="hr:'+i+'|a" value="'+h.a+'" aria-label="'+h.d+' opens"> – <input class="in tm" type="time" data-ch="hr:'+i+'|b" value="'+h.b+'" aria-label="'+h.d+' closes">':'<span class="muted">Closed</span>')+'</td><td>'+(h.open?sw(h.split,'hrSplit',i,'Split shift '+h.d):'')+'</td><td>'+(h.open&&h.split?'<input class="in tm" type="time" data-ch="hr:'+i+'|c" value="'+h.c+'" aria-label="'+h.d+' reopens"> – <input class="in tm" type="time" data-ch="hr:'+i+'|e" value="'+h.e+'" aria-label="'+h.d+' closes again">':'')+'</td></tr>'}).join('')+'</tbody></table></div></div>'+
  '<div class="grid g2" style="margin-top:1rem"><div class="card pad"><h3>Notifications</h3>'+[['chime','Order chime on this device'],['whatsapp','WhatsApp alerts for new orders'],['daily','Daily sales summary by email']].map(function(n){return '<div class="acts" style="justify-content:space-between;padding:.6rem 0;border-bottom:1px solid var(--bd)"><span>'+n[1]+'</span>'+sw(S.notifPref[n[0]],'npTog',n[0],n[1])+'</div>'}).join('')+'</div>'+
  '<div class="card pad"><h3>Security</h3><p class="sub">Withdrawal PIN and data</p><div class="acts" style="margin-top:.8rem">'+btn(ic('lock')+(S.pin?'Change PIN':'Create PIN'),'pinChange')+btn(ic('down')+'Export my data','expData')+btn(ic('refresh')+'Reset demo data','resetDemo','','danger')+'</div></div></div>';
}
FORMS.profile=function(f){var d=fdata(f);if(d.sn.trim().length<2){toast('Enter a store name.','warn');return}if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(d.se.trim())){toast('Enter a valid email.','warn');return}if(!/^\+?[\d\s]{10,16}$/.test(d.sp.trim())){toast('Enter a valid phone number.','warn');return}var eta=parseInt(d.seta,10);if(!(eta>=5&&eta<=120)){toast('ETA must be 5 to 120 minutes.','warn');return}
  upd(function(){Object.assign(S.store,{name:d.sn.trim(),phone:d.sp.trim(),email:d.se.trim(),addr:d.sa.trim(),rc:d.sr.trim(),eta:eta,bio:d.sbio.trim()});log('Store profile updated','settings')});toast('Profile saved.')};
CHG.hr=function(k,v){var p=k.split('|'),h=S.hours[+p[0]];h[p[1]]=v;save();toast(h.d+' hours updated.')};
Object.assign(A,{
 hrTog:function(el){var h=S.hours[+el.getAttribute('data-id')];upd(function(){h.open=!h.open});toast(h.d+(h.open?' is open.':' is closed.'))},
 hrSplit:function(el){var h=S.hours[+el.getAttribute('data-id')];upd(function(){h.split=!h.split});toast('Split shift '+(h.split?'on':'off')+' for '+h.d+'.')},
 npTog:function(el){var k=el.getAttribute('data-id');upd(function(){S.notifPref[k]=!S.notifPref[k];if(k==='chime')S.sound=S.notifPref.chime});toast('Setting saved.')},
 pinChange:function(){if(!can('withdraw')){noPerm('Only the Owner can manage the PIN.');return}if(!S.pin){A.pinSet();return}openM('<h3>Change withdrawal PIN</h3><div class="mgrid" style="margin-top:1rem"><div class="f w3"><label for="op">Current PIN</label><input id="op" name="o" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div><div class="f"><label for="np">New PIN</label><input id="np" name="n" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div><div class="f"><label for="np2">Repeat</label><input id="np2" name="n2" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div></div>'+mfoot('Change PIN'),function(d){if(pinHash(d.o)!==S.pin)return 'Current PIN is incorrect.';if(!/^\d{4}$/.test(d.n)||/^(\d)\1{3}$/.test(d.n)||d.n==='1234')return 'Pick a stronger 4-digit PIN.';if(d.n!==d.n2)return 'New PINs do not match.';S.pin=pinHash(d.n);save();toast('PIN changed.')})},
 expData:function(){dl('chowbuy-merchant-data.json',JSON.stringify(Object.assign({},S,{pin:undefined}),null,2),'application/json');toast('Your data was downloaded.')},
 resetDemo:function(){confirmM('Reset demo data?','This restores the sample '+V[S.vertical]+' data and clears your changes in this browser.','Reset',function(){try{localStorage.removeItem(KEY)}catch(e){}S=window.MSEED(S.vertical);save();buildNav();refresh();toast('Demo data restored.')},true)}
});
FILES.logo=function(f){if(!f)return;compress(f,function(u){S.store.logo=u;save();refresh();toast('Logo updated.')},400)};
FILES.cover=function(f){if(!f)return;compress(f,function(u){S.store.cover=u;save();refresh();toast('Cover photo updated.')},1000)};

/* ---------- onboarding / vertical switcher ---------- */
var VDESC={restaurant:'Menu with add-ons, kitchen display and prep timers.',grocery:'Barcodes, SKUs, stock batches and reorder alerts.',pharmacy:'Prescription verification, controlled drugs and pharmacist sign-off.',package:'Shipments, dimensions, rider dispatch and proof of delivery.'};
function vOnboard(){
  return head('Business type','Pick how you operate. The whole dashboard adapts: menus, labels, stock tools and workflows.')+
  '<div class="vgrid">'+Object.keys(V).map(function(k){var on=S.vertical===k;return '<article class="card pad vc'+(on?' on':'')+'" style="--vc:'+VC[k]+'"><span class="vi">'+ic(VI[k])+'</span><h3>'+V[k]+'</h3><p class="muted">'+VDESC[k]+'</p>'+(on?'<span class="pill ok">'+ic('check')+'Current</span>':btn('Switch to '+V[k],'vSwitch',k,'pri'))+'</article>'}).join('')+'</div><p class="muted" style="margin-top:1rem;font-size:.85rem">Switching loads sample data for that business type. Your wallet, bank accounts, staff and settings stay.</p>';
}
A.vSwitch=function(el){var v=el.getAttribute('data-id');if(!can('settings')){noPerm('Only the Owner can change the business type.');return}confirmM('Switch to '+V[v]+'?','The catalogue, orders and sidebar change to match. Wallet, banks, staff and settings stay.','Switch',function(){setVertical(v);location.hash='#/';refresh();toast('Dashboard is now set up for '+V[v]+'.')})};

/* ---------- support ---------- */
var FAQ=[['How do I change my payout bank?','Go to Money & Growth, Payouts & Settlements, then Add bank account. We verify the account name automatically with NIBSS.'],['Why was my payout delayed?','Card and transfer orders settle after delivery is confirmed. Cash on delivery is deducted from your wallet. Withdrawals to Nigerian banks are instant.'],['How do I pause orders when the kitchen is full?','Use the Open / Rush / Paused control at the top. Rush adds 15 minutes to customer estimates.'],['Who can verify prescriptions?','Only a Pharmacist or the Owner. Controlled drugs need the PCN number and a digital signature.'],['How is commission calculated?','A platform fee per business type plus 7.5% VAT on the fee. See the breakdown under Wallet.']];
function vSupport(){
  return head('Help & support','Answers, and real people when you need them.',btn(ic('msg')+'New ticket','tkNew','','pri'))+
  '<div class="grid g3">'+[['phone','Call us','+234 700 CHOWBUY','tel:+2347002469289'],['msg','WhatsApp','Chat with merchant success','https://wa.me/2347002469289'],['file','Email','merchants@chowbuy.ng','mailto:merchants@chowbuy.ng']].map(function(c){return '<a class="card pad sup" href="'+c[3]+'" target="_blank" rel="noopener">'+ic(c[0])+'<b>'+c[1]+'</b><span class="muted">'+c[2]+'</span></a>'}).join('')+'</div>'+
  '<div class="card pad" style="margin-top:1rem"><h3>Frequently asked</h3>'+FAQ.map(function(f,i){return '<details class="faq"><summary>'+esc(f[0])+'</summary><p>'+esc(f[1])+'</p></details>'}).join('')+'</div>'+
  '<div class="card pad" style="margin-top:1rem"><h3>Your tickets</h3>'+(S.tickets.length?'<ul class="feed">'+S.tickets.map(function(t){return '<li>'+ic('msg')+'<span><b>'+esc(t.id)+'</b> · '+esc(t.subject)+'<small class="muted" style="display:block">'+esc(t.cat)+' · '+ago(t.at)+'</small></span>'+pill(t.status,'warn')+'</li>'}).join('')+'</ul>':empty('msg','No tickets yet','Open one and we reply within 2 hours, 8am to 10pm.',btn('New ticket','tkNew','','pri')))+'</div>';
}
A.tkNew=function(){openM('<h3>New support ticket</h3><div class="mgrid" style="margin-top:1rem"><div class="f w3"><label for="tc">Topic</label><select id="tc" name="cat"><option>Orders</option><option>Payouts & wallet</option><option>Menu / catalogue</option><option>Prescriptions</option><option>Riders & delivery</option><option>Something else</option></select></div><div class="f w3"><label for="ts">Subject</label><input id="ts" name="subject" maxlength="80"></div><div class="f w3"><label for="tm">What happened?</label><textarea id="tm" name="msg" rows="4" maxlength="500"></textarea></div></div>'+mfoot('Send ticket'),function(d){if(d.subject.trim().length<4)return 'Add a short subject.';if(d.msg.trim().length<10)return 'Describe the problem in a sentence or two.';upd(function(){S.tickets.unshift({id:'TK-'+(4100+S.tickets.length),cat:d.cat,subject:d.subject.trim(),msg:d.msg.trim(),at:Date.now(),status:'open'});log('Support ticket opened','msg')});toast('Ticket sent. We reply within 2 hours.')})};

/* ---------- verification (KYC) ---------- */
var MDOCS={
 restaurant:[['cac','CAC registration','Certificate of incorporation or business name'],['tin','Tax ID (TIN)','From FIRS or your state tax office'],['owner_id','Owner’s government ID','NIN slip, passport, driver’s licence or voter’s card'],['food_cert','NAFDAC / food handler certificate','Required for cooked food'],['bank_letter','Bank account proof','Account statement or bank letter for payouts']],
 grocery:[['cac','CAC registration','Certificate of incorporation or business name'],['tin','Tax ID (TIN)','From FIRS or your state tax office'],['owner_id','Owner’s government ID','NIN slip, passport, driver’s licence or voter’s card'],['bank_letter','Bank account proof','Account statement or bank letter for payouts']],
 pharmacy:[['cac','CAC registration','Certificate of incorporation or business name'],['tin','Tax ID (TIN)','From FIRS or your state tax office'],['owner_id','Owner’s government ID','NIN slip, passport, driver’s licence or voter’s card'],['pcn','Pharmacy premises licence (PCN)','Current Pharmacists Council of Nigeria premises licence'],['bank_letter','Bank account proof','Account statement or bank letter for payouts']],
 package:[['cac','CAC registration','Certificate of incorporation or business name'],['tin','Tax ID (TIN)','From FIRS or your state tax office'],['owner_id','Owner’s government ID','NIN slip, passport, driver’s licence or voter’s card'],['bank_letter','Bank account proof','Account statement or bank letter for payouts']]
};
function mdocs(){return MDOCS[S.vertical]||MDOCS.restaurant}
function ensureKyc(){if(!S.kyc)S.kyc={cac:{status:'approved',file:'cac-certificate.pdf',note:''},tin:{status:'pending',file:'tin.jpg',note:''},owner_id:{status:'declined',file:'id-card.jpg',note:'The photo is cropped. Please send the full card.'}}}
function kbadge(s){var m={approved:['ok','checkc'],pending:['info','clock'],declined:['bad','xc']}[s]||['warn','alert'];return pill(s||'not sent',m[0],m[1])}
function vVerify(){
  ensureKyc();var req=mdocs(),ap=0,pe=0,de=0;req.forEach(function(d){var s=(S.kyc[d[0]]||{}).status;if(s==='approved')ap++;else if(s==='pending')pe++;else if(s==='declined')de++});
  var state=ap===req.length?['ok','Verified']:de?['bad','Action needed']:pe?['info','In review']:['warn','Documents needed'];
  var rows=req.map(function(d){var c=S.kyc[d[0]]||{},locked=c.status==='approved';
    return '<li style="align-items:flex-start"><span style="flex:1"><b>'+esc(d[1])+'</b><small class="muted" style="display:block">'+esc(d[2])+'</small>'+(c.file?'<small class="muted" style="display:block">File: '+esc(c.file)+'</small>':'')+(c.note?'<small style="display:block;color:var(--bad)">ChowBuy says: '+esc(c.note)+'</small>':'')+'</span><span style="display:grid;gap:.4rem;justify-items:end">'+kbadge(c.status)+(locked?'':btn(ic('upload')+(c.status?'Send again':'Upload'),'kycUp',d[0],'pri'))+'</span></li>'}).join('');
  return head('Verification','Send the documents below so ChowBuy can verify your business. If you need help, our team can upload them for you.',pill(state[1],state[0]))+
  '<div class="grid g3"><div class="card pad"><small class="muted">Approved</small><b class="mono" style="font-size:1.6rem;display:block">'+ap+' / '+req.length+'</b></div><div class="card pad"><small class="muted">In review</small><b class="mono" style="font-size:1.6rem;display:block">'+pe+'</b></div><div class="card pad"><small class="muted">Need your attention</small><b class="mono" style="font-size:1.6rem;display:block">'+(de+req.length-ap-pe-de)+'</b></div></div>'+
  '<div class="card pad" style="margin-top:1rem"><ul class="feed">'+rows+'</ul></div>'+
  '<div class="card pad" style="margin-top:1rem"><h3>Need help?</h3><p class="muted">Message merchant success on WhatsApp or call us and we can upload your documents for you and answer questions. You can keep selling-setup steps going while documents are being reviewed.</p><div class="acts"><a class="btn pri sm" href="https://wa.me/2347002469289" target="_blank" rel="noopener">Chat on WhatsApp</a><a class="btn sm" href="tel:+2347002469289">Call us</a></div></div>'+
  '<p class="muted" style="margin-top:1rem;font-size:.82rem">Demo mode: files stay in this browser. Real uploads and ChowBuy’s approval sync once your account is connected to the live backend.</p>';
}
A.kycUp=function(el){var id=el.getAttribute('data-id'),d=mdocs().filter(function(x){return x[0]===id})[0];if(!d)return;
  openM('<h3>'+esc(d[1])+'</h3><p class="muted">'+esc(d[2])+'. A clear photo or PDF, up to 8 MB.</p><div class="f"><label for="kfile">File</label><input id="kfile" name="file" type="file" accept="image/*,application/pdf"></div>'+mfoot('Send for review'),function(){
    var f=document.querySelector('#mf [name=file]').files[0];
    if(!f)return 'Choose a file first.';
    if(!/^(image\/|application\/pdf)/.test(f.type))return 'Use a photo (JPG, PNG) or a PDF.';
    if(f.size>8*1024*1024)return 'That file is larger than 8 MB.';
    ensureKyc();S.kyc[id]={status:'pending',file:f.name,note:''};log(d[1]+' sent for review','bell');save();refresh();toast(d[1]+' sent. We will review it shortly.')})};

/* ---------- routes ---------- */
var ROUTES=[
 {p:'',n:'Dashboard',i:'grid',g:'Operate',f:vDash},
 {p:'orders',n:function(){return S.vertical==='restaurant'?'Kitchen Queue':'Live Orders'},i:'list',g:'Operate',f:vOrders,badge:'o',v:['restaurant','grocery','pharmacy']},
 {p:'shipments',n:'Shipments',i:'truck',g:'Operate',f:vShip,v:['package']},
 {p:'prescriptions',n:'Prescriptions',i:'clip',g:'Operate',f:vRx,v:['pharmacy'],roles:['owner','pharmacist','manager']},
 {p:'menu',n:'Menu',i:'bag',g:'Catalogue & Stock',f:vCatalog,v:['restaurant'],roles:['owner','manager','pharmacist','kitchen']},
 {p:'products',n:'Products & SKUs',i:'bag',g:'Catalogue & Stock',f:vCatalog,v:['grocery','pharmacy'],roles:['owner','manager','pharmacist','kitchen']},
 {p:'categories',n:'Categories',i:'tag',g:'Catalogue & Stock',f:vCategories,v:['restaurant','grocery','pharmacy'],roles:['owner','manager','pharmacist']},
 {p:'inventory',n:'Inventory & Stock Batches',i:'box',g:'Catalogue & Stock',f:vInventory,v:['grocery','pharmacy']},
 {p:'promotions',n:'Promotions & Flash Deals',i:'flame',g:'Catalogue & Stock',f:vPromos,v:['restaurant','grocery','pharmacy'],roles:['owner','manager']},
 {p:'analytics',n:'Analytics',i:'chart',g:'Money & Growth',f:vAnalytics,roles:['owner','manager']},
 {p:'wallet',n:'Wallet',i:'wallet',g:'Money & Growth',f:vWallet,roles:['owner']},
 {p:'payouts',n:'Payouts & Settlements',i:'bank',g:'Money & Growth',f:vPayouts,roles:['owner']},
 {p:'reviews',n:'Reviews',i:'star',g:'Business & Management',f:vReviews,roles:['owner','manager']},
 {p:'branches',n:'Branches',i:'pin',g:'Business & Management',f:vBranches,roles:['owner','manager']},
 {p:'service-areas',n:'Service Areas',i:'map',g:'Business & Management',f:vAreas,roles:['owner','manager']},
 {p:'staff',n:'Staff & Permissions',i:'users',g:'Business & Management',f:vStaff,roles:['owner']},
 {p:'settings',n:'Store Settings',i:'settings',g:'Business & Management',f:vSettings,roles:['owner']},
 {p:'verification',n:'Verification (KYC)',i:'shield',g:'Business & Management',f:vVerify,roles:['owner']},
 {p:'onboarding',n:'Onboarding',i:'sparkles',g:'Business & Management',f:vOnboard,roles:['owner']},
 {p:'support',n:'Support',i:'help',g:'Business & Management',f:vSupport}
];
/* ---------- live mode: your real store, orders and menu from the ChowBuy backend ---------- */
var LAPI={url:'https://nhaxcyfkbrbwlqbpizjo.supabase.co',anon:'sb_publishable_fEoqE8u49jwFe1v36CacDg_seaMgyUS'};   /* publishable by design: every table is behind row-level security */
function lget(k){try{return sessionStorage.getItem(k)||''}catch(e){return ''}}
function lset(k,v){try{if(v)sessionStorage.setItem(k,v);else sessionStorage.removeItem(k)}catch(e){}}
function lend(msg){lset('cb-merch-tok','');lset('cb-merch-rt','');lset('cb-merch-store','');try{localStorage.removeItem('cb-merch-rt')}catch(e){}if(msg)lset('cb-merch-msg',msg);location.replace('./')}
var lrefreshing=null;
function lrefresh(){
  var rt=lget('cb-merch-rt');if(!rt)return Promise.reject(new Error('no refresh token'));
  if(!lrefreshing)lrefreshing=fetch(LAPI.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:LAPI.anon,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:rt})})
    .then(function(r){return r.json().then(function(j){if(!r.ok||!j.access_token)throw new Error('refresh failed');lset('cb-merch-tok',j.access_token);lset('cb-merch-rt',j.refresh_token||rt);try{if(localStorage.getItem('cb-merch-rt'))localStorage.setItem('cb-merch-rt',j.refresh_token||rt)}catch(e){}return j.access_token})})
    .then(function(t){lrefreshing=null;return t},function(e){lrefreshing=null;throw e});
  return lrefreshing;
}
function lreq(path,method,body,retried){
  var tok=lget('cb-merch-tok');
  return fetch(LAPI.url+path,{method:method||'GET',headers:{apikey:LAPI.anon,Authorization:'Bearer '+(tok||LAPI.anon),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})
   .then(function(r){return r.text().then(function(t){var j={};try{j=t?JSON.parse(t):{}}catch(e){}
     if(!r.ok){
       if(r.status===401&&tok){
         if(!retried&&lget('cb-merch-rt'))return lrefresh().then(function(){return lreq(path,method,body,true)},function(){lend('Your session expired. Please sign in again.');throw new Error('Session expired')});
         lend('Your session expired. Please sign in again.');
       }
       throw new Error(j.message||j.msg||j.error_description||j.error||('Request failed ('+r.status+')'))}
     return j})},function(){throw new Error('Could not reach the server. Check your connection.')});
}
function lrpc(fn,args){return lreq('/rest/v1/rpc/'+fn,'POST',args||{})}
var STG={received:'new',preparing:'preparing',rider_accepted:'ready',rider_at_store:'ready',in_transit:'out',arrived:'out',delivered:'completed',cancelled:'cancelled'};
var PAYL={korapay:'Card',pocketfi:'Transfer',wallet:'Wallet',cod:'Cash on Delivery'};
function mapOrder(o){
  var ts=Date.parse(o.created)||Date.now(),t=o.times||{},st=STG[o.stage]||'new',notes=[];
  if(t.ready&&(o.stage==='preparing'||o.stage==='rider_accepted'||o.stage==='rider_at_store'))st='ready';else if(o.stage==='rider_accepted'||o.stage==='rider_at_store')st='preparing';
  var lines=(o.lines||[]).map(function(l){if(l.note)notes.push(l.name+': '+l.note);return{id:l.productId||'',name:l.name||'Item',qty:l.qty||1,price:l.unitPrice||0,mods:(l.mods||[]).map(function(m){return m.name||m.label||''}).filter(Boolean),extra:0,note:l.note||''}});
  var a=o.addr||{},r={id:o.id,ts:ts,status:st,customer:o.customer||'Customer',phone:'',addr:[a.line,a.area].filter(Boolean).join(', ')+(a.landmark?' (near '+a.landmark+')':''),pay:PAYL[o.pay]||o.pay,paid:!!o.paid,lines:lines,sub:o.subtotal||0,fee:o.fee||0,note:notes.join(' · '),rider:o.rider?{name:o.rider.name||'Rider',plate:o.rider.plate||'',eta:0}:null,stage:o.stage,cancelReason:o.cancelReason||'',refunded:o.refunded||0};
  if(st!=='new'&&st!=='cancelled'){r.acceptedAt=Number(t.preparing)||ts;r.prep=25;r.due=r.acceptedAt+25*60000}
  return r;
}
function buildLiveS(){
  var st=LV.store,snd=S.sound!==false,base=window.MSEED(st.vertical);
  S=base;S.sound=snd;S.vertical=st.vertical;
  S.me={name:LV.me.name||LV.me.email,email:LV.me.email,role:{owner:'owner',manager:'manager',staff:'kitchen'}[st.role]||'kitchen'};
  S.store=Object.assign(S.store,{name:st.name,phone:'',email:LV.me.email,addr:st.area,logo:'',cover:'',status:st.open?'open':'paused',pauseReason:''});
  S.branches=[{id:'B1',name:st.area||'Main store',addr:st.area||'',status:st.open?'open':'closed',f:1}];S.branch='B1';
  S.notifs=[];S.activity=[];S.items=[];S.cats=[];S.ships=[];S.rx=[];S.reviews=[];
  S.orders=(LV.orders||[]).map(mapOrder);
}
function liveLoad(){
  var id=LV.store.id;
  return Promise.all([lrpc('merchant_orders',{p_merchant:id,p_limit:200}),lreq('/rest/v1/products?merchant_id=eq.'+encodeURIComponent(id)+'&select=id,name,descr,price,category,in_stock,rx&order=category.asc,name.asc&limit=1000','GET')]).then(function(r){
    var fresh=[];if(LV.seen){r[0].forEach(function(o){if(o.stage==='received'&&!LV.seen[o.id])fresh.push(o)})}
    LV.seen=LV.seen||{};r[0].forEach(function(o){LV.seen[o.id]=1});
    LV.orders=r[0];LV.products=r[1];buildLiveS();
    if(fresh.length){chime();toast(fresh.length===1?'New order '+fresh[0].id+' from '+(fresh[0].customer||'a customer')+'.':fresh.length+' new orders.')}
  });
}
function liveBoot(){
  return lrpc('merchant_me').then(function(me){
    if(!me.stores||!me.stores.length)throw new Error('This account has no approved business yet.');
    LV.me=me;var want=lget('cb-merch-store');LV.store=me.stores.filter(function(s){return s.id===want})[0]||me.stores[0];lset('cb-merch-store',LV.store.id);LV.on=true;
    return liveLoad();
  });
}
function lsignOut(){var t=lget('cb-merch-tok');if(t)fetch(LAPI.url+'/auth/v1/logout',{method:'POST',headers:{apikey:LAPI.anon,Authorization:'Bearer '+t}}).catch(function(){});lend('')}
function renderLiveBox(){
  var b=$('#liveBox');if(!b)return;
  b.innerHTML='<div class="lbox on"><b>'+ic('checkc')+' Live</b><small class="muted">Real orders and menu for '+esc(LV.store.name)+'. Other pages are not connected yet.</small><button type="button" class="btn sm" data-act="signout" style="width:100%">Sign out</button></div>';
}
function liveErr(e){toast(e.message||'Something went wrong.','err')}
function lagosDay(ts){return new Date(ts).toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'})}
function vDashLive(){
  var td=lagosDay(Date.now()),O=S.orders,today=O.filter(function(o){return lagosDay(o.ts)===td&&o.status!=='cancelled'});
  var sales=today.reduce(function(a,o){return a+o.sub},0),active=O.filter(function(o){return['new','preparing','ready','out'].indexOf(o.status)>=0}),nw=O.filter(function(o){return o.status==='new'});
  var st=LV.store,rt=st.ratingCount?st.ratingPct/20:0,hr=new Date().getHours(),first=String(S.me.name||'').split(' ')[0]||'there';
  var recent=O.slice(0,8).map(function(o){return '<li><b class="mono">'+esc(o.id)+'</b><span>'+esc(o.customer)+' · '+ngn(o.sub)+'</span>'+pill(o.status,OPILL[o.status])+'<small class="muted">'+ago(o.ts)+'</small></li>'}).join('');
  return head('Good '+(hr<12?'morning':hr<17?'afternoon':'evening')+', '+esc(first),esc(st.name)+' · live data'+(st.open?'':' · store is paused'),(S.vertical==='package'?'':'<a class="btn pri" href="#/orders">'+ic('list')+'Open '+vtxt().orders+'</a>')+'<button type="button" class="btn" data-act="liveRefresh">'+ic('rot')+'Refresh</button>')+
  (st.active?'':'<div class="card pad" style="border-color:var(--amber,#F59E0B);margin-bottom:1rem"><b>Your store is not visible to customers yet.</b> <span class="muted">ChowBuy has not activated it. You can set up your menu in the meantime.</span></div>')+
  '<div class="grid g5">'+kpi('Orders today',today.length,'','bag')+kpi('Sales today',ngn(sales),'','trend','g','Items only, cancelled excluded')+kpi('Active orders',active.length,'','list','n')+kpi('Waiting for you',nw.length,'','clock')+kpi('Store rating',rt?rt.toFixed(1)+' / 5':'New','','star','n',num(st.ratingCount)+' rating'+(st.ratingCount===1?'':'s'))+'</div>'+
  (nw.length?'<div class="card pad" style="margin-top:1rem"><h3>Needs your attention</h3><p class="sub">New orders waiting to be accepted</p><div class="ribbon" style="margin-top:.8rem">'+nw.slice(0,10).map(function(o){return '<a class="rb" href="#/orders"><b class="mono">'+esc(o.id)+'</b><span>'+esc(o.customer)+' · '+ngn(o.sub)+'</span>'+pill('new','warn')+'</a>'}).join('')+'</div></div>':'')+
  (O.length?'':'<div class="card pad" style="margin-top:1rem"><h3>Finish setting up</h3><p class="sub">'+esc(CKHELP[LV.store.type]||'')+'</p><p style="margin-top:.8rem"><a class="btn pri" href="#/onboarding">Open setup checklist</a></p></div>')+'<div class="card pad" style="margin-top:1rem"><h3>Recent orders</h3>'+(recent?'<ul class="feed">'+recent+'</ul>':empty('bag','No orders yet','Orders from customers will appear here as soon as they pay.'))+'</div>';
}
function lcat(p){return p.category||'Other'}
function vCatalogLive(){
  var P=LV.products||[],t=T('lcat','all'),q=(U.q.lcat||'').toLowerCase(),cats=[],rest=S.vertical==='restaurant';
  P.forEach(function(p){if(cats.indexOf(lcat(p))<0)cats.push(lcat(p))});
  var rows=P.filter(function(p){return(t==='all'||lcat(p)===t)&&(!q||(p.name+' '+lcat(p)).toLowerCase().indexOf(q)>=0)});
  return head(rest?'Menu':'Products','What customers can order from you. Changes are live straight away.',btn(ic('plus')+'Add '+(rest?'dish':'product'),'pNew','','pri'))+
  '<div class="card"><div class="bar"><div class="tabs" role="group"><button type="button" data-act="tab" data-k="lcat" data-v="all" aria-pressed="'+(t==='all')+'">All <em>'+P.length+'</em></button>'+cats.map(function(c){return '<button type="button" data-act="tab" data-k="lcat" data-v="'+esc(c)+'" aria-pressed="'+(t===c)+'">'+esc(c)+'</button>'}).join('')+'</div>'+search('lcat','Search items')+'</div>'+
  (rows.length?'<div class="tw"><table class="t" style="min-width:36rem"><thead><tr><th>Item</th><th>Category</th><th style="text-align:right">Price</th><th>Available</th><th></th></tr></thead><tbody>'+rows.map(function(p){return '<tr><td><b>'+esc(p.name)+'</b>'+(p.rx?' '+pill('Rx','warn'):'')+(p.descr?'<div class="muted" style="font-size:.8rem">'+esc(p.descr.length>70?p.descr.slice(0,70)+'…':p.descr)+'</div>':'')+'</td><td>'+esc(lcat(p))+'</td><td class="mono" style="text-align:right">'+ngn(p.price)+'</td><td>'+sw(p.in_stock,'pStock',p.id,'Available to order')+'</td><td><div class="acts">'+btn('Edit','pEdit',p.id)+btn('Delete','pDel',p.id,'danger')+'</div></td></tr>'}).join('')+'</tbody></table></div>'
    :empty('bag',P.length?'No match':(rest?'Your menu is ready to be created':'Your catalogue is empty'),P.length?'Try another category or clear the search.':(CKHELP[LV.store.type]||'Add your first product.'),P.length?'':btn('Add '+(rest?'dish':'product'),'pNew','','pri')))+'</div>';
}
function pForm(p){
  var rest=S.vertical==='restaurant',cats=[];(LV.products||[]).forEach(function(x){if(cats.indexOf(lcat(x))<0)cats.push(lcat(x))});
  return '<h3>'+(p?'Edit':'Add')+' '+(rest?'dish':'product')+'</h3>'+inp('pn','Name',p?p.name:'','maxlength="80" required')+
   '<div class="f"><label for="pd">Description</label><textarea id="pd" name="pd" rows="3" maxlength="400">'+esc(p?p.descr:'')+'</textarea></div>'+
   '<div class="mgrid">'+inp('pp','Price (₦)',p?p.price:'','inputmode="numeric" placeholder="3500"')+inp('pc','Category',p?p.category:'','maxlength="40" list="pcl" placeholder="e.g. Rice Dishes"')+'</div><datalist id="pcl">'+cats.map(function(c){return '<option value="'+esc(c)+'">'}).join('')+'</datalist>'+
   '<label style="display:flex;gap:.5rem;align-items:center;margin-top:.8rem"><input type="checkbox" name="pa"'+(!p||p.in_stock?' checked':'')+' style="width:auto"> Available to order</label>'+
   (S.vertical==='pharmacy'?'<label style="display:flex;gap:.5rem;align-items:center;margin-top:.5rem"><input type="checkbox" name="px"'+(p&&p.rx?' checked':'')+' style="width:auto"> Needs a prescription</label>':'')+
   '<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">'+(p?'Save changes':'Add')+'</button></div>';
}
function pSubmit(id){return function(d){
  var price=parseInt(String(d.pp).replace(/\D/g,''),10);
  if(!d.pn.trim())return 'Enter a name.';
  if(!(price>=0))return 'Enter a price in naira.';
  var b=$('#mf button[type=submit]');b.disabled=true;
  lrpc('merchant_product_save',{p_merchant:LV.store.id,p_id:id||null,p_name:d.pn,p_descr:d.pd||'',p_price:price,p_category:d.pc||'',p_in_stock:!!d.pa,p_rx:!!d.px}).then(function(){return liveLoad()}).then(function(){closeM();refresh();toast(id?'Saved.':'Added. Customers can order it now.')},function(e){b.disabled=false;var er=$('#merr');if(er)er.textContent=e.message});
  return false}}
function vSettingsLive(){
  var st=LV.store;
  return head('Store settings','What customers see about your store.')+
  '<div class="card pad"><div class="acts" style="justify-content:space-between"><div><h3>Accepting orders</h3><p class="sub">Turn off to pause new orders. Customers see the store as closed.</p></div>'+sw(st.open,'lsOpen','x','Accepting orders')+'</div></div>'+
  '<form data-form="lstore" class="card pad" style="margin-top:1rem" novalidate><h3>Store details</h3><div class="mgrid" style="margin-top:1rem">'+inp('sn','Store name',st.name,'maxlength="80"')+inp('sh','Opening hours',st.hours,'maxlength="80" placeholder="e.g. 8am – 10pm daily"')+inp('sf','Delivery fee (₦)',st.deliveryFee,'inputmode="numeric"')+inp('se1','Fastest delivery (min)',st.etaMin,'inputmode="numeric"')+inp('se2','Slowest delivery (min)',st.etaMax,'inputmode="numeric"')+'</div>'+
  '<p class="sub" style="margin-top:.8rem">Area: '+esc(st.area||'Not set')+' · Type: '+esc(V[st.vertical])+'. To change these, contact ChowBuy support.</p><div class="acts" style="margin-top:1rem"><button type="submit" class="btn pri">Save changes</button></div></form>';
}
FORMS.lstore=function(f){
  var d=fdata(f),fee=parseInt(d.sf,10),a=parseInt(d.se1,10),b=parseInt(d.se2,10);
  if(d.sn.trim().length<2){toast('Enter a store name.','warn');return}
  if(!(fee>=0&&fee<=100000)){toast('Enter a delivery fee in naira.','warn');return}
  if(!(a>=1&&b>=a&&b<=240)){toast('Enter a delivery time range, fastest first.','warn');return}
  lrpc('merchant_store_update',{p_merchant:LV.store.id,p_name:d.sn.trim(),p_hours:d.sh.trim(),p_fee:fee,p_eta_min:a,p_eta_max:b}).then(function(){return liveBoot()}).then(function(){buildNav();refresh();toast('Saved.')},liveErr);
};
Object.assign(A,{
 liveRefresh:function(){liveLoad().then(function(){refresh();toast('Up to date.')},liveErr)},
 pNew:function(){openM(pForm(null),pSubmit(null))},
 pEdit:function(el){var p=find(LV.products,el.getAttribute('data-id'));if(p)openM(pForm(p),pSubmit(p.id))},
 pStock:function(el){var p=find(LV.products,el.getAttribute('data-id'));if(!p)return;var v=!p.in_stock;p.in_stock=v;refresh();lrpc('merchant_product_stock',{p_id:p.id,p_in_stock:v}).then(function(){toast(p.name+(v?' is available.':' is marked unavailable.'))},function(e){p.in_stock=!v;refresh();liveErr(e)})},
 pDel:function(el){var p=find(LV.products,el.getAttribute('data-id'));if(!p)return;confirmM('Delete '+esc(p.name)+'?','Customers will no longer see it. Past orders are not affected.','Delete',function(){lrpc('merchant_product_delete',{p_id:p.id}).then(function(){return liveLoad()}).then(function(){refresh();toast('Deleted.')},liveErr)},true)},
 lsOpen:function(){var v=!LV.store.open;lrpc('merchant_set_open',{p_merchant:LV.store.id,p_open:v}).then(function(){LV.store.open=v;buildLiveS();refresh();toast(v?'Store is open for orders.':'Store paused. Customers see it as closed.')},liveErr)}
});
['accept','reject','ready','status','signout','odetail'].forEach(function(k){
  var orig=A[k];
  A[k]=function(el,e){
    if(!LV.on)return orig(el,e);
    if(k==='signout')return lsignOut();
    if(k==='status'){var v=el.getAttribute('data-id');if(v==='rush')return;if((v==='open')===LV.store.open)return;return A.lsOpen()}
    var o=find(S.orders,el.getAttribute('data-id'));if(!o)return;
    if(k==='odetail'){openM('<h3>'+esc(o.id)+' '+pill(o.status,OPILL[o.status])+'</h3><div class="kv"><span>Customer</span><b>'+esc(o.customer)+'</b><span>Delivery address</span><b>'+esc(o.addr)+'</b><span>Placed</span><b>'+dstr(o.ts)+'</b><span>Payment</span><b>'+esc(o.pay)+(o.paid?' (paid)':' (collect on delivery)')+'</b><span>Rider</span><b>'+(o.rider?esc(o.rider.name+(o.rider.plate?' · '+o.rider.plate:'')):'Not assigned yet')+'</b></div><ul class="ol" style="margin-top:1rem">'+o.lines.map(lineHtml).join('')+'</ul>'+(o.note?'<p class="onote">'+ic('msg')+esc(o.note)+'</p>':'')+'<div class="kv tot"><span>Items</span><b class="mono">'+ngn(o.sub)+'</b><span>Delivery fee</span><b class="mono">'+ngn(o.fee)+'</b></div><div class="ft"><button type="button" class="btn" data-m="x">Close</button></div>');return}
    if(k==='ready'){lrpc('merchant_mark_ready',{p_order:o.id}).then(function(){return liveLoad()}).then(function(){U.tab.ord='ready';refresh();toast(o.id+' is marked ready. The rider will collect it.')},liveErr);return}
    var cancel=k==='reject';
    if(!cancel){
      openM('<h3>Start preparing '+esc(o.id)+'?</h3><p class="muted">The customer is told you are preparing their order, and a nearby rider can accept it.</p>'+mfoot2('Start preparing',false),function(){
        var b=$('#mf button[type=submit]');b.disabled=true;
        lrpc('merchant_set_stage',{p_order:o.id,p_stage:'preparing'}).then(function(){return liveLoad()}).then(function(){U.tab.ord='preparing';closeM();refresh();toast('Preparing '+o.id+'.')},function(er){b.disabled=false;var m2=$('#merr');if(m2)m2.textContent=er.message});
        return false});
      return}
    var reasons=['Item out of stock','Store closing early','Power or equipment problem','Too busy to take this order','Other'];
    openM('<h3>Cancel '+esc(o.id)+'?</h3><p class="muted">'+(o.paid?'The customer has paid, so they are refunded in full to their ChowBuy wallet automatically.':'The customer pays on delivery, so nothing needs refunding.')+' Your reason is sent to ChowBuy admin.</p><div class="radios col" style="margin:1rem 0">'+reasons.map(function(x,i){return '<label class="rad"><input type="radio" name="reason" value="'+esc(x)+'"'+(i===0?' checked':'')+'><span>'+esc(x)+'</span></label>'}).join('')+'</div>'+inp('rn','If other, tell us why','','maxlength="150" placeholder="Reason"')+mfoot2('Cancel order and refund',true),function(d){
      var why=d.reason==='Other'?(d.rn||'').trim():d.reason;if(!why||why.length<3)return 'Tell us why you are cancelling.';
      var b=$('#mf button[type=submit]');b.disabled=true;
      lrpc('merchant_cancel_order',{p_order:o.id,p_reason:why}).then(function(r){return liveLoad().then(function(){return r})}).then(function(r){U.tab.ord='cancelled';closeM();refresh();toast(o.id+' cancelled.'+(r&&r.refunded?' '+ngn(r.refunded)+' refunded to the customer.':''))},function(er){b.disabled=false;var m2=$('#merr');if(m2)m2.textContent=er.message});
      return false});
  };
});
function mfoot2(ok,danger){return '<div class="ft"><button type="button" class="btn" data-m="x">Back</button><button type="submit" class="btn '+(danger?'danger':'pri')+'">'+ok+'</button></div>'}
/* ---------- setup checklist, team and payout account (live, from the database) ---------- */
function liveBlank(t,msg){return head(t,'')+'<div class="card pad"><p class="sub">'+msg+'</p></div>'}
var CKHELP={RESTAURANT:'Your menu is ready to be created.',GROCERY_SUPERMARKET:'Add your first products to begin building your catalog.',PHARMACY:'Complete the required verification before activating your pharmacy catalog.',PACKAGE_LOGISTICS:'Configure your service areas and delivery capabilities.'};
function ckLoad(){if(LV.ck||LV.ckBusy)return;LV.ckBusy=true;lrpc('merchant_checklist',{p_merchant:LV.store.id}).then(function(r){LV.ck=r;LV.ckBusy=false;refresh()},function(e){LV.ckBusy=false;LV.ck=[];refresh();liveErr(e)})}
function vChecklistLive(){
  ckLoad();var C=LV.ck;
  if(!C)return head('Setup checklist','Finish these to start operating.')+'<div class="card pad"><p class="sub">Loading…</p></div>';
  var done=C.filter(function(x){return x.done}).length,pct=C.length?Math.round(done/C.length*100):0;
  return head('Setup checklist',CKHELP[LV.store.type]||'Finish these to start operating.')+
  '<div class="card pad"><div class="acts" style="justify-content:space-between"><b>'+done+' of '+C.length+' done</b><span class="muted">'+pct+'%</span></div><div style="height:.5rem;border-radius:99px;background:var(--fill);margin-top:.6rem;overflow:hidden"><i style="display:block;height:100%;width:'+pct+'%;background:linear-gradient(90deg,var(--accent),var(--accent2))"></i></div></div>'+
  '<div class="card pad" style="margin-top:1rem"><ul class="feed">'+C.map(function(x){return '<li class="it" style="align-items:center"><span class="ico'+(x.done?' g':'')+'">'+ic(x.done?'checkc':'clock')+'</span><span style="flex:1"><b>'+esc(x.label)+'</b><small style="display:block">'+(x.done?'Done':x.manual?'Confirm when you have done this.':'Completes automatically when it is set up.')+'</small></span>'+(x.done?'':x.manual?btn('Mark done','ckAck',x.key,'pri'):ckLink(x.key))+'</li>'}).join('')+'</ul></div>';
}
function ckLink(k){var m={menu_categories:'menu',menu_items:'menu',prices:'menu',product_categories:'products',products:'products',prices_stock:'products',catalog:'products',hours:'settings',accept_orders:'settings',settlement:'settings/settlement'}[k];return m?'<a class="btn sm" href="#/'+m+'">Open</a>':''}
function teamLoad(){if(LV.team||LV.teamBusy)return;LV.teamBusy=true;lrpc('merchant_team',{p_merchant:LV.store.id}).then(function(r){LV.team=r;LV.teamBusy=false;refresh()},function(e){LV.teamBusy=false;LV.team=[];LV.teamErr=e.message;refresh()})}
function vTeamLive(){
  if(LV.store.role==='staff')return head('Team','')+'<div class="card pad"><p class="sub">Only the owner or a manager can see the team.</p></div>';
  teamLoad();var T=LV.team,own=LV.store.role==='owner';
  if(!T)return head('Team','')+'<div class="card pad"><p class="sub">Loading…</p></div>';
  return head('Team','People who can work in '+esc(LV.store.name)+'.',own?btn(ic('plus')+'Invite someone','tmInvite','','pri'):'')+
  '<div class="card"><div class="tw"><table class="t" style="min-width:34rem"><thead><tr><th>Name</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>'+T.map(function(m){return '<tr><td><b>'+esc(m.name||m.email)+'</b>'+(m.me?' '+pill('You','acc'):'')+'<div class="muted" style="font-size:.8rem">'+esc(m.email)+'</div></td><td>'+esc(m.role)+(m.role==='owner'||!m.relationship?'':' <small class="muted">('+esc(m.relationship)+')</small>')+'</td><td>'+(m.status==='invited'?pill('Invited','warn'):pill('Active','ok'))+'</td><td>'+(own&&!m.me&&m.role!=='owner'?btn('Remove','tmRemove',m.user,'danger'):'')+'</td></tr>'}).join('')+'</tbody></table></div></div>'+
  '<p class="muted" style="font-size:.84rem;margin-top:1rem">Owners and managers can edit the catalogue and settings. Staff can work orders. Invited people must accept from their own sign-in. Ownership never changes by invitation.</p>';
}
function settleLoad(){if(LV.settle!==undefined||LV.settleBusy)return;LV.settleBusy=true;lrpc('merchant_settlement_get',{p_merchant:LV.store.id}).then(function(r){LV.settle=r;LV.settleBusy=false;refresh()},function(e){LV.settleBusy=false;LV.settle=null;refresh();liveErr(e)})}
function vSettleLive(){
  if(LV.store.role!=='owner')return head('Payout account','')+'<div class="card pad"><p class="sub">Only the owner can see or change payout details.</p></div>';
  settleLoad();var st=LV.settle;
  if(st===undefined)return head('Payout account','')+'<div class="card pad"><p class="sub">Loading…</p></div>';
  var stat=st?(st.status==='VERIFIED'?pill('Verified','ok','checkc'):st.status==='FAILED'?pill('Could not be verified','bad'):pill('Pending verification','warn','clock')):'';
  return head('Payout account','Where ChowBuy pays your earnings.',btn(st?'Change account':'Add account','stEdit','','pri'))+
  '<div class="card pad">'+(st?'<div class="kv"><span>Account name</span><b>'+esc(st.beneficiary)+'</b><span>Bank</span><b>'+esc(st.bank)+'</b><span>Account number</span><b class="mono">•••• '+esc(st.last4)+'</b><span>Status</span><b>'+stat+'</b></div>'+(st.status==='FAILED'&&st.note?'<p class="err" style="margin-top:.8rem">'+esc(st.note)+'</p>':'')+'<p class="muted" style="margin-top:1rem;font-size:.84rem">ChowBuy confirms the account name with your bank before the first payout. Changing the details restarts that check.</p>':empty('wallet','No payout account yet','Add the account where you want to be paid.',btn('Add account','stEdit','','pri')))+'</div>';
}
Object.assign(A,{
 ckAck:function(el){lrpc('merchant_checklist_ack',{p_merchant:LV.store.id,p_key:el.getAttribute('data-id')}).then(function(){LV.ck=null;refresh();toast('Marked done.')},liveErr)},
 tmInvite:function(){openM('<h3>Invite someone</h3><p class="muted">They need a ChowBuy account already. They will see the invitation when they sign in and must accept it.</p>'+inp('ie','Their email','','type="email" autocapitalize="off"')+'<div class="f"><label for="ir">Role</label><select id="ir" name="ir"><option value="staff">Staff: work orders</option><option value="manager">Manager: also edit catalogue and settings</option></select></div><div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Send invitation</button></div>',function(d){
   if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test((d.ie||'').trim()))return 'Enter a valid email.';
   var b=$('#mf button[type=submit]');b.disabled=true;
   lrpc('merchant_invite',{p_merchant:LV.store.id,p_email:d.ie.trim(),p_role:d.ir}).then(function(){LV.team=null;closeM();refresh();toast('Invitation sent.')},function(e){b.disabled=false;var er=$('#merr');if(er)er.textContent=e.message});return false})},
 tmRemove:function(el){var id=el.getAttribute('data-id');confirmM('Remove this person?','They lose access to '+esc(LV.store.name)+' straight away.','Remove',function(){lrpc('merchant_member_remove',{p_merchant:LV.store.id,p_user:id}).then(function(){LV.team=null;refresh();toast('Removed.')},liveErr)},true)},
 stEdit:function(){var st=LV.settle||{};openM('<h3>Payout account</h3><p class="muted">Use the account name exactly as your bank shows it.</p>'+inp('sb','Account name',st.beneficiary||'','maxlength="80"')+inp('sk','Bank',st.bank||'','maxlength="60"')+inp('sa','10-digit account number','','inputmode="numeric" maxlength="12" autocomplete="off"')+'<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Save</button></div>',function(d){
   var b=$('#mf button[type=submit]');b.disabled=true;
   lrpc('merchant_settlement_save',{p_merchant:LV.store.id,p_beneficiary:d.sb,p_bank:d.sk,p_account:d.sa}).then(function(){LV.settle=undefined;LV.ck=null;closeM();refresh();toast('Saved. ChowBuy will verify the account.')},function(e){b.disabled=false;var er=$('#merr');if(er)er.textContent=e.message});return false})},
 switchBiz:function(){lset('cb-merch-store','');location.hash='#/workspaces';location.reload()}
});
ROUTES.push({p:'settings/team',n:'Team',i:'users',g:'Business & Management',f:vTeamLive,roles:['owner','manager']},{p:'settings/settlement',n:'Payout account',i:'wallet',g:'Business & Management',f:vSettleLive,roles:['owner']});
ROUTES.forEach(function(r){if(r.p==='onboarding'){r.n='Setup checklist';r.roles=['owner','manager']}if(r.p==='settings')r.roles=['owner','manager']});
ROUTES.forEach(function(r){r.lf={'':vDashLive,orders:vOrders,menu:vCatalogLive,products:vCatalogLive,settings:vSettingsLive,onboarding:vChecklistLive,'settings/team':vTeamLive,'settings/settlement':vSettleLive}[r.p]});
setInterval(function(){if(LV.on&&document.visibilityState==='visible'&&!$('#mwrap').classList.contains('show')&&!(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)))liveLoad().then(function(){var r=cur();if(r&&(r.p===''||r.p==='orders'))refresh();else renderBar()},function(){})},20000);

/* ---------- init ---------- */
buildNav();
setTheme(savedTheme||'light');
$('#burger').innerHTML=ic('menu');$('#closeSide').innerHTML=ic('x');
$('#bell').innerHTML=ic('bell')+'<span class="dot" id="nbadge"></span>';
$('#burger').addEventListener('click',openSide);$('#closeSide').addEventListener('click',closeSide);$('#scrim').addEventListener('click',closeSide);
$('#nav').addEventListener('click',function(e){if(e.target.closest('a'))closeSide()});
document.body.addEventListener('keydown',function(e){if(e.key==='Tab'&&$('#mwrap').classList.contains('show')){var f=[].filter.call($('#mbody').querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]'),function(x){return !x.disabled&&x.offsetParent!==null});if(!f.length)return;var a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
var bootMsg=lget('cb-merch-msg');lset('cb-merch-msg','');
/* The dashboard only ever shows a real, approved business. Anything else goes back to the sign-in and onboarding screens. */
if(lget('cb-merch-tok')){
  $('#view').innerHTML='<div class="card pad"><p class="sub">Loading your store…</p></div>';
  liveBoot().then(function(){buildNav();render(false);if(bootMsg)toast(bootMsg,'warn')},function(e){if(/not linked|no approved|session expired/i.test(e.message||'')){lset('cb-merch-store','');location.replace('./')}else{LV.on=false;$('#view').innerHTML='<div class="card pad"><h3>Could not load your store</h3><p class="sub">'+esc(e.message||'Try again.')+'</p><p style="margin-top:1rem"><button type="button" class="btn pri" onclick="location.reload()">Try again</button></p></div>'}});
}else{location.replace('./')}
setInterval(tick,1000);
window.addEventListener('storage',function(e){if(e.key===KEY)location.reload()});
})();
