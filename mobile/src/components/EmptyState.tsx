// EmptyState — message + first-action CTA; never a blank "no items" screen.
// Variants: standard, encouraging (no proof yet), drained (intentionally cleared)
import { useColors } from '@/src/theme/ThemeProvider';
import { spacing } from '@/src/theme/spacing';
import { Image, type ImageSource } from 'expo-image';
import React from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type EmptyStateProps = {
  icon?: IconName;
  // Optional brand glyph (PNG asset via require). Takes precedence over `icon`
  // when provided. Sized at 128×128, contentFit="contain".
  image?: number | ImageSource;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export const EmptyState = React.memo(function EmptyState({
  icon = 'leaf-outline',
  image,
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  const colors = useColors();
  return (
    <View
      style={{
        alignItems: 'center',
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing['4xl'],
        gap: spacing.lg,
      }}
    >
      {image ? (
        <Image source={image} style={{ width: 128, height: 128 }} contentFit="contain" transition={180} />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.accentMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={28} tone="accent" />
        </View>
      )}
      <View style={{ gap: spacing.xs, alignItems: 'center' }}>
        <Text variant="headlineSM" align="center">
          {title}
        </Text>
        {body ? (
          <Text variant="bodyMD" tone="secondary" align="center">
            {body}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button label={actionLabel} onPress={onAction} variant="primary" />
          {secondaryLabel && onSecondary ? (
            <Button label={secondaryLabel} onPress={onSecondary} variant="ghost" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
});
