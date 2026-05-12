// Pill — selectable segmented chip for filters and role switchers.
// Variants: selected, unselected
import { useColors } from '@/src/theme/ThemeProvider';
import { springs } from '@/src/theme/motion';
import { radii } from '@/src/theme/radii';
import { spacing } from '@/src/theme/spacing';
import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from './Text';

export type PillProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export const Pill = React.memo(function Pill({ label, selected, onPress }: PillProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();

  const onIn = useCallback(() => {
    if (!reduced) scale.value = withSpring(0.95, springs.tap);
  }, [scale, reduced]);
  const onOut = useCallback(() => {
    scale.value = withSpring(1, springs.tap);
  }, [scale]);

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        accessibilityRole="button"
        accessibilityState={{ selected: !!selected }}
        accessibilityLabel={label}
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radii.pill,
          backgroundColor: selected ? colors.accent : colors.bgSunken,
          borderWidth: 1,
          borderColor: selected ? colors.accent : colors.border,
        }}
      >
        <Text variant="labelMD" style={{ color: selected ? colors.textOnAccent : colors.textPrimary }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});
