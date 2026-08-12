# MongoDB Atlas setup — French Made Simple Tracker v1.2

The APK never connects directly to MongoDB. SQLite logs locally; the included Vercel-friendly `tracker-server/` API receives weekly batches.

## Database

Use:

```text
fms_tracker
```

You do **not** need to manually create documents or collections. MongoDB creates them as the first sync writes data, and the API creates the required indexes.

## Collections

```text
users
devices
usage_events
phone_calls
whatsapp_calls
french_sessions
```

### `users`

One document per tester/profile:

```json
{
  "userId": "anmol",
  "userName": "Anmol",
  "lastSyncAt": "MongoDB Date",
  "createdAt": "MongoDB Date"
}
```

### `devices`

One document per APK installation:

```json
{
  "deviceId": "device-...",
  "deviceName": "Pixel 9",
  "userId": "anmol",
  "userName": "Anmol",
  "lastSyncAt": "MongoDB Date",
  "lastSeenIp": "server-observed IP"
}
```

### `usage_events`

```json
{
  "userId": "anmol",
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
  "userId": "anmol",
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

The APK keeps the full regular phone number only in local SQLite. The cloud payload masks it before upload.

### `whatsapp_calls`

```json
{
  "userId": "anmol",
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
  "userId": "anmol",
  "deviceId": "device-...",
  "sessionId": "session-...",
  "startedAt": "MongoDB Date",
  "endedAt": "MongoDB Date",
  "durationSeconds": 1800,
  "cardsPracticed": 42
}
```

## Indexes created by the API

Duplicate protection:

- `usage_events`: `{ deviceId, eventId }` unique
- `phone_calls`: `{ deviceId, eventId }` unique
- `whatsapp_calls`: `{ deviceId, eventId }` unique
- `french_sessions`: `{ deviceId, sessionId }` unique
- `users`: `{ userId }` unique
- `devices`: `{ deviceId }` unique

Analytics indexes are also created on `userId + startedAt` so the future dashboard can combine all devices for a user efficiently.

## Vercel Environment Variables

Configure:

```text
MONGODB_URI
MONGODB_DB=fms_tracker
TRACKER_API_TOKEN
```

See `VERCEL_DEPLOY.md`.

## Dashboard-ready endpoints

List profiles:

```text
GET /api/v1/users
```

List devices for a profile:

```text
GET /api/v1/devices?userId=anmol
```

Aggregate all devices belonging to a profile:

```text
GET /api/v1/dashboard/summary?userId=anmol&days=7
```

Or one specific installation:

```text
GET /api/v1/dashboard/summary?userId=anmol&deviceId=device-...&days=7
```
