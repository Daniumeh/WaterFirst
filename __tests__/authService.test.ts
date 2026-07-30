const mockResetPasswordForEmail = jest.fn(async () => ({ error: null }));
const mockCreateURL = jest.fn(() => 'waterfirst://reset-password');

jest.mock('@/src/lib/supabase', () => ({
  hasSupabaseConfig: true,
  supabase: {
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  },
}));

jest.mock('expo-linking', () => ({
  createURL: mockCreateURL,
}));

const { requestPasswordReset } = require('@/src/features/auth/authService');

describe('authService password reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL;
  });

  it('sends a reset password email with the app reset screen redirect', async () => {
    await requestPasswordReset('lebe@example.com');

    expect(mockCreateURL).toHaveBeenCalledWith('reset-password');
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('lebe@example.com', {
      redirectTo: 'waterfirst://reset-password',
    });
  });

  it('uses the configured reset redirect URL when provided', async () => {
    process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL =
      'https://waterfirst.vercel.app/reset-password';

    await requestPasswordReset('lebe@example.com');

    expect(mockCreateURL).not.toHaveBeenCalled();
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('lebe@example.com', {
      redirectTo: 'https://waterfirst.vercel.app/reset-password',
    });
  });
});
