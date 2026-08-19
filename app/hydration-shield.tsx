import { useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Card, Searchbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
  requestSoftLockAuthorization,
} from '@/src/features/accountability/nativeSoftLockAdapter';
import {
  mockProtectedApps,
  type ProtectedApp,
} from '@/src/features/accountability/protectedApps';
import { useAccountabilityStore } from '@/src/store/accountabilityStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, glassShadow, radius, spacing, typography } from '@/src/theme/tokens';

type SetupStep = 'empty' | 'choose' | 'permission' | 'success';

export default function HydrationShieldSetupScreen() {
  const insets = useSafeAreaInsets();
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const {
    permissionStatus,
    protectedAppIds,
    setHydrationShieldPermissionStatus,
    setProtectedApps,
  } = useAccountabilityStore();
  const [step, setStep] = useState<SetupStep>('empty');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(protectedAppIds);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const topSafePadding = Math.max(insets.top + spacing.md, spacing.lg);
  const bottomSafePadding = Math.max(insets.bottom, 28);
  const selectedApps = useMemo(
    () => mockProtectedApps.filter((app) => selectedIds.includes(app.id)),
    [selectedIds],
  );
  const recommendedApps = useMemo(
    () => filterApps(mockProtectedApps.filter((app) => app.category === 'recommended'), query),
    [query],
  );
  const allApps = useMemo(
    () => filterApps(mockProtectedApps.filter((app) => app.category === 'all'), query),
    [query],
  );

  const saveSelection = () => {
    const packageNames = selectedApps.map((app) => app.packageName);

    setProtectedApps(selectedIds, packageNames);
    updateProfile({
      softLockConsent: true,
      softLockSelectedApplicationCount: selectedIds.length,
    });
  };

  const openPermissionStep = () => {
    saveSelection();
    Vibration.vibrate(10);
    setStep('permission');
  };

  const handleOpenSettings = async () => {
    setIsCheckingPermission(true);

    try {
      if (Platform.OS === 'android') {
        await openAccessibilitySettings();
      } else {
        const status = await requestSoftLockAuthorization();

        if (status === 'approved') {
          setHydrationShieldPermissionStatus('enabled');
          setStep('success');
        }
      }
    } catch (error) {
      Alert.alert(
        'Settings unavailable',
        error instanceof Error ? error.message : 'WaterFirst could not open protection settings.',
      );
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const handleIEnabledIt = async () => {
    setIsCheckingPermission(true);

    try {
      const enabled = Platform.OS === 'android' ? await isAccessibilityServiceEnabled() : true;
      setHydrationShieldPermissionStatus(enabled ? 'enabled' : 'revoked');

      if (enabled) {
        Vibration.vibrate(20);
        setStep('success');
      } else {
        Alert.alert(
          'Protection is still off',
          'Open Accessibility, choose WaterFirst, and turn on the switch.',
        );
      }
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const finish = () => {
    saveSelection();
    router.replace('/(tabs)' as never);
  };

  const handleHeaderBack = () => {
    if (step === 'permission') {
      setStep('choose');
      return;
    }

    router.replace('/(tabs)' as never);
  };

  return (
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
      <SetupHeader title={getTitle(step)} onBack={handleHeaderBack} />

      {step === 'empty' ? (
        <EmptySelectionScreen onChoose={() => setStep('choose')} />
      ) : null}

      {step === 'choose' ? (
        <ChooseAppsScreen
          allApps={allApps}
          onContinue={openPermissionStep}
          query={query}
          recommendedApps={recommendedApps}
          selectedIds={selectedIds}
          setQuery={setQuery}
          toggleApp={(appId) => {
            Vibration.vibrate(8);
            setSelectedIds((current) =>
              current.includes(appId)
                ? current.filter((id) => id !== appId)
                : [...current, appId],
            );
          }}
        />
      ) : null}

      {step === 'permission' ? (
        <PermissionScreen
          isCheckingPermission={isCheckingPermission}
          onEnabled={handleIEnabledIt}
          onOpenSettings={handleOpenSettings}
          permissionStatus={permissionStatus}
        />
      ) : null}

      {step === 'success' ? (
        <SuccessScreen selectedCount={selectedIds.length} onDone={finish} />
      ) : null}
    </ScrollView>
  );
}

function filterApps(apps: ProtectedApp[], query: string) {
  const search = query.trim().toLowerCase();

  if (!search) {
    return apps;
  }

  return apps.filter((app) => app.name.toLowerCase().includes(search));
}

function getTitle(step: SetupStep) {
  if (step === 'permission' || step === 'success') {
    return 'Enable protection';
  }

  return 'Choose protected apps';
}

type SetupHeaderProps = {
  onBack: () => void;
  title: string;
};

function SetupHeader({ onBack, title }: SetupHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.iconButton}>
        <MaterialCommunityIcons name="chevron-left" color={colors.text} size={26} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.iconButton}>
        <MaterialCommunityIcons name="information-outline" color={colors.muted} size={20} />
      </View>
    </View>
  );
}

function EmptySelectionScreen({ onChoose }: { onChoose: () => void }) {
  return (
    <View style={styles.screenBlock}>
      <View style={styles.appEmptyMark}>
        <MaterialCommunityIcons name="apps" color={colors.cyan} size={72} />
        <View style={styles.appEmptyBadge}>
          <MaterialCommunityIcons name="lock-outline" color={colors.cyan} size={22} />
        </View>
      </View>
      <Text style={styles.mainTitle}>Choose protected apps</Text>
      <Text style={styles.centerCopy}>Start by choosing the apps you want WaterFirst to protect.</Text>

      <Card mode="contained" style={styles.explainCard}>
        <Card.Content style={styles.explainContent}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <ExplainRow icon="check-circle-outline" copy="You select the apps." />
          <ExplainRow icon="lock-outline" copy="When you try to open them, we show Hydration Shield." />
          <ExplainRow icon="water-outline" copy="Drink water to unlock and continue." />
        </Card.Content>
      </Card>

      <Button mode="contained" style={styles.primaryButton} onPress={onChoose}>
        Choose apps
      </Button>
    </View>
  );
}

type ChooseAppsScreenProps = {
  allApps: ProtectedApp[];
  onContinue: () => void;
  query: string;
  recommendedApps: ProtectedApp[];
  selectedIds: string[];
  setQuery: (query: string) => void;
  toggleApp: (appId: string) => void;
};

function ChooseAppsScreen({
  allApps,
  onContinue,
  query,
  recommendedApps,
  selectedIds,
  setQuery,
  toggleApp,
}: ChooseAppsScreenProps) {
  const selectedCount = selectedIds.length;

  return (
    <View style={styles.screenBlock}>
      <View style={styles.copyBlock}>
        <Text style={styles.setupTitle}>Select the apps you want WaterFirst to protect.</Text>
        <View style={styles.privacyRow}>
          <MaterialCommunityIcons name="lock-outline" color={colors.muted} size={14} />
          <Text style={styles.smallCopy}>You can change this anytime.</Text>
        </View>
      </View>

      <Searchbar
        iconColor={colors.muted}
        inputStyle={styles.searchInput}
        onChangeText={setQuery}
        placeholder="Search apps..."
        placeholderTextColor={colors.faint}
        style={styles.search}
        value={query}
      />

      <AppSection apps={recommendedApps} selectedIds={selectedIds} title="Recommended" toggleApp={toggleApp} />
      <AppSection apps={allApps} selectedIds={selectedIds} title="All apps" toggleApp={toggleApp} />

      <Button
        mode="contained"
        disabled={selectedCount === 0}
        style={styles.primaryButton}
        onPress={onContinue}
      >
        Continue ({selectedCount} selected)
      </Button>
    </View>
  );
}

type AppSectionProps = {
  apps: ProtectedApp[];
  selectedIds: string[];
  title: string;
  toggleApp: (appId: string) => void;
};

function AppSection({ apps, selectedIds, title, toggleApp }: AppSectionProps) {
  if (apps.length === 0) {
    return null;
  }

  return (
    <View style={styles.appSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.appList}>
        {apps.map((app) => (
          <AppRow
            app={app}
            isSelected={selectedIds.includes(app.id)}
            key={app.id}
            onPress={() => toggleApp(app.id)}
          />
        ))}
      </View>
    </View>
  );
}

type AppRowProps = {
  app: ProtectedApp;
  isSelected: boolean;
  onPress: () => void;
};

function AppRow({ app, isSelected, onPress }: AppRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [styles.appRow, pressed && styles.rowPressed]}
    >
      <View style={styles.appIcon}>
        <MaterialCommunityIcons name={app.icon} color={app.tint} size={22} />
      </View>
      <View style={styles.appText}>
        <Text style={styles.appName}>{app.name}</Text>
      </View>
      <View style={[styles.checkBox, isSelected && styles.checkBoxSelected]}>
        {isSelected ? <MaterialCommunityIcons name="check" color={colors.text} size={15} /> : null}
      </View>
    </Pressable>
  );
}

