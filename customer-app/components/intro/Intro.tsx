import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Button, Txt } from '@/components/ui';
import { RiderClip } from '@/components/art/RiderClip';
import { useTheme } from '@/lib/theme';
import { foodArt, groceryArt, introDark, introLight, pharmacyArt } from '@/lib/art/intro';
import { tap, tick } from '@/lib/sound-effects';

export interface Slide { key: string; title: string; body: string }

export const SLIDES: Slide[] = [
  { key: 'food', title: 'Hungry? Order in a few taps', body: 'Restaurants and street-food favourites near you, delivered hot to your door.' },
  { key: 'grocery', title: 'Groceries, fresh to your door', body: 'Fresh produce and daily essentials from stores and markets around you.' },
  { key: 'pharmacy', title: 'Pharmacy you can trust', body: 'Licensed pharmacies. Upload a prescription and get it delivered with care.' },
  { key: 'track', title: 'Track your rider live', body: 'Watch your order move on the map, chat or call your rider, and confirm with your 4-digit PIN.' },
];

/** Gentle float so the still illustrations feel alive. Respects the system reduce-motion setting. */
function Float({ children }: { children: React.ReactNode }) {
  const v = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    v.value = withRepeat(withSequence(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.quad) })), -1, false);
    return () => cancelAnimation(v);
  }, [reduce, v]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -10 * v.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function Dot({ active, color, mute }: { active: boolean; color: string; mute: string }) {
  const w = useSharedValue(active ? 26 : 8);
  useEffect(() => { w.value = withTiming(active ? 26 : 8, { duration: 220 }); }, [active, w]);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: active ? color : mute }, style]} />;
}

/** First-run intro: four slides with Next and Skip. `onDone` is called by Skip, and by Next on the last slide. */
export function Intro({ onDone }: { onDone: () => void }) {
  const p = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Slide>>(null);
  const art = useMemo(() => {
    const pal = p.scheme === 'dark' ? introDark : introLight;
    return { food: foodArt(pal), grocery: groceryArt(pal), pharmacy: pharmacyArt(pal) };
  }, [p.scheme]);
  const last = index === SLIDES.length - 1;

  const goTo = (i: number) => { list.current?.scrollToIndex({ index: i, animated: true }); setIndex(i); };
  const next = () => { tap(); if (last) onDone(); else goTo(index + 1); };
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) { setIndex(i); tick(); }
  };

  const wide = width >= 720;
  const artW = wide ? Math.min(width * 0.4, 420) : Math.min(width - 48, 360);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={{ height: 52, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 12 }}>
        {!last ? <Pressable accessibilityRole="button" accessibilityLabel="Skip intro" hitSlop={12} onPress={() => { tap(); onDone(); }} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
          <Txt size={15} weight="bold" color={p.mute}>Skip</Txt>
        </Pressable> : null}
      </View>

      <FlatList
        ref={list}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        extraData={index}
        onMomentumScrollEnd={onEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => {
          const picture = item.key === 'track'
            ? <RiderClip width={artW} dark={p.scheme === 'dark'} active={SLIDES[index]?.key === 'track'} />
            : <Float><SvgXml xml={art[item.key as 'food' | 'grocery' | 'pharmacy']} width={artW * 0.9} height={artW * 0.9 * (240 / 280)} /></Float>;
          const words = (
            <View style={{ width: '100%', maxWidth: 520, gap: 10, paddingBottom: 8 }}>
              <Txt size={wide ? 32 : 28} weight="display" style={{ textAlign: wide ? 'left' : 'center' }}>{item.title}</Txt>
              <Txt size={16} color={p.mute} style={{ textAlign: wide ? 'left' : 'center', lineHeight: 23 }}>{item.body}</Txt>
            </View>
          );
          return wide ? (
            <View style={{ width, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 }}>{picture}{words}</View>
          ) : (
            <View style={{ width, paddingHorizontal: 24, alignItems: 'center' }}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>{picture}</View>
              {words}
            </View>
          );
        }}
      />

      <View style={{ paddingHorizontal: 24, paddingBottom: 18, gap: 18, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {SLIDES.map((s, i) => <Dot key={s.key} active={i === index} color={p.brand} mute={p.line} />)}
        </View>
        <Button label={last ? 'Get started' : 'Next'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}
