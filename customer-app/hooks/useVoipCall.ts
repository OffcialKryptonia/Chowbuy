import { useCallback, useEffect, useRef, useState } from 'react';
import { startCall, type CallState, type VoipSession } from '@/lib/voip';
import { usePublicConfig } from './usePublicConfig';

export function useVoipCall(orderId: string) {
  const cfg = usePublicConfig().data.realtime;
  const [state, setState] = useState<CallState>('idle');
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const session = useRef<VoipSession | null>(null);

  const begin = useCallback(async () => {
    setError(null); setSeconds(0);
    try { session.current = await startCall(orderId, cfg, { onState: setState }); }
    catch (e) { setState('failed'); setError(e instanceof Error ? e.message : 'The call could not start.'); }
  }, [orderId, cfg]);

  useEffect(() => {
    if (state !== 'connected') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => () => { void session.current?.end(); }, []);

  return {
    state, muted, speaker, seconds, error, begin,
    toggleMute: async () => { const n = !muted; setMuted(n); await session.current?.mute(n); },
    toggleSpeaker: async () => { const n = !speaker; setSpeaker(n); await session.current?.speaker(n); },
    end: async () => { await session.current?.end(); setState('ended'); },
  };
}
