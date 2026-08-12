import * as SecureStore from "expo-secure-store";
import {
  getState,
  getUnsyncedData,
  markSynced,
  setState,
} from "../database/db";

const TOKEN_KEY = "tracker_api_token";
const DEVICE_ID_KEY = "tracker_device_id";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 500;
const MAX_BATCHES_PER_SYNC = 60;

function normalizeApiUrl(value) {
  const trimmed = String(value || "").trim();
  return trimmed.replace(/\/+$/, "");
}

function normalizeUserId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function getDeviceId() {
  let value = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!value) {
    value = `device-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, value);
  }
  return value;
}

export async function getProfileConfig() {
  const userName = await getState("tracker_user_name", "");
  const savedUserId = await getState("tracker_user_id", "");
  const deviceName = await getState("tracker_device_name", "");
  return {
    userName,
    userId: savedUserId || normalizeUserId(userName),
    deviceName,
    deviceId: await getDeviceId(),
  };
}

export async function saveProfileConfig(userName, deviceName) {
  const cleanUserName = String(userName || "").trim();
  const cleanDeviceName = String(deviceName || "").trim();
  if (!cleanUserName) throw new Error("Enter a profile name first.");
  if (!cleanDeviceName) throw new Error("Enter a device name first.");

  const userId = normalizeUserId(cleanUserName);
  if (!userId) throw new Error("Profile name must contain letters or numbers.");

  await setState("tracker_user_name", cleanUserName);
  await setState("tracker_user_id", userId);
  await setState("tracker_device_name", cleanDeviceName);

  return {
    userName: cleanUserName,
    userId,
    deviceName: cleanDeviceName,
    deviceId: await getDeviceId(),
  };
}

export async function getWeeklySyncStatus() {
  const lastSuccessfulSyncAt = Number(
    await getState("last_successful_sync_at", 0)
  ) || 0;
  const lastSyncAttemptAt = Number(await getState("last_sync_attempt_at", 0)) || 0;
  const now = Date.now();
  const nextSyncAt = lastSuccessfulSyncAt
    ? lastSuccessfulSyncAt + WEEK_MS
    : now;

  return {
    intervalMs: WEEK_MS,
    lastSuccessfulSyncAt,
    lastSyncAttemptAt,
    nextSyncAt,
    due: !lastSuccessfulSyncAt || now >= nextSyncAt,
  };
}

export async function getSyncConfig() {
  const profile = await getProfileConfig();
  return {
    apiUrl: await getState("tracker_api_url", ""),
    token: (await SecureStore.getItemAsync(TOKEN_KEY)) || "",
    ...profile,
  };
}

export async function saveSyncConfig(apiUrl, token) {
  const normalizedUrl = normalizeApiUrl(apiUrl);
  await setState("tracker_api_url", normalizedUrl);

  if (String(token || "").trim()) {
    await SecureStore.setItemAsync(TOKEN_KEY, String(token).trim());
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  // Automatic sync is intentionally weekly. When cloud sync is configured for
  // the first time, start the seven-day clock instead of immediately uploading.
  if (normalizedUrl) {
    const existing = Number(await getState("last_successful_sync_at", 0)) || 0;
    if (!existing) {
      const now = Date.now();
      await setState("last_successful_sync_at", now);
      await setState("last_sync_at", now); // Backwards-compatible display key.
    }
  }
}

function mapUsage(row) {
  return {
    eventId: row.event_id,
    packageName: row.package_name,
    appName: row.app_name,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    category: row.category,
  };
}

function maskNumber(number) {
  const value = String(number || "");
  if (!value) return "";
  const last4 = value.replace(/\D/g, "").slice(-4);
  return last4 ? `***${last4}` : "hidden";
}

function mapPhoneCall(row) {
  return {
    eventId: row.event_id,
    phoneNumberMasked: maskNumber(row.phone_number),
    contactName: row.contact_name,
    direction: row.direction,
    startedAt: row.started_at,
    durationSeconds: row.duration_seconds,
    category: row.category,
    source: row.source || "call_log",
  };
}

function mapWhatsAppCall(row) {
  return {
    eventId: row.event_id,
    packageName: row.package_name,
    contactLabel: row.contact_label,
    direction: row.direction,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    category: row.category,
    source: row.source || "best_effort_notification",
    confidence: row.confidence,
  };
}

function mapFrenchSession(row) {
  return {
    sessionId: row.session_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    cardsPracticed: row.cards_practiced,
  };
}

function hasAnyRows(data) {
  return Object.values(data).some((items) => Array.isArray(items) && items.length > 0);
}

function acceptedCount(accepted) {
  return [
    accepted?.usageEventIds,
    accepted?.phoneCallIds,
    accepted?.whatsappCallIds,
    accepted?.frenchSessionIds,
  ].reduce((sum, ids) => sum + (Array.isArray(ids) ? ids.length : 0), 0);
}

async function uploadBatch({ apiUrl, token, profile, data }) {
  const response = await fetch(`${apiUrl}/api/v1/sync/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      userId: profile.userId,
      userName: profile.userName,
      deviceId: profile.deviceId,
      deviceName: profile.deviceName,
      usageEvents: data.usageEvents.map(mapUsage),
      phoneCalls: data.phoneCalls.map(mapPhoneCall),
      whatsappCalls: data.whatsappCalls.map(mapWhatsAppCall),
      frenchSessions: data.frenchSessions.map(mapFrenchSession),
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      `Tracker sync failed with HTTP ${response.status}${message ? `: ${message.slice(0, 180)}` : ""}`
    );
  }

  return response.json();
}

