// Divider — hairline rule with optional inset.
// Variants: full, inset
import { useColors } from '@/src/theme/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type DividerProps = { inset?: number };

export const Divider = React.memo(function Divider({ inset = 0 }: DividerProps) {
  const colors = useColors();
  return (
    <View
      accessibilityElementsHidden
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.divider,
        marginLeft: inset,
      }}
    />
  );
});
