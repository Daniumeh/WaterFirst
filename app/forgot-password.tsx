import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import { requestPasswordReset } from '@/src/features/auth/authService';
import { hasSupabaseConfig } from '@/src/lib/supabase';
import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const canSubmit = /^\S+@\S+\.\S+$/.test(normalizedEmail) && hasSupabaseConfig;

  const handleSendReset = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      await requestPasswordReset(normalizedEmail);
      setMessage(
        'If that email belongs to a HydraLock account, a reset link is on its way. Open it on this device to choose a new password.',
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not send reset link.');
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
            Account recovery
          </Text>
          <Text style={styles.title} variant="displaySmall">
            Forgot password?
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            Enter your email and HydraLock will send a secure reset link.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle} variant="headlineSmall">
            Reset your password
          </Text>
          <Text style={styles.cardHelper}>
            Use the email connected to your account. The reset link will open HydraLock so you can
            set a new password.
          </Text>

          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email"
            mode="outlined"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          {!hasSupabaseConfig ? (
            <Text style={styles.warning}>Supabase credentials are required before reset emails can work.</Text>
          ) : null}
          {errorMessage ? <Text style={styles.warning}>{errorMessage}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <Button
            contentStyle={styles.buttonContent}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            mode="contained"
            onPress={() => void handleSendReset()}
            style={styles.primaryButton}
          >
            Send reset link
          </Button>

          <Button mode="text" textColor={colors.cyanSoft} onPress={() => router.replace('./sign-in')}>
            Back to sign in
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
    textAlign: 'center',
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
  input: {
    backgroundColor: colors.panel,
  },
  warning: {
    color: colors.orange,
  },
  success: {
    color: colors.green,
    lineHeight: 21,
  },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: colors.cyan,
  },
  buttonContent: {
    minHeight: 52,
  },
});
