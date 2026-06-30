import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import { updatePassword } from '@/src/features/auth/authService';
import { hasSupabaseConfig } from '@/src/lib/supabase';
import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordIsLongEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordIsLongEnough && passwordsMatch && hasSupabaseConfig;

  const handleUpdatePassword = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      await updatePassword(password);
      setMessage('Password updated. You can continue to your HydraLock dashboard.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not update your password. Open the latest reset link and try again.',
      );
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
            Secure reset
          </Text>
          <Text style={styles.title} variant="displaySmall">
            Create new password
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            Choose a fresh password to get back to your hydration plan.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle} variant="headlineSmall">
            New password
          </Text>
          <Text style={styles.cardHelper}>
            This screen works after opening the reset link from your email. Use at least 8
            characters.
          </Text>

          <View style={styles.fieldStack}>
            <TextInput
              label="New password"
              mode="outlined"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              label="Confirm password"
              mode="outlined"
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {password.length > 0 && !passwordIsLongEnough ? (
            <Text style={styles.warning}>Password must be at least 8 characters.</Text>
          ) : null}
          {confirmPassword.length > 0 && !passwordsMatch ? (
            <Text style={styles.warning}>Passwords do not match yet.</Text>
          ) : null}
          {!hasSupabaseConfig ? (
            <Text style={styles.warning}>Supabase credentials are required before password reset can work.</Text>
          ) : null}
          {errorMessage ? <Text style={styles.warning}>{errorMessage}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <Button
            contentStyle={styles.buttonContent}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            mode="contained"
            onPress={() => void handleUpdatePassword()}
            style={styles.primaryButton}
          >
            Update password
          </Button>

          <Button mode="text" textColor={colors.cyanSoft} onPress={() => router.replace('/(tabs)')}>
            Continue to dashboard
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
  fieldStack: {
    gap: spacing.md,
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
