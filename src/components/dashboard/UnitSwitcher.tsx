import { Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import type { HydrationUnit } from '@/src/features/hydration/units';
import { colors, radius, typography } from '@/src/theme/tokens';

type UnitSwitcherProps = {
  unit: HydrationUnit;
  onChange: (unit: HydrationUnit) => void;
};

export function UnitSwitcher({ unit, onChange }: UnitSwitcherProps) {
  const nextUnit = unit === 'cl' ? 'ml' : unit === 'ml' ? 'L' : 'cl';

  return (
    <Pressable style={styles.switcher} onPress={() => onChange(nextUnit)}>
      <Text style={styles.label}>Unit: {unit}</Text>
      <Text style={styles.chevron}>v</Text>
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
    minHeight: 40,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(3, 16, 28, 0.42)',
    borderRadius: radius.lg,
  },
  label: {
    color: colors.text,
    ...typography.body1,
  },
  chevron: {
    color: colors.muted,
    ...typography.body2,
  },
});
