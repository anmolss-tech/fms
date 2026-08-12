# French Made Simple Tracker API

Small Node/Express API used by the personal procrastination tracker. The APK never contains MongoDB credentials; it sends unsynced SQLite rows to this API over HTTPS.

## Setup

```bash
cd tracker-server
cp .env.example .env
npm install
npm start
```

Set these values in `.env`:

- `MONGODB_URI` – MongoDB Atlas connection string for a database user with read/write access.
- `MONGODB_DB` – defaults to `fms_tracker`.
- `TRACKER_API_TOKEN` – long random token; enter the same token in **My Activity → Tracker Settings** in the APK.
- `PORT` – defaults to `4000`.

## Collections

The server creates/uses these automatically on first startup/sync:

- `usage_events`
- `phone_calls`
- `whatsapp_calls`
- `french_sessions`
- `devices`

It also creates unique indexes so retrying the same local event does not duplicate it.

## Endpoints

- `GET /health`
- `POST /api/v1/sync/batch`
- `GET /api/v1/dashboard/summary?deviceId=...&days=7` — ready for the future web dashboard (1–90 days)

For a phone outside your home network, deploy this folder to an HTTPS Node host (Railway, Render, Fly.io, etc.) and place that public HTTPS URL in the app's Tracker Settings.