export async function syncUnsyncedData({ force = false } = {}) {
  const config = await getSyncConfig();
  const profile = {
    userId: config.userId,
    userName: config.userName,
    deviceId: config.deviceId,
    deviceName: config.deviceName,
  };

  if (!config.apiUrl) {
    return { ok: false, skipped: true, reason: "API URL is not configured." };
  }
  if (!profile.userId || !profile.userName) {
    return { ok: false, skipped: true, reason: "User profile is not configured." };
  }
  if (!profile.deviceName) {
    return { ok: false, skipped: true, reason: "Device name is not configured." };
  }

  const weeklyStatus = await getWeeklySyncStatus();
  if (!force && !weeklyStatus.due) {
    return {
      ok: true,
      skipped: true,
      reason: "Weekly cloud sync is not due yet. SQLite continues logging locally.",
      nextSyncAt: weeklyStatus.nextSyncAt,
    };
  }

  await setState("last_sync_attempt_at", Date.now());

  const totals = {
    usageEventIds: [],
    phoneCallIds: [],
    whatsappCallIds: [],
    frenchSessionIds: [],
  };
  let batches = 0;

  while (batches < MAX_BATCHES_PER_SYNC) {
    const data = await getUnsyncedData(BATCH_SIZE);
    if (!hasAnyRows(data)) break;

    const body = await uploadBatch({
      apiUrl: config.apiUrl,
      token: config.token,
      profile,
      data,
    });
    const accepted = body.accepted || {};

    await markSynced("app_usage", "event_id", accepted.usageEventIds || []);
    await markSynced("phone_calls", "event_id", accepted.phoneCallIds || []);
    await markSynced("whatsapp_calls", "event_id", accepted.whatsappCallIds || []);
    await markSynced("french_sessions", "session_id", accepted.frenchSessionIds || []);

    for (const key of Object.keys(totals)) {
      totals[key].push(...(accepted[key] || []));
    }

    batches += 1;
    if (acceptedCount(accepted) === 0) {
      throw new Error("Server accepted no rows; sync stopped to avoid an endless retry loop.");
    }
  }

  const remaining = await getUnsyncedData(1);
  if (hasAnyRows(remaining)) {
    throw new Error(
      "Weekly sync reached its safety batch limit. Run Sync Now again to continue uploading the remaining local records."
    );
  }

  const completedAt = Date.now();
  await setState("last_successful_sync_at", completedAt);
  await setState("last_sync_at", completedAt);

  return {
    ok: true,
    skipped: batches === 0,
    reason: batches === 0 ? "Nothing new to sync." : "Weekly SQLite records synchronized.",
    batches,
    accepted: totals,
    nextSyncAt: completedAt + WEEK_MS,
  };
}

export const WEEKLY_SYNC_INTERVAL_MS = WEEK_MS;
