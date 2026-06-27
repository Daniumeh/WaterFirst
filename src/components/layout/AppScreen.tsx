import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

import { colors } from '@/src/theme/tokens';

type AppScreenProps = PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
}>;

const webCenteredStyle =
  Platform.OS === 'web' ? ({ margin: '0 auto' } as unknown as ViewStyle) : null;

export function AppScreen({ children, style }: AppScreenProps) {
  const { height } = useWindowDimensions();
  const minHeight = Platform.OS === 'web' ? ('100vh' as ViewStyle['minHeight']) : height;

  return (
    <View style={styles.root}>
      <View style={[styles.screen, webCenteredStyle, { minHeight }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
    backgroundColor: colors.ink,
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
});
