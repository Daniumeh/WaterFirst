import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardIcon, dashboardIcons } from '@/src/components/dashboard/DashboardIcon';
import {
  bottomNavigationColors,
  bottomNavigationStyle,
} from '@/src/components/dashboard/BottomNavigation';
import { useProfileStore } from '@/src/store/profileStore';
import { waterFirstTheme } from '@/src/theme/paperTheme';
import { colors, typography } from '@/src/theme/tokens';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const onboardingComplete = useProfileStore((state) => state.profile.onboardingComplete);
  const tabBarBottomPadding = Math.max(insets.bottom, 10);
  const tabBarHeight = 72 + tabBarBottomPadding;

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: bottomNavigationColors.active,
        tabBarInactiveTintColor: bottomNavigationColors.inactive,
        tabBarStyle: [
          bottomNavigationStyle,
          {
            bottom: 0,
            height: tabBarHeight,
            left: 0,
            paddingBottom: tabBarBottomPadding,
            position: 'absolute',
            right: 0,
          },
        ],
        headerShown: false,
        headerStyle: { backgroundColor: '#061B2E' },
        headerTintColor: waterFirstTheme.colors.onSurface,
        headerTitleStyle: typography.h1,
        sceneStyle: styles.scene,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
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

const styles = StyleSheet.create({
  scene: {
    backgroundColor: colors.ink,
  },
  tabBarBackground: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'rgba(5, 24, 39, 0.98)',
  },
});
