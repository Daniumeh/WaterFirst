import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Card, Text } from 'react-native-paper';

import type { ProtectedApp } from '@/src/features/accountability/protectedApps';
import { colors, glassShadow, radius, spacing, typography } from '@/src/theme/tokens';

import { DashboardIcon, dashboardIcons } from './DashboardIcon';

type SoftLockStatusCardProps = {
  enabled: boolean;
  nextEnforcementTime: string;
  complianceScore: number;
  onOpenHydrationShield: () => void;
  protectedApps?: ProtectedApp[];
  shieldedAppCount?: number;
};

export function SoftLockStatusCard({
  enabled,
  nextEnforcementTime,
  complianceScore,
  onOpenHydrationShield,
  protectedApps = [],
  shieldedAppCount = 0,
}: SoftLockStatusCardProps) {
  const visibleApps = protectedApps.slice(0, 4);
  const overflowCount = Math.max(protectedApps.length - visibleApps.length, 0);
  const displayCount = protectedApps.length || shieldedAppCount;

  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={styles.iconBubble}>
              <DashboardIcon name={dashboardIcons.lock} size={21} color={colors.cyan} />
            </View>
            <View>
              <Text style={styles.kicker}>Accountability</Text>
              <Text style={styles.title}>Soft Lock: {enabled ? 'ON' : 'OFF'}</Text>
            </View>
          </View>
          <View style={[styles.toggle, !enabled && styles.toggleOff]}>
            <View style={[styles.toggleKnob, !enabled && styles.toggleKnobOff]} />
          </View>
        </View>

        <View style={styles.metricsRow}>
          <InfoBlock label="Next Enforcement" value={nextEnforcementTime} />
          <InfoBlock label="Compliance Score" value={`${complianceScore}%`} accent />
        </View>

        <View style={styles.shieldedAppsPanel}>
          <Text style={styles.shieldedLabel}>Shielded apps</Text>
          <View style={styles.appIconRow}>
            {visibleApps.length > 0 ? (
              visibleApps.map((app) => (
                <View key={app.id} style={styles.appIconTile}>
                  <MaterialCommunityIcons name={app.icon} color={app.tint} size={24} />
                </View>
              ))
            ) : (
              <View style={styles.emptyAppTile}>
                <MaterialCommunityIcons name="apps" color={colors.cyan} size={23} />
              </View>
            )}
            {overflowCount > 0 ? (
              <View style={styles.overflowBadge}>
                <Text style={styles.overflowText}>+{overflowCount}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.shieldedCount}>
            {displayCount} {displayCount === 1 ? 'app' : 'apps'}
          </Text>
        </View>

        <Button
          mode="contained"
          icon="water-outline"
          onPress={onOpenHydrationShield}
          style={styles.openButton}
          contentStyle={styles.openButtonContent}
        >
          Open Hydration Shield
        </Button>
      </Card.Content>
    </Card>
  );
}

type InfoBlockProps = {
  accent?: boolean;
  label: string;
  value: string;
};

function InfoBlock({ accent, label, value }: InfoBlockProps) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, accent && styles.infoValueAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: 'rgba(10, 36, 55, 0.62)',
    ...glassShadow,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.md,
  },
  iconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(32, 199, 255, 0.1)',
  },
  kicker: {
    color: colors.muted,
    ...typography.h2,
  },
  title: {
    color: colors.text,
    ...typography.h1,
    marginTop: 2,
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
    alignItems: 'flex-start',
    backgroundColor: 'rgba(97, 127, 149, 0.34)',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
  },
  toggleKnobOff: {
    backgroundColor: colors.muted,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoBlock: {
    flex: 1,
    flexBasis: 96,
    minWidth: 0,
    gap: spacing.xs,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    backgroundColor: 'rgba(3, 16, 28, 0.32)',
  },
  infoLabel: {
    color: colors.muted,
    ...typography.h2,
  },
  infoValue: {
    color: colors.text,
    ...typography.h1,
  },
  infoValueAccent: {
    color: colors.cyan,
  },
  shieldedAppsPanel: {
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(3, 16, 28, 0.22)',
  },
  shieldedLabel: {
    color: colors.muted,
    ...typography.h2,
  },
  appIconRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  appIconTile: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 10, 18, 0.72)',
  },
  emptyAppTile: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(32, 199, 255, 0.08)',
  },
  overflowBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(20, 125, 255, 0.34)',
  },
  overflowText: {
    color: colors.cyanSoft,
    ...typography.h2,
  },
  shieldedCount: {
    color: colors.muted,
    ...typography.body1,
  },
  openButton: {
    borderRadius: radius.md,
    backgroundColor: colors.blue,
  },
  openButtonContent: {
    minHeight: 54,
  },
});
