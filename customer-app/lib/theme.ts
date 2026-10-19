import { useColorScheme } from 'react-native';
import { useSettings } from '@/stores/settings';

export interface Palette {
  bg: string; surface: string; fill: string; line: string; ink: string; mute: string;
  brand: string; brandSoft: string; brandInk: string; ok: string; okSoft: string; warn: string; warnSoft: string; bad: string; badSoft: string;
  overlay: string; mapStyle: 'light' | 'dark';
}

export const light: Palette = {
  bg: '#FAF8F7', surface: '#FFFFFF', fill: '#F4F1EF', line: '#ECE8E5', ink: '#171311', mute: '#6B625D',
  brand: '#FF5A1F', brandSoft: '#FFEBDF', brandInk: '#A83208', ok: '#00A86B', okSoft: '#DFF6EB', warn: '#B7791F', warnSoft: '#FDF1D6', bad: '#D92D20', badSoft: '#FDE7E4',
  overlay: 'rgba(10,12,20,.5)', mapStyle: 'light',
};
export const dark: Palette = {
  bg: '#0B0F1A', surface: '#151B2A', fill: '#1D2536', line: '#263046', ink: '#F3F5F9', mute: '#A3ADBF',
  brand: '#FF6A00', brandSoft: '#2B1B0F', brandInk: '#FFA566', ok: '#00C070', okSoft: '#0F2A20', warn: '#E9B44C', warnSoft: '#2E2412', bad: '#FF6B5E', badSoft: '#321716',
  overlay: 'rgba(0,0,0,.65)', mapStyle: 'dark',
};

/** Resolves the saved preference (light, dark or system) into the palette actually used. */
export function useResolvedScheme(): 'light' | 'dark' {
  const mode = useSettings((s) => s.theme);
  const system = useColorScheme();
  return mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
}
export function useTheme(): Palette & { scheme: 'light' | 'dark' } {
  const scheme = useResolvedScheme();
  return { ...(scheme === 'dark' ? dark : light), scheme };
}

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const fonts = { display: 'Sora_700Bold', displayX: 'Sora_800ExtraBold', body: 'Inter_500Medium', bold: 'Inter_700Bold', semi: 'Inter_600SemiBold' };
