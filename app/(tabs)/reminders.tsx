import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Switch, Text, TextInput } from 'react-native-paper';

import { requestReminderPermissions } from '@/src/features/reminders/reminderService';
import { useReminderStore } from '@/src/store/reminderStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function RemindersScreen() {
  const { settings, updateSettings, pauseUntil } = useReminderStore();
  const [permissionStatus, setPermissionStatus] = useState('Not requested');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title} variant="headlineSmall">
        Reminders
      </Text>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.cardTitle} variant="titleMedium">
                Smart reminders
              </Text>
              <Text style={styles.subtitle}>
                Send nudges only during active hours and ease off when you are on track.
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(enabled) => updateSettings({ enabled })}
            />
          </View>
          <View style={styles.timeRow}>
            <TextInput
              label="Start"
              mode="outlined"
              style={[styles.input, styles.timeInput]}
              value={settings.activeStart}
              onChangeText={(activeStart) => updateSettings({ activeStart })}
            />
            <TextInput
              label="End"
              mode="outlined"
              style={[styles.input, styles.timeInput]}
              value={settings.activeEnd}
              onChangeText={(activeEnd) => updateSettings({ activeEnd })}
            />
          </View>
          <TextInput
            keyboardType="numeric"
            label="Snooze minutes"
            mode="outlined"
            style={styles.input}
            value={String(settings.snoozeMinutes)}
            onChangeText={(value) => updateSettings({ snoozeMinutes: Number(value) || 0 })}
          />
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardTitle} variant="titleMedium">
            Notification permission
          </Text>
          <Text style={styles.subtitle}>{permissionStatus}</Text>
          <Button
            mode="contained-tonal"
            style={styles.secondaryButton}
            onPress={async () => {
              const result = await requestReminderPermissions();
              setPermissionStatus(result.status);
            }}
          >
            Check Permission
          </Button>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        textColor={colors.cyanSoft}
        onPress={() => pauseUntil(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString())}
      >
        Pause for 2 hours
      </Button>
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
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeInput: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.panel,
  },
  secondaryButton: {
    borderRadius: radius.md,
    backgroundColor: colors.cardRaised,
  },
});
