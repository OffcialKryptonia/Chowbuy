import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { MotoScene } from '@/components/art/MotoScene';

// 836 x 768 clip of a ChowBuy rider. Plays once from the start, then keeps looping the steady last part so there is no jump cut.
const SOURCE = require('../../assets/video/rider-moto.mp4');
const LOOP_FROM_MS = 3000;
const RATIO = 768 / 836;

type AVModule = typeof import('expo-av');

export function RiderClip({ width, dark, active = true }: { width: number; dark: boolean; active?: boolean }) {
  const [av, setAv] = useState<AVModule | null>(null);
  const [failed, setFailed] = useState(false);
  const ref = useRef<InstanceType<AVModule['Video']> | null>(null);

  useEffect(() => {
    // Loaded lazily so a problem in the audio/video module can never stop the app from launching.
    try { setAv(require('expo-av') as AVModule); } catch { setFailed(true); }
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) v.replayAsync().catch(() => {}); else v.pauseAsync().catch(() => {});
  }, [active, av]);

  if (failed || !av) return failed ? <MotoScene width={width} dark={dark} /> : <View style={{ width, height: width * RATIO }} />;
  const { Video, ResizeMode } = av;
  return (
    <View accessible accessibilityLabel="A ChowBuy rider on a motorbike" style={{ width, height: width * RATIO, borderRadius: 24, overflow: 'hidden', backgroundColor: '#E9F1F8' }}>
      <Video
        ref={ref as never}
        source={SOURCE}
        style={{ width: '100%', height: '100%' }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={active}
        isMuted
        isLooping={false}
        onError={() => setFailed(true)}
        onPlaybackStatusUpdate={(s) => {
          if (s.isLoaded && s.didJustFinish) ref.current?.playFromPositionAsync(LOOP_FROM_MS).catch(() => {});
        }}
      />
    </View>
  );
}
