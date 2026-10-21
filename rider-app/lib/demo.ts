import type { RiderType } from '@/lib/validation';

/** Built-in demo riders for testing. They are verified, so there is no approval wait. The app is not connected to the backend yet,
 *  so any other email and password also lets you in; these two just come with a rider model already set. */
export const DEMO_RIDERS: { email: string; password: string; type: RiderType; label: string }[] = [
  { email: 'rider@chowbuy.ng', password: 'ChowRider#2026', type: 'partner', label: 'Partner rider (earns per ride)' },
  { email: 'fleet@chowbuy.ng', password: 'ChowFleet#2026', type: 'fleet', label: 'Fleet rider (monthly salary)' },
];

export function matchDemo(email: string, password: string) {
  const e = email.trim().toLowerCase();
  return DEMO_RIDERS.find((d) => d.email === e && d.password === password) ?? null;
}
