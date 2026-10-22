/* ChowBuy Admin Console. Static demo: all data is mock and lives in this browser only. */
(function(){
'use strict';
var META=window.CB_META,V=META.V,KEY='cb-admin-v1';
var $=function(s,r){return (r||document).querySelector(s)};
var clone=function(o){return JSON.parse(JSON.stringify(o))};
var find=function(a,id){for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i]};

/* ---------- state ---------- */
function load(){
  try{var j=localStorage.getItem(KEY);if(j){var o=JSON.parse(j);if(o&&o.v===1&&o.s&&o.s.orders)return o.s}}catch(e){}
  return window.CB_SEED();
}
var S=load();
try{var mt=localStorage.getItem('cb-mail-templates');if(mt)U=U||{};}catch(e){}
if(!S.fin)S.fin={pending:18420000};
var warnedQuota=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify({v:1,s:S}))}catch(e){if(!warnedQuota){warnedQuota=true;toast('Browser storage is full. Changes will last only until you close this tab.','warn')}}}
var U={q:{},tab:{},page:{},range:1,brand:'MAIN',dev:'desktop',seoEdit:null,seoDraft:null,sdraft:null,cityStates:{}};
var T=function(k,d){return U.tab[k]||d};

/* ---------- icons (lucide style) ---------- */
var IC={
chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L3 20l1.1-4.9A8 8 0 1 1 21 12Z"/>',
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

/* ---------- charts ---------- */
function areaChart(vals,labels){
  var W=600,H=240,pl=44,pr=12,pt=16,pb=28,max=Math.ceil(Math.max.apply(0,vals)/100)*100;
  var x=function(i){return pl+i*(W-pl-pr)/(vals.length-1)},y=function(v){return pt+(H-pt-pb)*(1-v/max)};
  var g='';for(var k=0;k<=4;k++){var v=max/4*k,yy=y(v);g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yy+'" y2="'+yy+'" style="stroke:var(--line)"/><text x="'+(pl-8)+'" y="'+(yy+3)+'" text-anchor="end">₦'+Math.round(v)+'M</text>'}
  var d='M'+x(0)+','+y(vals[0]);for(var i=1;i<vals.length;i++){var mx=(x(i-1)+x(i))/2;d+=' C'+mx+','+y(vals[i-1])+' '+mx+','+y(vals[i])+' '+x(i)+','+y(vals[i])}
  var area=d+' L'+x(vals.length-1)+','+(H-pb)+' L'+x(0)+','+(H-pb)+'Z';
  var dots=vals.map(function(v,i){return '<circle cx="'+x(i)+'" cy="'+y(v)+'" r="4" style="fill:var(--card);stroke:var(--accent);stroke-width:2.5"><title>'+labels[i]+': ₦'+v+'M</title></circle>'}).join('');
  var lb=labels.map(function(l,i){return '<text x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle">'+l+'</text>'}).join('');
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Monthly gross merchandise volume, '+labels[0]+' to '+labels[labels.length-1]+'"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5A1F" stop-opacity=".35"/><stop offset="1" stop-color="#FF5A1F" stop-opacity="0"/></linearGradient></defs>'+g+'<path d="'+area+'" fill="url(#ga)"/><path d="'+d+'" fill="none" style="stroke:var(--accent);stroke-width:3;stroke-linecap:round"/>'+dots+lb+'</svg>';
}
function donut(parts,center){
  var acc=0,cols=['#FF5A1F','#12A150','#2563EB','#7C3AED'];
  var c=parts.map(function(p,i){var s=p[1],o=25-acc;acc+=s;return '<circle cx="21" cy="21" r="15.9155" fill="none" stroke="'+cols[i]+'" stroke-width="5" stroke-dasharray="'+Math.max(0,s-.6)+' '+(100-s+.6)+'" stroke-dashoffset="'+o+'"><title>'+parts[i][0]+': '+s+'%</title></circle>'}).join('');
  return '<svg class="chart" viewBox="0 0 42 42" style="max-width:15rem;margin:0 auto" role="img" aria-label="Order share by vertical"><circle cx="21" cy="21" r="15.9155" fill="none" style="stroke:var(--fill)" stroke-width="5"/>'+c+'<text x="21" y="20.5" text-anchor="middle" style="font:800 5px var(--display);fill:var(--fg)">'+center[0]+'</text><text x="21" y="26" text-anchor="middle" style="font:600 2.6px var(--body);fill:var(--muted)">'+center[1]+'</text></svg><div class="legend">'+parts.map(function(p,i){return '<div><i style="background:'+cols[i]+'"></i>'+p[0]+'<span>'+p[1]+'%</span></div>'}).join('')+'</div>';
}
function barChart(vals,start){
  var W=600,H=210,pl=8,pb=24,pt=10,max=Math.max.apply(0,vals),bw=(W-pl*2)/vals.length;
  var peak=function(i){var h=start+i;return (h>=12&&h<=14)||(h>=19&&h<=21)};
  var b=vals.map(function(v,i){var h=(H-pb-pt)*v/max,hr=start+i,lab=(hr%12||12)+(hr<12?'am':'pm');return '<rect x="'+(pl+i*bw+4)+'" y="'+(H-pb-h)+'" width="'+(bw-8)+'" height="'+h+'" rx="5" style="fill:var(--accent);opacity:'+(peak(i)?1:.32)+'"><title>'+lab+': '+num(v)+' orders (typical day)</title></rect>'+(i%2===0?'<text x="'+(pl+i*bw+bw/2)+'" y="'+(H-7)+'" text-anchor="middle">'+lab+'</text>':'')}).join('');
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Orders by hour, with lunch and dinner peaks">'+b+'</svg>';
}

/* ---------- views ---------- */
var RANGES=[['Last 7 days',.23],['Last 30 days',1],['Last 90 days',2.86]];
function vDash(){
  var r=RANGES[U.range],f=r[1],lb=r[0].replace('Last ','').replace(' days','d');
  var tidy=function(v){return Math.round(v/1000)*1000};
  var cities=[['Lagos',68400],['Abuja',26100],['Ibadan',14900],['Port Harcourt',11300],['Kano',7700]];
  var cmax=68400;
  var hv=[220,410,620,980,1640,1710,1180,790,720,940,1380,1890,2010,1420,760];
  var share=[['Restaurants',56],['Super Marts',26],['Pharmacies',9],['Packages',9]];
  var tot=128430*f;
  var feed=S.activity.slice(0,8).map(function(a){var k={kyc:'shield',warn:'alert',settings:'settings',money:'wallet',pin:'pin',dispute:'file',order:'list'}[a[1]]||'sparkles';return '<div class="it"><span class="ico '+(a[1]==='warn'?'w':a[1]==='money'?'g':'')+'">'+ic(k)+'</span><div><div>'+esc(a[0])+'</div><small>'+esc(a[2])+'</small></div></div>'}).join('');
  return head('Platform overview','Live health of the marketplace across all four verticals.',
    '<button type="button" class="btn" data-act="range" aria-label="Change time range, currently '+r[0]+'">'+ic('clock')+r[0]+'</button><a class="btn pri" href="#/merchants">'+ic('building')+'Manage merchants</a>')+
  '<div class="grid g4">'+
   kpi('Gross volume ('+lb+')',ngn(tidy(486240000*f)),'+14.2%','wallet')+kpi('Total orders ('+lb+')',num(128430*f),'+9.4%','list','n')+kpi('Commission earned',ngn(tidy(43760000*f)),'+12.7%','trend','g')+kpi('Active merchants',num(1842),'+6.1%','building','n')+'</div>'+
  '<div class="grid g6">'+
   mini('Active riders','3,106','1,184 fleet · 1,922 partner','bike')+mini('Average order value',ngn(12400),'Across all verticals','bag')+mini('Cancellation rate','2.1%','Down 0.3 pts','xc')+mini('Open disputes','37','Needs review','alert')+mini('Pending payouts',ngn(S.fin.pending),'Next batch: Week 38','wallet')+mini('New signups ('+lb+')',num(4318*f),'Customers + merchants','users')+'</div>'+
  '<div class="grid g2"><div class="card pad"><h3>GMV trend</h3><p class="sub">Monthly gross volume, March to September (₦ millions)</p>'+areaChart([218,254,291,327,372,431,486],['Mar','Apr','May','Jun','Jul','Aug','Sep'])+'</div>'+
   '<div class="card pad"><h3>Vertical distribution</h3><p class="sub">Share of orders ('+lb+')</p>'+donut(share,[cmp(tot).replace('₦',''),'orders'])+'</div></div>'+
  '<div class="grid g2"><div class="card pad"><h3>Hourly order velocity</h3><p class="sub">Typical day, 8am to 10pm. Lunch and dinner peaks are highlighted.</p>'+barChart(hv,8)+'</div>'+
   '<div class="card pad"><h3>City performance</h3><p class="sub">Orders by territory ('+lb+')</p><div class="hb" style="margin-top:1rem">'+cities.map(function(c){return '<div class="row"><span>'+c[0]+'</span><div class="trk"><i style="width:'+(c[1]/cmax*100)+'%"></i></div><b class="mono">'+(c[1]*f>=1000?(c[1]*f/1000).toFixed(1)+'k':num(c[1]*f))+'</b></div>'}).join('')+'</div></div></div>'+
  '<div class="card pad"><div class="acts" style="justify-content:space-between"><div><h3>Live activity</h3><p class="sub">Audit trail of operational changes</p></div></div><div class="feed" style="margin-top:.6rem">'+feed+'</div></div>';
}

function vOrders(){
  var q=(U.q.orders||'').trim().toLowerCase(),tv=T('ordV','all'),ts=T('ordS','all');
  var list=S.orders.filter(function(o){return(tv==='all'||o.vertical===tv)&&(ts==='all'||o.status===ts)&&(!q||(o.id+' '+o.customer+' '+o.merchant+' '+o.rider).toLowerCase().indexOf(q)>-1)});
  var pg=paged(list,'orders',12);
  var rows=pg.rows.map(function(o){return '<tr><td class="mono nw"><b>'+esc(o.id)+'</b></td><td class="nw muted">'+fdt(o.placed)+'</td><td>'+vbadge(o.vertical)+'</td><td>'+esc(o.merchant)+'</td><td>'+esc(o.customer)+'</td><td>'+esc(o.city)+'</td><td class="r mono">'+ngn(o.total)+'</td><td class="r mono">'+ngn(o.commission)+'</td><td>'+pill(o.status)+'</td><td>'+(o.rider?esc(o.rider):'<span class="muted">Unassigned</span>')+'</td><td class="r">'+btn(ic('edit')+'Manage','order',o.id)+'</td></tr>'}).join('');
  return head('Orders','Every order across restaurants, super marts, pharmacies and packages.',btn(ic('down')+'Export CSV','csvOrders',null,'')) +
  '<div class="card"><div class="bar">'+search('orders','Search ref, customer, merchant or rider')+'</div><div class="bar" style="gap:1rem">'+tabs('ordV',[['all','All'],['restaurant','Restaurants'],['grocery','Super Marts'],['pharmacy','Pharmacies'],['package','Packages']],1)+tabs('ordS',[['all','All'],['processing','Processing'],['completed','Completed'],['pending','Pending'],['cancelled','Cancelled']],1)+'</div>'+
  (list.length?'<div class="tw"><table class="t" style="min-width:68rem"><thead><tr><th>Reference</th><th>Placed</th><th>Vertical</th><th>Merchant</th><th>Customer</th><th>City</th><th class="r">Total</th><th class="r">Commission</th><th>Status</th><th>Rider</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+pager(pg,'orders'):empty('search','No orders match','Try a different search or clear the filters.',btn('Clear filters','clear','orders','pri')))+'</div>';
}
function openOrder(id){
  var o=find(S.orders,id);if(!o)return;
  var rs=S.riders.filter(function(r){return r.status==='active'&&r.city===o.city});
  if(o.rider&&!rs.some(function(r){return r.name===o.rider}))rs.unshift({name:o.rider});
  var done=o.status==='completed'||o.status==='cancelled';
  openM('<h3>Manage '+esc(o.id)+'</h3><p class="muted">'+esc(o.merchant)+' → '+esc(o.customer)+' · '+esc(o.city)+' · '+ngn(o.total)+'</p>'+
    sel('st','Status',[['pending','Pending'],['processing','Processing'],['completed','Completed'],['cancelled','Cancelled']],o.status)+
    sel('rd','Assigned rider ('+esc(o.city)+')',[['','Unassigned']].concat(rs.map(function(r){return[r.name,r.name]})),o.rider||'')+
    '<div class="ft"><button type="button" class="btn danger" data-m="cancelOrder" data-id="'+esc(o.id)+'"'+(done?' disabled title="Only open orders can be force-cancelled"':'')+'>Force cancel</button><button type="button" class="btn" data-m="x">Close</button><button type="submit" class="btn pri">Save changes</button></div>',
    function(v){
      if((v.st==='processing'||v.st==='completed')&&!v.rd)return 'Assign a rider before moving this order to '+v.st+'.';
      var prev=o.status,pr=o.rider;
      upd(function(){o.status=v.st;o.rider=v.st==='cancelled'?'':v.rd;log(o.id+': '+(prev!==v.st?'status '+prev+' → '+v.st:'rider '+(pr||'none')+' → '+(v.rd||'none')),'order')});
      toast(o.id+' updated'+(prev!==v.st?' · '+prev+' → '+v.st:' · rider '+(v.rd||'unassigned')));
    });
}

function vMerchants(){
  var q=(U.q.merch||'').trim().toLowerCase(),tv=T('merV','all');
  var list=S.merchants.filter(function(m){return(tv==='all'||m.vertical===tv)&&(!q||(m.name+' '+m.city).toLowerCase().indexOf(q)>-1)});
  var pend=S.merchants.filter(function(m){return m.status==='pending'}).length;
  var rows=list.map(function(m){
    var act=m.status==='pending'?btn(ic('check')+'Approve','approveM',m.id,'pri'):m.status==='active'?btn(ic('ban')+'Suspend','suspendM',m.id,'danger'):btn(ic('refresh')+'Reinstate','suspendM',m.id);
    return '<tr><td><div class="who">'+tile(m.name,m.vertical)+'<div><b>'+esc(m.name)+'</b><small>'+esc(m.city)+' · '+m.branches+' branch'+(m.branches>1?'es':'')+' · Joined '+fdate(m.joined)+'</small></div></div></td><td>'+vbadge(m.vertical)+'</td><td class="r mono">'+num(m.orders30)+'</td><td class="r mono">'+ngn(m.gmv30)+'</td><td class="r mono">'+m.rate+'%</td><td>'+pill(m.kyc,null,m.kyc==='verified'?'shield':'')+'</td><td>'+pill(m.status)+'</td><td class="r">'+act+'</td></tr>'}).join('');
  return head('Merchants','Approve onboarding, review KYC and control who can sell on ChowBuy.',pend?'<span class="badge-un">'+pend+' awaiting approval</span>':'')+
  '<div class="card"><div class="bar">'+search('merch','Search by business name or city')+tabs('merV',[['all','All'],['restaurant','Restaurant'],['grocery','Grocery'],['pharmacy','Pharmacy'],['package','Package']],1)+'</div>'+
  (list.length?'<div class="tw"><table class="t" style="min-width:60rem"><thead><tr><th>Merchant</th><th>Vertical</th><th class="r">Orders (30d)</th><th class="r">GMV (30d)</th><th class="r">Commission</th><th>KYC</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="foot"><span>'+list.length+' merchant'+(list.length>1?'s':'')+'</span></div>':empty('building','No merchants found','Adjust your filters to see more.',btn('Clear filters','clear','merch','pri')))+'</div>';
}

function vCategories(){
  var tv=T('catV','all'),list=S.categories.filter(function(c){return tv==='all'||c.vertical===tv});
  var rows=list.map(function(c){return '<tr><td><div class="who"><span class="tile" style="background:'+VC[c.vertical]+'">'+ic(c.icon||VI[c.vertical])+'</span><b>'+esc(c.name)+'</b></div></td><td>'+vbadge(c.vertical)+'</td><td class="r mono">'+(c.vertical==='package'?'—':num(c.items))+'</td><td class="r mono">'+num(c.merchants)+'</td><td class="r mono">'+c.share.toFixed(1)+'%</td><td><div class="acts">'+sw(c.visible,'catVis',c.id,'Visible to customers: '+c.name)+'<small class="muted">'+(c.visible?'Visible':'Hidden')+'</small></div></td></tr>'}).join('');
  return head('Categories','Control what customers can browse in each vertical.',btn(ic('plus')+'Add category','addCat',null,'pri'))+
  '<div class="card"><div class="bar">'+tabs('catV',[['all','All'],['restaurant','Restaurant'],['grocery','Grocery'],['pharmacy','Pharmacy'],['package','Package']],1)+'</div>'+
  (list.length?'<div class="tw"><table class="t"><thead><tr><th>Category</th><th>Vertical</th><th class="r">Items</th><th class="r">Merchants</th><th class="r">GMV share</th><th>Customer visibility</th></tr></thead><tbody>'+rows+'</tbody></table></div>':empty('tags','No categories here yet','Add the first category for this vertical.',btn('Add category','addCat',null,'pri')))+'</div>';
}
var CATICONS=['utensils','cart','pill','box','tags','sparkles','star','zap','bag','store'];
function openAddCat(){
  openM('<h3>Add category</h3>'+inp('name','Category name','','placeholder="e.g. Breakfast & Pastries" maxlength="40" required')+sel('vertical','Vertical',[['restaurant','Restaurant'],['grocery','Grocery'],['pharmacy','Pharmacy'],['package','Package']],T('catV','restaurant')==='all'?'restaurant':T('catV','restaurant'))+
   '<div class="f"><label>Icon</label><div class="chips">'+CATICONS.map(function(n,i){return '<label class="cp"><input type="radio" name="icon" value="'+n+'"'+(i===0?' checked':'')+' style="width:auto;margin:0">'+ic(n)+'</label>'}).join('')+'</div></div><div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Add category</button></div>',
   function(v){var n=v.name.trim();if(n.length<2)return 'Enter a category name (at least 2 characters).';
    if(S.categories.some(function(c){return c.vertical===v.vertical&&c.name.toLowerCase()===n.toLowerCase()}))return 'That category already exists in '+V[v.vertical]+'.';
    upd(function(){S.categories.push({id:'C'+Date.now(),name:n,vertical:v.vertical,items:0,merchants:0,share:0,visible:true,icon:v.icon});log('Category "'+n+'" added to '+V[v.vertical],'settings')});toast('Category "'+n+'" added to '+V[v.vertical])});
}

function vBrands(){
  var tv=T('brV','all'),list=S.brands.filter(function(b){return tv==='all'||b.vertical===tv});
  var rows=list.map(function(b){return '<tr><td><div class="who">'+tile(b.name,b.vertical)+'<b>'+esc(b.name)+'</b>'+(b.featured?'<span class="pill acc">'+ic('star')+'Featured</span>':'')+'</div></td><td>'+vbadge(b.vertical)+'</td><td class="r mono">'+num(b.products)+'</td><td class="r mono">'+num(b.merchants)+'</td><td><div class="acts">'+sw(b.featured,'brandFeat',b.id,'Featured brand: '+b.name)+'<small class="muted">'+(b.featured?'Featured':'Standard')+'</small></div></td></tr>'}).join('');
  return head('Brands','National FMCG, food and pharma brands customers recognise.',btn(ic('plus')+'Add brand','addBrand',null,'pri'))+
  '<div class="card"><div class="bar">'+tabs('brV',[['all','All'],['restaurant','Restaurant'],['grocery','Grocery'],['pharmacy','Pharmacy'],['package','Package']],1)+'</div>'+
  (list.length?'<div class="tw"><table class="t"><thead><tr><th>Brand</th><th>Vertical</th><th class="r">Products</th><th class="r">Merchants stocking</th><th>Featured</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="foot"><span>'+S.brands.filter(function(b){return b.featured}).length+' featured of '+S.brands.length+' brands</span></div>':empty('sparkles','No brands in this vertical','Add one to feature it on the marketplace.',btn('Add brand','addBrand',null,'pri')))+'</div>';
}
function openAddBrand(){
  openM('<h3>Add brand</h3>'+inp('name','Brand name','','placeholder="e.g. Hollandia" maxlength="40" required')+sel('vertical','Vertical',[['grocery','Grocery'],['restaurant','Restaurant'],['pharmacy','Pharmacy'],['package','Package']],'grocery')+
   '<div class="frow">'+inp('products','Products (SKUs)','0','inputmode="numeric"')+inp('merchants','Merchants stocking','0','inputmode="numeric"')+'</div><div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Add brand</button></div>',
   function(v){var n=v.name.trim();if(n.length<2)return 'Enter a brand name.';if(S.brands.some(function(b){return b.name.toLowerCase()===n.toLowerCase()}))return 'That brand is already in the catalog.';
    var p=parseInt(v.products,10)||0,m=parseInt(v.merchants,10)||0;
    upd(function(){S.brands.push({id:'B'+Date.now(),name:n,vertical:v.vertical,products:p,merchants:m,featured:false});log('Brand "'+n+'" added','settings')});toast('Brand "'+n+'" added')});
}

function vRiders(){
  var tv=T('rdT','all'),ts=T('rdS','all'),q=(U.q.riders||'').trim().toLowerCase();
  var list=S.riders.filter(function(r){return(tv==='all'||r.type===tv)&&(ts==='all'||r.status===ts)&&(!q||(r.name+' '+r.city).toLowerCase().indexOf(q)>-1)});
  var rows=list.map(function(r){
    var act=r.status==='onboarding'?btn(ic('check')+'Approve','approveR',r.id,'pri'):r.status==='active'?btn(ic('ban')+'Suspend','suspendR',r.id,'danger'):btn(ic('refresh')+'Reinstate','suspendR',r.id);
    var low=r.status==='active'&&r.accept<75;
    return '<tr><td><div class="who"><span class="tile" style="background:'+(r.type==='FLEET'?'#0F172A':'#FF8A00')+'">'+initials(r.name)+'</span><div><b>'+esc(r.name)+'</b><small>'+esc(r.id)+'</small></div></div></td><td>'+pill(r.type,r.type==='FLEET'?'info':'acc')+'</td><td>'+esc(r.city)+'</td><td class="r mono">'+num(r.trips30)+'</td><td class="r mono">'+(r.rating?r.rating.toFixed(1)+' ★':'—')+'</td><td class="r mono">'+(r.status==='onboarding'?'—':r.accept+'%')+(low?' <span class="pill bad" title="Below the 75% acceptance threshold">Low</span>':'')+'</td><td class="nw">'+(r.type==='FLEET'?'<b class="mono">'+ngn(riderSalary(r))+'</b><small class="muted" style="display:block">salary / month</small>':'<b>Per ride</b><small class="muted" style="display:block">'+((S.rpay.tiers&&S.rpay.tiers[r.id])||'Standard')+' tier</small>')+'</td><td>'+pill(r.status)+'</td><td class="r"><div class="rowact">'+btn(ic('wallet')+'Pay','rpRider',r.id)+act+'</div></td></tr>'}).join('');
  var cnt=function(t){return S.riders.filter(function(r){return r.type===t}).length};
  return head('Riders & fleet','Fleet riders are company-managed. Partners are independent contractors.',
    '<span class="pill info">'+cnt('FLEET')+' fleet</span><span class="pill acc">'+cnt('PARTNER')+' partner</span>')+
  vRadar()+riderPayPanel()+'<div class="card"><div class="bar">'+search('riders','Search by name or city')+tabs('rdT',[['all','All types'],['FLEET','Fleet'],['PARTNER','Partner']],1)+tabs('rdS',[['all','Any status'],['active','Active'],['onboarding','Onboarding'],['suspended','Suspended']],1)+'</div>'+
  (list.length?'<div class="tw"><table class="t" style="min-width:62rem"><thead><tr><th>Rider</th><th>Type</th><th>City</th><th class="r">Trips (30d)</th><th class="r">Rating</th><th class="r">Acceptance</th><th>Pay</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="foot"><span>Fleet riders are salaried and never see per-ride fares. Partner riders earn per ride.</span></div>':empty('bike','No riders match','Try clearing the filters.',btn('Clear filters','clear','riders','pri')))+'</div>';
}

function hoodCounts(){var a=0;S.locs.hoods.forEach(function(h){if(h.status==='active')a++});return a}
function vLocations(){
  var L=S.locs,act=hoodCounts(),live=L.countries.filter(function(c){return c.status==='live'}).length;
  var cityRows=L.cities.map(function(c){var m=S.merchants.filter(function(x){return x.city===c.name}).length,h=L.hoods.filter(function(x){return x.city===c.name&&x.status==='active'}).length;
    return '<tr><td><b>'+esc(c.name)+'</b></td><td>'+esc(c.state)+'</td><td class="r mono">'+m+'</td><td class="r mono">'+h+'</td><td>'+pill(c.status)+'</td></tr>'}).join('');
  var hq=T('hoodC','all');
  var hoods=L.hoods.filter(function(h){return hq==='all'||h.city===hq});
  var hr=hoods.map(function(h){var c=L.cities.filter(function(x){return x.name===h.city})[0]||{};return '<tr><td><b>'+esc(h.name)+'</b></td><td>'+esc(h.city)+'</td><td>'+esc(c.state||'—')+'</td><td>'+pill(h.status)+'</td><td class="r">'+btn(ic('refresh')+'Cycle status','cycleH',h.id)+'</td></tr>'}).join('');
  return head('Locations & service areas','Country → State → City → Neighbourhood. Control exactly where ChowBuy delivers.')+
  '<div class="grid g4">'+mini('Active markets',live+' live · '+(L.countries.length-live)+' pipeline','Countries','globe')+mini('Cities live',L.cities.filter(function(c){return c.status==='live'}).length,'Across '+new Set(L.cities.map(function(c){return c.state})).size+' states','pin')+mini('Active neighbourhoods',act,'of '+L.hoods.length+' mapped','store')+mini('Delivery zones',act*2,'About 2 per active area','bike')+'</div>'+
  '<div class="grid g2"><div class="card pad"><h3>Country markets</h3><p class="sub">Tap a country to move it between live and pipeline.</p><div class="chips" style="margin-top:1rem">'+L.countries.map(function(c){return '<button type="button" class="cp '+(c.status==='live'?'on':'pipe')+'" data-act="country" data-id="'+esc(c.name)+'">'+ic(c.status==='live'?'checkc':'clock')+esc(c.name)+' · '+c.status+'</button>'}).join('')+'</div>'+
    '<div style="margin-top:1.4rem"><h3 style="font-size:.95rem">Add neighbourhood</h3><form data-form="addHood" class="frow" style="margin-top:.7rem;align-items:end"><div class="f"><label for="hn">Name</label><input id="hn" name="name" placeholder="e.g. Lekki Phase 2" maxlength="40" required></div>'+sel('hc','City',L.cities.map(function(c){return[c.name,c.name]}),L.cities[0].name).replace('name="hc"','name="city"')+'<button class="btn pri" type="submit">'+ic('plus')+'Add</button></form></div></div>'+
   '<div class="card"><div class="pad" style="padding-bottom:.4rem"><h3>Cities</h3><p class="sub">Merchant density per city</p></div><div class="tw"><table class="t" style="min-width:30rem"><thead><tr><th>City</th><th>State</th><th class="r">Merchants</th><th class="r">Active areas</th><th>Status</th></tr></thead><tbody>'+cityRows+'</tbody></table></div></div></div>'+
  '<div class="card"><div class="bar"><div><h3>Neighbourhoods</h3><p class="sub">Cycle: active → disabled → coming soon</p></div><div style="margin-left:auto">'+tabs('hoodC',[['all','All']].concat(L.cities.map(function(c){return[c.name,c.name]})),1)+'</div></div>'+
  (hoods.length?'<div class="tw"><table class="t" style="min-width:36rem"><thead><tr><th>Neighbourhood</th><th>City</th><th>State</th><th>Status</th><th></th></tr></thead><tbody>'+hr+'</tbody></table></div>':empty('pin','No neighbourhoods here','Add the first service area using the form above.'))+'</div>';
}

var FIN=[['Gross marketplace volume',486240000,'wallet'],['Platform commission earned',43760000,'trend'],['Delivery fees collected',28140000,'bike'],['Rider payouts',61320000,'users'],['Merchant payouts',352400000,'building'],['Customer refunds',4180000,'refresh'],['Pending bank settlements',null,'clock'],['Withholding tax (WHT)',3240000,'file']];
function vFinance(){
  var ts=T('finS','all'),list=S.settlements.filter(function(s){return ts==='all'||s.status===ts});
  var pend=S.settlements.filter(function(s){return s.status==='pending'});
  var rows=list.map(function(s){return '<tr><td><div class="who"><span class="tile" style="background:'+(s.type==='Merchant'?'#12A150':s.type==='Fleet'?'#0F172A':'#FF8A00')+'">'+initials(s.payee)+'</span><div><b>'+esc(s.payee)+'</b><small>'+esc(s.bank)+'</small></div></div></td><td>'+pill(s.type,s.type==='Merchant'?'ok':s.type==='Fleet'?'info':'acc')+'</td><td class="r mono">'+ngn(s.amount)+'</td><td>'+esc(s.cycle)+'</td><td>'+pill(s.status)+'</td><td class="r">'+(s.status==='failed'?btn(ic('refresh')+'Retry payout','retry',s.id,'pri'):'')+'</td></tr>'}).join('');
  return head('Finance & settlements','Platform money flow for the last 30 days, and the payout queue.',
    btn(ic('zap')+'Run settlement batch','batch',null,'pri',pend.length?'':' disabled'))+
  '<div class="grid g4">'+FIN.map(function(f){return kpi(f[0],ngn(f[1]==null?S.fin.pending:f[1]),'',f[2],f[0].indexOf('Pending')===0?'':f[0].indexOf('refunds')>-1?'n':'g')}).join('')+'</div>'+
  '<div class="card"><div class="bar"><div><h3>Settlements ledger</h3><p class="sub">'+pend.length+' payee'+(pend.length===1?'':'s')+' pending · '+ngn(pend.reduce(function(s,x){return s+x.amount},0))+'</p></div><div style="margin-left:auto">'+tabs('finS',[['all','All'],['pending','Pending'],['processing','Processing'],['completed','Completed'],['failed','Failed']],1)+'</div></div>'+
  (list.length?'<div class="tw"><table class="t" style="min-width:52rem"><thead><tr><th>Payee & bank</th><th>Type</th><th class="r">Net amount</th><th>Cycle</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>':empty('wallet','Nothing in this state','No settlements match this filter.',btn('Show all','tab','', 'pri',' data-k="finS" data-v="all"')))+'</div>';
}

function vWallet(){
  var q=(U.q.wt||'').trim().toLowerCase(),ts=T('wtS','ALL');
  var done=S.transfers.filter(function(t){return t.status==='COMPLETED'});
  var list=S.transfers.filter(function(t){return(ts==='ALL'||t.status===ts)&&(!q||(t.id+' '+t.from+' '+t.to).toLowerCase().indexOf(q)>-1)});
  var pg=paged(list,'wt',12),icn={COMPLETED:'checkc',PENDING:'clock',FAILED:'xc',REVERSED:'refresh'};
  var rows=pg.rows.map(function(t){return '<tr><td><b class="mono">'+esc(t.id)+'</b><br><small class="muted">'+fdt(t.ts)+'</small></td><td>'+esc(t.from)+'</td><td>'+esc(t.to)+'</td><td class="r mono">'+ngn(t.amount)+'</td><td class="r mono">'+ngn(t.fee)+'</td><td><span class="pill">Wallet transfer</span></td><td>'+pill(t.status,null,icn[t.status])+'</td></tr>'}).join('');
  return head('Wallet transfers','Read-only compliance trail of P2P wallet-to-wallet transfers.',btn(ic('down')+'Export CSV','csvWt',null,''))+
  '<div class="grid g3">'+kpi('Completed volume',ngn(done.reduce(function(s,t){return s+t.amount},0)),'','wallet','g')+kpi('Platform transfer fees',ngn(done.reduce(function(s,t){return s+t.fee},0)),'','trend')+kpi('Ledger entries',num(S.transfers.length),'','list','n')+'</div>'+
  '<div class="card"><div class="bar">'+search('wt','Search WT- reference, sender or recipient')+tabs('wtS',[['ALL','All'],['COMPLETED','Completed'],['PENDING','Pending'],['FAILED','Failed'],['REVERSED','Reversed']],1)+'</div>'+
  (list.length?'<div class="tw"><table class="t" style="min-width:58rem"><thead><tr><th>Reference</th><th>Sender</th><th>Recipient</th><th class="r">Amount</th><th class="r">Fee</th><th>Type</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+pager(pg,'wt'):empty('swap','No transfers found','Nothing matches your search or status filter.',btn('Clear filters','clear','wt','pri')))+'</div>';
}

function gSum(g){return g.parts.reduce(function(s,p){return s+p.amt},0)}
function gCollected(g){if(g.status==='CANCELLED')return 0;if(g.hostPays)return(g.status==='PLACED'||g.status==='DELIVERED')?g.total:0;return g.parts.reduce(function(s,p){return s+(p.paid?p.amt:0)},0)}
function vGroups(){
  var G=S.groups,bad=G.filter(function(g){return gSum(g)!==g.total}).length;
  var rows=G.map(function(g){var d=gSum(g)-g.total,paid=g.parts.filter(function(p){return p.paid}).length;
    return '<tr><td><b>'+esc(g.title)+'</b><br><small class="mono muted">'+esc(g.code)+'</small></td><td>'+esc(g.merchant)+'<br><small class="muted">'+esc(g.hood)+'</small></td><td>'+pill(g.status)+'</td><td class="r mono">'+g.parts.length+'</td><td class="r mono">'+ngn(g.total)+'</td><td>'+(g.hostPays?'Host pays':paid+'/'+g.parts.length+' paid')+'</td><td>'+(d===0?'<span class="pill ok">'+ic('check')+'Reconciles</span>':'<span class="pill bad">'+ic('alert')+'Off by '+ngn(Math.abs(d))+'</span>')+'</td><td class="r">'+btn('View','viewG',g.id)+'</td></tr>'}).join('');
  return head('Group orders','Collaborative carts, host orders and split payments.',btn(ic('refresh')+'Reset demo group orders','resetG',null,'danger'))+
  '<div class="grid g4">'+kpi('Total groups',G.length,'','users','n')+kpi('Open active groups',G.filter(function(g){return g.status==='OPEN'||g.status==='LOCKED'}).length,'','clock')+kpi('Placed orders',G.filter(function(g){return g.status==='PLACED'||g.status==='DELIVERED'}).length,'','bag','g')+kpi('Demo funds collected',ngn(G.reduce(function(s,g){return s+gCollected(g)},0)),'','wallet','g')+'</div>'+
  '<div class="card"><div class="bar"><div><h3>Reconciliation audit</h3><p class="sub">Participant allocations must sum to the order total.'+(bad?' <b style="color:var(--red)">'+bad+' group'+(bad>1?'s':'')+' off.</b>':'')+'</p></div></div>'+
  (G.length?'<div class="tw"><table class="t" style="min-width:64rem"><thead><tr><th>Group & invite code</th><th>Merchant & area</th><th>Status</th><th class="r">People</th><th class="r">Order total</th><th>Payment</th><th>Reconciliation</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>':empty('users','No group orders','Restore the demo data to see collaborative carts again.',btn('Reset demo group orders','resetG',null,'pri')))+'</div>';
}

var FLAGS=[['free_delivery','Free delivery threshold','Suggest items that unlock free delivery.'],['cheaper','Cheaper alternative','Exact-match swap at a lower price.'],['value','Better value alternative','Larger pack with lower price per kg or litre.'],['essentials','Essentials prediction','Frequently bought together essentials.'],['repeat','Repeat purchase','Based on the customer’s 30-day history.'],['consolidate','Merchant consolidation','Combine multi-store items to save delivery fees.'],['promo','Promotion opportunity','Active merchant discount bundles.'],['delivery_saving','Delivery saving','Cluster orders to nearby active riders.'],['loyalty','Loyalty benefit','Show points and perks at checkout.']];
function sdiff(){
  var P=S.smart.published,D=S.smart.draft;if(!D)return[];var out=[];
  FLAGS.forEach(function(f){if(!!P.flags[f[0]]!==!!D.flags[f[0]])out.push(f[1]+': '+(P.flags[f[0]]?'on':'off')+' → '+(D.flags[f[0]]?'on':'off'))});
  if(String(P.threshold)!==String(D.threshold))out.push('Free delivery threshold: '+ngn(P.threshold)+' → '+ngn(Number(D.threshold)||0));
  if(String(P.maxBundle)!==String(D.maxBundle))out.push('Max bundle discount: '+P.maxBundle+'% → '+(D.maxBundle||0)+'%');
  return out;
}
function vSmart(){
  var P=S.smart.published,D=S.smart.draft||P,diff=sdiff(),dirty=diff.length>0;
  var rate=P.accepted/(P.accepted+P.dismissed)*100;
  return head('Smart Cart intelligence','Tune the basket optimisation engine customers see at checkout.',
    (dirty?'<span class="badge-un">Unsaved changes ('+diff.length+')</span>':'<span class="pill ok">'+ic('check')+'Published</span>')+btn('Reset defaults','smartReset',null,'')+btn(ic('check')+'Publish changes','smartPub',null,'pri',dirty?'':' disabled'))+
  '<div class="grid g5">'+mini('Smart Cart opened',num(P.opened),'Sessions','bag')+mini('Optimised clicks',num(P.optimized),'Tapped “Optimise”','zap')+mini('Accepted',num(P.accepted),'Recommendations','checkc')+mini('Dismissed',num(P.dismissed),'Suggestions','xc')+mini('Acceptance rate',rate.toFixed(1)+'%','Accepted ÷ (accepted + dismissed)','trend')+'</div>'+
  '<div class="grid g2"><div class="card pad"><h3>Recommendation types</h3><p class="sub">Switch individual suggestions on or off.</p><div style="margin-top:.6rem">'+FLAGS.map(function(f){return '<div class="trow"><div><b>'+f[1]+'</b><small>'+f[2]+'</small></div>'+sw(D.flags[f[0]],'flag',f[0],f[1])+'</div>'}).join('')+'</div></div>'+
  '<div style="display:grid;gap:1rem;align-content:start"><div class="card pad"><h3>Parameters</h3><div class="frow" style="margin-top:1rem"><div class="f"><label for="sc-th">Free delivery basket threshold (₦)</label><input id="sc-th" data-fid="sc-th" data-in="smart:threshold" inputmode="numeric" value="'+esc(D.threshold)+'"></div><div class="f"><label for="sc-mb">Maximum bundle discount (%)</label><input id="sc-mb" data-fid="sc-mb" data-in="smart:maxBundle" inputmode="numeric" value="'+esc(D.maxBundle)+'"></div></div></div>'+
  '<div class="card pad"><h3>Draft vs published</h3>'+(dirty?'<ul style="margin:.8rem 0 0;padding-left:1.1rem;display:grid;gap:.4rem">'+diff.map(function(d){return '<li>'+esc(d)+'</li>'}).join('')+'</ul>':'<p class="sub" style="margin-top:.5rem">No pending changes. What you see here is live for customers.</p>')+'</div></div></div>';
}

/* brand settings */
var SLOTS=[['primary','Primary logo','Header and general use','512×512 px'],['light','Light logo','For dark backgrounds','512×512 px'],['dark','Dark logo','For light backgrounds','512×512 px'],['favicon','Favicon','Browser tab icon','64×64 px'],['app','App icon','Home screen icon','1024×1024 px']];
var BRELS=[['INDEPENDENT','Independent','Fully separate visual identity.'],['ENDORSED','Endorsed','Shows a “by ChowBuy” badge.'],['COBRANDED','Co-branded','Unified dual lockup with ChowBuy.']];
var BNAMES={MAIN:'ChowBuy Consumer App',MERCHANT:'Merchant & Business Platform',RIDER:'Rider & Fleet Logistics'};
function bdraft(){if(!S.brands2.draft)S.brands2.draft=clone(S.brands2.published);return S.brands2.draft}
function bdirty(){return !!S.brands2.draft&&JSON.stringify(S.brands2.draft)!==JSON.stringify(S.brands2.published)}
function vBrandSet(){
  var D=S.brands2.draft||S.brands2.published,k=U.brand,b=D[k],dirty=bdirty(),main=D.MAIN;
  var logo=b.assets.primary?'<img src="'+b.assets.primary.url+'" alt="">':'<span class="lg" style="background:'+esc(b.color)+'">'+esc(initials(b.name))+'</span>';
  var badge=b.rel==='ENDORSED'?'<span class="pill">by '+esc(main.name)+'</span>':b.rel==='COBRANDED'?'<span class="pill acc">'+esc(main.name)+' × '+esc(b.name)+'</span>':'';
  var slots=SLOTS.map(function(s){var a=b.assets[s[0]];return '<div class="slot"><div class="thumb">'+(a?'<img src="'+a.url+'" alt="'+esc(s[1])+' preview">':ic('image'))+'</div><div style="min-width:0"><b>'+s[1]+'</b><div class="muted" style="font-size:.8rem">'+(a?esc(a.name)+' · '+(a.w?a.w+'×'+a.h+' px':'vector')+' · '+Math.max(1,Math.round(a.size/1024))+' KB':s[2]+' · '+s[3])+'</div><div class="acts" style="margin-top:.5rem"><button type="button" class="btn sm" data-act="pickFile" data-id="'+s[0]+'">'+ic('upload')+(a?'Replace':'Upload')+'</button>'+(a?btn(ic('trash')+'Remove','rmAsset',s[0],'danger'):'')+'<input type="file" hidden id="file-'+s[0]+'" data-file="'+s[0]+'" accept=".svg,.png,.webp,.jpg,.jpeg,image/svg+xml,image/png,image/webp,image/jpeg"></div></div></div>'}).join('');
  var navLinks=U.dev==='desktop'?'<span class="muted" style="margin-left:auto;display:flex;gap:1rem;font-size:.8rem"><span>Home</span><span>Offers</span><span>Help</span></span>':'<span style="margin-left:auto">'+ic('menu')+'</span>';
  return head('Brand settings','Identity for the consumer, merchant and rider apps.',
    (dirty?'<span class="badge-un">Unsaved changes</span>':'<span class="pill ok">'+ic('check')+'Published</span>')+btn('Reset to published','brandReset',null,'',dirty?'':' disabled')+btn(ic('check')+'Publish changes','brandPub',null,'pri',dirty?'':' disabled'))+
  '<div class="tabs" role="tablist">'+['MAIN','MERCHANT','RIDER'].map(function(x){return '<button type="button" role="tab" data-act="brandTab" data-id="'+x+'" aria-pressed="'+(k===x)+'">'+x+' · '+BNAMES[x]+'</button>'}).join('')+'</div>'+
  '<div class="grid g2" style="align-items:start"><div style="display:grid;gap:1rem"><div class="card pad"><h3>Relationship to ChowBuy</h3><div class="chips" style="margin-top:.8rem">'+BRELS.map(function(r){return '<button type="button" class="cp '+(b.rel===r[0]?'on':'')+'" data-act="rel" data-id="'+r[0]+'" aria-pressed="'+(b.rel===r[0])+'" title="'+r[2]+'">'+r[1]+'</button>'}).join('')+'</div><p class="sub" style="margin-top:.6rem">'+BRELS.filter(function(r){return r[0]===b.rel})[0][2]+'</p></div>'+
  '<div class="card pad"><h3>Profile</h3><div style="display:grid;gap:.9rem;margin-top:1rem"><div class="f"><label for="bn">Brand name</label><input id="bn" data-fid="bn" data-in="brand:name" value="'+esc(b.name)+'" maxlength="40"></div><div class="f"><label for="bt">Tagline</label><input id="bt" data-fid="bt" data-in="brand:tagline" value="'+esc(b.tagline)+'" maxlength="80"></div><div class="frow"><div class="f"><label for="bc">Primary colour</label><input id="bc" type="color" data-ch="brand:color" value="'+esc(b.color)+'" style="height:2.8rem;padding:.2rem"></div><div class="f"><label for="bh">Hex code</label><input id="bh" data-ch="brand:color" value="'+esc(b.color)+'" maxlength="7" spellcheck="false"></div></div></div></div>'+
  '<div class="card pad"><h3>Brand assets</h3><p class="sub">SVG, PNG, WebP or JPG. Maximum 2 MB each.</p><div style="display:grid;gap:.7rem;margin-top:1rem">'+slots+'</div></div></div>'+
  '<div class="card pad" style="position:sticky;top:5rem"><div class="acts" style="justify-content:space-between"><h3>Live preview</h3><div class="tabs sm"><button type="button" data-act="dev" data-id="desktop" aria-pressed="'+(U.dev==='desktop')+'">Desktop</button><button type="button" data-act="dev" data-id="mobile" aria-pressed="'+(U.dev==='mobile')+'">Mobile</button></div></div>'+
  '<div class="dev '+U.dev+'" style="margin-top:1rem"><div class="pnav">'+logo+'<b style="font-family:var(--display)">'+esc(b.name)+'</b>'+badge+navLinks+'</div><div class="phero" style="background:linear-gradient(135deg,'+esc(b.color)+','+esc(b.color)+'cc)"><h4>'+esc(b.name)+'</h4><p>'+esc(b.tagline)+'</p><span class="b" style="color:'+esc(b.color)+'">Get started</span></div><div class="pad muted" style="font-size:.8rem">Preview of the '+k.toLowerCase()+' app header. Changes apply after you publish.</div></div></div></div>';
}

function sGet(){return U.sdraft||S.settings}
function sEdit(){if(!U.sdraft)U.sdraft=clone(S.settings);return U.sdraft}
function sChanges(){
  if(!U.sdraft)return[];var P=S.settings,D=U.sdraft,c=[];
  Object.keys(P.rates).forEach(function(k){if(String(P.rates[k])!==String(D.rates[k]))c.push(['rate',k])});
  Object.keys(P.fare).forEach(function(k){if(String(P.fare[k])!==String(D.fare[k]))c.push(['fare',k])});
  Object.keys(P.gateways).forEach(function(k){if(P.gateways[k]!==D.gateways[k])c.push(['gw',k])});
  if(P.cities.join('|')!==D.cities.join('|'))c.push(['cities','']);
  return c;
}
var GW=[['paystack','Paystack','Cards, bank and USSD'],['flutterwave','Flutterwave','Cards, bank and mobile money'],['transfer','Direct bank transfer','Pay by transfer to a virtual account'],['cod','Cash on delivery','Collected by the rider']];
function vSettings(){var t=T('setTab','pricing');return t==='email'?vEmail():t==='signin'?vSignin():t==='payments'?vPayments():t==='maps'?vMaps():t==='realtime'?vRealtime():vPricing()}
function vPricing(){
  var D=sGet(),ch=sChanges();
  var fare=[['base','Base delivery fare','₦'],['perKm','Distance charge per km','₦'],['service','Platform service fee','₦'],['minBasket','Minimum basket order value','₦']];
  return head('Settings & pricing','Commission, delivery pricing, coverage and payment rails.',
    (ch.length?'<span class="badge-un">'+ch.length+' unsaved</span>'+btn('Discard','sDiscard',null,''):'')+btn(ic('check')+'Save settings','sSave',null,'pri'))+
  setTabs()+'<div class="grid g2"><div class="card pad"><h3>Commission by vertical</h3><p class="sub">Percentage ChowBuy keeps from each order.</p><div class="frow" style="margin-top:1rem">'+Object.keys(V).map(function(k){return '<div class="f"><label for="r-'+k+'">'+V[k]+' (%)</label><input id="r-'+k+'" data-fid="r-'+k+'" data-in="rate:'+k+'" inputmode="decimal" value="'+esc(D.rates[k])+'"></div>'}).join('')+'</div></div>'+
  '<div class="card pad"><h3>Delivery pricing engine</h3><p class="sub">Used to price every delivery.</p><div class="frow" style="margin-top:1rem">'+fare.map(function(f){return '<div class="f"><label for="f-'+f[0]+'">'+f[1]+' ('+f[2]+')</label><input id="f-'+f[0]+'" data-fid="f-'+f[0]+'" data-in="fare:'+f[0]+'" inputmode="numeric" value="'+esc(D.fare[f[0]])+'"></div>'}).join('')+'</div></div></div>'+
  '<div class="grid g2"><div class="card pad"><div class="acts" style="justify-content:space-between"><div><h3>Operating cities</h3><p class="sub">Where customers can order today.</p></div>'+btn(ic('plus')+'Add city','addCity',null,'')+'</div><div class="chips" style="margin-top:1rem">'+D.cities.map(function(c){return '<span class="cp on">'+ic('pin')+esc(c)+'<button type="button" data-act="rmCity" data-id="'+esc(c)+'" aria-label="Remove '+esc(c)+'">'+ic('x')+'</button></span>'}).join('')+'</div></div>'+
  '<div class="card pad"><h3>Payment rails</h3><p class="sub">Korapay, Pocketfi, cash on delivery and the ChowBuy wallet are managed in the Payment gateways tab.</p><div style="margin-top:1rem"><button type="button" class="btn" data-act="tab" data-k="setTab" data-v="payments">Open payment gateways</button></div></div></div>';
}
function openAddCity(){
  openM('<h3>Add operating city</h3>'+inp('name','City','','placeholder="e.g. Enugu" maxlength="40" required')+inp('state','State / region','','placeholder="e.g. Enugu" maxlength="40" required')+'<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Add city</button></div>',
   function(v){var n=v.name.trim(),s=v.state.trim();if(n.length<2||s.length<2)return 'Enter both a city and a state.';var D=sEdit();
    if(D.cities.some(function(c){return c.toLowerCase()===n.toLowerCase()}))return n+' is already an operating city.';
    D.cities.push(n);U.cityStates[n]=s;refresh();toast(n+' added. Press Save settings to apply.')});
}

/* ---------- transactional mail template center ---------- */
var MAIL_DEFAULTS=[{"id":"welcome","name":"Welcome / email confirmation","subject":"Welcome to ChowBuy — confirm your email","category":"Account activation","text":"Hey {{recipient_name}}, welcome to ChowBuy. Confirm your email address to activate your account.","html":"<h1>Welcome / email confirmation</h1><p>Hey {{recipient_name}}, welcome to ChowBuy. Confirm your email address to activate your account.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"password_reset","name":"Password reset","subject":"Reset your ChowBuy password","category":"Account security","text":"We received a request to reset your ChowBuy password. Use the secure reset link to choose a new password. If you did not request this, you can ignore this email.","html":"<h1>Password reset</h1><p>We received a request to reset your ChowBuy password. Use the secure reset link to choose a new password. If you did not request this, you can ignore this email.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"password_changed","name":"Password changed","subject":"Your ChowBuy password was changed","category":"Account security","text":"Your ChowBuy password was changed successfully. If you did not make this change, contact ChowBuy Support immediately.","html":"<h1>Password changed</h1><p>Your ChowBuy password was changed successfully. If you did not make this change, contact ChowBuy Support immediately.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"kyc_submitted","name":"KYC submitted","subject":"We received your verification documents","category":"Verification","text":"Hi {{recipient_name}}, we received your {{account_type}} verification submission. Our team will review it and notify you when there is an update.","html":"<h1>KYC submitted</h1><p>Hi {{recipient_name}}, we received your {{account_type}} verification submission. Our team will review it and notify you when there is an update.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"kyc_approved","name":"KYC approved","subject":"Your ChowBuy verification is approved","category":"Verification","text":"Good news, {{recipient_name}}. Your {{account_type}} verification has been approved. You can continue using the features available to your account.","html":"<h1>KYC approved</h1><p>Good news, {{recipient_name}}. Your {{account_type}} verification has been approved. You can continue using the features available to your account.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"kyc_declined","name":"KYC declined","subject":"Action required: your ChowBuy verification","category":"Verification","text":"Hi {{recipient_name}}, we could not approve your {{account_type}} verification. Reason: {{decline_reason}}. Please review the reason and resubmit the required information.","html":"<h1>KYC declined</h1><p>Hi {{recipient_name}}, we could not approve your {{account_type}} verification. Reason: {{decline_reason}}. Please review the reason and resubmit the required information.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"kyc_resubmit","name":"KYC resubmission required","subject":"Please update your ChowBuy verification","category":"Verification","text":"Hi {{recipient_name}}, we need clearer or additional information for your verification. Required action: {{next_step}}.","html":"<h1>KYC resubmission required</h1><p>Hi {{recipient_name}}, we need clearer or additional information for your verification. Required action: {{next_step}}.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"fund_received","name":"Funds received","subject":"You received funds from {{sender_name}}","category":"Wallet & transfers","text":"Hi {{recipient_name}}, {{currency}} {{amount}} has been received successfully from {{sender_name}}. Reference: {{transaction_reference}}. Available balance: {{available_balance}}.","html":"<h1>Funds received</h1><p>Hi {{recipient_name}}, {{currency}} {{amount}} has been received successfully from {{sender_name}}. Reference: {{transaction_reference}}. Available balance: {{available_balance}}.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"fund_sent","name":"Funds transferred","subject":"Your transfer to {{recipient_name}} was successful","category":"Wallet & transfers","text":"Hi {{sender_name}}, your transfer of {{currency}} {{amount}} to {{recipient_name}} was completed successfully. Reference: {{transaction_reference}}. Available balance: {{available_balance}}.","html":"<h1>Funds transferred</h1><p>Hi {{sender_name}}, your transfer of {{currency}} {{amount}} to {{recipient_name}} was completed successfully. Reference: {{transaction_reference}}. Available balance: {{available_balance}}.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"wallet_funded","name":"Wallet funded","subject":"Your ChowBuy wallet has been funded","category":"Wallet & transfers","text":"Hi {{recipient_name}}, {{currency}} {{amount}} was added to your ChowBuy wallet. Reference: {{transaction_reference}}. Available balance: {{available_balance}}.","html":"<h1>Wallet funded</h1><p>Hi {{recipient_name}}, {{currency}} {{amount}} was added to your ChowBuy wallet. Reference: {{transaction_reference}}. Available balance: {{available_balance}}.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"transaction_failed","name":"Transaction failed","subject":"Update on your ChowBuy transaction","category":"Wallet & transfers","text":"Your transaction {{transaction_reference}} could not be completed. Status: {{transaction_status}}. If funds were debited, check your transaction history for the reversal status or contact support.","html":"<h1>Transaction failed</h1><p>Your transaction {{transaction_reference}} could not be completed. Status: {{transaction_status}}. If funds were debited, check your transaction history for the reversal status or contact support.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"refund","name":"Refund update","subject":"An update on your ChowBuy refund","category":"Payments & refunds","text":"Hi {{recipient_name}}, your refund for order {{order_reference}} is now {{refund_status}}. Amount: {{currency}} {{amount}}. Reference: {{transaction_reference}}.","html":"<h1>Refund update</h1><p>Hi {{recipient_name}}, your refund for order {{order_reference}} is now {{refund_status}}. Amount: {{currency}} {{amount}}. Reference: {{transaction_reference}}.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"order_confirmed","name":"Order confirmed","subject":"Your ChowBuy order is confirmed","category":"Orders & delivery","text":"Hi {{recipient_name}}, your order {{order_reference}} from {{merchant_name}} has been confirmed. Order total: {{currency}} {{amount}}.","html":"<h1>Order confirmed</h1><p>Hi {{recipient_name}}, your order {{order_reference}} from {{merchant_name}} has been confirmed. Order total: {{currency}} {{amount}}.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"order_update","name":"Order status update","subject":"An update on your ChowBuy order","category":"Orders & delivery","text":"Hi {{recipient_name}}, order {{order_reference}} is now {{order_status}}. Track your order in the ChowBuy app.","html":"<h1>Order status update</h1><p>Hi {{recipient_name}}, order {{order_reference}} is now {{order_status}}. Track your order in the ChowBuy app.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"rider_application","name":"Rider application update","subject":"An update on your ChowBuy rider application","category":"Rider operations","text":"Hi {{recipient_name}}, your rider application status is {{application_status}}. Next step: {{next_step}}.","html":"<h1>Rider application update</h1><p>Hi {{recipient_name}}, your rider application status is {{application_status}}. Next step: {{next_step}}.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"merchant_application","name":"Merchant application update","subject":"An update on your ChowBuy merchant application","category":"Merchant operations","text":"Hi {{recipient_name}}, your merchant application status is {{application_status}}. Next step: {{next_step}}.","html":"<h1>Merchant application update</h1><p>Hi {{recipient_name}}, your merchant application status is {{application_status}}. Next step: {{next_step}}.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"payout","name":"Payout update","subject":"Your ChowBuy payout status: {{payout_status}}","category":"Payouts","text":"Hi {{recipient_name}}, your payout of {{currency}} {{amount}} is {{payout_status}}. Reference: {{transaction_reference}}.","html":"<h1>Payout update</h1><p>Hi {{recipient_name}}, your payout of {{currency}} {{amount}} is {{payout_status}}. Reference: {{transaction_reference}}.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"support","name":"Support request received","subject":"ChowBuy Support has received your request","category":"Customer support","text":"Hi {{recipient_name}}, we received your support request {{ticket_reference}}. Our team will follow up with you.","html":"<h1>Support request received</h1><p>Hi {{recipient_name}}, we received your support request {{ticket_reference}}. Our team will follow up with you.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true},{"id":"security_alert","name":"ChowBuy account security alert","subject":"Important activity on your ChowBuy account","category":"Account security","text":"We noticed an important security event on your ChowBuy account: {{security_event}}. If this was not you, contact support immediately.","html":"<h1>ChowBuy account security alert</h1><p>We noticed an important security event on your ChowBuy account: {{security_event}}. If this was not you, contact support immediately.</p><p><a href=\"{{action_url}}\">Continue to ChowBuy</a></p>","enabled":true}];
function mailTemplates(){return U.mailTemplates||MAIL_DEFAULTS.map(function(t){return clone(t)})}
function vMailTemplates(){
 var list=mailTemplates(),active=U.mailEdit||list[0].id,t=list.filter(function(x){return x.id===active})[0]||list[0];
 return head('Mail templates','Manage branded transactional email content and activation. Changes are saved to the admin settings backend.',btn(ic('check')+'Save all templates','mailSave',null,'pri'))+
 '<div class="grid g2" style="align-items:start"><div class="card"><div class="bar"><b>Template library</b><span class="pill">'+list.filter(function(x){return x.enabled}).length+' enabled</span></div><div style="padding:.5rem">'+list.map(function(x){return '<button type="button" class="it'+(x.id===active?' unread':'')+'" data-act="mailSelect" data-id="'+esc(x.id)+'" style="width:100%;text-align:left;display:flex;justify-content:space-between;gap:.6rem"><span><b>'+esc(x.name)+'</b><small style="display:block;color:var(--muted)">'+esc(x.category)+'</small></span>'+pill(x.enabled?'Enabled':'Disabled',x.enabled?'ok':'warn')+'</button>'}).join('')+'</div></div>'+
 '<div class="card pad"><h3>'+esc(t.name)+'</h3><p class="sub">Use approved placeholders such as {{recipient_name}}, {{amount}}, {{currency}}, {{transaction_reference}}, {{sender_name}}, {{recipient_name}}, {{decline_reason}}, and {{action_url}}.</p>'+
 '<div class="f" style="margin-top:1rem"><label for="mailSubject">Email subject</label><input id="mailSubject" data-in="mail:subject" value="'+esc(t.subject)+'" maxlength="180"></div>'+
 '<div class="f" style="margin-top:.8rem"><label for="mailText">Plain-text body</label><textarea id="mailText" data-in="mail:text" rows="6" maxlength="10000">'+esc(t.text)+'</textarea></div>'+
 '<div class="f" style="margin-top:.8rem"><label for="mailHtml">HTML body</label><textarea id="mailHtml" data-in="mail:html" rows="8" maxlength="30000">'+esc(t.html)+'</textarea><small class="muted">HTML is editable. Use {{action_url}} for action links; avoid putting sensitive identity or payment data in email.</small></div>'+
 '<label class="cp on" style="margin-top:.8rem;display:flex;align-items:center;gap:.5rem"><input type="checkbox" data-ch="mail:enabled" '+(t.enabled?'checked':'')+'> Template enabled</label>'+
 '<div class="acts" style="margin-top:1rem">'+btn(ic('eye')+'Preview','mailPreview',t.id)+' '+btn('Reset this template','mailReset',t.id)+'</div>'+
 '<div class="card" style="margin-top:1rem;overflow:hidden"><div style="background:#FF6A00;color:white;text-align:center;padding:1rem"><b style="font-size:1.25rem">ChowBuy</b><div style="font-size:.8rem">Fast. Fresh. Reliable.</div></div><div style="padding:1.2rem;background:white;color:#1D1D1F"><b>'+esc(t.subject)+'</b><div style="margin-top:.7rem;line-height:1.6">'+esc(t.text).replace(/\n/g,'<br>')+'</div><small style="display:block;margin-top:1rem;color:#6B7280">Fast. Fresh. Reliable. · ChowBuy</small></div></div>'+
 '<p class="sub" style="margin-top:1rem">Important: this library controls saved template content. Live sending still requires event handlers to call the mail sender after verified events; saving a template does not itself send emails.</p></div></div>';
}
Object.assign(INP,{mail:function(k,v){var t=mailTemplates().filter(function(x){return x.id===(U.mailEdit||MAIL_DEFAULTS[0].id)})[0];if(t)t[k]=v;U.mailTemplates=mailTemplates();}});
Object.assign(CHG,{mail:function(k,v){var t=mailTemplates().filter(function(x){return x.id===(U.mailEdit||MAIL_DEFAULTS[0].id)})[0];if(t)t[k]=v==='on'||v===true;U.mailTemplates=mailTemplates();refresh()}});
Object.assign(A,{
 mailSelect:function(el){U.mailEdit=el.getAttribute('data-id');refresh()},
 mailPreview:function(el){var t=mailTemplates().filter(function(x){return x.id===el.getAttribute('data-id')})[0];if(t)openM('<h3>Preview: '+esc(t.name)+'</h3><div style="background:#FFF7F2;padding:1rem;color:#1D1D1F"><div style="background:#FF6A00;color:#fff;text-align:center;padding:1rem;font-weight:bold">ChowBuy<br><small>Fast. Fresh. Reliable.</small></div><div style="background:white;padding:1rem"><b>'+esc(t.subject)+'</b><p>'+esc(t.text).replace(/\n/g,'<br>')+'</p><small>Fast. Fresh. Reliable. · ChowBuy</small></div></div><div class="ft"><button type="button" class="btn pri" data-m="x">Close preview</button></div>')},
 mailReset:function(el){var id=el.getAttribute('data-id'),d=MAIL_DEFAULTS.filter(function(x){return x.id===id})[0];if(d){U.mailTemplates=mailTemplates().map(function(x){return x.id===id?clone(d):x});refresh();toast('Template reset to default. Save to apply.','warn')}},
 mailSave:function(){var items=mailTemplates();if(items.some(function(t){return !t.subject.trim()||!t.text.trim()||!t.html.trim()})){toast('Every template needs a subject, text and HTML body.','err');return}
 if(!beOn()){try{localStorage.setItem('cb-mail-templates',JSON.stringify(items));toast('Saved in this browser only. Connect the live admin backend to persist templates for the team.','warn')}catch(e){toast('Could not save templates in this browser.','err')}return}
 beFn('admin-settings',{emailTemplates:{version:1,items:items}}).then(function(){toast('Mail templates saved to the ChowBuy backend.');audit('Mail templates updated');},function(e){toast(e.message,'err')})}
});
function vTeam(){
  var rows=S.team.map(function(t){var me=t.id==='T0';
    return '<tr><td><div class="who"><span class="av" style="width:2.4rem;height:2.4rem;font-size:.75rem">'+initials(t.name)+'</span><div><b>'+esc(t.name)+(me?' <span class="pill acc">You</span>':'')+'</b><small>'+esc(t.email)+'</small></div></div></td><td>'+esc(t.role)+'</td><td>'+esc(t.scope)+'</td><td>'+pill(t.status)+'</td><td class="muted nw">'+esc(t.last)+'</td><td class="r"><div class="rowact">'+btn(ic('edit')+'Role','editT',t.id)+(t.status==='pending'?btn('Resend invite','resend',t.id,'pri'):t.status==='active'?btn('Suspend','suspendT',t.id,'danger',me?' disabled title="You cannot suspend yourself"':''):btn('Reinstate','suspendT',t.id))+'</div></td></tr>'}).join('');
  return head('Team & permissions','Operations staff and what each person can do.',btn(ic('plus')+'Invite team member','invite',null,'pri'))+
  '<div class="card"><div class="tw"><table class="t" style="min-width:58rem"><thead><tr><th>Member</th><th>Role</th><th>Scope</th><th>Status</th><th>Last active</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="foot"><span>'+S.team.filter(function(t){return t.status==='active'}).length+' active · '+S.team.length+' total</span></div></div>';
}
var ROLES=['Super Admin','Operations Lead','Merchant Success','Finance','Dispatch Controller'];
var SCOPES=['All verticals','Lagos • Ibadan','Abuja • Kano','Port Harcourt','Restaurants','Super Marts','Pharmacies','Packages','Payouts & settlements'];
function openTeam(t){
  var scopes=SCOPES.slice();if(t&&scopes.indexOf(t.scope)<0)scopes.push(t.scope);
  openM('<h3>'+(t?'Edit '+esc(t.name):'Invite team member')+'</h3>'+(t?'':inp('name','Full name','','placeholder="e.g. Folake Ade" maxlength="50" required')+inp('email','Work email','','type="email" placeholder="name@chowbuy.ng" required'))+
   sel('role','Role',ROLES.map(function(r){return[r,r]}),t?t.role:'Operations Lead')+sel('scope','Territorial / functional scope',scopes.map(function(r){return[r,r]}),t?t.scope:'All verticals')+
   '<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">'+(t?'Save':'Send invite')+'</button></div>',
   function(v){
    if(t){if(t.id==='T0'&&v.role!=='Super Admin')return 'You cannot remove your own Super Admin role.';upd(function(){t.role=v.role;t.scope=v.scope;log(t.name+' is now '+v.role,'settings')});toast(t.name+' updated · '+v.role+' · '+v.scope);return}
    var n=v.name.trim(),e=v.email.trim().toLowerCase();if(n.length<2)return 'Enter the full name.';
    if(!/^[^\s@]+@chowbuy\.ng$/.test(e))return 'Use a corporate email ending in @chowbuy.ng.';
    if(S.team.some(function(x){return x.email===e}))return 'That email is already on the team.';
    upd(function(){S.team.push({id:'T'+Date.now(),name:n,email:e,role:v.role,scope:v.scope,status:'pending',last:'Never'});log('Invite sent to '+e,'settings')});toast('Invite sent to '+e);
   });
}

function vSeo(){
  var cl=S.seo.reduce(function(s,p){return s+p.clicks},0),im=S.seo.reduce(function(s,p){return s+p.impr},0);
  var rows=S.seo.map(function(p){var ed=U.seoEdit===p.id,d=U.seoDraft||{};
    var meta=ed?'<div class="f"><input aria-label="Meta title" data-fid="se-t" data-in="seo:title" value="'+esc(d.title)+'" maxlength="90"><small>'+d.title.length+' chars · aim for ≤ 60</small></div><div class="f" style="margin-top:.5rem"><textarea aria-label="Meta description" rows="3" data-fid="se-d" data-in="seo:desc" maxlength="220">'+esc(d.desc)+'</textarea><small>'+d.desc.length+' chars · aim for ≤ 160</small></div>':'<b>'+esc(p.title)+'</b><div class="muted" style="margin-top:.2rem">'+esc(p.desc)+'</div>';
    return '<tr><td class="mono nw"><b>'+esc(p.path)+'</b></td><td style="min-width:22rem">'+meta+'</td><td><div class="acts">'+sw(p.indexed,'seoIdx',p.id,'Indexing for '+p.path)+'<small>'+(p.indexed?'indexed':'noindex')+'</small></div></td><td class="r mono">'+num(p.clicks)+'</td><td class="r mono">'+num(p.impr)+'</td><td class="r"><div class="rowact">'+(ed?btn(ic('check')+'Save','seoSave',p.id,'pri')+btn('Cancel','seoCancel',p.id):btn(ic('edit')+'Edit','seoEdit',p.id))+'</div></td></tr>'}).join('');
  return head('SEO & meta','Search and social previews for the public entry points.')+
  '<div class="grid g3">'+kpi('Google clicks (30d)',num(cl),'','search','g')+kpi('Impressions (30d)',num(im),'','globe')+kpi('Indexed routes',S.seo.filter(function(p){return p.indexed}).length+' / '+S.seo.length,'','check','n')+'</div>'+
  '<div class="card"><div class="tw"><table class="t" style="min-width:62rem"><thead><tr><th>Path</th><th>Meta title & description</th><th>Indexing</th><th class="r">Clicks</th><th class="r">Impressions</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}

/* ---------- router ---------- */
var ROUTES=[
 {p:'',n:'Dashboard',i:'grid',g:'Overview',v:vDash},{p:'orders',n:'Orders',i:'list',g:'Overview',v:vOrders},
 {p:'merchants',n:'Merchants',i:'building',g:'Marketplace',v:vMerchants},{p:'categories',n:'Categories',i:'tags',g:'Marketplace',v:vCategories},{p:'brands',n:'Brands',i:'sparkles',g:'Marketplace',v:vBrands},{p:'riders',n:'Riders',i:'bike',g:'Marketplace',v:vRiders},{p:'chats',n:'Chat supervision',i:'chat',g:'Marketplace',v:vChats},{p:'locations',n:'Locations',i:'pin',g:'Marketplace',v:vLocations},
 {p:'finance',n:'Finance',i:'wallet',g:'Money',v:vFinance},{p:'wallet-transfers',n:'Wallet transfers',i:'swap',g:'Money',v:vWallet},{p:'group-orders',n:'Group orders',i:'users',g:'Money',v:vGroups},
 {p:'smart-cart',n:'Smart Cart',i:'bag',g:'Platform',v:vSmart},{p:'seo',n:'SEO',i:'globe',g:'Platform',v:vSeo},{p:'brand-settings',n:'Brand settings',i:'image',g:'Platform',v:vBrandSet},{p:'settings',n:'Settings',i:'settings',g:'Platform',v:vSettings},{p:'mail-templates',n:'Mail templates',i:'mail',g:'Platform',v:vMailTemplates},{p:'team',n:'Team',i:'users',g:'Platform',v:vTeam},
 {p:'content-landing',n:'Landing page',i:'globe',g:'Content',v:vCmLanding},{p:'content-cities',n:'Cities',i:'pin',g:'Content',v:vCmCities},{p:'content-company',n:'Company pages',i:'building',g:'Content',v:vCmCompany},{p:'content-blog',n:'Blog',i:'edit',g:'Content',v:vCmBlog},{p:'content-support',n:'Support pages',i:'users',g:'Content',v:vCmSupport},{p:'content-legal',n:'Legal pages',i:'shield',g:'Content',v:vCmLegal},{p:'content-publish',n:'Publish',i:'upload',g:'Content',v:vCmPublish},
 {p:'profile',n:'My profile',i:'users',g:'',v:vProfile,hide:1}
];
function cur(){var h=location.hash.replace(/^#\/?/,'').split('?')[0].replace(/\/$/,'');return ROUTES.filter(function(r){return r.p===h})[0]||null}
function buildNav(){
  var g='',html='';ROUTES.forEach(function(r){if(r.hide)return;if(r.g!==g){g=r.g;html+='<div class="grp">'+g+'</div>'}html+='<a href="#/'+r.p+'" data-p="'+r.p+'">'+ic(r.i)+r.n+'</a>'});
  $('#nav').innerHTML=html;
}
function render(keep){
  var r=cur(),main=$('#view');
  document.querySelectorAll('#nav a').forEach(function(a){var on=r&&a.getAttribute('data-p')===r.p;a.classList.toggle('on',!!on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  if(r){main.innerHTML=r.v();document.title=(r.p?r.n+' · ':'')+'ChowBuy Admin'}
  else{main.innerHTML=head('Page not found','That admin page does not exist.')+'<div class="card">'+empty('search','Nothing here','Head back to the dashboard.','<a class="btn pri" href="#/">Go to dashboard</a>')+'</div>';document.title='Not found · ChowBuy Admin'}
  $('#crumb').textContent=r&&r.p?r.n:'Dashboard';
  var un=S.notifs.filter(function(n){return!n.read}).length,d=$('#nbadge');d.textContent=un;d.style.display=un?'':'none';
  $('#notifList').innerHTML=S.notifs.map(function(n){return '<button type="button" class="it'+(n.read?'':' unread')+'" data-act="readN" data-id="'+n.id+'" style="width:100%;text-align:left">'+ic(n.read?'check':'bell')+'<span>'+esc(n.t)+'</span></button>'}).join('');
  var av=$('#avTop');if(av){av.innerHTML=avHtml();av.setAttribute('style',avStyle())}
  if(!keep){window.scrollTo(0,0)}
}
function refresh(){
  var a=document.activeElement,fid=a&&a.getAttribute&&a.getAttribute('data-fid'),s,e;
  try{s=a.selectionStart;e=a.selectionEnd}catch(x){}
  var y=window.scrollY;render(true);window.scrollTo(0,y);
  if(fid){var n=document.querySelector('[data-fid="'+fid+'"]');if(n){n.focus();try{if(s!=null)n.setSelectionRange(s,e)}catch(x){}}}
}
window.addEventListener('hashchange',function(){closeSide();$('#pop').classList.remove('show');render(false)});

/* ---------- actions ---------- */
function csv(name,rows){
  var t=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);
}
var A={
 tab:function(el){U.tab[el.getAttribute('data-k')]=el.getAttribute('data-v');U.page={};refresh()},
 pg:function(el){var k=el.getAttribute('data-id');U.page[k]=(U.page[k]||1)+Number(el.getAttribute('data-d'));refresh()},
 clear:function(el){var k=el.getAttribute('data-id');U.q[k]='';U.page={};if(k==='orders'){U.tab.ordV='all';U.tab.ordS='all'}if(k==='merch')U.tab.merV='all';if(k==='riders'){U.tab.rdT='all';U.tab.rdS='all'}if(k==='wt')U.tab.wtS='ALL';refresh()},
 range:function(){U.range=(U.range+1)%3;refresh();toast('Showing '+RANGES[U.range][0].toLowerCase())},
 order:function(el){openOrder(el.getAttribute('data-id'))},
 csvOrders:function(){csv('chowbuy-orders.csv',[['Reference','Placed','Vertical','Merchant','Customer','City','Total NGN','Commission NGN','Status','Rider']].concat(S.orders.map(function(o){return[o.id,fdt(o.placed),V[o.vertical],o.merchant,o.customer,o.city,o.total,o.commission,o.status,o.rider]})));toast('Exported '+S.orders.length+' orders to CSV')},
 csvWt:function(){csv('chowbuy-wallet-transfers.csv',[['Reference','Time','Sender','Recipient','Amount NGN','Fee NGN','Status']].concat(S.transfers.map(function(t){return[t.id,fdt(t.ts),t.from,t.to,t.amount,t.fee,t.status]})));toast('Exported '+S.transfers.length+' ledger entries to CSV')},
 approveM:function(el){var m=find(S.merchants,el.getAttribute('data-id'));upd(function(){m.status='active';m.kyc='verified';log(m.name+' approved and verified','kyc')});toast(m.name+' approved. KYC marked verified.')},
 suspendM:function(el){var m=find(S.merchants,el.getAttribute('data-id')),on=m.status==='active';upd(function(){m.status=on?'suspended':'active';log(m.name+(on?' suspended':' reinstated'),on?'warn':'kyc')});toast(m.name+(on?' suspended. Their store is hidden from customers.':' reinstated and live again.'),on?'warn':'')},
 approveR:function(el){var r=find(S.riders,el.getAttribute('data-id'));upd(function(){r.status='active';log(r.name+' approved as '+r.type.toLowerCase()+' rider','kyc')});toast(r.name+' approved and ready for dispatch.')},
 suspendR:function(el){var r=find(S.riders,el.getAttribute('data-id')),on=r.status==='active';upd(function(){r.status=on?'suspended':'active';log(r.name+(on?' suspended':' reinstated'),on?'warn':'kyc')});toast(r.name+(on?' suspended from dispatch.':' reinstated.'),on?'warn':'')},
 catVis:function(el){var c=find(S.categories,el.getAttribute('data-id'));upd(function(){c.visible=!c.visible;log('Category "'+c.name+'" '+(c.visible?'shown':'hidden'),'settings')});toast('"'+c.name+'" is now '+(c.visible?'visible to':'hidden from')+' customers.')},
 addCat:function(){openAddCat()},
 brandFeat:function(el){var b=find(S.brands,el.getAttribute('data-id'));upd(function(){b.featured=!b.featured;log(b.name+(b.featured?' featured':' unfeatured'),'settings')});toast(b.name+(b.featured?' is now a featured brand.':' removed from featured brands.'))},
 addBrand:function(){openAddBrand()},
 country:function(el){var c=S.locs.countries.filter(function(x){return x.name===el.getAttribute('data-id')})[0];
   if(c.name==='Nigeria'&&c.status==='live'){toast('Nigeria is the only live market and cannot be paused.','err');return}
   upd(function(){c.status=c.status==='live'?'pipeline':'live';log(c.name+' market set to '+c.status,'pin')});toast(c.name+' is now '+c.status+'.')},
 cycleH:function(el){var h=find(S.locs.hoods,el.getAttribute('data-id')),o=['active','disabled','coming_soon'];upd(function(){h.status=o[(o.indexOf(h.status)+1)%3];log(h.name+' ('+h.city+') set to '+h.status.replace('_',' '),'pin')});toast(h.name+' is now '+h.status.replace('_',' ')+'.')},
 batch:function(){
   var p=S.settlements.filter(function(s){return s.status==='pending'});if(!p.length){toast('No pending payees to settle.','warn');return}
   var tot=p.reduce(function(s,x){return s+x.amount},0);
   confirmM('Run settlement batch','Send '+ngn(tot)+' to '+p.length+' payees over the bank rails now?','Run batch',function(){
     upd(function(){p.forEach(function(s){s.status='processing'});S.fin.pending=0;log('Settlement batch started: '+p.length+' payees, '+ngn(tot),'money')});
     toast('Batch started: '+p.length+' payees moved to processing.');
     setTimeout(function(){var n=0;S.settlements.forEach(function(s){if(s.status==='processing'){s.status='completed';n++}});log('Settlement batch completed ('+ngn(tot)+')','money');save();refresh();toast('Bank rails confirmed '+n+' payouts as completed.')},2400);
   });
 },
 retry:function(el){var s=find(S.settlements,el.getAttribute('data-id'));upd(function(){s.status='processing'});toast('Retrying payout to '+s.payee+'…');
   setTimeout(function(){s.status='completed';log('Payout to '+s.payee+' retried successfully ('+ngn(s.amount)+')','money');save();refresh();toast('Payout to '+s.payee+' completed.')},1800)},
 viewG:function(el){var g=find(S.groups,el.getAttribute('data-id')),d=gSum(g)-g.total;
   openM('<h3>'+esc(g.title)+'</h3><p class="muted">'+esc(g.code)+' · '+esc(g.merchant)+' · '+esc(g.hood)+'</p><div class="tw"><table class="t" style="min-width:0"><thead><tr><th>Participant</th><th class="r">Share</th><th>Paid</th></tr></thead><tbody>'+g.parts.map(function(p){return '<tr><td>'+esc(p.name)+'</td><td class="r mono">'+ngn(p.amt)+'</td><td>'+(p.paid?pill('paid','ok'):pill('owing','warn'))+'</td></tr>'}).join('')+'<tr><td><b>Allocated</b></td><td class="r mono"><b>'+ngn(gSum(g))+'</b></td><td></td></tr><tr><td><b>Order total</b></td><td class="r mono"><b>'+ngn(g.total)+'</b></td><td></td></tr></tbody></table></div><p>'+(d===0?'<span class="pill ok">'+ic('check')+'Reconciles</span>':'<span class="pill bad">'+ic('alert')+'Off by '+ngn(Math.abs(d))+'</span>')+'</p><div class="ft"><button type="submit" class="btn pri">Done</button></div>',function(){})},
 resetG:function(){confirmM('Reset demo group orders','This restores the original demo group orders and discards any changes.','Reset',function(){upd(function(){S.groups=window.CB_SEED().groups;log('Demo group orders reset','settings')});toast('Demo group orders restored.')},true)},
 flag:function(el){var D=sdraftS();var k=el.getAttribute('data-id');D.flags[k]=!D.flags[k];save();refresh();toast(FLAGS.filter(function(f){return f[0]===k})[0][1]+' '+(D.flags[k]?'enabled':'disabled')+' in draft.')},
 smartReset:function(){confirmM('Reset defaults','Set all recommendation types, the threshold and the bundle discount back to the recommended defaults as a draft?','Reset',function(){var D=sdraftS();D.flags={free_delivery:true,cheaper:true,value:true,essentials:true,repeat:true,consolidate:false,promo:true,delivery_saving:true,loyalty:false};D.threshold=12000;D.maxBundle=12;save();refresh();toast('Defaults loaded into the draft. Publish to apply.')})},
 smartPub:function(){var d=sdiff();if(!d.length)return;var th=Number(S.smart.draft.threshold),mb=Number(S.smart.draft.maxBundle);
   if(!isFinite(th)||th<0||String(S.smart.draft.threshold).trim()===''){toast('Enter a valid free delivery threshold.','err');return}
   if(!isFinite(mb)||mb<0||mb>50||String(S.smart.draft.maxBundle).trim()===''){toast('Maximum bundle discount must be between 0 and 50%.','err');return}
   confirmM('Publish Smart Cart changes','This goes live for all customers immediately:<br><br>'+d.map(esc).join('<br>'),'Publish',function(){upd(function(){var D=S.smart.draft;D.threshold=th;D.maxBundle=mb;S.smart.published=D;S.smart.draft=null;log('Smart Cart settings published ('+d.length+' changes)','settings')});toast('Smart Cart changes published.')})},
 brandTab:function(el){U.brand=el.getAttribute('data-id');refresh()},
 dev:function(el){U.dev=el.getAttribute('data-id');refresh()},
 rel:function(el){upd(function(){bdraft()[U.brand].rel=el.getAttribute('data-id')});toast('Relationship set to '+el.getAttribute('data-id').toLowerCase()+' in draft.')},
 pickFile:function(el){var i=$('#file-'+el.getAttribute('data-id'));if(i)i.click()},
 rmAsset:function(el){var k=el.getAttribute('data-id'),s=SLOTS.filter(function(x){return x[0]===k})[0];upd(function(){delete bdraft()[U.brand].assets[k]});toast(s[1]+' removed from draft.','warn')},
 brandReset:function(){confirmM('Reset to published','Discard all unsaved brand changes?','Discard',function(){upd(function(){S.brands2.draft=null});toast('Draft discarded. Showing the published brands.')},true)},
 brandPub:function(){if(!bdirty())return;confirmM('Publish brand changes','This updates the consumer, merchant and rider apps for everyone.','Publish',function(){upd(function(){S.brands2.published=clone(S.brands2.draft);S.brands2.draft=null;log('Brand settings published','settings')});toast('Brand changes published.')})},
 gw:function(el){var D=sEdit(),k=el.getAttribute('data-id');D.gateways[k]=!D.gateways[k];refresh();toast(GW.filter(function(g){return g[0]===k})[0][1]+' '+(D.gateways[k]?'enabled':'disabled')+'. Press Save settings to apply.')},
 addCity:function(){openAddCity()},
 rmCity:function(el){var D=sEdit(),c=el.getAttribute('data-id');if(D.cities.length<=1){toast('Keep at least one operating city.','err');return}D.cities=D.cities.filter(function(x){return x!==c});refresh();toast(c+' removed. Press Save settings to apply.','warn')},
 sDiscard:function(){U.sdraft=null;U.cityStates={};refresh();toast('Unsaved settings discarded.')},
 sSave:function(){
   if(!U.sdraft||!sChanges().length){toast('No changes to save.','warn');return}
   var D=U.sdraft,bad=null;
   Object.keys(D.rates).forEach(function(k){var v=String(D.rates[k]).trim();if(!bad&&(v===''||!isFinite(Number(v))||Number(v)<0||Number(v)>50))bad=V[k]+' commission must be between 0 and 50%.'});
   Object.keys(D.fare).forEach(function(k){var v=String(D.fare[k]).trim();if(!bad&&(v===''||!isFinite(Number(v))||Number(v)<0))bad='Enter a valid amount for '+k+'.'});
   if(bad){toast(bad,'err');return}
   var ch=sChanges(),P=S.settings,parts=[];
   upd(function(){
     Object.keys(D.rates).forEach(function(k){var nv=Number(D.rates[k]);if(P.rates[k]!==nv){log('Commission for '+V[k]+' changed '+P.rates[k]+'% → '+nv+'%','settings');S.merchants.forEach(function(m){if(m.vertical===k)m.rate=nv})}D.rates[k]=nv});
     Object.keys(D.fare).forEach(function(k){D.fare[k]=Number(D.fare[k])});
     var removed=P.cities.filter(function(c){return D.cities.indexOf(c)<0}),added=D.cities.filter(function(c){return P.cities.indexOf(c)<0});
     removed.forEach(function(c){var x=S.locs.cities.filter(function(y){return y.name===c})[0];if(x)x.status='paused'});
     added.forEach(function(c){var x=S.locs.cities.filter(function(y){return y.name===c})[0];if(x)x.status='live';else S.locs.cities.push({name:c,state:U.cityStates[c]||'—',status:'live'})});
     if(added.length||removed.length)log('Operating cities updated (+'+added.length+' / −'+removed.length+')','pin');
     S.settings=D;U.sdraft=null;U.cityStates={};
   });
   var n={rate:0,fare:0,gw:0,cities:0};ch.forEach(function(c){n[c[0]]++});
   if(n.rate)parts.push(n.rate+' commission rate'+(n.rate>1?'s':''));if(n.fare)parts.push(n.fare+' pricing field'+(n.fare>1?'s':''));if(n.gw)parts.push(n.gw+' gateway'+(n.gw>1?'s':''));if(n.cities)parts.push('city coverage');
   toast('Settings saved: '+parts.join(', ')+'.');
 },
 invite:function(){openTeam(null)},
 editT:function(el){openTeam(find(S.team,el.getAttribute('data-id')))},
 resend:function(el){var t=find(S.team,el.getAttribute('data-id'));toast('Invite re-sent to '+t.email+'.')},
 suspendT:function(el){var t=find(S.team,el.getAttribute('data-id')),on=t.status==='active';if(t.id==='T0'){toast('You cannot suspend yourself.','err');return}upd(function(){t.status=on?'suspended':'active';log(t.name+(on?' suspended':' reinstated'),on?'warn':'settings')});toast(t.name+(on?' suspended. Access revoked.':' reinstated.'),on?'warn':'')},
 seoEdit:function(el){var p=find(S.seo,el.getAttribute('data-id'));U.seoEdit=p.id;U.seoDraft={title:p.title,desc:p.desc};refresh()},
 seoCancel:function(){U.seoEdit=null;U.seoDraft=null;refresh()},
 seoSave:function(el){var p=find(S.seo,el.getAttribute('data-id')),d=U.seoDraft;if(!d.title.trim()||!d.desc.trim()){toast('Title and description cannot be empty.','err');return}
   upd(function(){p.title=d.title.trim();p.desc=d.desc.trim();U.seoEdit=null;U.seoDraft=null;log('Meta tags updated for '+p.path,'settings')});toast('Meta tags saved for '+p.path+'.')},
 seoIdx:function(el){var p=find(S.seo,el.getAttribute('data-id'));upd(function(){p.indexed=!p.indexed;log(p.path+' set to '+(p.indexed?'indexed':'noindex'),'settings')});toast(p.path+(p.indexed?' will be indexed by search engines.':' set to noindex.'),p.indexed?'':'warn')},
 readN:function(el){var n=find(S.notifs,Number(el.getAttribute('data-id')))||S.notifs.filter(function(x){return String(x.id)===el.getAttribute('data-id')})[0];if(n){n.read=true;save();refresh()}},
 readAll:function(){S.notifs.forEach(function(n){n.read=true});save();refresh();toast('All notifications marked as read.')},
 bell:function(){var p=$('#pop'),o=!p.classList.contains('show');p.classList.toggle('show',o);$('#bell').setAttribute('aria-expanded',o)},
 theme:function(){setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark',true)},
 resetAll:function(){confirmM('Reset all demo data','This clears every change you made in this browser and restores the original demo data.','Reset everything',function(){try{localStorage.removeItem(KEY)}catch(e){}S=window.CB_SEED();S.fin={pending:18420000};U.sdraft=null;U.q={};U.tab={};U.page={};refresh();toast('Demo data restored.')},true)}
};
function sdraftS(){if(!S.smart.draft)S.smart.draft=clone(S.smart.published);return S.smart.draft}

var INP={
 q:function(k,v){U.q[k]=v;U.page={};refresh()},
 smart:function(k,v){var D=sdraftS();D[k]=v.replace(/[^\d.]/g,'');save();refresh()},
 brand:function(k,v){bdraft()[U.brand][k]=v;save();refresh()},
 rate:function(k,v){sEdit().rates[k]=v.replace(/[^\d.]/g,'');refresh()},
 fare:function(k,v){sEdit().fare[k]=v.replace(/[^\d.]/g,'');refresh()},
 seo:function(k,v){U.seoDraft[k]=v;refresh()}
};
var CHG={
 brand:function(k,v){if(k==='color'){v=String(v).trim();if(v[0]!=='#')v='#'+v;if(!/^#[0-9a-fA-F]{6}$/.test(v)){toast('Use a 6-digit hex colour such as #FF5A1F.','err');refresh();return}bdraft()[U.brand].color=v.toUpperCase();save();refresh();toast('Brand colour set to '+v.toUpperCase()+' in draft.')}}
};
function onFile(slot,file,input){
  if(!file)return;
  var okType=/^image\/(svg\+xml|png|webp|jpeg)$/.test(file.type);
  if(!okType){toast('Unsupported file. Use SVG, PNG, WebP or JPG.','err');input.value='';return}
  if(file.size>2*1024*1024){toast('That file is '+(file.size/1048576).toFixed(1)+' MB. The limit is 2 MB.','err');input.value='';return}
  var fr=new FileReader();
  fr.onload=function(){var url=fr.result,im=new Image();
    im.onload=function(){upd(function(){bdraft()[U.brand].assets[slot]={name:file.name,type:file.type,size:file.size,w:file.type==='image/svg+xml'?0:im.naturalWidth,h:file.type==='image/svg+xml'?0:im.naturalHeight,url:url}});toast(SLOTS.filter(function(s){return s[0]===slot})[0][1]+' uploaded to draft.')};
    im.onerror=function(){toast('That image could not be read.','err')};im.src=url};
  fr.onerror=function(){toast('Could not read that file.','err')};
  fr.readAsDataURL(file);
}
var FORMS={
 addHood:function(f){var v=fd(f),n=(v.name||'').trim();if(n.length<2){toast('Enter a neighbourhood name.','err');return}
   if(S.locs.hoods.some(function(h){return h.city===v.city&&h.name.toLowerCase()===n.toLowerCase()})){toast(n+' already exists in '+v.city+'.','err');return}
   upd(function(){S.locs.hoods.push({id:'H'+Date.now(),name:n,city:v.city,status:'active'});log(n+' added to '+v.city,'pin')});toast(n+' added to '+v.city+' and set active.')}
};

/* ---------- CONTENT (CMS): edit public-site text, images, cities, legal pages, blog ---------- */
var CM={pub:null,draft:null,pages:{},loading:{},ready:false},CMKEY='cb-cms',CR=[];
function cmReg(o){CR.push(o);return CR.length-1}
function cmLoad(){
  if(CM.ready||CM.loading._init)return;CM.loading._init=1;
  fetch('../assets/content-data.js',{cache:'no-store'}).then(function(r){return r.ok?r.text():''}).catch(function(){return ''}).then(function(t){
    var m=/CB_CONTENT\s*=\s*([\s\S]*?);?\s*$/.exec(t||''),pub={};try{if(m)pub=JSON.parse(m[1])}catch(e){}
    CM.pub=pub;var d=null;try{d=JSON.parse(localStorage.getItem(CMKEY)||'null')}catch(e){}
    CM.draft=d||clone(pub);CM.ready=true;refresh();
  });
}
function cmPage(p){
  var k=p==='site'?'index':p;if(CM.pages[k])return CM.pages[k];
  if(!CM.loading[k]){CM.loading[k]=1;
    fetch('../'+k+'.html').then(function(r){return r.text()}).then(function(raw){
      var d=new DOMParser().parseFromString(raw,'text/html');CM.pages[k]=window.CMS.extract(d,k,raw);refresh();
    }).catch(function(){CM.pages[k]={fields:[],imgs:[],err:1};refresh()});
  }
  return null;
}
function cmSave(){try{localStorage.setItem(CMKEY,JSON.stringify(CM.draft));var s=$('#cmstat');if(s)s.textContent=cmCount()+' unpublished change'+(cmCount()===1?'':'s')}catch(e){toast('Browser storage is full. Download the publish package now, then discard the draft.','err')}}
function cmCount(){
  var d=CM.draft,p=CM.pub,n=0;
  ['t','i','docs'].forEach(function(k){var a=d[k]||{},b=p[k]||{};Object.keys(a).forEach(function(x){if(JSON.stringify(a[x])!==JSON.stringify(b[x]))n++});Object.keys(b).forEach(function(x){if(!(x in a))n++})});
  ['cities','blog','jobs','help','homeFaq'].forEach(function(k){if(JSON.stringify(d[k]||null)!==JSON.stringify(p[k]||null))n++});
  return n;
}
var CMDEF={blog:'blog',jobs:'careers',help:'help',homeFaq:'index'};
function cmDefs(name){if(name==='cities')return window.CMS.defaultCities;var P=CM.pages[CMDEF[name]];return (P&&P[name])||[]}
function cmCur(name){return CM.draft[name]||cmDefs(name)}
function cmList(name){if(!CM.draft[name])CM.draft[name]=clone(cmDefs(name));return CM.draft[name]}
function cmLoading(t,sub){return head(t,sub)+'<div class="card pad"><p class="muted">Loading page content…</p></div>'}
function cmTa(id,v,rows,extra){return '<textarea id="cf'+id+'" data-fid="cf'+id+'" data-in="cm:'+id+'" rows="'+rows+'" '+(extra||'')+'>'+esc(v)+'</textarea>'}
function cmIn(id,v,extra){return '<input id="cf'+id+'" data-fid="cf'+id+'" data-in="cm:'+id+'" value="'+esc(v)+'" '+(extra||'')+'>'}
function cmField(f){
  var D=CM.draft,cur=D.t&&D.t[f.key]!=null?D.t[f.key]:f.def,id=cmReg({k:'t',key:f.key,def:f.def}),ch=cur!==f.def,long=cur.length>72||cur.indexOf('\n')>=0;
  return '<div class="f cmf'+(ch?' chg':'')+'"><label for="cf'+id+'"><span class="tg">'+f.tag+'</span>'+(f.mode==='html'?'<small>contains styling, keep the &lt;span&gt; tags</small>':'')+(ch?'<span class="edt">edited</span>':'')+'</label>'+
    (long?cmTa(id,cur,Math.min(8,Math.ceil(cur.length/70)+1)):cmIn(id,cur))+(ch?'<div>'+btn('Restore original','cmReset',id)+'</div>':'')+'</div>';
}
function cmImgRow(f){
  var D=CM.draft,o=(D.i||{})[f.key],src=o&&o.src||f.src,alt=o&&o.alt!=null?o.alt:f.alt,id=cmReg({k:'img',key:f.key,def:f}),aid=cmReg({k:'alt',key:f.key,def:f});
  return '<div class="cmimg"><img class="thumb" src="'+esc(src)+'" alt=""><div class="cmimg-b"><div class="f"><label for="cf'+aid+'">Description (alt text)</label>'+cmIn(aid,alt)+'</div><div class="acts"><label class="btn sm">'+ic('upload')+'Replace image<input type="file" accept="image/*" hidden data-cmimg="'+id+'"></label>'+(o&&o.src?btn('Restore original','cmReset',id):'')+'</div></div></div>';
}
function cmDocCard(p,P){
  var D=CM.draft,cur=D.docs&&D.docs[p]!=null?D.docs[p]:P.doc,id=cmReg({k:'doc',page:p,def:P.doc}),ch=cur!==P.doc,prev=T('cmPrev','edit')==='prev';
  return '<div class="card pad"><div class="acts" style="justify-content:space-between"><div><h3>Document body'+(ch?' <span class="edt">edited</span>':'')+'</h3><p class="sub">Sections, paragraphs, lists and tables. The on-page contents list is built from your ## headings.</p></div>'+tabs('cmPrev',[['edit','Write'],['prev','Preview']],1)+'</div>'+
    (prev?'<div class="mdprev prose" style="margin-top:1rem">'+window.CMS.mdToHtml(cur,{ids:1})+'</div>':'<div class="f" style="margin-top:1rem"><label class="sr" for="cf'+id+'">Document body</label>'+cmTa(id,cur,22,'spellcheck="true" style="font-family:ui-monospace,Menlo,monospace;font-size:.82rem;line-height:1.6"')+'</div>')+
    '<details class="cmhelp"><summary>Formatting help</summary><div class="muted"><code>## Section title</code> big heading · <code>### Sub heading</code> · blank line between paragraphs · <code>- item</code> bullets · <code>1. item</code> numbered · <code>|Col A|Col B|</code> table rows (first row is the header) · <code>**bold**</code> <code>*italic*</code> <code>[link text](https://…)</code> · <code>{cities}</code> inserts your city list.</div></details>'+
    (ch?'<div class="acts" style="margin-top:.8rem">'+btn(ic('refresh')+'Restore original text','cmReset',id)+'</div>':'')+'</div>';
}
var CMLF={
 blog:[['tag','Category','i'],['title','Headline','i'],['ex','Short summary (card text)','t',2],['body','Article body','t',9],['img','Cover image','img']],
 jobs:[['title','Job title','i'],['meta','Team · Location · Type','i'],['email','Applications email','i']],
 help:[['cat','Topic','s'],['q','Question','i'],['a','Answer','t',4]],
 homeFaq:[['q','Question','i'],['a','Answer','t',3]]
};
var CMCAT=[['orders','Orders and delivery'],['pay','Payments'],['acct','Account'],['rider','Riders'],['rest','Restaurants']];
var CMNEW={blog:{tag:'News',title:'New post',ex:'One or two sentences that make people want to read on.',body:'Write the article here.\n\nSeparate paragraphs with a blank line.',img:'',alt:''},jobs:{title:'New role',meta:'Team · Location · Full-time',email:'careers@chowbuy.ng'},help:{cat:'orders',q:'New question',a:'Write the answer here.'},homeFaq:{q:'New question',a:'Write the answer here.'},cities:{n:'',s:''}};
function cmListCard(name,title,sub,noun){
  var items=cmCur(name),F=CMLF[name],ch=!!CM.draft[name]&&JSON.stringify(CM.draft[name])!==JSON.stringify(cmDefs(name));
  var h='<div class="card pad"><div class="acts" style="justify-content:space-between"><div><h3>'+title+(ch?' <span class="edt">edited</span>':'')+'</h3><p class="sub">'+sub+'</p></div><div class="acts">'+(ch?btn(ic('refresh')+'Restore original','cmListReset',name):'')+btn(ic('plus')+'Add '+noun,'cmAdd',name,'pri')+'</div></div><div class="cmitems">';
  if(!items.length)h+='<p class="muted" style="margin-top:1rem">Nothing here yet. Use “Add '+noun+'”.</p>';
  items.forEach(function(it,ix){
    h+='<div class="cmit"><div class="acts" style="justify-content:space-between"><b>'+(name==='blog'||name==='jobs'?esc(it.title||noun):'#'+(ix+1)+' '+esc((it.q||'').slice(0,60)))+'</b><div class="acts">'+
      '<button type="button" class="ib sm" data-act="cmMove" data-id="'+name+'" data-ix="'+ix+'" data-d="-1" aria-label="Move up"'+(ix?'':' disabled')+'>'+ic('down','flipv')+'</button><button type="button" class="ib sm" data-act="cmMove" data-id="'+name+'" data-ix="'+ix+'" data-d="1" aria-label="Move down"'+(ix<items.length-1?'':' disabled')+'>'+ic('down')+'</button>'+
      '<button type="button" class="ib sm" data-act="cmDel" data-id="'+name+'" data-ix="'+ix+'" aria-label="Delete '+noun+'">'+ic('trash')+'</button></div></div><div class="cmgrid">';
    F.forEach(function(f){
      var id=cmReg({k:'L',list:name,idx:ix,prop:f[0]}),lab='<label for="cf'+id+'">'+f[1]+'</label>';
      if(f[2]==='i')h+='<div class="f">'+lab+cmIn(id,it[f[0]]||'')+'</div>';
      else if(f[2]==='t')h+='<div class="f wide">'+lab+cmTa(id,it[f[0]]||'',f[3])+'</div>';
      else if(f[2]==='s')h+='<div class="f"><label for="cf'+id+'">'+f[1]+'</label><select id="cf'+id+'" data-ch="cm:'+id+'">'+CMCAT.map(function(c){return '<option value="'+c[0]+'"'+(c[0]===it.cat?' selected':'')+'>'+c[1]+'</option>'}).join('')+'</select></div>';
      else if(f[2]==='img'){var iid=cmReg({k:'limg',list:name,idx:ix}),aid=id;
        h+='<div class="f wide"><label>'+f[1]+'</label><div class="cmimg">'+(it.img?'<img class="thumb" src="'+esc(it.img)+'" alt="">':'<div class="thumb ph0">'+ic('image')+'</div>')+'<div class="cmimg-b"><div class="acts"><label class="btn sm">'+ic('upload')+(it.img?'Replace':'Upload')+' image<input type="file" accept="image/*" hidden data-cmimg="'+iid+'"></label>'+(it.img?btn('Remove','cmImgRm',name,'',' data-ix="'+ix+'"'):'')+'</div>'+
          (it.img?'<div class="f"><label for="cf'+aid+'">Image description (alt text)</label><input id="cf'+aid+'" data-fid="cf'+aid+'" data-in="cm:'+aid+'" value="'+esc(it.alt||'')+'"></div>':'')+'</div></div></div>';
        CR[aid]={k:'L',list:name,idx:ix,prop:'alt'};}
    });
    h+='</div></div>';
  });
  return h+'</div></div>';
}
function vCmPage(p){
  var P=cmPage(p);if(!CM.ready||!P)return cmLoading('Loading…','');
  var site=p==='site',out='';
  if(P.err)return '<div class="card pad"><p class="muted">Could not load this page. Check that the site files are deployed next to the admin folder.</p></div>';
  var q=(U.q.cm||'').toLowerCase();
  if(!site){
    if(P.doc!=null)out+=cmDocCard(p,P);
    if(p==='blog'&&P.blog)out+=cmListCard('blog','Blog posts','Add posts, upload a cover image for each, reorder with the arrows.','post');
    if(p==='careers'&&P.jobs)out+=cmListCard('jobs','Open roles','Each role gets an Apply button that emails your hiring address.','role');
    if(p==='help'&&P.help)out+=cmListCard('help','Help centre questions','Grouped by topic. Visitors can search and filter them.','question');
    if(p==='index')out+=cmListCard('homeFaq','Landing page FAQs','The accordion near the bottom of the home page. Use {cities} to insert your live city list.','question');
  }
  var fs=P.fields.filter(function(f){return (f.scope==='site')===site&&(!q||(f.def+' '+(CM.draft.t&&CM.draft.t[f.key]||'')).toLowerCase().indexOf(q)>=0)});
  var im=P.imgs.filter(function(f){return (f.key.indexOf('img:site:')===0)===site&&!f.src.match(/^$/)});
  if(im.length)out+='<div class="card pad"><h3>Images</h3><p class="sub">Uploads are resized and compressed automatically.</p><div class="cmimgs">'+im.map(cmImgRow).join('')+'</div></div>';
  var groups=[],gi={};fs.forEach(function(f){if(!(f.sec in gi)){gi[f.sec]=groups.length;groups.push([f.sec,[]])}groups[gi[f.sec]][1].push(f)});
  out+='<div class="card pad"><div class="acts" style="justify-content:space-between"><div><h3>'+(site?'Header, menu and footer text':'Page text')+'</h3><p class="sub">'+(site?'Shared by every page.':'Every heading, paragraph and button label on the page, in reading order.')+'</p></div>'+search('cm','Find text on this page')+'</div>'+
    (groups.length?groups.map(function(g){return '<div class="cmgrp"><h4>'+esc(g[0])+'</h4>'+g[1].map(cmField).join('')+'</div>'}).join(''):'<p class="muted" style="margin-top:1rem">No text matches your search.</p>')+'</div>';
  return out;
}
function cmBar(){return '<span class="pill '+(cmCount()?'warn':'ok')+'" id="cmstat">'+cmCount()+' unpublished change'+(cmCount()===1?'':'s')+'</span><a class="btn sm pri" href="#/content-publish">'+ic('upload')+'Publish</a>'}
function cmGroup(title,sub,key,opts,extra){
  if(!CM.ready){cmLoad();return cmLoading(title,sub)}
  CR.length=0;var cur=T(key,opts[0][0]);
  return head(title,sub,cmBar())+(opts.length>1?tabs(key,opts):'')+(extra||'')+vCmPage(cur);
}
function vCmLanding(){return cmGroup('Landing page','Edit the home page text, images and FAQs. Headline, buttons, sections and footer all live here.','cmL',[['index','Landing page'],['site','Header, menu & footer']],'<div class="card pad cmnote">'+ic('pin')+'<span>City names (the “Now delivering in…” badge) are managed on <a href="#/content-cities">Cities</a>.</span></div>')}
function vCmCompany(){return cmGroup('Company pages','About, Careers, Press, Partner with us and the rider sign-up page.','cmC',[['about','About'],['careers','Careers'],['press','Press'],['partner','Partner with us'],['rider','Become a rider']])}
function vCmSupport(){return cmGroup('Support pages','Help Center, Contact Us, Track Order and Report an Issue.','cmS',[['help','Help Center'],['contact','Contact Us'],['track','Track Order'],['report','Report an Issue']])}
function vCmLegal(){return cmGroup('Legal pages','Privacy Policy, Terms of Service, Cookies and the Rider Agreement. Have a lawyer review any change before you publish.','cmG',[['privacy','Privacy Policy'],['terms','Terms of Service'],['cookies','Cookies'],['rider-agreement','Rider Agreement']])}
function vCmBlog(){return cmGroup('Blog','Add, edit and reorder posts. Each post can have a cover image.','cmB',[['blog','Blog']])}
function vCmCities(){
  if(!CM.ready){cmLoad();return cmLoading('Cities','')}
  CR.length=0;var L=cmCur('cities'),ch=!!CM.draft.cities&&JSON.stringify(CM.draft.cities)!==JSON.stringify(cmDefs('cities')),C={cities:L};
  var h=head('Cities','Cities you deliver in. Changes the landing-page badge, FAQ answer, About, Press, sign-up forms and the map labels.',cmBar())+'<div class="grid g2"><div class="card pad"><div class="acts" style="justify-content:space-between"><div><h3>Delivery cities'+(ch?' <span class="edt">edited</span>':'')+'</h3><p class="sub">Name is shown in full sentences. Short name is used in the badge (for example PH).</p></div><div class="acts">'+(ch?btn(ic('refresh')+'Restore','cmListReset','cities'):'')+btn(ic('plus')+'Add city','cmAdd','cities','pri')+'</div></div><div class="cmcities">';
  L.forEach(function(c,ix){
    var a=cmReg({k:'L',list:'cities',idx:ix,prop:'n'}),b=cmReg({k:'L',list:'cities',idx:ix,prop:'s'});
    h+='<div class="cmcity"><div class="f"><label for="cf'+a+'">City</label>'+cmIn(a,c.n,'maxlength="40"')+'</div><div class="f"><label for="cf'+b+'">Short name</label>'+cmIn(b,c.s||'','maxlength="16"')+'</div><div class="acts"><button type="button" class="ib sm" data-act="cmMove" data-id="cities" data-ix="'+ix+'" data-d="-1" aria-label="Move up"'+(ix?'':' disabled')+'>'+ic('down','flipv')+'</button><button type="button" class="ib sm" data-act="cmMove" data-id="cities" data-ix="'+ix+'" data-d="1" aria-label="Move down"'+(ix<L.length-1?'':' disabled')+'>'+ic('down')+'</button><button type="button" class="ib sm" data-act="cmDel" data-id="cities" data-ix="'+ix+'" aria-label="Remove city">'+ic('trash')+'</button></div></div>';
  });
  h+='</div></div><div class="card pad"><h3>How it will read</h3><p class="sub">Live preview of the text visitors will see.</p><div class="cmprev"><div class="pill acc" id="cmp1">Now delivering in '+esc(window.CMS.cityShort(C))+'</div><p id="cmp2">We deliver in '+esc(window.CMS.cityFull(C))+'.</p><p id="cmp3">Now serving '+esc(window.CMS.cityCount(C))+' '+(L.length===1?'city':'cities')+'</p></div><p class="muted" style="margin-top:1rem">The animated map on the home page shows the six original cities; removing one hides its pin. A brand-new city appears everywhere else but needs a map pin added by a developer.</p></div></div>';
  return h;
}
function vCmPublish(){
  if(!CM.ready){cmLoad();return cmLoading('Publish','')}
  var n=cmCount(),prev=false;try{prev=localStorage.getItem('cb-cms-on')==='1'}catch(e){}
  var D=CM.draft,imgs=cmCollectImgs(clone(D)).count;
  return head('Publish changes','Your edits are saved as a draft in this browser. Publishing puts them on the live site.')+
  '<div class="grid g3">'+kpi('Unpublished changes',n,'','edit',n?'g':'n')+kpi('New images to upload',imgs,'','image')+kpi('Draft preview',prev?'On':'Off','','eye')+'</div>'+
  '<div class="card pad" style="margin-top:1rem"><h3>1. Check it</h3><p class="sub">Open the real site with your draft applied. A bar at the bottom reminds you it is a preview, and only this browser sees it.</p><div class="acts" style="margin-top:.8rem">'+btn(ic('eye')+'Preview on site','cmPreview','','pri')+(prev?btn('Turn preview off','cmPreviewOff'):'')+'</div></div>'+
  '<div class="card pad" style="margin-top:1rem"><h3>2. Download the publish package</h3><p class="sub">A small ZIP containing <code>assets/content-data.js</code> and any images you uploaded.</p><div class="acts" style="margin-top:.8rem">'+btn(ic('upload')+'Download publish package (.zip)','cmZip','','pri',n?'':' disabled')+'</div></div>'+
  '<div class="card pad" style="margin-top:1rem"><h3>3. Put it on the live site</h3><ol class="cmsteps"><li>Unzip the package into your website folder so the <code>assets</code> folder merges with the existing one (replace <code>content-data.js</code>).</li><li>Upload the folder to Cloudflare Pages again (Direct Upload) or push it to your Git repository.</li><li>Reload the admin. “Unpublished changes” returns to 0 once the new file is live.</li></ol><p class="muted">Because the site is static, edits are not instant for visitors. For one-click publishing, a small database and a login-protected function (Cloudflare KV or D1) can be added.</p></div>'+
  '<div class="card pad" style="margin-top:1rem"><h3>Discard draft</h3><p class="sub">Throw away every unpublished edit and go back to what is live.</p><div class="acts" style="margin-top:.8rem">'+btn(ic('trash')+'Discard all edits','cmDiscard','','danger',n?'':' disabled')+'</div></div>';
}
function cmCollectImgs(D){
  var map={},count=0;
  function conv(src){
    if(typeof src!=='string'||src.indexOf('data:')!==0)return src;
    if(!map[src]){var m=/^data:([\w+\/.-]+);base64,/.exec(src),ext=m?{'image/jpeg':'jpg','image/webp':'webp','image/png':'png','image/svg+xml':'svg','image/gif':'gif'}[m[1]]||'bin':'bin';map[src]={path:'assets/uploads/img-'+window.CMS.fnv(src)+'.'+ext,data:src};count++}
    return '/'+map[src].path;
  }
  Object.keys(D.i||{}).forEach(function(k){if(D.i[k]&&D.i[k].src)D.i[k].src=conv(D.i[k].src)});
  (D.blog||[]).forEach(function(p){if(p.img)p.img=conv(p.img)});
  return {D:D,map:map,count:count};
}
function cmCrc(u8){var t=cmCrc.t;if(!t){t=cmCrc.t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}}var c2=0xFFFFFFFF;for(var i=0;i<u8.length;i++)c2=t[(c2^u8[i])&255]^(c2>>>8);return(c2^0xFFFFFFFF)>>>0}
function cmZipBuild(files){
  var enc=new TextEncoder(),parts=[],cd=[],off=0;
  files.forEach(function(f){
    var nm=enc.encode(f.name),crc=cmCrc(f.data),h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,f.data.length,true);h.setUint32(22,f.data.length,true);h.setUint16(26,nm.length,true);
    parts.push(new Uint8Array(h.buffer),nm,f.data);
    var c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,f.data.length,true);c.setUint32(24,f.data.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cd.push(new Uint8Array(c.buffer),nm);off+=30+nm.length+f.data.length;
  });
  var cdl=cd.reduce(function(a,b){return a+b.length},0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cdl,true);e.setUint32(16,off,true);
  return new Blob(parts.concat(cd,[new Uint8Array(e.buffer)]),{type:'application/zip'});
}
function cmB64(d){var b=atob(d.slice(d.indexOf(',')+1)),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function cmPackage(){
  var r=cmCollectImgs(clone(CM.draft)),enc=new TextEncoder(),files=[];
  files.push({name:'assets/content-data.js',data:enc.encode('window.CB_CONTENT='+JSON.stringify(r.D)+';\n')});
  Object.keys(r.map).forEach(function(k){files.push({name:r.map[k].path,data:cmB64(r.map[k].data)})});
  files.push({name:'README.txt',data:enc.encode('ChowBuy content package\n\nUnzip into your website folder (merge the assets folder), then redeploy to Cloudflare Pages.\nOnly assets/content-data.js and assets/uploads/* are changed.\n')});
  return cmZipBuild(files);
}
function cmCompress(file,cb){
  if(!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type)){toast('Use a JPG, PNG, WebP or SVG image.','err');return}
  if(file.size>10*1048576){toast('That image is over 10 MB. Choose a smaller one.','err');return}
  var fr=new FileReader();
  fr.onload=function(){
    if(file.type==='image/svg+xml'){cb(fr.result);return}
    var im=new Image();
    im.onload=function(){
      var s=Math.min(1,1400/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*s));c.height=Math.max(1,Math.round(im.naturalHeight*s));
      var x=c.getContext('2d'),keepA=file.type==='image/png'||file.type==='image/webp';
      if(!keepA){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)}
      x.drawImage(im,0,0,c.width,c.height);
      var out=keepA?c.toDataURL('image/webp',.82):c.toDataURL('image/jpeg',.74);
      if(keepA&&out.indexOf('data:image/webp')!==0)out=c.toDataURL('image/png');
      cb(out);
    };
    im.onerror=function(){toast('That image could not be read.','err')};im.src=fr.result;
  };
  fr.onerror=function(){toast('Could not read that file.','err')};fr.readAsDataURL(file);
}
function cmImg(id,input){
  var o=CR[+id],f=input.files&&input.files[0];if(!o||!f)return;
  cmCompress(f,function(url){
    var D=CM.draft;
    if(o.k==='img'){D.i=D.i||{};D.i[o.key]=D.i[o.key]||{};D.i[o.key].src=url}
    else if(o.k==='limg'){cmList(o.list)[o.idx].img=url}
    cmSave();refresh();toast('Image added to your draft.');
  });
  input.value='';
}
Object.assign(INP,{cm:function(id,v){
  var o=CR[+id];if(!o)return;var D=CM.draft;
  if(o.k==='t'){D.t=D.t||{};if(v===o.def)delete D.t[o.key];else D.t[o.key]=v}
  else if(o.k==='doc'){D.docs=D.docs||{};if(v===o.def)delete D.docs[o.page];else D.docs[o.page]=v}
  else if(o.k==='alt'){D.i=D.i||{};D.i[o.key]=D.i[o.key]||{};D.i[o.key].alt=v}
  else if(o.k==='L'){cmList(o.list)[o.idx][o.prop]=v;if(o.list==='cities')cmCityPrev()}
  cmSave();
}});
Object.assign(CHG,{cm:function(id,v){var o=CR[+id];if(o&&o.k==='L'){cmList(o.list)[o.idx][o.prop]=v;cmSave()}}});
function cmCityPrev(){var C={cities:CM.draft.cities},a=$('#cmp1'),b=$('#cmp2'),c=$('#cmp3');if(!a)return;a.textContent='Now delivering in '+window.CMS.cityShort(C);b.textContent='We deliver in '+window.CMS.cityFull(C)+'.';c.textContent='Now serving '+window.CMS.cityCount(C)+' '+(C.cities.length===1?'city':'cities')}
Object.assign(A,{
 cmReset:function(el){var o=CR[+el.getAttribute('data-id')],D=CM.draft;if(!o)return;
   if(o.k==='t'&&D.t)delete D.t[o.key];else if(o.k==='doc'&&D.docs)delete D.docs[o.page];else if(o.k==='img'&&D.i)delete D.i[o.key];
   cmSave();refresh()},
 cmListReset:function(el){var n=el.getAttribute('data-id');confirmM('Restore original','This discards your edits to this list and brings back the original.','Restore',function(){delete CM.draft[n];cmSave();refresh()})},
 cmAdd:function(el){var n=el.getAttribute('data-id');cmList(n).push(clone(CMNEW[n]));cmSave();refresh();toast('Added. Fill in the new entry.')},
 cmDel:function(el){var n=el.getAttribute('data-id'),ix=+el.getAttribute('data-ix');
   if(n==='cities'&&cmCur('cities').length<2){toast('Keep at least one city.','err');return}
   confirmM('Remove entry','This removes it from your draft. You can restore the original list at any time.','Remove',function(){cmList(n).splice(ix,1);cmSave();refresh()},true)},
 cmMove:function(el){var n=el.getAttribute('data-id'),ix=+el.getAttribute('data-ix'),d=+el.getAttribute('data-d'),L=cmList(n),j=ix+d;if(j<0||j>=L.length)return;var t=L[ix];L[ix]=L[j];L[j]=t;cmSave();refresh()},
 cmImgRm:function(el){var n=el.getAttribute('data-id'),ix=+el.getAttribute('data-ix');var it=cmList(n)[ix];it.img='';it.alt='';cmSave();refresh()},
 cmPreview:function(){cmSave();try{localStorage.setItem('cb-cms-on','1')}catch(e){}window.open('../index.html','_blank');refresh()},
 cmPreviewOff:function(){try{localStorage.removeItem('cb-cms-on')}catch(e){}refresh();toast('Preview turned off.')},
 cmZip:function(){
   try{var b=cmPackage(),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='chowbuy-content-package.zip';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500);toast('Package downloaded. Unzip it into your site folder and redeploy.')}catch(e){toast('Could not build the package.','err')}},
 cmDiscard:function(){confirmM('Discard all edits','Every unpublished change in this browser will be lost.','Discard',function(){CM.draft=clone(CM.pub);try{localStorage.removeItem(CMKEY);localStorage.removeItem('cb-cms-on')}catch(e){}refresh();toast('Draft discarded.')},true)}
});

/* ---------- EXT: profile, payment gateways, maps, live rider radar ---------- */
function getPath(o,p){return p.split('.').reduce(function(a,k){return a==null?a:a[k]},o)}
function setPath(o,p,v){var ks=p.split('.'),c=o;for(var i=0;i<ks.length-1;i++){if(typeof c[ks[i]]!=='object'||c[ks[i]]===null)c[ks[i]]={};c=c[ks[i]]}c[ks[ks.length-1]]=v}
function delPath(o,p){var ks=p.split('.'),c=o;for(var i=0;i<ks.length-1;i++){c=c[ks[i]];if(!c)return}delete c[ks[ks.length-1]];if(ks.length>2&&c&&!Object.keys(c).length){var par=getPath(o,ks.slice(0,-2).join('.'));if(par)delete par[ks[ks.length-2]]}}
function PAYDEF(){return{
  korapay:{enabled:true,isLive:false,publicKey:'pk_test_8Kx2mQvL4nT7wZ',hints:{},webhookUrl:'https://api.chowbuy.ng/webhooks/korapay'},
  pocketfi:{enabled:true,isLive:false,apiKey:'pk_test_PF91xN3aVd02',hints:{},webhookUrl:'https://api.chowbuy.ng/webhooks/pocketfi',expiry:30,bank:'Wema Bank'},
  cod:{enabled:true,maxOrder:30000,otpFirst:true,riderLimit:50000},
  wallet:{enabled:true,allowTransfers:true}}}
function MAPDEF(){return{enabled:true,theme:'dark',hints:{},status:'none'}}
function PROFDEF(){return{name:'Adaeze Nwosu',email:'adaeze@chowbuy.ng',phone:'+234 803 555 0142',role:'super_admin',avatarUrl:'',avatarColor:0,twoFactor:false}}
function ensureExt(){
  if(!S.pay)S.pay=PAYDEF();if(!S.maps)S.maps=MAPDEF();if(!S.profile)S.profile=PROFDEF();
  if(!S.audit)S.audit=[];
  if(!S.sessions){var b=Date.parse('2026-10-15T20:30:00+01:00');S.sessions=[
    {id:'s1',device:'Chrome on macOS',ip:'102.89.***.***',loc:'Lagos, Nigeria',ts:b,cur:true},
    {id:'s2',device:'Safari on iPhone',ip:'105.112.***.***',loc:'Abuja, Nigeria',ts:b-3600e3*5},
    {id:'s3',device:'Chrome on Windows',ip:'197.210.***.***',loc:'Ibadan, Nigeria',ts:b-3600e3*29},
    {id:'s4',device:'Edge on Windows',ip:'41.58.***.***',loc:'Port Harcourt, Nigeria',ts:b-3600e3*76}]}
}
U.reveal={};U.conn={};U.pdraft=null;U.mdraft=null;U.pf=null;U.rad={city:'all',dist:'all',st:'all',ty:'all',sel:null};
var ROLEL={super_admin:'Super Admin',operations:'Operations Lead',finance:'Finance Controller'};
var AVG=[['#FF5A1F','#FF8A00'],['#0F172A','#334155'],['#12A150','#34D399'],['#2563EB','#60A5FA'],['#7C3AED','#C084FC'],['#DB2777','#FB7185']];
function avHtml(){var P=S.profile,g=AVG[P.avatarColor%6];return P.avatarUrl?'<img src="'+P.avatarUrl+'" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">':esc(initials(P.name))}
function avStyle(){var g=AVG[S.profile.avatarColor%6];return S.profile.avatarUrl?'padding:0;overflow:hidden':'background:linear-gradient(135deg,'+g[0]+','+g[1]+')'}
function audit(t){S.audit.unshift({t:t,ts:Date.now()});if(S.audit.length>12)S.audit.length=12}
function mask(v){v=String(v||'');return v.length>=12?v.slice(0,v.indexOf('_',v.indexOf('_')+1)>0?v.indexOf('_',v.indexOf('_')+1)+1:4)+'••••'+v.slice(-4):'••••••••'}
function copyText(t){try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){toast('Copied to clipboard')},function(){toast('Copy failed. Select the text and copy manually.','err')});return}}catch(e){}var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Copied to clipboard')}catch(e){toast('Copy failed. Select the text and copy manually.','err')}ta.remove()}

/* ---- profile ---- */
function pwRules(v){return[['At least 8 characters',v.length>=8],['An uppercase letter',/[A-Z]/.test(v)],['A lowercase letter',/[a-z]/.test(v)],['A number',/\d/.test(v)],['A symbol',/[^A-Za-z0-9]/.test(v)]]}
function vProfile(){
  var P=S.profile,tab=T('prof','details'),pf=U.pf||P;
  var tb=tabs('prof',[['details','Profile details'],['security','Security & password'],['sessions','Sessions & activity']]);
  var body='';
  if(tab==='details'){
    body='<div class="grid g2" style="align-items:start"><div class="card pad"><h3>Profile photo</h3><p class="sub">JPEG, PNG or WebP up to 5 MB. Photos are cropped to a square.</p><div class="acts" style="margin-top:1rem;gap:1.2rem;align-items:center"><div class="av" style="width:5.5rem;height:5.5rem;font-size:1.6rem;'+avStyle()+'">'+avHtml()+'</div><div style="display:grid;gap:.5rem"><button type="button" class="btn" data-act="avPick">'+ic('upload')+'Upload photo</button>'+(P.avatarUrl?btn(ic('trash')+'Remove photo','avRemove',null,'danger'):'')+'<input type="file" hidden id="avFile" data-avatar="1" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"></div></div>'+
      '<div style="margin-top:1.4rem"><b style="font-size:.85rem">Or choose a badge</b><div class="chips" style="margin-top:.6rem">'+AVG.map(function(g,i){return '<button type="button" data-act="avColor" data-id="'+i+'" aria-label="Badge colour '+(i+1)+'" aria-pressed="'+(!P.avatarUrl&&P.avatarColor===i)+'" style="width:2.6rem;height:2.6rem;border-radius:50%;background:linear-gradient(135deg,'+g[0]+','+g[1]+');color:#fff;font:800 .75rem var(--display);outline:'+(!P.avatarUrl&&P.avatarColor===i?'3px solid var(--fg)':'0')+';outline-offset:2px">'+esc(initials(pf.name))+'</button>'}).join('')+'</div></div></div>'+
      '<div class="card pad"><h3>Account details</h3><form data-form="profile" style="display:grid;gap:.9rem;margin-top:1rem" novalidate><div class="f"><label for="pf-name">Full name</label><input id="pf-name" data-fid="pf-name" data-in="pf:name" value="'+esc(pf.name)+'" maxlength="60"></div><div class="f"><label for="pf-email">Admin email</label><input id="pf-email" type="email" data-fid="pf-email" data-in="pf:email" value="'+esc(pf.email)+'" placeholder="admin@chowbuy.ng"></div><div class="f"><label for="pf-phone">Phone number</label><input id="pf-phone" inputmode="tel" data-fid="pf-phone" data-in="pf:phone" value="'+esc(pf.phone)+'" placeholder="+234 80… or 080…"><small>Nigerian format: +234 80… or 080…</small></div><div class="f"><label>Role</label><div><span class="pill acc">'+ic('shield')+ROLEL[P.role]+'</span> <small class="muted">Read-only. Ask a Super Admin to change roles.</small></div></div><div class="acts"><button class="btn pri" type="submit">'+ic('check')+'Save profile</button></div></form></div></div>';
  }else if(tab==='security'){
    var eye=function(id){return '<button type="button" class="ib" style="width:2.4rem;height:2.4rem;flex:none" data-act="eye" data-id="'+id+'" aria-label="Show or hide password">'+ic('eye')+'</button>'};
    body='<div class="grid g2" style="align-items:start"><div class="card pad"><h3>Change password</h3><form data-form="pw" style="display:grid;gap:.9rem;margin-top:1rem" novalidate autocomplete="off"><div class="f"><label for="pw0">Current password</label><div class="acts" style="flex-wrap:nowrap"><input id="pw0" type="password" autocomplete="current-password">'+eye('pw0')+'</div></div><div class="f"><label for="pw1">New password</label><div class="acts" style="flex-wrap:nowrap"><input id="pw1" type="password" autocomplete="new-password">'+eye('pw1')+'</div><div class="meter" aria-hidden="true"><i id="pwBar"></i></div><small id="pwLbl" class="muted">Strength: enter a password</small><ul id="pwRules" class="rules">'+pwRules('').map(function(r){return '<li>'+ic('x')+r[0]+'</li>'}).join('')+'</ul></div><div class="f"><label for="pw2">Confirm new password</label><div class="acts" style="flex-wrap:nowrap"><input id="pw2" type="password" autocomplete="new-password">'+eye('pw2')+'</div><small id="pwMatch" class="muted"></small></div><label class="acts" style="gap:.6rem;flex-wrap:nowrap"><input type="checkbox" id="pwOut" style="width:auto" checked> Log out of all other active sessions</label><div class="acts"><button class="btn pri" type="submit">'+ic('shield')+'Update password</button></div><small class="muted">Demo only: passwords are validated here but never stored or sent anywhere.</small></form></div>'+
      '<div class="card pad"><h3>Two-factor authentication</h3><p class="sub">Require a 6-digit code from an authenticator app (TOTP) at sign-in.</p><div class="trow" style="margin-top:.8rem"><div><b>Authenticator app</b><small>'+(P.twoFactor?'Enabled. Your account has an extra layer of protection.':'Not enabled. We strongly recommend turning this on.')+'</small></div>'+sw(P.twoFactor,'tfa','x','Authenticator app 2FA')+'</div>'+(P.twoFactor?'<div style="margin-top:.8rem"><span class="pill ok">'+ic('shield')+'2FA active</span></div>':'')+'</div></div>';
  }else{
    var feed=S.audit.slice(0,6).map(function(a){return '<div class="it"><span class="ico">'+ic('shield')+'</span><div><div>'+esc(a.t)+'</div><small>'+fdt(a.ts)+'</small></div></div>'}).join('');
    body='<div class="card"><div class="pad" style="padding-bottom:.5rem"><h3>Active sessions</h3><p class="sub">Devices currently signed in to this admin account.</p></div><div class="tw"><table class="t" style="min-width:44rem"><thead><tr><th>Device</th><th>IP address</th><th>Location</th><th>Last active</th><th></th></tr></thead><tbody>'+S.sessions.map(function(s){return '<tr><td><b>'+esc(s.device)+'</b>'+(s.cur?' <span class="pill ok">This device</span>':'')+'</td><td class="mono">'+esc(s.ip)+'</td><td>'+esc(s.loc)+'</td><td class="muted nw">'+(s.cur?'Active now':fdt(s.ts))+'</td><td class="r">'+(s.cur?'':btn('Revoke session','revoke',s.id,'danger'))+'</td></tr>'}).join('')+'</tbody></table></div></div>'+
      '<div class="card pad"><h3>Recent security activity</h3>'+(feed?'<div class="feed" style="margin-top:.6rem">'+feed+'</div>':'<p class="sub" style="margin-top:.5rem">Changes you make to your profile and security settings will appear here.</p>')+'</div>';
  }
  return head('My profile','Your admin identity, password and sign-in security.','<span class="pill acc">'+ic('shield')+ROLEL[P.role]+'</span>')+tb+body;
}
function pwLive(){
  var f=$('[data-form=pw]');if(!f)return;var v=$('#pw1').value,r=pwRules(v),sc=r.filter(function(x){return x[1]}).length;
  var lab=['Very weak','Weak','Fair','Good','Strong','Excellent'][sc],col=['#D92D20','#D92D20','#B7791F','#B7791F','#12A150','#12A150'][sc];
  $('#pwBar').style.width=(v?sc/5*100:0)+'%';$('#pwBar').style.background=col;$('#pwLbl').textContent=v?'Strength: '+lab:'Strength: enter a password';
  $('#pwRules').innerHTML=r.map(function(x){return '<li class="'+(x[1]?'ok':'')+'">'+ic(x[1]?'check':'x')+x[0]+'</li>'}).join('');
  var c=$('#pw2').value,m=$('#pwMatch');m.textContent=!c?'':(c===v?'Passwords match':'Passwords do not match');m.style.color=!c?'':(c===v?'var(--green)':'var(--red)');
}
function qrSvg(){
  var n=25,s=6,h='',R=1234;function r(){R=(R*1103515245+12345)&0x7fffffff;return R/0x7fffffff}
  var fin=function(x,y){return(x<7&&y<7)||(x>=n-7&&y<7)||(x<7&&y>=n-7)};
  for(var y=0;y<n;y++)for(var x=0;x<n;x++){var on;if(fin(x,y)){var lx=x%(n-7<=x?n-7:7),ly=y%(n-7<=y?n-7:7);lx=x>=n-7?x-(n-7):x;ly=y>=n-7?y-(n-7):y;on=lx===0||lx===6||ly===0||ly===6||(lx>=2&&lx<=4&&ly>=2&&ly<=4)}else on=r()>.5;if(on)h+='<rect x="'+x*s+'" y="'+y*s+'" width="'+s+'" height="'+s+'"/>'}
  return '<svg viewBox="0 0 '+n*s+' '+n*s+'" width="168" height="168" role="img" aria-label="Demonstration QR code" style="background:#fff;padding:8px;border-radius:12px;fill:#0B1020">'+h+'</svg>';
}
/* ---- payments ---- */
function pd(){return U.pdraft||S.pay}
function pe(){if(!U.pdraft)U.pdraft=clone(S.pay);return U.pdraft}
function pDirty(){return !!U.pdraft&&JSON.stringify(U.pdraft)!==JSON.stringify(S.pay)}
function fld(root,path,label,val,o){o=o||{};var id=root+'-'+path.replace(/\./g,'-');
  return '<div class="f"><label for="'+id+'">'+label+'</label><div class="acts" style="flex-wrap:nowrap"><input id="'+id+'" data-fid="'+id+'" data-in="'+root+':'+path+'" value="'+esc(val)+'"'+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+(o.num?' inputmode="numeric"':' spellcheck="false" autocomplete="off"')+'>'+(o.copy?'<button type="button" class="ib" style="width:2.4rem;height:2.4rem;flex:none" data-act="copy" data-v="'+esc(val)+'" aria-label="Copy '+esc(label)+'">'+ic('copy')+'</button>':'')+'</div>'+(o.hint?'<small>'+o.hint+'</small>':'')+'</div>'}
function sfld(root,prov,key,label,D){var raw=(D.raw||{})[key],hint=(D.hints||{})[key],id=root+'-'+prov+'-'+key,shown=U.reveal[id];
  return '<div class="f"><label for="'+id+'">'+label+'</label><div class="acts" style="flex-wrap:nowrap"><input id="'+id+'" data-fid="'+id+'" data-in="'+root+':'+(prov?prov+'.':'')+'raw.'+key+'" type="'+(shown?'text':'password')+'" value="'+esc(raw||'')+'" placeholder="'+(hint?esc(hint)+' (saved)':'Not set')+'" autocomplete="off" spellcheck="false"><button type="button" class="ib" style="width:2.4rem;height:2.4rem;flex:none" data-act="reveal" data-id="'+id+'" aria-label="'+(shown?'Hide':'Reveal')+' '+esc(label)+'">'+ic(shown?'eyeoff':'eye')+'</button></div></div>'}
function envSeg(prov,live){return '<div class="tabs sm" role="group" aria-label="Environment"><button type="button" data-act="payenv" data-id="'+prov+'" data-v="test" aria-pressed="'+!live+'">Sandbox / Test</button><button type="button" data-act="payenv" data-id="'+prov+'" data-v="live" aria-pressed="'+live+'">Live / Production</button></div>'}
function connBadge(k){var c=U.conn[k];return c==='ok'?'<span class="pill ok">'+ic('checkc')+'Connected (simulated)</span>':c==='testing'?'<span class="pill info">Testing…</span>':c&&c.indexOf('fail')===0?'<span class="pill bad">'+ic('xc')+esc(c.slice(5))+'</span>':''}
function gwCard(title,sub,prov,D,inner,test){return '<div class="card pad"><div class="acts" style="justify-content:space-between;flex-wrap:nowrap"><div><h3>'+title+'</h3><p class="sub">'+sub+'</p></div>'+sw(D.enabled,'paysw',prov+'.enabled','Enable '+title)+'</div>'+(D.enabled?'<div style="display:grid;gap:.9rem;margin-top:1.1rem">'+inner+(test?'<div class="acts">'+btn(ic('zap')+test,'testPay',prov,'')+connBadge(prov)+'</div>':'')+'</div>':'<p class="sub" style="margin-top:1rem">Disabled. Customers will not see this option at checkout.</p>')+'</div>'}
function vPayments(){
  var D=pd(),K=D.korapay,Pf=D.pocketfi,C=D.cod,W=D.wallet,dirty=pDirty();
  var kInner=envSeg('korapay',K.isLive)+fld('pay','korapay.publicKey','Public key',K.publicKey,{copy:1,ph:K.isLive?'pk_live_…':'pk_test_…'})+sfld('pay','korapay','secretKey','Secret key',K)+sfld('pay','korapay','encryptionKey','Encryption key',K)+sfld('pay','korapay','webhookSecret','Webhook secret',K)+fld('pay','korapay.webhookUrl','Webhook URL',K.webhookUrl,{copy:1,hint:'Change this if your API domain changes, then update it in the Korapay dashboard.'});
  var pInner=envSeg('pocketfi',Pf.isLive)+fld('pay','pocketfi.apiKey','Pocketfi public API key',Pf.apiKey,{copy:1})+sfld('pay','pocketfi','secretKey','Pocketfi merchant secret',Pf)+sfld('pay','pocketfi','webhookSecret','Webhook signature secret',Pf)+fld('pay','pocketfi.webhookUrl','Webhook URL',Pf.webhookUrl,{copy:1,hint:'Editable in case your domain changes.'})+
    '<div class="frow">'+sel('pf-exp','Account expiry duration',[['15','15 minutes'],['30','30 minutes (default)'],['60','60 minutes']],String(Pf.expiry)).replace('<select id="pf-exp" name="pf-exp">','<select id="pf-exp" data-ch="pay:pocketfi.expiry">')+sel('pf-bank','Auto-settlement account',[['Wema Bank','Wema Bank'],['Providus Bank','Providus Bank'],['GTBank','GTBank']],Pf.bank).replace('<select id="pf-bank" name="pf-bank">','<select id="pf-bank" data-ch="pay:pocketfi.bank">')+'</div>';
  var cInner=fld('pay','cod.maxOrder','Maximum order value for COD (₦)',C.maxOrder,{num:1,hint:'Orders above this amount cannot be paid in cash. Currently '+ngn(Number(C.maxOrder)||0)+'.'})+'<div class="trow"><div><b>Allow COD for first-time customers</b><small>Requires phone OTP confirmation at checkout.</small></div>'+sw(C.otpFirst,'paysw','cod.otpFirst','Allow COD for first-time customers')+'</div>'+fld('pay','cod.riderLimit','Rider cash reconciliation limit (₦)',C.riderLimit,{num:1,hint:'A rider must remit collected cash before accepting new orders once they hold this much. Currently '+ngn(Number(C.riderLimit)||0)+'.'});
  var wInner='<div class="trow"><div><b>Allow wallet transfers</b><small>Peer-to-peer transfers between ChowBuy wallets.</small></div>'+sw(W.allowTransfers,'paysw','wallet.allowTransfers','Allow wallet transfers')+'</div>';
  return head('Settings & pricing','Payment gateways, cash on delivery and the customer wallet.',(dirty?'<span class="badge-un">Unsaved changes</span>'+btn('Discard','payDiscard',null,''):'')+btn(ic('check')+'Save payment settings','paySave',null,'pri'))+setTabs()+
   '<div class="card pad" style="display:flex;gap:.8rem;align-items:flex-start;background:var(--accent-soft);border-color:transparent">'+ic('shield')+'<div><b>Secrets are never kept in this browser.</b><div class="muted" style="font-size:.88rem">When you save, only a masked preview (for example sk_test_••••1a2b) is stored. In production, store real keys in a server-side vault and never ship them to the client.</div><div class="acts" style="margin-top:.6rem"><a class="btn sm" href="../app/checkout.html" target="_blank" rel="noopener">Preview customer checkout</a><a class="btn sm" href="../app/order.html" target="_blank" rel="noopener">Preview order tracking</a></div></div></div>'+
   '<div class="grid g2" style="align-items:start">'+gwCard('Korapay','Cards, USSD and pay with bank','korapay',K,kInner,'Test connection')+gwCard('Pocketfi','One-time dynamic virtual bank accounts','pocketfi',Pf,pInner,'Test Pocketfi handshake')+gwCard('Cash on delivery','Pay the rider in cash with reconciliation','cod',C,cInner,'')+gwCard('ChowBuy wallet','Stored-value wallet checkout','wallet',W,wInner,'')+'</div>';
}
function setTabs(){return tabs('setTab',[['pricing','Pricing & coverage'],['payments','Payment gateways'],['maps','Integrations & maps'],['realtime','Realtime & push'],['email','Email'],['signin','Sign-in methods']])}
/* ---- maps ---- */
function md(){return U.mdraft||S.maps}
function me(){if(!U.mdraft)U.mdraft=clone(S.maps);return U.mdraft}
function mDirty(){return !!U.mdraft&&JSON.stringify(U.mdraft)!==JSON.stringify(S.maps)}
var MTH=[['dark','ChowBuy Dark','Midnight navigation','#0F172A','#243049'],['silver','Silver Clean','Light and minimal','#E9EBEE','#FFFFFF'],['standard','Standard','Familiar colours','#EAF0E1','#FFFFFF']];
function vMaps(){
  var D=md(),dirty=mDirty();
  var keys=[['js','Maps JavaScript API key','Client-side map rendering'],['geo','Geocoding & Places API key','Address autocomplete and reverse geocoding'],['dir','Directions API key','Routing, distance and time']];
  return head('Settings & pricing','Google Maps keys, map theme and the offline fallback.',(dirty?'<span class="badge-un">Unsaved changes</span>'+btn('Discard','mapDiscard',null,''):'')+btn(ic('check')+'Save map settings','mapSave',null,'pri'))+setTabs()+
  '<div class="grid g2" style="align-items:start"><div class="card pad"><h3>Google Maps credentials</h3><p class="sub">Restrict each key to your domain and the matching API in Google Cloud.</p><div style="display:grid;gap:.9rem;margin-top:1.1rem">'+keys.map(function(k){return sfld('maps','',k[0],k[1],D)}).join('')+'<div class="acts">'+btn(ic('zap')+'Test Google Maps key','testMap',null,'')+(S.maps.status==='ok'?'<span class="pill ok">'+ic('checkc')+'Live &amp; validated (simulated)</span>':'')+(U.conn.map&&U.conn.map.indexOf('fail')===0?'<span class="pill bad">'+ic('xc')+esc(U.conn.map.slice(5))+'</span>':'')+(U.conn.map==='testing'?'<span class="pill info">Checking…</span>':'')+'</div></div></div>'+
  '<div style="display:grid;gap:1rem"><div class="card pad"><h3>Map theme</h3><div class="grid g3" style="margin-top:1rem;gap:.7rem">'+MTH.map(function(t){var on=D.theme===t[0];return '<button type="button" data-act="mapTheme" data-id="'+t[0]+'" aria-pressed="'+on+'" style="border:2px solid '+(on?'var(--accent)':'var(--line)')+';border-radius:1rem;padding:.6rem;text-align:left;background:var(--card)"><div style="height:3.4rem;border-radius:.6rem;background:'+t[3]+';position:relative;overflow:hidden"><i style="position:absolute;left:-10%;top:45%;width:120%;height:.4rem;background:'+t[4]+';transform:rotate(-12deg)"></i><i style="position:absolute;left:30%;top:-10%;width:.4rem;height:120%;background:'+t[4]+';transform:rotate(18deg)"></i></div><b style="display:block;margin-top:.5rem;font-size:.84rem">'+t[1]+'</b><small class="muted">'+t[2]+'</small></button>'}).join('')+'</div></div>'+
  '<div class="card pad"><div class="trow" style="padding-top:0"><div><b>Use Google Maps when available</b><small>When off, or when a key is empty or invalid, ChowBuy shows its built-in SVG map. Nothing breaks.</small></div>'+sw(D.enabled,'mapsw','x','Use Google Maps when available')+'</div><p class="sub" style="margin-top:.6rem">Current mode: <b>'+(D.enabled&&S.maps.status==='ok'?'Google Maps (when keys are live)':'ChowBuy fallback map')+'</b>. The live rider radar and the customer tracking page both use this theme.</p></div></div></div>';
}
/* ---- live radar ---- */
var CITYC={Lagos:[6.5244,3.3792],Abuja:[9.0765,7.3986],Ibadan:[7.3775,3.947],'Port Harcourt':[4.8156,7.0498],Kano:[12.0022,8.592]};
var DIST={Lagos:{Ikeja:[.34,.2],Maryland:[.5,.3],Gbagada:[.64,.26],Yaba:[.45,.46],Surulere:[.3,.56],'Victoria Island':[.44,.76],Ikoyi:[.6,.64],'Lekki Phase 1':[.74,.72],Ajah:[.9,.8]},Abuja:{Maitama:[.5,.3],'Wuse 2':[.42,.52],Jabi:[.26,.3],Garki:[.58,.7]},Ibadan:{Bodija:[.45,.25],'Ring Road':[.5,.55],Jericho:[.3,.4],Challenge:[.62,.72]},'Port Harcourt':{'GRA Phase 2':[.35,.3],Rumuola:[.55,.35],'Trans-Amadi':[.6,.65],Rumuokoro:[.3,.6]},Kano:{'Nassarawa GRA':[.55,.3],'Sabon Gari':[.4,.5],Fagge:[.6,.6],Bompai:[.3,.3]}};
var CITYN={Lagos:70,Abuja:32,Ibadan:18,'Port Harcourt':16,Kano:12},CCODE={Lagos:'LND',Abuja:'ABJ',Ibadan:'IBD','Port Harcourt':'PHC',Kano:'KNO'};
var RST={idle:'#12A150',assigned:'#F59E0B',transit_pickup:'#2563EB',transit_dropoff:'#7C3AED',offline:'#94A3B8'};
var RSL={idle:'Online · idle',assigned:'Assigned',transit_pickup:'Heading to pickup',transit_dropoff:'Heading to drop-off',offline:'Offline'};
var RR=null;
function genRadar(){
  var a=7,R=function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  var FNs=['Sodiq','Emeka','Tunde','Ibrahim','Chidi','Yusuf','Kunle','Bashir','Daniel','Segun','Moses','Habib','Femi','Gbenga','Nuhu','Kelvin','Ahmed','Tobi','Peter','Ridwan'],LNs=['Bello','Obi','Adeyemi','Musa','Okafor','Garba','Ajayi','Sule','Eze','Alade','Udo','Lawal','Adebayo','Ojo','Aliyu','Obasi','Yakubu','Coker','Nnamdi','Salami'];
  var st=[];for(var i=0;i<64;i++)st.push('idle');for(i=0;i<24;i++){st.push('assigned');st.push('transit_pickup');st.push('transit_dropoff')}for(i=0;i<12;i++)st.push('offline');
  for(i=st.length-1;i>0;i--){var j=Math.floor(R()*(i+1)),t=st[i];st[i]=st[j];st[j]=t}
  RR=[];var n=0;Object.keys(CITYN).forEach(function(c){var ds=Object.keys(DIST[c]);for(var k=0;k<CITYN[c];k++){var d=ds[Math.floor(R()*ds.length)],p=DIST[c][d],fleet=k%5<2,s=st[n],oid=S.orders[(n*7)%S.orders.length].id;
    RR.push({id:'LR'+(300+n),name:FNs[Math.floor(R()*20)]+' '+LNs[Math.floor(R()*20)],phone:'+234 80'+Math.floor(R()*10)+' '+(100+Math.floor(R()*899))+' '+(1000+Math.floor(R()*8999)),type:fleet?'FLEET':'PARTNER',status:s,city:c,district:d,x:Math.min(.95,Math.max(.05,p[0]+(R()-.5)*.14)),y:Math.min(.95,Math.max(.05,p[1]+(R()-.5)*.14)),bearing:Math.floor(R()*360),speed:(s==='idle'||s==='offline')?0:Math.floor(18+R()*30),battery:Math.floor(35+R()*65),orderId:(s==='idle'||s==='offline')?'':oid,rating:Math.round((4.2+R()*.8)*10)/10,accept:Math.floor(70+R()*29),shift:fleet?'08:00 - 17:00':'',hub:fleet?d+' Hub '+(R()>.5?'A':'B'):'',plate:CCODE[c]+'-'+(100+Math.floor(R()*899))+'-'+String.fromCharCode(65+Math.floor(R()*26))+String.fromCharCode(65+Math.floor(R()*26))+String.fromCharCode(65+Math.floor(R()*26)),tier:'Standard',papers:R()>.2,checkin:fleet?'0'+(7+Math.floor(R()*2))+':'+(10+Math.floor(R()*49)):'',maint:[]});n++}})
}
function radScope(){var q=U.rad;return RR.filter(function(r){return(q.city==='all'||r.city===q.city)&&(q.dist==='all'||r.district===q.dist)&&(q.ty==='all'||r.type===q.ty)})}
function ltlg(r){var c=CITYC[r.city];return[(c[0]+(.5-r.y)*.24).toFixed(5),(c[1]+(r.x-.5)*.3).toFixed(5)]}
function tbadge(t){return t==='FLEET'?'<span class="pill b-fleet">'+ic('shield')+'Fleet</span>':'<span class="pill b-part">'+ic('bike')+'Partner</span>'}
var MC={dark:{bg:'#0F172A',road:'#26334D',water:'#13324F',txt:'#94A3B8'},silver:{bg:'#E6E8EB',road:'#FFFFFF',water:'#C6D4E1',txt:'#6B7280'},standard:{bg:'#EAF0E1',road:'#FFFFFF',water:'#A8D3F0',txt:'#4B5563'}};
var ROADS={};
function roads(city){if(ROADS[city])return ROADS[city];var a=city.length*77+3,R=function(){a=(a*1664525+1013904223)&0x7fffffff;return a/0x7fffffff},d='';
  for(var i=0;i<6;i++){var y=60+i*80+R()*30;d+='M0,'+y+' C'+(200+R()*80)+','+(y-60+R()*80)+' '+(450+R()*80)+','+(y+60-R()*80)+' 800,'+(y+R()*40-20)+' '}
  for(i=0;i<5;i++){var x=60+i*150+R()*40;d+='M'+x+',0 C'+(x+60-R()*90)+',170 '+(x-60+R()*90)+',350 '+(x+R()*50-25)+',520 '}
  return ROADS[city]=d}
function waterFor(city,c){if(city==='Lagos')return '<path d="M0,420 C180,395 360,445 560,400 C660,378 740,395 800,375 L800,520 L0,520Z" fill="'+c.water+'"/><path d="M300,300 C380,270 470,300 540,335 C470,350 380,345 300,300Z" fill="'+c.water+'"/>';if(city==='Port Harcourt')return '<path d="M0,470 C200,430 330,500 520,440 C640,405 720,440 800,420 L800,520 L0,520Z" fill="'+c.water+'"/>';return ''}
function rmark(r,sel){
  var x=r.x*800,y=r.y*520,off=r.status==='offline',col=RST[r.status],fl=r.type==='FLEET';
  var shape=fl?'<rect x="-11" y="-11" width="22" height="22" rx="6" fill="#0F2A4A" stroke="'+col+'" stroke-width="3"/><text y="4.5" text-anchor="middle" style="font:800 12px Manrope,sans-serif;fill:#fff">F</text>':'<circle r="12" fill="#FF5A1F" stroke="'+col+'" stroke-width="3"/><text y="4.5" text-anchor="middle" style="font:800 12px Manrope,sans-serif;fill:#fff">P</text>';
  return '<g class="rk" data-act="radSel" data-id="'+r.id+'" transform="translate('+x.toFixed(1)+','+y.toFixed(1)+')" role="button" tabindex="0" aria-label="'+esc(r.name)+', '+(fl?'Fleet':'Partner')+', '+RSL[r.status]+'" style="cursor:pointer;opacity:'+(off?.55:1)+'">'+(sel?'<circle r="22" fill="none" stroke="'+col+'" stroke-width="2" opacity=".6"><animate attributeName="r" values="16;28;16" dur="1.8s" repeatCount="indefinite"/></circle>':'')+(r.speed?'<path d="M0,-19 L6,-12 L-6,-12Z" fill="'+col+'" transform="rotate('+r.bearing+')"/>':'')+shape+'</g>';
}
function radSvg(list){
  var q=U.rad,c=MC[S.maps.theme]||MC.dark,out='<rect width="800" height="520" fill="'+c.bg+'"/>';
  if(q.city==='all'){
    var pos={Kano:[.55,.14],Abuja:[.5,.46],Ibadan:[.3,.68],Lagos:[.17,.82],'Port Harcourt':[.64,.88]};
    out+='<path d="'+roads('NG')+'" stroke="'+c.road+'" stroke-width="2" fill="none" opacity=".6"/>';
    Object.keys(pos).forEach(function(k){var l=RR.filter(function(r){return r.city===k&&(q.ty==='all'||r.type===q.ty)}),f=l.filter(function(r){return r.type==='FLEET'}).length,rad=18+Math.sqrt(l.length)*3.4;
      out+='<g data-act="radCity" data-id="'+k+'" transform="translate('+pos[k][0]*800+','+pos[k][1]*520+')" role="button" tabindex="0" aria-label="'+k+', '+l.length+' riders" style="cursor:pointer"><circle r="'+(rad+8)+'" fill="#FF5A1F" opacity=".18"/><circle r="'+rad+'" fill="#FF5A1F"/><text y="5" text-anchor="middle" style="font:800 14px Sora,sans-serif;fill:#fff">'+l.length+'</text><text y="'+(rad+20)+'" text-anchor="middle" style="font:700 12px Manrope,sans-serif;fill:'+c.txt+'">'+k+' · '+f+' fleet / '+(l.length-f)+' partner</text></g>'});
    return out;
  }
  out+=waterFor(q.city,c)+'<path d="'+roads(q.city)+'" stroke="'+c.road+'" stroke-width="3" fill="none" opacity=".75"/>';
  Object.keys(DIST[q.city]).forEach(function(d){var p=DIST[q.city][d],on=q.dist===d;out+='<g transform="translate('+p[0]*800+','+p[1]*520+')" data-act="radDist" data-id="'+d+'" style="cursor:pointer"><circle r="'+(on?46:34)+'" fill="'+(on?'#FF5A1F':c.txt)+'" opacity="'+(on?.14:.08)+'"/><text y="'+(on?-50:-38)+'" text-anchor="middle" style="font:700 11px Manrope,sans-serif;fill:'+c.txt+'">'+d+'</text></g>'});
  list.forEach(function(r){if(r.id!==q.sel)out+=rmark(r,false)});
  list.forEach(function(r){if(r.id===q.sel)out+=rmark(r,true)});
  return out;
}
function radDetail(r){
  var ll=ltlg(r),fl=r.type==='FLEET';
  var acts=fl?btn(ic('building')+'Reassign hub','radHub',r.id)+btn(ic('settings')+'Log maintenance','radMaint',r.id)+btn(ic('clock')+'Shift check-in','radShift',r.id):btn(ic('wallet')+'Earnings ledger','radLedger',r.id)+btn(ic('tags')+'Commission tier','radTier',r.id)+btn(ic('shield')+'Verify papers','radDocs',r.id);
  return '<div class="acts" style="justify-content:space-between;flex-wrap:nowrap"><div class="who"><span class="tile" style="background:'+(fl?'#0F2A4A':'#FF5A1F')+'">'+esc(initials(r.name))+'</span><div><b>'+esc(r.name)+'</b><small>'+esc(r.id)+' · '+esc(r.plate)+'</small></div></div><button type="button" class="ib" data-act="radClose" aria-label="Close rider details" style="width:2.2rem;height:2.2rem">'+ic('x')+'</button></div>'+
   '<div class="acts" style="margin:.8rem 0">'+tbadge(r.type)+'<span class="pill" style="color:'+RST[r.status]+'">'+RSL[r.status]+'</span></div>'+
   '<div class="kv"><span>Position</span><b class="mono" id="rdPos">'+ll[0]+', '+ll[1]+'</b><span>Speed</span><b class="mono" id="rdSpd">'+r.speed+' km/h</b><span>Battery</span><b class="mono">'+r.battery+'%</b><span>Area</span><b>'+esc(r.district)+', '+esc(r.city)+'</b><span>Rating (30d)</span><b class="mono">'+r.rating.toFixed(1)+' ★</b><span>Acceptance</span><b class="mono">'+r.accept+'%</b>'+
   (fl?'<span>Hub</span><b>'+esc(r.hub)+'</b><span>Shift</span><b>'+r.shift+'</b>':'<span>Commission tier</span><b>'+r.tier+'</b><span>Vehicle papers</span><b>'+(r.papers?'Verified':'Pending')+'</b>')+
   '<span>Current order</span><b>'+(r.orderId?'<a href="#/orders" data-act="radOrder" data-id="'+r.orderId+'" style="color:var(--accent-ink);text-decoration:underline">'+r.orderId+'</a>':'None')+'</b></div>'+
   '<div class="acts" style="margin-top:1rem"><a class="btn sm pri" href="tel:'+r.phone.replace(/\s/g,'')+'">'+ic('bell')+'Call '+esc(r.phone)+'</a><button type="button" class="btn sm danger" data-act="radSOS" data-id="'+r.id+'">'+ic('alert')+'SOS dispatch</button></div><div class="acts" style="margin-top:.6rem">'+acts+'</div>';
}
function vRadar(){
  if(!RR)genRadar();var q=U.rad,sc=radScope(),
    cnt=function(f){return sc.filter(f).length},
    all=sc.length,idle=cnt(function(r){return r.status==='idle'}),del=cnt(function(r){return r.status==='assigned'||r.status==='transit_pickup'||r.status==='transit_dropoff'}),off=cnt(function(r){return r.status==='offline'});
  var list=sc.filter(function(r){return q.st==='all'||(q.st==='idle'&&r.status==='idle')||(q.st==='del'&&(r.status==='assigned'||r.status==='transit_pickup'||r.status==='transit_dropoff'))||(q.st==='off'&&r.status==='offline')});
  var sel=list.filter(function(r){return r.id===q.sel})[0];if(!sel)q.sel=null;
  var chip=function(k,v,l,cur){return '<button type="button" data-act="radF" data-k="'+k+'" data-v="'+v+'" aria-pressed="'+(cur===v)+'">'+l+'</button>'};
  var cities=['all'].concat(Object.keys(CITYN)),dists=q.city==='all'?[]:Object.keys(DIST[q.city]);
  var side=sel?radDetail(sel):'<div><h3 style="font-size:1rem">Riders in view <span class="muted" style="font-weight:600">('+list.length+')</span></h3></div><div style="display:grid;gap:.1rem;margin-top:.6rem;max-height:23rem;overflow:auto">'+(list.slice(0,40).map(function(r){return '<button type="button" class="rl" data-act="radSel" data-id="'+r.id+'"><span class="tile" style="width:2rem;height:2rem;font-size:.7rem;background:'+(r.type==='FLEET'?'#0F2A4A':'#FF5A1F')+'">'+esc(initials(r.name))+'</span><span style="min-width:0;flex:1"><b style="display:block;font-size:.88rem">'+esc(r.name)+'</b><small class="muted">'+esc(r.district)+' · '+RSL[r.status]+'</small></span>'+tbadge(r.type)+'</button>'}).join('')||empty('bike','No riders match','Try another status or district.'))+'</div>';
  return '<div class="card"><div class="bar" style="gap:1rem"><div style="margin-right:auto"><h3>Live rider radar</h3><p class="sub">'+(q.city==='all'?'All cities':q.city+(q.dist==='all'?'':' · '+q.dist))+' · positions update every few seconds (simulated)</p></div><span class="pill ok"><i class="pulse"></i>Live</span></div>'+
   '<div class="bar"><div class="tabs sm" role="group" aria-label="City">'+cities.map(function(c){return chip('city',c,c==='all'?'All cities':c,q.city)}).join('')+'</div></div>'+
   (dists.length?'<div class="bar"><div class="tabs sm" role="group" aria-label="District">'+chip('dist','all','All districts',q.dist)+dists.map(function(d){return chip('dist',d,d,q.dist)}).join('')+'</div></div>':'')+
   '<div class="bar" style="gap:1rem"><div class="tabs sm" role="group" aria-label="Status">'+chip('st','all','All ('+all+')',q.st)+chip('st','idle','Online &amp; idle ('+idle+')',q.st)+chip('st','del','On delivery ('+del+')',q.st)+chip('st','off','Offline ('+off+')',q.st)+'</div><div class="tabs sm" role="group" aria-label="Rider model">'+chip('ty','all','All riders',q.ty)+chip('ty','FLEET','Fleet',q.ty)+chip('ty','PARTNER','Partner',q.ty)+'</div></div>'+
   '<div class="pad radar"><div><div class="mapbox"><svg id="radSvg" viewBox="0 0 800 520" role="group" aria-label="Rider map">'+radSvg(list)+'</svg></div><div class="acts" style="margin-top:.8rem;gap:1rem;font-size:.8rem"><span class="pill b-fleet">'+ic('shield')+'Fleet · square marker</span><span class="pill b-part">'+ic('bike')+'Partner · round marker</span><span class="muted">Ring colour: <b style="color:#12A150">idle</b> · <b style="color:#F59E0B">assigned</b> · <b style="color:#2563EB">pickup</b> · <b style="color:#7C3AED">drop-off</b> · <b>offline</b></span></div></div><div class="card pad" id="radSide" style="box-shadow:none">'+side+'</div></div></div>';
}
function tickRadar(){
  if(!RR||!cur()||cur().p!=='riders'||document.hidden)return;
  RR.forEach(function(r){if(!r.speed)return;var s=.0022*r.speed/30,b=r.bearing*Math.PI/180;r.x+=Math.sin(b)*s;r.y-=Math.cos(b)*s;r.bearing=(r.bearing+(Math.random()*16-8)+360)%360;
    if(r.x<.05||r.x>.95){r.bearing=(360-r.bearing)%360;r.x=Math.min(.95,Math.max(.05,r.x))}if(r.y<.05||r.y>.95){r.bearing=(540-r.bearing)%360;r.y=Math.min(.95,Math.max(.05,r.y))}});
  var svg=$('#radSvg');if(!svg)return;var list=radScope().filter(function(r){var q=U.rad;return q.st==='all'||(q.st==='idle'&&r.status==='idle')||(q.st==='del'&&(r.status==='assigned'||r.status==='transit_pickup'||r.status==='transit_dropoff'))||(q.st==='off'&&r.status==='offline')});
  if(U.rad.city!=='all'){svg.innerHTML=radSvg(list)}
  var s=RR.filter(function(r){return r.id===U.rad.sel})[0];if(s){var p=$('#rdPos');if(p)p.textContent=ltlg(s).join(', ')}
}
setInterval(function(){if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))tickRadar()},2500);
function rider(id){return RR.filter(function(r){return r.id===id})[0]}
function ledger(r){var a=r.id.length*13+r.name.length,R=function(){a=(a*1103515245+12345)&0x7fffffff;return a/0x7fffffff},pc={Standard:15,Silver:12,Gold:10}[r.tier],rows=[];for(var i=0;i<5;i++){var fare=1800+Math.floor(R()*3200),tip=R()>.5?Math.floor(R()*5)*100:0,cm=Math.round(fare*pc/100);rows.push([S.orders[(i*5+a)%S.orders.length].id,fare,tip,cm,fare-cm+tip])}return{rows:rows,pc:pc}}

Object.assign(A,{
 radF:function(el){var k=el.getAttribute('data-k'),v=el.getAttribute('data-v');U.rad[k]=v;if(k==='city')U.rad.dist='all';U.rad.sel=null;refresh()},
 radCity:function(el){U.rad.city=el.getAttribute('data-id');U.rad.dist='all';U.rad.sel=null;refresh()},
 radDist:function(el){U.rad.dist=U.rad.dist===el.getAttribute('data-id')?'all':el.getAttribute('data-id');refresh()},
 radSel:function(el){U.rad.sel=el.getAttribute('data-id');refresh()},
 radClose:function(){U.rad.sel=null;refresh()},
 radOrder:function(el,e){U.q.orders=el.getAttribute('data-id');U.tab.ordV='all';U.tab.ordS='all'},
 radSOS:function(el){var r=rider(el.getAttribute('data-id'));confirmM('Dispatch SOS for '+esc(r.name)+'?','The nearest ChowBuy hub and security partner in '+esc(r.district)+' are alerted with the rider’s live location.','Dispatch SOS',function(){upd(function(){log('SOS dispatched for '+r.name+' ('+r.district+')','warn')});toast('SOS dispatched for '+r.name+'. Nearest hub notified.','warn')},true)},
 radHub:function(el){var r=rider(el.getAttribute('data-id')),hubs=[];Object.keys(DIST[r.city]).forEach(function(d){hubs.push(d+' Hub A',d+' Hub B')});openM('<h3>Reassign hub</h3><p class="muted">'+esc(r.name)+' · currently '+esc(r.hub)+'</p>'+sel('hub','New hub',hubs.map(function(h){return[h,h]}),r.hub)+'<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Reassign</button></div>',function(v){r.hub=v.hub;log(r.name+' reassigned to '+v.hub,'pin');save();refresh();toast(r.name+' reassigned to '+v.hub)})},
 radMaint:function(el){var r=rider(el.getAttribute('data-id'));openM('<h3>Log bike maintenance</h3><p class="muted">'+esc(r.plate)+' · '+esc(r.name)+'</p>'+sel('kind','Service type',[['Routine service','Routine service'],['Tyre replacement','Tyre replacement'],['Brake repair','Brake repair'],['Accident damage','Accident damage']],'Routine service')+inp('note','Notes','','maxlength="120" placeholder="Optional"')+'<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Save log</button></div>',function(v){r.maint.push(v.kind);log('Maintenance logged for '+r.plate+': '+v.kind,'settings');save();toast('Maintenance logged for '+r.plate+' · '+v.kind)})},
 radShift:function(el){var r=rider(el.getAttribute('data-id'));openM('<h3>Shift check-in</h3><p class="muted">'+esc(r.name)+' · '+esc(r.hub)+'</p><div class="kv"><span>Scheduled shift</span><b>'+r.shift+'</b><span>Checked in at</span><b class="mono">'+(r.status==='offline'?'Not checked in':r.checkin)+'</b><span>Company bike</span><b class="mono">'+esc(r.plate)+'</b></div><div class="ft"><button type="submit" class="btn pri">Done</button></div>',function(){})},
 radLedger:function(el){var r=rider(el.getAttribute('data-id')),L=ledger(r);openM('<h3>Earnings ledger</h3><p class="muted">'+esc(r.name)+' · '+r.tier+' tier · '+L.pc+'% commission</p><div class="tw"><table class="t" style="min-width:0"><thead><tr><th>Order</th><th class="r">Fare</th><th class="r">Tip</th><th class="r">Commission</th><th class="r">Net</th></tr></thead><tbody>'+L.rows.map(function(x){return '<tr><td class="mono">'+x[0]+'</td><td class="r mono">'+ngn(x[1])+'</td><td class="r mono">'+ngn(x[2])+'</td><td class="r mono">'+ngn(x[3])+'</td><td class="r mono"><b>'+ngn(x[4])+'</b></td></tr>'}).join('')+'</tbody></table></div><div class="ft"><button type="submit" class="btn pri">Done</button></div>',function(){})},
 radTier:function(el){var r=rider(el.getAttribute('data-id'));openM('<h3>Adjust commission tier</h3><p class="muted">'+esc(r.name)+' · currently '+r.tier+'</p>'+sel('tier','Tier',[['Standard','Standard · 15% commission'],['Silver','Silver · 12% commission'],['Gold','Gold · 10% commission']],r.tier)+'<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Apply tier</button></div>',function(v){r.tier=v.tier;log(r.name+' moved to '+v.tier+' tier','settings');save();refresh();toast(r.name+' is now on the '+v.tier+' tier.')})},
 radDocs:function(el){var r=rider(el.getAttribute('data-id'));openM('<h3>Verify vehicle papers</h3><p class="muted">'+esc(r.name)+' · '+esc(r.plate)+'</p><label class="acts" style="gap:.6rem;flex-wrap:nowrap"><input type="checkbox" name="reg" value="1" style="width:auto"'+(r.papers?' checked':'')+'> Vehicle registration checked</label><label class="acts" style="gap:.6rem;flex-wrap:nowrap"><input type="checkbox" name="ins" value="1" style="width:auto"'+(r.papers?' checked':'')+'> Insurance certificate valid</label><div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Save</button></div>',function(v){if(!(v.reg&&v.ins)&&false)return'';r.papers=!!(document.querySelector('#mf [name=reg]').checked&&document.querySelector('#mf [name=ins]').checked);log(r.name+' papers '+(r.papers?'verified':'marked pending'),'kyc');save();refresh();toast(r.name+(r.papers?': vehicle papers verified.':': papers marked pending.'),r.papers?'':'warn')})},
 /* profile */
 avPick:function(){$('#avFile').click()},
 avRemove:function(){upd(function(){S.profile.avatarUrl='';audit('Profile photo removed')});toast('Profile photo removed.')},
 avColor:function(el){upd(function(){S.profile.avatarUrl='';S.profile.avatarColor=Number(el.getAttribute('data-id'))});toast('Badge updated.')},
 eye:function(el){var i=$('#'+el.getAttribute('data-id'));i.type=i.type==='password'?'text':'password'},
 revoke:function(el){var s=S.sessions.filter(function(x){return x.id===el.getAttribute('data-id')})[0];confirmM('Revoke this session?',esc(s.device)+' in '+esc(s.loc)+' will be signed out immediately.','Revoke',function(){upd(function(){S.sessions=S.sessions.filter(function(x){return x.id!==s.id});audit('Revoked session: '+s.device+' ('+s.loc+')')});toast('Session revoked.','warn')},true)},
 tfa:function(){
   if(S.profile.twoFactor){confirmM('Turn off two-factor authentication?','Your account will rely on your password alone.','Turn off',function(){upd(function(){S.profile.twoFactor=false;audit('Two-factor authentication disabled')});toast('2FA turned off.','warn')},true);return}
   openM('<h3>Set up authenticator app</h3><p class="muted">Scan this demonstration code in Google Authenticator, Authy or 1Password. It is not a real secret, so it will not generate working codes.</p><div style="display:grid;justify-items:center;gap:.6rem">'+qrSvg()+'<code class="mono" style="font-size:.9rem">JBSW Y3DP EHPK 3PXP</code></div>'+inp('code','6-digit verification code','','inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="one-time-code"')+'<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Verify and enable</button></div>',function(v){if(!/^\d{6}$/.test(v.code))return 'Enter the 6-digit code from your app.';upd(function(){S.profile.twoFactor=true;audit('Two-factor authentication enabled')});toast('Two-factor authentication enabled.')})},
 /* payments */
 paysw:function(el){var p=el.getAttribute('data-id'),D=pe();setPath(D,p,!getPath(D,p));refresh()},
 payenv:function(el){var p=el.getAttribute('data-id'),D=pe();D[p].isLive=el.getAttribute('data-v')==='live';U.conn[p]='';refresh();if(D[p].isLive)toast('Live mode uses real money. Make sure you use pk_live_ keys.','warn')},
 reveal:function(el){var id=el.getAttribute('data-id');U.reveal[id]=!U.reveal[id];refresh()},
 copy:function(el){copyText(el.getAttribute('data-v'))},
 testPay:function(el){
   var p=el.getAttribute('data-id'),D=pd()[p],key=p==='korapay'?D.publicKey:D.apiKey,env=D.isLive?'live':'test',has=function(k){return (D.raw&&D.raw[k])||(D.hints&&D.hints[k])};
   var bad=!/^pk_(test|live)_[A-Za-z0-9]{6,}$/.test(key||'')?'Enter a valid public key (pk_'+env+'_…)':key.indexOf('pk_'+env+'_')!==0?'Key does not match '+(D.isLive?'Live':'Sandbox')+' mode':!has('secretKey')?'Add the secret key first':!/^https:\/\//.test(D.webhookUrl||'')?'Webhook URL must start with https://':'';
   if(bad){U.conn[p]='fail:'+bad;refresh();toast(bad,'err');return}
   U.conn[p]='testing';refresh();setTimeout(function(){U.conn[p]='ok';refresh();toast((p==='korapay'?'Korapay':'Pocketfi')+' responded. Connection looks good (simulated check).')},1100)},
 payDiscard:function(){U.pdraft=null;refresh();toast('Unsaved payment changes discarded.')},
 paySave:function(){
   if(!pDirty()){toast('No payment changes to save.','warn');return}
   var D=U.pdraft,bad='';
   [['korapay','publicKey','Korapay public key'],['pocketfi','apiKey','Pocketfi API key']].forEach(function(x){var v=D[x[0]][x[1]];if(!bad&&D[x[0]].enabled){var env=D[x[0]].isLive?'live':'test';if(!new RegExp('^pk_'+env+'_[A-Za-z0-9]{6,}$').test(v||''))bad=x[2]+' must look like pk_'+env+'_… for '+(D[x[0]].isLive?'Live':'Sandbox')+' mode.'}});
   ['korapay','pocketfi'].forEach(function(p){if(!bad&&D[p].enabled&&!/^https:\/\//.test(D[p].webhookUrl||''))bad='The '+p+' webhook URL must start with https://'});
   ['korapay','pocketfi'].forEach(function(p){var r=D[p].raw||{};Object.keys(r).forEach(function(k){if(!bad&&r[k].length<12)bad='That secret looks too short. Paste the full key.'})});
   if(!(Number(D.cod.maxOrder)>0))bad=bad||'COD maximum must be greater than zero.';if(!(Number(D.cod.riderLimit)>0))bad=bad||'Rider cash limit must be greater than zero.';
   if(bad){toast(bad,'err');return}
   ['korapay','pocketfi'].forEach(function(p){var r=D[p].raw||{};Object.keys(r).forEach(function(k){D[p].hints=D[p].hints||{};D[p].hints[k]=mask(r[k])});delete D[p].raw});
   D.cod.maxOrder=Number(D.cod.maxOrder);D.cod.riderLimit=Number(D.cod.riderLimit);D.pocketfi.expiry=Number(D.pocketfi.expiry);
   upd(function(){S.pay=D;U.pdraft=null;log('Payment gateway settings updated','settings');audit('Payment gateway settings updated')});toast('Payment settings saved. Secrets are stored masked only.')},
 /* maps */
 mapsw:function(){var D=me();D.enabled=!D.enabled;refresh()},
 mapTheme:function(el){me().theme=el.getAttribute('data-id');refresh()},
 testMap:function(){var D=md(),js=(D.raw&&D.raw.js)||'';
   var bad=!js&&!(D.hints&&D.hints.js)?'Add a Maps JavaScript API key first':(js&&!/^AIza[0-9A-Za-z_-]{35}$/.test(js))?'That does not look like a Google API key (AIza… 39 characters)':'';
   if(bad){U.conn.map='fail:'+bad;S.maps.status='none';refresh();toast(bad,'err');return}
   U.conn.map='testing';refresh();setTimeout(function(){U.conn.map='ok';S.maps.status='ok';save();refresh();toast('Key format valid and quota looks healthy (simulated check).')},1100)},
 mapDiscard:function(){U.mdraft=null;refresh();toast('Unsaved map changes discarded.')},
 mapSave:function(){if(!mDirty()){toast('No map changes to save.','warn');return}var D=U.mdraft,r=D.raw||{},bad='';
   if(r.js&&!/^AIza[0-9A-Za-z_-]{35}$/.test(r.js))bad='The Maps JavaScript key does not look valid.';if(!bad&&r.geo&&r.geo.length<20)bad='The Geocoding key looks too short.';if(!bad&&r.dir&&r.dir.length<20)bad='The Directions key looks too short.';
   if(bad){toast(bad,'err');return}
   Object.keys(r).forEach(function(k){D.hints=D.hints||{};D.hints[k]=r[k].slice(0,4)+'••••'+r[k].slice(-4)});delete D.raw;D.status=S.maps.status;
   upd(function(){S.maps=D;U.mdraft=null;log('Map settings updated','settings')});toast('Map settings saved.')}
});
Object.assign(FORMS,{
 profile:function(f){var pf=U.pf||S.profile,n=(pf.name||'').trim(),e=(pf.email||'').trim(),ph=String(pf.phone||'').replace(/[\s-]/g,'');
   if(n.length<2){toast('Enter your full name.','err');return}
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){toast('Enter a valid email address.','err');return}
   if(!/^(\+234|0)[789][01]\d{8}$/.test(ph)){toast('Use a Nigerian number like +234 803 555 0142 or 0803 555 0142.','err');return}
   upd(function(){S.profile.name=n;S.profile.email=e;S.profile.phone=pf.phone;U.pf=null;audit('Profile details updated')});toast('Profile saved.')},
 pw:function(f){var c=$('#pw0').value,v=$('#pw1').value,m=$('#pw2').value;
   if(!c){toast('Enter your current password.','err');return}
   if(pwRules(v).some(function(r){return!r[1]})){toast('New password does not meet all the requirements.','err');return}
   if(v===c){toast('Choose a password different from your current one.','err');return}
   if(v!==m){toast('The two new passwords do not match.','err');return}
   var out=$('#pwOut').checked,n=S.sessions.filter(function(s){return!s.cur}).length;
   upd(function(){if(out)S.sessions=S.sessions.filter(function(s){return s.cur});audit('Password changed'+(out?'. '+n+' other session'+(n===1?'':'s')+' signed out':''))});
   toast('Password updated'+(out&&n?'. '+n+' other session'+(n===1?'':'s')+' signed out.':'.'))}
});
Object.assign(INP,{
 pf:function(k,v){U.pf=U.pf||clone(S.profile);U.pf[k]=v;var b=document.querySelectorAll('[data-act=avColor]');refresh()},
 pay:function(k,v){var D=pe();if(/(maxOrder|riderLimit)$/.test(k))v=v.replace(/\D/g,'');if(/\.raw\./.test(k)&&v===''){delPath(D,k)}else setPath(D,k,v);refresh()},
 maps:function(k,v){var D=me();if(k.indexOf('raw.')===0&&v===''){delPath(D,k)}else setPath(D,k,v);refresh()}
});
Object.assign(CHG,{
 pay:function(k,v){var D=pe();setPath(D,k,/expiry/.test(k)?Number(v):v);refresh()}
});
function onAvatar(file,input){
  if(!file)return;
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)){toast('Unsupported file. Use JPEG, PNG or WebP.','err');input.value='';return}
  if(file.size>5*1024*1024){toast('That photo is '+(file.size/1048576).toFixed(1)+' MB. The limit is 5 MB.','err');input.value='';return}
  var fr=new FileReader();fr.onload=function(){var im=new Image();im.onload=function(){var s=Math.min(im.naturalWidth,im.naturalHeight),c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(im,(im.naturalWidth-s)/2,(im.naturalHeight-s)/2,s,s,0,0,256,256);
    var url=c.toDataURL('image/jpeg',.85);upd(function(){S.profile.avatarUrl=url;audit('Profile photo updated')});toast('Profile photo updated.')};im.onerror=function(){toast('That image could not be read.','err')};im.src=fr.result};fr.onerror=function(){toast('Could not read that file.','err')};fr.readAsDataURL(file);
}

/* ---------- EXT2: realtime & push credentials, chat supervision ---------- */
function RTDEF(){return{provider:'livekit',
  livekit:{url:'wss://chowbuy.livekit.cloud',apiKey:'APIk3Vx9Qm2LdT',hints:{}},
  agora:{appId:'',hints:{}},
  proxy:{provider:'termii',pool:'+234 700 555 0100 to 0199',hints:{}},
  push:{provider:'fcm',fcm:{projectId:'chowbuy-prod',hints:{}},onesignal:{appId:'',hints:{}}}}}
var BADWORDS={prof:['idiot','stupid','useless','fool','nonsense','shut up'],har:['i know where you live','i will find you','meet me tonight','send me your photo'],pay:['send money','bank transfer','account number','pay me','transfer to my account','opay','palmpay','moniepoint','cancel the order'],ph:[]};
function CHATDEF(){return{retention:90,filters:[
  {id:'prof',name:'Profanity and insults',on:true,action:'mask',words:BADWORDS.prof.slice()},
  {id:'har',name:'Harassment and threats',on:true,action:'block',words:BADWORDS.har.slice()},
  {id:'pay',name:'Off-platform payment',on:true,action:'block',words:BADWORDS.pay.slice()},
  {id:'ph',name:'Phone numbers and contact sharing',on:true,action:'mask',words:[],builtin:true}],
  threads:[],locked:{},reviewed:{},broadcasts:[],audit:[],seeded:false}}
function ensureExt2(){
  if(!S.rt)S.rt=RTDEF();
  if(!S.chat)S.chat=CHATDEF();
  if(!S.chat.seeded)seedChats();
}
var EMERG=[
  ['flood','Heavy rain or flooding','Heavy rain is affecting deliveries in your area. Riders are taking safer routes, so your order may arrive a little later than estimated. Thank you for your patience.'],
  ['security','Security alert','There is a security alert in your delivery area. For everyone\'s safety, riders may wait at a safe point nearby. Please keep your phone close and stay reachable.'],
  ['outage','Delay or platform issue','We are working through a temporary delay. Your order is safe and riders are still on the way. We will update your ETA as soon as we can.'],
  ['safety','Rider safety check','ChowBuy Support is checking in. If you feel unsafe at any point, tell us here or use the SOS button in the app and we will respond immediately.']];
U.chSel=null;U.chF='all';U.chmsg='';U.chTest='';U.chBc={id:'flood',city:'all'};
function chRe(w){return new RegExp('(^|[^a-z0-9])'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z0-9]|$)','i')}
/* returns [{id,name,action}] for each enabled category the text trips */
function chScreen(text){
  var out=[],t=String(text||''),digits=t.replace(/[\s-]/g,'');
  S.chat.filters.forEach(function(f){if(!f.on)return;
    var hit=f.builtin?/(\+?234|\b0)[789][01]\d{8}/.test(digits):f.words.some(function(w){return w&&chRe(w).test(t)});
    if(hit)out.push({id:f.id,name:f.name,action:f.action})});
  return out}
function chAudit(t){S.chat.audit.unshift({t:t,ts:Date.now()});if(S.chat.audit.length>30)S.chat.audit.length=30}
function seedChats(){
  var c=S.chat,live=S.orders.filter(function(o){return o.rider&&o.status!=='cancelled'&&o.status!=='pending'}).slice(0,9),now=Date.now(),
   scripts=[
    [['rider','Arrived at restaurant, food is being packed.'],['customer','Address is 100% correct, gate is open.'],['rider','On the road now, heading straight to you!']],
    [['rider','Heavy traffic on the expressway, ETA updated.'],['customer','Please call me when you reach the gate.'],['rider','I have arrived outside your gate/compound.']],
    [['rider','Just send the money to my account directly, I will cancel the order and bring it cheaper.'],['customer','No, I will pay on the app.'],['rider','Send money now, account number 0123456789 opay.']],
    [['customer','Where are you? You are useless, this is nonsense.'],['rider','Sorry, traffic is heavy. I am close.']],
    [['customer','I am waiting at the estate security post.'],['rider','Okay, call me on 08031234567 so I find you quickly.']],
    [['rider','I know where you live, come outside now.'],['customer','Please stop, I am reporting this.']],
    [['rider','On the road now, heading straight to you!'],['customer','Kindly drop it with security/reception.']],
    [['customer','Nearest landmark is the white gate opposite the pharmacy.'],['rider','Thanks, nearly there.']],
    [['rider','Arrived at restaurant, food is being packed.'],['customer','Okay thanks.']]];
  c.threads=live.map(function(o,i){var sc=scripts[i%scripts.length];
    return{id:'CT'+(500+i),orderId:o.id,customer:o.customer,rider:o.rider,city:o.city,msgs:sc.map(function(m,j){return{id:'m'+i+'-'+j,from:m[0],t:m[1],ts:now-(sc.length-j)*70000-i*240000}})}});
  c.seeded=true}
function chFlags(th){var n=0;th.msgs.forEach(function(m){if(m.from!=='support'&&!S.chat.reviewed[m.id]&&chScreen(m.t).length)n++});return n}
function chRedact(t){return String(t).replace(/(\+?234|\b0)[789][01][\s-]?\d{3}[\s-]?\d{4}/g,function(m){return m.slice(0,4)+'••••'+m.slice(-2)})}
function chSetTabs(){return tabs('chatTab',[['live','Live chats'],['filters','Keyword filters'],['broadcast','Emergency broadcast'],['audit','Audit log']])}
function vChats(){
  var tab=T('chatTab','live'),body='';
  if(tab==='live')body=chLive();else if(tab==='filters')body=chFilters();else if(tab==='broadcast')body=chBroadcast();else body=chAuditV();
  var c=S.chat,fl=c.threads.reduce(function(a,t){return a+chFlags(t)},0);
  return head('Chat supervision','Monitor customer and rider chats, enforce keyword rules and step in when needed.','<span class="pill '+(fl?'warn':'ok')+'">'+ic(fl?'alert':'shield')+(fl?fl+' flagged to review':'Nothing flagged')+'</span>')+chSetTabs()+body}
function chLive(){
  var c=S.chat,fil=U.chF,list=c.threads.filter(function(t){return fil==='all'||(fil==='flag'&&chFlags(t)>0)||(fil==='lock'&&c.locked[t.id])});
  var sel=find(c.threads,U.chSel);if(!sel&&list.length){sel=list[0];U.chSel=sel.id}
  var chip=function(v,l){return '<button type="button" data-act="chF" data-v="'+v+'" aria-pressed="'+(fil===v)+'">'+l+'</button>'};
  var rows=list.map(function(t){var last=t.msgs[t.msgs.length-1],n=chFlags(t);
    return '<button type="button" class="rl" data-act="chSel" data-id="'+t.id+'" aria-pressed="'+(sel&&sel.id===t.id)+'" style="'+(sel&&sel.id===t.id?'background:var(--accent-soft)':'')+'"><span class="tile" style="width:2rem;height:2rem;font-size:.7rem;background:#0F2A4A">'+ic('chat')+'</span><span style="min-width:0;flex:1;text-align:left"><b style="display:block;font-size:.88rem">'+esc(t.orderId)+' · '+esc(t.rider)+'</b><small class="muted" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(chRedact(last.t))+'</small></span>'+(c.locked[t.id]?'<span class="pill bad">Locked</span>':n?'<span class="pill warn">'+n+' flagged</span>':'')+'</button>'}).join('')||empty('chat','No chats here','Try another filter.');
  return '<div class="card"><div class="bar"><div class="tabs sm" role="group" aria-label="Chat filter">'+chip('all','All ('+c.threads.length+')')+chip('flag','Flagged')+chip('lock','Locked')+'</div></div><div class="pad radar"><div style="display:grid;gap:.1rem;align-content:start;max-height:36rem;overflow:auto">'+rows+'</div><div class="card pad" style="box-shadow:none">'+(sel?chThread(sel):empty('chat','Pick a conversation','Chats update in real time in production.'))+'</div></div></div>';
}
function chThread(t){
  var c=S.chat,lk=!!c.locked[t.id],msgs=t.msgs.map(function(m){
    var fl=m.from==='support'?[]:chScreen(m.t),rev=!!c.reviewed[m.id],who=m.from==='customer'?t.customer:m.from==='rider'?t.rider:'ChowBuy Support';
    return '<div style="padding:.6rem .8rem;border-radius:.9rem;border:1px solid '+(fl.length&&!rev?'var(--amber)':'var(--line)')+';background:'+(m.from==='support'?'var(--accent-soft)':fl.length&&!rev?'var(--amber-soft)':'var(--card)')+'"><div class="acts" style="justify-content:space-between;flex-wrap:nowrap"><b style="font-size:.8rem">'+esc(who)+' <span class="muted" style="font-weight:600">· '+(m.from==='support'?'Support':m.from==='customer'?'Customer':'Rider')+'</span></b><small class="muted nw">'+fdt(m.ts)+'</small></div><div style="margin-top:.2rem">'+esc(chRedact(m.t))+'</div>'+(fl.length?'<div class="acts" style="margin-top:.4rem">'+fl.map(function(f){return '<span class="pill '+(rev?'':'warn')+'">'+ic('alert')+esc(f.name)+' · '+(f.action==='block'?'would block':f.action==='mask'?'would mask':'flag only')+'</span>'}).join('')+(rev?'<small class="muted">Reviewed</small>':btn('Mark reviewed','chRev',m.id))+'</div>':'')+'</div>'}).join('');
  return '<div class="acts" style="justify-content:space-between;flex-wrap:nowrap"><div><b>'+esc(t.orderId)+'</b><small class="muted" style="display:block">'+esc(t.customer)+' with '+esc(t.rider)+' · '+esc(t.city)+'</small></div><div class="acts"><a class="btn sm" href="#/orders">'+ic('list')+'Order</a>'+btn(ic('ban')+(lk?'Unlock chat':'Lock chat'),'chLock',t.id,lk?'':'danger')+'</div></div>'+
   '<div style="display:grid;gap:.5rem;margin:1rem 0;max-height:22rem;overflow:auto">'+msgs+'</div>'+
   (lk?'<p class="sub"><span class="pill bad">'+ic('ban')+'Locked</span> Customer and rider can no longer send messages. Only ChowBuy Support can post.</p>':'')+
   '<div class="f"><label for="chMsg">Step in as ChowBuy Support</label><textarea id="chMsg" data-fid="chMsg" data-in="chat:msg" rows="2" maxlength="300" placeholder="Visible to both the customer and the rider">'+esc(U.chmsg)+'</textarea></div>'+
   '<div class="acts" style="margin-top:.6rem">'+btn(ic('check')+'Send to both','chSay',t.id,'pri')+'<span class="muted" style="font-size:.8rem">or send an emergency message:</span>'+EMERG.map(function(e){return btn(e[1],'chEmerg',t.id+'|'+e[0])}).join('')+'</div>';
}
function chFilters(){
  var c=S.chat,res=U.chTest?chScreen(U.chTest):[];
  var cards=c.filters.map(function(f){
    var words=f.builtin?'<p class="sub">Detects Nigerian mobile numbers written in any common format, including spaces and dashes.</p>':'<div class="chips" style="margin:.7rem 0">'+(f.words.map(function(w,i){return '<span class="pill" style="gap:.35rem">'+esc(w)+'<button type="button" data-act="chDel" data-id="'+f.id+'|'+i+'" aria-label="Remove '+esc(w)+'" style="display:inline-grid;place-items:center">'+ic('x')+'</button></span>'}).join('')||'<small class="muted">No keywords yet.</small>')+'</div><form data-form="chword" data-id="'+f.id+'" class="acts" style="flex-wrap:nowrap"><input name="w" aria-label="Add keyword to '+esc(f.name)+'" placeholder="Add a word or phrase" maxlength="40" autocomplete="off"><button type="submit" class="btn sm">'+ic('plus')+'Add</button></form>';
    return '<div class="card pad"><div class="acts" style="justify-content:space-between;flex-wrap:nowrap"><div><h3>'+esc(f.name)+'</h3><p class="sub">'+(f.builtin?'Built-in pattern':f.words.length+' keywords')+'</p></div>'+sw(f.on,'chFon',f.id,'Enable '+f.name)+'</div>'+
     (f.on?'<div class="f" style="margin-top:.8rem"><label for="act-'+f.id+'">When matched</label><select id="act-'+f.id+'" data-ch="chat:act.'+f.id+'"><option value="block"'+(f.action==='block'?' selected':'')+'>Block the message and tell the sender why</option><option value="mask"'+(f.action==='mask'?' selected':'')+'>Mask the words and deliver, flag for review</option><option value="flag"'+(f.action==='flag'?' selected':'')+'>Deliver as is, flag for review</option></select></div>'+words:'<p class="sub" style="margin-top:.8rem">This filter is off.</p>')+'</div>'}).join('');
  return '<div class="card pad" style="background:var(--accent-soft);border-color:transparent;display:flex;gap:.8rem">'+ic('shield')+'<div><b>The server enforces these rules.</b><div class="muted" style="font-size:.88rem">The customer app also pre-checks phone numbers and off-platform payment phrases for faster feedback, but only the server decides what is delivered. Rules apply to the customer app, the rider app and in-app chat history.</div></div></div>'+
   '<div class="grid g2" style="align-items:start">'+cards+'</div>'+
   '<div class="card pad"><h3>Test a message</h3><p class="sub">Type something a customer or rider might send and see what the current rules would do.</p><div class="f" style="margin-top:.8rem"><label for="chT">Sample message</label><input id="chT" data-fid="chT" data-in="chat:test" value="'+esc(U.chTest)+'" placeholder="e.g. just send money to my account" autocomplete="off"></div><div class="acts" style="margin-top:.8rem">'+(!U.chTest?'<span class="muted">Waiting for a message…</span>':res.length?res.map(function(r){return '<span class="pill warn">'+ic('alert')+esc(r.name)+' · '+(r.action==='block'?'blocked':r.action==='mask'?'masked and flagged':'flagged')+'</span>'}).join(''):'<span class="pill ok">'+ic('check')+'Would be delivered</span>')+'</div></div>'+
   '<div class="card pad"><h3>Chat history</h3><div class="f" style="margin-top:.6rem;max-width:22rem"><label for="chRet">Keep chat logs for</label><select id="chRet" data-ch="chat:ret"><option value="30"'+(c.retention===30?' selected':'')+'>30 days</option><option value="90"'+(c.retention===90?' selected':'')+'>90 days</option><option value="180"'+(c.retention===180?' selected':'')+'>180 days</option></select><small>Logs are kept for disputes and safety reviews, then deleted.</small></div></div>';
}
function chBroadcast(){
  var b=U.chBc,m=EMERG.filter(function(e){return e[0]===b.id})[0],cities=['all'].concat(Object.keys(CITYN)),
   n=S.chat.threads.filter(function(t){return b.city==='all'||t.city===b.city}).length;
  return '<div class="grid g2" style="align-items:start"><div class="card pad"><h3>Send an emergency broadcast</h3><p class="sub">Posts a message from ChowBuy Support into every active chat in the area, and sends a push notification to the customer and rider.</p>'+
   '<div class="f" style="margin-top:1rem"><label for="bcM">Message</label><select id="bcM" data-ch="chat:bcm">'+EMERG.map(function(e){return '<option value="'+e[0]+'"'+(b.id===e[0]?' selected':'')+'>'+esc(e[1])+'</option>'}).join('')+'</select></div>'+
   '<div class="f" style="margin-top:.8rem"><label for="bcC">Audience</label><select id="bcC" data-ch="chat:bcc">'+cities.map(function(c){return '<option value="'+esc(c)+'"'+(b.city===c?' selected':'')+'>'+(c==='all'?'All cities':esc(c))+'</option>'}).join('')+'</select><small>'+n+' active chat'+(n===1?'':'s')+' will receive it.</small></div>'+
   '<div style="margin-top:1rem;padding:.9rem;border-radius:.9rem;background:var(--accent-soft)"><small class="muted">Preview</small><div style="margin-top:.3rem">'+esc(m[2])+'</div></div>'+
   '<div class="acts" style="margin-top:1rem">'+btn(ic('alert')+'Send broadcast','chBc',null,'danger',n?'':' disabled')+'</div></div>'+
   '<div class="card pad"><h3>Recent broadcasts</h3>'+(S.chat.broadcasts.length?'<div class="feed" style="margin-top:.6rem">'+S.chat.broadcasts.slice(0,8).map(function(x){return '<div class="it"><span class="ico w">'+ic('alert')+'</span><div><div>'+esc(x.title)+' · '+esc(x.city==='all'?'All cities':x.city)+'</div><small>'+x.count+' chats · '+fdt(x.ts)+'</small></div></div>'}).join('')+'</div>':'<p class="sub" style="margin-top:.6rem">Nothing sent yet.</p>')+'</div></div>';
}
function chAuditV(){
  var a=S.chat.audit;
  return '<div class="card pad"><h3>Supervisor activity</h3><p class="sub">Every intervention, lock, review and broadcast is recorded here.</p>'+(a.length?'<div class="feed" style="margin-top:.6rem">'+a.map(function(x){return '<div class="it"><span class="ico">'+ic('shield')+'</span><div><div>'+esc(x.t)+'</div><small>'+fdt(x.ts)+' · '+esc(S.profile.name)+'</small></div></div>'}).join('')+'</div>':'<p class="sub" style="margin-top:.6rem">No supervisor actions yet.</p>')+'</div>';
}

/* ---- realtime & push ---- */
function rd(){return U.rdraft||S.rt}
function re(){if(!U.rdraft)U.rdraft=clone(S.rt);return U.rdraft}
function rDirty(){return !!U.rdraft&&JSON.stringify(U.rdraft)!==JSON.stringify(S.rt)}
function seg(id,v,opts){return '<div class="tabs sm" role="group">'+opts.map(function(o){return '<button type="button" data-act="rtProv" data-id="'+id+'" data-v="'+o[0]+'" aria-pressed="'+(v===o[0])+'">'+o[1]+'</button>'}).join('')+'</div>'}
function rtCard(title,sub,inner,test,k){return '<div class="card pad"><h3>'+title+'</h3><p class="sub">'+sub+'</p><div style="display:grid;gap:.9rem;margin-top:1.1rem">'+inner+(test?'<div class="acts">'+btn(ic('zap')+test,'testRt',k,'')+connBadge(k)+'</div>':'')+'</div></div>'}
function vRealtime(){
  var D=rd(),dirty=rDirty(),L=D.livekit,Ag=D.agora,Px=D.proxy,P=D.push,saved=S.rt;
  var pub={realtime:{provider:saved.provider},push:{fcmEnabled:saved.push.provider==='fcm'}};
  if(saved.provider==='livekit')pub.realtime.livekitUrl=saved.livekit.url;if(saved.provider==='agora')pub.realtime.agoraAppId=saved.agora.appId;if(saved.push.provider==='onesignal')pub.push.onesignalAppId=saved.push.onesignal.appId;
  var lk=rtCard('LiveKit','In-app voice calls between customer and rider.',fld('rt','livekit.url','Server URL',L.url,{copy:1,ph:'wss://your-project.livekit.cloud'})+fld('rt','livekit.apiKey','API key',L.apiKey,{copy:1})+sfld('rt','livekit','apiSecret','API secret',L),'Test LiveKit credentials','rt-livekit');
  var ag=rtCard('Agora','Alternative voice provider. Select it above to use it.',fld('rt','agora.appId','App ID',Ag.appId,{copy:1,ph:'32 character App ID'})+sfld('rt','agora','certificate','App certificate',Ag),'Test Agora credentials','rt-agora');
  var px=rtCard('Masked call number','Call Rider connects through a ChowBuy number so neither side sees the other\'s real phone number.',
    '<div class="f"><label for="px-p">Provider</label><select id="px-p" data-ch="rt:proxy.provider"><option value="termii"'+(Px.provider==='termii'?' selected':'')+'>Termii Voice</option><option value="at"'+(Px.provider==='at'?' selected':'')+'>Africa\'s Talking</option><option value="twilio"'+(Px.provider==='twilio'?' selected':'')+'>Twilio Proxy</option></select></div>'+fld('rt','proxy.pool','Number pool',Px.pool)+sfld('rt','proxy','apiKey','Provider API key',Px),'Test number provider','rt-proxy');
  var fcm=rtCard('Firebase Cloud Messaging','Push to Android and, through APNs, to iOS.',fld('rt','push.fcm.projectId','Firebase project ID',P.fcm.projectId,{copy:1})+sfld('rt','push.fcm','serviceAccount','Service account JSON',P.fcm)+'<small class="muted">Paste the whole JSON from Firebase, Project settings, Service accounts. Only the account email is kept for display.</small>','Test FCM credentials','rt-fcm');
  var os=rtCard('OneSignal','Alternative to FCM. Select it above to use it.',fld('rt','push.onesignal.appId','App ID',P.onesignal.appId,{copy:1,ph:'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'})+sfld('rt','push.onesignal','restKey','REST API key',P.onesignal),'Test OneSignal credentials','rt-os');
  return head('Settings & pricing','Voice calls, masked numbers and push notifications for the customer and rider apps.',(dirty?'<span class="badge-un">Unsaved changes</span>'+btn('Discard','rtDiscard',null,''):'')+btn(ic('check')+'Save realtime settings','rtSave',null,'pri'))+setTabs()+
  '<div class="card pad" style="display:flex;gap:.8rem;align-items:flex-start;background:var(--accent-soft);border-color:transparent">'+ic('shield')+'<div><b>Secrets stay on the server.</b><div class="muted" style="font-size:.88rem">API secrets, the Agora certificate, the Firebase service account and the OneSignal REST key are shown masked after saving and are never sent to the apps. The apps receive only the public values on the right and a short-lived call token from <code>POST /calls/token</code>. In production, keep the real values in your server vault.</div></div></div>'+
  '<div class="grid g2" style="align-items:start"><div style="display:grid;gap:1rem"><div class="card pad"><h3>Voice call provider</h3><div style="margin-top:.8rem">'+seg('provider',D.provider,[['livekit','LiveKit'],['agora','Agora'],['off','Off']])+'</div><p class="sub" style="margin-top:.6rem">'+(D.provider==='off'?'In-app calls are hidden. Riders can still be called through the masked number.':'Customers see an In-app call button next to Call Rider.')+'</p></div>'+(D.provider==='agora'?ag+lk:lk+ag)+px+'</div>'+
  '<div style="display:grid;gap:1rem"><div class="card pad"><h3>Push provider</h3><div style="margin-top:.8rem">'+seg('push.provider',P.provider,[['fcm','FCM + APNs'],['onesignal','OneSignal']])+'</div></div>'+(P.provider==='onesignal'?os+fcm:fcm+os)+
  '<div class="card pad"><h3>Published to the apps</h3><p class="sub">Returned by <code>GET /config/public</code> from the last saved settings. No secrets.</p><pre class="mono" style="margin-top:.8rem;padding:.9rem;border-radius:.9rem;background:var(--fill,rgba(127,127,127,.1));overflow:auto;font-size:.78rem">'+esc(JSON.stringify(pub,null,2))+'</pre></div></div></div>';
}
Object.assign(A,{
 rtProv:function(el){var D=re();setPath(D,el.getAttribute('data-id'),el.getAttribute('data-v'));refresh()},
 rtDiscard:function(){U.rdraft=null;refresh();toast('Unsaved realtime changes discarded.')},
 testRt:function(el){
   var k=el.getAttribute('data-id'),D=rd(),has=function(o,key){return (o.raw&&o.raw[key])||(o.hints&&o.hints[key])},bad='';
   if(k==='rt-livekit')bad=!/^wss:\/\/[A-Za-z0-9.-]+/.test(D.livekit.url||'')?'Server URL must start with wss://':!/^[A-Za-z0-9]{8,}$/.test(D.livekit.apiKey||'')?'Enter the LiveKit API key':!has(D.livekit,'apiSecret')?'Add the API secret first':'';
   else if(k==='rt-agora')bad=!/^[0-9a-f]{32}$/i.test(D.agora.appId||'')?'App ID is 32 hex characters':!has(D.agora,'certificate')?'Add the App certificate first':'';
   else if(k==='rt-proxy')bad=!D.proxy.pool?'Enter the number pool':!has(D.proxy,'apiKey')?'Add the provider API key first':'';
   else if(k==='rt-fcm')bad=!D.push.fcm.projectId?'Enter the Firebase project ID':!has(D.push.fcm,'serviceAccount')?'Paste the service account JSON first':'';
   else bad=!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(D.push.onesignal.appId||'')?'App ID must be a UUID':!has(D.push.onesignal,'restKey')?'Add the REST API key first':'';
   if(bad){U.conn[k]='fail:'+bad;refresh();toast(bad,'err');return}
   U.conn[k]='testing';refresh();setTimeout(function(){U.conn[k]='ok';refresh();toast('Credentials look valid (format check only; the real handshake runs on your server).')},900)},
 rtSave:function(){
   if(!rDirty()){toast('No realtime changes to save.','warn');return}
   var D=U.rdraft,bad='',warnM='',has=function(o,key){return (o.raw&&o.raw[key])||(o.hints&&o.hints[key])};
   if(D.provider==='livekit'){
     if(!/^wss:\/\/[A-Za-z0-9.-]+/.test(D.livekit.url||''))bad='The LiveKit server URL must start with wss://';
     else if(!/^[A-Za-z0-9]{8,}$/.test(D.livekit.apiKey||''))bad='Enter the LiveKit API key.';
     else if(!has(D.livekit,'apiSecret'))warnM='LiveKit API secret'}
   if(!bad&&D.provider==='agora'){
     if(!/^[0-9a-f]{32}$/i.test(D.agora.appId||''))bad='The Agora App ID is 32 hex characters.';
     else if(!has(D.agora,'certificate'))warnM='Agora App certificate';
     else if(D.agora.raw&&D.agora.raw.certificate&&!/^[0-9a-f]{32}$/i.test(D.agora.raw.certificate))bad='The Agora certificate is 32 hex characters.'}
   if(!bad&&D.push.provider==='fcm'){
     if(!D.push.fcm.projectId)bad='Enter the Firebase project ID.';
     else if(!has(D.push.fcm,'serviceAccount'))warnM='Firebase service account';
     else if(D.push.fcm.raw&&D.push.fcm.raw.serviceAccount){try{var j=JSON.parse(D.push.fcm.raw.serviceAccount);if(!j.client_email||!j.private_key)bad='That JSON is missing client_email or private_key.';else D.push.fcm.hints.serviceAccount=j.client_email.slice(0,3)+'••••@'+j.client_email.split('@')[1]}catch(e){bad='The service account is not valid JSON.'}}}
   if(!bad&&D.push.provider==='onesignal'){
     if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(D.push.onesignal.appId||''))bad='The OneSignal App ID must be a UUID.';
     else if(!has(D.push.onesignal,'restKey'))warnM='OneSignal REST API key'}
   [['livekit'],['agora'],['proxy'],['push','fcm'],['push','onesignal']].forEach(function(p){var o=p.length===1?D[p[0]]:D[p[0]][p[1]],r=o.raw||{};Object.keys(r).forEach(function(k){if(!bad&&k!=='serviceAccount'&&r[k].length<12&&!(p[0]==='agora'))bad='That secret looks too short. Paste the full key.'})});
   if(bad){toast(bad,'err');return}
   [['livekit'],['agora'],['proxy'],['push','fcm'],['push','onesignal']].forEach(function(p){var o=p.length===1?D[p[0]]:D[p[0]][p[1]],r=o.raw||{};o.hints=o.hints||{};Object.keys(r).forEach(function(k){if(k!=='serviceAccount'||!o.hints.serviceAccount||true){if(k!=='serviceAccount')o.hints[k]=mask(r[k])}});delete o.raw});
   upd(function(){S.rt=D;U.rdraft=null;U.conn={};log('Realtime and push settings updated','settings');audit('Realtime and push settings updated')});toast(warnM?'Saved. Add the '+warnM+' before going live.':'Realtime settings saved. Secrets are stored masked only.',warnM?'warn':'')},
 /* chat supervision */
 chF:function(el){U.chF=el.getAttribute('data-v');U.chSel=null;refresh()},
 chSel:function(el){U.chSel=el.getAttribute('data-id');U.chmsg='';refresh()},
 chRev:function(el){var id=el.getAttribute('data-id');upd(function(){S.chat.reviewed[id]=true;chAudit('Marked a flagged message as reviewed')});toast('Marked as reviewed.')},
 chLock:function(el){var t=find(S.chat.threads,el.getAttribute('data-id')),lk=!!S.chat.locked[t.id];
   var go=function(){upd(function(){if(lk)delete S.chat.locked[t.id];else S.chat.locked[t.id]=true;chAudit((lk?'Unlocked chat ':'Locked chat ')+t.orderId)});toast(lk?'Chat unlocked.':'Chat locked. Only Support can post.',lk?'':'warn')};
   if(lk)go();else confirmM('Lock chat '+esc(t.orderId)+'?','The customer and rider will not be able to message each other. You can unlock it at any time.','Lock chat',go,true)},
 chSay:function(el){var t=find(S.chat.threads,el.getAttribute('data-id')),v=String(U.chmsg||'').trim();
   if(v.length<2){toast('Type a message first.','err');return}
   upd(function(){t.msgs.push({id:'s'+Date.now(),from:'support',t:v,ts:Date.now()});U.chmsg='';chAudit('Support message sent in '+t.orderId)});toast('Sent to the customer and rider.')},
 chEmerg:function(el){var p=el.getAttribute('data-id').split('|'),t=find(S.chat.threads,p[0]),e=EMERG.filter(function(x){return x[0]===p[1]})[0];
   upd(function(){t.msgs.push({id:'s'+Date.now(),from:'support',t:e[2],ts:Date.now()});chAudit('Emergency message "'+e[1]+'" sent in '+t.orderId)});toast('Emergency message sent.','warn')},
 chFon:function(el){var f=find(S.chat.filters,el.getAttribute('data-id'));upd(function(){f.on=!f.on;chAudit((f.on?'Enabled':'Disabled')+' keyword filter: '+f.name)})},
 chDel:function(el){var p=el.getAttribute('data-id').split('|'),f=find(S.chat.filters,p[0]),w=f.words[Number(p[1])];upd(function(){f.words.splice(Number(p[1]),1);chAudit('Removed keyword "'+w+'" from '+f.name)});toast('Keyword removed.')},
 chBc:function(){var b=U.chBc,m=EMERG.filter(function(e){return e[0]===b.id})[0],ts=S.chat.threads.filter(function(t){return b.city==='all'||t.city===b.city});
   confirmM('Send "'+esc(m[1])+'" to '+ts.length+' chat'+(ts.length===1?'':'s')+'?','This posts a message from ChowBuy Support and sends a push notification to every customer and rider involved.','Send broadcast',function(){
     upd(function(){var now=Date.now();ts.forEach(function(t,i){t.msgs.push({id:'b'+now+i,from:'support',t:m[2],ts:now})});S.chat.broadcasts.unshift({title:m[1],city:b.city,count:ts.length,ts:now});chAudit('Emergency broadcast "'+m[1]+'" to '+(b.city==='all'?'all cities':b.city)+' ('+ts.length+' chats)');log('Emergency broadcast: '+m[1],'warn')});toast('Broadcast sent to '+ts.length+' chats.','warn')},true)}
});
Object.assign(FORMS,{
 chword:function(f){var fl=find(S.chat.filters,f.getAttribute('data-id')),w=String(f.elements.w.value||'').trim().toLowerCase();
   if(w.length<2){toast('Enter at least 2 characters.','err');return}
   if(fl.words.indexOf(w)>-1){toast('That keyword is already in the list.','warn');return}
   upd(function(){fl.words.push(w);chAudit('Added keyword "'+w+'" to '+fl.name)});toast('Keyword added.')}
});
Object.assign(INP,{
 rt:function(k,v){var D=re();if(/\.raw\./.test(k)&&v===''){delPath(D,k)}else setPath(D,k,v);refresh()},
 chat:function(k,v){if(k==='msg')U.chmsg=v;else if(k==='test')U.chTest=v;refresh()}
});
Object.assign(CHG,{
 rt:function(k,v){setPath(re(),k,v);refresh()},
 chat:function(k,v){
   if(k.indexOf('act.')===0){var f=find(S.chat.filters,k.slice(4));upd(function(){f.action=v;chAudit('Changed action for '+f.name+' to '+v)});toast('Filter action updated.')}
   else if(k==='ret'){upd(function(){S.chat.retention=Number(v);chAudit('Chat retention set to '+v+' days')});toast('Retention updated.')}
   else if(k==='bcm'){U.chBc.id=v;refresh()}else if(k==='bcc'){U.chBc.city=v;refresh()}}
});

ensureExt();ensureExt2();
/* ---------- messaging: email settings, sign-in methods, broadcast email, push promotions ---------- */
Object.assign(IC,{
 mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
 send:'<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
 google:'<path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.300 3-7.200z" fill="#4285F4" stroke="none"/><path d="M12 22c2.700 0 5-.9 6.600-2.400l-3.200-2.500c-.9.600-2 1-3.400 1-2.600 0-4.800-1.800-5.600-4.100H3.100v2.600A10 10 0 0 0 12 22z" fill="#34A853" stroke="none"/><path d="M6.400 14c-.2-.6-.3-1.300-.3-2s.1-1.400.3-2V7.400H3.100a10 10 0 0 0 0 9.200z" fill="#FBBC05" stroke="none"/><path d="M12 5.900c1.500 0 2.800.5 3.800 1.500l2.800-2.800A10 10 0 0 0 3.100 7.400L6.400 10c.8-2.300 3-4.100 5.600-4.100z" fill="#EA4335" stroke="none"/>',
 apple:'<path d="M16.4 12.600c0-2.400 2-3.500 2.100-3.600-1.200-1.700-3-1.900-3.600-1.900-1.500-.2-3 .9-3.800.9-.8 0-2-.9-3.300-.9-1.700 0-3.300 1-4.100 2.500-1.800 3.100-.5 7.600 1.300 10.100.8 1.200 1.800 2.600 3.100 2.500 1.200 0 1.700-.8 3.200-.8s1.900.8 3.200.8c1.300 0 2.200-1.200 3-2.400.9-1.400 1.300-2.700 1.300-2.800 0 0-2.400-.9-2.400-3.800zM14 5.400c.7-.8 1.100-1.900 1-3-1 0-2.200.7-2.900 1.500-.6.700-1.200 1.900-1 3 1.100.1 2.200-.6 2.900-1.500z" fill="currentColor" stroke="none"/>'
});
ROUTES.splice(ROUTES.map(function(r){return r.p}).indexOf('settings')+1,0,
 {p:'broadcast-email',n:'Broadcast email',i:'mail',g:'Messaging',v:function(){return vBroadcast('email')}},
 {p:'push-promos',n:'Push promotions',i:'send',g:'Messaging',v:function(){return vBroadcast('push')}});
buildNav();

var EPROV=[
 ['resend','Resend','Recommended',  'Simple API and fast setup. Good default for a new product.','resend_api_key','API key','re_…'],
 ['ses','Amazon SES','Recommended','Lowest cost at high volume. Needs an AWS account and a verified sender or domain.','','',''],
 ['brevo','Brevo','Recommended','Friendly dashboard, includes SMTP and an API. Works well for marketing sends.','brevo_api_key','API key','xkeysib-…'],
 ['smtp','SMTP','','Any mail server: Zoho, Google Workspace, your host, or a transactional SMTP relay.','smtp_password','Password / app password',''],
 ['sendgrid','SendGrid','','Twilio SendGrid Web API.','sendgrid_api_key','API key','SG.…'],
 ['mailgun','Mailgun','','Mailgun HTTP API. Needs a verified sending domain.','mailgun_api_key','Private API key',''],
 ['postmark','Postmark','','Postmark API. Broadcasts use its "broadcast" message stream.','postmark_server_token','Server token','']];
function eprov(id){return EPROV.filter(function(p){return p[0]===id})[0]||EPROV[0]}
function EDEF(){return{email:{provider:'resend',fromName:'ChowBuy',fromEmail:'',replyTo:'',smtp:{host:'',port:587,secure:false,user:''},mailgun:{domain:'',region:'us'},ses:{region:'eu-west-1'},hints:{},raw:{}},
  auth:{google:false,apple:false},hist:[]}}
function ensureMsg(){
  if(!S.msg)S.msg=EDEF();var d=EDEF();
  ['smtp','mailgun','ses','hints','raw'].forEach(function(k){if(!S.msg.email[k])S.msg.email[k]=d.email[k]});
  if(!S.msg.auth)S.msg.auth=d.auth;if(!S.msg.hist)S.msg.hist=[];
  S.msg.email.raw={};   /* secrets are never kept in this browser */
}
ensureMsg();
U.edraft=null;U.econn='';U.bc={email:{roles:{customer:true,rider:false,merchant:false},subject:'',body:'',counts:null,busy:false,prog:null},push:{roles:{customer:true,rider:false,merchant:false},subject:'',body:'',counts:null,busy:false,prog:null}};
U.beMsg='';U.beBusy=false;U.hist=null;
function ee(){if(!U.edraft)U.edraft=clone(S.msg.email);return U.edraft}
function ed(){return U.edraft||S.msg.email}
function eDirty(){return !!U.edraft&&JSON.stringify(U.edraft)!==JSON.stringify(S.msg.email)}

/* ---- backend connection (Supabase). Without it everything here runs as a demo on this browser only. ---- */
var BE={url:'',anon:'',tok:'',who:''};
try{var _b=JSON.parse(localStorage.getItem('cb-admin-be')||'{}');BE.url=_b.url||'';BE.anon=_b.anon||'';BE.who=_b.who||''}catch(e){}
try{BE.tok=sessionStorage.getItem('cb-admin-tok')||''}catch(e){}
function beOn(){return !!(BE.url&&BE.anon&&BE.tok)}
function beSaveLocal(){try{localStorage.setItem('cb-admin-be',JSON.stringify({url:BE.url,anon:BE.anon,who:BE.who}))}catch(e){}try{if(BE.tok)sessionStorage.setItem('cb-admin-tok',BE.tok);else sessionStorage.removeItem('cb-admin-tok')}catch(e){}}
function beReq(path,method,body,tok){
  return fetch(BE.url.replace(/\/+$/,'')+path,{method:method||'GET',headers:{apikey:BE.anon,Authorization:'Bearer '+(tok||BE.tok||BE.anon),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})
   .then(function(r){return r.text().then(function(t){var j={};try{j=t?JSON.parse(t):{}}catch(e){}
     if(!r.ok){if(r.status===401&&BE.tok){BE.tok='';beSaveLocal()}throw new Error(j.message||j.msg||j.error_description||j.error||('Request failed ('+r.status+')'))}
     return j})},function(){throw new Error('Could not reach the server. Check the project URL and your connection.')});
}
function beFn(name,body){return beReq('/functions/v1/'+name,'POST',body||{})}
function beConnect(url,anon,email,pw){
  url=String(url||'').trim().replace(/\/+$/,'');anon=String(anon||'').trim();
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url))return Promise.reject(new Error('The project URL looks like https://xxxx.supabase.co'));
  if(anon.length<20)return Promise.reject(new Error('Paste the publishable (anon) key.'));
  BE.url=url;BE.anon=anon;
  return beReq('/auth/v1/token?grant_type=password','POST',{email:email,password:pw},anon).then(function(j){
    BE.tok=j.access_token;BE.who=email;beSaveLocal();
    return beReq('/functions/v1/admin-settings','GET').catch(function(e){BE.tok='';beSaveLocal();throw new Error(/admin/i.test(e.message)?'This account is not an admin.':'Signed in, but the admin functions are not deployed yet ('+e.message+').')});
  }).then(function(j){
    var h={};Object.keys(j.hints||{}).forEach(function(k){h[k]=j.hints[k].hint});S.msg.email.hints=h;if(U.edraft)U.edraft.hints=h;
    return Promise.all([beReq('/rest/v1/platform_settings?key=in.(email,public)&select=key,value','GET'),beReq('/rest/v1/broadcasts?select=*&order=created_at.desc&limit=15','GET')]);
  }).then(function(r){
    r[0].forEach(function(row){
      if(row.key==='email'){var m=S.msg.email;Object.keys(row.value).forEach(function(k){if(k!=='hints'&&k!=='raw')m[k]=row.value[k]})}
      if(row.key==='public'&&row.value.auth){S.msg.auth.google=!!(row.value.auth.google&&row.value.auth.google.enabled);S.msg.auth.apple=!!(row.value.auth.apple&&row.value.auth.apple.enabled)}});
    U.hist=r[1];save();
  });
}
function beDisconnect(){BE.tok='';beSaveLocal();U.hist=null}
function beCard(){
  if(beOn())return '<div class="card pad"><div class="acts" style="justify-content:space-between"><div><h3>Backend connected '+'<span class="pill ok">'+ic('checkc')+'Live</span></h3><p class="sub">Signed in as '+esc(BE.who)+'. Saving here writes to your Supabase project; broadcasts reach real users.</p></div>'+btn('Disconnect','beOff',null,'')+'</div></div>';
  return '<div class="card pad" style="border-color:var(--warn,#F59E0B)"><h3>Demo mode '+'<span class="pill warn">Not connected</span></h3><p class="sub">Nothing here reaches a real server or real users until you connect your Supabase project. Sign in with an admin account (a profile whose role is <code>admin</code>).</p>'+
   '<form data-form="beConnect" style="display:grid;gap:.8rem;margin-top:1rem"><div class="frow">'+inp('be-url','Project URL',BE.url,'placeholder="https://xxxx.supabase.co" autocomplete="off" spellcheck="false"')+inp('be-anon','Publishable key',BE.anon,'placeholder="sb_publishable_…" autocomplete="off" spellcheck="false"')+'</div><div class="frow">'+inp('be-em','Admin email',BE.who,'type="email" autocomplete="username"')+inp('be-pw','Password','','type="password" autocomplete="current-password"')+'</div>'+
   '<div class="acts"><button type="submit" class="btn pri sm"'+(U.beBusy?' disabled':'')+'>'+(U.beBusy?'Connecting…':'Connect')+'</button><small class="muted" role="status">'+esc(U.beMsg)+'</small></div></form><small class="muted" style="display:block;margin-top:.6rem">The password is sent only to Supabase to sign in and is not stored. The session ends when you close this tab.</small></div>';
}
FORMS.beConnect=function(f){
  var v=fd(f);U.beBusy=true;U.beMsg='';refresh();
  beConnect(v['be-url'],v['be-anon'],v['be-em'],v['be-pw']).then(function(){U.beBusy=false;U.beMsg='';refresh();toast('Connected to your backend.')},function(e){U.beBusy=false;U.beMsg=e.message;refresh();toast(e.message,'err')});
};

/* ---- Settings: Email ---- */
function vEmail(){
  var D=ed(),dirty=eDirty(),P=eprov(D.provider),live=beOn();
  var opts=EPROV.map(function(p){return '<option value="'+p[0]+'"'+(D.provider===p[0]?' selected':'')+'>'+p[1]+(p[2]?' (recommended)':'')+'</option>'}).join('');
  var inner='';
  if(D.provider==='smtp')inner=inp('em-host','SMTP host',D.smtp.host,'data-fid="em-host" data-in="email:smtp.host" placeholder="smtp.zoho.com" spellcheck="false"')+'<div class="frow">'+inp('em-port','Port',D.smtp.port,'data-fid="em-port" data-in="email:smtp.port" inputmode="numeric"')+sel('em-sec','Connection',[['false','STARTTLS (587)'],['true','SSL/TLS (465)']],String(!!D.smtp.secure)).replace('<select id="em-sec" name="em-sec">','<select id="em-sec" data-ch="email:smtp.secure">')+'</div>'+inp('em-user','Username',D.smtp.user,'data-fid="em-user" data-in="email:smtp.user" autocomplete="off" spellcheck="false"');
  if(D.provider==='mailgun')inner+=inp('em-mg','Sending domain',D.mailgun.domain,'data-fid="em-mg" data-in="email:mailgun.domain" placeholder="mg.chowbuy.ng" spellcheck="false"')+sel('em-mgr','Region',[['us','US'],['eu','EU']],D.mailgun.region).replace('<select id="em-mgr" name="em-mgr">','<select id="em-mgr" data-ch="email:mailgun.region">');
  if(D.provider==='ses')inner+=inp('em-ses','AWS region',D.ses.region,'data-fid="em-ses" data-in="email:ses.region" placeholder="eu-west-1" spellcheck="false"')+sfld('email','','ses_access_key_id','Access key ID',D)+sfld('email','','ses_secret_access_key','Secret access key',D);
  else inner+=sfld('email','',P[4],P[5],D);
  var other=live?'':'';
  return head('Settings & pricing','Email provider, sender identity and delivery test.',(dirty?'<span class="badge-un">Unsaved changes</span>'+btn('Discard','emDiscard',null,''):'')+btn(ic('check')+'Save email settings','emSave',null,'pri'))+setTabs()+
  '<div style="display:grid;gap:1rem">'+beCard()+
  '<div class="grid g2" style="align-items:start"><div class="card pad"><h3>Provider</h3><p class="sub">Used for broadcast emails and any email ChowBuy sends itself.</p><div style="display:grid;gap:.9rem;margin-top:1.1rem">'+
  '<div class="f"><label for="em-prov">Email provider</label><select id="em-prov" data-ch="email:provider">'+opts+'</select><small>'+esc(P[3])+'</small></div>'+inner+
  '<div class="acts">'+btn(ic('send')+'Send test email to me','emTest',null,'')+(U.econn==='ok'?'<span class="pill ok">'+ic('checkc')+'Sent</span>':U.econn&&U.econn.indexOf('fail')===0?'<span class="pill bad">'+ic('xc')+esc(U.econn.slice(5))+'</span>':U.econn==='testing'?'<span class="pill info">Sending…</span>':'')+'</div>'+
  (live?'':'<small class="muted">Test sending needs the backend connection above. In demo mode this only checks the form.</small>')+'</div></div>'+
  '<div style="display:grid;gap:1rem"><div class="card pad"><h3>Sender</h3><p class="sub">What recipients see. The address must be verified with your provider, and your domain needs SPF and DKIM set up or mail will land in spam.</p><div style="display:grid;gap:.9rem;margin-top:1.1rem">'+
  inp('em-fn','From name',D.fromName,'data-fid="em-fn" data-in="email:fromName" maxlength="60"')+inp('em-fe','From email',D.fromEmail,'data-fid="em-fe" data-in="email:fromEmail" type="email" placeholder="hello@chowbuy.ng" spellcheck="false"')+inp('em-rt','Reply-to (optional)',D.replyTo,'data-fid="em-rt" data-in="email:replyTo" type="email" placeholder="support@chowbuy.ng" spellcheck="false"')+'</div></div>'+
  '<div class="card pad" style="display:flex;gap:.8rem;align-items:flex-start;background:var(--accent-soft);border-color:transparent">'+ic('shield')+'<div><b>Secrets stay on the server.</b><div class="muted" style="font-size:.88rem">Keys and passwords are shown masked after saving and are never kept in this browser or sent to the apps. <br><br><b>Supabase sign-up and password-reset emails</b> (the confirmation link) are sent by Supabase Auth, not by this setting. To use the same provider for those, enter its SMTP details in your Supabase dashboard under Authentication, SMTP settings.</div></div></div></div></div></div>';
}
function eValidate(D){
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(D.fromEmail||''))return 'Enter a valid From email address.';
  if(!(D.fromName||'').trim())return 'Enter a From name.';
  if(D.replyTo&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(D.replyTo))return 'The reply-to address is not valid.';
  if(D.provider==='smtp'){if(!D.smtp.host)return 'Enter the SMTP host.';if(!(Number(D.smtp.port)>0&&Number(D.smtp.port)<65536))return 'Enter a valid port.';if(!D.smtp.user)return 'Enter the SMTP username.'}
  if(D.provider==='mailgun'&&!D.mailgun.domain)return 'Enter your Mailgun sending domain.';
  if(D.provider==='ses'&&!D.ses.region)return 'Enter the AWS region.';
  return '';
}
function eSecrets(D){var out={},P=eprov(D.provider),keys=D.provider==='ses'?['ses_access_key_id','ses_secret_access_key']:[P[4]];
  keys.forEach(function(k){if(D.raw&&D.raw[k])out[k]=D.raw[k]});return out}
function eMissing(D){var P=eprov(D.provider),keys=D.provider==='ses'?['ses_access_key_id','ses_secret_access_key']:[P[4]];
  return keys.filter(function(k){return !((D.raw&&D.raw[k])||(D.hints&&D.hints[k]))})}
Object.assign(INP,{email:function(k,v){var D=ee();if(k==='smtp.port')v=v.replace(/\D/g,'');if(/(^|\.)raw\./.test(k)&&v===''){delPath(D,k)}else setPath(D,k,v);refresh()}});
Object.assign(CHG,{email:function(k,v){var D=ee();if(k==='smtp.secure')v=(v==='true');setPath(D,k,v);U.econn='';refresh()}});
Object.assign(A,{
 beOff:function(){beDisconnect();refresh();toast('Disconnected. Back to demo mode.')},
 emDiscard:function(){U.edraft=null;refresh();toast('Unsaved email changes discarded.')},
 emSave:function(){
   if(!eDirty()){toast('No email changes to save.','warn');return}
   var D=U.edraft,bad=eValidate(D);if(bad){toast(bad,'err');return}
   var secrets=eSecrets(D),missing=eMissing(D);
   var done=function(){
     var keep=clone(D);Object.keys(secrets).forEach(function(k){keep.hints[k]=mask(secrets[k])});keep.raw={};
     upd(function(){S.msg.email=keep;U.edraft=null;U.econn='';log('Email provider set to '+eprov(keep.provider)[1],'settings');audit('Email settings updated')});
     toast(missing.length?'Saved. Add the '+eprov(keep.provider)[5].toLowerCase()+' before sending.':'Email settings saved.',missing.length?'warn':undefined)};
   if(!beOn()){done();return}
   var pub=clone(D);delete pub.raw;delete pub.hints;
   beFn('admin-settings',{email:pub,secrets:secrets}).then(done,function(e){toast(e.message,'err')});
 },
 emTest:function(){
   var D=ed(),bad=eValidate(D)||(eMissing(D).length?'Add the '+eprov(D.provider)[5].toLowerCase()+' first.':'');
   if(bad){U.econn='fail:'+bad;refresh();toast(bad,'err');return}
   if(eDirty()){U.econn='fail:Save your changes first';refresh();toast('Save your email settings first, then send the test.','warn');return}
   if(!beOn()){U.econn='fail:Connect the backend first';refresh();toast('Connect your backend above to send a real test.','warn');return}
   U.econn='testing';refresh();
   beFn('admin-broadcast',{kind:'email',roles:['customer'],test:true,subject:'ChowBuy test email',body:'This is a test from the ChowBuy Admin Console.\n\nIf you can read this, your email provider is set up correctly.'})
    .then(function(r){U.econn=r.sent?'ok':'fail:'+((r.errors&&r.errors[0])||'The provider rejected the message.');refresh();toast(r.sent?'Test email sent to your admin address.':U.econn.slice(5),r.sent?undefined:'err')},function(e){U.econn='fail:'+e.message;refresh();toast(e.message,'err')});
 }
});

/* ---- Settings: Sign-in methods ---- */
function vSignin(){
  var G=S.msg.auth.google,Ap=S.msg.auth.apple;
  function card(id,name,on,platforms,steps,icon){
    return '<div class="card pad"><div class="acts" style="justify-content:space-between;flex-wrap:nowrap"><div style="display:flex;gap:.8rem;align-items:center"><span class="ico" style="width:2.6rem;height:2.6rem;display:grid;place-items:center;border-radius:.8rem;background:var(--fill,rgba(127,127,127,.1))">'+ic(icon)+'</span><div><h3>Continue with '+name+'</h3><p class="sub">Shown on the customer app\'s login and sign-up screens · '+platforms+'</p></div></div>'+sw(on,'authsw',id,'Enable Continue with '+name)+'</div>'+
    '<div style="margin-top:1rem"><span class="pill '+(on?'ok':'')+'">'+(on?'Enabled':'Disabled')+'</span></div><ol class="muted" style="margin:1rem 0 0;padding-left:1.2rem;display:grid;gap:.4rem;font-size:.88rem">'+steps.map(function(s){return '<li>'+s+'</li>'}).join('')+'</ol></div>'}
  return head('Settings & pricing','Choose which sign-in options customers see in the app.')+setTabs()+
  '<div style="display:grid;gap:1rem">'+beCard()+
  '<div class="card pad" style="display:flex;gap:.8rem;align-items:flex-start;background:var(--accent-soft);border-color:transparent">'+ic('shield')+'<div><b>Switch a provider on only after it is configured.</b><div class="muted" style="font-size:.88rem">The toggle only shows or hides the button. The provider itself is set up in your Supabase dashboard under Authentication, Providers. If a button is on but the provider is not configured, customers will see an error when they tap it. Changes apply to the app within a minute or two.</div></div></div>'+
  '<div class="grid g2" style="align-items:start">'+
  card('google','Google',G,'Android and iOS',['In Google Cloud, create an OAuth client (Web application) and copy the client ID and secret.','In Supabase, Authentication, Providers, Google: paste them and enable it.','Add <code>chowbuy://auth-callback</code> to Supabase Authentication, URL Configuration, Redirect URLs.','Switch this on.'],'google')+
  card('apple','Apple',Ap,'iOS only. Hidden on Android',['In your Apple Developer account, enable Sign in with Apple for the app ID and create a Services ID and key.','In Supabase, Authentication, Providers, Apple: add the bundle ID as an authorized client ID and enable it.','Build the iOS app with the Sign in with Apple capability (already set in app.json).','Switch this on.'],'apple')+
  '</div></div>';
}
Object.assign(A,{authsw:function(el){
  var id=el.getAttribute('data-id'),on=!S.msg.auth[id],name=id==='google'?'Google':'Apple';
  var apply=function(){upd(function(){S.msg.auth[id]=on;log('Continue with '+name+(on?' enabled':' disabled'),'settings');audit('Continue with '+name+(on?' enabled':' disabled'))});toast('Continue with '+name+(on?' is now on.':' is now off.'))};
  var go=function(){if(!beOn()){apply();return}var p={auth:{}};p.auth[id]={enabled:on};beFn('admin-settings',{public:p}).then(apply,function(e){toast(e.message,'err')})};
  if(on)confirmM('Turn on Continue with '+name+'?','Customers will see the button on the login and sign-up screens. Make sure '+name+' is configured in Supabase first, or the button will fail when tapped.','Turn on',go);else go();
}});

/* ---- Broadcast email / Push promotions ---- */
var ROLEL=[['customer','Customers'],['rider','Drivers'],['merchant','Merchants']];
function bcRoles(s){return ROLEL.filter(function(r){return s.roles[r[0]]}).map(function(r){return r[0]})}
function demoCount(role,kind){
  var base={customer:kind==='email'?9310:7420,rider:S.riders?S.riders.length:0,merchant:S.merchants?S.merchants.length:0};return base[role]||0}
function bcCount(kind){
  var s=U.bc[kind],roles=bcRoles(s);s.counts=null;
  if(!roles.length){return}
  if(!beOn()){var c={};roles.forEach(function(r){c[r]=demoCount(r,kind)});s.counts=c;s.demo=true;return}
  s.demo=false;var tick=(s.tick=(s.tick||0)+1);
  Promise.all(ROLEL.map(function(r){return beReq('/rest/v1/rpc/admin_audience_count','POST',{p_roles:[r[0]],p_kind:kind}).then(function(n){return[r[0],n]})})).then(function(a){
    if(s.tick!==tick)return;var c={};a.forEach(function(x){c[x[0]]=Number(x[1])||0});s.counts=c;refresh()},function(e){if(s.tick===tick){s.counts=null;s.err=e.message;refresh()}});
}
function bcTotal(kind){var s=U.bc[kind];if(!s.counts)return null;return bcRoles(s).reduce(function(t,r){return t+(s.counts[r]||0)},0)}
function vBroadcast(kind){
  var s=U.bc[kind],em=kind==='email',total=bcTotal(kind),roles=bcRoles(s),all=roles.length===3;
  if(s.counts===null&&roles.length&&!s.busy&&!s.loaded){s.loaded=true;setTimeout(function(){bcCount(kind);refresh()},0)}
  var picker='<div class="tabs sm" role="group" aria-label="Recipients"><button type="button" data-act="bcAll" data-id="'+kind+'" aria-pressed="'+all+'">Select all</button>'+ROLEL.map(function(r){return '<button type="button" data-act="bcRole" data-id="'+kind+':'+r[0]+'" aria-pressed="'+!!s.roles[r[0]]+'">'+r[1]+(s.counts&&s.counts[r[0]]!=null?' · '+num(s.counts[r[0]]):'')+'</button>'}).join('')+'</div>';
  var limitS=em?150:65,limitB=em?20000:178;
  var prev=em?'<div style="background:#FFF8F3;border-radius:1rem;padding:1rem;color:#1F1A17"><div style="background:#FF5A1F;color:#fff;padding:.7rem 1rem;border-radius:.7rem .7rem 0 0;font-weight:800">ChowBuy</div><div style="background:#fff;padding:1rem;border-radius:0 0 .7rem .7rem"><b style="font-size:1.05rem">'+esc(s.subject||'Your subject line')+'</b><div style="margin-top:.7rem;white-space:pre-wrap;line-height:1.5;font-size:.92rem">'+esc((s.body||'Your message appears here.').replace(/\{\{first_name\}\}/g,'Ada'))+'</div></div></div>'
     :'<div style="background:linear-gradient(160deg,#1e293b,#0f172a);border-radius:1.4rem;padding:1.2rem"><div style="background:rgba(255,255,255,.92);color:#111;border-radius:1rem;padding:.8rem .9rem;display:flex;gap:.7rem"><span style="flex:none;width:2.2rem;height:2.2rem;border-radius:.55rem;background:#FF5A1F;color:#fff;display:grid;place-items:center;font-weight:800">C</span><div style="min-width:0"><div style="font-size:.72rem;opacity:.6">CHOWBUY · now</div><b style="display:block;font-size:.9rem">'+esc(s.subject||'Notification title')+'</b><span style="font-size:.85rem;line-height:1.35;display:block;word-break:break-word">'+esc((s.body||'Notification text appears here.').replace(/\{\{first_name\}\}/g,'Ada'))+'</span></div></div></div>';
  var ok=!!roles.length&&s.subject.trim().length>=3&&s.body.trim().length>=3&&!s.busy;
  var prog=s.prog?'<div class="card pad" role="status"><b>'+(s.prog.done?'Finished':'Sending…')+'</b><div class="muted" style="font-size:.9rem;margin-top:.3rem">Delivered '+num(s.prog.sent)+(s.prog.failed?' · Failed '+num(s.prog.failed):'')+(s.prog.total!=null&&!s.prog.done?' of about '+num(s.prog.total):'')+(s.prog.demo?' (demo, nothing was sent)':'')+'</div>'+(s.prog.err?'<div class="err" style="margin-top:.4rem">'+esc(s.prog.err)+'</div>':'')+'<div style="height:.5rem;border-radius:1rem;background:var(--fill,rgba(127,127,127,.15));margin-top:.7rem;overflow:hidden"><div style="height:100%;width:'+(s.prog.total?Math.min(100,Math.round((s.prog.sent+s.prog.failed)/s.prog.total*100)):(s.prog.done?100:5))+'%;background:var(--accent,#FF5A1F)"></div></div></div>':'';
  var hist=(beOn()&&U.hist?U.hist.filter(function(h){return h.kind===kind&&!h.test}).map(function(h){return[h.subject,h.roles.join(', '),h.sent,h.failed,new Date(h.created_at).toLocaleString()]}):S.msg.hist.filter(function(h){return h.kind===kind}).map(function(h){return[h.subject,h.roles.join(', '),h.sent,h.failed,new Date(h.ts).toLocaleString()+' (demo)']}));
  return head(em?'Broadcast email':'Push promotions',em?'Send an email to customers, drivers or merchants.':'Send a promotional push notification to customers, drivers or merchants.')+
  '<div style="display:grid;gap:1rem">'+(beOn()?'':beCard())+
  '<div class="grid g2" style="align-items:start"><div class="card pad"><h3>1. Choose recipients</h3><p class="sub">Only people who have not opted out'+(em?' and who have an email address':' and who have a registered device')+' are counted.</p><div style="margin-top:1rem">'+picker+'</div>'+
  '<p style="margin-top:1rem" role="status"><b class="mono" style="font-size:1.4rem">'+(total==null?(roles.length?'…':'0'):num(total))+'</b> <span class="muted">'+(roles.length?'people will receive this':'Choose at least one group')+(s.demo&&total!=null?' (demo numbers)':'')+'</span></p>'+(s.err?'<div class="err">'+esc(s.err)+'</div>':'')+
  '<h3 style="margin-top:1.4rem">2. Write your message</h3><div style="display:grid;gap:.9rem;margin-top:1rem">'+
  inp('bc-s',em?'Subject':'Title',s.subject,'data-fid="bc-s" data-in="bc:'+kind+'.subject" maxlength="'+limitS+'" autocomplete="off"')+
  '<div class="f"><label for="bc-b">'+(em?'Message':'Text')+'</label><textarea id="bc-b" data-fid="bc-b" data-in="bc:'+kind+'.body" rows="'+(em?9:4)+'" maxlength="'+limitB+'" style="width:100%">'+esc(s.body)+'</textarea><small>'+s.body.length+' / '+num(limitB)+' characters. Use <code>{{first_name}}</code> to greet people by name.'+(em?' Blank lines start a new paragraph.':'')+'</small></div></div>'+
  '<div class="acts" style="margin-top:1.2rem">'+btn(ic('send')+'Send test to me','bcTest',kind,'',ok&&beOn()?'':' disabled')+btn(ic('send')+'Send to '+(total==null?'…':num(total))+' people','bcSend',kind,'pri',ok?'':' disabled')+'</div>'+(beOn()?'':'<small class="muted" style="display:block;margin-top:.5rem">Demo mode: sending is simulated.</small>')+(em?'<small class="muted" style="display:block;margin-top:.5rem">Emails include a note on how to stop promotional emails (App, Profile, Notifications). Needs email set up in Settings, Email.</small>':'<small class="muted" style="display:block;margin-top:.5rem">Needs the Expo access token or OneSignal key in Settings, and customers must have allowed notifications.</small>')+'</div>'+
  '<div style="display:grid;gap:1rem"><div class="card pad"><h3>Preview</h3><div style="margin-top:1rem">'+prev+'</div></div>'+prog+'</div></div>'+
  '<div class="card"><div class="pad" style="padding-bottom:0"><h3>Recent campaigns</h3></div>'+(hist.length?'<div class="tw"><table class="t" style="min-width:40rem"><thead><tr><th>'+(em?'Subject':'Title')+'</th><th>Sent to</th><th class="r">Delivered</th><th class="r">Failed</th><th>When</th></tr></thead><tbody>'+hist.map(function(h){return '<tr><td>'+esc(h[0])+'</td><td>'+esc(h[1])+'</td><td class="r mono">'+num(h[2])+'</td><td class="r mono">'+num(h[3])+'</td><td class="nw">'+esc(h[4])+'</td></tr>'}).join('')+'</tbody></table></div>':empty(em?'mail':'bell','No campaigns yet','Campaigns you send will be listed here.'))+'</div></div>';
}
Object.assign(INP,{bc:function(k,v){var p=k.split('.');U.bc[p[0]][p[1]]=v;refresh()}});
function bcToggle(kind,role){var s=U.bc[kind];s.roles[role]=!s.roles[role];s.counts=null;s.err='';s.loaded=false;s.prog=null;refresh()}
Object.assign(A,{
 bcRole:function(el){var p=el.getAttribute('data-id').split(':');bcToggle(p[0],p[1])},
 bcAll:function(el){var k=el.getAttribute('data-id'),s=U.bc[k],all=bcRoles(s).length===3;ROLEL.forEach(function(r){s.roles[r[0]]=!all});if(all)s.roles.customer=false;s.counts=null;s.err='';s.loaded=false;s.prog=null;refresh()},
 bcTest:function(el){bcRun(el.getAttribute('data-id'),true)},
 bcSend:function(el){
   var kind=el.getAttribute('data-id'),s=U.bc[kind],roles=bcRoles(s),names=ROLEL.filter(function(r){return s.roles[r[0]]}).map(function(r){return r[1].toLowerCase()}),t=bcTotal(kind);
   confirmM('Send to '+(t==null?'everyone selected':num(t)+' people')+'?','This '+(kind==='email'?'email':'push notification')+' goes to '+names.join(', ')+(beOn()?'. It cannot be recalled once sent.':' as a demo. Nothing will actually be sent.'),'Send now',function(){bcRun(kind,false)});
 }
});
function bcRun(kind,test){
  var s=U.bc[kind],roles=bcRoles(s);if(s.busy)return;
  s.busy=true;s.prog={sent:0,failed:0,total:test?1:bcTotal(kind),done:false,demo:!beOn()};refresh();
  var finish=function(err){s.busy=false;s.prog.done=true;if(err)s.prog.err=err;
    if(!test&&!err&&!beOn())S.msg.hist.unshift({kind:kind,subject:s.subject,roles:roles,sent:s.prog.sent,failed:0,ts:Date.now()});
    if(!test&&!err){log((kind==='email'?'Broadcast email':'Push promotion')+' sent to '+roles.join(', '),'settings');audit((kind==='email'?'Broadcast email':'Push promotion')+': '+s.subject)}
    save();refresh();
    if(!test&&beOn())beReq('/rest/v1/broadcasts?select=*&order=created_at.desc&limit=15','GET').then(function(h){U.hist=h;refresh()},function(){});
    toast(err?err:test?'Test sent to your admin account.':'Campaign finished.',err?'err':undefined)};
  if(!beOn()){var n=test?1:(s.prog.total||0),i=0;(function step(){i+=Math.max(1,Math.ceil(n/6));s.prog.sent=Math.min(n,i);refresh();if(s.prog.sent<n)setTimeout(step,250);else finish()})();return}
  var cursor=null,id=null;
  (function page(){
    beFn('admin-broadcast',{kind:kind,roles:roles,subject:s.subject.trim(),body:s.body.trim(),test:!!test,cursor:cursor,broadcastId:id}).then(function(r){
      id=r.broadcastId||id;s.prog.sent+=r.sent||0;s.prog.failed+=r.failed||0;cursor=r.cursor;
      if(r.errors&&r.errors.length&&!s.prog.err)s.prog.err=r.errors[0];
      if(r.done||test||!cursor){finish(test&&!r.sent?(r.errors&&r.errors[0])||'The test could not be delivered.':'')}else{refresh();page()}
    },function(e){finish(e.message+(s.prog.sent?' ('+num(s.prog.sent)+' were delivered before this.)':''))});
  })();
}

/* ---------- global events ---------- */
document.addEventListener('click',function(e){
  var t=e.target;
  var m=t.closest&&t.closest('[data-m]');
  if(m&&$('#mwrap').contains(m)){
    var k=m.getAttribute('data-m');
    if(k==='x'){closeM();return}
    if(k==='cancelOrder'){var id=m.getAttribute('data-id');closeM();confirmM('Force cancel '+esc(id)+'?','The order is cancelled, the rider is released and the customer is refunded.','Force cancel',function(){var o=find(S.orders,id);upd(function(){o.status='cancelled';o.rider='';log(id+' force-cancelled by admin','warn')});toast(id+' cancelled. Refund queued.','warn')},true);return}
  }
  if($('#mwrap').classList.contains('show')&&t===$('#mwrap')){closeM();return}
  var a=t.closest&&t.closest('[data-act]');
  if(a){if(a.disabled)return;var fn=A[a.getAttribute('data-act')];if(fn){fn(a,e);return}}
  if(!(t.closest&&(t.closest('#pop')||t.closest('#bell'))))$('#pop').classList.remove('show');
});
document.addEventListener('submit',function(e){
  var f=e.target;
  if(f.id==='mf'){e.preventDefault();var r=Mfn&&Mfn(fd(f));if(typeof r==='string'){var er=$('#merr');if(er)er.textContent=r;return}closeM();return}
  var n=f.getAttribute&&f.getAttribute('data-form');if(n&&FORMS[n]){e.preventDefault();FORMS[n](f)}
});
document.addEventListener('input',function(e){var t=e.target;if(t.closest&&t.closest('[data-form=pw]')){pwLive();return}var k=t.getAttribute&&t.getAttribute('data-in');if(!k||t.composing)return;var p=k.split(':');INP[p[0]](p[1],t.value)});
document.addEventListener('change',function(e){
  var t=e.target,k=t.getAttribute&&t.getAttribute('data-ch');
  if(t.getAttribute&&t.getAttribute('data-cmimg')){cmImg(t.getAttribute('data-cmimg'),t);return}
  if(k){var p=k.split(':');CHG[p[0]](p[1],t.value);return}
  if(t.getAttribute&&t.getAttribute('data-avatar')){onAvatar(t.files&&t.files[0],t);return}
  var s=t.getAttribute&&t.getAttribute('data-file');if(s){onFile(s,t.files&&t.files[0],t)}
});
document.addEventListener('keydown',function(e){var t=e.target;if((e.key==='Enter'||e.key===' ')&&t.getAttribute&&t.getAttribute('role')==='button'&&t.tagName!=='BUTTON'&&t.getAttribute('data-act')){e.preventDefault();t.dispatchEvent(new MouseEvent('click',{bubbles:true}))}if(e.key==='Escape'){if($('#mwrap').classList.contains('show'))closeM();else{closeSide();$('#pop').classList.remove('show')}}});

/* ---------- customers, master points system, rider pay ---------- */
var PTDEF={enabled:true,earnPer:100,pointValue:1,minRedeem:500,stepRedeem:100,reviewPoints:50,signupBonus:0,
  tiers:[{id:'bronze',name:'Bronze',min:0,mult:1},{id:'silver',name:'Silver',min:5000,mult:1.25},{id:'gold',name:'Gold',min:20000,mult:1.5}]};
var RPDEF={commission:{Standard:15,Silver:12,Gold:10},fleetSalary:120000,payDay:28,sal:{}};
function genCustomers(){
  var a=7,R=function(){a=(a*1103515245+12345)&0x7fffffff;return a/0x7fffffff},
   fn=['Ada','Tunde','Ngozi','Ibrahim','Funke','Chidi','Amina','Emeka','Bisi','Yusuf','Kemi','Obinna','Zainab','Seun','Halima','Dayo','Chiamaka','Musa','Tolu','Efe','Ifeoma','Segun','Hadiza','Uche'],
   ln=['Okafor','Balogun','Adeyemi','Bello','Nwosu','Eze','Abubakar','Ogunleye','Mohammed','Obi','Ajayi','Danjuma'],out=[];
  for(var i=0;i<fn.length;i++){var orders=Math.floor(R()*42),spent=orders*Math.round(6000+R()*9000),life=Math.floor(spent/100*(orders>25?1.4:1)),used=Math.floor(life*R()*.5),pts=life-used,nm=fn[i]+' '+ln[i%ln.length];
    out.push({id:'C'+(1000+i),name:nm,email:(fn[i]+'.'+ln[i%ln.length]).toLowerCase()+'@mail.ng',phone:'+23480'+(31000000+Math.floor(R()*8999999)),balance:Math.round(R()*30)*1000,points:pts,lifetime:life,orders:orders,spent:spent,joined:Date.now()-Math.floor(R()*400)*864e5,wtx:[],ptx:[]})}
  return out;
}
function ensureCust(){
  if(!S.cust)S.cust=genCustomers();
  if(!S.points)S.points=clone(PTDEF);
  if(!S.rpay)S.rpay=clone(RPDEF);
  if(!S.rpay.sal)S.rpay.sal={};
}
ensureCust();
U.cust={live:null,load:false,err:'',sel:null};U.ptd=null;U.rpd=null;U.pcalc={gmv:486240000,comm:9,redeem:80};
function ptc(){return U.ptd||S.points}
function ptDirty(){return !!U.ptd&&JSON.stringify(U.ptd)!==JSON.stringify(S.points)}
function tierOf(life){var t=S.points.tiers.slice().sort(function(a,b){return a.min-b.min}),c=t[0];t.forEach(function(x){if(life>=x.min)c=x});return c}
function custRows(){
  var q=(U.q.customers||'').trim().toLowerCase();
  var rows=beOn()&&U.cust.live?U.cust.live.rows.map(function(r){return{id:r.id,name:r.name,email:r.email||'',phone:r.phone||'',balance:r.balance,points:r.points,lifetime:r.lifetime,orders:Number(r.orders),spent:Number(r.spent),joined:Date.parse(r.joined)}}):S.cust;
  return rows.filter(function(c){return !q||(c.name+' '+c.email+' '+c.phone).toLowerCase().indexOf(q)>-1});
}
function custLoad(){
  if(!beOn()||U.cust.load)return;U.cust.load=true;U.cust.err='';
  beReq('/rest/v1/rpc/admin_customers','POST',{p_search:'',p_limit:200,p_offset:0}).then(function(j){U.cust.live=j;U.cust.load=false;refresh()},function(e){U.cust.err=e.message;U.cust.load=false;U.cust.live=U.cust.live||{rows:[],stats:{},total:0};refresh()});
}
function vCustomers(){
  if(beOn()&&!U.cust.live&&!U.cust.load)custLoad();
  var live=beOn()&&U.cust.live,all=custRows(),f=T('cuF','all');
  var list=all.filter(function(c){return f==='all'||(f==='bal'&&c.balance>0)||(f==='pts'&&c.points>0)||(f==='top'&&tierOf(c.lifetime).min>0)});
  var st=live&&U.cust.live.stats&&U.cust.live.stats.customers!=null?U.cust.live.stats:{customers:all.length,walletTotal:all.reduce(function(s,c){return s+c.balance},0),pointsOutstanding:all.reduce(function(s,c){return s+c.points},0)};
  var pv=S.points.pointValue;
  var rows=list.map(function(c){var t=tierOf(c.lifetime);
    return '<tr><td><div class="who"><span class="tile" style="background:#0F172A">'+esc(initials(c.name))+'</span><div><b>'+esc(c.name)+'</b><small>'+esc(c.email||c.id)+'</small></div></div></td><td class="mono nw">'+esc(c.phone||'—')+'</td><td class="r mono"><b>'+ngn(c.balance)+'</b></td><td class="r mono">'+num(c.points)+'<small class="muted" style="display:block">worth '+ngn(c.points*pv)+'</small></td><td>'+pill(t.name,t.min>=20000?'acc':t.min>0?'info':'')+'</td><td class="r mono">'+num(c.orders)+'</td><td class="r mono">'+ngn(c.spent)+'</td><td class="r"><div class="rowact">'+btn(ic('wallet')+'Manage','custOpen',c.id,'pri')+'</div></td></tr>'}).join('');
  var banner=beOn()?(U.cust.err?'<div class="card pad" style="border-color:var(--bad)"><b>Could not load live customers.</b> <span class="muted">'+esc(U.cust.err)+'. Apply the 20261021000001 migration to your Supabase project, then reload.</span></div>':'<span class="pill ok">'+ic('checkc')+'Live data</span>'):'<span class="pill" title="Connect the backend in Messaging to manage real customers.">'+ic('alert')+'Demo data</span>';
  return head('Customers','Master control of customer wallets and loyalty points. Every change needs a reason and is logged.',banner+btn(ic('down')+'Export CSV','custCsv',null,''))+
  '<div class="grid g4">'+kpi('Customers',num(st.customers),'','users','n')+kpi('Wallet balances held',ngn(st.walletTotal),'','wallet','g')+kpi('Points outstanding',num(st.pointsOutstanding),'','star')+kpi('Points liability',ngn(st.pointsOutstanding*pv),'at '+ngn(pv)+' per point','trend','n')+'</div>'+
  '<div class="card"><div class="bar">'+search('customers','Search name, email or phone')+tabs('cuF',[['all','All'],['bal','With balance'],['pts','With points'],['top','Silver and Gold']],1)+'</div>'+
  (list.length?'<div class="tw"><table class="t" style="min-width:60rem"><thead><tr><th>Customer</th><th>Phone</th><th class="r">Wallet</th><th class="r">Points</th><th>Tier</th><th class="r">Orders</th><th class="r">Spent</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>':(beOn()&&U.cust.load?empty('users','Loading customers','Fetching from your project…'):empty('users','No customers match','Try another search or filter.',btn('Clear filters','clear','customers','pri'))))+'</div>';
}
function findCust(id){return custRows().filter(function(c){return c.id===id})[0]}
function patchCust(id,fn){
  var c=S.cust.filter(function(x){return x.id===id})[0];if(c)fn(c);
  if(U.cust.live){var r=U.cust.live.rows.filter(function(x){return x.id===id})[0];if(r)fn(r)}
}
function custHead(c){var t=tierOf(c.lifetime);return '<h3>'+esc(c.name)+'</h3><p class="muted">'+esc(c.email||'')+' · '+esc(c.phone||'')+'</p><div class="kv"><span>Wallet balance</span><b class="mono">'+ngn(c.balance)+'</b><span>Points</span><b class="mono">'+num(c.points)+' (worth '+ngn(c.points*S.points.pointValue)+')</b><span>Tier</span><b>'+esc(t.name)+' · '+t.mult+'x earn</b><span>Lifetime points</span><b class="mono">'+num(c.lifetime)+'</b></div>'}
function walletForm(id,dir){
  var c=findCust(id);if(!c)return;var up=dir===1;
  openM(custHead(c)+'<hr style="border:0;border-top:1px solid var(--line);margin:1rem 0"><h3 style="font-size:1rem">'+(up?'Top up wallet':'Deduct from wallet')+'</h3>'+inp('wa','Amount (₦)','','inputmode="numeric" placeholder="e.g. 2000"')+inp('wr','Reason (shown to the customer)','','maxlength="80" placeholder="'+(up?'Refund for cold food':'Chargeback / correction')+'"')+(up?'':'<small class="muted">The balance cannot go below ₦0.</small>')+'<label class="acts" style="gap:.6rem;flex-wrap:nowrap;margin-top:.6rem"><input type="checkbox" name="big" value="1" style="width:auto"> I confirm amounts of ₦100,000 or more</label><div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn '+(up?'pri':'danger')+'">'+(up?'Top up':'Deduct')+'</button></div>',function(v){
    var amt=Math.round(Number(String(v.wa).replace(/[,₦\s]/g,'')));
    if(!(amt>=1&&amt<=1000000))return 'Enter an amount from ₦1 to ₦1,000,000.';
    if(String(v.wr).trim().length<3)return 'Add a short reason. The customer sees it in their wallet history.';
    if(amt>=100000&&!document.querySelector('#mf [name=big]').checked)return 'Tick the box to confirm this large amount.';
    if(!up&&amt>c.balance)return 'The balance is only '+ngn(c.balance)+'.';
    var why=String(v.wr).trim(),done=function(bal){
      patchCust(id,function(x){x.balance=bal;if(x.wtx)x.wtx.unshift({t:(up?'ChowBuy top-up: ':'ChowBuy adjustment: ')+why,a:amt,d:dir,ts:Date.now()})});
      log((up?'Topped up ':'Deducted ')+ngn(amt)+(up?' to ':' from ')+c.name+'’s wallet: '+why,'money');audit((up?'Wallet top-up ':'Wallet deduction ')+ngn(amt)+' · '+c.name);save();refresh();toast((up?'Added ':'Deducted ')+ngn(amt)+'. New balance '+ngn(bal)+'.')};
    if(beOn()){beReq('/rest/v1/rpc/admin_wallet_adjust','POST',{p_user:id,p_amount:amt,p_dir:dir,p_reason:why}).then(function(b){done(b)},function(e){toast(e.message,'err')});return}
    done(c.balance+dir*amt);
  });
}
function pointsForm(id){
  var c=findCust(id);if(!c)return;
  openM(custHead(c)+'<hr style="border:0;border-top:1px solid var(--line);margin:1rem 0"><h3 style="font-size:1rem">Adjust points</h3><p class="muted">Use a positive number to give points and a negative number to remove them. Gifted points count toward the tier.</p>'+inp('pd','Points (+ or −)','','inputmode="numeric" placeholder="e.g. 500 or -200"')+inp('pr','Reason','','maxlength="100" placeholder="Goodwill gift"')+'<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Apply</button></div>',function(v){
    var d=Math.round(Number(String(v.pd).replace(/[,\s]/g,'')));
    if(!d||Math.abs(d)>1000000||isNaN(d))return 'Enter a points amount (not zero).';
    if(String(v.pr).trim().length<3)return 'Add a short reason.';
    if(c.points+d<0)return 'This would take the balance below zero (they have '+num(c.points)+').';
    var why=String(v.pr).trim(),done=function(pts){patchCust(id,function(x){x.points=pts;if(d>0)x.lifetime+=d;if(x.ptx)x.ptx.unshift({t:'ChowBuy: '+why,a:d,ts:Date.now()})});
      log((d>0?'Gave ':'Removed ')+num(Math.abs(d))+' points '+(d>0?'to ':'from ')+c.name+': '+why,'money');audit('Points '+(d>0?'+':'')+d+' · '+c.name);save();refresh();toast('Points updated. Balance '+num(pts)+'.')};
    if(beOn()){beReq('/rest/v1/rpc/admin_points_adjust','POST',{p_user:id,p_delta:d,p_reason:why}).then(function(p){done(p)},function(e){toast(e.message,'err')});return}
    done(c.points+d);
  });
}
function histView(id){
  var c=findCust(id);if(!c)return;
  var show=function(w,p){
    var wr=(w||[]).map(function(x){return '<tr><td>'+esc(x.t||x.title)+'</td><td class="r mono" style="color:'+((x.d||x.dir)===1?'var(--ok)':'var(--bad)')+'">'+((x.d||x.dir)===1?'+':'−')+ngn(x.a||x.amount)+'</td><td class="nw">'+fdt(x.ts||Date.parse(x.created_at))+'</td></tr>'}).join('')||'<tr><td colspan="3" class="muted">No wallet activity yet.</td></tr>';
    var pr=(p||[]).map(function(x){return '<tr><td>'+esc(x.t||x.note)+'</td><td class="r mono">'+((x.a||x.delta)>0?'+':'')+num(x.a||x.delta)+'</td><td class="nw">'+fdt(x.ts||Date.parse(x.created_at))+'</td></tr>'}).join('')||'<tr><td colspan="3" class="muted">No points activity yet.</td></tr>';
    openM(custHead(c)+'<h3 style="font-size:1rem;margin-top:1rem">Wallet history</h3><div class="tw" style="max-height:12rem;overflow:auto"><table class="t" style="min-width:0"><tbody>'+wr+'</tbody></table></div><h3 style="font-size:1rem;margin-top:1rem">Points history</h3><div class="tw" style="max-height:12rem;overflow:auto"><table class="t" style="min-width:0"><tbody>'+pr+'</tbody></table></div><div class="ft"><button type="submit" class="btn pri">Done</button></div>',function(){});
  };
  if(beOn()){beReq('/rest/v1/rpc/admin_customer_ledger','POST',{p_user:id}).then(function(j){show(j.wallet,j.points)},function(e){toast(e.message,'err')});return}
  show(c.wtx,c.ptx);
}
/* ---- master points system ---- */
function pointsCost(D,g){
  var tiers=S.cust.length?S.cust:[],avg=1.1,earnRate=D.pointValue/Math.max(D.earnPer,1);
  var accrued=g.gmv*earnRate*avg,cost=accrued*(g.redeem/100),commission=g.gmv*g.comm/100;
  return{pctGmv:cost/Math.max(g.gmv,1)*100,pctComm:commission?cost/commission*100:0,cost:cost,accrued:accrued};
}
function vPoints(){
  var D=ptc(),dirty=ptDirty(),g=U.pcalc,k=pointsCost(D,g),pv=D.pointValue;
  var verdict=k.pctComm<=12?['ok','Sustainable','The programme costs about '+k.pctComm.toFixed(1)+'% of the commission you earn. Good headroom for promos.']:k.pctComm<=25?['info','Watch closely','Rewards take '+k.pctComm.toFixed(1)+'% of commission. Fine for a growth push, tight for the long run.']:['bad','Too generous','Rewards would take '+k.pctComm.toFixed(1)+'% of commission. Raise ₦ per point or lower the point value.'];
  var f=function(id,l,key,suf,hint){return '<div class="f"><label for="pt-'+id+'">'+l+'</label><input id="pt-'+id+'" data-fid="pt-'+id+'" data-in="pt:'+key+'" inputmode="decimal" value="'+esc(D[key])+'">'+(hint?'<small>'+hint+'</small>':'')+'</div>'};
  var tr=D.tiers.map(function(t,i){return '<tr><td><b>'+esc(t.name)+'</b></td><td><input aria-label="'+esc(t.name)+' threshold" data-fid="pt-tm'+i+'" data-in="ptt:'+i+':min" inputmode="numeric" value="'+esc(t.min)+'" style="max-width:9rem"'+(i===0?' disabled':'')+'></td><td><input aria-label="'+esc(t.name)+' multiplier" data-fid="pt-tx'+i+'" data-in="ptt:'+i+':mult" inputmode="decimal" value="'+esc(t.mult)+'" style="max-width:6rem"></td><td class="muted">≈ '+ngn(t.min*D.earnPer)+' lifetime food spend at the base rate</td></tr>'}).join('');
  var out=S.cust.reduce(function(s,c){return s+c.points},0);
  var presets=[['lean','Lean','0.5% back',200],['bal','Balanced','1% back (recommended)',100],['gen','Generous','2% back',50]];
  return head('Points system','One programme for every customer: how points are earned, what they are worth, and what they cost you.',(dirty?'<span class="badge-un">Unsaved changes</span>'+btn('Discard','ptDiscard',null,''):'')+btn(ic('check')+'Save points settings','ptSave',null,'pri'))+
  '<div class="grid g4">'+kpi('Earn rate','1 pt / '+ngn(D.earnPer),'≈ '+(pv/Math.max(D.earnPer,1)*100).toFixed(2)+'% back','star','g')+kpi('1 point is worth',ngn(pv),'when redeemed to wallet','wallet')+kpi('Points outstanding',num(out),'','users','n')+kpi('Liability',ngn(out*pv),'if all redeemed','trend','n')+'</div>'+
  '<div class="grid g2" style="align-items:start"><div class="card pad"><div class="trow"><div><b>Points programme</b><small>Turn off to stop earning and redeeming everywhere.</small></div>'+sw(D.enabled,'ptOn','x','Points programme')+'</div>'+
  '<h3 style="margin-top:1.2rem">Earning and value</h3><div class="frow" style="margin-top:.8rem">'+f('ep','₦ spent per 1 point','earnPer','','Food value only, delivery and fees excluded.')+f('pv','Value of 1 point (₦)','pointValue','','Applied when points are redeemed to the wallet.')+f('rp','Review bonus (points)','reviewPoints','','Once per delivered order.')+f('sb','Sign-up bonus (points)','signupBonus','','Not awarded automatically yet.')+f('mr','Minimum to redeem','minRedeem','','Stops tiny redemptions.')+f('sr','Redeem in steps of','stepRedeem','','')+'</div>'+
  '<h3 style="margin-top:1.2rem">Quick presets</h3><div class="chips" style="margin-top:.6rem">'+presets.map(function(p){return '<button type="button" data-act="ptPreset" data-id="'+p[0]+'" aria-pressed="'+(D.earnPer===p[3]&&D.pointValue===1)+'">'+p[1]+' · '+p[2]+'</button>'}).join('')+'</div></div>'+
  '<div style="display:grid;gap:1rem;align-content:start"><div class="card pad"><h3>Value calculator</h3><p class="sub">Estimate what the rewards cost. Points earned are only a cost when customers redeem them.</p><div class="frow" style="margin-top:.8rem">'+
  '<div class="f"><label for="pc-g">Monthly marketplace volume (₦)</label><input id="pc-g" data-fid="pc-g" data-in="pc:gmv" inputmode="numeric" value="'+esc(g.gmv)+'"></div><div class="f"><label for="pc-c">Average commission (%)</label><input id="pc-c" data-fid="pc-c" data-in="pc:comm" inputmode="decimal" value="'+esc(g.comm)+'"></div><div class="f"><label for="pc-r">Share of points redeemed (%)</label><input id="pc-r" data-fid="pc-r" data-in="pc:redeem" inputmode="decimal" value="'+esc(g.redeem)+'"><small>Many points go unused. 70 to 90% is a safe planning figure.</small></div></div>'+
  '<div class="kv" style="margin-top:1rem"><span>Points issued per month</span><b class="mono">'+num(k.accrued/Math.max(pv,.0001))+'</b><span>Estimated cost per month</span><b class="mono">'+ngn(k.cost)+'</b><span>As % of volume</span><b class="mono">'+k.pctGmv.toFixed(2)+'%</b><span>As % of commission</span><b class="mono">'+k.pctComm.toFixed(1)+'%</b></div><div style="margin-top:.8rem"><span class="pill '+verdict[0]+'">'+verdict[1]+'</span> <small class="muted">'+verdict[2]+'</small></div></div>'+
  '<div class="card pad"><h3>Why these defaults</h3><ul class="muted" style="margin:.6rem 0 0 1.1rem;display:grid;gap:.4rem"><li>1 point = ₦1 keeps it easy to understand. Customers see ₦ value, not a puzzle.</li><li>1 point per ₦100 returns about 1% of food spend, a tenth of a typical 10 to 15% commission.</li><li>Redeeming from 500 points (₦500) avoids many tiny wallet credits.</li><li>Silver and Gold earn faster, which rewards your best customers without extra spend per order up front.</li><li>Review points (50 = ₦50) pay for feedback that improves merchant and rider ratings.</li></ul></div></div></div>'+
  '<div class="card" style="margin-top:1rem"><div class="bar"><div style="margin-right:auto"><h3>Tiers</h3><p class="sub">Tiers follow lifetime points earned. Redeeming does not lower a tier.</p></div></div><div class="tw"><table class="t" style="min-width:36rem"><thead><tr><th>Tier</th><th>Lifetime points from</th><th>Earn multiplier</th><th>Roughly</th></tr></thead><tbody>'+tr+'</tbody></table></div></div>';
}
/* ---- rider pay: Fleet = salary, Partner = per ride ---- */
function rpd(){if(!U.rpd)U.rpd=clone(S.rpay);return U.rpd}
function rpDirty(){return !!U.rpd&&JSON.stringify(U.rpd)!==JSON.stringify(S.rpay)}
function riderSalary(r){var s=S.rpay.sal[r.id];return s!=null?s:S.rpay.fleetSalary}
function riderPayPanel(){
  var D=U.rpd||S.rpay,dirty=rpDirty(),fl=S.riders.filter(function(r){return r.type==='FLEET'&&r.status==='active'}),pa=S.riders.filter(function(r){return r.type==='PARTNER'&&r.status==='active'});
  var payroll=fl.reduce(function(s,r){return s+riderSalary(r)},0),cm=D.commission;
  var inpf=function(id,l,path,val,suf){return '<div class="f"><label for="'+id+'">'+l+'</label><input id="'+id+'" data-fid="'+id+'" data-in="rp:'+path+'" inputmode="numeric" value="'+esc(val)+'"></div>'};
  var ex=Math.round(2400*(100-cm.Standard)/100);
  return '<div class="grid g2" style="align-items:start;margin-bottom:1rem"><div class="card pad"><div class="acts" style="justify-content:space-between"><h3>Fleet riders · salary</h3>'+tbadge('FLEET')+'</div><p class="sub">Company riders are paid a fixed monthly salary. They never see per-ride fares. Customer tips are always theirs.</p><div class="frow" style="margin-top:.8rem">'+inpf('rp-s','Default monthly salary (₦)','fleetSalary',D.fleetSalary)+inpf('rp-d','Pay day (day of month)','payDay',D.payDay)+'</div><div class="kv" style="margin-top:1rem"><span>Active fleet riders</span><b class="mono">'+fl.length+'</b><span>Monthly payroll</span><b class="mono">'+ngn(payroll)+'</b><span>Next pay day</span><b>'+D.payDay+'th of the month</b></div><p class="muted" style="margin-top:.6rem">Set a different salary for one rider with “Pay” in the table below.</p></div>'+
  '<div class="card pad"><div class="acts" style="justify-content:space-between"><h3>Partner riders · per ride</h3>'+tbadge('PARTNER')+'</div><p class="sub">Independent riders earn on every delivery: the delivery fare minus ChowBuy’s commission for their tier, plus 100% of tips.</p><div class="frow" style="margin-top:.8rem">'+['Standard','Silver','Gold'].map(function(t){return inpf('rp-'+t,t+' commission (%)','commission.'+t,cm[t])}).join('')+'</div><div class="kv" style="margin-top:1rem"><span>Active partner riders</span><b class="mono">'+pa.length+'</b><span>Example: ₦2,400 fare, Standard</span><b class="mono">rider keeps '+ngn(ex)+'</b></div></div></div>'+
  '<div class="acts" style="margin-bottom:1rem;justify-content:flex-end">'+(dirty?'<span class="badge-un">Unsaved changes</span>'+btn('Discard','rpDiscard',null,''):'')+btn(ic('check')+'Save rider pay','rpSave',null,'pri')+'</div>';
}
Object.assign(INP,{
 pt:function(k,v){var D=ptc();if(!U.ptd)U.ptd=clone(S.points);U.ptd[k]=Number(String(v).replace(/[^\d.]/g,''))||0;refresh()},
 ptt:function(k,v){var p=k.split(':');if(!U.ptd)U.ptd=clone(S.points);U.ptd.tiers[Number(p[0])][p[1]]=Number(String(v).replace(/[^\d.]/g,''))||0;refresh()},
 pc:function(k,v){U.pcalc[k]=Number(String(v).replace(/[^\d.]/g,''))||0;refresh()},
 rp:function(k,v){var D=rpd(),n=Number(String(v).replace(/[^\d.]/g,''))||0;setPath(D,k,n);refresh()}
});
function ptValid(D){
  if(D.earnPer<1)return '₦ per point must be at least 1.';if(D.pointValue<=0||D.pointValue>10)return 'Point value must be above ₦0 and at most ₦10.';
  if(D.minRedeem<1||D.stepRedeem<1)return 'Redemption minimum and step must be at least 1.';
  if(D.pointValue/D.earnPer>0.05)return 'That returns more than 5% of spend. Raise ₦ per point or lower the point value.';
  for(var i=1;i<D.tiers.length;i++)if(D.tiers[i].min<=D.tiers[i-1].min)return 'Each tier must start above the previous one.';
  for(var j=0;j<D.tiers.length;j++)if(D.tiers[j].mult<1||D.tiers[j].mult>3)return 'Multipliers must be between 1 and 3.';
  return '';
}
function beUpsert(key,value){
  return fetch(BE.url.replace(/\/+$/,'')+'/rest/v1/platform_settings?on_conflict=key',{method:'POST',headers:{apikey:BE.anon,Authorization:'Bearer '+BE.tok,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({key:key,value:value,updated_at:new Date().toISOString()})}).then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error('Could not save to your project ('+r.status+'). '+t.slice(0,120))})});
}
Object.assign(A,{
 custOpen:function(el){var id=el.getAttribute('data-id'),c=findCust(id);if(!c)return;
   openM(custHead(c)+'<div class="acts" style="margin-top:1rem;gap:.6rem"><button type="button" class="btn pri" data-act="custTop" data-id="'+id+'">'+ic('plus')+'Top up wallet</button><button type="button" class="btn danger" data-act="custDed" data-id="'+id+'">'+ic('down')+'Deduct wallet</button><button type="button" class="btn" data-act="custPts" data-id="'+id+'">'+ic('star')+'Adjust points</button><button type="button" class="btn" data-act="custHist" data-id="'+id+'">'+ic('list')+'History</button></div><div class="ft"><button type="submit" class="btn">Close</button></div>',function(){})},
 custTop:function(el){closeM();walletForm(el.getAttribute('data-id'),1)},
 custDed:function(el){closeM();walletForm(el.getAttribute('data-id'),-1)},
 custPts:function(el){closeM();pointsForm(el.getAttribute('data-id'))},
 custHist:function(el){closeM();histView(el.getAttribute('data-id'))},
 custCsv:function(){var r=custRows();csv('chowbuy-customers.csv',[['ID','Name','Email','Phone','Wallet NGN','Points','Lifetime points','Tier','Orders','Spent NGN']].concat(r.map(function(c){return[c.id,c.name,c.email,c.phone,c.balance,c.points,c.lifetime,tierOf(c.lifetime).name,c.orders,c.spent]})));toast('Exported '+r.length+' customers to CSV')},
 ptOn:function(){var D=ptc();if(!U.ptd)U.ptd=clone(S.points);U.ptd.enabled=!U.ptd.enabled;refresh()},
 ptPreset:function(el){if(!U.ptd)U.ptd=clone(S.points);U.ptd.earnPer={lean:200,bal:100,gen:50}[el.getAttribute('data-id')];U.ptd.pointValue=1;refresh()},
 ptDiscard:function(){U.ptd=null;refresh();toast('Changes discarded.')},
 ptSave:function(){var D=ptc(),bad=ptValid(D);if(bad){toast(bad,'err');return}
   var done=function(){S.points=clone(D);U.ptd=null;log('Points programme updated: 1 pt per '+ngn(D.earnPer)+', 1 pt = '+ngn(D.pointValue),'settings');audit('Points settings saved');save();refresh();toast('Points settings saved'+(beOn()?' to your project.':' (demo, this browser only).'))};
   if(beOn()){beUpsert('points',D).then(done,function(e){toast(e.message,'err')});return}done()},
 rpDiscard:function(){U.rpd=null;refresh();toast('Changes discarded.')},
 rpSave:function(){var D=rpd();
   if(D.fleetSalary<1)return toast('Set a default fleet salary.','err');if(D.payDay<1||D.payDay>28)return toast('Pay day must be between 1 and 28.','err');
   for(var t in D.commission)if(D.commission[t]<0||D.commission[t]>40)return toast('Commission must be between 0 and 40%.','err');
   var done=function(){S.rpay=clone(D);U.rpd=null;log('Rider pay updated','settings');audit('Rider pay settings saved');save();refresh();toast('Rider pay saved'+(beOn()?'.':' (demo, this browser only).'))};
   if(beOn()){beUpsert('rider_pay',{commission:D.commission,fleetSalary:D.fleetSalary,payDay:D.payDay}).then(done,function(e){toast(e.message,'err')});return}done()},
 rpRider:function(el){var r=S.riders.filter(function(x){return x.id===el.getAttribute('data-id')})[0];if(!r)return;var fl=r.type==='FLEET';
   openM('<h3>Pay for '+esc(r.name)+'</h3><p class="muted">'+(fl?'Fleet rider: fixed monthly salary. Per-ride fares are not shown to them.':'Partner rider: paid per ride (fare minus commission) plus 100% of tips.')+'</p>'+(fl?inp('sal','Monthly salary (₦)',riderSalary(r),'inputmode="numeric"'):sel('tier','Commission tier',[['Standard','Standard · '+S.rpay.commission.Standard+'%'],['Silver','Silver · '+S.rpay.commission.Silver+'%'],['Gold','Gold · '+S.rpay.commission.Gold+'%']],(S.rpay.tiers&&S.rpay.tiers[r.id])||'Standard'))+'<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Save</button></div>',function(v){
     if(fl){var n=Math.round(Number(String(v.sal).replace(/[,₦\s]/g,'')));if(!(n>=1&&n<=5000000))return 'Enter a salary from ₦1 to ₦5,000,000.';S.rpay.sal[r.id]=n;log(r.name+' salary set to '+ngn(n)+' per month','settings')}
     else{if(!S.rpay.tiers)S.rpay.tiers={};S.rpay.tiers[r.id]=v.tier;log(r.name+' moved to '+v.tier+' commission tier','settings')}
     audit('Rider pay changed · '+r.name);save();refresh();toast('Saved for '+r.name+'.')})}
});
Object.assign(IC,{star:IC.star||'<path d="m12 2 3 7 7 .6-5.300 4.700 1.700 7.200L12 17.800 5.600 21.500l1.700-7.200L2 9.600 9 9z"/>'});
ROUTES.splice(ROUTES.map(function(r){return r.p}).indexOf('riders'),0,{p:'customers',n:'Customers',i:'users',g:'Marketplace',v:vCustomers});
ROUTES.splice(ROUTES.map(function(r){return r.p}).indexOf('wallet-transfers')+1,0,{p:'points',n:'Points',i:'star',g:'Money',v:vPoints});
buildNav();

