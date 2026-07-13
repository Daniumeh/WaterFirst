import type { ViewStyle } from 'react-native';

import { colors } from '@/src/theme/tokens';

export const bottomNavigationStyle: ViewStyle = {
  alignSelf: 'center',
  backgroundColor: 'rgba(5, 24, 39, 0.96)',
  borderColor: colors.line,
  borderTopColor: colors.line,
  borderWidth: 1,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
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
