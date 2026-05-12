// Surface — the iOS-26-glass / iOS-blur / Android-flat decision baked in.
// Variants: solid, elevated, glass, alert, sunken
import { useColors, useTheme } from '@/src/theme/ThemeProvider';
import { elevation, type ElevationKey } from '@/src/theme/elevation';
import { radii, type RadiusKey } from '@/src/theme/radii';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React from 'react';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

export type SurfaceVariant = 'solid' | 'elevated' | 'glass' | 'alert' | 'sunken';

export type SurfaceProps = ViewProps & {
  variant?: SurfaceVariant;
  radius?: RadiusKey;
  depth?: ElevationKey;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
};

const glassEnabled = Platform.OS === 'ios' && isLiquidGlassAvailable();

export const Surface = React.memo(function Surface({
  variant = 'solid',
  radius = 'lg',
  depth = 'none',
  padded,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const colors = useColors();
  const { isDark, highVisibility } = useTheme();

  const base: ViewStyle = {
    borderRadius: radii[radius],
    overflow: 'hidden',
    padding: padded ? 16 : undefined,
  };

  if (variant === 'glass' && !highVisibility) {
    if (glassEnabled) {
      return (
        <GlassView
          glassEffectStyle={isDark ? 'regular' : 'clear'}
          isInteractive
          tintColor={colors.surfaceGlassTint}
          style={[base, elevation[depth], style]}
        >
          {children}
        </GlassView>
      );
    }
    if (Platform.OS === 'ios') {
      return (
        <View {...rest} style={[base, elevation[depth], style]}>
          <BlurView
            intensity={48}
            tint={isDark ? 'systemMaterialDark' : 'systemMaterialLight'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceGlassTint }]} />
          {children}
        </View>
      );
    }
    return (
      <View
        {...rest}
        style={[
          base,
          { backgroundColor: colors.surfaceElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
          elevation[depth],
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  const bgByVariant: Record<SurfaceVariant, string> = {
    solid: colors.surface,
    elevated: colors.surfaceElevated,
    sunken: colors.bgSunken,
    alert: colors.alertMuted,
    glass: colors.surface,
  };

  const borderByVariant: Partial<Record<SurfaceVariant, string>> = {
    alert: colors.alert,
  };

  return (
    <View
      {...rest}
      style={[
        base,
        {
          backgroundColor: bgByVariant[variant],
          borderWidth: borderByVariant[variant] ? 1 : StyleSheet.hairlineWidth,
          borderColor: borderByVariant[variant] ?? colors.border,
        },
        elevation[depth],
        style,
      ]}
    >
      {children}
    </View>
  );
});
