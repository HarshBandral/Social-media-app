export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAccent: string;
  gradientWarm: string;
  background: string;
  surface: string;
  surfaceLight: string;
  card: string;
  cardElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  borderLight: string;
  like: string;
  online: string;
  overlay: string;
  transparent: string;
  white: string;
  black: string;
  placeholder: string;
}

// ─── LIGHT MODE ──────────────────────────────────────────────────
// Soft sky blue primary, warm coral accent, clean airy backgrounds
export const LightColors: ThemeColors = {
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',

  accent: '#F97066',
  accentLight: '#FCA5A1',

  gradientStart: '#3B82F6',
  gradientEnd: '#60A5FA',
  gradientAccent: '#F97066',
  gradientWarm: '#818CF8',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  like: '#EF4444',
  online: '#10B981',

  overlay: 'rgba(15, 23, 42, 0.35)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
  placeholder: '#CBD5E1',
} as const;

// ─── DARK MODE ───────────────────────────────────────────────────
// Deep navy background, bright blue glow, soft coral accent
export const DarkColors: ThemeColors = {
  primary: '#60A5FA',
  primaryLight: '#93C5FD',
  primaryDark: '#3B82F6',

  accent: '#FB7185',
  accentLight: '#FDA4AF',

  gradientStart: '#1E3A8A',
  gradientEnd: '#3B82F6',
  gradientAccent: '#FB7185',
  gradientWarm: '#818CF8',

  background: '#0B1121',
  surface: '#111827',
  surfaceLight: '#1E293B',
  card: '#111827',
  cardElevated: '#1E293B',

  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textInverse: '#0B1121',

  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  border: '#1E293B',
  borderLight: '#334155',

  like: '#F87171',
  online: '#34D399',

  overlay: 'rgba(0, 0, 0, 0.6)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
  placeholder: '#475569',
} as const;

// Default export — light is default
export const Colors = LightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  display: 34,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
} as const;

export const Shadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;
