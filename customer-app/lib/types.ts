export type Vertical = 'restaurant' | 'grocery' | 'pharmacy' | 'package';
export type ThemeMode = 'light' | 'dark' | 'system';
export type PayMethod = 'korapay' | 'pocketfi' | 'cod' | 'wallet';

export interface LatLng { latitude: number; longitude: number }

export interface Merchant {
  id: string;
  name: string;
  vertical: Vertical;
  cuisine: string[];
  image: string;
  rating: number;        // percent positive, e.g. 98
  ratingCount: number;
  etaMin: number;
  etaMax: number;
  distanceKm: number;
  deliveryFee: number;
  discountPct?: number;
  open: boolean;
  hours: string;
  location: LatLng;
  area: string;
}

export interface ModifierOption { id: string; name: string; price: number }
export interface ModifierGroup { id: string; name: string; required: boolean; multi: boolean; max: number; options: ModifierOption[] }

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  category: string;
  modifiers: ModifierGroup[];
  rx?: boolean;
  controlled?: boolean;
  inStock: boolean;
}

export interface CartLine { key: string; productId: string; merchantId: string; name: string; unitPrice: number; qty: number; mods: ModifierOption[]; note?: string }

export type OrderStage = 'received' | 'preparing' | 'rider_accepted' | 'rider_at_store' | 'in_transit' | 'arrived' | 'delivered' | 'cancelled';

export interface Rider {
  id: string;
  name: string;
  plate: string;
  vehicle: 'Bike' | 'Car';
  rating: number;        // percent thumbs-up
  verified: boolean;
  avatar?: string;
  proxyPhone: string;    // masked number, never the rider's real number
}

export interface Order {
  id: string;
  merchant: Merchant;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  pay: PayMethod;
  paid: boolean;
  address: SavedAddress;
  otp: string;
  placedAt: number;
  stage: OrderStage;
  stageTimes: Partial<Record<OrderStage, number>>;
  rider?: Rider;
  riderPos?: LatLng;
  riderBearing?: number;
  route?: LatLng[];
  etaMinutes: number;
  latestBy: number;
  reviewed?: boolean;
  tip?: number;
  paymentLink?: PaymentLink;
}

export interface PaymentLink { url: string; token: string; expiresAt: number; paidBy?: string; status: 'open' | 'paid' | 'expired' }

export interface SavedAddress { id: string; label: 'Home' | 'Office' | 'Other'; line: string; area: string; landmark?: string; location: LatLng }

export interface ChatMessage { id: string; orderId: string; from: 'customer' | 'rider' | 'system'; text: string; at: number; read: boolean }

export interface WalletTx { id: string; title: string; amount: number; dir: 1 | -1; at: number }

export interface Review {
  orderId: string;
  merchantUp: boolean | null;
  merchantTags: string[];
  riderUp: boolean | null;
  riderTags: string[];
  text: string;
}

export interface PublicConfig {
  gateways: { korapay: { enabled: boolean; publicKey: string; live: boolean }; pocketfi: { enabled: boolean; live: boolean }; cod: { enabled: boolean; maxAmount: number }; wallet: { enabled: boolean } };
  realtime: { provider: 'livekit' | 'agora' | 'off'; livekitUrl?: string; agoraAppId?: string };
  push: { onesignalAppId?: string; fcmEnabled: boolean };
  maps: { directionsViaProxy: boolean };
  loyalty: { reviewPoints: number };
  auth: { google: { enabled: boolean }; apple: { enabled: boolean } };
}
