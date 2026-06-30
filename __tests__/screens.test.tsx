import { fireEvent, render } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';

import HistoryScreen from '@/app/(tabs)/history';
import ForgotPasswordScreen from '@/app/forgot-password';
import TodayScreen from '@/app/(tabs)/index';
import OnboardingScreen from '@/app/onboarding';
import ResetPasswordScreen from '@/app/reset-password';
import SignInScreen from '@/app/sign-in';
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

  it('renders sign in fields', async () => {
    const view = await renderWithTheme(<SignInScreen />);

    expect(view.getAllByText('Sign in').length).toBeGreaterThan(0);
    expect(view.getByText('HydraLock account')).toBeTruthy();
    expect(view.getByText('Forgot password?')).toBeTruthy();
  });

  it('renders forgot password flow', async () => {
    const view = await renderWithTheme(<ForgotPasswordScreen />);

    expect(view.getByText('Reset your password')).toBeTruthy();
    expect(view.getByText('Send reset link')).toBeTruthy();
  });

  it('renders reset password flow', async () => {
    const view = await renderWithTheme(<ResetPasswordScreen />);

    expect(view.getByText('Create new password')).toBeTruthy();
    expect(view.getByText('Update password')).toBeTruthy();
  });

  it('renders history calendar summary', async () => {
    const view = await renderWithTheme(<HistoryScreen />);

    expect(view.getByText('History')).toBeTruthy();
    expect(view.getByText('Daily summary')).toBeTruthy();
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
