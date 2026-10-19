/* ChowBuy Admin: seed data. All figures are demo data. */
(function(){
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var R=rng(20261015);
function pick(a){return a[Math.floor(R()*a.length)]}
function int(a,b){return Math.floor(a+R()*(b-a+1))}
var V={restaurant:'Restaurants',grocery:'Super Marts',pharmacy:'Pharmacies',package:'Packages'};
var CITIES=['Lagos','Abuja','Ibadan','Port Harcourt','Kano'];
var RATE={restaurant:15,grocery:10,pharmacy:12,package:20};

var M=[['Mama Put Kitchen','restaurant','Lagos'],['Suya Republic','restaurant','Abuja'],['Naija Pizza Co.','restaurant','Lagos'],['Amala Spot','restaurant','Ibadan'],['Shawarma Lounge','restaurant','Port Harcourt'],['Burger Palace','restaurant','Kano'],['Chicken Republic Ikeja','restaurant','Lagos'],['Item 7 Kitchen','restaurant','Abuja'],
['ChowBuy Mart','grocery','Lagos'],['Ebeano Supermart','grocery','Lagos'],['Spar Wuse','grocery','Abuja'],['Shoprite Ibadan','grocery','Ibadan'],['Justrite Kano','grocery','Kano'],['Fresh Basket PH','grocery','Port Harcourt'],
['MedPoint Pharmacy','pharmacy','Lagos'],['HealthPlus Lekki','pharmacy','Lagos'],['Alpha Pharmacy','pharmacy','Abuja'],['Medplus Bodija','pharmacy','Ibadan'],['CarePlus PH','pharmacy','Port Harcourt'],
['Naija Wheels Dispatch','package','Lagos'],['SwiftParcel','package','Abuja'],['QuickSend Ibadan','package','Ibadan'],['PH Courier Hub','package','Port Harcourt'],['Kano Express','package','Kano']];
var MS=['active','active','active','active','active','active','pending','active','active','active','active','active','suspended','active','pending','active','active','active','active','suspended','active','active','pending','active'];
var merchants=M.map(function(m,i){var st=MS[i];return{id:'M'+(100+i),name:m[0],vertical:m[1],city:m[2],branches:int(1,9),joined:'2025-'+('0'+int(1,12)).slice(-2)+'-'+('0'+int(1,28)).slice(-2),orders30:st==='pending'?0:int(400,9000),gmv30:0,rate:RATE[m[1]],kyc:st==='pending'?(i%2?'pending':'rejected'):'verified',status:st}});
merchants.forEach(function(m){m.gmv30=m.orders30*int(5200,16500)});
merchants[22].kyc='pending';merchants[14].kyc='pending';merchants[6].kyc='verified';

var FN=['Adaeze','Chinedu','Aisha','Tunde','Ngozi','Ibrahim','Funke','Emeka','Bukola','Musa','Zainab','Tamuno','Sodiq','Kelechi','Halima','Segun','Yetunde','Obinna','Amina','Femi'];
var LN=['Okafor','Bello','Adeyemi','Eze','Danjuma','Balogun','Nwosu','Ibrahim','Ojo','Abubakar','Okonkwo','Lawal','Uche','Sani','Fashola'];
function person(){return pick(FN)+' '+pick(LN)}

var riders=[];
['Sodiq Bello','Emeka Obi','Tunde Adeyemi','Ibrahim Musa','Chidi Okafor','Yusuf Garba','Kunle Ajayi','Bashir Sule','Daniel Eze','Segun Alade','Moses Udo','Habib Lawal','Femi Adebayo','Gbenga Ojo','Nuhu Aliyu','Kelvin Obasi','Ahmed Yakubu','Tobi Coker','Peter Nnamdi','Ridwan Salami','Abdul Kabiru','Ifeanyi Okeke','Samuel Etim','Lanre Bakare'].forEach(function(n,i){
 var st=i%11===4?'onboarding':i%13===7?'suspended':'active';
 riders.push({id:'R'+(200+i),name:n,type:i%3===0?'FLEET':'PARTNER',city:CITIES[i%5],trips30:st==='onboarding'?0:int(60,420),rating:st==='onboarding'?0:Math.round((4.2+R()*.8)*10)/10,accept:st==='onboarding'?0:int(68,99),status:st})});
riders[3].status='onboarding';riders[9].status='onboarding';

var HOODS={Lagos:['Lekki Phase 1','Victoria Island','Ikeja GRA','Yaba','Surulere','Ajah'],Abuja:['Wuse 2','Garki','Maitama','Gwarinpa'],Ibadan:['Bodija','Ring Road','Jericho'],'Port Harcourt':['GRA Phase 2','Rumuola','Trans-Amadi'],Kano:['Nassarawa GRA','Sabon Gari']};
var orders=[];
var stp=['completed','completed','completed','completed','processing','processing','pending','cancelled'];
var vk=Object.keys(V),pf={restaurant:'CHB-',grocery:'CHB-',pharmacy:'RX-',package:'PKG-'};
var now=new Date('2026-10-15T20:30:00+01:00').getTime();
for(var i=0;i<64;i++){
 var v=vk[i%7===0?3:i%5===0?2:i%3===0?1:0];
 var ms=merchants.filter(function(m){return m.vertical===v&&m.status==='active'});var m=pick(ms);
 var total=v==='package'?int(1800,9500):v==='pharmacy'?int(2500,28000):v==='grocery'?int(6000,48000):int(2800,22000);
 var st=pick(stp);var ridersOk=riders.filter(function(r){return r.status==='active'&&r.city===m.city});
 orders.push({id:pf[v]+(48210-i*7),vertical:v,merchant:m.name,customer:person(),city:m.city,total:total,commission:Math.round(total*RATE[v]/100),status:st,rider:(st==='pending'||st==='cancelled')?'':pick(ridersOk.length?ridersOk:riders).name,placed:now-i*1000*60*int(4,19)})}

var categories=[['Jollof & Rice dishes','restaurant',184,412,14.2],['Swallow & Soups','restaurant',156,380,11.8],['Grills & Suya','restaurant',122,297,9.6],['Pizza & Fast Food','restaurant',98,254,8.4],['Shawarma & Wraps','restaurant',64,188,4.1],['Cooking Essentials','grocery',1240,512,7.9],['Fresh Produce','grocery',860,433,5.7],['Beverages','grocery',540,501,4.6],['Household','grocery',720,298,3.3],['Medicines','pharmacy',1880,236,4.9],['Vitamins & Supplements','pharmacy',640,201,2.1],['Personal Care','pharmacy',510,188,1.8],['Baby & Mother','pharmacy',290,142,0.9],['Documents & Parcels','package',0,96,5.2],['Same-day Courier','package',0,74,3.6],['Fragile & Large','package',0,41,1.1]].map(function(c,i){return{id:'C'+i,name:c[0],vertical:c[1],items:c[2],merchants:c[3],share:c[4],visible:i!==15}});

var brands=[['Mama Gold','grocery',34,212,1],['Devon King\'s','grocery',28,184,1],['Indomie','grocery',22,461,1],['Peak','grocery',18,390,0],['Golden Penny','grocery',41,402,1],['Emzor','pharmacy',64,176,1],['Fidson','pharmacy',52,148,0],['May & Baker','pharmacy',47,131,0],['Chicken Republic','restaurant',36,58,1],['Dominos Nigeria','restaurant',21,34,0],['Mr Biggs','restaurant',29,41,0],['Coca-Cola Nigeria','grocery',26,509,1],['Nestle Nigeria','grocery',58,436,0],['GIG Logistics','package',6,22,0]].map(function(b,i){return{id:'B'+i,name:b[0],vertical:b[1],products:b[2],merchants:b[3],featured:!!b[4]}});

var locs={countries:[{name:'Nigeria',status:'live'},{name:'Ghana',status:'pipeline'},{name:'Kenya',status:'pipeline'}],
 cities:[{name:'Lagos',state:'Lagos',status:'live'},{name:'Abuja',state:'FCT',status:'live'},{name:'Ibadan',state:'Oyo',status:'live'},{name:'Port Harcourt',state:'Rivers',status:'live'},{name:'Kano',state:'Kano',status:'live'}],hoods:[]};
var cyc=['active','active','active','coming_soon','disabled'];var hi=0;
Object.keys(HOODS).forEach(function(c){HOODS[c].forEach(function(n){locs.hoods.push({id:'H'+(hi++),name:n,city:c,status:hi%7===0?'coming_soon':hi%11===0?'disabled':'active'})})});

var settlements=[['ChowBuy Mart','GTBank ••4421','Merchant',8420000,'Week 38','pending'],['Lagos Fleet','Access ••1180','Fleet',6120000,'Sep salaries','pending'],['Sodiq Bello','Kuda ••9004','Rider',184500,'Week 38','pending'],['Suya Republic','Zenith ••7712','Merchant',3260000,'Week 38','processing'],['Mama Put Kitchen','UBA ••3305','Merchant',2910000,'Week 38','completed'],['Abuja Fleet','Access ••2290','Fleet',4410000,'Sep salaries','pending'],['Emeka Obi','Opay ••1175','Rider',162300,'Week 38','completed'],['MedPoint Pharmacy','GTBank ••6618','Merchant',1980000,'Week 38','failed'],['Tunde Adeyemi','Kuda ••5530','Rider',201700,'Week 38','pending'],['Naija Pizza Co.','First Bank ••0942','Merchant',1740000,'Week 38','completed'],['Ibrahim Musa','Palmpay ••8871','Rider',143200,'Week 38','failed'],['Spar Wuse','Zenith ••4408','Merchant',5230000,'Week 38','pending']].map(function(s,i){return{id:'S'+i,payee:s[0],bank:s[1],type:s[2],amount:s[3],cycle:s[4],status:s[5]}});

var transfers=[];var tst=['COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','PENDING','FAILED','REVERSED'];
for(i=0;i<42;i++){var a=person(),b=person(),s=pick(tst);transfers.push({id:'WT-'+(910400-i*13),ts:now-i*1000*60*int(20,200),from:a,to:b===a?'Kemi Adeola':b,amount:int(1,60)*500,fee:i%4===0?50:0,status:s})}

var gstat=['OPEN','LOCKED','PLACED','PLACED','DELIVERED','DELIVERED','CANCELLED'];var groups=[];
var gt=['Office lunch Friday','Birthday suya night','Game night pizza','Estate BBQ','Family jollof Sunday','Team standup pantry run','Church fellowship meal','Hostel shawarma run','Book club snacks','Marketing offsite lunch','Match day wings','Girls night in'];
for(i=0;i<12;i++){var n=int(2,6),tot=0,al=[];for(var k=0;k<n;k++){var x=int(15,60)*100;al.push({name:person(),amt:x,paid:R()>.35});tot+=x}
 var fees=int(5,12)*100;var grand=tot+fees;var off=i===4?300:i===9?-500:0;var share=Math.round(fees/n);
 al.forEach(function(p){p.amt+=share});var sum=al.reduce(function(s,p){return s+p.amt},0)+ (grand-al.reduce(function(s,p){return s+p.amt},0)>0&&Math.abs(grand-sum)<n?0:0);
 var diff=grand-al.reduce(function(s,p){return s+p.amt},0);al[0].amt+=diff; // make exact
 al[0].amt+=off;
 var m2=pick(merchants.filter(function(m){return m.vertical==='restaurant'||m.vertical==='grocery'}));
 groups.push({id:'G'+i,title:gt[i],code:'GRP-'+(4000+i*37),merchant:m2.name,hood:pick(HOODS[m2.city]),status:gstat[i%gstat.length],parts:al,total:grand,hostPays:i%5===1})}

var seo=[['/','ChowBuy | Food Delivery Across Nigeria',"Order food, groceries, pharmacy essentials and parcels delivered in minutes across Nigeria.",1,18420,412300],['/app/groceries','Online Grocery Delivery in Nigeria | ChowBuy','Shop Super Marts and get groceries at your door in about 20 minutes.',1,6210,148900],['/app/pharmacy','Pharmacy Delivery Nigeria | ChowBuy','Order medicines and wellness items from verified pharmacies, delivered fast.',1,3880,97400],['/app/package','Same-day Package Delivery | ChowBuy','Send parcels and documents across your city with the ChowBuy rider network.',1,2140,61200],['/merchant','ChowBuy Merchant Portal','Sell on ChowBuy. Merchant sign in and onboarding.',0,0,0]].map(function(s,i){return{id:'P'+i,path:s[0],title:s[1],desc:s[2],indexed:!!s[3],clicks:s[4],impr:s[5]}});

var team=[['Adaeze Nwosu','adaeze@chowbuy.ng','Super Admin','All verticals','active','Just now'],['Tunde Balogun','tunde@chowbuy.ng','Operations Lead','Lagos • Ibadan','active','18 mins ago'],['Hauwa Sani','hauwa@chowbuy.ng','Merchant Success','Super Marts','active','2 hrs ago'],['Chika Eze','chika@chowbuy.ng','Finance','Payouts & settlements','active','Yesterday'],['Ibrahim Danjuma','ibrahim@chowbuy.ng','Dispatch Controller','Abuja • Kano','active','35 mins ago'],['Kemi Adeola','kemi@chowbuy.ng','Merchant Success','Pharmacies','pending','Never'],['Obinna Uche','obinna@chowbuy.ng','Dispatch Controller','Port Harcourt','suspended','3 weeks ago']].map(function(t,i){return{id:'T'+i,name:t[0],email:t[1],role:t[2],scope:t[3],status:t[4],last:t[5]}});

var activity=[['MedPoint Pharmacy submitted KYC documents','kyc','4 min ago'],['Naija Wheels Dispatch suspended after 3 failed deliveries','warn','22 min ago'],['Commission for Super Marts changed 12% → 10%','settings','1 hr ago'],['Settlement batch Week 37 completed (₦47.2M)','money','3 hrs ago'],['Lekki Phase 1 service area re-enabled','pin','5 hrs ago'],['Dispute #D-3321 resolved in favour of customer','dispute','Yesterday']];

window.CB_SEED=function(){return JSON.parse(JSON.stringify({merchants:merchants,orders:orders,riders:riders,categories:categories,brands:brands,locs:locs,settlements:settlements,transfers:transfers,groups:groups,seo:seo,team:team,activity:activity,
 notifs:[{id:1,t:'3 merchants awaiting KYC review',read:false},{id:2,t:'Settlement batch Week 38 is ready to run',read:false},{id:3,t:'Open disputes crossed 35',read:false},{id:4,t:'Hourly peak: Lagos orders +18% vs last Friday',read:true}],
 smart:{published:{opened:48210,optimized:21904,accepted:9846,dismissed:7512,flags:{free_delivery:true,cheaper:true,value:true,essentials:true,repeat:true,consolidate:false,promo:true,delivery_saving:true,loyalty:false},threshold:12000,maxBundle:12},draft:null},
 brands2:{published:{MAIN:{name:'ChowBuy',tagline:'Cravings? We\'ve got you.',color:'#FF5A1F',rel:'INDEPENDENT',assets:{}},MERCHANT:{name:'ChowBuy Business',tagline:'Grow your store with ChowBuy.',color:'#0F172A',rel:'ENDORSED',assets:{}},RIDER:{name:'ChowBuy Rider',tagline:'Ride. Deliver. Earn.',color:'#FF8A00',rel:'ENDORSED',assets:{}}},draft:null},
 settings:{rates:{restaurant:15,grocery:10,pharmacy:12,package:20},fare:{base:700,perKm:120,service:150,minBasket:1500},cities:CITIES.slice(),gateways:{paystack:true,flutterwave:true,transfer:true,cod:false}}}))};
window.CB_META={V:V,CITIES:CITIES,HOODS:HOODS};
})();
