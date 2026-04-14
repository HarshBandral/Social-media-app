export { Colors, LightColors, DarkColors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from './theme';
export type { ThemeColors } from './theme';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

export const STORY_DURATION_MS = 5000;
export const MAX_BIO_LENGTH = 150;
export const MAX_CAPTION_LENGTH = 500;
export const POSTS_PER_PAGE = 20;
export const COMMENTS_PER_PAGE = 20;
