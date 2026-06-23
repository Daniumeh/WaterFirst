import { SymbolView } from 'expo-symbols';
import { Redirect, Tabs } from 'expo-router';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useProfileStore } from '@/src/store/profileStore';
import { hydraLockTheme } from '@/src/theme/paperTheme';

export default function TabLayout() {
  const onboardingComplete = useProfileStore((state) => state.profile.onboardingComplete);
  const headerShown = useClientOnlyValue(false, true);

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: hydraLockTheme.colors.primary,
        tabBarInactiveTintColor: hydraLockTheme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: '#071827',
          borderTopColor: '#14344A',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown,
        headerStyle: { backgroundColor: '#061B2E' },
        headerTintColor: hydraLockTheme.colors.onSurface,
        headerTitleStyle: { fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'drop.fill',
                android: 'water_drop',
                web: 'water_drop',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'chart.bar.fill',
                android: 'bar_chart',
                web: 'bar_chart',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'bell.fill',
                android: 'notifications',
                web: 'notifications',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'gearshape.fill',
                android: 'settings',
                web: 'settings',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
