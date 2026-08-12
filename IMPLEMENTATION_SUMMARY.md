# French Made Simple Tracker v1.1 — implementation summary

## Implemented

- Existing French-learning features preserved.
- Android UsageStats-based app-usage tracking.
- Local SQLite activity database and category editor.
- Regular Android call history when permission is actually available.
- Notification-based regular-call fallback when exact Call Log access is unavailable.
- Best-effort WhatsApp voice/video call detection using call-like ongoing notifications only.
- No WhatsApp chat-message collection.
- French study session/card-practice tracking.
- Local activity dashboard.
- Local-first unsynced/synced queue.
- HTTPS API sync design; MongoDB credentials remain on the server.
- Phone numbers masked before MongoDB upload.
- Node/Express/MongoDB API with duplicate-safe upserts and a dashboard summary endpoint.
- Ten Panda launcher icons.
- Android activity-alias icon switching.
- WorkManager-based inactivity schedule.
- Accelerated Panda test mode.
- Manual Panda icon test controls.
- Local APK build script (`build-apk.sh`).

## Panda production schedule

```text
< 6 hours    happy
6 hours      crying
12 hours     angry
24 hours     lonely
36 hours     furious
48 hours     please
72 hours     waiting
5 days       heartbroken
7 days       sleeping
14 days      missed
```

## Important platform limitations

- Usage tracking requires the user to enable Android **Usage Access**.
- Exact Call Log access is Android-restricted and may remain unavailable to a normally sideloaded APK. The notification fallback is therefore included.
- WhatsApp does not provide this app with an official third-party call-history API. WhatsApp call records are best-effort and depend on the current Android/WhatsApp notification format.
- Android may run WorkManager later than an exact threshold, and launchers can cache icons briefly.
- Custom Kotlin code requires a native APK/development build; Expo Go cannot test these native tracker features.
