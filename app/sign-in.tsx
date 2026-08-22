import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buildProfileFromUser,
  buildProtectedAppsFromUser,
  signInWithEmail,
} from '@/src/features/auth/authService';
import { hasSupabaseConfig } from '@/src/lib/supabase';
import { useAccountabilityStore } from '@/src/store/accountabilityStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, glassShadow, radius, spacing, typography } from '@/src/theme/tokens';

const waterfirstLogoDrop = require('../assets/images/waterfirst-logo-drop-v2.png');

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((state) => state.profile);
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);
  const setHydrationShieldPermissionStatus = useAccountabilityStore(
    (state) => state.setHydrationShieldPermissionStatus,
  );
  const setProtectedApps = useAccountabilityStore((state) => state.setProtectedApps);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (profile.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  const canSubmit = /^\S+@\S+\.\S+$/.test(email.trim()) && password.length >= 8 && hasSupabaseConfig;
  const topSafePadding = Math.max(insets.top + spacing.lg, spacing.xxl);
  const bottomSafePadding = Math.max(insets.bottom, 24);

  const handleSignIn = async () => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await signInWithEmail({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!result.session?.user) {
        throw new Error('Could not start a session. Check your email confirmation status.');
      }

      const signedInProfile = buildProfileFromUser(result.session.user);
      const protectedApps = buildProtectedAppsFromUser(result.session.user);

      setProtectedApps(protectedApps.selectedAppIds, protectedApps.appPackageNames);
      setHydrationShieldPermissionStatus(signedInProfile.softLockConsent ? 'enabled' : 'disabled');
      completeOnboarding(signedInProfile);
      router.replace('/(tabs)');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <View style={styles.reservoirBand} />
      <View style={styles.waterline} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: bottomSafePadding,
            paddingTop: topSafePadding,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.logoMark}>
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel="WaterFirst logo"
              resizeMode="contain"
              source={waterfirstLogoDrop}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.kicker} variant="labelLarge">
            Welcome back
          </Text>
          <Text style={styles.title} variant="displaySmall">
            Sign in
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            Continue your hydration accountability plan.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle} variant="headlineSmall">
            WaterFirst account
          </Text>
          <Text style={styles.cardHelper}>Use the email and password from your sign-up flow.</Text>

          <View style={styles.fieldStack}>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              mode="outlined"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              label="Password"
              mode="outlined"
              right={
                <TextInput.Icon
                  color={colors.muted}
                  forceTextInputFocus={false}
                  icon={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setIsPasswordVisible((current) => !current)}
                />
              }
              secureTextEntry={!isPasswordVisible}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {!hasSupabaseConfig ? (
            <Text style={styles.warning}>Supabase credentials are required before sign-in can work.</Text>
          ) : null}
          {authError ? <Text style={styles.warning}>{authError}</Text> : null}

          <Button
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            mode="contained"
            onPress={() => void handleSignIn()}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            Sign in
          </Button>

          <View style={styles.linkRow}>
            <Button
              compact
              mode="text"
              textColor={colors.cyanSoft}
              onPress={() => router.push('./forgot-password')}
              style={styles.linkButton}
            >
              Forgot password?
            </Button>
            <Button
              compact
              mode="text"
              textColor={colors.cyanSoft}
              onPress={() => router.replace('/onboarding')}
              style={styles.linkButton}
            >
              Create account
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  reservoirBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 110,
    height: 110,
    backgroundColor: 'rgba(20, 125, 255, 0.12)',
  },
  waterline: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: 86,
    height: 1,
    backgroundColor: colors.line,
  },
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  headerCard: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  logoMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 92,
    height: 92,
  },
  logoImage: {
    height: 88,
    width: 88,
  },
  kicker: {
    color: colors.cyan,
    ...typography.h2,
    letterSpacing: 0,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body1,
    textAlign: 'center',
  },
  card: {
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  cardTitle: {
    color: colors.text,
    ...typography.h1,
  },
  cardHelper: {
    color: colors.muted,
    ...typography.body1,
  },
  fieldStack: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.panel,
  },
  warning: {
    color: colors.orange,
    ...typography.body1,
  },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: colors.cyan,
  },
  buttonContent: {
    minHeight: 52,
  },
  linkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  linkButton: {
    flexShrink: 1,
  },
});
