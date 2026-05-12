// Badge — small pill with tone for status (Healthy, Stressed, Diseased, Synced, Pending).
// Variants: tone-driven (success, warn, danger, info, accent, neutral, alert)
import { useColors } from '@/src/theme/ThemeProvider';
import { radii } from '@/src/theme/radii';
import { spacing } from '@/src/theme/spacing';
import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Text } from './Text';

export type BadgeTone = 'success' | 'warn' | 'danger' | 'info' | 'accent' | 'neutral' | 'alert';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
};

export const Badge = React.memo(function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const colors = useColors();

  const bg: Record<BadgeTone, string> = {
    success: colors.successMuted,
    warn: colors.warnMuted,
    danger: colors.dangerMuted,
    info: colors.infoMuted,
    accent: colors.accentMuted,
    neutral: colors.bgSunken,
    alert: colors.alertMuted,
  };
  const fg: Record<BadgeTone, string> = {
    success: colors.success,
    warn: colors.warn,
    danger: colors.danger,
    info: colors.info,
    accent: colors.accent,
    neutral: colors.textSecondary,
    alert: colors.alert,
  };

  return (
    <View
      style={[
        {
          backgroundColor: bg[tone],
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radii.pill,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text variant="labelSM" style={{ color: fg[tone] }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
});
