// Background location task. Must be defined at app start, before any tracking begins.
// Imported for its side effect from app/_layout.tsx. If the native modules are missing, tracking simply stays off.
export const TRACKING_TASK = 'chowbuy-rider-location';

try {
  const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');
  TaskManager.defineTask(TRACKING_TASK, async ({ data, error }: { data?: unknown; error?: unknown }) => {
    if (error || !data) return;
    const locs = (data as { locations?: { coords: { latitude: number; longitude: number } }[] }).locations;
    const last = locs?.[locs.length - 1];
    if (!last) return;
    // Lazy import keeps the store out of the headless task unless a location really arrives.
    const { useRider } = require('@/stores/rider') as typeof import('@/stores/rider');
    useRider.getState().setPos(last.coords.latitude, last.coords.longitude);
  });
} catch {
  /* tracking unavailable */
}
