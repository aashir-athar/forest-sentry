// Stat — large numeric value with label, used in researcher dashboards.
// Variants: default, accent, alert
import { spacing } from '@/src/theme/spacing';
import { useColors } from '@/src/theme/ThemeProvider';
import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';

export type StatProps = {
  label: string;
  value: string;
  delta?: string;
  tone?: 'default' | 'accent' | 'alert';
};

export const Stat = React.memo(function Stat({ label, value, delta, tone = 'default' }: StatProps) {
  const colors = useColors();
  const valueColor = tone === 'accent' ? colors.accent : tone === 'alert' ? colors.alert : colors.textPrimary;
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="overline" tone="tertiary">
        {label.toUpperCase()}
      </Text>
      <Text variant="displayMD" style={{ color: valueColor }}>
        {value}
      </Text>
      {delta ? (
        <Text variant="caption" tone="tertiary">
          {delta}
        </Text>
      ) : null}
    </View>
  );
});
