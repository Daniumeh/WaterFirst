import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, ProgressBar, Text, TextInput } from 'react-native-paper';

import { shouldTriggerSoftLock } from '@/src/features/accountability/softLockRules';
import { getNextCheckpoint } from '@/src/features/hydration/hydrationMath';
import { useAccountabilityStore } from '@/src/store/accountabilityStore';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, radius, shadow, spacing } from '@/src/theme/tokens';

const quickAdds = [250, 500, 750];

export default function TodayScreen() {
  const profile = useProfileStore((state) => state.profile);
  const { checkpoints, goal, logWater, progress } = useHydrationStore();
  const accountability = useAccountabilityStore();
  const [customAmount, setCustomAmount] = useState('');
  const nextCheckpoint = getNextCheckpoint(checkpoints, new Date());
  const lockSuggested = shouldTriggerSoftLock({
    checkpoints,
    loggedMl: progress.loggedMl,
    now: new Date(),
    snoozedUntil: accountability.snoozedUntil,
    overrideCount: accountability.overrideCount,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topGlow} />
      <View style={styles.header}>
        <Text style={styles.kicker} variant="labelLarge">
          Protected hydration
        </Text>
        <Text style={styles.title} variant="headlineLarge">
          Today
        </Text>
        <Text style={styles.subtitle} variant="bodyLarge">
          Hi {profile.name || 'there'}, keep your plan moving.
        </Text>
      </View>

      <Card mode="contained" style={styles.heroCard}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.progressHeader}>
            <View style={styles.progressDial}>
              <Text style={styles.progressPercent} variant="displaySmall">
                {progress.percentComplete}%
              </Text>
              <Text style={styles.dialLabel}>complete</Text>
            </View>
            <View style={styles.metricStack}>
              <Text style={styles.metricLabel}>Remaining</Text>
              <Text style={styles.metricValue} variant="headlineSmall">
                {progress.remainingMl} ml
              </Text>
            </View>
          </View>
          <ProgressBar
            color={colors.cyan}
            progress={progress.percentComplete / 100}
            style={styles.progressBar}
          />
          <Text style={styles.subtitle}>
            {progress.loggedMl} ml logged of {goal.targetMl} ml
          </Text>
          {nextCheckpoint ? (
            <Text style={styles.subtitle}>
              Next checkpoint: {nextCheckpoint.targetMl} ml by {nextCheckpoint.timeLabel}
            </Text>
          ) : (
            <Text style={styles.subtitle}>All checkpoints are complete for today.</Text>
          )}
        </Card.Content>
      </Card>

      {lockSuggested ? (
        <Card mode="contained" style={styles.lockCard}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.lockTitle} variant="titleMedium">
              Checkpoint missed
            </Text>
            <Text style={styles.subtitle}>A soft-lock check-in is ready when you need a firmer nudge.</Text>
            <Link href="/soft-lock" asChild>
              <Button mode="contained" style={styles.primaryButton}>
                Open HydraLock
              </Button>
            </Link>
          </Card.Content>
        </Card>
      ) : null}

      <View style={styles.quickRow}>
        {quickAdds.map((amount) => (
          <Button
            key={amount}
            mode="contained-tonal"
            style={styles.quickButton}
            onPress={() => logWater(amount)}
          >
            +{amount} ml
          </Button>
        ))}
      </View>

      <Card mode="contained" style={styles.panelCard}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardTitle} variant="titleMedium">
            Custom entry
          </Text>
          <TextInput
            keyboardType="numeric"
            label="Amount in ml"
            mode="outlined"
            style={styles.input}
            value={customAmount}
            onChangeText={setCustomAmount}
          />
          <Button
            mode="contained"
            style={styles.primaryButton}
            onPress={() => {
              logWater(Number(customAmount) || 0);
              setCustomAmount('');
            }}
          >
            Log Water
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  topGlow: {
    position: 'absolute',
    right: -80,
    top: -110,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#075887',
    opacity: 0.45,
  },
  header: {
    gap: spacing.xs,
  },
  kicker: {
    color: colors.orange,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
  },
  heroCard: {
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.midnight,
    ...shadow,
  },
  panelCard: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  cardContent: {
    gap: spacing.md,
  },
  progressHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDial: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 132,
    height: 132,
    borderColor: colors.cyan,
    borderRadius: 66,
    borderWidth: 8,
    backgroundColor: '#071827',
  },
  progressPercent: {
    color: colors.text,
    fontWeight: '800',
  },
  dialLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  metricStack: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  metricLabel: {
    color: colors.faint,
  },
  metricValue: {
    color: colors.cyan,
    fontWeight: '800',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cardRaised,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickButton: {
    borderRadius: radius.md,
    backgroundColor: colors.cardRaised,
  },
  lockCard: {
    borderColor: colors.orange,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: '#261C18',
  },
  lockTitle: {
    color: colors.orange,
    fontWeight: '800',
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.panel,
  },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: colors.cyan,
  },
});