type PermissionScreenProps = {
  isCheckingPermission: boolean;
  onEnabled: () => void;
  onOpenSettings: () => void;
  permissionStatus: string;
};

function PermissionScreen({
  isCheckingPermission,
  onEnabled,
  onOpenSettings,
  permissionStatus,
}: PermissionScreenProps) {
  return (
    <View style={styles.screenBlock}>
      <View style={styles.permissionShield}>
        <MaterialCommunityIcons name="shield-alert-outline" color={colors.coral} size={92} />
      </View>
      <Text style={styles.mainTitle}>Protection is off</Text>
      <Text style={styles.centerCopy}>
        WaterFirst needs Accessibility permission to detect selected apps and show Hydration Shield.
      </Text>

      <Card mode="contained" style={styles.instructionCard}>
        <Card.Content style={styles.explainContent}>
          <Text style={styles.dangerTitle}>Enable in Settings</Text>
          <InstructionStep step="1" copy="Tap Open Settings below." />
          <InstructionStep step="2" copy="Find WaterFirst." />
          <InstructionStep step="3" copy="Tap Accessibility." />
          <View style={styles.settingsPreview}>
            <View style={styles.settingsIcon}>
              <MaterialCommunityIcons name="water-outline" color={colors.cyan} size={18} />
            </View>
            <Text style={styles.settingsLabel}>WaterFirst</Text>
            <Text style={styles.settingsOff}>{permissionStatus === 'enabled' ? 'On' : 'Off'}</Text>
            <MaterialCommunityIcons name="chevron-right" color={colors.muted} size={18} />
          </View>
          <InstructionStep step="4" copy="Turn on the switch for WaterFirst." />
          <InstructionStep step="5" copy="Return to the app." />
        </Card.Content>
      </Card>

      <Button mode="contained" loading={isCheckingPermission} style={styles.primaryButton} onPress={onOpenSettings}>
        Open Settings
      </Button>
      <Button mode="text" loading={isCheckingPermission} textColor={colors.cyanSoft} onPress={onEnabled}>
        I have enabled it
      </Button>
    </View>
  );
}

