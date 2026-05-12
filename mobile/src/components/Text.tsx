// Themed Text — single source of truth for typography across the app.
// Variants: display, headline, title, body, label, caption, mono, overline (with size suffixes)
import type { ColorTokens } from '@/src/theme/colors';
import { useColors } from '@/src/theme/ThemeProvider';
import { typeScale, type TypeStyleKey } from '@/src/theme/typography';
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

export type TextVariant = TypeStyleKey;

type ColorKey =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'onAccent'
  | 'brand'
  | 'accent'
  | 'alert'
  | 'success'
  | 'warn'
  | 'danger'
  | 'info';

const colorMap: Record<ColorKey, keyof ColorTokens> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  inverse: 'textInverse',
  onAccent: 'textOnAccent',
  brand: 'brand',
  accent: 'accent',
  alert: 'alert',
  success: 'success',
  warn: 'warn',
  danger: 'danger',
  info: 'info',
};

export type TextProps = Omit<RNTextProps, 'style'> & {
  variant?: TextVariant;
  tone?: ColorKey;
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
  style?: TextStyle | TextStyle[];
};

export const Text = React.memo(function Text({
  variant = 'bodyMD',
  tone = 'primary',
  align,
  style,
  children,
  ...rest
}: TextProps) {
  const colors = useColors();
  const t = typeScale[variant];
  const composed: TextStyle = {
    fontFamily: t.family,
    fontSize: t.size,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    color: colors[colorMap[tone]] as string,
    textAlign: align,
  };
  return (
    <RNText {...rest} style={[composed, style]}>
      {children}
    </RNText>
  );
});
