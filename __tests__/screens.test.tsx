import { fireEvent, render } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';

import TodayScreen from '@/app/(tabs)/index';
import OnboardingScreen from '@/app/onboarding';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useProfileStore } from '@/src/store/profileStore';
import { hydraLockTheme } from '@/src/theme/paperTheme';

function renderWithTheme(children: React.ReactElement) {
  return render(<PaperProvider theme={hydraLockTheme}>{children}</PaperProvider>);
}

describe('HydraLock screens', () => {
  beforeEach(() => {
    useHydrationStore.setState({
      logs: [],
      progress: {
        loggedMl: 0,
        remainingMl: 2850,
        percentComplete: 0,
      },
    });
    useProfileStore.setState({
      profile: {
        name: '',
        firstName: '',
        lastName: '',
        email: '',
        weight: 180,
        activityLevel: 'moderate',
        activityDescription: '',
        climate: 'temperate',
        wakeTime: '07:00',
        sleepTime: '22:30',
        unitPreference: 'imperial',
        notificationConsent: false,
        softLockConsent: false,
        onboardingComplete: false,
      },
    });
  });

  it('renders onboarding fields', async () => {
    const view = await renderWithTheme(<OnboardingScreen />);

    expect(view.getByText('HydraLock')).toBeTruthy();
    expect(view.getByText('Create your WaterFirst profile')).toBeTruthy();
  });

  it('logs a preset amount from the today screen', async () => {
    useProfileStore.setState((state) => ({
      profile: { ...state.profile, name: 'Avery', onboardingComplete: true },
    }));
    const view = await renderWithTheme(<TodayScreen />);

    await fireEvent.press(view.getByText('+25cl'));

    expect(view.getByText('25cl / 285cl')).toBeTruthy();
  });
});
