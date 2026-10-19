/* ChowBuy merchant demo data. Everything here is invented sample data. */
window.MSEED=function(v){
var now=Date.now(),MIN=60000,DAY=86400000;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var R=rng(v.length*977+7);
var pick=function(a){return a[Math.floor(R()*a.length)]};
var NAMES=['Halima Bello','Chinedu Okeke','Aisha Yusuf','Tunde Bakare','Ngozi Eze','Femi Adebayo','Zainab Musa','Ifeanyi Obi','Kemi Adeleke','Emeka Nwosu','Bola Ajayi','Sadiq Lawal','Amaka Okafor','Segun Adeyemi'];
var ADDR=['12 Adeola Odeku St, Victoria Island','Block 4, Admiralty Way, Lekki Phase 1','7 Allen Avenue, Ikeja GRA','23 Bode Thomas St, Surulere','5 Aminu Kano Cres, Wuse 2, Abuja','18 Ozumba Mbadiwe Ave, Victoria Island','3 Kofo Abayomi St, Victoria Island','14 Adetokunbo Ademola St, Ikoyi'];
var phone=function(){return '+234 80'+(1+Math.floor(R()*9))+' '+String(100+Math.floor(R()*900))+' '+String(1000+Math.floor(R()*9000))};
var storeNames={restaurant:'Bukka Republic',grocery:"Ade's Super Mart",pharmacy:'CarePoint Pharmacy',package:'Swiftbox Couriers'};
var items=[],cats=[];
function it(id,name,cat,price,cost,o){o=o||{};items.push(Object.assign({id:id,name:name,cat:cat,price:price,cost:cost,sku:'',barcode:'',stock:30,reserved:0,reorder:10,pack:'',prep:15,diet:[],desc:'',vat:true,cal:'',allergens:'',available:true,restore:false,img:'',mods:[],rx:false,controlled:false,sold:Math.floor(40+R()*260),batches:[]},o))}
var P1=[{n:'Choose protein',type:'single',req:true,max:1,opts:[['Beef',1200],['Fried Chicken',1500],['Goat Meat',1800],['Fish',1000]]},{n:'Add extras',type:'multi',req:false,max:3,opts:[['Fried Plantain',500],['Extra Egg',300],['Extra Pepper Sauce',200],['Titus Fish',1200]]}];
if(v==='restaurant'){
 cats=['Rice Dishes','Swallows & Soups','Grills & Shawarma','Drinks & Chops'].map(function(n,i){return {id:'C'+(i+1),name:n,show:true}});
 it('I1','Party Jollof Rice','Rice Dishes',3500,1500,{diet:['Spicy'],prep:20,mods:P1,desc:'Smoky party-style jollof with your choice of protein.',cal:'640 kcal',allergens:'Fish (optional)'});
 it('I2','Fried Rice & Chicken','Rice Dishes',4200,1900,{prep:20,mods:P1,desc:'Veggie-loaded fried rice with grilled chicken.',cal:'710 kcal'});
 it('I3','Coconut Rice','Rice Dishes',3800,1600,{diet:['Halal'],desc:'Fragrant coconut rice, lightly spiced.'});
 it('I4','Ofada Rice & Ayamase','Rice Dishes',4500,2100,{diet:['Spicy'],prep:25,desc:'Local ofada rice with green pepper stew.'});
 it('I5','Pounded Yam & Egusi','Swallows & Soups',4800,2300,{prep:25,mods:[{n:'Choose protein',type:'single',req:true,max:1,opts:[['Assorted meat',0],['Goat Meat',800],['Stockfish',600]]}],desc:'Smooth pounded yam with rich egusi soup.'});
 it('I6','Amala, Ewedu & Gbegiri','Swallows & Soups',3600,1600,{desc:'Classic Ibadan combo with ewedu and gbegiri.'});
 it('I7','Eba & Okra Soup','Swallows & Soups',3300,1500,{desc:'Fresh okra soup with eba.'});
 it('I8','Suya Platter','Grills & Shawarma',3000,1300,{diet:['Spicy','Halal'],prep:15,desc:'Beef suya, onions, tomatoes and yaji.'});
 it('I9','Chicken Shawarma','Grills & Shawarma',3200,1400,{diet:['Halal'],prep:10,desc:'Grilled chicken in toasted wrap.'});
 it('I10','Grilled Catfish','Grills & Shawarma',6500,3400,{diet:['Spicy'],prep:35,desc:'Whole catfish grilled in pepper sauce.'});
 it('I11','Peppered Snail','Drinks & Chops',4000,2200,{diet:['Spicy'],desc:'Tender snail in rich pepper sauce.'});
 it('I12','Chapman','Drinks & Chops',1500,500,{diet:['Vegetarian'],prep:5,desc:'Chilled Nigerian Chapman.'});
 it('I13','Zobo (500ml)','Drinks & Chops',800,250,{diet:['Vegetarian'],prep:3,desc:'Hibiscus drink with ginger and pineapple.'});
 it('I14','Puff Puff (10 pcs)','Drinks & Chops',1200,400,{diet:['Vegetarian'],prep:8,desc:'Soft, golden puff puff.'});
 items.forEach(function(x,i){x.stock=20+Math.floor(R()*60);x.reorder=15;x.sku='BR-'+String(100+i);x.barcode='6154000'+String(10000+i*37)});
}else if(v==='grocery'){
 cats=['Staples','Beverages','Fresh Produce','Household','Snacks'].map(function(n,i){return {id:'C'+(i+1),name:n,show:true}});
 var G=[['Long-grain Parboiled Rice 5kg','Staples',9800,8200,'5 kg bag'],['Vegetable Oil 2L','Staples',6200,5300,'2 L bottle'],['Spaghetti 500g','Staples',950,780,'500 g pack'],['Instant Noodles (carton of 40)','Staples',9500,8300,'Carton x40'],['Powdered Milk 400g','Beverages',3400,2900,'400 g tin'],['Bottled Water 75cl (12 pack)','Beverages',1800,1350,'Pack x12'],['Orange Juice 1L','Beverages',1400,1050,'1 L carton'],['Fresh Tomatoes (basket)','Fresh Produce',3500,2400,'Basket'],['Plantain (bunch)','Fresh Produce',2500,1700,'Bunch'],['Eggs (crate of 30)','Fresh Produce',4800,4100,'Crate x30'],['Laundry Detergent 1kg','Household',2100,1650,'1 kg'],['Toilet Roll (10 pack)','Household',2900,2200,'Pack x10'],['Chin Chin 500g','Snacks',1700,1100,'500 g bag'],['Digestive Biscuits','Snacks',600,420,'Pack']];
 G.forEach(function(g,i){var perish=g[1]==='Fresh Produce'||/Milk|Juice|Eggs/.test(g[0]);var exp=now+(perish?(2+Math.floor(R()*9)):(120+Math.floor(R()*300)))*DAY;
   it('I'+(i+1),g[0],g[1],g[2],g[3],{pack:g[4],sku:'AD-'+String(2000+i),barcode:'6154001'+String(20000+i*53),stock:Math.floor(6+R()*70),reorder:12,prep:0,batches:[{no:'B'+(240+i),qty:0,exp:exp}]});
   var x=items[items.length-1];x.batches[0].qty=x.stock});
 items[2].stock=4;items[2].batches[0].qty=4;items[9].stock=7;items[9].batches[0].qty=7;items[9].batches[0].exp=now+2*DAY;items[4].batches[0].exp=now+5*DAY;
}else if(v==='pharmacy'){
 cats=['Pain & Fever','Antibiotics (Rx)','Malaria','Vitamins & Supplements','Allergy & Cold','Controlled (Rx)'].map(function(n,i){return {id:'C'+(i+1),name:n,show:true}});
 var D=[['Paracetamol 500mg x20','Pain & Fever',600,380,'Pack of 20',0,0],['Ibuprofen 400mg x10','Pain & Fever',900,600,'Pack of 10',0,0],['Amoxicillin 500mg caps x21','Antibiotics (Rx)',3200,2300,'Pack of 21',1,0],['Azithromycin 500mg x3','Antibiotics (Rx)',4500,3200,'Pack of 3',1,0],['Artemether-Lumefantrine x24','Malaria',2500,1800,'Pack of 24',1,0],['Vitamin C 1000mg x30','Vitamins & Supplements',2800,1900,'Tub of 30',0,0],['Multivitamin Kids Syrup 100ml','Vitamins & Supplements',2200,1500,'100 ml bottle',0,0],['Loratadine 10mg x10','Allergy & Cold',1500,950,'Pack of 10',0,0],['ORS Sachets x5','Allergy & Cold',800,520,'Box of 5',0,0],['Tramadol 50mg x10','Controlled (Rx)',3000,2100,'Pack of 10',1,1],['Codeine Cough Syrup 100ml','Controlled (Rx)',3800,2700,'100 ml bottle',1,1],['Hand Sanitizer 250ml','Allergy & Cold',1200,700,'250 ml',0,0]];
 D.forEach(function(d,i){var exp=now+(60+Math.floor(R()*500))*DAY;it('I'+(i+1),d[0],d[1],d[2],d[3],{pack:d[4],rx:!!d[5],controlled:!!d[6],sku:'CP-'+String(3000+i),barcode:'6154002'+String(30000+i*41),stock:Math.floor(8+R()*80),reorder:15,prep:0,diet:d[5]?['Rx only']:['OTC'],batches:[{no:'L'+(510+i),qty:0,exp:exp}]});var x=items[items.length-1];x.batches[0].qty=x.stock});
 items[3].stock=5;items[3].batches[0].qty=5;items[0].batches[0].exp=now+20*DAY;items[7].batches[0].exp=now+9*DAY;
}
function mkOrder(i,status,minsAgo){
  var n=2+Math.floor(R()*2),lines=[],sub=0,pool=items.filter(function(x){return x.available});
  for(var k=0;k<n&&pool.length;k++){var p=pick(pool),q=1+Math.floor(R()*2),mods=[],extra=0;
    if(v==='restaurant'&&p.mods.length){p.mods.forEach(function(g){if(g.req||R()>.5){var o=g.opts[Math.floor(R()*g.opts.length)];mods.push(o[0]);extra+=o[1]}})}
    lines.push({id:p.id,name:p.name,qty:q,price:p.price,mods:mods,extra:extra,note:''});sub+=(p.price+extra)*q}
  var pay=pick(['Card','Transfer','Wallet','Cash on Delivery']);
  var o={id:'#CB-'+(84920+i*7),ts:now-minsAgo*MIN,status:status,customer:NAMES[i%NAMES.length],phone:phone(),addr:ADDR[i%ADDR.length],pay:pay,paid:pay!=='Cash on Delivery',lines:lines,sub:sub,fee:800+Math.floor(R()*5)*100,note:v==='restaurant'&&i%3===0?'Please make it very spicy and pack the sauce separately.':(i%4===1?'Call me at the gate, the bell is faulty.':''),prep:0,acceptedAt:0,due:0,rider:null,cancelReason:''};
  if(status!=='new'&&status!=='cancelled'){o.prep=[15,25,40][i%3];o.acceptedAt=o.ts+3*MIN;o.due=o.acceptedAt+o.prep*MIN}
  if(status==='preparing')o.due=now+(i%2?-4:9)*MIN;
  if(status==='accepted')o.due=now+o.prep*MIN-2*MIN;
  if(status==='ready'||status==='out'||status==='completed'){o.rider={name:pick(['Musa Ibrahim','Kelechi Obi','Dayo Fashola','Sani Garba']),plate:'LSD-'+(100+Math.floor(R()*899))+'XY',eta:6}}
  if(status==='cancelled')o.cancelReason='Item out of stock';
  return o}
var orders=[];
if(v!=='package'){[['new',2],['new',5],['new',9],['accepted',14],['preparing',22],['preparing',31],['ready',36],['out',44],['completed',75],['completed',130],['completed',190],['cancelled',100]].forEach(function(s,i){orders.push(mkOrder(i,s[0],s[1]))})}
var rx=[],ships=[];
if(v==='pharmacy'){
 rx=[
 {id:'RX-3301',patient:'Halima Bello',age:34,phone:phone(),doctor:'Dr. A. Okonkwo',clinic:'Lakeview Medical Centre, Ikeja',clinicReg:'MDCN 48211',ts:now-8*MIN,status:'pending',drugs:[{name:'Amoxicillin 500mg caps x21',qty:1,sig:'1 cap three times daily, 7 days',itemId:'I3'},{name:'Paracetamol 500mg x20',qty:1,sig:'2 tabs when needed',itemId:'I1'}],clarify:'',reason:''},
 {id:'RX-3302',patient:'Emeka Nwosu',age:51,phone:phone(),doctor:'Dr. F. Bakare',clinic:'St. Anne Clinic, Lekki',clinicReg:'MDCN 39012',ts:now-21*MIN,status:'pending',drugs:[{name:'Tramadol 50mg x10',qty:1,sig:'1 cap at night, 5 days',itemId:'I10'}],clarify:'',reason:''},
 {id:'RX-3303',patient:'Zainab Musa',age:7,phone:phone(),doctor:'Dr. R. Adamu',clinic:'Wuse Children Hospital, Abuja',clinicReg:'MDCN 51877',ts:now-47*MIN,status:'pending',drugs:[{name:'Artemether-Lumefantrine x24',qty:1,sig:'Weight-based, 3 days',itemId:'I5'},{name:'Multivitamin Kids Syrup 100ml',qty:1,sig:'5 ml daily',itemId:'I7'}],clarify:'',reason:''},
 {id:'RX-3304',patient:'Segun Adeyemi',age:42,phone:phone(),doctor:'Dr. K. Lawal',clinic:'Surulere Family Clinic',clinicReg:'MDCN 28340',ts:now-95*MIN,status:'clarify',drugs:[{name:'Azithromycin 500mg x3',qty:1,sig:'1 daily, 3 days',itemId:'I4'}],clarify:'Asked patient to confirm penicillin allergy status.',reason:''},
 {id:'RX-3305',patient:'Amaka Okafor',age:29,phone:phone(),doctor:'Unreadable',clinic:'Unknown',clinicReg:'',ts:now-180*MIN,status:'rejected',drugs:[{name:'Codeine Cough Syrup 100ml',qty:1,sig:'Illegible',itemId:'I11'}],clarify:'',reason:'Illegible prescription'}];
}
if(v==='package'){
 var sh=function(i,st,mins,o){return Object.assign({id:'PKG-'+(77201+i*3),ts:now-mins*MIN,status:st,from:pick(['12 Adeola Odeku St, Victoria Island','Computer Village, Ikeja','Palms Mall, Lekki','Balogun Market, Lagos Island']),to:pick(ADDR),sender:NAMES[(i+3)%NAMES.length],senderPhone:phone(),recipient:NAMES[i%NAMES.length],recipPhone:phone(),weight:1+Math.floor(R()*12),size:pick(['Small','Medium','Large']),cat:pick(['Documents','Electronics','Clothing']),fragile:R()>.65,express:R()>.6,km:+(3+R()*18).toFixed(1),pod:pick(['Photo + Signature','Photo Only','4-digit OTP Confirmation']),rider:null,otp:String(1000+Math.floor(R()*8999))},o||{})};
 ships=[sh(0,'pending',4),sh(1,'pending',12),sh(2,'assigned',28,{rider:'Musa Ibrahim'}),sh(3,'picked',41,{rider:'Kelechi Obi'}),sh(4,'transit',58,{rider:'Dayo Fashola'}),sh(5,'delivered',120,{rider:'Sani Garba'}),sh(6,'pending',2,{express:true,fragile:true})];
}
var branches=[{id:'B1',name:'Victoria Island Flagship',addr:'12 Adeola Odeku St, Victoria Island',mgr:'Chiamaka Eze',phone:'+234 803 410 2291',status:'open',radius:10,f:1,lat:'6.4281',lng:'3.4219',rev:1840000,rate:4.8},{id:'B2',name:'Lekki Phase 1',addr:'Block 4, Admiralty Way, Lekki Phase 1',mgr:'Tunde Bakare',phone:'+234 808 552 1180',status:'open',radius:8,f:.68,lat:'6.4478',lng:'3.4723',rev:1210000,rate:4.6},{id:'B3',name:'Ikeja GRA',addr:'7 Allen Avenue, Ikeja GRA',mgr:'Aisha Yusuf',phone:'+234 802 901 7733',status:'busy',radius:7,f:.52,lat:'6.6018',lng:'3.3515',rev:930000,rate:4.5}];
var revs=[
 ['Halima Bello',5,'Thank you! The food was hot and arrived early. Will order again.',v],['Chinedu Okeke',4,'Great quality. Packaging could be a bit better.',v],['Ifeanyi Obi',5,'Always consistent. My whole office orders every Friday.',v],['Kemi Adeleke',2,'Order was 20 minutes late and one item was missing.',v],['Sadiq Lawal',5,'Fast, polite and the portions are generous.',v],['Ngozi Eze',3,'Good but a bit pricey for the size.',v],['Femi Adebayo',1,'Rude rubbish. This is spam, do not buy!!!',v],['Bola Ajayi',4,'Nice experience overall, will recommend.',v]];
var reviews=revs.map(function(r,i){var ord=items.length?items[i%items.length].name:'Parcel delivery';return {id:'RV'+(i+1),name:r[0],rating:r[1],text:r[2],at:now-(i*9+3)*3600000,item:ord,reply:i===0?"Thank you for ordering with us, "+r[0].split(' ')[0]+"! We're glad you enjoyed it.":'',dispute:'',}});
return {
 vertical:v,branch:'B1',sound:true,
 store:{name:storeNames[v],phone:'+234 803 555 0142',email:'orders@'+storeNames[v].toLowerCase().replace(/[^a-z]/g,'')+'.ng',rc:'RC 1849302',addr:'12 Adeola Odeku St, Victoria Island, Lagos',bio:v==='restaurant'?'Authentic Nigerian bukka food, cooked fresh and delivered hot.':v==='grocery'?'Your neighbourhood super mart: fresh groceries delivered in minutes.':v==='pharmacy'?'Licensed community pharmacy with pharmacist-verified prescriptions.':'Same-day parcel and document delivery across Lagos.',logo:'',cover:'',status:'open',pauseReason:'',eta:25,pcn:'PCN 24518',pharmacist:'Pharm. Adaeze Nnamdi'},
 me:{name:'Chiamaka Eze',email:'chiamaka@'+storeNames[v].toLowerCase().replace(/[^a-z]/g,'')+'.ng',role:v==='pharmacy'?'owner':'owner'},
 cats:cats,items:items,orders:orders,rx:rx,ships:ships,branches:branches,reviews:reviews,
 promos:v==='package'?[]:[{id:'P1',title:'Free delivery over ₦8,000',type:'freedel',value:0,min:8000,code:'FREEDEL',on:true,ends:now+6*DAY,uses:128},{id:'P2',title:'Lunch flash deal: 15% off',type:'pct',value:15,min:0,code:'LUNCH15',on:true,ends:now+3*3600000,flash:true,uses:64},{id:'P3',title:'₦500 off first order',type:'amt',value:500,min:2500,code:'WELCOME500',on:false,ends:now+20*DAY,uses:212}],
 staff:[{id:'T1',name:'Chiamaka Eze',email:'chiamaka@example.ng',branch:'B1',role:'owner',status:'active'},{id:'T2',name:'Tunde Bakare',email:'tunde@example.ng',branch:'B2',role:'manager',status:'active'},{id:'T3',name:'Musa Danjuma',email:'musa@example.ng',branch:'B1',role:'kitchen',status:'active'},{id:'T4',name:'Ada Obi',email:'ada@example.ng',branch:'B3',role:v==='pharmacy'?'pharmacist':'kitchen',status:'invited'}],
 wallet:{available:2486500,pending:842300,lifetime:38240000,commission:6120000,ledger:[{id:'L1',t:'Order settlement #CB-84853',amt:18400,at:now-2*3600000,dir:1},{id:'L2',t:'Order settlement #CB-84851',amt:12800,at:now-3*3600000,dir:1},{id:'L3',t:'Withdrawal to GTBank',amt:500000,at:now-1*DAY,dir:-1},{id:'L4',t:'Order settlement #CB-84822',amt:24600,at:now-1*DAY,dir:1},{id:'L5',t:'Commission adjustment',amt:3200,at:now-2*DAY,dir:-1}]},
 banks:[{id:'K1',bank:'GTBank',no:'0123456789',name:storeNames[v]+' Ltd',def:true},{id:'K2',bank:'Kuda',no:'2034567891',name:storeNames[v]+' Ltd',def:false}],
 payouts:[{id:'PO-9021',amt:500000,bank:'GTBank',at:now-1*DAY,status:'completed',fee:0},{id:'PO-8974',amt:750000,bank:'GTBank',at:now-4*DAY,status:'completed',fee:0},{id:'PO-8902',amt:1200000,bank:'Kuda',at:now-9*DAY,status:'completed',fee:0},{id:'PO-8833',amt:640000,bank:'GTBank',at:now-16*DAY,status:'completed',fee:0}],
 schedule:'daily',pin:'',
 hoods:[['Victoria Island',true,3000],['Ikoyi',true,3500],['Lekki Phase 1',true,4000],['Oniru',true,4000],['Ajah',false,6000],['Maryland',false,5000],['Surulere',false,5500],['Ikeja GRA',true,4500]].map(function(h,i){return {id:'H'+i,name:h[0],on:h[1],min:h[2]}}),
 radius:10,surge:{on:false,amt:300},
 hours:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(function(d,i){return {d:d,open:true,a:'11:00',b:'15:00',split:i<5,c:'18:00',e:'23:00'}}),
 notifPref:{chime:true,whatsapp:true,daily:true},
 tickets:[],
 notifs:[{id:'N1',t:'Welcome to your ChowBuy merchant dashboard.',k:'sparkles',at:now-3600000,read:false},{id:'N2',t:'A customer left a 2-star review. Reply to recover the rating.',k:'star',at:now-2*3600000,read:false}],
 activity:[{t:'Order #CB-84921 completed',k:'checkc',at:now-20*MIN},{t:'New 5-star review from Halima Bello',k:'star',at:now-55*MIN},{t:'Rider Musa Ibrahim arrived for pickup',k:'bike',at:now-70*MIN},{t:'Payout PO-9021 sent to GTBank',k:'bank',at:now-DAY}]
};
};
