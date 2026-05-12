// Inter for body (gloved-hand legibility, ranger primary screen),
// Space Grotesk for display (institutional weight without austerity),
// JetBrains Mono for coords / IDs / tree-tag identifiers (unambiguous 0/O, 1/l).

import { Platform } from 'react-native';

export const fontFamily = {
  body: Platform.select({
    ios: 'Inter_400Regular',
    android: 'Inter_400Regular',
    default: 'Inter_400Regular',
  }) as string,
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  display: 'SpaceGrotesk_500Medium',
  displaySemibold: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export type FontFamilyKey = keyof typeof fontFamily;

export type TypeStyle = {
  family: string;
  size: number;
  lineHeight: number;
  letterSpacing: number;
  weight?: '400' | '500' | '600' | '700';
};

export const typeScale = {
  // Display — hero moments only
  displayXL: { family: fontFamily.displayBold, size: 44, lineHeight: 48, letterSpacing: -1.0 },
  displayLG: { family: fontFamily.displayBold, size: 36, lineHeight: 40, letterSpacing: -0.8 },
  displayMD: { family: fontFamily.displaySemibold, size: 28, lineHeight: 34, letterSpacing: -0.5 },

  // Headline — section heads
  headlineLG: { family: fontFamily.bodyBold, size: 24, lineHeight: 30, letterSpacing: -0.3 },
  headlineMD: { family: fontFamily.bodySemibold, size: 20, lineHeight: 26, letterSpacing: -0.2 },
  headlineSM: { family: fontFamily.bodySemibold, size: 17, lineHeight: 22, letterSpacing: -0.1 },

  // Title — card heads
  titleMD: { family: fontFamily.bodySemibold, size: 16, lineHeight: 22, letterSpacing: 0 },
  titleSM: { family: fontFamily.bodyMedium, size: 14, lineHeight: 20, letterSpacing: 0.1 },

  // Body
  bodyLG: { family: fontFamily.body, size: 17, lineHeight: 26, letterSpacing: 0 },
  bodyMD: { family: fontFamily.body, size: 15, lineHeight: 22, letterSpacing: 0 },
  bodySM: { family: fontFamily.body, size: 13, lineHeight: 20, letterSpacing: 0.1 },

  // Label — buttons, chips, tags
  labelLG: { family: fontFamily.bodySemibold, size: 15, lineHeight: 20, letterSpacing: 0.2 },
  labelMD: { family: fontFamily.bodySemibold, size: 13, lineHeight: 18, letterSpacing: 0.3 },
  labelSM: { family: fontFamily.bodyMedium, size: 11, lineHeight: 16, letterSpacing: 0.4 },

  // Caption
  caption: { family: fontFamily.body, size: 12, lineHeight: 16, letterSpacing: 0.2 },

  // Mono — coordinates, tree IDs
  monoLG: { family: fontFamily.monoMedium, size: 14, lineHeight: 20, letterSpacing: 0 },
  monoMD: { family: fontFamily.mono, size: 13, lineHeight: 18, letterSpacing: 0 },
  monoSM: { family: fontFamily.mono, size: 11, lineHeight: 14, letterSpacing: 0 },

  // Overline — micro section tags
  overline: { family: fontFamily.bodySemibold, size: 11, lineHeight: 14, letterSpacing: 1.2 },
} as const satisfies Record<string, TypeStyle>;

export type TypeStyleKey = keyof typeof typeScale;