/* ---------- KYC review (riders and merchants) and Emergency services ---------- */
var KDOCS={
 rider:[['photo_id','Government photo ID'],['next_of_kin','Next of kin'],['guarantor','Guarantor details'],['police','Police character clearance'],['rider_card','Rider’s card / licence'],['plate','Vehicle plate number'],['insurance','Insurance certificate'],['roadworthy','Roadworthiness certificate']],
 merchant:{restaurant:[['cac','CAC registration'],['tin','Tax ID (TIN)'],['owner_id','Owner’s government ID'],['food_cert','NAFDAC / food handler certificate'],['bank_letter','Bank account proof']],
  grocery:[['cac','CAC registration'],['tin','Tax ID (TIN)'],['owner_id','Owner’s government ID'],['bank_letter','Bank account proof']],
  pharmacy:[['cac','CAC registration'],['tin','Tax ID (TIN)'],['owner_id','Owner’s government ID'],['pcn','Pharmacy premises licence (PCN)'],['bank_letter','Bank account proof']],
  package:[['cac','CAC registration'],['tin','Tax ID (TIN)'],['owner_id','Owner’s government ID'],['bank_letter','Bank account proof']]}
};
var EKINDS=[['police','Police'],['ambulance','Ambulance'],['fire','Fire service'],['road_safety','Road safety'],['hotline','Emergency hotline'],['other','Other']];
function kdocList(kind,x){
  if(kind==='rider'){var fleet=x.type==='FLEET';return KDOCS.rider.filter(function(d){return fleet?['photo_id','next_of_kin','guarantor','police','rider_card'].indexOf(d[0])>-1:true})}
  return KDOCS.merchant[x.vertical]||KDOCS.merchant.restaurant;
}
function ensureKyc(){
  if(!S.kyc){
    S.kyc={};var seed=function(kind,list,fn){list.forEach(function(x,i){var docs={};kdocList(kind,x).forEach(function(d,j){var h=(i*7+j*3)%10;
      if(x.status==='active'||x.kyc==='verified')docs[d[0]]={status:'approved',note:'',file:d[0]+'.pdf',byAdmin:false};
      else if(h<4)docs[d[0]]={status:'pending',note:'',file:d[0]+'.jpg',byAdmin:false};
      else if(h===4)docs[d[0]]={status:'declined',note:'Image is unreadable. Please send a clear photo.',file:d[0]+'.jpg',byAdmin:false}});
      S.kyc[kind+':'+x.id]=docs})};
    seed('rider',S.riders);seed('merchant',S.merchants);
  }
  if(!S.emerg)S.emerg=[{id:'E1',city:'',kind:'hotline',label:'Nigeria Emergency Services',number:'112',active:true},{id:'E2',city:'Lagos',kind:'hotline',label:'Lagos State Emergency (LASEMA)',number:'767',active:true},{id:'E3',city:'Lagos',kind:'police',label:'Lagos Police Command',number:'08032003913',active:true},{id:'E4',city:'Abuja',kind:'police',label:'FCT Police Command',number:'08032003913',active:true},{id:'E5',city:'',kind:'road_safety',label:'FRSC road safety',number:'122',active:true}];
  if(!S.sos)S.sos=[{id:'S1',rider:'Sodiq Bello',phone:'+2348031110011',order:'CHB-48212',lat:6.4474,lng:3.4723,status:'open',note:'',at:Date.now()-12*60000,contacts:[{name:'Mum',phone:'08031112222'},{name:'Tunde',phone:'08033334444'}]},{id:'S2',rider:'Emeka Obi',phone:'+2348031110012',order:'',lat:6.5244,lng:3.3792,status:'resolved',note:'Flat tyre, rider safe',at:Date.now()-26*3600000,contacts:[]}];
}
ensureKyc();
U.kyc={live:{rider:null,merchant:null},load:{},err:'',sel:null};U.sosl={live:null,load:false,err:''};U.emrl={live:null,load:false};
function kApplicants(kind){
  if(beOn()&&U.kyc.live[kind])return U.kyc.live[kind].map(function(r){var docs={};(r.docs||[]).forEach(function(d){docs[d.doc]={status:d.status,note:d.note||'',file:d.file,byAdmin:!!d.by_admin}});
    return{id:r.id,name:r.name,sub:kind==='rider'?(r.vehicle+' · '+(r.pay_model==='fleet'?'Fleet':'Partner')):(V[r.vertical]||r.vertical),vertical:r.vertical,type:r.pay_model==='fleet'?'FLEET':'PARTNER',accepted:kind==='rider'?r.verified:r.active,docs:docs,live:true}});
  return (kind==='rider'?S.riders:S.merchants).map(function(x){return{id:x.id,name:x.name,sub:kind==='rider'?(x.type==='FLEET'?'Fleet':'Partner')+' · '+x.city:(V[x.vertical]||'')+' · '+x.city,vertical:x.vertical,type:x.type,accepted:x.status==='active',docs:S.kyc[kind+':'+x.id]||(S.kyc[kind+':'+x.id]={}),live:false}});
}
function kState(x,kind){var req=kdocList(kind,x),ap=0,pe=0,de=0;req.forEach(function(d){var s=(x.docs[d[0]]||{}).status;if(s==='approved')ap++;else if(s==='pending')pe++;else if(s==='declined')de++});return{req:req,ap:ap,pe:pe,de:de,miss:req.length-ap-pe-de}}
function kLoad(kind){
  if(!beOn()||U.kyc.live[kind]||U.kyc.load[kind])return;U.kyc.load[kind]=true;
  beReq('/rest/v1/rpc/admin_kyc_list','POST',{p_kind:kind}).then(function(j){U.kyc.live[kind]=j;U.kyc.load[kind]=false;refresh()},function(e){U.kyc.err=e.message;U.kyc.load[kind]=false;U.kyc.live[kind]=[];refresh()});
}
function kBadge(st){var m={approved:['ok','checkc'],pending:['info','clock'],declined:['bad','xc']}[st]||['warn','alert'];return pill(st||'not sent',m[0],m[1])}
function vKyc(){
  var kind=T('kycK','rider'),f=T('kycF','all'),q=(U.q.kyc||'').trim().toLowerCase();
  kLoad(kind);
  var all=kApplicants(kind),list=all.filter(function(x){var s=kState(x,kind);return(!q||(x.name+' '+x.sub).toLowerCase().indexOf(q)>-1)&&(f==='all'||(f==='review'&&s.pe>0)||(f==='action'&&(s.de>0||s.miss>0))||(f==='verified'&&s.ap===s.req.length)||(f==='accepted'&&x.accepted))});
  var tot={review:0,action:0,ok:0};all.forEach(function(x){var s=kState(x,kind);if(s.pe)tot.review++;if(s.de||s.miss)tot.action++;if(s.ap===s.req.length)tot.ok++});
  var rows=list.map(function(x){var s=kState(x,kind);
    return '<tr><td><div class="who">'+tile(x.name,kind==='merchant'?x.vertical:'package')+'<div><b>'+esc(x.name)+'</b><small>'+esc(x.sub)+'</small></div></div></td><td class="mono">'+s.ap+' / '+s.req.length+'</td><td>'+(s.pe?pill(s.pe+' to review','info'):'')+' '+(s.de?pill(s.de+' declined','bad'):'')+' '+(s.miss?pill(s.miss+' not sent','warn'):'')+(!s.pe&&!s.de&&!s.miss?pill('all approved','ok','shield'):'')+'</td><td>'+pill(x.accepted?'accepted':'not accepted',x.accepted?'ok':'warn')+'</td><td class="r"><div class="rowact">'+btn(ic('eye')+'Review','kycOpen',x.id,'pri')+'</div></td></tr>'}).join('');
  var banner=beOn()?(U.kyc.err?'<div class="card pad" style="border-color:var(--bad)"><b>Could not load live KYC.</b> <span class="muted">'+esc(U.kyc.err)+'. Apply the 20261022000001 migration to your Supabase project, then reload.</span></div>':'<span class="pill ok">'+ic('checkc')+'Live data</span>'):'<span class="pill" title="Connect the backend in Messaging to review real documents.">'+ic('alert')+'Demo data</span>';
  return head('KYC review','Check documents for riders and merchants. You can upload on an applicant’s behalf and accept or decline at any time, even while their documents are outstanding.',banner)+
  '<div class="grid g3">'+kpi('Waiting for review',num(tot.review),'','clock','n')+kpi('Need action',num(tot.action),'documents missing or declined','alert')+kpi('Fully verified',num(tot.ok),'','shield','g')+'</div>'+
  '<div class="card"><div class="bar">'+search('kyc','Search name or city')+tabs('kycK',[['rider','Riders'],['merchant','Merchants']],1)+tabs('kycF',[['all','All'],['review','To review'],['action','Need action'],['verified','Verified'],['accepted','Accepted']],1)+'</div>'+
  (list.length?'<div class="tw"><table class="t" style="min-width:52rem"><thead><tr><th>Applicant</th><th>Approved</th><th>Status</th><th>Account</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="foot"><span>'+list.length+' applicant'+(list.length>1?'s':'')+'</span></div>':(beOn()&&U.kyc.load[kind]?empty('shield','Loading','Fetching from your project…'):empty('shield','Nobody matches','Try another search or filter.',btn('Clear filters','clear','kyc','pri'))))+'</div>';
}
function kFind(kind,id){return kApplicants(kind).filter(function(x){return x.id===id})[0]}
function kOpen(kind,id){
  var x=kFind(kind,id);if(!x)return;var s=kState(x,kind);
  var rows=s.req.map(function(d){var c=x.docs[d[0]]||{};
    return '<div class="it" style="align-items:flex-start;justify-content:space-between;gap:.6rem;border-bottom:1px solid var(--line);padding:.6rem 0"><div><b>'+esc(d[1])+'</b><div>'+kBadge(c.status)+(c.byAdmin?' <small class="muted">added by ChowBuy</small>':'')+'</div>'+(c.file?'<small class="muted">File: '+esc(c.file)+'</small>':'')+(c.note?'<div class="muted" style="font-size:.82rem">Note: '+esc(c.note)+'</div>':'')+'</div><div class="acts">'+btn('Update','kycDoc',kind+'|'+id+'|'+d[0],'')+'</div></div>'}).join('');
  openM('<h3>'+esc(x.name)+'</h3><p class="muted">'+esc(x.sub)+' · '+s.ap+' of '+s.req.length+' documents approved</p>'+rows+'<div class="ft" style="flex-wrap:wrap;gap:.5rem"><button type="button" class="btn" data-m="x">Close</button><button type="button" class="btn danger" data-act="kycDecide" data-id="'+kind+'|'+id+'|0">'+ic('ban')+(kind==='rider'?'Decline rider':'Decline merchant')+'</button><button type="button" class="btn pri" data-act="kycDecide" data-id="'+kind+'|'+id+'|1">'+ic('check')+(kind==='rider'?'Accept rider':'Accept merchant')+'</button></div><small class="muted">Accepting or declining the account does not depend on document status, so you can act while documents are still outstanding.</small>',function(){closeM()});
}
function kDocForm(kind,id,doc){
  var x=kFind(kind,id);if(!x)return;var c=x.docs[doc]||{},name=(kdocList(kind,x).filter(function(d){return d[0]===doc})[0]||[0,doc])[1];
  openM('<h3>'+esc(name)+'</h3><p class="muted">'+esc(x.name)+'. Upload on their behalf if they need help, then accept or decline.</p>'+
   '<div class="f"><label for="kf">Document photo or PDF (optional)</label><input id="kf" name="file" type="file" accept="image/*,application/pdf"></div>'+
   sel('ks','Decision',[['approved','Accept'],['declined','Decline'],['pending','Keep in review']],c.status==='declined'?'declined':c.status==='approved'?'approved':'pending')+
   inp('kn','Note for the applicant (required when declining)',c.note||'','maxlength="160" placeholder="e.g. Photo is blurry, please send again"')+
   '<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Save</button></div>',function(v){
    var status=v.ks,note=String(v.kn||'').trim(),file=document.querySelector('#mf [name=file]').files[0];
    if(status==='declined'&&note.length<3)return 'Say why it was declined so the applicant can fix it.';
    if(file&&file.size>8*1024*1024)return 'That file is larger than 8 MB.';
    var done=function(path){
      if(!x.live){var m=S.kyc[kind+':'+id]||(S.kyc[kind+':'+id]={});var o=m[doc]||(m[doc]={});o.status=status;o.note=note;if(file||path){o.file=path||file.name;o.byAdmin=true}}
      else if(U.kyc.live[kind]){var r=U.kyc.live[kind].filter(function(z){return z.id===id})[0];if(r){r.docs=(r.docs||[]).filter(function(d){return d.doc!==doc}).concat([{doc:doc,status:status,note:note,file:path||(c.file||null),by_admin:!!path||!!c.byAdmin}])}}
      log(x.name+' · '+name+' '+(status==='approved'?'approved':status==='declined'?'declined':'in review')+(file?' (uploaded by ChowBuy)':''),'kyc');audit('KYC '+status+' · '+x.name+' · '+name);save();refresh();setTimeout(function(){kOpen(kind,id)},0);toast(name+' '+(status==='pending'?'kept in review.':status+'.'))};
    if(beOn()&&x.live){
      var path=file?id+'/'+doc+'-'+Date.now()+'-'+file.name.replace(/[^\w.\-]/g,'_'):null;
      var call=function(){return beReq('/rest/v1/rpc/admin_kyc_set','POST',{p_kind:kind,p_subject:id,p_doc:doc,p_status:status,p_note:note,p_path:path})};
      var up=file?fetch(BE.url.replace(/\/+$/,'')+'/storage/v1/object/kyc/'+path,{method:'POST',headers:{apikey:BE.anon,Authorization:'Bearer '+BE.tok,'Content-Type':file.type||'application/octet-stream'},body:file}).then(function(r){if(!r.ok)throw new Error('Upload failed ('+r.status+')')}):Promise.resolve();
      up.then(call).then(function(){done(path)},function(e){toast(e.message,'err')});return;
    }
    done(null);
  });
}
function vEmergency(){
  if(beOn()){ if(!U.emrl.live&&!U.emrl.load){U.emrl.load=true;beReq('/rest/v1/emergency_services?select=*&order=sort.asc','GET').then(function(j){U.emrl.live=j;U.emrl.load=false;refresh()},function(){U.emrl.live=[];U.emrl.load=false;refresh()})}
    if(!U.sosl.live&&!U.sosl.load){U.sosl.load=true;beReq('/rest/v1/rpc/admin_sos_list','POST',{}).then(function(j){U.sosl.live=j;U.sosl.load=false;refresh()},function(e){U.sosl.err=e.message;U.sosl.live=[];U.sosl.load=false;refresh()})} }
  var svc=beOn()&&U.emrl.live?U.emrl.live:S.emerg;
  var sos=beOn()&&U.sosl.live?U.sosl.live.map(function(e){return{id:e.id,rider:e.rider,phone:e.phone,order:e.order,lat:e.lat,lng:e.lng,status:e.status,note:e.note,at:Date.parse(e.created_at),contacts:e.contacts||[]}}):S.sos;
  var open=sos.filter(function(e){return e.status!=='resolved'}).length;
  var srows=svc.map(function(e){return '<tr><td><b>'+esc(e.label)+'</b></td><td>'+esc((EKINDS.filter(function(k){return k[0]===e.kind})[0]||[0,e.kind])[1])+'</td><td>'+esc(e.city||'Nationwide')+'</td><td class="mono"><a href="tel:'+esc(String(e.number).replace(/\s/g,''))+'">'+esc(e.number)+'</a></td><td>'+sw(e.active,'emTog',e.id,'Show '+e.label+' to riders')+'</td><td class="r"><div class="rowact">'+btn(ic('edit')+'Edit','emEdit',e.id)+btn('Delete','emDel',e.id,'danger')+'</div></td></tr>'}).join('');
  var erows=sos.slice().sort(function(a,b){return b.at-a.at}).map(function(e){var m=e.lat!=null?'https://maps.google.com/?q='+Number(e.lat).toFixed(5)+','+Number(e.lng).toFixed(5):'';
    return '<tr><td><b>'+esc(e.rider)+'</b><small style="display:block">'+esc(e.phone||'')+'</small></td><td>'+(e.order?esc(e.order):'—')+'</td><td>'+(m?'<a href="'+m+'" target="_blank" rel="noopener">Open map</a>':'—')+'</td><td>'+esc(fdt(e.at))+'</td><td>'+pill(e.status==='open'?'open':e.status,e.status==='open'?'bad':e.status==='acknowledged'?'warn':'ok')+'</td><td class="r"><div class="rowact">'+btn('Details','sosOpen',e.id,'pri')+'</div></td></tr>'}).join('');
  return head('Emergency services','Numbers riders see in the app, and SOS alerts riders have raised.',btn(ic('plus')+'Add number','emAdd',null,'pri'))+
  '<div class="grid g3">'+kpi('Open SOS alerts',num(open),'','alert',open?'':'g')+kpi('Numbers shown to riders',num(svc.filter(function(e){return e.active}).length),'','phone','n')+kpi('Total SOS alerts',num(sos.length),'','shield')+'</div>'+
  '<div class="card"><div class="bar"><b>SOS alerts</b></div>'+(sos.length?'<div class="tw"><table class="t" style="min-width:48rem"><thead><tr><th>Rider</th><th>Order</th><th>Location</th><th>Raised</th><th>Status</th><th></th></tr></thead><tbody>'+erows+'</tbody></table></div>':empty('shield','No SOS alerts','Nothing has been raised.'))+'</div>'+
  '<div class="card" style="margin-top:1rem"><div class="bar"><b>Emergency directory</b></div><div class="tw"><table class="t" style="min-width:48rem"><thead><tr><th>Name</th><th>Type</th><th>Where</th><th>Number</th><th>Shown</th><th></th></tr></thead><tbody>'+srows+'</tbody></table></div></div>';
}
function emForm(id){
  var e=id?(beOn()&&U.emrl.live?U.emrl.live:S.emerg).filter(function(x){return x.id===id})[0]:{city:'',kind:'police',label:'',number:'',active:true};if(!e)return;
  openM('<h3>'+(id?'Edit':'Add')+' emergency number</h3>'+inp('el','Name',e.label,'maxlength="60" placeholder="Lagos Police Command"')+sel('ek','Type',EKINDS,e.kind)+inp('ec','City (leave empty for nationwide)',e.city||'','maxlength="30" placeholder="Lagos"')+inp('en','Phone number',e.number,'inputmode="tel" placeholder="112"')+'<div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Save</button></div>',function(v){
    var lab=String(v.el).trim(),num_=String(v.en).trim();
    if(lab.length<2)return 'Enter a name.';if(!/^[+]?[0-9 ]{3,}$/.test(num_))return 'Enter a phone number using digits only.';
    var rec={id:id,city:String(v.ec).trim(),kind:v.ek,label:lab,number:num_,active:e.active!==false};
    var done=function(nid){if(!beOn()){if(id){var t=S.emerg.filter(function(x){return x.id===id})[0];Object.assign(t,rec)}else{rec.id='E'+Date.now();S.emerg.push(rec)}}else U.emrl.live=null;log('Emergency number '+(id?'updated':'added')+': '+lab,'settings');audit('Emergency number saved · '+lab);save();refresh();toast('Saved '+lab+'.')};
    if(beOn()){beReq('/rest/v1/rpc/admin_emergency_save','POST',{p_id:id||null,p_city:rec.city,p_kind:rec.kind,p_label:lab,p_number:num_,p_active:rec.active}).then(done,function(er){toast(er.message,'err')});return}
    done();
  });
}
function sosOpen(id){
  var sos=beOn()&&U.sosl.live?U.sosl.live.map(function(e){return{id:e.id,rider:e.rider,phone:e.phone,order:e.order,status:e.status,note:e.note,at:Date.parse(e.created_at),contacts:e.contacts||[]}}):S.sos;
  var e=sos.filter(function(x){return x.id===id})[0];if(!e)return;
  openM('<h3>SOS from '+esc(e.rider)+'</h3><p class="muted">'+esc(fdt(e.at))+(e.order?' · order '+esc(e.order):'')+'</p><div class="kv"><span>Rider phone</span><b><a href="tel:'+esc(e.phone||'')+'">'+esc(e.phone||'—')+'</a></b>'+(e.contacts||[]).map(function(c,i){return '<span>Contact '+(i+1)+'</span><b>'+esc(c.name)+' · <a href="tel:'+esc(c.phone)+'">'+esc(c.phone)+'</a></b>'}).join('')+'</div>'+
   sel('ss','Status',[['open','Open'],['acknowledged','Acknowledged'],['resolved','Resolved']],e.status)+inp('sn','Note',e.note||'','maxlength="160" placeholder="What was done"')+'<div class="ft"><button type="button" class="btn" data-m="x">Close</button><button type="submit" class="btn pri">Save</button></div>',function(v){
    var done=function(){if(!beOn()){var t=S.sos.filter(function(x){return x.id===id})[0];t.status=v.ss;t.note=v.sn}else U.sosl.live=null;log('SOS from '+e.rider+' marked '+v.ss,'warn');audit('SOS '+v.ss+' · '+e.rider);save();refresh();toast('SOS marked '+v.ss+'.')};
    if(beOn()){beReq('/rest/v1/rpc/admin_sos_set','POST',{p_id:id,p_status:v.ss,p_note:String(v.sn||'')}).then(done,function(er){toast(er.message,'err')});return}done();
  });
}
Object.assign(A,{
 kycOpen:function(el){kOpen(T('kycK','rider'),el.getAttribute('data-id'))},
 kycDoc:function(el){var p=el.getAttribute('data-id').split('|');closeM();kDocForm(p[0],p[1],p[2])},
 kycDecide:function(el){var p=el.getAttribute('data-id').split('|'),kind=p[0],id=p[1],yes=p[2]==='1',x=kFind(kind,id);if(!x)return;
   var done=function(){if(!x.live){var t=(kind==='rider'?S.riders:S.merchants).filter(function(z){return z.id===id})[0];t.status=yes?'active':(kind==='rider'?'suspended':'rejected');if(kind==='merchant')t.kyc=yes?'verified':'rejected'}else if(U.kyc.live[kind]){U.kyc.live[kind].forEach(function(z){if(z.id===id){z.verified=yes;z.active=yes}})}
     log(x.name+(yes?' accepted':' declined')+' after KYC review','kyc');audit('KYC '+(yes?'accept':'decline')+' · '+x.name);save();closeM();refresh();toast(x.name+(yes?' accepted.':' declined.'),yes?'':'warn')};
   if(beOn()&&x.live){beReq('/rest/v1/rpc/admin_kyc_decide','POST',{p_kind:kind,p_subject:id,p_approve:yes}).then(done,function(e){toast(e.message,'err')});return}done()},
 emAdd:function(){emForm(null)},emEdit:function(el){emForm(el.getAttribute('data-id'))},
 emTog:function(el){var id=el.getAttribute('data-id'),list=beOn()&&U.emrl.live?U.emrl.live:S.emerg,e=list.filter(function(x){return x.id===id})[0];if(!e)return;
   var on=!e.active,done=function(){e.active=on;log(e.label+(on?' shown to riders':' hidden from riders'),'settings');save();refresh()};
   if(beOn()){beReq('/rest/v1/rpc/admin_emergency_save','POST',{p_id:id,p_city:e.city||'',p_kind:e.kind,p_label:e.label,p_number:e.number,p_active:on}).then(done,function(er){toast(er.message,'err')});return}done()},
 emDel:function(el){var id=el.getAttribute('data-id'),list=beOn()&&U.emrl.live?U.emrl.live:S.emerg,e=list.filter(function(x){return x.id===id})[0];if(!e)return;
   confirmM('Delete '+esc(e.label)+'?','Riders will no longer see this number.','Delete',function(){var done=function(){if(beOn())U.emrl.live=U.emrl.live.filter(function(x){return x.id!==id});else S.emerg=S.emerg.filter(function(x){return x.id!==id});log('Emergency number removed: '+e.label,'settings');save();refresh();toast('Deleted.')};
     if(beOn()){beReq('/rest/v1/rpc/admin_emergency_delete','POST',{p_id:id}).then(done,function(er){toast(er.message,'err')});return}done()},true)},
 sosOpen:function(el){sosOpen(el.getAttribute('data-id'))}
});
Object.assign(IC,{clock:IC.clock||'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',phone:IC.phone||'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.100 4.200 2 2 0 0 1 4.100 2h3a2 2 0 0 1 2 1.700c.1 1 .4 1.900.7 2.800a2 2 0 0 1-.5 2.100L8.100 9.900a16 16 0 0 0 6 6l1.300-1.300a2 2 0 0 1 2.100-.4c.9.300 1.800.6 2.800.7a2 2 0 0 1 1.700 2z"/>'});
ROUTES.splice(ROUTES.map(function(r){return r.p}).indexOf('riders')+1,0,{p:'kyc',n:'KYC review',i:'shield',g:'Marketplace',v:vKyc},{p:'emergency',n:'Emergency services',i:'alert',g:'Marketplace',v:vEmergency});
buildNav();

