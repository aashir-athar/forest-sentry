// Pressable with Reanimated tap-scale, haptics, and full a11y.
// Variants: primary, secondary, ghost, alert, danger, glass
import { useColors } from '@/src/theme/ThemeProvider';
import { duration, springs } from '@/src/theme/motion';
import { radii } from '@/src/theme/radii';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect } from 'react';
import { Platform, Pressable, type PressableProps, View, type ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'alert' | 'danger' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeading?: React.ReactNode;
  iconTrailing?: React.ReactNode;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  style?: ViewStyle | ViewStyle[];
};

const sizeMap: Record<ButtonSize, { h: number; padX: number; radius: number; textVariant: 'labelMD' | 'labelLG' }> = {
  sm: { h: 36, padX: 12, radius: radii.md, textVariant: 'labelMD' },
  md: { h: 44, padX: 16, radius: radii.lg, textVariant: 'labelLG' },
  lg: { h: 52, padX: 20, radius: radii.lg, textVariant: 'labelLG' },
  xl: { h: 60, padX: 24, radius: radii.xl, textVariant: 'labelLG' },
};

export const Button = React.memo(function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  iconLeading,
  iconTrailing,
  haptic = 'light',
  onPress,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();

  const onPressIn = useCallback(() => {
    if (reduced) return;
    scale.value = withSpring(0.96, springs.tap);
  }, [scale, reduced]);

  const onPressOut = useCallback(() => {
    if (reduced) {
      scale.value = 1;
      return;
    }
    scale.value = withTiming(1, { duration: duration.fast });
  }, [scale, reduced]);

  const onPressFn = useCallback<NonNullable<PressableProps['onPress']>>(
    (e) => {
      if (haptic !== 'none' && Platform.OS !== 'web') {
        const style =
          haptic === 'heavy'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : haptic === 'medium'
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light;
        void Haptics.impactAsync(style);
      }
      onPress?.(e);
    },
    [haptic, onPress],
  );

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const sz = sizeMap[size];

  let bg: string = colors.brand;
  let fg: string = colors.onBrand;
  let borderColor: string | undefined;
  let borderWidth = 0;

  switch (variant) {
    case 'primary':
      bg = colors.accent;
      fg = colors.textOnAccent;
      break;
    case 'secondary':
      bg = colors.brandMuted;
      fg = colors.textPrimary;
      break;
    case 'ghost':
      bg = 'transparent';
      fg = colors.textPrimary;
      borderColor = colors.border;
      borderWidth = 1;
      break;
    case 'alert':
      bg = colors.alert;
      fg = colors.onAlert;
      break;
    case 'danger':
      bg = colors.danger;
      fg = '#FFFFFF';
      break;
    case 'glass':
      bg = colors.surfaceGlassTint;
      fg = colors.textPrimary;
      borderColor = colors.border;
      borderWidth = 1;
      break;
  }

  const opacity = disabled || loading ? 0.55 : 1;

  return (
    <Animated.View style={[{ alignSelf: fullWidth ? 'stretch' : 'auto' }, animatedStyle]}>
      <Pressable
        {...rest}
        onPress={onPressFn}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={rest.accessibilityLabel ?? label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          {
            height: sz.h,
            paddingHorizontal: sz.padX,
            borderRadius: sz.radius,
            backgroundColor: bg,
            borderColor,
            borderWidth,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity,
          },
          style,
        ]}
      >
        {loading ? (
          <PulseDots color={fg} />
        ) : (
          <>
            {iconLeading ? <View accessibilityElementsHidden>{iconLeading}</View> : null}
            <Text variant={sz.textVariant} style={{ color: fg }}>
              {label}
            </Text>
            {iconTrailing ? <View accessibilityElementsHidden>{iconTrailing}</View> : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
});

function PulseDots({ color }: { color: string }) {
  return (
    <View
      style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Dot color={color} delay={0} />
      <Dot color={color} delay={120} />
      <Dot color={color} delay={240} />
    </View>
  );
}

function Dot({ color, delay }: { color: string; delay: number }) {
  const opacity = useSharedValue(0.3);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      opacity.value = 0.7;
      return;
    }
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 360 }), withTiming(0.3, { duration: 360 })),
        -1,
        false,
      ),
    );
  }, [delay, opacity, reduced]);
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }, aStyle]} />;
}
