/** Same fare model the merchant console uses so quotes match what the courier sees. */
export interface ParcelQuote { km: number; kg: number; express: boolean; fragile: boolean }
export const parcelFare = ({ km, kg, express, fragile }: ParcelQuote): number =>
  Math.round(((1000 + 120 * km + kg * 50) * (express ? 1.3 : 1)) / 50) * 50 + (fragile ? 300 : 0);

export function validateParcel(v: { from: string; to: string; recipient: string; phone: string; km: string; kg: string }): string | null {
  if (v.from.trim().length < 6) return 'Enter the pickup address.';
  if (v.to.trim().length < 6) return 'Enter the drop-off address.';
  if (v.recipient.trim().length < 2) return 'Enter the recipient name.';
  if (!/^\+?[\d\s]{10,16}$/.test(v.phone.trim())) return 'Enter a valid recipient phone number.';
  const km = parseFloat(v.km), kg = parseFloat(v.kg);
  if (!(km > 0 && km <= 60)) return 'Distance must be between 0.1 and 60 km.';
  if (!(kg > 0 && kg <= 30)) return 'Weight must be between 0.1 and 30 kg.';
  return null;
}