/* drawer */
function openSide(){$('#side').classList.add('open');$('#scrim').classList.add('show');$('#burger').setAttribute('aria-expanded','true')}
function closeSide(){$('#side').classList.remove('open');$('#scrim').classList.remove('show');var b=$('#burger');if(b)b.setAttribute('aria-expanded','false')}

/* theme (shared key with the public site) */
var mq=window.matchMedia('(prefers-color-scheme: dark)'),savedTheme=null;
try{savedTheme=localStorage.getItem('cb-theme')}catch(e){}
function setTheme(t,keep){document.documentElement.setAttribute('data-theme',t);var b=$('#theme');if(b){b.innerHTML=ic(t==='dark'?'sun':'moon');b.setAttribute('aria-label',t==='dark'?'Switch to light theme':'Switch to dark theme')}if(keep){savedTheme=t;try{localStorage.setItem('cb-theme',t)}catch(e){}}}

/* init */
buildNav();
$('#burger').innerHTML=ic('menu');$('#closeSide').innerHTML=ic('x');$('#bell').innerHTML=ic('bell')+'<span class="dot" id="nbadge"></span>';
$('#burger').onclick=openSide;$('#closeSide').onclick=closeSide;$('#scrim').onclick=closeSide;
$('#ctxIcon').innerHTML=ic('shield');$('#extIcon').innerHTML=ic('ext');
setTheme(savedTheme||(mq.matches?'dark':'light'));
if(mq.addEventListener)mq.addEventListener('change',function(e){if(!savedTheme)setTheme(e.matches?'dark':'light')});
render(false);
})();
