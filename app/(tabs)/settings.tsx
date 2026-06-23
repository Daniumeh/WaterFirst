import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { generateCheckpoints } from '@/src/features/hydration/hydrationMath';
import type { UnitPreference } from '@/src/features/hydration/types';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function SettingsScreen() {
  const { profile, updateProfile, resetOnboarding } = useProfileStore();
  const { goal, setGoal, setCheckpoints } = useHydrationStore();
  const [targetMl, setTargetMl] = useState(String(goal.targetMl));

  const displayGoal = useMemo(() => Number(targetMl) || goal.targetMl, [goal.targetMl, targetMl]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title} variant="headlineSmall">
        Settings
      </Text>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardTitle} variant="titleMedium">
            Profile
          </Text>
          <TextInput
            label="Name"
            mode="outlined"
            style={styles.input}
            value={profile.name}
            onChangeText={(name) => updateProfile({ name })}
          />
          <SegmentedButtons
            value={profile.unitPreference}
            onValueChange={(value) => {
              const unitPreference = value as UnitPreference;
              updateProfile({ unitPreference });
              setGoal({ ...goal, unitPreference });
            }}
            buttons={[
              { label: 'oz', value: 'imperial' },
              { label: 'ml', value: 'metric' },
            ]}
          />
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardTitle} variant="titleMedium">
            Daily goal override
          </Text>
          <TextInput
            keyboardType="numeric"
            label="Target ml"
            mode="outlined"
            style={styles.input}
            value={targetMl}
            onChangeText={setTargetMl}
          />
          <Text style={styles.subtitle}>{displayGoal} ml split across active-hour checkpoints.</Text>
          <Button
            mode="contained"
            style={styles.primaryButton}
            onPress={() => {
              const nextGoal = Number(targetMl) || goal.targetMl;
              setGoal({ ...goal, targetMl: nextGoal, manualOverrideMl: nextGoal });
              setCheckpoints(generateCheckpoints(nextGoal, profile.wakeTime, profile.sleepTime));
            }}
          >
            Save Goal
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button mode="outlined" textColor={colors.cyanSoft} onPress={resetOnboarding}>
          Redo onboarding
        </Button>
        <Button mode="text" textColor={colors.muted}>
          Sign out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
  },
  card: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  cardContent: {
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
  },
  input: {
    backgroundColor: colors.panel,
  },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: colors.cyan,
  },
  actions: {
    gap: spacing.sm,
  },
});
