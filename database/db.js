import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "french_made_simple_tracker.db";
const DATABASE_VERSION = 1;

let databasePromise = null;

const DEFAULT_CATEGORIES = [
  ["com.whatsapp", "WhatsApp", "social"],
  ["com.whatsapp.w4b", "WhatsApp Business", "social"],
  ["com.google.android.youtube", "YouTube", "distracting"],
  ["com.instagram.android", "Instagram", "distracting"],
  ["com.zhiliaoapp.musically", "TikTok", "distracting"],
  ["com.reddit.frontpage", "Reddit", "distracting"],
  ["com.facebook.katana", "Facebook", "distracting"],
  ["com.android.chrome", "Chrome", "neutral"],
  ["com.google.android.gm", "Gmail", "productive"],
  ["com.udemy.android", "Udemy", "productive"],
  ["com.spotify.music", "Spotify", "neutral"],
  ["com.google.android.apps.maps", "Google Maps", "neutral"],
  ["com.google.android.apps.docs", "Google Drive", "productive"],
  ["com.google.android.apps.docs.editors.docs", "Google Docs", "productive"],
  ["com.openai.chatgpt", "ChatGPT", "productive"],
];

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return databasePromise;
}

export async function initDatabase() {
  const db = await getDatabase();
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  const row = await db.getFirstAsync("PRAGMA user_version");
  let version = Number(row?.user_version || 0);

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_usage (
        event_id TEXT PRIMARY KEY NOT NULL,
        package_name TEXT NOT NULL,
        app_name TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        category TEXT NOT NULL DEFAULT 'unknown',
        synced INTEGER NOT NULL DEFAULT 0,
        synced_at INTEGER,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_app_usage_started_at ON app_usage(started_at);
      CREATE INDEX IF NOT EXISTS idx_app_usage_synced ON app_usage(synced);

      CREATE TABLE IF NOT EXISTS phone_calls (
        event_id TEXT PRIMARY KEY NOT NULL,
        phone_number TEXT,
        contact_name TEXT,
        direction TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        category TEXT NOT NULL DEFAULT 'social',
        source TEXT NOT NULL DEFAULT 'call_log',
        synced INTEGER NOT NULL DEFAULT 0,
        synced_at INTEGER,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_phone_calls_started_at ON phone_calls(started_at);
      CREATE INDEX IF NOT EXISTS idx_phone_calls_synced ON phone_calls(synced);

      CREATE TABLE IF NOT EXISTS whatsapp_calls (
        event_id TEXT PRIMARY KEY NOT NULL,
        package_name TEXT NOT NULL,
        contact_label TEXT,
        direction TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        category TEXT NOT NULL DEFAULT 'social',
        source TEXT NOT NULL DEFAULT 'best_effort_notification',
        confidence TEXT NOT NULL DEFAULT 'best_effort_notification',
        synced INTEGER NOT NULL DEFAULT 0,
        synced_at INTEGER,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_whatsapp_calls_started_at ON whatsapp_calls(started_at);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_calls_synced ON whatsapp_calls(synced);

      CREATE TABLE IF NOT EXISTS french_sessions (
        session_id TEXT PRIMARY KEY NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        cards_practiced INTEGER NOT NULL DEFAULT 0,
        synced INTEGER NOT NULL DEFAULT 0,
        synced_at INTEGER,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_french_sessions_started_at ON french_sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_french_sessions_synced ON french_sessions(synced);

      CREATE TABLE IF NOT EXISTS app_categories (
        package_name TEXT PRIMARY KEY NOT NULL,
        app_name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'unknown',
        is_excluded INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tracker_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);

    const now = Date.now();
    for (const [packageName, appName, category] of DEFAULT_CATEGORIES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO app_categories
          (package_name, app_name, category, is_excluded, updated_at)
         VALUES (?, ?, ?, 0, ?)`,
        packageName,
        appName,
        category,
        now
      );
    }

    version = 1;
    await db.execAsync(`PRAGMA user_version = ${version};`);
  }

  if (version !== DATABASE_VERSION) {
    console.warn(`Tracker DB version ${version}; expected ${DATABASE_VERSION}.`);
  }

  return db;
}

export async function getState(key, fallback = null) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT value FROM tracker_state WHERE key = ?",
    key
  );
  return row?.value ?? fallback;
}

export async function setState(key, value) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO tracker_state (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value == null ? null : String(value)
  );
}

export async function getCategoryForPackage(packageName, appName = packageName) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT app_name, category, is_excluded FROM app_categories WHERE package_name = ?",
    packageName
  );

  if (row) {
    return {
      appName: row.app_name || appName,
      category: row.category,
      isExcluded: Boolean(row.is_excluded),
    };
  }

  await db.runAsync(
    `INSERT OR IGNORE INTO app_categories
      (package_name, app_name, category, is_excluded, updated_at)
     VALUES (?, ?, 'unknown', 0, ?)`,
    packageName,
    appName,
    Date.now()
  );

  return { appName, category: "unknown", isExcluded: false };
}

export async function updateAppCategory(packageName, appName, category, isExcluded = false) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_categories
      (package_name, app_name, category, is_excluded, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(package_name) DO UPDATE SET
       app_name = excluded.app_name,
       category = excluded.category,
       is_excluded = excluded.is_excluded,
       updated_at = excluded.updated_at`,
    packageName,
    appName,
    category,
    isExcluded ? 1 : 0,
    Date.now()
  );
  await db.runAsync(
    "UPDATE app_usage SET category = ? WHERE package_name = ?",
    category,
    packageName
  );
}

export async function insertUsageEvents(events) {
  const db = await getDatabase();
  const now = Date.now();
  let inserted = 0;

  for (const item of events) {
    const categoryInfo = await getCategoryForPackage(item.packageName, item.appName);
    if (categoryInfo.isExcluded) continue;

    const result = await db.runAsync(
      `INSERT OR IGNORE INTO app_usage
        (event_id, package_name, app_name, started_at, ended_at,
         duration_seconds, category, synced, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      item.eventId,
      item.packageName,
      categoryInfo.appName || item.appName || item.packageName,
      Math.round(item.startedAt),
      Math.round(item.endedAt),
      Math.max(0, Math.round(item.durationSeconds || 0)),
      categoryInfo.category,
      now
    );
    inserted += Number(result.changes || 0);
  }

  return inserted;
}

export async function insertPhoneCalls(calls) {
  const db = await getDatabase();
  const now = Date.now();
  let inserted = 0;

  for (const item of calls) {
    const result = await db.runAsync(
      `INSERT OR IGNORE INTO phone_calls
        (event_id, phone_number, contact_name, direction, started_at,
         duration_seconds, category, source, synced, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'social', ?, 0, ?)`,
      item.eventId,
      item.phoneNumber || null,
      item.contactName || null,
      item.direction || "other",
      Math.round(item.startedAt),
      Math.max(0, Math.round(item.durationSeconds || 0)),
      item.source || "call_log",
      now
    );
    inserted += Number(result.changes || 0);
  }

  return inserted;
}

export async function insertWhatsAppCalls(calls) {
  const db = await getDatabase();
  const now = Date.now();
  let inserted = 0;

  for (const item of calls) {
    const result = await db.runAsync(
      `INSERT OR IGNORE INTO whatsapp_calls
        (event_id, package_name, contact_label, direction, started_at, ended_at,
         duration_seconds, category, source, confidence, synced, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'social', ?, ?, 0, ?)`,
      item.eventId,
      item.packageName || "com.whatsapp",
      item.contactLabel || "WhatsApp contact",
      item.direction || "unknown",
      Math.round(item.startedAt),
      Math.round(item.endedAt),
      Math.max(0, Math.round(item.durationSeconds || 0)),
      item.source || "best_effort_notification",
      item.confidence || "best_effort_notification",
      now
    );
    inserted += Number(result.changes || 0);
  }

  return inserted;
}

export async function createFrenchSession(sessionId, startedAt) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO french_sessions
      (session_id, started_at, duration_seconds, cards_practiced, synced, created_at)
     VALUES (?, ?, 0, 0, 0, ?)`,
    sessionId,
    startedAt,
    Date.now()
  );
}

export async function finishFrenchSession(sessionId, endedAt) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT started_at FROM french_sessions WHERE session_id = ?",
    sessionId
  );
  if (!row) return;
  const durationSeconds = Math.max(0, Math.round((endedAt - row.started_at) / 1000));
  await db.runAsync(
    `UPDATE french_sessions
     SET ended_at = ?, duration_seconds = ?, synced = 0
     WHERE session_id = ?`,
    endedAt,
    durationSeconds,
    sessionId
  );
}

export async function incrementCurrentSessionCards(sessionId, count = 1) {
  if (!sessionId) return;
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE french_sessions
     SET cards_practiced = cards_practiced + ?, synced = 0
     WHERE session_id = ?`,
    count,
    sessionId
  );
}

export async function getUnsyncedData(limit = 250) {
  const db = await getDatabase();
  const usageEvents = await db.getAllAsync(
    "SELECT * FROM app_usage WHERE synced = 0 ORDER BY started_at ASC LIMIT ?",
    limit
  );
  const phoneCalls = await db.getAllAsync(
    "SELECT * FROM phone_calls WHERE synced = 0 ORDER BY started_at ASC LIMIT ?",
    limit
  );
  const whatsappCalls = await db.getAllAsync(
    "SELECT * FROM whatsapp_calls WHERE synced = 0 ORDER BY started_at ASC LIMIT ?",
    limit
  );
  const frenchSessions = await db.getAllAsync(
    `SELECT * FROM french_sessions
     WHERE synced = 0 AND ended_at IS NOT NULL
     ORDER BY started_at ASC LIMIT ?`,
    limit
  );
  return { usageEvents, phoneCalls, whatsappCalls, frenchSessions };
}

export async function markSynced(table, idColumn, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const allowed = {
    app_usage: "event_id",
    phone_calls: "event_id",
    whatsapp_calls: "event_id",
    french_sessions: "session_id",
  };
  if (allowed[table] !== idColumn) throw new Error("Invalid sync table");

  const db = await getDatabase();
  const syncedAt = Date.now();
  for (const id of ids) {
    await db.runAsync(
      `UPDATE ${table} SET synced = 1, synced_at = ? WHERE ${idColumn} = ?`,
      syncedAt,
      id
    );
  }
}

export async function getTodaySummary() {
  const db = await getDatabase();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();

  const usage = await db.getAllAsync(
    `SELECT category, SUM(duration_seconds) AS seconds
     FROM app_usage
     WHERE started_at >= ?
     GROUP BY category`,
    startMs
  );

  const calls = await db.getFirstAsync(
    `SELECT COALESCE(SUM(duration_seconds), 0) AS seconds, COUNT(*) AS count
     FROM phone_calls WHERE started_at >= ?`,
    startMs
  );

  const whatsappCalls = await db.getFirstAsync(
    `SELECT COALESCE(SUM(duration_seconds), 0) AS seconds, COUNT(*) AS count
     FROM whatsapp_calls WHERE started_at >= ?`,
    startMs
  );

  const french = await db.getFirstAsync(
    `SELECT COALESCE(SUM(duration_seconds), 0) AS seconds,
            COALESCE(SUM(cards_practiced), 0) AS cards
     FROM french_sessions WHERE started_at >= ?`,
    startMs
  );

  const categorySeconds = {};
  let trackedSeconds = 0;
  for (const row of usage) {
    const seconds = Number(row.seconds || 0);
    categorySeconds[row.category || "unknown"] = seconds;
    trackedSeconds += seconds;
  }

  const distractingSeconds = Number(categorySeconds.distracting || 0);
  const procrastinationScore = trackedSeconds > 0
    ? Math.round((distractingSeconds / trackedSeconds) * 100)
    : 0;

  return {
    trackedSeconds,
    categorySeconds,
    distractingSeconds,
    procrastinationScore,
    callSeconds: Number(calls?.seconds || 0),
    callCount: Number(calls?.count || 0),
    whatsappCallSeconds: Number(whatsappCalls?.seconds || 0),
    whatsappCallCount: Number(whatsappCalls?.count || 0),
    frenchSeconds: Number(french?.seconds || 0),
    cardsPracticed: Number(french?.cards || 0),
  };
}

export async function getTopApps(limit = 8) {
  const db = await getDatabase();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return db.getAllAsync(
    `SELECT package_name, app_name, category, SUM(duration_seconds) AS seconds
     FROM app_usage
     WHERE started_at >= ?
     GROUP BY package_name, app_name, category
     ORDER BY seconds DESC
     LIMIT ?`,
    start.getTime(),
    limit
  );
}

export async function getRecentPhoneCalls(limit = 8) {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT event_id, phone_number, contact_name, direction, started_at, duration_seconds, source
     FROM phone_calls ORDER BY started_at DESC LIMIT ?`,
    limit
  );
}

export async function getRecentWhatsAppCalls(limit = 8) {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT event_id, contact_label, direction, started_at, duration_seconds, source, confidence
     FROM whatsapp_calls ORDER BY started_at DESC LIMIT ?`,
    limit
  );
}

export async function getTrackedApps() {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT c.package_name, c.app_name, c.category, c.is_excluded,
            COALESCE(SUM(u.duration_seconds), 0) AS seconds
     FROM app_categories c
     LEFT JOIN app_usage u ON u.package_name = c.package_name
     GROUP BY c.package_name, c.app_name, c.category, c.is_excluded
     ORDER BY seconds DESC, c.app_name ASC`
  );
}
