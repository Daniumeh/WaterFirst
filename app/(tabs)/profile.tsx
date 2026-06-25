import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { useProfileStore } from '@/src/store/profileStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function ProfileScreen() {
  const profile = useProfileStore((state) => state.profile);

  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="headlineSmall">
        Profile
      </Text>
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <Text style={styles.cardTitle} variant="titleLarge">
            {profile.name || 'HydraLock User'}
          </Text>
          <Text style={styles.subtitle}>{profile.email || 'No email saved yet'}</Text>
          <Text style={styles.subtitle}>
            Soft Lock {profile.softLockConsent ? 'ON' : 'OFF'} · Notifications{' '}
            {profile.notificationConsent ? 'ON' : 'OFF'}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  title: {
    color: colors.text,
    fontWeight: '900',
  },
  card: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  content: {
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 21,
  },
});
