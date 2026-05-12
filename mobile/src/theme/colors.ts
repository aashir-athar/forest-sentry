// ForestSentry palette — conservation-credible, sunlight-readable.
// Deep forest greens carry institutional weight; bark earth-tones ground the data;
// moss is the active/brand accent; parchment is the readable surface; amber is reserved
// for alerts (illegal logging, protected-zone intrusion). Designed for both indoor
// review and outdoor High Visibility mode (rangers under harsh KP sun).

export const palette = {
  // Forest greens — primary brand
  forest900: '#0A1F16',
  forest800: '#0F2A1F',
  forest700: '#163A2C',
  forest600: '#1F4A38',
  forest500: '#2A5C45',
  forest400: '#3A7556',
  forest300: '#5A9476',
  forest200: '#8AB69E',
  forest100: '#C8DCD0',
  forest50: '#E8F0EA',

  // Moss — signature accent for primary actions
  moss600: '#4A6E3B',
  moss500: '#5A7F4A',
  moss400: '#6F9659',
  moss300: '#8DAE76',
  moss200: '#B4C9A2',
  moss100: '#D9E3CC',

  // Bark — earth neutrals
  bark900: '#1C140C',
  bark800: '#2A1F14',
  bark700: '#3D2E1F',
  bark600: '#5A4530',
  bark500: '#7A6047',
  bark400: '#9A8268',
  bark300: '#B8A48A',
  bark200: '#D4C5B0',
  bark100: '#E8DDCB',

  // Parchment — light surface
  parchment50: '#FBF8F1',
  parchment100: '#F5F1E8',
  parchment200: '#EAE3D2',

  // Amber — alerts only (illegal logging, intrusion)
  amber700: '#A85A05',
  amber600: '#C97308',
  amber500: '#D97706',
  amber400: '#E8901C',
  amber300: '#F2B158',

  // Semantic
  success600: '#1A7F4E',
  success500: '#2A9968',
  success400: '#4DB585',
  warn600: '#B07700',
  warn500: '#D89500',
  danger700: '#8E1B1B',
  danger600: '#B22222',
  danger500: '#D43838',
  info600: '#0F6F8B',
  info500: '#1A8AAA',

  // Neutrals (true grayscale, kept minimal)
  black: '#000000',
  white: '#FFFFFF',
  ink900: '#0E1410',
  ink800: '#1A201C',
  ink700: '#283028',
  ink600: '#3D453E',
  ink500: '#5A625B',
  ink400: '#7E867F',
  ink300: '#A5ADA6',
  ink200: '#CFD5D0',
  ink100: '#E7EBE8',
  ink50: '#F4F6F4',
} as const;

export type ColorTokens = {
  // Backgrounds
  bgBase: string;
  bgElevated: string;
  bgSunken: string;
  bgInverse: string;

  // Surfaces (cards, sheets)
  surface: string;
  surfaceElevated: string;
  surfaceGlassTint: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textOnAccent: string;

  // Brand
  brand: string;
  brandHover: string;
  brandMuted: string;
  onBrand: string;

  // Accent (moss — primary action)
  accent: string;
  accentHover: string;
  accentMuted: string;

  // Alert (amber — never used for non-alert states)
  alert: string;
  alertHover: string;
  alertMuted: string;
  onAlert: string;

  // Borders, dividers
  border: string;
  borderStrong: string;
  borderFocus: string;
  divider: string;

  // Semantic
  success: string;
  successMuted: string;
  warn: string;
  warnMuted: string;
  danger: string;
  dangerMuted: string;
  info: string;
  infoMuted: string;

  // Map overlays
  mapZoneFill: string;
  mapZoneStroke: string;
  mapIntrusionFill: string;
  mapIntrusionStroke: string;

  // Misc
  shimmerBase: string;
  shimmerHighlight: string;
  scrim: string;
};

