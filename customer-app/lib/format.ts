export const num = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const ngn = (n: number) => '₦' + num(n);
export const clock = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' }).toUpperCase();
export const dateTime = (ts: number) =>
  new Date(ts).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });
export const etaWindow = (minutes: number, now = Date.now()) => {
  const lo = now + Math.max(0, minutes - 5) * 60000;
  const hi = now + (minutes + 10) * 60000;
  return `${clock(lo)} – ${clock(hi)}`;
};
export const initials = (name: string) => {
  const p = name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '?') + (p[1]?.[0] ?? '')).toUpperCase();
};
/** Nigerian mobile numbers: accepts 0803..., 803..., +234803... and returns +234 803 000 0000 or null. */
export const normalizeNgPhone = (raw: string): string | null => {
  const d = raw.replace(/[^\d]/g, '');
  let n = d;
  if (n.startsWith('234')) n = n.slice(3);
  else if (n.startsWith('0')) n = n.slice(1);
  if (!/^[789][01]\d{8}$/.test(n)) return null;
  return `+234 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
};
