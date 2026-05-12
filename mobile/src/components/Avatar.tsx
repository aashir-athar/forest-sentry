// Avatar — initials disc; auto-color from a string seed.
// Variants: sm, md, lg
import { palette } from '@/src/theme/colors';
import { useColors } from '@/src/theme/ThemeProvider';
import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Text } from './Text';

export type AvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
};

const sizeMap = { sm: 28, md: 40, lg: 56 } as const;
const accentRing = [palette.moss500, palette.forest500, palette.bark500, palette.info500] as const;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

export const Avatar = React.memo(function Avatar({ name, size = 'md', style }: AvatarProps) {
  const colors = useColors();
  const dim = sizeMap[size];
  const ringColor = accentRing[hash(name) % accentRing.length] ?? palette.moss500;
  return (
    <View
      accessibilityLabel={`Avatar for ${name}`}
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 2,
          borderColor: ringColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text variant={size === 'lg' ? 'titleMD' : 'labelMD'}>{initials(name)}</Text>
    </View>
  );
});
