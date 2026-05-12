// Card — composable container with title, body, and footer slots.
// Variants: solid, elevated, glass, alert
import { useColors } from '@/src/theme/ThemeProvider';
import { spacing } from '@/src/theme/spacing';
import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { Surface, type SurfaceVariant } from './Surface';
import { Text } from './Text';

export type CardProps = ViewProps & {
  variant?: SurfaceVariant;
  title?: string;
  subtitle?: string;
  overline?: string;
  trailing?: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export const Card = React.memo(function Card({
  variant = 'solid',
  title,
  subtitle,
  overline,
  trailing,
  footer,
  padded = true,
  children,
  style,
  ...rest
}: CardProps) {
  const colors = useColors();
  return (
    <Surface variant={variant} depth={variant === 'elevated' ? 'low' : 'none'} radius="lg" style={style} {...rest}>
      <View style={{ padding: padded ? spacing.lg : 0 }}>
        {overline ? (
          <Text variant="overline" tone="tertiary" style={{ marginBottom: spacing.xs }}>
            {overline.toUpperCase()}
          </Text>
        ) : null}
        {(title || trailing) && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              {title ? <Text variant="titleMD">{title}</Text> : null}
              {subtitle ? (
                <Text variant="bodySM" tone="secondary">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {trailing}
          </View>
        )}
        {children ? <View style={{ marginTop: title || overline ? spacing.md : 0 }}>{children}</View> : null}
        {footer ? (
          <View
            style={{
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
            }}
          >
            {footer}
          </View>
        ) : null}
      </View>
    </Surface>
  );
});
