package expo.modules.procrastinationtracker

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.CallLog
import android.provider.ContactsContract
import androidx.core.content.ContextCompat
import java.nio.charset.StandardCharsets
import java.util.UUID

object CallLogReader {
  fun query(context: Context, startMs: Long): List<Map<String, Any?>> {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CALL_LOG) != PackageManager.PERMISSION_GRANTED) {
      return emptyList()
    }

    val results = mutableListOf<Map<String, Any?>>()
    val projection = arrayOf(
      CallLog.Calls.NUMBER,
      CallLog.Calls.CACHED_NAME,
      CallLog.Calls.TYPE,
      CallLog.Calls.DATE,
      CallLog.Calls.DURATION
    )

    val cursor = context.contentResolver.query(
      CallLog.Calls.CONTENT_URI,
      projection,
      "${CallLog.Calls.DATE} >= ?",
      arrayOf(startMs.toString()),
      "${CallLog.Calls.DATE} ASC"
    ) ?: return emptyList()

    cursor.use {
      val numberIndex = it.getColumnIndex(CallLog.Calls.NUMBER)
      val nameIndex = it.getColumnIndex(CallLog.Calls.CACHED_NAME)
      val typeIndex = it.getColumnIndex(CallLog.Calls.TYPE)
      val dateIndex = it.getColumnIndex(CallLog.Calls.DATE)
      val durationIndex = it.getColumnIndex(CallLog.Calls.DURATION)

      while (it.moveToNext()) {
        val number = if (numberIndex >= 0) it.getString(numberIndex) ?: "" else ""
        var contactName = if (nameIndex >= 0) it.getString(nameIndex) else null
        val type = if (typeIndex >= 0) it.getInt(typeIndex) else CallLog.Calls.INCOMING_TYPE
        val startedAt = if (dateIndex >= 0) it.getLong(dateIndex) else 0L
        val durationSeconds = if (durationIndex >= 0) it.getLong(durationIndex) else 0L

        if (contactName.isNullOrBlank() && number.isNotBlank()) {
          contactName = resolveContactName(context, number)
        }

        val direction = when (type) {
          CallLog.Calls.INCOMING_TYPE -> "incoming"
          CallLog.Calls.OUTGOING_TYPE -> "outgoing"
          CallLog.Calls.MISSED_TYPE -> "missed"
          CallLog.Calls.REJECTED_TYPE -> "rejected"
          CallLog.Calls.BLOCKED_TYPE -> "blocked"
          CallLog.Calls.VOICEMAIL_TYPE -> "voicemail"
          CallLog.Calls.ANSWERED_EXTERNALLY_TYPE -> "answered_elsewhere"
          else -> "other"
        }

        val eventId = stableId("call|$number|$startedAt|$durationSeconds|$type")
        results.add(
          mapOf(
            "eventId" to eventId,
            "phoneNumber" to number,
            "contactName" to contactName,
            "direction" to direction,
            "startedAt" to startedAt.toDouble(),
            "durationSeconds" to durationSeconds.toDouble(),
            "source" to "call_log"
          )
        )
      }
    }

    return results
  }

  private fun resolveContactName(context: Context, number: String): String? {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
      return null
    }

    return try {
      val lookupUri = Uri.withAppendedPath(
        ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
        Uri.encode(number)
      )
      context.contentResolver.query(
        lookupUri,
        arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME),
        null,
        null,
        null
      )?.use { cursor ->
        if (cursor.moveToFirst()) {
          cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.PhoneLookup.DISPLAY_NAME))
        } else {
          null
        }
      }
    } catch (_: Exception) {
      null
    }
  }

  private fun stableId(value: String): String {
    return UUID.nameUUIDFromBytes(value.toByteArray(StandardCharsets.UTF_8)).toString()
  }
}
