// Screen — safe-area-aware page chrome with consistent padding + status bar.
// Variants: scroll, fixed
import { useColors, useTheme } from '@/src/theme/ThemeProvider';
import { spacing } from '@/src/theme/spacing';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentContainerStyle?: ViewStyle;
  refreshControl?: ScrollViewProps['refreshControl'];
  style?: ViewStyle;
  noStatusBar?: boolean;
};

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
  contentContainerStyle,
  refreshControl,
  style,
  noStatusBar,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDark } = useTheme();

  const top = edges.includes('top') ? insets.top : 0;
  const bottom = edges.includes('bottom') ? insets.bottom : 0;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingTop: top,
    paddingBottom: bottom,
  };

  const contentStyle: ViewStyle = {
    paddingHorizontal: padded ? spacing.lg : 0,
    paddingBottom: padded ? spacing['3xl'] : 0,
  };

  return (
    <View style={[containerStyle, style]}>
      {!noStatusBar && <StatusBar style={isDark ? 'light' : 'dark'} />}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[contentStyle, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle, contentContainerStyle]}>{children}</View>
      )}
    </View>
  );
}
