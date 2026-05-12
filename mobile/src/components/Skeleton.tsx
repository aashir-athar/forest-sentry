// Skeleton — the shimmer primitive used for every loading state.
// Variants: rectangle, circle, text. Composes via Skeleton.Group + Skeleton.Line shapes.
import { useColors } from '@/src/theme/ThemeProvider';
import { radii } from '@/src/theme/radii';
import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type SkeletonShape = 'rect' | 'circle' | 'text';

export type SkeletonProps = {
  shape?: SkeletonShape;
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export const Skeleton = React.memo(function Skeleton({
  shape = 'rect',
  width,
  height,
  radius,
  style,
}: SkeletonProps) {
  const colors = useColors();
  const t = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      t.value = 0.5;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  }, [t, reduced]);

  const aStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      t.value,
      [0, 1],
      [colors.shimmerBase, colors.shimmerHighlight],
    ),
  }));

  let w: ViewStyle['width'] = width ?? '100%';
  let h: ViewStyle['height'] = height ?? 14;
  let r = radius ?? radii.sm;

  if (shape === 'circle') {
    const dim = height ?? width ?? 40;
    if (typeof dim === 'number') {
      w = dim;
      h = dim;
      r = dim / 2;
    }
  } else if (shape === 'text') {
    h = height ?? 12;
    r = 4;
  }

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[{ width: w, height: h, borderRadius: r }, aStyle, style]}
    />
  );
});

export function SkeletonGroup({ children, gap = 8, style }: { children: React.ReactNode; gap?: number; style?: ViewStyle }) {
  return <View style={[{ gap }, style]}>{children}</View>;
}
