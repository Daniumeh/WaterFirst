import { Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import type { HydrationUnit } from '@/src/features/hydration/units';
import { colors, radius } from '@/src/theme/tokens';

type UnitSwitcherProps = {
  unit: HydrationUnit;
  onChange: (unit: HydrationUnit) => void;
};

export function UnitSwitcher({ unit, onChange }: UnitSwitcherProps) {
  const nextUnit = unit === 'cl' ? 'ml' : unit === 'ml' ? 'L' : 'cl';

  return (
    <Pressable style={styles.switcher} onPress={() => onChange(nextUnit)}>
      <Text style={styles.label}>Unit: {unit}</Text>
      <Text style={styles.chevron}>⌄</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switcher: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 14,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  chevron: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 18,
  },
});
