-- Demo catalogue (same data the app ships with). Replace with real merchants in production.
insert into public.merchants (id,name,vertical,cuisine,image,rating_pct,rating_count,eta_min,eta_max,distance_km,delivery_fee,discount_pct,open,hours,lat,lng,area) values
('m1','Bukka Republic','restaurant',array['Local Swallows','Grills'],'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=800&q=70',98,435,10,20,1.8,600,20,true,'8:00 AM – 11:00 PM',6.4281,3.4219,'Victoria Island'),
('m2','Mama Put Express','restaurant',array['Local Swallows','Chicken'],'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=70',95,812,15,25,2.4,500,null,true,'9:00 AM – 10:00 PM',6.4474,3.4723,'Lekki Phase 1'),
('m3','Slice Lagos','restaurant',array['Pizza','Italian'],'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=70',93,268,20,30,3.1,700,15,true,'11:00 AM – 11:30 PM',6.4549,3.4246,'Ikoyi'),
('m4','Smash Burger Co.','restaurant',array['Burger'],'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=70',91,190,15,25,2.9,600,null,true,'10:00 AM – 12:00 AM',6.4396,3.4177,'Victoria Island'),
('m5','Ade''s Super Mart','grocery',array['Groceries'],'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=70',98,1204,20,30,2.2,500,null,true,'7:00 AM – 10:00 PM',6.4331,3.4309,'Victoria Island'),
('m6','CarePoint Pharmacy','pharmacy',array['Pharmacy'],'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=70',97,640,15,25,1.4,500,null,true,'Open 24 hours',6.4262,3.4256,'Victoria Island'),
('m7','Swiftbox Couriers','package',array['Courier'],'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=800&q=70',94,321,30,60,3,1500,null,true,'8:00 AM – 8:00 PM',6.435,3.428,'Victoria Island')
on conflict (id) do nothing;

insert into public.products (id,merchant_id,name,descr,price,image,category,modifiers,rx,controlled,in_stock) values
('p1','m1','Amala, Ewedu & Gbegiri','Hot amala with ewedu, gbegiri and rich stew.',3600,'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=800&q=70','Local Swallows','[{"id":"g-size","name":"Portion","required":true,"multi":false,"max":1,"options":[{"id":"sz-r","name":"Regular","price":0},{"id":"sz-l","name":"Large","price":800}]},{"id":"g-prot","name":"Add protein","required":false,"multi":true,"max":3,"options":[{"id":"p-beef","name":"Beef","price":500},{"id":"p-fish","name":"Fish","price":700},{"id":"p-egg","name":"Boiled egg","price":200},{"id":"p-pk","name":"Ponmo","price":300}]}]'::jsonb,false,false,true),
('p2','m1','Ofada Rice & Ayamase','Ofada rice with designer ayamase sauce.',4500,'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=70','Rice Dishes','[{"id":"g-size","name":"Portion","required":true,"multi":false,"max":1,"options":[{"id":"sz-r","name":"Regular","price":0},{"id":"sz-l","name":"Large","price":800}]},{"id":"g-prot","name":"Add protein","required":false,"multi":true,"max":3,"options":[{"id":"p-beef","name":"Beef","price":500},{"id":"p-fish","name":"Fish","price":700},{"id":"p-egg","name":"Boiled egg","price":200},{"id":"p-pk","name":"Ponmo","price":300}]}]'::jsonb,false,false,true),
('p3','m1','Suya Platter','Spicy beef suya with onions, tomatoes and yaji.',3000,'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=70','Grills','[]'::jsonb,false,false,true),
('p4','m1','Chapman (500ml)','Chilled Chapman with cucumber and orange.',1500,'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=70','Drinks','[]'::jsonb,false,false,true),
('p5','m5','Golden Penny Semovita 1kg','Premium semovita.',2100,'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=70','Staples','[]'::jsonb,false,false,true),
('p6','m5','Peak Milk Tin 400g','Full cream powdered milk.',4200,'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=70','Dairy & Eggs','[]'::jsonb,false,false,true),
('p7','m5','Fresh Tomatoes (1kg)','Farm fresh, picked today.',1800,'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=70','Fruits and Vegetables','[]'::jsonb,false,false,true),
('p8','m6','Paracetamol 500mg x20','Pain and fever relief.',600,'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=70','Pain & Fever','[]'::jsonb,false,false,true),
('p9','m6','Amoxicillin 500mg x21','Antibiotic. Prescription required.',3200,'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=70','Antibiotics','[]'::jsonb,true,false,true),
('p10','m6','Vitamin C 1000mg x30','Immune support.',2800,'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=800&q=70','Vitamins','[]'::jsonb,false,false,true)
on conflict (id) do nothing;

insert into public.promos (code,pct) values ('LUNCH15',15),('WELCOME10',10),('CHOW20',20) on conflict do nothing;
insert into public.chat_filters (id,name,enabled,action,words,builtin) values
 ('prof','Profanity and insults',true,'mask',array['idiot','stupid','useless','fool','nonsense','shut up'],false),
 ('har','Harassment and threats',true,'block',array['i know where you live','i will find you','meet me tonight','send me your photo'],false),
 ('pay','Off-platform payment',true,'block',array['send money','bank transfer','account number','pay me','transfer to my account','opay','palmpay','moniepoint','cancel the order'],false),
 ('ph','Phone numbers and contact sharing',true,'mask',array[]::text[],true) on conflict do nothing;
insert into public.platform_settings (key,value) values ('public', '{"gateways":{"korapay":{"enabled":true,"publicKey":"","live":false},"pocketfi":{"enabled":true,"live":false},"cod":{"enabled":true,"maxAmount":20000},"wallet":{"enabled":true}},"realtime":{"provider":"off"},"push":{"fcmEnabled":false},"maps":{"directionsViaProxy":true},"loyalty":{"reviewPoints":50}}'::jsonb) on conflict do nothing;

