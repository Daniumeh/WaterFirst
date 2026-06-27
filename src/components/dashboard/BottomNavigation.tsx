import type { ViewStyle } from 'react-native';

import { colors } from '@/src/theme/tokens';

export const bottomNavigationStyle: ViewStyle = {
  alignSelf: 'center',
  backgroundColor: colors.midnight,
  borderColor: colors.border,
  borderTopColor: colors.border,
  borderWidth: 1,
  height: 86,
  maxWidth: 430,
  paddingBottom: 12,
  paddingTop: 10,
  width: '100%',
};

export const bottomNavigationColors = {
  active: colors.cyan,
  inactive: colors.muted,
};
