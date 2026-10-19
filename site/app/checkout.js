(function(){
var C=CB,$=C.$,cfg=C.cfg(),P=cfg.pay,F=cfg.fare;
var items=[['Jollof rice & chicken',2,5200],['Fried plantain',1,1540],['Zobo (500ml)',1,1700]];
var sub=items.reduce(function(s,i){return s+i[1]*i[2]},0),del=Number(F.base)+Number(F.perKm)*3,svc=Number(F.service),total=sub+del+svc;
var bal=20000;try{var b=localStorage.getItem('cb-demo-wallet');if(b!==null)bal=Number(b)}catch(e){}
var method=null,timer=null;
$('#sum').innerHTML=items.map(function(i){return '<div class="row2"><span>'+i[1]+' × '+C.esc(i[0])+'</span><b class="mono">'+C.ngn(i[1]*i[2])+'</b></div>'}).join('')+'<div class="row2"><span class="muted">Delivery (3 km)</span><span class="mono">'+C.ngn(del)+'</span></div><div class="row2"><span class="muted">Service fee</span><span class="mono">'+C.ngn(svc)+'</span></div><div class="row2 tot"><span>Total</span><span class="mono">'+C.ngn(total)+'</span></div>';
function logos(){return '<span class="logos"><span class="lg" style="font-style:italic;color:#1A1F71">VISA</span><span class="lg" style="color:#EB001B">MC</span><span class="lg" style="color:#00A650">Verve</span></span>'}
function methods(){
  var first=$('#first').checked,m=[];
  if(P.wallet&&P.wallet.enabled)m.push({k:'wallet',t:'ChowBuy wallet',s:'Balance '+C.ngn(bal),off:bal<total?'Balance too low for this order':''});
  if(P.korapay&&P.korapay.enabled)m.push({k:'card',t:'Debit / credit card',s:'Secure checkout by Korapay'+(P.korapay.isLive?'':' (sandbox)'),extra:logos()});
  if(P.pocketfi&&P.pocketfi.enabled)m.push({k:'bank',t:'Pay with bank transfer',s:'One-time account by Pocketfi'+(P.pocketfi.isLive?'':' (sandbox)')});
  if(P.cod&&P.cod.enabled)m.push({k:'cod',t:'Cash on delivery',s:'Pay your rider on arrival',off:total>Number(P.cod.maxOrder)?'Available for orders up to '+C.ngn(P.cod.maxOrder):(first&&!P.cod.otpFirst?'Not available for first-time customers':'')});
  return m}
function paint(){
  var m=methods();if(method&&!m.some(function(x){return x.k===method&&!x.off}))method=null;
  $('#opts').innerHTML=m.length?m.map(function(x){return '<label class="opt'+(method===x.k?' on':'')+(x.off?' off':'')+'" role="radio" aria-checked="'+(method===x.k)+'"><input type="radio" name="pm" value="'+x.k+'"'+(method===x.k?' checked':'')+(x.off?' disabled':'')+'><span><b>'+x.t+'</b><small>'+(x.off||x.s)+'</small></span>'+(x.extra||'')+'</label>'}).join(''):'<div class="empty"><b>No payment methods are enabled</b><span>An admin can turn them on in Settings → Payment gateways.</span></div>';
  var b=$('#pay');b.disabled=!method;b.textContent=method?(method==='cod'?'Place order · pay on delivery':'Pay '+C.ngn(total)):'Choose a payment method';
}
$('#opts').addEventListener('change',function(e){if(e.target.name==='pm'){method=e.target.value;paint()}});$('#first').addEventListener('change',paint);paint();
function finish(label,ref,status){
  var id='CB'+(1000+Math.floor(Math.random()*9000));
  try{localStorage.setItem('cb-demo-order',JSON.stringify({id:id,method:label,ref:ref,total:total,status:status,name:$('#cname').value||'Customer',placed:Date.now(),otp:String(1000+Math.floor(Math.random()*9000))}))}catch(e){}
  C.toast('Payment successful. Taking you to your order…');setTimeout(function(){location.href='order.html?id='+id},900)}
function luhn(n){var s=0,d=false;for(var i=n.length-1;i>=0;i--){var x=+n[i];if(d){x*=2;if(x>9)x-=9}s+=x;d=!d}return s%10===0}
function brand(n){return /^4/.test(n)?'Visa':/^(5[1-5]|2[2-7])/.test(n)?'Mastercard':/^(5061|6500)/.test(n)?'Verve':''}
function card(){
  C.openM('<h3>Korapay secure checkout</h3><p class="muted">'+(P.korapay.isLive?'Live':'Sandbox')+' mode · '+C.ngn(total)+'</p><div class="f"><label for="cn">Card number <span id="cb" class="muted"></span></label><input id="cn" name="cn" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="23"></div><div class="frow"><div class="f"><label for="ce">Expiry</label><input id="ce" name="ce" inputmode="numeric" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp"></div><div class="f"><label for="cv">CVV</label><input id="cv" name="cv" inputmode="numeric" type="password" maxlength="4" autocomplete="cc-csc"></div></div><p class="err" id="merr" role="alert"></p><div class="acts"><button type="button" class="btn sm" id="tc">Use test card</button></div><div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Pay '+C.ngn(total)+'</button></div><p class="demo">Demo: nothing is sent to Korapay. Use the test card.</p>',function(v){
    var n=v.cn.replace(/\s/g,'');if(!/^\d{13,19}$/.test(n)||!luhn(n))return 'That card number is not valid.';
    var m=/^(\d\d)\/(\d\d)$/.exec(v.ce);if(!m||+m[1]<1||+m[1]>12||(2000+ +m[2])*12+ +m[1]<2026*12+10)return 'Check the expiry date.';
    if(!/^\d{3,4}$/.test(v.cv))return 'Enter the CVV.';
    var bt=$('#mf button[type=submit]');bt.disabled=true;bt.textContent='Processing…';
    setTimeout(function(){C.closeM();finish('Card via Korapay','KPY_TX_'+(100000000+Math.floor(Math.random()*899999999)),'Paid')},1500)});
  var cn=$('#cn');cn.addEventListener('input',function(){var d=cn.value.replace(/\D/g,'').slice(0,19);cn.value=d.replace(/(.{4})/g,'$1 ').trim();$('#cb').textContent=brand(d)})
  $('#ce').addEventListener('input',function(e){var d=e.target.value.replace(/\D/g,'').slice(0,4);e.target.value=d.length>2?d.slice(0,2)+'/'+d.slice(2):d});
  $('#tc').onclick=function(){cn.value='4111 1111 1111 1111';$('#cb').textContent='Visa';$('#ce').value='12/29';$('#cv').value='123'}}
function bank(){
  var secs=Number(P.pocketfi.expiry||30)*60,acct='99'+String(Math.floor(10000000+Math.random()*89999999)),state='wait',nm=$('#cname').value||'Customer';
  var g=acct.slice(0,4)+' '+acct.slice(4,7)+' '+acct.slice(7);
  C.openM('<h3>Pay by bank transfer</h3><p class="muted">Transfer from any Nigerian bank app. This account works once.</p><div class="kv" style="grid-template-columns:auto 1fr"><span>Bank</span><b>'+C.esc(P.pocketfi.bank||'Wema Bank')+'</b><span>Account name</span><b>ChowBuy / '+C.esc(nm)+'</b></div><div class="acts" style="justify-content:space-between;flex-wrap:nowrap"><div class="acct" id="ac">'+g+'</div><button type="button" class="btn sm" data-copy="'+acct+'">'+C.ic('copy')+'Copy account number</button></div><div class="acts" style="justify-content:space-between;flex-wrap:nowrap"><div><span class="muted">Exact amount</span><div style="font:800 1.8rem var(--display)">'+C.ngn(total)+'</div></div><button type="button" class="btn sm" data-copy="'+total+'">'+C.ic('copy')+'Copy amount</button></div><div class="card pad" style="background:var(--amber-soft);border-color:transparent;font-size:.88rem"><b>Please transfer the exact amount</b> to prevent automatic refund delays.</div><div class="acts" style="justify-content:space-between"><div><span class="muted">Expires in</span><div class="timer" id="tm"></div></div><div class="acts" id="st"><span class="pulse"></span><span>Listening for incoming bank transfer…</span></div></div><div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="button" class="btn pri" id="ok">I have transferred the money</button></div>',null,function(){clearInterval(timer)});
  function tick(){var m=Math.floor(secs/60),s=secs%60;$('#tm').textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;if(secs<=0&&state==='wait'){state='exp';clearInterval(timer);$('#st').innerHTML='<span class="err">Account expired. Generate new details.</span>';$('#ok').textContent='Generate new details'}secs--}
  tick();timer=setInterval(tick,1000);
  $('#ok').onclick=function(){if(state==='exp'){C.closeM();bank();return}if(state!=='wait')return;state='val';$('#ok').disabled=true;$('#st').innerHTML='<span class="pulse"></span><span>Validating transfer webhook…</span>';setTimeout(function(){clearInterval(timer);C.closeM();finish('Bank transfer via Pocketfi','PKF_'+Math.floor(Math.random()*1e9),'Paid')},1800)}}
function cod(){
  var first=$('#first').checked&&P.cod.otpFirst,otp=String(1000+Math.floor(Math.random()*9000));
  C.openM('<h3>Cash on delivery</h3><div class="card pad" style="background:var(--accent-soft);border-color:transparent">Please have exact cash ready or prepare to transfer to the rider’s ChowBuy POS upon delivery.</div>'+(first?'<p class="muted">As a first-time customer, confirm your phone number. Demo code: <b class="mono">'+otp+'</b></p><div class="f"><label for="oc">4-digit code</label><input id="oc" name="oc" inputmode="numeric" maxlength="4"></div>':'')+'<p class="err" id="merr" role="alert"></p><div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Place order</button></div>',function(v){if(first&&v.oc!==otp)return 'That code does not match.';C.closeM();finish('Cash on delivery','COD-'+Math.floor(Math.random()*1e8),'Pay '+C.ngn(total)+' on delivery')})}
function wallet(){C.openM('<h3>Pay from wallet</h3><p class="muted">'+C.ngn(total)+' will be deducted from your balance of '+C.ngn(bal)+'.</p><div class="ft"><button type="button" class="btn" data-m="x">Cancel</button><button type="submit" class="btn pri">Pay '+C.ngn(total)+'</button></div>',function(){try{localStorage.setItem('cb-demo-wallet',String(bal-total))}catch(e){}C.closeM();finish('ChowBuy wallet','WLT-'+Math.floor(Math.random()*1e8),'Paid')})}
$('#pay').onclick=function(){if(method==='card')card();else if(method==='bank')bank();else if(method==='cod')cod();else if(method==='wallet')wallet()};
})();
