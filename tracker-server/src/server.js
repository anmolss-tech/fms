import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "fms_tracker";
const API_TOKEN = String(process.env.TRACKER_API_TOKEN || "").trim();
const MAX_BATCH = 500;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Copy .env.example to .env and configure MongoDB Atlas.");
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db(DB_NAME);

const collections = {
  usage: db.collection("usage_events"),
  phone: db.collection("phone_calls"),
  whatsapp: db.collection("whatsapp_calls"),
  french: db.collection("french_sessions"),
  devices: db.collection("devices"),
};

await Promise.all([
  collections.usage.createIndex({ deviceId: 1, eventId: 1 }, { unique: true }),
  collections.phone.createIndex({ deviceId: 1, eventId: 1 }, { unique: true }),
  collections.whatsapp.createIndex({ deviceId: 1, eventId: 1 }, { unique: true }),
  collections.french.createIndex({ deviceId: 1, sessionId: 1 }, { unique: true }),
  collections.usage.createIndex({ deviceId: 1, startedAt: -1 }),
  collections.phone.createIndex({ deviceId: 1, startedAt: -1 }),
  collections.whatsapp.createIndex({ deviceId: 1, startedAt: -1 }),
  collections.french.createIndex({ deviceId: 1, startedAt: -1 }),
  collections.devices.createIndex({ deviceId: 1 }, { unique: true }),
]);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

