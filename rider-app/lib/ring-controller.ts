/**
 * Order-offer ringing, kept free of React Native / expo-av so the stop rules can be unit-tested.
 * Rules: a ring starts when an offer arrives and stops on accept, decline, timeout or leaving the screen.
 * `stop()` also cancels a ring that is still loading, so a quick decline can never leave a ring playing.
 */
export interface RingHandle { stop(): Promise<void> }
export interface RingPlayer {
  /** Loads the ring and starts it looping. */
  loop(ringId: string): Promise<RingHandle>;
  /** Starts the vibration pattern (repeating) and returns a function that stops it. */
  vibrate(): () => void;
}

export type StopReason = 'accepted' | 'declined' | 'timeout' | 'left' | 'replaced';

export function createRingController(player: RingPlayer, log: (e: { type: 'start' | 'stop'; ring: string; reason?: StopReason }) => void = () => {}) {
  let gen = 0;
  let handle: RingHandle | null = null;
  let stopVibe: (() => void) | null = null;
  let active: string | null = null;

  /** Silences whatever is playing now. Does not touch `gen`, so callers decide whether to cancel a pending start. */
  async function teardown(reason: StopReason): Promise<void> {
    const h = handle; const v = stopVibe; const was = active;
    handle = null; stopVibe = null; active = null;
    v?.();
    if (h) await h.stop().catch(() => {});
    if (was) log({ type: 'stop', ring: was, reason });
  }

  async function stop(reason: StopReason = 'left'): Promise<void> {
    gen++;                                  // cancels any start() that has not finished yet
    await teardown(reason);
  }

  async function start(ringId: string, opts: { vibrate: boolean } = { vibrate: true }): Promise<void> {
    const mine = ++gen;
    await teardown('replaced');
    if (mine !== gen) return;               // stop() (accept, decline, timeout) arrived first
    active = ringId;
    if (opts.vibrate) stopVibe = player.vibrate();
    log({ type: 'start', ring: ringId });
    try {
      const h = await player.loop(ringId);
      if (mine !== gen) { await h.stop().catch(() => {}); return; }   // stopped while loading
      handle = h;
    } catch { /* no audio: vibration alone still alerts the rider */ }
  }

  return { start, stop, isRinging: () => active !== null };
}
