import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Switch, Text, TextInput } from 'react-native-paper';

import { addLocalMinutes, getDeviceNow } from '@/src/features/hydration/deviceTime';
import { generateCheckpoints } from '@/src/features/hydration/hydrationMath';
import {
  cancelReminderNotifications,
  requestReminderPermissions,
  scheduleCheckpointReminders,
} from '@/src/features/reminders/reminderService';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useReminderStore } from '@/src/store/reminderStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function RemindersScreen() {
  const { goal, checkpoints, setCheckpoints } = useHydrationStore();
  const {
    permissionMessage,
    permissionStatus,
    scheduledNotificationIds,
    setPermissionState,
    setScheduledNotificationIds,
    settings,
    updateSettings,
    pauseUntil,
  } = useReminderStore();
  const [isScheduling, setIsScheduling] = useState(false);

  const handleReminderToggle = async (enabled: boolean) => {
    setIsScheduling(true);

    try {
      if (!enabled) {
        await cancelReminderNotifications(scheduledNotificationIds);
        setScheduledNotificationIds([]);
        updateSettings({ enabled: false });
        setPermissionState(permissionStatus, 'Hydration reminders are turned off.');
        return;
      }

      const scheduledReminders = await scheduleCheckpointReminders({
        checkpoints,
        enabled: true,
        existingNotificationIds: scheduledNotificationIds,
      });

      updateSettings({ enabled: true });
      setPermissionState('granted');
      setScheduledNotificationIds(scheduledReminders.map((reminder) => reminder.notificationId));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Hydration reminders need notification access. You can enable notifications in your device settings and try again.';
      updateSettings({ enabled: false });
      setPermissionState('denied', message);
      setScheduledNotificationIds([]);
    } finally {
      setIsScheduling(false);
    }
  };

  const applyScheduleChanges = async () => {
    const nextCheckpoints = generateCheckpoints(goal.targetMl, settings.activeStart, settings.activeEnd);

    setCheckpoints(nextCheckpoints);

    if (!settings.enabled) {
      return;
    }

    setIsScheduling(true);

    try {
      const scheduledReminders = await scheduleCheckpointReminders({
        checkpoints: nextCheckpoints,
        enabled: true,
        existingNotificationIds: scheduledNotificationIds,
      });
      setPermissionState('granted');
      setScheduledNotificationIds(scheduledReminders.map((reminder) => reminder.notificationId));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Hydration reminders need notification access. You can enable notifications in your device settings and try again.';
      updateSettings({ enabled: false });
      setPermissionState('denied', message);
      setScheduledNotificationIds([]);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsHorizontalScrollIndicator={false}>
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
              disabled={isScheduling}
              value={settings.enabled}
              onValueChange={(enabled) => void handleReminderToggle(enabled)}
            />
          </View>
          <View style={styles.timeRow}>
            <TextInput
              label="Start"
              mode="outlined"
              style={[styles.input, styles.timeInput]}
              value={settings.activeStart}
              onChangeText={(activeStart) => updateSettings({ activeStart })}
              onEndEditing={() => void applyScheduleChanges()}
            />
            <TextInput
              label="End"
              mode="outlined"
              style={[styles.input, styles.timeInput]}
              value={settings.activeEnd}
              onChangeText={(activeEnd) => updateSettings({ activeEnd })}
              onEndEditing={() => void applyScheduleChanges()}
            />
          </View>
          <Button
            mode="contained-tonal"
            loading={isScheduling}
            disabled={isScheduling}
            style={styles.secondaryButton}
            onPress={() => void applyScheduleChanges()}
          >
            Apply reminder schedule
          </Button>
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
          {permissionMessage ? <Text style={styles.permissionMessage}>{permissionMessage}</Text> : null}
          <Text style={styles.subtitle}>
            {scheduledNotificationIds.length} recurring local reminder
            {scheduledNotificationIds.length === 1 ? '' : 's'} scheduled.
          </Text>
          <Button
            mode="contained-tonal"
            style={styles.secondaryButton}
            onPress={async () => {
              const result = await requestReminderPermissions();
              if (result.granted) {
                setPermissionState(result.status);
              } else {
                setPermissionState(
                  result.status,
                  'Hydration reminders need notification access. You can enable notifications in your device settings and try again.',
                );
              }
            }}
          >
            Check Permission
          </Button>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        textColor={colors.cyanSoft}
        onPress={() => pauseUntil(addLocalMinutes(getDeviceNow(), 120).toISOString())}
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
  permissionMessage: {
    color: colors.orange,
    lineHeight: 21,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  timeInput: {
    flexBasis: 120,
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
