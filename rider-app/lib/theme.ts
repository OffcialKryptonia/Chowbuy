import { useColorScheme } from 'react-native';

export interface Palette { bg: string; surface: string; fill: string; line: string; ink: string; mute: string; brand: string; brandSoft: string; brandInk: string; ok: string; bad: string; btn: string; btnInk: string }

export const light: Palette = { bg: '#FFFFFF', surface: '#FFFFFF', fill: '#F4F1EF', line: '#DAD5D1', ink: '#171311', mute: '#6B625D', brand: '#FF5A1F', brandSoft: '#FFEBDF', brandInk: '#A83208', ok: '#00A86B', bad: '#D92D20', btn: '#171311', btnInk: '#FFFFFF' };
export const dark: Palette = { bg: '#0B0F19', surface: '#151D2F', fill: '#1D2536', line: '#2A3550', ink: '#F3F5F9', mute: '#A3ADBF', brand: '#FF6A00', brandSoft: '#2B1B0F', brandInk: '#FFA566', ok: '#00C070', bad: '#FF6B5E', btn: '#F3F5F9', btnInk: '#0B0F19' };

export const fonts = { display: 'Sora_700Bold', displayX: 'Sora_800ExtraBold', body: 'Inter_500Medium', semi: 'Inter_600SemiBold', bold: 'Inter_700Bold' };

export function useTheme(): Palette & { scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { ...(scheme === 'dark' ? dark : light), scheme };
}
