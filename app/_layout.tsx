import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import 'react-native-reanimated';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppScreen } from '@/src/components/layout/AppScreen';
import { AuthProvider } from '@/src/features/auth/AuthProvider';
import { configureNotificationPresentation } from '@/src/features/reminders/reminderService';
import { waterFirstTheme } from '@/src/theme/paperTheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

configureNotificationPresentation();

export default function RootLayout() {
  const [fontLoadTimedOut, setFontLoadTimedOut] = useState(false);
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    const timeout = setTimeout(() => setFontLoadTimedOut(true), 3000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (loaded || fontLoadTimedOut) {
      SplashScreen.hideAsync();
    }
  }, [fontLoadTimedOut, loaded]);

  if (!loaded && !fontLoadTimedOut) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider
          theme={waterFirstTheme}
          settings={{
            icon: (props) => <MaterialCommunityIcons {...props} />,
          }}
        >
          <AuthProvider>
            <AppScreen>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="create-account" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                <Stack.Screen name="reset-password" options={{ headerShown: false }} />
                <Stack.Screen name="hydration-shield" options={{ headerShown: false }} />
                <Stack.Screen
                  name="soft-lock"
                  options={{ title: 'WaterFirst', presentation: 'modal' }}
                />
              </Stack>
            </AppScreen>
          </AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
