# Deploy `tracker-server` to Vercel

The tracker backend is now designed for Vercel's Express/serverless runtime. SQLite still collects on the phone; Vercel is contacted only for the weekly MongoDB batch (or when you manually press Sync Now while testing).

## 1. Push the project to GitHub

The repository can contain the whole `fms/` project. Vercel only needs the backend folder.

## 2. Import the repository in Vercel

In the Vercel project setup screen choose:

```text
Root Directory: tracker-server
```

Leave the framework detection/default build settings alone unless Vercel asks otherwise.

## 3. Add Environment Variables

Add these for Production (and Preview if you want preview deployments to work):

```text
MONGODB_URI = mongodb+srv://...
MONGODB_DB = fms_tracker
TRACKER_API_TOKEN = your long random token
```

Generate a token on macOS with:

```bash
openssl rand -hex 32
```

Do not add your real `.env` file to Git.

## 4. MongoDB Atlas network access

Your Atlas cluster must allow connections from the Vercel deployment. During personal testing, configure Atlas Network Access appropriately for your deployment. Keep the database username/password only in Vercel Environment Variables.

## 5. Deploy

Vercel should deploy the exported Express application from `tracker-server/index.js`.

The production URL will look similar to:

```text
https://fms-tracker.vercel.app
```

## 6. Test the deployment

```bash
curl https://fms-tracker.vercel.app/health
```

Expected shape:

```json
{
  "ok": true,
  "database": "fms_tracker",
  "hosting": "vercel",
  "time": "..."
}
```

## 7. Configure each Android test device

On every phone open:

```text
French Made Simple
→ My Activity
→ Tracker setup
```

For the same person on two devices:

```text
Profile name: Anmol
Device name: Pixel 9
```

and on another phone:

```text
Profile name: Anmol
Device name: Motorola Edge
```

Both devices share the cloud `userId` (`anmol`) but keep different random `deviceId` values.

For a different tester:

```text
Profile name: Friend Raj
Device name: Motorola G
```

which becomes a separate cloud user.

Then enter:

```text
Tracker API URL: https://fms-tracker.vercel.app
API token: exactly the same TRACKER_API_TOKEN configured in Vercel
```

## 8. Weekly sync behavior

Normal operation:

```text
Android activity → SQLite every day
                     ↓
                keep unsynced
                     ↓
          seven-day interval becomes due
                     ↓
       next foreground of French Made Simple
                     ↓
                  Vercel
                     ↓
                MongoDB Atlas
```

The app sends **all rows still marked `synced = 0`**, not merely the most recent seven days. If a phone misses a week or has no internet, the history remains in SQLite and is uploaded on a later successful sync.

For initial testing, press:

```text
Collect + Sync Now (testing only)
```

That bypasses the seven-day wait and resets the next automatic sync to seven days after the manual test.
