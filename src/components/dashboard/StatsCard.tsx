import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors, spacing } from '@/src/theme/tokens';

type StatsCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function StatsCard({ label, value, helper }: StatsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },
  value: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  helper: {
    color: colors.cyanSoft,
    fontSize: 12,
    fontWeight: '700',
  },
});
