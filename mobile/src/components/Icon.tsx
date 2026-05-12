// Icon — themed wrapper over @expo/vector-icons (Ionicons by default).
// Variants: lineweight via size; tone via theme.
import { useColors } from '@/src/theme/ThemeProvider';
import type { ColorTokens } from '@/src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type IconProps = {
  name: IconName;
  size?: number;
  tone?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'inverse'
    | 'brand'
    | 'accent'
    | 'alert'
    | 'success'
    | 'warn'
    | 'danger'
    | 'info'
    | 'onAccent';
  color?: string;
};

const toneMap: Record<NonNullable<IconProps['tone']>, keyof ColorTokens> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  inverse: 'textInverse',
  brand: 'brand',
  accent: 'accent',
  alert: 'alert',
  success: 'success',
  warn: 'warn',
  danger: 'danger',
  info: 'info',
  onAccent: 'textOnAccent',
};

export const Icon = React.memo(function Icon({ name, size = 22, tone = 'primary', color }: IconProps) {
  const colors = useColors();
  return <Ionicons name={name} size={size} color={color ?? (colors[toneMap[tone]] as string)} />;
});
