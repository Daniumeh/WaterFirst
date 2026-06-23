import { MD3DarkTheme } from 'react-native-paper';

import { colors } from './tokens';

export const hydraLockTheme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.cyan,
    onPrimary: colors.ink,
    primaryContainer: colors.cardRaised,
    onPrimaryContainer: colors.text,
    secondary: colors.cyanSoft,
    onSecondary: colors.ink,
    secondaryContainer: colors.panel,
    tertiary: colors.orange,
    background: colors.ink,
    surface: colors.panel,
    surfaceVariant: colors.card,
    onSurface: colors.text,
    onSurfaceVariant: colors.muted,
    outline: colors.border,
    error: '#FF6B6B',
  },
};
