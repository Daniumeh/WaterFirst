package com.waterfirst.softlock

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray

class WaterfirstSoftLockModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WaterfirstSoftLock")

    AsyncFunction("requestAuthorization") {
      resolveAuthorizationStatus()
    }

    AsyncFunction("isAccessibilityServiceEnabled") {
      isAccessibilityServiceEnabled()
    }

    AsyncFunction("openAccessibilitySettings") {
      openAccessibilitySettings()
    }

    AsyncFunction("presentApplicationPicker") {
      throw UnsupportedOperationException("Android app shielding is not implemented. Waterfirst uses preview mode until a policy-reviewed Android adapter is added.")
    }

    AsyncFunction("activateSoftLock") { input: Map<String, Any> ->
      val sessionId = requireString(input, "sessionId")
      val requiredAmountCl = requirePositiveInt(input, "requiredAmountCl")
      val activatedAt = requireString(input, "activatedAt")
      val protectedPackageNames = optionalStringList(input, "protectedPackageNames")

      if (!activatedAt.contains("T")) {
        throw IllegalArgumentException("activatedAt must be an ISO timestamp.")
      }

      val preferences = preferences()
      val activeSessionId = preferences.getString(WaterfirstSoftLockKeys.activeSessionIdKey, null)

      if (preferences.getBoolean(WaterfirstSoftLockKeys.isActiveKey, false) && activeSessionId == sessionId) {
        return@AsyncFunction
      }

      preferences.edit()
        .putString(WaterfirstSoftLockKeys.activeSessionIdKey, sessionId)
        .putString(WaterfirstSoftLockKeys.activatedAtKey, activatedAt)
        .putInt(WaterfirstSoftLockKeys.requiredAmountClKey, requiredAmountCl)
        .putBoolean(WaterfirstSoftLockKeys.isActiveKey, true)
        .apply {
          if (protectedPackageNames != null) {
            putStringSet(WaterfirstSoftLockKeys.protectedPackageNamesKey, protectedPackageNames.toSet())
          }
        }
        .apply()
    }

    AsyncFunction("deactivateSoftLock") { input: Map<String, Any> ->
      val sessionId = requireString(input, "sessionId")
      val preferences = preferences()
      val activeSessionId = preferences.getString(WaterfirstSoftLockKeys.activeSessionIdKey, null)

      if (!preferences.getBoolean(WaterfirstSoftLockKeys.isActiveKey, false)) {
        return@AsyncFunction
      }

      if (activeSessionId != sessionId) {
        throw IllegalArgumentException("The requested Soft Lock session does not match the active Android preview session.")
      }

      preferences.edit()
        .remove(WaterfirstSoftLockKeys.activeSessionIdKey)
        .remove(WaterfirstSoftLockKeys.activatedAtKey)
        .remove(WaterfirstSoftLockKeys.requiredAmountClKey)
        .putBoolean(WaterfirstSoftLockKeys.isActiveKey, false)
        .apply()
    }

    AsyncFunction("syncSoftLockState") { input: Map<String, Any> ->
      val protectedPackageNames = requireStringList(input, "protectedPackageNames")
      val checkpointScheduleJson = requireString(input, "checkpointScheduleJson")
      val loggedMl = requireNonNegativeInt(input, "loggedMl")
      val loggedDate = requireString(input, "loggedDate")
      val enabled = input["enabled"] as? Boolean ?: false
      val snoozedUntilEpochMillis = requireNonNegativeLong(input, "snoozedUntilEpochMillis")

      val preferences = preferences()

      preferences.edit()
        .putBoolean(WaterfirstSoftLockKeys.softLockEnabledKey, enabled)
        .putStringSet(WaterfirstSoftLockKeys.protectedPackageNamesKey, protectedPackageNames.toSet())
        .putString(WaterfirstSoftLockKeys.checkpointScheduleJsonKey, checkpointScheduleJson)
        .putInt(WaterfirstSoftLockKeys.loggedMlKey, loggedMl)
        .putString(WaterfirstSoftLockKeys.loggedDateKey, loggedDate)
        .putLong(WaterfirstSoftLockKeys.snoozedUntilEpochMillisKey, snoozedUntilEpochMillis)
        .apply()

      clearSatisfiedActiveSession(preferences, checkpointScheduleJson, loggedMl)
    }

    AsyncFunction("getStatus") {
      val preferences = preferences()

      mapOf(
        "supported" to true,
        "authorizationStatus" to resolveAuthorizationStatus(),
        "isActive" to preferences.getBoolean(WaterfirstSoftLockKeys.isActiveKey, false),
        "selectedApplicationCount" to preferences.getStringSet(
          WaterfirstSoftLockKeys.protectedPackageNamesKey,
          emptySet()
        ).orEmpty().size,
        "activeSessionId" to preferences.getString(WaterfirstSoftLockKeys.activeSessionIdKey, null),
        "requiredAmountCl" to preferences.getInt(WaterfirstSoftLockKeys.requiredAmountClKey, 0)
      )
    }

    AsyncFunction("getLastDetectedPackageForDebug") {
      preferences().getString(WaterfirstSoftLockKeys.lastDetectedPackageKey, null)
    }

    AsyncFunction("clearApplicationSelection") {
      preferences().edit()
        .remove(WaterfirstSoftLockKeys.protectedPackageNamesKey)
        .apply()
    }
  }

  private fun preferences() =
    context().getSharedPreferences(WaterfirstSoftLockKeys.preferencesName, Context.MODE_PRIVATE)

  private fun context(): Context =
    requireNotNull(appContext.reactContext) { "Android context is unavailable." }

  private fun isAccessibilityServiceEnabled(): Boolean {
    val context = context()
    val expectedComponent = ComponentName(context, WaterfirstAccessibilityService::class.java)
    val enabledServices = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    ) ?: return false
    val splitter = TextUtils.SimpleStringSplitter(':')
    splitter.setString(enabledServices)

    while (splitter.hasNext()) {
      val enabledComponent = ComponentName.unflattenFromString(splitter.next())

      if (
        enabledComponent?.packageName == expectedComponent.packageName &&
        enabledComponent.className == expectedComponent.className
      ) {
        return true
      }
    }

    return false
  }

  private fun openAccessibilitySettings() {
    val context = context()

    preferences()
      .edit()
      .putBoolean(WaterfirstSoftLockKeys.accessibilitySettingsOpenedKey, true)
      .apply()

    try {
      context.startActivity(
        Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    } catch (error: Exception) {
      throw IllegalStateException("Waterfirst could not open Android Accessibility Settings.", error)
    }
  }

  private fun clearSatisfiedActiveSession(
    preferences: android.content.SharedPreferences,
    checkpointScheduleJson: String,
    loggedMl: Int
  ) {
    if (!preferences.getBoolean(WaterfirstSoftLockKeys.isActiveKey, false)) {
      return
    }

    val activeSessionId = preferences.getString(WaterfirstSoftLockKeys.activeSessionIdKey, null)
      ?: return
    val activeTargetMl = getCheckpointTargetMl(checkpointScheduleJson, activeSessionId)
      ?: return

    if (loggedMl < activeTargetMl) {
      return
    }

    preferences.edit()
      .remove(WaterfirstSoftLockKeys.activeSessionIdKey)
      .remove(WaterfirstSoftLockKeys.activatedAtKey)
      .remove(WaterfirstSoftLockKeys.requiredAmountClKey)
      .putBoolean(WaterfirstSoftLockKeys.isActiveKey, false)
      .apply()
  }

  private fun getCheckpointTargetMl(checkpointScheduleJson: String, checkpointId: String): Int? {
    return try {
      val checkpoints = JSONArray(checkpointScheduleJson)

      for (index in 0 until checkpoints.length()) {
        val checkpoint = checkpoints.optJSONObject(index) ?: continue

        if (checkpoint.optString("id") == checkpointId) {
          return checkpoint.optInt("targetMl", -1).takeIf { it >= 0 }
        }
      }

      null
    } catch (_: Exception) {
      null
    }
  }

  private fun resolveAuthorizationStatus(): String {
    return try {
      val enabled = isAccessibilityServiceEnabled()
      val preferences = preferences()

      if (enabled) {
        preferences.edit()
          .putBoolean(WaterfirstSoftLockKeys.accessibilityEverApprovedKey, true)
          .apply()

        "approved"
      } else if (
        preferences.getBoolean(WaterfirstSoftLockKeys.accessibilityEverApprovedKey, false) ||
        preferences.getBoolean(WaterfirstSoftLockKeys.accessibilitySettingsOpenedKey, false)
      ) {
        "denied"
      } else {
        "notDetermined"
      }
    } catch (_: Exception) {
      "unknown"
    }
  }

  private fun requireString(input: Map<String, Any>, fieldName: String): String {
    val value = input[fieldName] as? String

    if (value.isNullOrBlank()) {
      throw IllegalArgumentException("$fieldName is required.")
    }

    return value
  }

  private fun requirePositiveInt(input: Map<String, Any>, fieldName: String): Int {
    val value = when (val rawValue = input[fieldName]) {
      is Int -> rawValue
      is Double -> rawValue.toInt()
      is Float -> rawValue.toInt()
      is Number -> rawValue.toInt()
      else -> null
    }

    if (value == null || value <= 0) {
      throw IllegalArgumentException("$fieldName must be greater than 0.")
    }

    return value
  }

  private fun requireNonNegativeInt(input: Map<String, Any>, fieldName: String): Int {
    val value = when (val rawValue = input[fieldName]) {
      is Int -> rawValue
      is Double -> rawValue.toInt()
      is Float -> rawValue.toInt()
      is Number -> rawValue.toInt()
      else -> null
    }

    if (value == null || value < 0) {
      throw IllegalArgumentException("$fieldName must be zero or greater.")
    }

    return value
  }

  private fun requireNonNegativeLong(input: Map<String, Any>, fieldName: String): Long {
    val value = when (val rawValue = input[fieldName]) {
      is Long -> rawValue
      is Int -> rawValue.toLong()
      is Double -> rawValue.toLong()
      is Float -> rawValue.toLong()
      is Number -> rawValue.toLong()
      else -> null
    }

    if (value == null || value < 0L) {
      throw IllegalArgumentException("$fieldName must be zero or greater.")
    }

    return value
  }

  private fun requireStringList(input: Map<String, Any>, fieldName: String): List<String> {
    val rawList = input[fieldName] as? List<*>
      ?: throw IllegalArgumentException("$fieldName must be a list.")

    return rawList.mapNotNull { value ->
      (value as? String)?.trim()?.takeIf { it.isNotBlank() }
    }
  }

  private fun optionalStringList(input: Map<String, Any>, fieldName: String): List<String>? {
    if (!input.containsKey(fieldName)) {
      return null
    }

    return requireStringList(input, fieldName)
  }
}
