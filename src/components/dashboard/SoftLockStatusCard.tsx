import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

type SoftLockStatusCardProps = {
  enabled: boolean;
  nextEnforcementTime: string;
  complianceScore: number;
};

export function SoftLockStatusCard({
  enabled,
  nextEnforcementTime,
  complianceScore,
}: SoftLockStatusCardProps) {
  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={styles.icon} />
            <Text style={styles.title} variant="titleLarge">
              Soft Lock
            </Text>
          </View>
          <View style={[styles.toggle, !enabled && styles.toggleOff]}>
            <View style={styles.toggleKnob} />
          </View>
        </View>

        <Text style={styles.statusLine}>
          Soft Lock: <Text style={styles.statusText}>{enabled ? 'ON' : 'OFF'}</Text>
        </Text>
        <View style={styles.bodyRow}>
          <View style={styles.metricStack}>
            <InfoBlock label="Next Enforcement" value={nextEnforcementTime} />
            <View style={styles.separator} />
            <InfoBlock label="Compliance Score" value={`${complianceScore}%`} />
          </View>
          <View style={styles.shield}>
            <View style={styles.lockBody}>
              <View style={styles.lockShackle} />
              <View style={styles.lockPlate} />
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

type InfoBlockProps = {
  label: string;
  value: string;
};

function InfoBlock({ label, value }: InfoBlockProps) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  content: {
    gap: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  icon: {
    width: 18,
    height: 22,
    borderColor: colors.cyan,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: 'rgba(32, 199, 255, 0.12)',
  },
  title: {
    color: colors.text,
    fontWeight: '900',
  },
  toggle: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 52,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 4,
    backgroundColor: colors.cyan,
  },
  toggleOff: {
    backgroundColor: colors.border,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
  },
  statusLine: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  statusText: {
    color: colors.cyan,
    fontWeight: '900',
  },
  bodyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricStack: {
    flex: 1,
    gap: spacing.sm,
  },
  infoBlock: {
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  infoValue: {
    color: colors.cyan,
    fontFamily: type.data,
    fontSize: 20,
    fontWeight: '900',
  },
  separator: {
    height: 1,
    backgroundColor: colors.line,
  },
  shield: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 84,
    borderColor: colors.cyanSoft,
    borderRadius: radius.lg,
    borderWidth: 2,
    backgroundColor: 'rgba(20, 125, 255, 0.16)',
  },
  lockBody: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 38,
    height: 44,
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 24,
    borderColor: colors.cyanSoft,
    borderRadius: 12,
    borderWidth: 4,
    borderBottomWidth: 0,
  },
  lockPlate: {
    width: 34,
    height: 27,
    borderRadius: radius.sm,
    backgroundColor: colors.blue,
  },
});
