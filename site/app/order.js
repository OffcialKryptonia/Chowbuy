(function(){
var C=CB,$=C.$,cfg=C.cfg(),q=new URLSearchParams(location.search),merchant=q.get('view')==='merchant';
var o=null;try{o=JSON.parse(localStorage.getItem('cb-demo-order'))}catch(e){}
if(!o||(q.get('id')&&o.id!==q.get('id'))){o={id:q.get('id')||'CB2481',method:'Card via Korapay',ref:'KPY_TX_982314981',total:14850,status:'Paid',name:'Kelechi Okafor',otp:'7294'}}
$('#ttl').textContent=(merchant?'Merchant view · ':'Order ')+'#'+o.id;$('#sub').textContent=merchant?'Hand the order to the rider only after they show the customer’s code.':'Mama Put Kitchen → Lekki Phase 1';
$('#pst').textContent=o.status;$('#pm').textContent=o.method;$('#pr').textContent=o.ref;$('#pt').textContent=C.ngn(o.total);
$('#call').innerHTML=C.ic('phone')+'Call rider';$('#chat').innerHTML=C.ic('chat')+'Chat';
var TH={dark:{bg:'#0F172A',road:'#26334D',water:'#13324F',txt:'#94A3B8',route:'#FF8A00'},silver:{bg:'#E6E8EB',road:'#FFFFFF',water:'#C6D4E1',txt:'#6B7280',route:'#FF5A1F'},standard:{bg:'#EAF0E1',road:'#FFFFFF',water:'#A8D3F0',txt:'#4B5563',route:'#FF5A1F'}};
var c=TH[cfg.maps.theme]||TH.dark,route='M130,340 C240,340 260,240 370,230 C480,220 520,120 660,110';
$('#mnote').textContent='Map shown: ChowBuy built-in map ('+(cfg.maps.theme==='dark'?'Dark':cfg.maps.theme==='silver'?'Silver':'Standard')+' theme). Google Maps is used instead when a valid key is configured in a live build.';
var svg=$('#map');
svg.innerHTML='<rect width="800" height="460" fill="'+c.bg+'"/><path d="M0,400 C200,370 400,420 800,360 L800,460 L0,460Z" fill="'+c.water+'"/><path d="M0,80 C200,40 400,120 800,70 M0,200 C250,170 450,260 800,210 M120,0 C160,150 100,300 150,460 M330,0 C370,150 300,300 360,460 M560,0 C600,150 540,300 600,460 M740,0 C700,150 780,300 730,460" stroke="'+c.road+'" stroke-width="4" fill="none" opacity=".7"/><path id="rt" d="'+route+'" fill="none" stroke="'+c.route+'" stroke-width="6" stroke-linecap="round" opacity=".35"/><path id="rd" d="'+route+'" fill="none" stroke="'+c.route+'" stroke-width="6" stroke-linecap="round"/>'+
 '<g transform="translate(130,340)"><circle r="20" fill="#0F2A4A" stroke="#fff" stroke-width="3"/><g transform="translate(-10,-10) scale(.83)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+C.IC.store+'</g></g><text x="130" y="378" text-anchor="middle" style="font:700 12px Manrope;fill:'+c.txt+'">Mama Put Kitchen</text>'+
 '<g transform="translate(660,110)"><circle r="20" fill="#12A150" stroke="#fff" stroke-width="3"/><g transform="translate(-10,-10) scale(.83)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+C.IC.home+'</g></g><text x="660" y="148" text-anchor="middle" style="font:700 12px Manrope;fill:'+c.txt+'">Your address</text>'+
 '<g id="rk"><circle r="18" fill="#FF5A1F" stroke="#fff" stroke-width="3"/><g transform="translate(-10,-10) scale(.83)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+C.IC.bike+'</g></g>';
var path=$('#rd'),L=path.getTotalLength(),p=.12,STEPS=['Order confirmed','Rider picking up','On the way','Arriving'];
path.style.strokeDasharray='0 '+L;
function paint(){
  var pt=path.getPointAtLength(p*L),pt2=path.getPointAtLength(Math.min(L,p*L+3)),ang=Math.atan2(pt2.y-pt.y,pt2.x-pt.x)*180/Math.PI;
  $('#rk').setAttribute('transform','translate('+pt.x+','+pt.y+')');$('#rk').firstChild.setAttribute('transform','rotate('+(Math.abs(ang)>90?ang+180:ang)+')');
  path.style.strokeDasharray=(p*L)+' '+L;path.setAttribute('opacity','1');
  var min=Math.max(0,Math.ceil((1-p)*18)),km=((1-p)*3.2).toFixed(1);
  $('#eta').textContent=p>=1?'Your rider has arrived':'Arriving in '+min+' min ('+km+' km away)';
  var st=p<.2?1:p<.9?2:p<1?3:4;
  $('#steps').innerHTML=STEPS.map(function(s,i){var d=i<st-1||(st===4),n=i===st-1&&st<4;return '<li class="'+(d?'done':n?'now':'')+'"><i>'+(d?C.ic('check'):'')+'</i>'+s+'</li>'}).join('');
  $('#otpbox').innerHTML=merchant?'<h3>Handover check</h3><p class="muted" style="margin:.4rem 0 .8rem">Ask the rider for the customer’s 4-digit code.</p><form id="ov" class="acts" style="flex-wrap:nowrap"><input id="oi" inputmode="numeric" maxlength="4" placeholder="0000" style="width:100%;padding:.65rem;border:1px solid var(--line);border-radius:.8rem;background:var(--bg)"><button class="btn pri" type="submit">Verify</button></form>':'<h3>Delivery code</h3><p class="muted" style="margin:.4rem 0 .8rem">Give this code to your rider when they arrive to release the order.</p><div class="otp" aria-label="Delivery code '+o.otp.split('').join(' ')+'">'+o.otp.split('').map(function(d){return '<i>'+d+'</i>'}).join('')+'</div>';
}
paint();
var t=setInterval(function(){if(p<1){p=Math.min(1,p+.006);paint();if(p>=1)clearInterval(t)}},1000);
document.addEventListener('submit',function(e){if(e.target.id==='ov'){e.preventDefault();var v=$('#oi').value;if(v===o.otp)C.toast('Handover confirmed. Order released to the rider.');else C.toast('That code does not match.','err')}});
$('#chat').onclick=function(){C.openM('<h3>Chat with Sodiq</h3><div class="chatlog" id="cl"><div class="bub">Hi '+C.esc(o.name.split(' ')[0])+', I am on my way with your order.</div></div><div class="acts" style="flex-wrap:nowrap"><input id="cm" name="cm" placeholder="Type a message" style="width:100%;padding:.65rem;border:1px solid var(--line);border-radius:.8rem;background:var(--bg)"><button class="btn pri" type="submit">Send</button></div><div class="ft"><button type="button" class="btn" data-m="x">Close</button></div><p class="demo">Demo chat. Messages are not sent anywhere.</p>',function(v){var m=(v.cm||'').trim();if(!m)return;var l=$('#cl'),a=document.createElement('div');a.className='bub me';a.textContent=m;l.appendChild(a);$('#cm').value='';setTimeout(function(){var b=document.createElement('div');b.className='bub';b.textContent='Got it, thanks!';l.appendChild(b);l.scrollTop=l.scrollHeight},900)})};
})();
