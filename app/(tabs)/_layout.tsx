import { Redirect, Tabs } from 'expo-router';

import { DashboardIcon, dashboardIcons } from '@/src/components/dashboard/DashboardIcon';
import {
  bottomNavigationColors,
  bottomNavigationStyle,
} from '@/src/components/dashboard/BottomNavigation';
import { useProfileStore } from '@/src/store/profileStore';
import { hydraLockTheme } from '@/src/theme/paperTheme';
import { typography } from '@/src/theme/tokens';

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
        headerTitleStyle: typography.h1,
        tabBarLabelStyle: typography.body2,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <DashboardIcon name={dashboardIcons.home} color={color} size={25} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <DashboardIcon name={dashboardIcons.history} color={color} size={25} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <DashboardIcon name={dashboardIcons.profile} color={color} size={25} />
          ),
        }}
      />
    </Tabs>
  );
}
