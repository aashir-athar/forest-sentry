// Row — tappable list row with leading icon, body, optional trailing slot.
// Variants: action, navigation, value
import { useColors } from '@/src/theme/ThemeProvider';
import { duration, springs } from '@/src/theme/motion';
import { spacing } from '@/src/theme/spacing';
import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type RowProps = {
  icon?: IconName;
  iconTone?: 'primary' | 'secondary' | 'accent' | 'alert' | 'success' | 'danger' | 'info';
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  trailingText?: string;
  showChevron?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export const Row = React.memo(function Row({
  icon,
  iconTone = 'primary',
  title,
  subtitle,
  trailing,
  trailingText,
  showChevron = false,
  onPress,
  accessibilityLabel,
}: RowProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();

  const onIn = useCallback(() => {
    if (!reduced) scale.value = withSpring(0.985, springs.tap);
  }, [scale, reduced]);
  const onOut = useCallback(() => {
    scale.value = reduced ? 1 : withTiming(1, { duration: duration.fast });
  }, [scale, reduced]);

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={accessibilityLabel ?? title}
        style={{
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 56,
        }}
      >
        {icon ? (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.bgSunken,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size={18} tone={iconTone} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="titleSM">{title}</Text>
          {subtitle ? (
            <Text variant="bodySM" tone="secondary" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailingText ? (
          <Text variant="labelMD" tone="tertiary">
            {trailingText}
          </Text>
        ) : null}
        {trailing}
        {showChevron ? <Icon name="chevron-forward" size={18} tone="tertiary" /> : null}
      </Pressable>
    </Animated.View>
  );
});
