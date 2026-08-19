package com.waterfirst.softlock

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class WaterfirstAccessibilityService : AccessibilityService() {
  private val blockLaunchDebounceMillis = 1200L

  override fun onServiceConnected() {
    serviceInfo = AccessibilityServiceInfo().apply {
      eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      notificationTimeout = 100
      flags = 0
    }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      return
    }

    val detectedPackageName = event.packageName?.toString()?.trim()

    if (detectedPackageName.isNullOrBlank()) {
      return
    }

    if (detectedPackageName == applicationContext.packageName) {
      return
    }

    getSharedPreferences(WaterfirstSoftLockKeys.preferencesName, Context.MODE_PRIVATE)
      .edit()
      .putString(WaterfirstSoftLockKeys.lastDetectedPackageKey, detectedPackageName)
      .apply()

    if ((applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
      Log.d("WaterfirstSoftLock", "Foreground package changed.")
    }

    if (shouldBlockPackage(detectedPackageName)) {
      openBlockingScreen(detectedPackageName)
    }
  }

  override fun onInterrupt() = Unit

  private fun shouldBlockPackage(packageName: String): Boolean {
    val preferences = getSharedPreferences(WaterfirstSoftLockKeys.preferencesName, Context.MODE_PRIVATE)

    if (!preferences.getBoolean(WaterfirstSoftLockKeys.softLockEnabledKey, false)) {
      return false
    }

    if (preferences.getLong(WaterfirstSoftLockKeys.snoozedUntilEpochMillisKey, 0L) > System.currentTimeMillis()) {
      return false
    }

    val protectedPackages = preferences.getStringSet(
      WaterfirstSoftLockKeys.protectedPackageNamesKey,
      emptySet()
    ).orEmpty()

    if (!protectedPackages.contains(packageName)) {
      return false
    }

    if (preferences.getBoolean(WaterfirstSoftLockKeys.isActiveKey, false)) {
      return true
    }

    return activateDueCheckpoint(preferences)
  }

  private fun activateDueCheckpoint(preferences: android.content.SharedPreferences): Boolean {
    val scheduleJson = preferences.getString(WaterfirstSoftLockKeys.checkpointScheduleJsonKey, null)
      ?: return false
    val loggedMl = if (preferences.getString(WaterfirstSoftLockKeys.loggedDateKey, null) == localDateKey()) {
      preferences.getInt(WaterfirstSoftLockKeys.loggedMlKey, 0)
    } else {
      0
    }
    val currentMinutes = currentLocalMinutes()
    val checkpoints = try {
      JSONArray(scheduleJson)
    } catch (_: Exception) {
      return false
    }

    for (index in 0 until checkpoints.length()) {
      val checkpoint = checkpoints.optJSONObject(index) ?: continue
      val dueMinutes = checkpoint.optInt("dueMinutes", -1)
      val targetMl = checkpoint.optInt("targetMl", 0)

      if (dueMinutes >= 0 && dueMinutes <= currentMinutes && loggedMl < targetMl) {
        val requiredAmountCl = ((targetMl - loggedMl).coerceAtLeast(10) + 9) / 10

        preferences.edit()
          .putBoolean(WaterfirstSoftLockKeys.isActiveKey, true)
          .putString(WaterfirstSoftLockKeys.activeSessionIdKey, checkpoint.optString("id", "checkpoint-$index"))
          .putString(WaterfirstSoftLockKeys.activatedAtKey, Date().time.toString())
          .putInt(WaterfirstSoftLockKeys.requiredAmountClKey, requiredAmountCl)
          .apply()

        return true
      }
    }

    return false
  }

  private fun openBlockingScreen(blockedPackageName: String) {
    val preferences = getSharedPreferences(WaterfirstSoftLockKeys.preferencesName, Context.MODE_PRIVATE)
    val now = System.currentTimeMillis()

    if (now - preferences.getLong(WaterfirstSoftLockKeys.lastBlockLaunchedAtKey, 0L) < blockLaunchDebounceMillis) {
      return
    }

    preferences.edit()
      .putLong(WaterfirstSoftLockKeys.lastBlockLaunchedAtKey, now)
      .putString(WaterfirstSoftLockKeys.lastBlockedPackageKey, blockedPackageName)
      .apply()

    startActivity(
      Intent(this, WaterfirstBlockingActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        .putExtra(WaterfirstBlockingActivity.extraBlockedPackageName, blockedPackageName)
    )
  }

  private fun localDateKey() =
    SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

  private fun currentLocalMinutes(): Int {
    val calendar = Calendar.getInstance()

    return calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
  }
}
