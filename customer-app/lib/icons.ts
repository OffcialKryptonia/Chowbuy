import {
  Apple, Banana, Beef, Beer, Bike, Cake, CakeSlice, Carrot, ChefHat, Coffee, Cookie, CupSoda, Drumstick, Egg, Fish, Flame, Heart, IceCream, Leaf,
  Milk, Percent, Pill, Pizza, Salad, Sandwich, Soup, Sprout, Baby, Utensils, Wheat, Croissant, Popcorn, Store, ShoppingBasket, Package, Stethoscope,
  Tags, Sparkles, Star, Zap, ShoppingBag,
  type LucideIcon,
} from 'lucide-react-native';
import type { Vertical } from './types';

/** Vector icons only. Every category and aisle maps to a Lucide glyph so there are no emoji in the interface. */
export interface Cat { id: string; label: string; icon: LucideIcon; tint: string }

export const FOOD_CATS: Cat[] = [
  { id: 'offers', label: 'Offers', icon: Percent, tint: '#FF5A1F' },
  { id: 'healthy', label: 'Healthy', icon: Salad, tint: '#00A86B' },
  { id: 'asian', label: 'Asian', icon: Soup, tint: '#E5484D' },
  { id: 'italian', label: 'Italian', icon: ChefHat, tint: '#D97706' },
  { id: 'burger', label: 'Burger', icon: Sandwich, tint: '#B45309' },
  { id: 'pizza', label: 'Pizza', icon: Pizza, tint: '#F97316' },
  { id: 'chicken', label: 'Chicken', icon: Drumstick, tint: '#CA8A04' },
  { id: 'swallows', label: 'Local Swallows', icon: Wheat, tint: '#8B5E34' },
  { id: 'grills', label: 'Grills', icon: Flame, tint: '#DC2626' },
];

export const MART_AISLES: Cat[] = [
  { id: 'fruit-veg', label: 'Fruits and Vegetables', icon: Banana, tint: '#65A30D' },
  { id: 'drinks', label: 'Drinks & Beverages', icon: CupSoda, tint: '#0EA5E9' },
  { id: 'dairy', label: 'Dairy & Eggs', icon: Milk, tint: '#64748B' },
  { id: 'bakery', label: 'Bakery & Breakfast', icon: Croissant, tint: '#D97706' },
  { id: 'pharmacy-baby', label: 'Pharmacy & Baby Care', icon: Pill, tint: '#2563EB' },
  { id: 'frozen', label: 'Ice Cream & Frozen', icon: IceCream, tint: '#EC4899' },
  { id: 'snacks', label: 'Snacks & Confectionery', icon: Popcorn, tint: '#F59E0B' },
  { id: 'meat', label: 'Fresh Meat & Poultry', icon: Beef, tint: '#B91C1C' },
];

export const HEALTH_CATS: Cat[] = [
  { id: 'pain', label: 'Pain & Fever', icon: Pill, tint: '#2563EB' },
  { id: 'malaria', label: 'Malaria', icon: Stethoscope, tint: '#7C3AED' },
  { id: 'vitamins', label: 'Vitamins', icon: Sprout, tint: '#16A34A' },
  { id: 'baby', label: 'Baby Care', icon: Baby, tint: '#EC4899' },
  { id: 'cold', label: 'Cold & Allergy', icon: Leaf, tint: '#0891B2' },
  { id: 'heart', label: 'Wellness', icon: Heart, tint: '#E11D48' },
];

/** Icons the Admin Console offers when adding a category. Anything unknown falls back to a tag. */
const ADMIN_ICONS: Record<string, LucideIcon> = { utensils: Utensils, cart: ShoppingBasket, pill: Pill, box: Package, tags: Tags, sparkles: Sparkles, star: Star, zap: Zap, bag: ShoppingBag, store: Store };
const ADMIN_TINT: Record<Vertical, string> = { restaurant: '#FF5A1F', grocery: '#12A150', pharmacy: '#2563EB', package: '#7C3AED' };

/** Builds a tile for a category the Admin added that the app does not ship with. */
export const adminCat = (vertical: Vertical) => (name: string, icon: string): Cat => ({
  id: 'x:' + name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(), label: name, icon: ADMIN_ICONS[icon] ?? Tags, tint: ADMIN_TINT[vertical],
});

export const VERTICALS: { id: Vertical; label: string; icon: LucideIcon; tint: string }[] = [
  { id: 'restaurant', label: 'Restaurants', icon: Utensils, tint: '#FF5A1F' },
  { id: 'grocery', label: 'Super Mart', icon: ShoppingBasket, tint: '#12A150' },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill, tint: '#2563EB' },
  { id: 'package', label: 'Courier', icon: Package, tint: '#7C3AED' },
];

export { Store, Bike, Apple, Beer, Cake, CakeSlice, Carrot, Coffee, Cookie, Egg, Fish };
