/** Fleet shifts. Fleet riders see hours, breaks and counts, never per-ride money. */
export interface ShiftDef { id: 'morning' | 'evening' | 'night'; label: string; start: number; end: number }
export const SHIFTS: ShiftDef[] = [
  { id: 'morning', label: 'Morning', start: 7, end: 15 },
  { id: 'evening', label: 'Evening', start: 14, end: 22 },
  { id: 'night', label: 'Night', start: 21, end: 5 },
];
export const shiftHours = (s: ShiftDef) => (s.end > s.start ? s.end - s.start : 24 - s.start + s.end);
export const shiftLabel = (s: ShiftDef) => `${String(s.start).padStart(2, '0')}:00 to ${String(s.end).padStart(2, '0')}:00`;

/** Whole minutes between two timestamps, never negative. */
export const minutesBetween = (a: number, b: number) => Math.max(0, Math.round((b - a) / 60000));
export const fmtHours = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
