/* Shared helpers for the demo customer pages. Reads settings the admin saved in this browser. */
window.CB=(function(){
var $=function(s,r){return (r||document).querySelector(s)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ngn(n){return '₦'+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',')}
function cfg(){
  var s={};try{s=JSON.parse(localStorage.getItem('cb-admin-v1')).s||{}}catch(e){}
  var pay=s.pay||{korapay:{enabled:true,isLive:false},pocketfi:{enabled:true,isLive:false,expiry:30,bank:'Wema Bank'},cod:{enabled:true,maxOrder:30000,otpFirst:true,riderLimit:50000},wallet:{enabled:true,allowTransfers:true}};
  var fare=(s.settings&&s.settings.fare)||{base:700,perKm:120,service:150,minBasket:1500};
  var maps=s.maps||{enabled:true,theme:'dark',status:'none'};
  return{pay:pay,fare:fare,maps:maps}
}
var IC={check:'<path d="M20 6 9 17l-5-5"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',bike:'<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 17.5V14l-3-3 4-3 2 3h2"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',store:'<path d="m3 9 1.5-5h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',home:'<path d="m3 11 9-8 9 8M5 10v10h14V10"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'};
function ic(n,c){return '<svg class="ic'+(c?' '+c:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+IC[n]+'</svg>'}
function toast(msg,type){var b=$('#toasts');if(!b)return;var t=document.createElement('div');t.className='toast'+(type==='err'?' err':'');t.innerHTML=ic(type==='err'?'x':type==='warn'?'alert':'check')+'<span></span>';t.lastChild.textContent=msg;b.appendChild(t);setTimeout(function(){t.remove()},3600)}
var Mfn=null,Mclose=null;
function openM(html,fn,onClose){$('#mbody').innerHTML='<form id="mf" novalidate>'+html+'</form>';Mfn=fn;Mclose=onClose;$('#mwrap').classList.add('show');var f=$('#mf input,#mf button[type=submit]');if(f)setTimeout(function(){f.focus()},30)}
function closeM(){$('#mwrap').classList.remove('show');if(Mclose)Mclose();Mclose=null;Mfn=null}
document.addEventListener('click',function(e){var t=e.target;if(t.closest&&t.closest('[data-m=x]')){closeM();return}if(t===$('#mwrap'))closeM();var c=t.closest&&t.closest('[data-copy]');if(c)copy(c.getAttribute('data-copy'))});
document.addEventListener('submit',function(e){if(e.target.id==='mf'){e.preventDefault();var f=e.target,o={};[].forEach.call(f.elements,function(el){if(el.name)o[el.name]=el.value});var r=Mfn&&Mfn(o);if(typeof r==='string'){var er=$('#merr');if(er)er.textContent=r}}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('#mwrap').classList.contains('show'))closeM()});
function copy(t){var ok=function(){toast('Copied to clipboard')};try{if(navigator.clipboard){navigator.clipboard.writeText(t).then(ok,function(){toast('Copy failed','err')});return}}catch(e){}var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){toast('Copy failed','err')}a.remove()}
var saved=null;try{saved=localStorage.getItem('cb-theme')}catch(e){}
function setTheme(t,keep){document.documentElement.setAttribute('data-theme',t);var b=$('#theme');if(b)b.innerHTML=ic(t==='dark'?'sun':'moon');if(keep){try{localStorage.setItem('cb-theme',t)}catch(e){}}}
setTheme(saved||'light');
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#theme'))setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark',true)});
return{$:$,esc:esc,ngn:ngn,cfg:cfg,ic:ic,toast:toast,openM:openM,closeM:closeM,copy:copy,IC:IC}
})();
