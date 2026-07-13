import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors, radius, spacing, typography } from '@/src/theme/tokens';

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
    gap: spacing.xs,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    backgroundColor: 'rgba(3, 16, 28, 0.32)',
  },
  label: {
    color: colors.muted,
    ...typography.h2,
  },
  value: {
    color: colors.text,
    ...typography.h1,
  },
  helper: {
    color: colors.cyanSoft,
    ...typography.body2,
  },
});
