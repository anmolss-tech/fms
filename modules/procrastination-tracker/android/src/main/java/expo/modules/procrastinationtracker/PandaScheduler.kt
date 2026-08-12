package expo.modules.procrastinationtracker

import android.content.Context
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

object PandaScheduler {
  private const val PREFS = "fms_tracker_native"
  private const val KEY_LAST_BACKGROUND = "last_background_at"
  private const val KEY_FOREGROUND = "app_foreground"
  private const val KEY_TEST_MODE = "panda_test_mode"
  private const val TAG = "fms_panda_mood"

  private val productionThresholds = listOf(
    "crying" to 6L * 60L * 60L * 1000L,
    "angry" to 12L * 60L * 60L * 1000L,
    "lonely" to 24L * 60L * 60L * 1000L,
    "furious" to 36L * 60L * 60L * 1000L,
    "please" to 48L * 60L * 60L * 1000L,
    "waiting" to 72L * 60L * 60L * 1000L,
    "heartbroken" to 5L * 24L * 60L * 60L * 1000L,
    "sleeping" to 7L * 24L * 60L * 60L * 1000L,
    "missed" to 14L * 24L * 60L * 60L * 1000L
  )

  private val testThresholds = listOf(
    "crying" to 30_000L,
    "angry" to 60_000L,
    "lonely" to 90_000L,
    "furious" to 120_000L,
    "please" to 150_000L,
    "waiting" to 180_000L,
    "heartbroken" to 210_000L,
    "sleeping" to 240_000L,
    "missed" to 270_000L
  )

  fun onForeground(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_FOREGROUND, true)
      .apply()
    WorkManager.getInstance(context).cancelAllWorkByTag(TAG)
    PandaIconManager.setState(context, "happy")
  }

  fun onBackground(context: Context) {
    val now = System.currentTimeMillis()
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_FOREGROUND, false)
      .putLong(KEY_LAST_BACKGROUND, now)
      .apply()
    PandaIconManager.setState(context, "happy")
    schedule(context)
  }

  fun setTestMode(context: Context, enabled: Boolean) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_TEST_MODE, enabled)
      .apply()

    if (!isAppForeground(context)) {
      schedule(context)
    }
  }

  fun isTestMode(context: Context): Boolean {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getBoolean(KEY_TEST_MODE, false)
  }

  fun isAppForeground(context: Context): Boolean {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getBoolean(KEY_FOREGROUND, true)
  }

  fun calculateCurrentState(context: Context): String {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val lastBackground = prefs.getLong(KEY_LAST_BACKGROUND, 0L)
    if (lastBackground <= 0L) return "happy"
    val elapsed = System.currentTimeMillis() - lastBackground
    var state = "happy"
    for ((candidate, threshold) in thresholds(context)) {
      if (elapsed >= threshold) state = candidate
    }
    return state
  }

  fun getStatus(context: Context): Map<String, Any?> {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return mapOf(
      "state" to PandaIconManager.getState(context),
      "lastBackgroundAt" to prefs.getLong(KEY_LAST_BACKGROUND, 0L).toDouble(),
      "foreground" to prefs.getBoolean(KEY_FOREGROUND, true),
      "testMode" to prefs.getBoolean(KEY_TEST_MODE, false)
    )
  }

  private fun schedule(context: Context) {
    val manager = WorkManager.getInstance(context)
    manager.cancelAllWorkByTag(TAG)

    thresholds(context).forEach { (_, delayMs) ->
      val request = OneTimeWorkRequestBuilder<PandaMoodWorker>()
        .setInitialDelay(delayMs, TimeUnit.MILLISECONDS)
        .addTag(TAG)
        .build()
      manager.enqueue(request)
    }
  }

  private fun thresholds(context: Context): List<Pair<String, Long>> {
    return if (isTestMode(context)) testThresholds else productionThresholds
  }
}