function SuccessScreen({ onDone, selectedCount }: { onDone: () => void; selectedCount: number }) {
  return (
    <View style={styles.screenBlock}>
      <View style={styles.permissionShield}>
        <MaterialCommunityIcons name="shield-check-outline" color={colors.green} size={96} />
      </View>
      <Text style={styles.mainTitle}>All set!</Text>
      <Text style={styles.centerCopy}>
        WaterFirst will now protect the {selectedCount === 1 ? 'app' : 'apps'} you selected.
      </Text>

      <Card mode="contained" style={styles.explainCard}>
        <Card.Content style={styles.explainContent}>
          <ExplainRow icon="check-circle-outline" tone="success" copy="We only use this permission to detect the selected apps." />
          <ExplainRow icon="lock-outline" tone="success" copy="Your data stays private and never leaves your phone." />
          <ExplainRow icon="shield-check-outline" tone="success" copy="You're in control. You can turn it off anytime." />
        </Card.Content>
      </Card>

      <Button mode="contained" style={styles.primaryButton} onPress={onDone}>
        Done
      </Button>
      <Button mode="text" textColor={colors.cyanSoft} onPress={() => router.replace('/(tabs)' as never)}>
        Learn more about Hydration Shield
      </Button>
    </View>
  );
}

function ExplainRow({
  copy,
  icon,
  tone = 'default',
}: {
  copy: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  tone?: 'default' | 'success';
}) {
  return (
    <View style={styles.explainRow}>
      <View style={[styles.explainIcon, tone === 'success' && styles.successIcon]}>
        <MaterialCommunityIcons
          name={icon}
          color={tone === 'success' ? colors.green : colors.cyan}
          size={20}
        />
      </View>
      <Text style={styles.explainCopy}>{copy}</Text>
    </View>
  );
}

