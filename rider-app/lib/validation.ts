/** Input rules for rider sign-up. Pure functions, covered by tests/validation.test.ts. */

export const PASSWORD_SPECIALS = '!@#$%^&_*-';

export const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Keeps digits only and drops a leading 0 or 234, so "0813 632 0187", "+234 813 632 0187" and "8136320187" all compare equal. */
export function nationalPhone(v: string): string {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('234')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return d;
}

/** Nigerian mobile numbers are 10 digits after +234 and start with 7, 8 or 9. */
export const isNigerianMobile = (v: string): boolean => /^[789]\d{9}$/.test(nationalPhone(v));

export interface PasswordRule { id: string; label: string; ok: boolean }

export function passwordRules(pw: string): PasswordRule[] {
  return [
    { id: 'len', label: 'minimum 10 characters', ok: pw.length >= 10 },
    { id: 'upper', label: '1 uppercase letter (A-Z)', ok: /[A-Z]/.test(pw) },
    { id: 'lower', label: '1 lowercase letter (a-z)', ok: /[a-z]/.test(pw) },
    { id: 'num', label: '1 number (0-9)', ok: /\d/.test(pw) },
    { id: 'special', label: `1 special character (${PASSWORD_SPECIALS})`, ok: /[^A-Za-z0-9\s]/.test(pw) },
  ];
}

export const passwordOk = (pw: string): boolean => passwordRules(pw).every((r) => r.ok);

export type RiderType = 'fleet' | 'partner' | 'flex';
export type Vehicle = 'motorcycle' | 'bicycle' | 'car' | 'truck' | 'van';

/** Fleet riders are employed staff on company bikes; partners bring their own vehicle. Truck and van are for dispatch only. */
export const VEHICLES: Record<RiderType, { id: Vehicle; label: string; note?: string }[]> = {
  fleet: [{ id: 'motorcycle', label: 'Motorcycle' }, { id: 'bicycle', label: 'Bicycle' }],
  partner: [
    { id: 'motorcycle', label: 'Motorcycle' },
    { id: 'bicycle', label: 'Bicycle' },
    { id: 'car', label: 'Car' },
    { id: 'truck', label: 'Truck', note: 'Dispatch only' },
    { id: 'van', label: 'Van', note: 'Dispatch only' },
  ],
  // Flex riders use their own vehicle. Which types are open is a ChowBuy setting and is checked on the server.
  flex: [{ id: 'motorcycle', label: 'Motorcycle' }, { id: 'bicycle', label: 'Bicycle' }, { id: 'car', label: 'Car' }],
};
