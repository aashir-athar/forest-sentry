// Input — themed TextInput with label, helper, error, and focus animations.
// Variants: default, mono (for coords / IDs)
import { useColors } from '@/src/theme/ThemeProvider';
import { radii } from '@/src/theme/radii';
import { spacing } from '@/src/theme/spacing';
import { fontFamily, typeScale } from '@/src/theme/typography';
import React, { forwardRef, useCallback, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  helper?: string;
  error?: string;
  rightAdornment?: React.ReactNode;
  leftAdornment?: React.ReactNode;
  variant?: 'default' | 'mono';
  containerStyle?: ViewStyle;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, helper, error, rightAdornment, leftAdornment, variant = 'default', onFocus, onBlur, containerStyle, ...rest },
  ref,
) {
  const colors = useColors();
  const focus = useSharedValue(0);
  const reduced = useReducedMotion();
  const [isFocused, setFocused] = useState(false);

  const onFocusFn = useCallback<NonNullable<TextInputProps['onFocus']>>(
    (e) => {
      setFocused(true);
      focus.value = reduced ? 1 : withTiming(1, { duration: 160 });
      onFocus?.(e);
    },
    [focus, onFocus, reduced],
  );
  const onBlurFn = useCallback<NonNullable<TextInputProps['onBlur']>>(
    (e) => {
      setFocused(false);
      focus.value = reduced ? 0 : withTiming(0, { duration: 160 });
      onBlur?.(e);
    },
    [focus, onBlur, reduced],
  );

  const aStyle = useAnimatedStyle(() => ({
    borderColor: focus.value === 1 ? colors.borderFocus : error ? colors.danger : colors.border,
    borderWidth: 1 + focus.value * 0.5,
  }));

  const t = variant === 'mono' ? typeScale.monoLG : typeScale.bodyLG;

  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      {label ? (
        <Text variant="labelMD" tone={isFocused ? 'accent' : 'secondary'}>
          {label}
        </Text>
      ) : null}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            paddingHorizontal: spacing.lg,
            minHeight: 52,
            gap: spacing.sm,
          },
          aStyle,
        ]}
      >
        {leftAdornment}
        <TextInput
          ref={ref}
          {...rest}
          onFocus={onFocusFn}
          onBlur={onBlurFn}
          placeholderTextColor={colors.textTertiary}
          style={{
            flex: 1,
            paddingVertical: spacing.md,
            color: colors.textPrimary,
            fontFamily: variant === 'mono' ? fontFamily.monoMedium : fontFamily.body,
            fontSize: t.size,
            lineHeight: t.lineHeight,
            letterSpacing: t.letterSpacing,
          }}
          accessibilityLabel={rest.accessibilityLabel ?? label}
        />
        {rightAdornment}
      </Animated.View>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" tone="tertiary">
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

export const HairlineDivider = () => {
  const colors = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider }} />;
};
