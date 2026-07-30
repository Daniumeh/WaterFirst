import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  activateSoftLock as activateNativeSoftLock,
  clearApplicationSelection as clearNativeApplicationSelection,
  deactivateSoftLock as deactivateNativeSoftLock,
  getLastDetectedPackageForDebug as getNativeLastDetectedPackageForDebug,
  getStatus as getNativeSoftLockStatus,
  isAccessibilityServiceEnabled as isNativeAccessibilityServiceEnabled,
  openAccessibilitySettings as openNativeAccessibilitySettings,
  presentApplicationPicker as presentNativeApplicationPicker,
  requestAuthorization as requestNativeAuthorization,
  softLockPreviewMessage,
  type ActivateSoftLockInput,
  type DeactivateSoftLockInput,
  type SoftLockAuthorizationStatus,
  type SoftLockNativeStatus,
} from 'waterfirst-soft-lock';

export type SoftLockRuntime = 'iosNative' | 'androidPreview' | 'webPreview' | 'expoGoUnsupported';

export type SoftLockAdapterStatus = SoftLockNativeStatus & {
  message?: string;
  runtime: SoftLockRuntime;
};

function getRuntime(): SoftLockRuntime {
  if (Constants.appOwnership === 'expo') {
    return 'expoGoUnsupported';
  }

  if (Platform.OS === 'ios') {
    return 'iosNative';
  }

  if (Platform.OS === 'web') {
    return 'webPreview';
  }

  return 'androidPreview';
}

function unsupportedStatus(runtime: SoftLockRuntime): SoftLockAdapterStatus {
  return {
    supported: false,
    authorizationStatus: 'unsupported',
    isActive: false,
    selectedApplicationCount: 0,
    activeSessionId: null,
    runtime,
    message:
      runtime === 'webPreview'
        ? softLockPreviewMessage
        : 'Actual app blocking requires a Waterfirst native development build. Android currently runs Soft Lock in preview mode without restricting other apps.',
  };
}

export async function getSoftLockStatus(): Promise<SoftLockAdapterStatus> {
  const runtime = getRuntime();

  if (runtime !== 'iosNative' && runtime !== 'androidPreview') {
    return unsupportedStatus(runtime);
  }

  const status = await getNativeSoftLockStatus();

  return {
    ...status,
    runtime,
  };
}

export async function requestSoftLockAuthorization(): Promise<SoftLockAuthorizationStatus> {
  const runtime = getRuntime();

  if (runtime !== 'iosNative' && runtime !== 'androidPreview') {
    return 'unsupported';
  }

  return requestNativeAuthorization();
}

export async function isAccessibilityServiceEnabled() {
  const runtime = getRuntime();

  if (runtime !== 'androidPreview') {
    return false;
  }

  return isNativeAccessibilityServiceEnabled();
}

export async function openAccessibilitySettings() {
  const runtime = getRuntime();

  if (runtime !== 'androidPreview') {
    throw new Error(
      runtime === 'iosNative'
        ? 'Android Accessibility Settings are not available on iOS.'
        : unsupportedStatus(runtime).message,
    );
  }

  return openNativeAccessibilitySettings();
}

export async function getLastDetectedPackageForDebug() {
  const runtime = getRuntime();

  if (runtime !== 'androidPreview') {
    return null;
  }

  return getNativeLastDetectedPackageForDebug();
}

export async function presentSoftLockApplicationPicker() {
  const runtime = getRuntime();

  if (runtime === 'androidPreview') {
    throw new Error(
      'Android app selection is not available yet. Waterfirst Android uses preview mode and does not restrict external apps.',
    );
  }

  if (runtime !== 'iosNative') {
    throw new Error(unsupportedStatus(runtime).message);
  }

  return presentNativeApplicationPicker();
}

export async function activateSoftLock(input: ActivateSoftLockInput) {
  const runtime = getRuntime();

  if (runtime !== 'iosNative' && runtime !== 'androidPreview') {
    throw new Error(unsupportedStatus(runtime).message);
  }

  return activateNativeSoftLock(input);
}

export async function deactivateSoftLock(input: DeactivateSoftLockInput) {
  const runtime = getRuntime();

  if (runtime !== 'iosNative' && runtime !== 'androidPreview') {
    return;
  }

  return deactivateNativeSoftLock(input);
}

export async function clearSoftLockApplicationSelection() {
  const runtime = getRuntime();

  if (runtime !== 'iosNative' && runtime !== 'androidPreview') {
    return;
  }

  return clearNativeApplicationSelection();
}
