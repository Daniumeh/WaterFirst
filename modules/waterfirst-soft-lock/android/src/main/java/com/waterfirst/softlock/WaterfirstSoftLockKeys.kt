package com.waterfirst.softlock

internal object WaterfirstSoftLockKeys {
  const val preferencesName = "waterfirst_soft_lock"
  const val activeSessionIdKey = "activeSessionId"
  const val activatedAtKey = "activatedAt"
  const val requiredAmountClKey = "requiredAmountCl"
  const val isActiveKey = "isActive"
  const val softLockEnabledKey = "softLockEnabled"
  const val protectedPackageNamesKey = "protectedPackageNames"
  const val checkpointScheduleJsonKey = "checkpointScheduleJson"
  const val loggedMlKey = "loggedMl"
  const val loggedDateKey = "loggedDate"
  const val snoozedUntilEpochMillisKey = "snoozedUntilEpochMillis"
  const val nativeSkipDateKey = "nativeSkipDate"
  const val nativeSkipCountKey = "nativeSkipCount"
  const val accessibilitySettingsOpenedKey = "accessibilitySettingsOpened"
  const val accessibilityEverApprovedKey = "accessibilityEverApproved"
  const val lastDetectedPackageKey = "lastDetectedPackageForDebug"
  const val lastBlockedPackageKey = "lastBlockedPackageForDebug"
  const val lastBlockLaunchedAtKey = "lastBlockLaunchedAt"
}
