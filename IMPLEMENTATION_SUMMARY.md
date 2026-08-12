# French Made Simple Tracker v1.2 — implementation summary

## Implemented

- Existing French-learning features preserved.
- Android UsageStats app-usage tracking.
- Local SQLite activity database and category editor.
- Regular Android call history when permission is available.
- Notification-based regular-call fallback.
- Best-effort WhatsApp voice/video call detection from call-like ongoing notifications.
- French study session/card-practice tracking.
- Local activity dashboard.
- SQLite-first unsynced/synced queue.
- **Automatic cloud sync only once every 7 days.**
- Manual Sync Now for deployment/testing.
- **Vercel-ready Express backend** with no persistent `app.listen()` requirement in the exported production app.
- Lazy/cached MongoDB Atlas connection suitable for serverless invocations.
- Lightweight multi-device identity: `userId`, `userName`, `deviceId`, `deviceName`.
- MongoDB `users` and `devices` collections.
- Dashboard endpoint can combine all devices for one tester or filter to one device.
- Phone numbers masked before MongoDB upload.
- Duplicate-safe MongoDB upserts.
- Ten Panda launcher icons.
- Android activity-alias icon switching.
- WorkManager-based inactivity schedule.
- Accelerated Panda test mode.
- Local APK build script (`build-apk.sh`).

## Cloud rule

```text
SQLite = daily/local collection
Vercel + MongoDB = weekly backup/analytics sync
Panda = immediate local accountability
```

The weekly uploader sends every row still marked `synced = 0`, so missing a week does not lose data.

## Tester rule

- Same profile name + different devices = one person across multiple devices.
- Different profile name = different tester/user in MongoDB.
- Each installation has its own random `deviceId`.

This is a testing identity system, not password authentication.
