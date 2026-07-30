import { MD3DarkTheme } from 'react-native-paper';

import { colors, typography } from './tokens';

export const waterFirstTheme = {
  ...MD3DarkTheme,
  roundness: 4,
  fonts: {
    ...MD3DarkTheme.fonts,
    bodyLarge: { ...MD3DarkTheme.fonts.bodyLarge, ...typography.body1 },
    bodyMedium: { ...MD3DarkTheme.fonts.bodyMedium, ...typography.body1 },
    bodySmall: { ...MD3DarkTheme.fonts.bodySmall, ...typography.body2 },
    displaySmall: { ...MD3DarkTheme.fonts.displaySmall, ...typography.h1 },
    headlineSmall: { ...MD3DarkTheme.fonts.headlineSmall, ...typography.h1 },
    labelLarge: { ...MD3DarkTheme.fonts.labelLarge, ...typography.h2 },
    titleLarge: { ...MD3DarkTheme.fonts.titleLarge, ...typography.h1 },
    titleMedium: { ...MD3DarkTheme.fonts.titleMedium, ...typography.h2 },
  },
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
