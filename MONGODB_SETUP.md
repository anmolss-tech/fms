# MongoDB Atlas setup — French Made Simple Tracker

The APK never connects directly to MongoDB. The included `tracker-server/` Node/Express API owns the MongoDB connection and accepts batched syncs from the phone.

## Database

Use this database name:

```text
fms_tracker
```

You do **not** have to manually create documents. The server creates/uses the collections and writes the first documents when it starts/syncs.

## Collections

```text
usage_events
phone_calls
whatsapp_calls
french_sessions
devices
```

The server creates unique indexes automatically:

- `usage_events`: `{ deviceId, eventId }`
- `phone_calls`: `{ deviceId, eventId }`
- `whatsapp_calls`: `{ deviceId, eventId }`
- `french_sessions`: `{ deviceId, sessionId }`
- `devices`: `{ deviceId }`

This makes retries idempotent instead of duplicating activity records.

## Example document shapes

### `usage_events`

```json
{
  "deviceId": "device-...",
  "eventId": "...",
  "packageName": "com.google.android.youtube",
  "appName": "YouTube",
  "category": "distracting",
  "startedAt": "MongoDB Date",
  "endedAt": "MongoDB Date",
  "durationSeconds": 1260
}
```

### `phone_calls`

```json
{
  "deviceId": "device-...",
  "eventId": "...",
  "phoneNumberMasked": "***1234",
  "contactName": "Contact name if available",
  "direction": "incoming",
  "category": "social",
  "source": "call_log",
  "startedAt": "MongoDB Date",
  "durationSeconds": 900
}
```

The APK keeps a full regular phone number only in local SQLite. The cloud payload masks it before upload.

### `whatsapp_calls`

```json
{
  "deviceId": "device-...",
  "eventId": "...",
  "packageName": "com.whatsapp",
  "contactLabel": "Contact label if Android exposes it",
  "direction": "unknown",
  "category": "social",
  "source": "best_effort_notification",
  "confidence": "best_effort_notification",
  "startedAt": "MongoDB Date",
  "endedAt": "MongoDB Date",
  "durationSeconds": 1200
}
```

### `french_sessions`

```json
{
  "deviceId": "device-...",
  "sessionId": "session-...",
  "startedAt": "MongoDB Date",
  "endedAt": "MongoDB Date",
  "durationSeconds": 1800,
  "cardsPracticed": 42
}
```

### `devices`

```json
{
  "deviceId": "device-...",
  "lastSyncAt": "MongoDB Date",
  "lastSeenIp": "server-observed IP"
}
```

## Atlas steps

1. Create/open an Atlas cluster.
2. Create a database user with read/write access to `fms_tracker`.
3. Configure Atlas Network Access for the server that will run `tracker-server/`.
4. In `tracker-server/`, copy `.env.example` to `.env`.
5. Set `MONGODB_URI`, `MONGODB_DB=fms_tracker`, and a long random `TRACKER_API_TOKEN`.
6. Run `npm install` and `npm start`.
7. Deploy the server to an HTTPS Node host before syncing from a phone over the internet.
8. In the APK, open **My Activity → Tracker setup** and enter the public HTTPS server URL plus the same token.

The server also exposes:

```text
GET /health
POST /api/v1/sync/batch
GET /api/v1/dashboard/summary?deviceId=YOUR_DEVICE_ID&days=7
```

The summary endpoint is included so a future web dashboard can retrieve category totals, top apps, calls, French practice, and procrastination score without querying Atlas directly from the browser.