function requireToken(req, res, next) {
  if (!API_TOKEN) return next();
  const value = String(req.headers.authorization || "");
  if (value !== `Bearer ${API_TOKEN}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  next();
}

function safeArray(value) {
  return Array.isArray(value) ? value.slice(0, MAX_BATCH) : [];
}

function asFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanText(value, maxLength = 200) {
  if (value == null) return null;
  return String(value).trim().slice(0, maxLength);
}

function normalizeUsage(item, deviceId) {
  const eventId = cleanText(item?.eventId, 120);
  if (!eventId) return null;
  return {
    deviceId,
    eventId,
    packageName: cleanText(item.packageName, 200) || "unknown",
    appName: cleanText(item.appName, 200) || "Unknown app",
    category: cleanText(item.category, 40) || "unknown",
    startedAt: new Date(asFiniteNumber(item.startedAt)),
    endedAt: new Date(asFiniteNumber(item.endedAt)),
    durationSeconds: Math.max(0, Math.round(asFiniteNumber(item.durationSeconds))),
    updatedAt: new Date(),
  };
}

function normalizePhone(item, deviceId) {
  const eventId = cleanText(item?.eventId, 120);
  if (!eventId) return null;
  return {
    deviceId,
    eventId,
    phoneNumberMasked: cleanText(item.phoneNumberMasked, 30),
    contactName: cleanText(item.contactName, 200),
    direction: cleanText(item.direction, 40) || "other",
    category: cleanText(item.category, 40) || "social",
    source: cleanText(item.source, 80) || "call_log",
    startedAt: new Date(asFiniteNumber(item.startedAt)),
    durationSeconds: Math.max(0, Math.round(asFiniteNumber(item.durationSeconds))),
    updatedAt: new Date(),
  };
}

function normalizeWhatsApp(item, deviceId) {
  const eventId = cleanText(item?.eventId, 120);
  if (!eventId) return null;
  return {
    deviceId,
    eventId,
    packageName: cleanText(item.packageName, 200) || "com.whatsapp",
    contactLabel: cleanText(item.contactLabel, 200),
    direction: cleanText(item.direction, 40) || "unknown",
    category: cleanText(item.category, 40) || "social",
    source: cleanText(item.source, 80) || "best_effort_notification",
    confidence: cleanText(item.confidence, 80) || "best_effort_notification",
    startedAt: new Date(asFiniteNumber(item.startedAt)),
    endedAt: new Date(asFiniteNumber(item.endedAt)),
    durationSeconds: Math.max(0, Math.round(asFiniteNumber(item.durationSeconds))),
    updatedAt: new Date(),
  };
}

function normalizeFrench(item, deviceId) {
  const sessionId = cleanText(item?.sessionId, 120);
  if (!sessionId) return null;
  return {
    deviceId,
    sessionId,
    startedAt: new Date(asFiniteNumber(item.startedAt)),
    endedAt: new Date(asFiniteNumber(item.endedAt)),
    durationSeconds: Math.max(0, Math.round(asFiniteNumber(item.durationSeconds))),
    cardsPracticed: Math.max(0, Math.round(asFiniteNumber(item.cardsPracticed))),
    updatedAt: new Date(),
  };
}

async function upsertMany(collection, records, idField) {
  if (!records.length) return [];
  const operations = records.map((record) => ({
    updateOne: {
      filter: { deviceId: record.deviceId, [idField]: record[idField] },
      update: {
        $set: record,
        $setOnInsert: { createdAt: new Date() },
      },
      upsert: true,
    },
  }));
  await collection.bulkWrite(operations, { ordered: false });
  return records.map((record) => record[idField]);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, database: DB_NAME, time: new Date().toISOString() });
});

app.get("/api/v1/dashboard/summary", requireToken, async (req, res) => {
  try {
    const deviceId = cleanText(req.query?.deviceId, 160);
    if (!deviceId) {
      return res.status(400).json({ ok: false, error: "deviceId is required" });
    }

    const requestedDays = Math.round(asFiniteNumber(req.query?.days, 7));
    const days = Math.min(90, Math.max(1, requestedDays));
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match = { deviceId, startedAt: { $gte: from } };

    const [categoryRows, appRows, phoneRows, whatsappRows, frenchRows] = await Promise.all([
      collections.usage.aggregate([
        { $match: match },
        { $group: { _id: "$category", seconds: { $sum: "$durationSeconds" } } },
        { $sort: { seconds: -1 } },
      ]).toArray(),
      collections.usage.aggregate([
        { $match: match },
        { $group: { _id: { packageName: "$packageName", appName: "$appName", category: "$category" }, seconds: { $sum: "$durationSeconds" } } },
        { $sort: { seconds: -1 } },
        { $limit: 12 },
      ]).toArray(),
      collections.phone.aggregate([
        { $match: match },
        { $group: { _id: null, seconds: { $sum: "$durationSeconds" }, count: { $sum: 1 } } },
      ]).toArray(),
      collections.whatsapp.aggregate([
        { $match: match },
        { $group: { _id: null, seconds: { $sum: "$durationSeconds" }, count: { $sum: 1 } } },
      ]).toArray(),
      collections.french.aggregate([
        { $match: match },
        { $group: { _id: null, seconds: { $sum: "$durationSeconds" }, cards: { $sum: "$cardsPracticed" }, sessions: { $sum: 1 } } },
      ]).toArray(),
    ]);

    const categories = Object.fromEntries(
      categoryRows.map((row) => [row._id || "unknown", row.seconds || 0])
    );
    const trackedSeconds = Object.values(categories).reduce((sum, value) => sum + Number(value || 0), 0);
    const distractingSeconds = Number(categories.distracting || 0);
    const procrastinationScore = trackedSeconds > 0
      ? Math.round((distractingSeconds / trackedSeconds) * 100)
      : 0;

    res.json({
      ok: true,
      deviceId,
      days,
      from: from.toISOString(),
      to: new Date().toISOString(),
      trackedSeconds,
      distractingSeconds,
      procrastinationScore,
      categories,
      topApps: appRows.map((row) => ({
        packageName: row._id.packageName,
        appName: row._id.appName,
        category: row._id.category,
        seconds: row.seconds || 0,
      })),
      phoneCalls: phoneRows[0] || { seconds: 0, count: 0 },
      whatsappCalls: whatsappRows[0] || { seconds: 0, count: 0 },
      french: frenchRows[0] || { seconds: 0, cards: 0, sessions: 0 },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ ok: false, error: "Dashboard summary failed" });
  }
});

app.post("/api/v1/sync/batch", requireToken, async (req, res) => {
  try {
    const deviceId = cleanText(req.body?.deviceId, 160);
    if (!deviceId) {
      return res.status(400).json({ ok: false, error: "deviceId is required" });
    }

    const usage = safeArray(req.body.usageEvents)
      .map((item) => normalizeUsage(item, deviceId))
      .filter(Boolean);
    const phone = safeArray(req.body.phoneCalls)
      .map((item) => normalizePhone(item, deviceId))
      .filter(Boolean);
    const whatsapp = safeArray(req.body.whatsappCalls)
      .map((item) => normalizeWhatsApp(item, deviceId))
      .filter(Boolean);
    const french = safeArray(req.body.frenchSessions)
      .map((item) => normalizeFrench(item, deviceId))
      .filter(Boolean);

    const [usageEventIds, phoneCallIds, whatsappCallIds, frenchSessionIds] =
      await Promise.all([
        upsertMany(collections.usage, usage, "eventId"),
        upsertMany(collections.phone, phone, "eventId"),
        upsertMany(collections.whatsapp, whatsapp, "eventId"),
        upsertMany(collections.french, french, "sessionId"),
      ]);

    await collections.devices.updateOne(
      { deviceId },
      {
        $set: {
          deviceId,
          lastSyncAt: new Date(),
          lastSeenIp: req.ip,
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    res.json({
      ok: true,
      accepted: {
        usageEventIds,
        phoneCallIds,
        whatsappCallIds,
        frenchSessionIds,
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ ok: false, error: "Sync failed" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`FMS tracker API listening on port ${PORT}`);
  console.log(`MongoDB database: ${DB_NAME}`);
});

async function shutdown() {
  server.close(async () => {
    await client.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
