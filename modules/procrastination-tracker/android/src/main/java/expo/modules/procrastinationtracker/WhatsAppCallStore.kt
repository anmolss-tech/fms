package expo.modules.procrastinationtracker

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.util.UUID

object WhatsAppCallStore {
  private const val PREFS = "fms_whatsapp_call_tracker"
  private const val ACTIVE = "active_calls"
  private const val COMPLETED = "completed_calls"
  private const val KEEP_MS = 30L * 24L * 60L * 60L * 1000L

  fun startOrUpdate(
    context: Context,
    notificationKey: String,
    packageName: String,
    contactLabel: String?,
    direction: String,
    startedAt: Long
  ) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val active = readArray(prefs.getString(ACTIVE, null))
    val next = JSONArray()
    var found = false

    for (i in 0 until active.length()) {
      val item = active.optJSONObject(i) ?: continue
      if (item.optString("notificationKey") == notificationKey) {
        found = true
        if (!contactLabel.isNullOrBlank()) item.put("contactLabel", contactLabel)
        if (direction != "unknown") item.put("direction", direction)
      }
      next.put(item)
    }

    if (!found) {
      next.put(
        JSONObject()
          .put("notificationKey", notificationKey)
          .put("packageName", packageName)
          .put("contactLabel", contactLabel ?: "WhatsApp contact")
          .put("direction", direction)
          .put("startedAt", startedAt)
      )
    }

    prefs.edit().putString(ACTIVE, next.toString()).apply()
  }

  fun finish(context: Context, notificationKey: String, endedAt: Long) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val active = readArray(prefs.getString(ACTIVE, null))
    val remaining = JSONArray()
    var completedItem: JSONObject? = null

    for (i in 0 until active.length()) {
      val item = active.optJSONObject(i) ?: continue
      if (item.optString("notificationKey") == notificationKey) {
        completedItem = item
      } else {
        remaining.put(item)
      }
    }

    prefs.edit().putString(ACTIVE, remaining.toString()).apply()

    val item = completedItem ?: return
    val startedAt = item.optLong("startedAt", 0L)
    if (startedAt <= 0L || endedAt <= startedAt) return
    val durationSeconds = (endedAt - startedAt) / 1000L
    if (durationSeconds < 5L) return

    val contactLabel = item.optString("contactLabel", "WhatsApp contact")
    val packageName = item.optString("packageName", "com.whatsapp")
    val direction = item.optString("direction", "unknown")
    val eventId = stableId("wa|$packageName|$contactLabel|$startedAt|$endedAt")

    val completed = readArray(prefs.getString(COMPLETED, null))
    val trimmed = JSONArray()
    val cutoff = System.currentTimeMillis() - KEEP_MS

    for (i in 0 until completed.length()) {
      val existing = completed.optJSONObject(i) ?: continue
      if (existing.optLong("endedAt", 0L) >= cutoff && existing.optString("eventId") != eventId) {
        trimmed.put(existing)
      }
    }

    trimmed.put(
      JSONObject()
        .put("eventId", eventId)
        .put("packageName", packageName)
        .put("contactLabel", contactLabel)
        .put("direction", direction)
        .put("startedAt", startedAt)
        .put("endedAt", endedAt)
        .put("durationSeconds", durationSeconds)
        .put("source", "best_effort_notification")
        .put("confidence", "best_effort_notification")
    )

    prefs.edit().putString(COMPLETED, trimmed.toString()).apply()
  }

  fun getCompleted(context: Context): List<Map<String, Any?>> {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val completed = readArray(prefs.getString(COMPLETED, null))
    val results = mutableListOf<Map<String, Any?>>()

    for (i in 0 until completed.length()) {
      val item = completed.optJSONObject(i) ?: continue
      results.add(
        mapOf(
          "eventId" to item.optString("eventId"),
          "packageName" to item.optString("packageName"),
          "contactLabel" to item.optString("contactLabel"),
          "direction" to item.optString("direction", "unknown"),
          "startedAt" to item.optLong("startedAt").toDouble(),
          "endedAt" to item.optLong("endedAt").toDouble(),
          "durationSeconds" to item.optLong("durationSeconds").toDouble(),
          "source" to item.optString("source", "best_effort_notification"),
          "confidence" to item.optString("confidence", "best_effort_notification")
        )
      )
    }

    return results
  }

  private fun readArray(value: String?): JSONArray {
    if (value.isNullOrBlank()) return JSONArray()
    return try {
      JSONArray(value)
    } catch (_: Exception) {
      JSONArray()
    }
  }

  private fun stableId(value: String): String {
    return UUID.nameUUIDFromBytes(value.toByteArray(StandardCharsets.UTF_8)).toString()
  }
}
