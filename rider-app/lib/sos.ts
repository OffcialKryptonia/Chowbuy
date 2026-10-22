/** Emergency SOS: what is sent, who is called. Pure helpers; the screens do the sending. */
export interface SosContext {
  riderName: string; lat: number; lng: number; battery: number | null; orderId: string | null; at: Date;
}
export interface EmergencyContact { name: string; phone: string }

export const mapsLink = (lat: number, lng: number) => `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

export function sosSms(c: SosContext): string {
  return `EMERGENCY: ${c.riderName} (ChowBuy rider) needs help. Location: ${mapsLink(c.lat, c.lng)}${c.orderId ? ` Order ${c.orderId}.` : ''}${c.battery != null ? ` Battery ${Math.round(c.battery)}%.` : ''} Sent ${c.at.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}.`;
}

export function sosPayload(c: SosContext) {
  return { rider: c.riderName, lat: c.lat, lng: c.lng, battery: c.battery, order_id: c.orderId, at: c.at.toISOString() };
}

export const NATIONAL_EMERGENCY = { label: 'Nigeria Emergency Services', number: '112' } as const;
export const CITY_EMERGENCY: Record<string, { label: string; number: string }> = {
  Lagos: { label: 'LASEMA (Lagos)', number: '767' },
};
export const emergencyNumbers = (city: string | null | undefined) => [NATIONAL_EMERGENCY, ...(city && CITY_EMERGENCY[city] ? [CITY_EMERGENCY[city]] : [])];

export const validContacts = (c: EmergencyContact[]) => c.filter((x) => x.name.trim().length > 1 && /^[+]?\d[\d\s]{8,}$/.test(x.phone.trim()));
export const smsUrl = (phones: string[], body: string) => `sms:${phones.map((p) => p.replace(/\s/g, '')).join(',')}?body=${encodeURIComponent(body)}`;
