import type { Merchant, Product, Rider, SavedAddress, ModifierGroup } from './types';

const img = (seed: string) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=70`;

export const MERCHANTS: Merchant[] = [
  { id: 'm1', name: 'Bukka Republic', vertical: 'restaurant', cuisine: ['Local Swallows', 'Grills'], image: img('photo-1604329760661-e71dc83f8f26'), rating: 98, ratingCount: 435, etaMin: 10, etaMax: 20, distanceKm: 1.8, deliveryFee: 600, discountPct: 20, open: true, hours: '8:00 AM – 11:00 PM', location: { latitude: 6.4281, longitude: 3.4219 }, area: 'Victoria Island' },
  { id: 'm2', name: "Mama Put Express", vertical: 'restaurant', cuisine: ['Local Swallows', 'Chicken'], image: img('photo-1567620905732-2d1ec7ab7445'), rating: 95, ratingCount: 812, etaMin: 15, etaMax: 25, distanceKm: 2.4, deliveryFee: 500, open: true, hours: '9:00 AM – 10:00 PM', location: { latitude: 6.4474, longitude: 3.4723 }, area: 'Lekki Phase 1' },
  { id: 'm3', name: 'Slice Lagos', vertical: 'restaurant', cuisine: ['Pizza', 'Italian'], image: img('photo-1513104890138-7c749659a591'), rating: 93, ratingCount: 268, etaMin: 20, etaMax: 30, distanceKm: 3.1, deliveryFee: 700, discountPct: 15, open: true, hours: '11:00 AM – 11:30 PM', location: { latitude: 6.4549, longitude: 3.4246 }, area: 'Ikoyi' },
  { id: 'm4', name: 'Smash Burger Co.', vertical: 'restaurant', cuisine: ['Burger'], image: img('photo-1568901346375-23c9450c58cd'), rating: 91, ratingCount: 190, etaMin: 15, etaMax: 25, distanceKm: 2.9, deliveryFee: 600, open: true, hours: '10:00 AM – 12:00 AM', location: { latitude: 6.4396, longitude: 3.4177 }, area: 'Victoria Island' },
  { id: 'm5', name: "Ade's Super Mart", vertical: 'grocery', cuisine: ['Groceries'], image: img('photo-1542838132-92c53300491e'), rating: 98, ratingCount: 1204, etaMin: 20, etaMax: 30, distanceKm: 2.2, deliveryFee: 500, open: true, hours: '7:00 AM – 10:00 PM', location: { latitude: 6.4331, longitude: 3.4309 }, area: 'Victoria Island' },
  { id: 'm6', name: 'CarePoint Pharmacy', vertical: 'pharmacy', cuisine: ['Pharmacy'], image: img('photo-1587854692152-cbe660dbde88'), rating: 97, ratingCount: 640, etaMin: 15, etaMax: 25, distanceKm: 1.4, deliveryFee: 500, open: true, hours: 'Open 24 hours', location: { latitude: 6.4262, longitude: 3.4256 }, area: 'Victoria Island' },
  { id: 'm7', name: 'Swiftbox Couriers', vertical: 'package', cuisine: ['Courier'], image: img('photo-1566576721346-d4a3b4eaeb55'), rating: 94, ratingCount: 321, etaMin: 30, etaMax: 60, distanceKm: 3.0, deliveryFee: 1500, open: true, hours: '8:00 AM – 8:00 PM', location: { latitude: 6.4350, longitude: 3.4280 }, area: 'Victoria Island' },
];

const sizes: ModifierGroup = { id: 'g-size', name: 'Portion', required: true, multi: false, max: 1, options: [{ id: 'sz-r', name: 'Regular', price: 0 }, { id: 'sz-l', name: 'Large', price: 800 }] };
const proteins: ModifierGroup = { id: 'g-prot', name: 'Add protein', required: false, multi: true, max: 3, options: [{ id: 'p-beef', name: 'Beef', price: 500 }, { id: 'p-fish', name: 'Fish', price: 700 }, { id: 'p-egg', name: 'Boiled egg', price: 200 }, { id: 'p-pk', name: 'Ponmo', price: 300 }] };

export const PRODUCTS: Product[] = [
  { id: 'p1', merchantId: 'm1', name: 'Amala, Ewedu & Gbegiri', desc: 'Hot amala with ewedu, gbegiri and rich stew.', price: 3600, image: img('photo-1604329760661-e71dc83f8f26'), category: 'Local Swallows', modifiers: [sizes, proteins], inStock: true },
  { id: 'p2', merchantId: 'm1', name: 'Ofada Rice & Ayamase', desc: 'Ofada rice with designer ayamase sauce.', price: 4500, image: img('photo-1567620905732-2d1ec7ab7445'), category: 'Rice Dishes', modifiers: [sizes, proteins], inStock: true },
  { id: 'p3', merchantId: 'm1', name: 'Suya Platter', desc: 'Spicy beef suya with onions, tomatoes and yaji.', price: 3000, image: img('photo-1529042410759-befb1204b468'), category: 'Grills', modifiers: [], inStock: true },
  { id: 'p4', merchantId: 'm1', name: 'Chapman (500ml)', desc: 'Chilled Chapman with cucumber and orange.', price: 1500, image: img('photo-1544145945-f90425340c7e'), category: 'Drinks', modifiers: [], inStock: true },
  { id: 'p5', merchantId: 'm5', name: 'Golden Penny Semovita 1kg', desc: 'Premium semovita.', price: 2100, image: img('photo-1586201375761-83865001e31c'), category: 'Staples', modifiers: [], inStock: true },
  { id: 'p6', merchantId: 'm5', name: 'Peak Milk Tin 400g', desc: 'Full cream powdered milk.', price: 4200, image: img('photo-1550583724-b2692b85b150'), category: 'Dairy & Eggs', modifiers: [], inStock: true },
  { id: 'p7', merchantId: 'm5', name: 'Fresh Tomatoes (1kg)', desc: 'Farm fresh, picked today.', price: 1800, image: img('photo-1546094096-0df4bcaaa337'), category: 'Fruits and Vegetables', modifiers: [], inStock: true },
  { id: 'p8', merchantId: 'm6', name: 'Paracetamol 500mg x20', desc: 'Pain and fever relief.', price: 600, image: img('photo-1584308666744-24d5c474f2ae'), category: 'Pain & Fever', modifiers: [], inStock: true },
  { id: 'p9', merchantId: 'm6', name: 'Amoxicillin 500mg x21', desc: 'Antibiotic. Prescription required.', price: 3200, image: img('photo-1471864190281-a93a3070b6de'), category: 'Antibiotics', modifiers: [], rx: true, inStock: true },
  { id: 'p10', merchantId: 'm6', name: 'Vitamin C 1000mg x30', desc: 'Immune support.', price: 2800, image: img('photo-1550572017-edd951b55104'), category: 'Vitamins', modifiers: [], inStock: true },
];

export const RIDERS: Rider[] = [
  { id: 'r1', name: 'Alex Okoro', plate: '7NfLR004', vehicle: 'Bike', rating: 95, verified: true, proxyPhone: '+234 700 555 0142' },
  { id: 'r2', name: 'Kelvin T.', plate: 'LSD-482XY', vehicle: 'Bike', rating: 97, verified: true, proxyPhone: '+234 700 555 0177' },
  { id: 'r3', name: 'Musa Ibrahim', plate: 'KJA-219AA', vehicle: 'Car', rating: 92, verified: true, proxyPhone: '+234 700 555 0191' },
];

export const DEFAULT_ADDRESSES: SavedAddress[] = [
  { id: 'a1', label: 'Home', line: '14 Adeola Odeku Street', area: 'Victoria Island, Lagos', landmark: 'Opposite Eko Hotel gate', location: { latitude: 6.4312, longitude: 3.4161 } },
  { id: 'a2', label: 'Office', line: '3 Akin Adesola Street', area: 'Victoria Island, Lagos', landmark: 'Next to Access Bank', location: { latitude: 6.4285, longitude: 3.4246 } },
];

export const BANNERS = [
  { id: 'b1', title: '20% off Bukka Republic', sub: 'On selected local dishes today', tint: '#FF5A1F' },
  { id: 'b2', title: 'Free delivery over ₦10,000', sub: 'On Super Mart and Pharmacy', tint: '#00A86B' },
  { id: 'b3', title: 'Send a parcel in Lagos', sub: 'Same-day courier from ₦1,500', tint: '#7C3AED' },
];

export const STAGE_LABELS = {
  received: ['Order Received', 'Waiting for merchant to confirm order'],
  preparing: ['Preparing Your Order', 'Kitchen or store is packaging your items'],
  rider_accepted: ['Rider Accepted Order', 'A rider has been assigned'],
  rider_at_store: ['Rider at Store', 'Waiting to pick up your package'],
  in_transit: ['Order In Transit', 'On its way to you'],
  arrived: ['Order Has Arrived', 'Rider is at your doorstep or gate'],
} as const;

export const CUSTOMER_CHIPS = [
  'Address is 100% correct, gate is open.',
  "I'm waiting at the estate security post.",
  'Please call me when you reach the gate.',
  'Kindly drop it with security/reception.',
];
export const RIDER_CHIPS = [
  'Arrived at restaurant, food is being packed.',
  'On the road now, heading straight to you!',
  'Heavy traffic on the expressway, ETA updated.',
  'I have arrived outside your gate/compound.',
];
export const MERCHANT_TAGS = ['Good quality', 'Delicious', 'Handled with care', 'Warm & Fresh', 'Neatly Packed'];
export const RIDER_TAGS = ['Polite', 'Fast', 'Followed instructions'];

export const riderGreeting = (customer: string, merchant: string, area: string) =>
  `Hello ${customer}! I've picked up your order from ${merchant} and I'm heading your way. To help me locate you quickly at ${area}, could you kindly confirm if your building or estate gate has any special landmark, visitor pass code, or drop-off instructions? Thank you!`;

export const stageLabel = (stage: string): string =>
  stage === 'delivered' ? 'Delivered' : stage === 'cancelled' ? 'Cancelled' : (STAGE_LABELS[stage as keyof typeof STAGE_LABELS]?.[0] ?? stage);
