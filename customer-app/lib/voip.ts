import { Room, RoomEvent, ConnectionState } from 'livekit-client';
import { fn } from './supabase';
import { DEMO } from './config';
import type { PublicConfig } from './types';

export type CallState = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'failed';

export interface VoipSession {
  mute(m: boolean): Promise<void>;
  speaker(on: boolean): Promise<void>;
  end(): Promise<void>;
}

interface Hooks { onState: (s: CallState) => void }

/**
 * Provider-neutral in-app call. The app asks the backend for a short-lived room token (the LiveKit API secret or the
 * Agora certificate never leave the server; they are entered in Admin > Integrations). To switch to Agora, implement
 * `startAgora` with react-native-agora and return the same VoipSession shape.
 */
export async function startCall(orderId: string, cfg: PublicConfig['realtime'], h: Hooks): Promise<VoipSession> {
  if (cfg.provider === 'off') { h.onState('failed'); throw new Error('In-app calls are turned off. Use Call Rider instead.'); }
  if (DEMO) return demoCall(h);
  if (cfg.provider === 'agora') throw new Error('Agora is selected but the Agora SDK is not bundled in this build. Switch to LiveKit in Admin or add react-native-agora.');
  return startLiveKit(orderId, cfg, h);
}

async function startLiveKit(orderId: string, cfg: PublicConfig['realtime'], h: Hooks): Promise<VoipSession> {
  h.onState('connecting');
  const { token, url } = await fn<{ token: string; url?: string }>('calls-token', { body: { orderId } });
  const room = new Room({ adaptiveStream: false, dynacast: false });
  room.on(RoomEvent.ConnectionStateChanged, (s) => { if (s === ConnectionState.Disconnected) h.onState('ended'); });
  room.on(RoomEvent.ParticipantConnected, () => h.onState('connected'));
  room.on(RoomEvent.Disconnected, () => h.onState('ended'));
  await room.connect(url ?? cfg.livekitUrl ?? '', token);
  await room.localParticipant.setMicrophoneEnabled(true);
  h.onState(room.remoteParticipants.size ? 'connected' : 'ringing');
  return {
    mute: async (m) => { await room.localParticipant.setMicrophoneEnabled(!m); },
    speaker: async () => { /* routed by AudioSession in useVoipCall */ },
    end: async () => { await room.disconnect(); h.onState('ended'); },
  };
}

function demoCall(h: Hooks): VoipSession {
  h.onState('connecting');
  const t1 = setTimeout(() => h.onState('ringing'), 700);
  const t2 = setTimeout(() => h.onState('connected'), 2600);
  return { mute: async () => {}, speaker: async () => {}, end: async () => { clearTimeout(t1); clearTimeout(t2); h.onState('ended'); } };
}
