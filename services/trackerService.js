import {
  getOwnPackageName,
  getPhoneCalls,
  getPhoneNotificationEvents,
  getUsageEvents,
  getWhatsAppCallEvents,
  hasCallLogPermission,
  hasUsageAccess,
} from "./nativeTracker";
import {
  getState,
  initDatabase,
  insertPhoneCalls,
  insertUsageEvents,
  insertWhatsAppCalls,
  setState,
} from "../database/db";

const FIRST_IMPORT_WINDOW_MS = 48 * 60 * 60 * 1000;
const OVERLAP_MS = 24 * 60 * 60 * 1000;

export async function collectTrackingData() {
  await initDatabase();
  const now = Date.now();
  const result = {
    usageInserted: 0,
    phoneCallsInserted: 0,
    whatsappCallsInserted: 0,
    usageAccess: false,
    callLogAccess: false,
  };

  try {
    result.usageAccess = await hasUsageAccess();
    if (result.usageAccess) {
      const lastValue = Number(await getState("last_usage_import_at", 0));
      const baseStart = lastValue > 0 ? lastValue : now - FIRST_IMPORT_WINDOW_MS;
      const start = Math.max(0, baseStart - OVERLAP_MS);
      const ownPackage = await getOwnPackageName();
      const events = await getUsageEvents(start, now);
      const filtered = (events || []).filter(
        (item) => item.packageName && item.packageName !== ownPackage
      );
      result.usageInserted = await insertUsageEvents(filtered);
      await setState("last_usage_import_at", now);
    }
  } catch (error) {
    console.log("Usage tracking import failed:", error);
  }

  try {
    result.callLogAccess = await hasCallLogPermission();
    if (result.callLogAccess) {
      const lastValue = Number(await getState("last_call_import_at", 0));
      const baseStart = lastValue > 0 ? lastValue : now - FIRST_IMPORT_WINDOW_MS;
      const start = Math.max(0, baseStart - OVERLAP_MS);
      const calls = await getPhoneCalls(start);
      result.phoneCallsInserted = await insertPhoneCalls(calls || []);
      await setState("last_call_import_at", now);
    }
  } catch (error) {
    console.log("Call log import failed:", error);
  }

  // READ_CALL_LOG is hard-restricted on modern Android and may not be granted
  // to a normally sideloaded app. When unavailable, use only Android CALL
  // notifications as a conservative fallback (requires Notification Access).
  if (!result.callLogAccess) {
    try {
      const notificationCalls = await getPhoneNotificationEvents();
      const normalized = (notificationCalls || []).map((item) => ({
        eventId: item.eventId,
        phoneNumber: "",
        contactName: item.contactLabel || "Phone call",
        direction: item.direction || "unknown",
        startedAt: item.startedAt,
        durationSeconds: item.durationSeconds || 0,
        source: "best_effort_notification",
      }));
      result.phoneCallsInserted += await insertPhoneCalls(normalized);
    } catch (error) {
      console.log("Phone notification fallback import failed:", error);
    }
  }

  try {
    const whatsappCalls = await getWhatsAppCallEvents();
    const normalizedWhatsApp = (whatsappCalls || []).map((item) => ({
      ...item,
      source: item.source || "best_effort_notification",
    }));
    result.whatsappCallsInserted = await insertWhatsAppCalls(normalizedWhatsApp);
  } catch (error) {
    console.log("WhatsApp call import failed:", error);
  }

  await setState("last_tracker_refresh_at", now);
  return result;
}
