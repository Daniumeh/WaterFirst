import type { ViewStyle } from 'react-native';

import { colors } from '@/src/theme/tokens';

export const bottomNavigationStyle: ViewStyle = {
  alignSelf: 'center',
  backgroundColor: 'rgba(5, 24, 39, 0.96)',
  borderColor: 'rgba(32, 199, 255, 0.14)',
  borderTopColor: 'rgba(32, 199, 255, 0.14)',
  borderWidth: 1,
  borderTopWidth: 0,
  height: 82,
  maxWidth: 430,
  paddingBottom: 10,
  paddingTop: 8,
  width: '100%',
};

export const bottomNavigationColors = {
  active: colors.cyan,
  inactive: colors.muted,
};
