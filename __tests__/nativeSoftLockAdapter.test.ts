type NativeSoftLockMocks = {
  requestAuthorization: jest.Mock;
  isAccessibilityServiceEnabled: jest.Mock;
  openAccessibilitySettings: jest.Mock;
  getStatus: jest.Mock;
  getLastDetectedPackageForDebug: jest.Mock;
};

let nativeMocks: NativeSoftLockMocks;

function createNativeMocks(): NativeSoftLockMocks {
  return {
    requestAuthorization: jest.fn(async () => 'notDetermined'),
    isAccessibilityServiceEnabled: jest.fn(async () => false),
    openAccessibilitySettings: jest.fn(async () => undefined),
    getStatus: jest.fn(async () => ({
      supported: true,
      authorizationStatus: 'notDetermined',
      isActive: false,
      selectedApplicationCount: 0,
      activeSessionId: null,
    })),
    getLastDetectedPackageForDebug: jest.fn(async () => null),
  };
}

function loadAdapter(os: 'android' | 'ios' | 'web') {
  jest.resetModules();
  nativeMocks = createNativeMocks();

  jest.doMock('expo-constants', () => ({
    __esModule: true,
    default: {
      appOwnership: 'standalone',
    },
  }));
  jest.doMock('react-native', () => ({
    Platform: {
      OS: os,
    },
  }));
  jest.doMock('waterfirst-soft-lock', () => ({
    ...nativeMocks,
    softLockPreviewMessage: 'Soft Lock preview is available here.',
  }));

  return require('@/src/features/accountability/nativeSoftLockAdapter');
}

describe('native soft lock adapter accessibility foundation', () => {
  afterEach(() => {
    jest.dontMock('expo-constants');
    jest.dontMock('react-native');
    jest.dontMock('waterfirst-soft-lock');
    jest.resetModules();
  });

  it('reports Android native status as supported', async () => {
    const adapter = loadAdapter('android');

    nativeMocks.getStatus.mockResolvedValueOnce({
      supported: true,
      authorizationStatus: 'approved',
      isActive: false,
      selectedApplicationCount: 0,
      activeSessionId: null,
    });

    await expect(adapter.getSoftLockStatus()).resolves.toMatchObject({
      supported: true,
      authorizationStatus: 'approved',
      runtime: 'androidPreview',
    });
  });

  it('returns false when the Android Accessibility Service is disabled', async () => {
    const adapter = loadAdapter('android');

    nativeMocks.isAccessibilityServiceEnabled.mockResolvedValueOnce(false);

    await expect(adapter.isAccessibilityServiceEnabled()).resolves.toBe(false);
  });

  it('returns true when the Android Accessibility Service is enabled', async () => {
    const adapter = loadAdapter('android');

    nativeMocks.isAccessibilityServiceEnabled.mockResolvedValueOnce(true);

    await expect(adapter.isAccessibilityServiceEnabled()).resolves.toBe(true);
  });

  it('returns approved authorization on Android without falling back to unsupported', async () => {
    const adapter = loadAdapter('android');

    nativeMocks.requestAuthorization.mockResolvedValueOnce('approved');

    await expect(adapter.requestSoftLockAuthorization()).resolves.toBe('approved');
    expect(nativeMocks.requestAuthorization).toHaveBeenCalledTimes(1);
  });

  it('reflects actual authorization status from Android getStatus', async () => {
    const adapter = loadAdapter('android');

    nativeMocks.getStatus.mockResolvedValueOnce({
      supported: true,
      authorizationStatus: 'denied',
      isActive: false,
      selectedApplicationCount: 0,
      activeSessionId: null,
    });

    await expect(adapter.getSoftLockStatus()).resolves.toMatchObject({
      supported: true,
      authorizationStatus: 'denied',
      runtime: 'androidPreview',
    });
  });

  it('opens Android Accessibility Settings through the native method', async () => {
    const adapter = loadAdapter('android');

    await expect(adapter.openAccessibilitySettings()).resolves.toBeUndefined();
    expect(nativeMocks.openAccessibilitySettings).toHaveBeenCalledTimes(1);
  });

  it('returns the debug foreground package from Android native code', async () => {
    const adapter = loadAdapter('android');

    nativeMocks.getLastDetectedPackageForDebug.mockResolvedValueOnce('com.example.app');

    await expect(adapter.getLastDetectedPackageForDebug()).resolves.toBe('com.example.app');
  });

  it('stays safe on web without calling native methods', async () => {
    const adapter = loadAdapter('web');

    await expect(adapter.getSoftLockStatus()).resolves.toMatchObject({
      supported: false,
      authorizationStatus: 'unsupported',
      runtime: 'webPreview',
    });
    await expect(adapter.isAccessibilityServiceEnabled()).resolves.toBe(false);
    await expect(adapter.getLastDetectedPackageForDebug()).resolves.toBeNull();
    await expect(adapter.openAccessibilitySettings()).rejects.toThrow();
    expect(nativeMocks.getStatus).not.toHaveBeenCalled();
  });

  it('keeps iOS authorization behavior routed through the native module', async () => {
    const adapter = loadAdapter('ios');

    nativeMocks.requestAuthorization.mockResolvedValueOnce('notDetermined');

    await expect(adapter.requestSoftLockAuthorization()).resolves.toBe('notDetermined');
    expect(nativeMocks.requestAuthorization).toHaveBeenCalledTimes(1);
    await expect(adapter.isAccessibilityServiceEnabled()).resolves.toBe(false);
  });
});
