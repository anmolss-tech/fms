package expo.modules.procrastinationtracker

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import java.nio.charset.StandardCharsets
import java.util.UUID

object UsageTracker {
  fun query(context: Context, startMs: Long, endMs: Long): List<Map<String, Any?>> {
    if (endMs <= startMs) return emptyList()

    val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = manager.queryEvents(startMs, endMs) ?: return emptyList()
    val event = UsageEvents.Event()
    val activeStarts = mutableMapOf<String, Long>()
    val results = mutableListOf<Map<String, Any?>>()

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val packageName = event.packageName ?: continue
      val timestamp = event.timeStamp

      // Android uses value 1 for MOVE_TO_FOREGROUND/ACTIVITY_RESUMED
      // and value 2 for MOVE_TO_BACKGROUND/ACTIVITY_PAUSED.
      when (event.eventType) {
        1 -> {
          if (!activeStarts.containsKey(packageName)) {
            activeStarts[packageName] = timestamp
          }
        }
        2 -> {
          val startedAt = activeStarts.remove(packageName) ?: continue
          if (timestamp <= startedAt) continue
          val durationMs = timestamp - startedAt
          if (durationMs < 1000L) continue

          val appName = resolveAppName(context, packageName)
          val eventId = stableId("usage|$packageName|$startedAt|$timestamp")
          results.add(
            mapOf(
              "eventId" to eventId,
              "packageName" to packageName,
              "appName" to appName,
              "startedAt" to startedAt.toDouble(),
              "endedAt" to timestamp.toDouble(),
              "durationSeconds" to (durationMs / 1000L).toDouble()
            )
          )
        }
      }
    }

    return results
  }

  private fun resolveAppName(context: Context, packageName: String): String {
    return try {
      val info = context.packageManager.getApplicationInfo(packageName, 0)
      context.packageManager.getApplicationLabel(info).toString()
    } catch (_: Exception) {
      packageName
    }
  }

  private fun stableId(value: String): String {
    return UUID.nameUUIDFromBytes(value.toByteArray(StandardCharsets.UTF_8)).toString()
  }
}
