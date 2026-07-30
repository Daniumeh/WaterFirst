package com.waterfirst.softlock

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.pm.ApplicationInfo
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class WaterfirstAccessibilityService : AccessibilityService() {
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
  }

  override fun onInterrupt() = Unit
}
