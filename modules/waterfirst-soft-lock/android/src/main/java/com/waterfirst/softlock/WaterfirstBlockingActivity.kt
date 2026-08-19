package com.waterfirst.softlock

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.Window
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WaterfirstBlockingActivity : Activity() {
  private val skipLimit = 2
  private val skipDelayMillis = 15 * 60 * 1000L

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    requestWindowFeature(Window.FEATURE_NO_TITLE)
    window.statusBarColor = Color.parseColor("#061927")
    window.navigationBarColor = Color.parseColor("#061927")

    val blockedPackageName = intent.getStringExtra(extraBlockedPackageName)
    setContentView(buildContent(blockedPackageName))
  }

  private fun buildContent(blockedPackageName: String?): View {
    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(dp(24), dp(36), dp(24), dp(36))
      setBackgroundColor(Color.parseColor("#061927"))
    }

    val card = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(dp(24), dp(28), dp(24), dp(24))
      background = roundedDrawable("#09243A", "#1D4D66", 28)
    }

    root.addView(
      card,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT
      )
    )

    card.addView(
      TextView(this).apply {
        text = "Hydration Shield"
        setTextColor(Color.parseColor("#2CCBFF"))
        textSize = 14f
        typeface = Typeface.DEFAULT_BOLD
        gravity = Gravity.CENTER
      }
    )

    card.addView(
      TextView(this).apply {
        text = "Hydration check-in"
        setTextColor(Color.WHITE)
        textSize = 24f
        typeface = Typeface.DEFAULT_BOLD
        gravity = Gravity.CENTER
        setPadding(0, dp(10), 0, 0)
      }
    )

    card.addView(
      TextView(this).apply {
        text = "Drink and log your water to continue."
        setTextColor(Color.parseColor("#A8BBC9"))
        textSize = 16f
        gravity = Gravity.CENTER
        setPadding(0, dp(10), 0, dp(20))
      }
    )

    card.addView(
      TextView(this).apply {
        text = "WaterFirst will restore access after your hydration checkpoint is logged."
        setTextColor(Color.parseColor("#7F96A8"))
        textSize = 13f
        gravity = Gravity.CENTER
        setPadding(0, 0, 0, dp(20))
      }
    )

    card.addView(
      Button(this).apply {
        text = "Open WaterFirst"
        setTextColor(Color.parseColor("#00111E"))
        textSize = 15f
        typeface = Typeface.DEFAULT_BOLD
        background = roundedDrawable("#2CCBFF", "#2CCBFF", 16)
        setOnClickListener {
          openWaterfirstSoftLock()
        }
      },
      buttonLayoutParams()
    )

    card.addView(
      Button(this).apply {
        text = skipButtonText()
        isEnabled = skipsRemaining() > 0
        setTextColor(if (isEnabled) Color.parseColor("#BFEFFF") else Color.parseColor("#607787"))
        textSize = 14f
        background = roundedDrawable("#09243A", "#1D4D66", 16)
        setOnClickListener {
          if (recordSkipForNow()) {
            reopenBlockedApp(blockedPackageName)
          }
        }
      },
      buttonLayoutParams()
    )

    return root
  }

  private fun buttonLayoutParams() =
    LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      dp(52)
    ).apply {
      topMargin = dp(12)
    }

  private fun openWaterfirstSoftLock() {
    val deepLinkIntent = Intent(Intent.ACTION_VIEW, Uri.parse("waterfirst://")).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      setPackage(packageName)
    }

    try {
      startActivity(deepLinkIntent)
    } catch (_: Exception) {
      packageManager.getLaunchIntentForPackage(packageName)?.let { fallbackIntent ->
        fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        startActivity(fallbackIntent)
      }
    }

    finish()
  }

  private fun reopenBlockedApp(blockedPackageName: String?) {
    if (!blockedPackageName.isNullOrBlank()) {
      packageManager.getLaunchIntentForPackage(blockedPackageName)?.let { blockedIntent ->
        blockedIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        startActivity(blockedIntent)
        finish()
        return
      }
    }

    finish()
  }

  private fun recordSkipForNow(): Boolean {
    val preferences = getSharedPreferences(WaterfirstSoftLockKeys.preferencesName, Context.MODE_PRIVATE)
    val today = localDateKey()
    val storedDate = preferences.getString(WaterfirstSoftLockKeys.nativeSkipDateKey, null)
    val currentCount = if (storedDate == today) {
      preferences.getInt(WaterfirstSoftLockKeys.nativeSkipCountKey, 0)
    } else {
      0
    }

    if (currentCount >= skipLimit) {
      return false
    }

    preferences.edit()
      .putString(WaterfirstSoftLockKeys.nativeSkipDateKey, today)
      .putInt(WaterfirstSoftLockKeys.nativeSkipCountKey, currentCount + 1)
      .putLong(WaterfirstSoftLockKeys.snoozedUntilEpochMillisKey, System.currentTimeMillis() + skipDelayMillis)
      .putBoolean(WaterfirstSoftLockKeys.isActiveKey, false)
      .remove(WaterfirstSoftLockKeys.activeSessionIdKey)
      .apply()

    return true
  }

  private fun skipsRemaining(): Int {
    val preferences = getSharedPreferences(WaterfirstSoftLockKeys.preferencesName, Context.MODE_PRIVATE)
    val today = localDateKey()
    val storedDate = preferences.getString(WaterfirstSoftLockKeys.nativeSkipDateKey, null)
    val currentCount = if (storedDate == today) {
      preferences.getInt(WaterfirstSoftLockKeys.nativeSkipCountKey, 0)
    } else {
      0
    }

    return (skipLimit - currentCount).coerceAtLeast(0)
  }

  private fun skipButtonText() = "Skip for now (${skipsRemaining()} left today)"

  private fun localDateKey() =
    SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

  private fun roundedDrawable(fillColor: String, strokeColor: String, radius: Int) =
    GradientDrawable().apply {
      shape = GradientDrawable.RECTANGLE
      cornerRadius = dp(radius).toFloat()
      setColor(Color.parseColor(fillColor))
      setStroke(dp(1), Color.parseColor(strokeColor))
    }

  private fun dp(value: Int) =
    (value * resources.displayMetrics.density).toInt()

  companion object {
    const val extraBlockedPackageName = "blockedPackageName"
  }
}
