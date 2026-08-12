package expo.modules.procrastinationtracker

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build

object PandaIconManager {
  private const val PREFS = "fms_tracker_native"
  private const val KEY_STATE = "panda_state"

  private val aliasSuffixes = linkedMapOf(
    "happy" to "PandaHappyAlias",
    "crying" to "PandaCryingAlias",
    "angry" to "PandaAngryAlias",
    "lonely" to "PandaLonelyAlias",
    "furious" to "PandaFuriousAlias",
    "please" to "PandaPleaseAlias",
    "waiting" to "PandaWaitingAlias",
    "heartbroken" to "PandaHeartbrokenAlias",
    "sleeping" to "PandaSleepingAlias",
    "missed" to "PandaMissedAlias"
  )

  fun setState(context: Context, requestedState: String) {
    val state = if (aliasSuffixes.containsKey(requestedState)) requestedState else "happy"
    val packageManager = context.packageManager
    val packageName = context.packageName
    val targetSuffix = aliasSuffixes[state] ?: aliasSuffixes.getValue("happy")

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      // Android 13+ can apply the launcher alias states atomically.
      val settings = aliasSuffixes.map { (_, suffix) ->
        val component = ComponentName(packageName, "$packageName.$suffix")
        val enabledState = if (suffix == targetSuffix) {
          PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } else {
          PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        }
        PackageManager.ComponentEnabledSetting(
          component,
          enabledState,
          PackageManager.DONT_KILL_APP
        )
      }
      packageManager.setComponentEnabledSettings(settings)
    } else {
      // Enable the new launcher entry before disabling the previous one so
      // older Android versions never have a moment with no launcher component.
      val target = ComponentName(packageName, "$packageName.$targetSuffix")
      packageManager.setComponentEnabledSetting(
        target,
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
        PackageManager.DONT_KILL_APP
      )

      aliasSuffixes.forEach { (_, suffix) ->
        if (suffix != targetSuffix) {
          val component = ComponentName(packageName, "$packageName.$suffix")
          packageManager.setComponentEnabledSetting(
            component,
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP
          )
        }
      }
    }

    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_STATE, state)
      .apply()
  }

  fun getState(context: Context): String {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_STATE, "happy") ?: "happy"
  }
}
