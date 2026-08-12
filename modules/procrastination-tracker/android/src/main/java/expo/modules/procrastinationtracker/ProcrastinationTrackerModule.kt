package expo.modules.procrastinationtracker

import android.Manifest
import android.app.AppOpsManager
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ProcrastinationTrackerModule : Module() {
  private fun context(): Context = appContext.reactContext
    ?: throw IllegalStateException("React context is not available")

  override fun definition() = ModuleDefinition {
    Name("ProcrastinationTracker")

    AsyncFunction("isAvailable") {
      true
    }

    AsyncFunction("getPackageName") {
      context().packageName
    }

    AsyncFunction("hasUsageAccess") {
      hasUsageAccess(context())
    }

    AsyncFunction("openUsageAccessSettings") {
      val ctx = context()
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        data = Uri.parse("package:${ctx.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      ctx.startActivity(intent)
      true
    }

    AsyncFunction("getUsageEvents") { startMs: Double, endMs: Double ->
      UsageTracker.query(context(), startMs.toLong(), endMs.toLong())
    }

    AsyncFunction("hasCallLogPermission") {
      ContextCompat.checkSelfPermission(context(), Manifest.permission.READ_CALL_LOG) == PackageManager.PERMISSION_GRANTED
    }

    AsyncFunction("hasContactsPermission") {
      ContextCompat.checkSelfPermission(context(), Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED
    }

    AsyncFunction("getPhoneCalls") { startMs: Double ->
      CallLogReader.query(context(), startMs.toLong())
    }

    AsyncFunction("getPhoneNotificationEvents") {
      PhoneCallNotificationStore.getCompleted(context())
    }

    AsyncFunction("hasNotificationListenerAccess") {
      val ctx = context()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.isNotificationListenerAccessGranted(
          ComponentName(ctx, WhatsAppCallNotificationListener::class.java)
        )
      } else {
        val enabled = Settings.Secure.getString(
          ctx.contentResolver,
          "enabled_notification_listeners"
        ) ?: ""
        enabled.contains(ctx.packageName)
      }
    }

    AsyncFunction("openNotificationListenerSettings") {
      val ctx = context()
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      ctx.startActivity(intent)
      true
    }

    AsyncFunction("getWhatsAppCallEvents") {
      WhatsAppCallStore.getCompleted(context())
    }

    AsyncFunction("setPandaIcon") { state: String ->
      PandaIconManager.setState(context(), state)
      PandaIconManager.getState(context())
    }

    AsyncFunction("getPandaState") {
      PandaIconManager.getState(context())
    }

    AsyncFunction("onAppForeground") {
      PandaScheduler.onForeground(context())
      true
    }

    AsyncFunction("onAppBackground") {
      PandaScheduler.onBackground(context())
      true
    }

    AsyncFunction("setPandaTestMode") { enabled: Boolean ->
      PandaScheduler.setTestMode(context(), enabled)
      enabled
    }

    AsyncFunction("getPandaTestMode") {
      PandaScheduler.isTestMode(context())
    }

    AsyncFunction("getPandaStatus") {
      PandaScheduler.getStatus(context())
    }
  }

  private fun hasUsageAccess(ctx: Context): Boolean {
    val appOps = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        ctx.packageName
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        ctx.packageName
      )
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }
}