function InstructionStep({ copy, step }: { copy: string; step: string }) {
  return (
    <View style={styles.instructionStep}>
      <View style={styles.stepDot}>
        <Text style={styles.stepText}>{step}</Text>
      </View>
      <Text style={styles.instructionCopy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  headerTitle: {
    color: colors.text,
    ...typography.h1,
  },
  screenBlock: {
    gap: spacing.lg,
  },
  appEmptyMark: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: 112,
    height: 112,
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 2,
    backgroundColor: 'rgba(10, 36, 55, 0.66)',
  },
  appEmptyBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: -10,
    bottom: 6,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(20, 125, 255, 0.34)',
  },
  mainTitle: {
    color: colors.text,
    ...typography.h1,
    textAlign: 'center',
  },
  centerCopy: {
    alignSelf: 'center',
    color: colors.muted,
    ...typography.body1,
    maxWidth: 276,
    textAlign: 'center',
  },
  explainCard: {
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  explainContent: {
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.h2,
  },
  explainRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  explainIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(20, 125, 255, 0.18)',
  },
  successIcon: {
    backgroundColor: 'rgba(52, 232, 154, 0.12)',
  },
  explainCopy: {
    color: colors.muted,
    ...typography.body1,
    flex: 1,
  },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: colors.blue,
  },
  copyBlock: {
    alignSelf: 'center',
    gap: spacing.sm,
    maxWidth: 292,
  },
  setupTitle: {
    color: colors.text,
    ...typography.h1,
    textAlign: 'center',
  },
  privacyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  smallCopy: {
    color: colors.muted,
    ...typography.body2,
  },
  search: {
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(10, 36, 55, 0.76)',
  },
  searchInput: {
    color: colors.text,
    ...typography.body1,
    minHeight: 0,
  },
  appSection: {
    gap: spacing.sm,
  },
  appList: {
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(8, 31, 49, 0.74)',
  },
  appRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowPressed: {
    backgroundColor: 'rgba(32, 199, 255, 0.08)',
  },
  appIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(3, 16, 28, 0.74)',
  },
  appText: {
    flex: 1,
  },
  appName: {
    color: colors.text,
    ...typography.body1,
  },
  checkBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderColor: colors.faint,
    borderRadius: 6,
    borderWidth: 1,
  },
  checkBoxSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blue,
  },
  permissionShield: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: 128,
    minWidth: 128,
  },
  instructionCard: {
    borderColor: 'rgba(255, 104, 104, 0.24)',
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 104, 104, 0.07)',
  },
  dangerTitle: {
    color: colors.coral,
    ...typography.h2,
  },
  instructionStep: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepDot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(155, 179, 196, 0.18)',
  },
  stepText: {
    color: colors.muted,
    ...typography.body2,
  },
  instructionCopy: {
    color: colors.muted,
    ...typography.body1,
    flex: 1,
  },
  settingsPreview: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(3, 16, 28, 0.46)',
  },
  settingsIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 125, 255, 0.18)',
  },
  settingsLabel: {
    color: colors.text,
    ...typography.h2,
    flex: 1,
  },
  settingsOff: {
    color: colors.muted,
    ...typography.body2,
  },
});
