package expo.modules.procrastinationtracker

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Notification-based call fallback.
 *
 * WhatsApp does not expose a supported call-history API to third-party apps, so
 * we conservatively record only call-like ongoing WhatsApp notifications.
 * The same listener also records non-WhatsApp CATEGORY_CALL notifications as a
 * fallback when Android does not grant READ_CALL_LOG to a sideloaded build.
 */
class WhatsAppCallNotificationListener : NotificationListenerService() {
  private val whatsappPackages = setOf("com.whatsapp", "com.whatsapp.w4b")

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    val item = sbn ?: return
    if (item.packageName == applicationContext.packageName) return

    val notification = item.notification ?: return
    val extras = notification.extras
    val title = extras?.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim()
    val rawText = extras?.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
    val text = rawText.lowercase()
    val categoryCall = notification.category == Notification.CATEGORY_CALL
    val ongoing = notification.flags and Notification.FLAG_ONGOING_EVENT != 0
    val chronometer = extras?.getBoolean(Notification.EXTRA_SHOW_CHRONOMETER, false) == true

    val observedStart = if (item.postTime > 0L) item.postTime else System.currentTimeMillis()

    val direction = when {
      text.contains("incoming") -> "incoming"
      text.contains("outgoing") || text.contains("calling") -> "outgoing"
      else -> "unknown"
    }

    if (whatsappPackages.contains(item.packageName)) {
      // Ignore normal WhatsApp messages. We only keep call-shaped/ongoing state.
      if (!categoryCall && !chronometer) return
      if (!ongoing && !chronometer) return
      WhatsAppCallStore.startOrUpdate(
        applicationContext,
        item.key,
        item.packageName,
        title,
        direction,
        observedStart
      )
      return
    }

    // Regular-call fallback. Restrict this to Android's CALL category and an
    // ongoing/chronometer notification so arbitrary app notifications are not stored.
    if (!categoryCall || (!ongoing && !chronometer)) return
    PhoneCallNotificationStore.startOrUpdate(
      applicationContext,
      item.key,
      item.packageName,
      title,
      direction,
      observedStart
    )
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {
    val item = sbn ?: return
    if (item.packageName == applicationContext.packageName) return

    if (whatsappPackages.contains(item.packageName)) {
      WhatsAppCallStore.finish(applicationContext, item.key, System.currentTimeMillis())
    } else {
      PhoneCallNotificationStore.finish(applicationContext, item.key, System.currentTimeMillis())
    }
  }
}
