import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { signOut } from '@/src/features/auth/authService';
import { useAuthStore } from '@/src/store/authStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const resetOnboarding = useProfileStore((state) => state.resetOnboarding);

  const handleSignOut = async () => {
    await signOut();
    resetOnboarding();
  };

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
          <Text style={styles.subtitle}>{user?.email ?? profile.email ?? 'No email saved yet'}</Text>
          <Text style={styles.subtitle}>
            Soft Lock {profile.softLockConsent ? 'ON' : 'OFF'} · Notifications{' '}
            {profile.notificationConsent ? 'ON' : 'OFF'}
          </Text>
          <Button mode="outlined" textColor={colors.cyanSoft} onPress={() => void handleSignOut()}>
            Sign out
          </Button>
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
