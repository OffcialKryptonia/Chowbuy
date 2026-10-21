import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { BIKE_H, BIKE_W, FRONT_WHEEL, REAR_WHEEL, WHEEL_R, bikeBody, roadDashes, sceneDark, sceneLight, skyline, wheel } from '@/lib/art/scene';

const SCENE_H = 240;
const ROAD_TOP = 196;
const OFF = 18;     // shifts the bike right so the speed streaks have room behind the delivery box
const TILE = 336;   // multiple of the 48px dash period, so the road loops without a jump

/** Linear 0 -> 1 loop. Stays at 0 when the user asked the OS for reduced motion. */
function useLoop(ms: number, reduce: boolean) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (reduce) { v.value = 0; return; }
    v.value = 0;
    v.value = withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(v);
  }, [ms, reduce, v]);
  return v;
}

function Scroller({ progress, tile, children }: { progress: Animated.SharedValue<number>; tile: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -progress.value * tile }] }));
  return <Animated.View style={[{ position: 'absolute', left: 0, flexDirection: 'row', width: tile * 2 }, style]}>{children}</Animated.View>;
}

/**
 * The ChowBuy delivery rider on a motorbike, in the brand orange with the ChowBuy helmet, riding past a scrolling city.
 * Everything is drawn from SVG strings in lib/art/scene.ts; this component only adds the motion.
 */
export function MotoScene({ width, dark, speed = 1, flat = false }: { width: number; dark: boolean; speed?: number; flat?: boolean }) {
  const k = width / BIKE_W;
  const pal = dark ? sceneDark : sceneLight;
  const reduce = useReducedMotion();
  const art = useMemo(() => ({
    body: bikeBody(pal), wheel: wheel(pal), far: skyline(pal, TILE, 130, 'far', 3), near: skyline(pal, TILE, 110, 'near', 9), dashes: roadDashes(pal, TILE),
  }), [pal]);

  const far = useLoop(16000 / speed, reduce);
  const near = useLoop(7000 / speed, reduce);
  const road = useLoop(1500 / speed, reduce);
  const spin = useLoop(650 / speed, reduce);
  const streak = useLoop(900 / speed, reduce);
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) })), -1, false);
    return () => cancelAnimation(bob);
  }, [reduce, bob]);

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(bob.value, [0, 1], [0, -2.5 * k]) }, { rotate: `${interpolate(bob.value, [0, 1], [0, -0.6])}deg` }] }));
  const s1 = useAnimatedStyle(() => ({ opacity: interpolate(streak.value, [0, 0.2, 1], [0, 0.9, 0]), transform: [{ translateX: -streak.value * 70 * k }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: interpolate((streak.value + 0.45) % 1, [0, 0.2, 1], [0, 0.9, 0]), transform: [{ translateX: -((streak.value + 0.45) % 1) * 70 * k }] }));

  const wheelSize = (WHEEL_R * 2 + 8) * k;
  const wheelAt = (c: { x: number; y: number }) => ({ position: 'absolute' as const, left: (c.x + OFF - WHEEL_R - 4) * k, top: (c.y - WHEEL_R - 4) * k, width: wheelSize, height: wheelSize });
  const streakColor = dark ? '#FFFFFF' : '#FF5A1F';

  return (
    <View style={{ width, height: SCENE_H * k, overflow: 'hidden', backgroundColor: pal.sky, borderRadius: flat ? 0 : 24 * k }} accessibilityRole="image" accessibilityLabel="A ChowBuy rider on a motorbike, delivering through the city">
      <View style={{ position: 'absolute', left: 0, top: 30 * k, width, height: 130 * k, overflow: 'hidden' }}>
        <Scroller progress={far} tile={TILE * k}><SvgXml xml={art.far} width={TILE * k} height={130 * k} /><SvgXml xml={art.far} width={TILE * k} height={130 * k} /></Scroller>
      </View>
      <View style={{ position: 'absolute', left: 0, top: 70 * k, width, height: 110 * k, overflow: 'hidden' }}>
        <Scroller progress={near} tile={TILE * k}><SvgXml xml={art.near} width={TILE * k} height={110 * k} /><SvgXml xml={art.near} width={TILE * k} height={110 * k} /></Scroller>
      </View>
      <View style={{ position: 'absolute', left: 0, top: ROAD_TOP * k, width, height: (SCENE_H - ROAD_TOP) * k, backgroundColor: pal.road }} />
      <View style={{ position: 'absolute', left: 0, top: (ROAD_TOP + 26) * k, width, height: 10 * k, overflow: 'hidden' }}>
        <Scroller progress={road} tile={TILE * k}><SvgXml xml={art.dashes} width={TILE * k} height={10 * k} /><SvgXml xml={art.dashes} width={TILE * k} height={10 * k} /></Scroller>
      </View>

      {/* speed streaks behind the delivery box */}
      <Animated.View style={[{ position: 'absolute', left: 4 * k, top: 98 * k, width: 24 * k, height: 4 * k, borderRadius: 2, backgroundColor: streakColor }, s1]} />
      <Animated.View style={[{ position: 'absolute', left: 0, top: 112 * k, width: 30 * k, height: 4 * k, borderRadius: 2, backgroundColor: streakColor }, s2]} />
      <Animated.View style={[{ position: 'absolute', left: OFF * k, top: 0, width: BIKE_W * k, height: BIKE_H * k }, bodyStyle]}>
        <SvgXml xml={art.body} width={BIKE_W * k} height={BIKE_H * k} />
      </Animated.View>
      <Animated.View style={[wheelAt(REAR_WHEEL), wheelStyle]}><SvgXml xml={art.wheel} width={wheelSize} height={wheelSize} /></Animated.View>
      <Animated.View style={[wheelAt(FRONT_WHEEL), wheelStyle]}><SvgXml xml={art.wheel} width={wheelSize} height={wheelSize} /></Animated.View>

    </View>
  );
}
