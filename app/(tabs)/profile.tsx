import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signOut } from '@/src/features/auth/authService';
import { useAuthStore } from '@/src/store/authStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const resetOnboarding = useProfileStore((state) => state.resetOnboarding);

  const handleSignOut = async () => {
    await signOut();
    resetOnboarding();
  };
  const topSafePadding = Math.max(insets.top + spacing.md, spacing.lg);
  const bottomSafePadding = Math.max(insets.bottom + 96, 110);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: bottomSafePadding,
          paddingTop: topSafePadding,
        },
      ]}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title} variant="headlineSmall">
        Profile
      </Text>
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <Text style={styles.cardTitle} variant="titleLarge">
            {profile.name || 'WaterFirst User'}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  title: {
    color: colors.text,
    ...typography.h1,
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
    ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body1,
  },
});
