// Sheet — bottom sheet wrapper over @gorhom/bottom-sheet with our theme.
// Variants: detents (peek 30 / medium 60 / full 92)
import { useColors } from '@/src/theme/ThemeProvider';
import { radii } from '@/src/theme/radii';
import { spacing } from '@/src/theme/spacing';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetProps,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from './Text';

export type SheetProps = Omit<BottomSheetProps, 'children' | 'backgroundStyle' | 'handleIndicatorStyle' | 'backdropComponent' | 'snapPoints'> & {
  title?: string;
  snapPoints?: BottomSheetProps['snapPoints'];
  children: React.ReactNode;
};

export const Sheet = forwardRef<BottomSheet, SheetProps>(function Sheet(
  { title, snapPoints, children, ...rest },
  ref,
) {
  const colors = useColors();
  const defaultSnap = useMemo(() => snapPoints ?? ['40%', '88%'], [snapPoints]);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={defaultSnap}
      enablePanDownToClose
      enableDynamicSizing={false}
      backgroundStyle={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40, height: 4 }}
      backdropComponent={SheetBackdrop}
      {...rest}
    >
      <BottomSheetView style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] }}>
        {title ? (
          <View style={{ paddingVertical: spacing.md }}>
            <Text variant="headlineMD">{title}</Text>
          </View>
        ) : null}
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
});

function SheetBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.32} />;
}
