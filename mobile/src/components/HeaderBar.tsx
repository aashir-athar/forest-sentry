// HeaderBar — left title slot, optional right action; consistent across screens.
import { spacing } from '@/src/theme/spacing';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type HeaderBarProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightIcon?: IconName;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
};

export function HeaderBar({
  title,
  subtitle,
  showBack,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel,
}: HeaderBarProps) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="chevron-back" size={24} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text variant="headlineLG">{title}</Text>
          {subtitle ? (
            <Text variant="bodySM" tone="secondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightIcon && onRightPress ? (
        <Pressable
          onPress={onRightPress}
          accessibilityRole="button"
          accessibilityLabel={rightAccessibilityLabel ?? 'Action'}
          hitSlop={12}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name={rightIcon} size={22} tone="primary" />
        </Pressable>
      ) : null}
    </View>
  );
}
