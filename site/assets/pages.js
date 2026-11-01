(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

/* toast */
function toast(msg){
  var box=$('#toasts');if(!box)return;var t=document.createElement('div');
  t.className='toast';t.innerHTML='<svg class="ic"><use href="#i-sparkles"/></svg><span></span>';t.lastChild.textContent=msg;
  while(box.children.length>2)box.removeChild(box.firstChild);
  box.appendChild(t);
  setTimeout(function(){t.classList.add('out');setTimeout(function(){t.remove()},320)},3200);
}
document.addEventListener('click',function(e){var b=e.target.closest('[data-toast]');if(b)toast(b.getAttribute('data-toast'))});

/* theme (shares the key used on the home page) */
var root=document.documentElement,th=$('#theme'),mq=window.matchMedia('(prefers-color-scheme: dark)'),saved=null;
try{saved=localStorage.getItem('cb-theme')}catch(e){}
function eff(){return root.getAttribute('data-theme')||'light'}
function applyTheme(t,keep){root.setAttribute('data-theme',t);if(th){th.setAttribute('aria-pressed',t==='dark');th.setAttribute('aria-label',t==='dark'?'Switch to light theme':'Switch to dark theme')}if(keep){saved=t;try{localStorage.setItem('cb-theme',t)}catch(e){}}}
applyTheme(saved||eff());
if(th)th.addEventListener('click',function(){applyTheme(eff()==='dark'?'light':'dark',true)});

/* mobile menu */
var dr=$('#drawer'),bg=$('#burger');
function menu(o){dr.classList.toggle('open',o);dr.setAttribute('aria-hidden',!o);bg.setAttribute('aria-expanded',o)}
if(bg){bg.onclick=function(){menu(true)};$('#closeMenu').onclick=function(){menu(false)};
dr.addEventListener('click',function(e){if(e.target.closest('a'))menu(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape')menu(false)})}

/* accordions */
document.addEventListener('click',function(e){
  var b=e.target.closest('.fq > h3 > button');if(!b)return;
  var q=b.closest('.fq'),o=!q.classList.contains('open');q.classList.toggle('open',o);b.setAttribute('aria-expanded',o);
});

/* forms: no backend on static hosting, so open the visitor's email app with the message filled in */
$$('form[data-mailto]').forEach(function(f){
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(!f.checkValidity()){f.reportValidity();return}
    var lines=[];
    $$('input,select,textarea',f).forEach(function(el){
      if(!el.name||el.type==='checkbox'&&!el.checked)return;
      var l=(el.getAttribute('data-label')||el.name);lines.push(l+': '+el.value);
    });
    var subj=f.getAttribute('data-subject')||'ChowBuy enquiry';
    var nm=f.elements['name'];if(nm&&nm.value)subj+=' - '+nm.value;
    location.href='mailto:'+f.getAttribute('data-mailto')+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(lines.join('\n\n'));
    toast('Opening your email app to send this. Nothing is sent until you press Send there.');
  });
});

/* help centre: category + search filter */
var hs=$('#hsearch');
if(hs){
  var cat='all',items=$$('.fq[data-cat]'),empty=$('#hempty');
  function filt(){
    var q=hs.value.trim().toLowerCase(),n=0;
    items.forEach(function(it){
      var ok=(cat==='all'||it.getAttribute('data-cat')===cat)&&(!q||it.textContent.toLowerCase().indexOf(q)>-1);
      it.style.display=ok?'':'none';if(ok)n++;
    });
    empty.style.display=n?'none':'block';
  }
  hs.addEventListener('input',filt);
  $$('.cat-tabs button').forEach(function(b){b.addEventListener('click',function(){
    cat=b.getAttribute('data-cat');$$('.cat-tabs button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});filt();
  })});
}

/* track order demo */
var tf=$('#trackForm');
if(tf){
  var steps=[['Restaurant accepted','Your kitchen is cooking','6 min'],['Rider picked up','Your rider collected the order','12 min'],['On the way','1.2km away','6 min'],['Delivered','Enjoy your meal!','0 min']];
  var list=$('#tsteps'),idx=0,timer=null;
  list.innerHTML=steps.map(function(s,i){return '<li class="tstep"><span class="dot"><svg class="ic"><use href="#i-check"/></svg></span><div><b>'+s[0]+'</b><small>'+s[1]+'</small></div></li>'}).join('');
  function paint(){
    $$('.tstep',list).forEach(function(li,i){li.classList.toggle('done',i<idx);li.classList.toggle('now',i===idx)});
    $('#eta').textContent=idx===3?'Delivered':'Arriving in '+steps[idx][2];
    $('#bar').style.width=((idx+1)/steps.length*100)+'%';
  }
  tf.addEventListener('submit',function(e){
    e.preventDefault();
    var v=$('#oid').value.trim().toUpperCase(),err=$('#oerr');
    if(!/^CB\d{4,8}$/.test(v)){err.textContent='Order IDs look like CB2481. Check your confirmation message and try again.';return}
    err.textContent='';$('#oshow').textContent='Order #'+v;
    $('#trkBox').classList.add('show');idx=0;paint();clearInterval(timer);
    timer=setInterval(function(){idx=(idx+1)%steps.length;paint()},2400);
    $('#trkBox').scrollIntoView({behavior:'smooth',block:'nearest'});
  });
}
})();
