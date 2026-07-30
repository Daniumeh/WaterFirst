package com.waterfirst.softlock

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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

    AsyncFunction("getStatus") {
      mapOf(
        "supported" to true,
        "authorizationStatus" to resolveAuthorizationStatus(),
        "isActive" to false,
        "selectedApplicationCount" to 0,
        "activeSessionId" to null
      )
    }

    AsyncFunction("getLastDetectedPackageForDebug") {
      preferences().getString(WaterfirstSoftLockKeys.lastDetectedPackageKey, null)
    }

    AsyncFunction("clearApplicationSelection") {
      Unit
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
}
