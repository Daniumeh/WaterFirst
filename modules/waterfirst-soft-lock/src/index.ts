import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type SoftLockAuthorizationStatus =
  | 'notDetermined'
  | 'approved'
  | 'denied'
  | 'unsupported'
  | 'unknown';

export type SoftLockNativeStatus = {
  supported: boolean;
  authorizationStatus: SoftLockAuthorizationStatus;
  isActive: boolean;
  selectedApplicationCount: number;
  activeSessionId: string | null;
};

export type ActivateSoftLockInput = {
  sessionId: string;
  requiredAmountCl: number;
  activatedAt: string;
};

export type DeactivateSoftLockInput = {
  sessionId: string;
  reason: 'water_logged' | 'skip' | 'expired' | 'disabled' | 'emergency';
};

type WaterfirstSoftLockModule = {
  requestAuthorization(): Promise<SoftLockAuthorizationStatus>;
  isAccessibilityServiceEnabled(): Promise<boolean>;
  openAccessibilitySettings(): Promise<void>;
  presentApplicationPicker(): Promise<{ selectedApplicationCount: number }>;
  activateSoftLock(input: ActivateSoftLockInput): Promise<void>;
  deactivateSoftLock(input: DeactivateSoftLockInput): Promise<void>;
  getStatus(): Promise<SoftLockNativeStatus>;
  getLastDetectedPackageForDebug(): Promise<string | null>;
  clearApplicationSelection(): Promise<void>;
};

const unsupportedStatus: SoftLockNativeStatus = {
  supported: false,
  authorizationStatus: 'unsupported',
  isActive: false,
  selectedApplicationCount: 0,
  activeSessionId: null,
};

let nativeModule: WaterfirstSoftLockModule | null = null;

function getNativeModule() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }

  if (!nativeModule) {
    try {
      nativeModule = requireNativeModule<WaterfirstSoftLockModule>('WaterfirstSoftLock');
    } catch {
      nativeModule = null;
    }
  }

  return nativeModule;
}

function assertNonEmptyString(value: string, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }
}

function assertValidActivationInput(input: ActivateSoftLockInput) {
  assertNonEmptyString(input.sessionId, 'sessionId');
  assertNonEmptyString(input.activatedAt, 'activatedAt');

  if (!Number.isFinite(input.requiredAmountCl) || input.requiredAmountCl <= 0) {
    throw new Error('requiredAmountCl must be greater than 0.');
  }
}

function assertValidDeactivationInput(input: DeactivateSoftLockInput) {
  assertNonEmptyString(input.sessionId, 'sessionId');

  const validReasons: DeactivateSoftLockInput['reason'][] = [
    'water_logged',
    'skip',
    'expired',
    'disabled',
    'emergency',
  ];

  if (!validReasons.includes(input.reason)) {
    throw new Error(`Unsupported deactivation reason: ${input.reason}`);
  }
}

function unsupportedError() {
  return new Error(
    'Native Soft Lock is unavailable in this runtime. Use a Waterfirst Expo development build with the native module.',
  );
}

export async function requestAuthorization() {
  const module = getNativeModule();

  if (!module) {
    return 'unsupported' satisfies SoftLockAuthorizationStatus;
  }

  return module.requestAuthorization();
}

export async function isAccessibilityServiceEnabled() {
  const module = getNativeModule();

  if (!module) {
    return false;
  }

  return module.isAccessibilityServiceEnabled();
}

export async function openAccessibilitySettings() {
  const module = getNativeModule();

  if (!module) {
    throw unsupportedError();
  }

  return module.openAccessibilitySettings();
}

export async function presentApplicationPicker() {
  const module = getNativeModule();

  if (!module) {
    throw unsupportedError();
  }

  return module.presentApplicationPicker();
}

export async function activateSoftLock(input: ActivateSoftLockInput) {
  assertValidActivationInput(input);
  const module = getNativeModule();

  if (!module) {
    throw unsupportedError();
  }

  return module.activateSoftLock(input);
}

export async function deactivateSoftLock(input: DeactivateSoftLockInput) {
  assertValidDeactivationInput(input);
  const module = getNativeModule();

  if (!module) {
    throw unsupportedError();
  }

  return module.deactivateSoftLock(input);
}

export async function getStatus() {
  const module = getNativeModule();

  if (!module) {
    return unsupportedStatus;
  }

  return module.getStatus();
}

export async function getLastDetectedPackageForDebug() {
  const module = getNativeModule();

  if (!module) {
    return null;
  }

  return module.getLastDetectedPackageForDebug();
}

export async function clearApplicationSelection() {
  const module = getNativeModule();

  if (!module) {
    throw unsupportedError();
  }

  return module.clearApplicationSelection();
}

export const softLockPreviewMessage =
  'Soft Lock preview is available here. Actual app blocking requires the Waterfirst mobile app.';
