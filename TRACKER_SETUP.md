# French Made Simple — Procrastination Tracker v1.1

This version adds a personal, Android-first activity tracker around the existing French learning app.

## What is included

- Android app-usage collection using the system Usage Stats service.
- Local SQLite history for app usage, regular calls, best-effort WhatsApp calls, French sessions, categories, and sync state.
- Regular call-log import (incoming/outgoing/missed etc.) when Android grants Call Log permission. `READ_CALL_LOG` is hard-restricted on modern Android, so a normally sideloaded APK may be unable to receive it; this build also includes a conservative call-notification fallback through Notification Access.
- Optional contact-name matching after you grant Contacts permission.
- Best-effort WhatsApp call detection through Android Notification Access. It only reacts to WhatsApp call-like ongoing notifications; it does **not** read/store WhatsApp chat messages. WhatsApp/Android changes can make this incomplete.
- Local app classification: Distracting, Productive, Social, Neutral, Uncategorized, or Ignore.
- Today's procrastination score based on app time you classify as Distracting.
- Local-first MongoDB synchronization through the included Node/Express API. MongoDB credentials are never embedded in the APK.
- Dynamic Panda launcher icons driven by time since French Made Simple left the foreground.
- Accelerated Panda test mode and manual icon buttons.
- A one-command local APK builder: `./build-apk.sh`.

## Panda production timeline

- under 6h: Happy
- 6h: Crying
- 12h: Angry
- 24h: Lonely
- 36h: Furious
- 48h: Please come back
- 72h: Waiting
- 5 days: Heartbroken
- 7 days: Sleeping
- 14 days: Missed you

Android schedules these as deferred background jobs, so launcher changes can happen somewhat later than the exact threshold depending on battery/system scheduling and launcher refresh behavior.

## First APK setup on the phone

Open **My Activity → Permissions, MongoDB sync & Panda test**.

1. **Usage Access** → enable French Made Simple.
2. **Call Log** → try granting it for exact regular-call history. Modern Android may refuse this restricted permission to a sideloaded APK.
3. **Contacts** → optional; used only with exact Call Log records to resolve names.
4. **Notification Access** → recommended for best-effort WhatsApp calls and as a fallback for regular call notifications.
5. Configure your Tracker API URL/token only after the server is deployed.

The tracker works locally without MongoDB.

## SQLite database

Database: `french_made_simple_tracker.db`

Tables:

- `app_usage`
- `phone_calls`
- `whatsapp_calls`
- `french_sessions`
- `app_categories`
- `tracker_state`

Rows are stored locally first. Cloud-eligible rows have `synced = 0` until the server acknowledges them.

## MongoDB sync

The APK sends data to the included `tracker-server`; it does not connect directly to MongoDB Atlas.

Server collections:

- `usage_events`
- `phone_calls`
- `whatsapp_calls`
- `french_sessions`
- `devices`

Regular phone numbers are masked before cloud upload (`***1234`). Full numbers remain local in SQLite.

See `tracker-server/README.md` for server setup.

## Build the APK

Prerequisites already used by the previous working local build:

- Node/npm
- Java
- Android SDK
- EAS CLI and Expo login

Run:

```bash
chmod +x build-apk.sh
./build-apk.sh
```

or:

```bash
npm run build:apk
```

The script runs `npm install`, `expo-doctor`, an Android JS export check, then a local EAS `preview` APK build. The final APK is placed in:

```text
build-output/French-Made-Simple-Tracker-v1.1.0.apk
```

## Testing Panda icons quickly

In **Tracker Settings**, enable **Accelerated test mode**.

- 30 seconds: crying
- 60 seconds: angry
- 90 seconds: lonely
- 120 seconds: furious
- 150 seconds: please
- 180 seconds: waiting
- 210 seconds: heartbroken
- 240 seconds: sleeping
- 270 seconds: missed-you

Put the app in the background and watch the launcher. Turn test mode OFF when finished.

You can also tap each Panda-state button to test launcher aliases manually.

## Important WhatsApp limitation

WhatsApp does not provide this app with a supported API for call history/counterpart details. This build therefore uses a conservative Notification Listener fallback only for call-like ongoing WhatsApp notifications. Depending on WhatsApp version, Android version, privacy/redaction behavior, and the notification format, it may:

- miss some calls,
- show an unknown direction/contact,
- measure ringing + connected time rather than exact connected-call duration.

The app intentionally does not use Accessibility scraping, screen capture, message-reading, or invasive WhatsApp UI parsing.

## Expo Go limitation

The French-learning screens can still be JavaScript-tested normally, but UsageStats, CallLog, WhatsApp notification listening, WorkManager, and launcher alias switching require the custom native APK/development build. Expo Go cannot include those custom Kotlin classes.

For exact Atlas collection/document setup, see **`MONGODB_SETUP.md`**.
