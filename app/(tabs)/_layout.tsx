import { SymbolView } from 'expo-symbols';
import { Redirect, Tabs } from 'expo-router';

import {
  bottomNavigationColors,
  bottomNavigationStyle,
} from '@/src/components/dashboard/BottomNavigation';
import { useProfileStore } from '@/src/store/profileStore';
import { hydraLockTheme } from '@/src/theme/paperTheme';

export default function TabLayout() {
  const onboardingComplete = useProfileStore((state) => state.profile.onboardingComplete);

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: bottomNavigationColors.active,
        tabBarInactiveTintColor: bottomNavigationColors.inactive,
        tabBarStyle: bottomNavigationStyle,
        headerShown: false,
        headerStyle: { backgroundColor: '#061B2E' },
        headerTintColor: hydraLockTheme.colors.onSurface,
        headerTitleStyle: { fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
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
        name="challenges"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'target',
                android: 'emoji_events',
                web: 'emoji_events',
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'person.crop.circle.fill',
                android: 'person',
                web: 'person',
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
