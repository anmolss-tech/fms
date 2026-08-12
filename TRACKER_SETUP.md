# French Made Simple — Procrastination Tracker v1.2

This version keeps the Android-first tracker and adds:

- Vercel-ready Express backend.
- Weekly MongoDB cloud synchronization instead of syncing on every app visit.
- Multi-device/tester identity using a simple profile name + device name.
- `users` and `devices` MongoDB collections for later dashboards.

## Local-first rule

```text
Android usage/calls → SQLite every day
                        ↓
                    synced = 0
                        ↓
               once every 7 days
                        ↓
                    Vercel API
                        ↓
                   MongoDB Atlas
```

If the weekly upload is missed, unsynced history stays on the phone and is sent later. Panda behavior never depends on the cloud.

## Tester identity

For the same person using two phones, use the same profile name:

```text
Anmol + Pixel 9
Anmol + Motorola Edge
```

The app creates the same cloud `userId` from `Anmol`, but each installation keeps a separate random `deviceId`.

For another tester:

```text
Raj + Motorola G
```

Use a different profile name.

This is deliberately not a password/login system yet. It is a lightweight testing identity so 2–3 devices can be separated in MongoDB and later in a dashboard.

## First phone setup

Open **My Activity → Tracker setup**.

1. Enable **Usage Access**.
2. Try **Call Log** for exact regular-call history.
3. Optionally allow **Contacts** for contact names.
4. Enable **Notification Access** for best-effort WhatsApp-call detection and regular-call fallback.
5. Save **Profile name** and **Device name**.
6. Enter the Vercel tracker base URL and matching API token.
7. Press **Collect + Sync Now (testing only)** once to verify the entire path.
8. After testing, normal automatic cloud sync occurs every 7 days.

## SQLite database

Database:

```text
french_made_simple_tracker.db
```

Tables:

- `app_usage`
- `phone_calls`
- `whatsapp_calls`
- `french_sessions`
- `app_categories`
- `tracker_state`

`tracker_state` also stores the local profile, device label and weekly-sync timestamps.

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

The Panda system is local/native and remains independent of Vercel or MongoDB.

## WhatsApp-call limitation

WhatsApp does not provide an official third-party call-history API. Tracking remains a best-effort interpretation of call-like ongoing Android notifications. It does not read WhatsApp chats, use Accessibility scraping, or capture the screen.

## Build APK

```bash
chmod +x build-apk.sh
./build-apk.sh
```

or:

```bash
npm run build:apk
```

Output:

```text
build-output/French-Made-Simple-Tracker-v1.2.0.apk
```

## Backend deployment

Use `VERCEL_DEPLOY.md` for Vercel and `MONGODB_SETUP.md` for MongoDB collections/document shapes.
