import * as SecureStore from "expo-secure-store";
import {
  getState,
  getUnsyncedData,
  markSynced,
  setState,
} from "../database/db";

const TOKEN_KEY = "tracker_api_token";
const DEVICE_ID_KEY = "tracker_device_id";

function normalizeApiUrl(value) {
  const trimmed = String(value || "").trim();
  return trimmed.replace(/\/+$/, "");
}

async function getDeviceId() {
  let value = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!value) {
    value = `device-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, value);
  }
  return value;
}

export async function getSyncConfig() {
  return {
    apiUrl: await getState("tracker_api_url", ""),
    token: (await SecureStore.getItemAsync(TOKEN_KEY)) || "",
    deviceId: await getDeviceId(),
  };
}

export async function saveSyncConfig(apiUrl, token) {
  await setState("tracker_api_url", normalizeApiUrl(apiUrl));
  if (String(token || "").trim()) {
    await SecureStore.setItemAsync(TOKEN_KEY, String(token).trim());
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
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

export async function syncUnsyncedData() {
  const { apiUrl, token, deviceId } = await getSyncConfig();
  if (!apiUrl) {
    return { ok: false, skipped: true, reason: "API URL is not configured." };
  }

  const data = await getUnsyncedData(250);
  const hasData = Object.values(data).some((items) => items.length > 0);
  if (!hasData) {
    await setState("last_sync_at", Date.now());
    return { ok: true, skipped: true, reason: "Nothing new to sync." };
  }

  const response = await fetch(`${apiUrl}/api/v1/sync/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      deviceId,
      usageEvents: data.usageEvents.map(mapUsage),
      phoneCalls: data.phoneCalls.map(mapPhoneCall),
      whatsappCalls: data.whatsappCalls.map(mapWhatsAppCall),
      frenchSessions: data.frenchSessions.map(mapFrenchSession),
    }),
  });

  if (!response.ok) {
    throw new Error(`Tracker sync failed with HTTP ${response.status}`);
  }

  const body = await response.json();
  await markSynced("app_usage", "event_id", body.accepted?.usageEventIds || []);
  await markSynced("phone_calls", "event_id", body.accepted?.phoneCallIds || []);
  await markSynced("whatsapp_calls", "event_id", body.accepted?.whatsappCallIds || []);
  await markSynced("french_sessions", "session_id", body.accepted?.frenchSessionIds || []);
  await setState("last_sync_at", Date.now());

  return { ok: true, skipped: false, accepted: body.accepted || {} };
}
