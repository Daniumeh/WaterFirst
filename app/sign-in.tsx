import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import { buildProfileFromUser, signInWithEmail } from '@/src/features/auth/authService';
import { hasSupabaseConfig } from '@/src/lib/supabase';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

export default function SignInScreen() {
  const profile = useProfileStore((state) => state.profile);
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (profile.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  const canSubmit = /^\S+@\S+\.\S+$/.test(email.trim()) && password.length >= 8 && hasSupabaseConfig;

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

      completeOnboarding(buildProfileFromUser(result.session.user));
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
      <ScrollView contentContainerStyle={styles.container} showsHorizontalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.logoMark}>
            <View style={styles.logoBarVertical} />
            <View style={styles.logoBarHorizontal} />
            <View style={styles.logoDot} />
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
            HydraLock account
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
              secureTextEntry
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

          <Button
            mode="text"
            textColor={colors.cyanSoft}
            onPress={() => router.replace('/onboarding')}
          >
            Create a new account
          </Button>
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
    gap: spacing.lg,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
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
    width: 74,
    height: 74,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(3, 16, 28, 0.7)',
  },
  logoBarVertical: {
    position: 'absolute',
    width: 8,
    height: 46,
    borderRadius: 4,
    backgroundColor: colors.cyan,
    transform: [{ rotate: '45deg' }],
  },
  logoBarHorizontal: {
    position: 'absolute',
    width: 46,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cyanSoft,
    transform: [{ rotate: '45deg' }],
  },
  logoDot: {
    position: 'absolute',
    right: 18,
    top: 17,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.orange,
  },
  kicker: {
    color: colors.cyan,
    letterSpacing: 0,
  },
  title: {
    color: colors.text,
    fontFamily: type.data,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
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
    fontWeight: '800',
  },
  cardHelper: {
    color: colors.muted,
    lineHeight: 21,
  },
  fieldStack: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.panel,
  },
  warning: {
    color: colors.orange,
  },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: colors.cyan,
  },
  buttonContent: {
    minHeight: 52,
  },
});
