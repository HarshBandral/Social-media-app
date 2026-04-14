import { create } from 'zustand';
import { LightColors, DarkColors, type ThemeColors } from '../constants/theme';

interface ThemeState {
  isDark: boolean;
  colors: ThemeColors;
  toggle: () => void;
  setDark: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  colors: LightColors,
  toggle: () =>
    set((state) => ({
      isDark: !state.isDark,
      colors: state.isDark ? LightColors : DarkColors,
    })),
  setDark: (isDark: boolean) =>
    set({ isDark, colors: isDark ? DarkColors : LightColors }),
}));

// Hook shortcut
export const useColors = () => useThemeStore((s) => s.colors);
