import { SymbolView } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { colors } from '@/src/theme/tokens';

type DashboardIconName = {
  ios: string;
  android: string;
  web: string;
};

type DashboardIconProps = {
  color?: ColorValue;
  name: DashboardIconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function DashboardIcon({
  color = colors.cyan,
  name,
  size = 22,
  style,
}: DashboardIconProps) {
  return <SymbolView name={name as never} size={size} tintColor={color as string} style={style} />;
}

export const dashboardIcons = {
  bell: { ios: 'bell', android: 'notifications', web: 'notifications' },
  bottle: { ios: 'waterbottle', android: 'water_bottle', web: 'water_bottle' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  cup: { ios: 'cup.and.saucer', android: 'local_drink', web: 'local_drink' },
  droplet: { ios: 'drop', android: 'water_drop', web: 'water_drop' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  home: { ios: 'house', android: 'home', web: 'home' },
  lock: { ios: 'lock.shield', android: 'shield_lock', web: 'shield_lock' },
  profile: { ios: 'person', android: 'person', web: 'person' },
  reminder: { ios: 'bell.badge', android: 'notifications_active', web: 'notifications_active' },
  shield: { ios: 'shield', android: 'shield', web: 'shield' },
};