export const lightTokens: ColorTokens = {
  bgBase: palette.parchment100,
  bgElevated: palette.parchment50,
  bgSunken: palette.parchment200,
  bgInverse: palette.forest900,

  surface: palette.white,
  surfaceElevated: palette.parchment50,
  surfaceGlassTint: 'rgba(245, 241, 232, 0.72)',

  textPrimary: palette.forest900,
  textSecondary: palette.bark700,
  textTertiary: palette.ink500,
  textInverse: palette.parchment50,
  textOnAccent: palette.parchment50,

  brand: palette.forest700,
  brandHover: palette.forest600,
  brandMuted: palette.forest100,
  onBrand: palette.parchment50,

  accent: palette.moss500,
  accentHover: palette.moss600,
  accentMuted: palette.moss100,

  alert: palette.amber500,
  alertHover: palette.amber600,
  alertMuted: 'rgba(217, 119, 6, 0.12)',
  onAlert: palette.white,

  border: palette.ink200,
  borderStrong: palette.ink300,
  borderFocus: palette.moss500,
  divider: palette.ink100,

  success: palette.success500,
  successMuted: 'rgba(42, 153, 104, 0.12)',
  warn: palette.warn500,
  warnMuted: 'rgba(216, 149, 0, 0.12)',
  danger: palette.danger500,
  dangerMuted: 'rgba(212, 56, 56, 0.10)',
  info: palette.info500,
  infoMuted: 'rgba(26, 138, 170, 0.10)',

  mapZoneFill: 'rgba(90, 127, 74, 0.18)',
  mapZoneStroke: palette.moss600,
  mapIntrusionFill: 'rgba(217, 119, 6, 0.22)',
  mapIntrusionStroke: palette.amber600,

  shimmerBase: palette.ink100,
  shimmerHighlight: palette.ink50,
  scrim: 'rgba(14, 20, 16, 0.40)',
};

export const darkTokens: ColorTokens = {
  bgBase: palette.forest900,
  bgElevated: palette.forest800,
  bgSunken: '#070F0B',
  bgInverse: palette.parchment100,

  surface: palette.forest800,
  surfaceElevated: palette.forest700,
  surfaceGlassTint: 'rgba(15, 42, 31, 0.62)',

  textPrimary: palette.parchment50,
  textSecondary: palette.forest100,
  textTertiary: palette.ink300,
  textInverse: palette.forest900,
  textOnAccent: palette.forest900,

  brand: palette.forest300,
  brandHover: palette.forest200,
  brandMuted: palette.forest700,
  onBrand: palette.forest900,

  accent: palette.moss400,
  accentHover: palette.moss300,
  accentMuted: 'rgba(143, 174, 118, 0.18)',

  alert: palette.amber400,
  alertHover: palette.amber300,
  alertMuted: 'rgba(232, 144, 28, 0.20)',
  onAlert: palette.forest900,

  border: 'rgba(245, 241, 232, 0.12)',
  borderStrong: 'rgba(245, 241, 232, 0.22)',
  borderFocus: palette.moss400,
  divider: 'rgba(245, 241, 232, 0.08)',

  success: palette.success400,
  successMuted: 'rgba(77, 181, 133, 0.18)',
  warn: palette.warn500,
  warnMuted: 'rgba(216, 149, 0, 0.20)',
  danger: palette.danger500,
  dangerMuted: 'rgba(212, 56, 56, 0.18)',
  info: palette.info500,
  infoMuted: 'rgba(26, 138, 170, 0.18)',

  mapZoneFill: 'rgba(143, 174, 118, 0.22)',
  mapZoneStroke: palette.moss300,
  mapIntrusionFill: 'rgba(232, 144, 28, 0.28)',
  mapIntrusionStroke: palette.amber300,

  shimmerBase: 'rgba(245, 241, 232, 0.06)',
  shimmerHighlight: 'rgba(245, 241, 232, 0.14)',
  scrim: 'rgba(0, 0, 0, 0.60)',
};

// High Visibility tokens — outdoor sunlight readability for field rangers.
// Pure white background, max-contrast text, oversized borders, no translucency.
export const highVisLightTokens: ColorTokens = {
  ...lightTokens,
  bgBase: palette.white,
  bgElevated: palette.white,
  bgSunken: palette.ink50,
  surface: palette.white,
  surfaceElevated: palette.white,
  surfaceGlassTint: palette.white,
  textPrimary: palette.black,
  textSecondary: palette.ink800,
  border: palette.ink800,
  borderStrong: palette.black,
  divider: palette.ink600,
  brand: palette.forest800,
  brandHover: palette.forest700,
  accent: palette.moss600,
  alert: palette.amber700,
};

export const highVisDarkTokens: ColorTokens = {
  ...darkTokens,
  bgBase: palette.black,
  bgElevated: '#0A0F0C',
  bgSunken: palette.black,
  surface: '#0A0F0C',
  textPrimary: palette.white,
  textSecondary: palette.parchment100,
  border: palette.parchment100,
  borderStrong: palette.white,
  brand: palette.forest200,
  accent: palette.moss200,
  alert: palette.amber300,
};
