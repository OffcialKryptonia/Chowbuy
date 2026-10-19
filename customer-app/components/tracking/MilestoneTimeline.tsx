import React from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { STAGE_LABELS } from '@/lib/mock';
import { stageIndex } from '@/stores/orders';
import { clock } from '@/lib/format';
import type { Order, OrderStage } from '@/lib/types';

const STAGES: (keyof typeof STAGE_LABELS)[] = ['received', 'preparing', 'rider_accepted', 'rider_at_store', 'in_transit', 'arrived'];

/** Six-step tracker. Completed steps show their timestamp, the current step pulses in brand colour, upcoming steps stay muted. */
export function MilestoneTimeline({ order }: { order: Pick<Order, 'stage' | 'stageTimes'> }) {
  const p = useTheme();
  const cur = stageIndex(order.stage);
  return (
    <View accessibilityRole="list">
      {STAGES.map((s, i) => {
        const done = stageIndex(s) < cur || order.stage === 'delivered';
        const active = s === order.stage;
        const at = order.stageTimes[s as OrderStage];
        const color = done ? p.ok : active ? p.brand : p.line;
        return (
          <View key={s} style={{ flexDirection: 'row', gap: 14 }} accessible accessibilityLabel={`${STAGE_LABELS[s][0]}, ${done ? 'done' : active ? 'in progress' : 'upcoming'}${at ? ' at ' + clock(at) : ''}`}>
            <View style={{ alignItems: 'center', width: 28 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: done ? p.ok : active ? p.brandSoft : p.fill, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
                {done ? <Check size={15} color="#fff" strokeWidth={3} /> : active ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.brand }} /> : null}
              </View>
              {i < STAGES.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 26, backgroundColor: done ? p.ok : p.line }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Txt size={15} weight={active || done ? 'bold' : 'body'} color={done || active ? p.ink : p.mute} style={{ flex: 1 }}>{STAGE_LABELS[s][0]}</Txt>
                {at ? <Txt size={12} color={p.mute}>{clock(at)}</Txt> : null}
              </View>
              <Txt size={13} color={p.mute}>{STAGE_LABELS[s][1]}</Txt>
            </View>
          </View>
        );
      })}
    </View>
  );
}
