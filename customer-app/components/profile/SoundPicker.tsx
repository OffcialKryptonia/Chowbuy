import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check, ChevronRight, Play } from 'lucide-react-native';
import { Row, Sheet, Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useSettings } from '@/stores/settings';
import { useAuth } from '@/stores/auth';
import { DEFAULT_SOUND, NOTIF_SOUNDS, applyNotificationSound, isSoundId, playSound, soundLabel, syncSoundToServer, type NotifSoundId } from '@/lib/sounds';
import { DEMO } from '@/lib/config';
import { tap } from '@/lib/sound-effects';

/** Settings row plus a sheet to choose (and preview) the notification sound. */
export function SoundPicker() {
  const p = useTheme();
  const saved = useSettings((s) => s.notifSound);
  const set = useSettings((s) => s.set);
  const uid = useAuth((s) => s.session?.user.id);
  const [open, setOpen] = useState(false);
  const current: NotifSoundId = isSoundId(saved) ? saved : DEFAULT_SOUND;

  const choose = (id: NotifSoundId) => {
    tap(); set({ notifSound: id });
    void playSound(id);
    void applyNotificationSound(id);
    if (!DEMO && uid) void syncSoundToServer(uid, id);
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Notification sound: ${soundLabel(current)}`} onPress={() => { tap(); setOpen(true); }}>
        <Row style={{ padding: 14, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: p.line }}>
          <View style={{ flex: 1 }}><Txt size={15}>Notification sound</Txt><Txt size={12} color={p.mute}>{soundLabel(current)}</Txt></View>
          <ChevronRight size={20} color={p.mute} />
        </Row>
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title="Notification sound">
        <View style={{ gap: 6, paddingBottom: 8 }}>
          {NOTIF_SOUNDS.map((s) => {
            const on = s.id === current;
            return (
              <Pressable key={s.id} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${s.label}. ${s.note}`} onPress={() => choose(s.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: on ? 2 : 1, borderColor: on ? p.brand : p.line, backgroundColor: on ? p.brandSoft : p.surface }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? p.brand : p.fill }}>
                  <Play size={16} color={on ? '#fff' : p.ink} />
                </View>
                <View style={{ flex: 1 }}><Txt size={15} weight="bold">{s.label}</Txt><Txt size={12} color={p.mute}>{s.note}</Txt></View>
                {on ? <Check size={20} color={p.brand} /> : null}
              </Pressable>
            );
          })}
          <Txt size={12} color={p.mute} style={{ paddingTop: 6 }}>Tap a sound to hear it. It plays for order updates and offers, even when the app is closed.</Txt>
        </View>
      </Sheet>
    </>
  );
}
