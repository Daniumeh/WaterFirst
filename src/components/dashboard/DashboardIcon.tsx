import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import type { ColorValue, StyleProp, TextStyle } from 'react-native';

import { colors } from '@/src/theme/tokens';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type DashboardIconProps = {
  color?: ColorValue;
  name: MaterialIconName;
  size?: number;
  style?: StyleProp<TextStyle>;
};

export function DashboardIcon({
  color = colors.cyan,
  name,
  size = 22,
  style,
}: DashboardIconProps) {
  return <MaterialCommunityIcons name={name} size={size} color={color as string} style={style} />;
}

export const dashboardIcons = {
  bell: 'bell-outline',
  bottle: 'bottle-soda-classic-outline',
  calendar: 'calendar-month-outline',
  chevronRight: 'chevron-right',
  cup: 'cup-water',
  droplet: 'water-outline',
  history: 'history',
  home: 'home-variant-outline',
  lock: 'shield-lock-outline',
  profile: 'account-outline',
  reminder: 'bell-badge-outline',
  shield: 'shield-outline',
} satisfies Record<string, MaterialIconName>;
