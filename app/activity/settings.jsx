import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import PandaBanner from "../../components/PandaBanner";
import { COLORS } from "../../constants/theme";
import {
  getDeviceLabel,
  getPandaStatus,
  hasCallLogPermission,
  hasContactsPermission,
  hasNotificationListenerAccess,
  hasUsageAccess,
  isNativeTrackerAvailable,
  openNotificationListenerSettings,
  openUsageAccessSettings,
  setPandaIcon,
  setPandaTestMode,
} from "../../services/nativeTracker";
import { refreshTracker } from "../../services/refreshService";
import {
  getSyncConfig,
  getWeeklySyncStatus,
  saveProfileConfig,
  saveSyncConfig,
  syncUnsyncedData,
} from "../../services/syncService";

const PANDA_STATES = [
  "happy",
  "crying",
  "angry",
  "lonely",
  "furious",
  "please",
  "waiting",
  "heartbroken",
  "sleeping",
  "missed",
];

function readableTime(value) {
  return value ? new Date(value).toLocaleString() : "Never";
}

export default function TrackerSettingsScreen() {
  const [usageAccess, setUsageAccess] = useState(false);
  const [callAccess, setCallAccess] = useState(false);
  const [contactsAccess, setContactsAccess] = useState(false);
  const [notificationAccess, setNotificationAccess] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [pandaState, setPandaState] = useState("happy");
  const [weeklySync, setWeeklySync] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [usage, calls, contacts, notifications, syncConfig, panda, syncStatus, nativeDeviceLabel] = await Promise.all([
      hasUsageAccess(),
      hasCallLogPermission(),
      hasContactsPermission(),
      hasNotificationListenerAccess(),
      getSyncConfig(),
      getPandaStatus(),
      getWeeklySyncStatus(),
      getDeviceLabel().catch(() => "Android device"),
    ]);

    setUsageAccess(Boolean(usage));
    setCallAccess(Boolean(calls));
    setContactsAccess(Boolean(contacts));
    setNotificationAccess(Boolean(notifications));
    setApiUrl(syncConfig.apiUrl || "");
    setToken(syncConfig.token || "");
    setUserName(syncConfig.userName || "");
    setUserId(syncConfig.userId || "");
    setDeviceName(syncConfig.deviceName || nativeDeviceLabel || "Android device");
    setDeviceId(syncConfig.deviceId || "");
    setTestMode(Boolean(panda?.testMode));
    setPandaState(panda?.state || "happy");
    setWeeklySync(syncStatus);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => console.log("Settings load failed:", error));
    }, [load])
  );

  async function requestCallLog() {
    if (Platform.OS !== "android") return;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      {
        title: "Call history for time tracking",
        message: "French Made Simple uses your call history to show how long regular phone calls took. Data is stored locally first.",
        buttonPositive: "Allow",
        buttonNegative: "Not now",
      }
    );
    setCallAccess(result === PermissionsAndroid.RESULTS.GRANTED);
  }

  async function requestContacts() {
    if (Platform.OS !== "android") return;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: "Match calls to contact names",
        message: "Optional: allow contact access so call records can show names instead of only numbers.",
        buttonPositive: "Allow",
        buttonNegative: "Not now",
      }
    );
    setContactsAccess(result === PermissionsAndroid.RESULTS.GRANTED);
  }

  async function saveProfile() {
    setBusy(true);
    try {
      const profile = await saveProfileConfig(userName, deviceName);
      setUserId(profile.userId);
      setDeviceId(profile.deviceId);
      Alert.alert(
        "Profile saved",
        "Use the same profile name on another device if it belongs to the same person. Use a different profile name for a different tester."
      );
    } catch (error) {
      Alert.alert("Could not save profile", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveCloudSettings() {
    setBusy(true);
    try {
      await saveSyncConfig(apiUrl, token);
      await load();
      Alert.alert(
        "Saved",
        "Vercel API settings were saved. Automatic MongoDB upload runs only once every 7 days; SQLite keeps collecting locally every day."
      );
    } catch (error) {
      Alert.alert("Could not save", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function syncNow() {
    setBusy(true);
    try {
      await refreshTracker({ sync: false });
      const result = await syncUnsyncedData({ force: true });
      if (result.ok) {
        Alert.alert(
          "Manual sync complete",
          `${result.reason || "SQLite records were synchronized."}\n\nThis manual test resets the next automatic weekly sync to 7 days from now.`
        );
      } else {
        Alert.alert("Sync not completed", result.reason || result.error || "Check the profile and API settings.");
      }
      await load();
    } catch (error) {
      Alert.alert("Sync failed", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function changePanda(state) {
    try {
      const next = await setPandaIcon(state);
      setPandaState(next);
    } catch (error) {
      Alert.alert("Panda icon failed", error.message);
    }
  }

  async function toggleTestMode(value) {
    await setPandaTestMode(value);
    setTestMode(value);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PandaBanner
        title="Tracker setup"
        subtitle="SQLite logs locally every day. MongoDB receives a weekly batch through your Vercel API."
      />

      {!isNativeTrackerAvailable() ? (
        <InfoBox title="APK required" text="The custom Kotlin tracker is not available in Expo Go." />
      ) : null}

      <Section title="1. Android permissions" />
      <PermissionRow
        title="Usage Access"
        description="Needed for WhatsApp, YouTube, Instagram, Chrome and other app-time history."
        ready={usageAccess}
        button="Open Usage Access"
        onPress={openUsageAccessSettings}
      />
      <PermissionRow
        title="Regular call history"
        description="Attempts exact Android call-log import. On modern Android this permission is hard-restricted and a sideloaded APK may not receive it; Notification Access provides a best-effort call-notification fallback."
        ready={callAccess}
        button="Allow Call Log"
        onPress={requestCallLog}
      />
      <PermissionRow
        title="Contact names (optional)"
        description="Matches regular call numbers to saved contact names when Android did not cache the name."
        ready={contactsAccess}
        button="Allow Contacts"
        onPress={requestContacts}
      />
      <PermissionRow
        title="Call Notification Access (best effort)"
        description="Used as the WhatsApp-call detector and as a fallback for regular call notifications when Call Log is unavailable. It stores only call-like ongoing notification metadata, not WhatsApp chat messages."
        ready={notificationAccess}
        button="Open Notification Access"
        onPress={openNotificationListenerSettings}
      />

      <Section title="2. Tester profile & device" />
      <InfoBox
        title="Simple multi-device identity"
        text="Use the same profile name on multiple devices for the same person (for example Anmol). Use a different profile name for another tester. Each installation receives its own private Device ID. For v1.2, keep one tester profile per installation once tracking has started."
      />
      <Text style={styles.label}>Profile name</Text>
      <TextInput
        style={styles.input}
        value={userName}
        onChangeText={setUserName}
        autoCapitalize="words"
        autoCorrect={false}
        placeholder="Anmol"
        placeholderTextColor={COLORS.grey}
      />
      <Text style={styles.label}>Device name</Text>
      <TextInput
        style={styles.input}
        value={deviceName}
        onChangeText={setDeviceName}
        autoCapitalize="words"
        autoCorrect={false}
        placeholder="Pixel 9"
        placeholderTextColor={COLORS.grey}
      />
      <Text style={styles.helper}>Cloud User ID: {userId || "created after Save profile"}</Text>
      <Text style={styles.helper}>Installation Device ID: {deviceId || "creating…"}</Text>
      <Pressable style={styles.primaryButton} onPress={saveProfile} disabled={busy}>
        <Text style={styles.primaryText}>Save profile</Text>
      </Pressable>

      <Section title="3. Weekly MongoDB sync through Vercel" />
      <InfoBox
        title="Vercel-friendly serverless sync"
        text="Enter the HTTPS URL Vercel gives to tracker-server. The phone keeps raw activity in SQLite and automatically uploads unsynced rows only when the 7-day sync interval is due."
      />
      <Text style={styles.label}>Tracker API URL</Text>
      <TextInput
        style={styles.input}
        value={apiUrl}
        onChangeText={setApiUrl}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="https://fms-tracker.vercel.app"
        placeholderTextColor={COLORS.grey}
      />
      <Text style={styles.label}>API token</Text>
      <TextInput
        style={styles.input}
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholder="same TRACKER_API_TOKEN as Vercel"
        placeholderTextColor={COLORS.grey}
      />
      <Text style={styles.helper}>Last successful cloud sync: {readableTime(weeklySync?.lastSuccessfulSyncAt)}</Text>
      <Text style={styles.helper}>Next automatic sync: {readableTime(weeklySync?.nextSyncAt)}</Text>
      <Text style={styles.helper}>Weekly status: {weeklySync?.due ? "Due" : "SQLite logging locally; cloud sync not due yet"}</Text>
      <Pressable style={styles.primaryButton} onPress={saveCloudSettings} disabled={busy}>
        <Text style={styles.primaryText}>Save Vercel sync settings</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={syncNow} disabled={busy}>
        <Text style={styles.secondaryText}>{busy ? "Working…" : "Collect + Sync Now (testing only)"}</Text>
      </Pressable>
      <Text style={styles.helper}>Manual Sync Now bypasses the weekly timer so you can verify Vercel + MongoDB before waiting seven days.</Text>

      <Section title="4. Panda launcher icon" />
      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>Accelerated test mode</Text>
          <Text style={styles.rowSub}>30s → crying, 60s → angry … 270s → missed. Turn OFF before normal use.</Text>
        </View>
        <Switch
          value={testMode}
          onValueChange={toggleTestMode}
          trackColor={{ false: COLORS.lightGrey, true: COLORS.sage }}
          thumbColor={testMode ? COLORS.royalGreen : COLORS.grey}
        />
      </View>
      <Text style={styles.helper}>Current icon state: {pandaState}</Text>
      <View style={styles.pandaGrid}>
        {PANDA_STATES.map((state) => (
          <Pressable
            key={state}
            style={[styles.pandaButton, pandaState === state ? styles.pandaButtonSelected : null]}
            onPress={() => changePanda(state)}
          >
            <Text style={styles.pandaButtonText}>{state}</Text>
          </Pressable>
        ))}
      </View>

      <InfoBox
        title="Production timeline"
        text="Happy <6h · Crying 6h · Angry 12h · Lonely 24h · Furious 36h · Please 48h · Waiting 72h · Heartbroken 5d · Sleeping 7d · Missed-you 14d."
      />
    </ScrollView>
  );
}

function Section({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function PermissionRow({ title, description, ready, button, onPress }) {
  return (
    <View style={styles.card}>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{description}</Text>
        <Text style={[styles.permissionStatus, ready ? styles.good : styles.bad]}>
          {ready ? "Ready" : "Needs setup"}
        </Text>
      </View>
      <Pressable style={styles.smallButton} onPress={onPress}>
        <Text style={styles.smallButtonText}>{button}</Text>
      </Pressable>
    </View>
  );
}

function InfoBox({ title, text }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: COLORS.cypress, fontSize: 19, fontWeight: "900", marginTop: 16, marginBottom: 9 },
  card: { backgroundColor: COLORS.cardCream, borderColor: COLORS.line, borderWidth: 1, borderRadius: 15, padding: 12, marginBottom: 9, flexDirection: "row", alignItems: "center" },
  flex: { flex: 1, paddingRight: 10 },
  rowTitle: { color: COLORS.cypress, fontWeight: "900", fontSize: 14 },
  rowSub: { color: COLORS.mutedText, fontSize: 11, lineHeight: 16, marginTop: 4 },
  permissionStatus: { fontSize: 11, fontWeight: "900", marginTop: 6 },
  good: { color: COLORS.royalGreen },
  bad: { color: COLORS.error },
  smallButton: { backgroundColor: COLORS.cypress, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10, maxWidth: 130 },
  smallButtonText: { color: COLORS.cream, fontSize: 11, fontWeight: "900", textAlign: "center" },
  infoBox: { backgroundColor: COLORS.mint, borderColor: COLORS.sage, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  infoTitle: { color: COLORS.cypress, fontWeight: "900" },
  infoText: { color: COLORS.mutedText, fontSize: 12, lineHeight: 18, marginTop: 4 },
  label: { color: COLORS.text, fontWeight: "800", marginBottom: 5, marginTop: 5 },
  input: { backgroundColor: COLORS.cardCream, borderColor: COLORS.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: COLORS.text, marginBottom: 8 },
  helper: { color: COLORS.mutedText, fontSize: 11, lineHeight: 17, marginTop: 4 },
  primaryButton: { backgroundColor: COLORS.cypress, borderRadius: 13, padding: 13, alignItems: "center", marginTop: 11 },
  primaryText: { color: COLORS.cream, fontWeight: "900" },
  secondaryButton: { backgroundColor: COLORS.cardCream, borderColor: COLORS.royalGreen, borderWidth: 1, borderRadius: 13, padding: 13, alignItems: "center", marginTop: 8 },
  secondaryText: { color: COLORS.cypress, fontWeight: "900", textAlign: "center" },
  switchRow: { backgroundColor: COLORS.cardCream, borderColor: COLORS.line, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center" },
  pandaGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 9, marginHorizontal: -4 },
  pandaButton: { backgroundColor: COLORS.cardCream, borderColor: COLORS.line, borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10, margin: 4 },
  pandaButtonSelected: { backgroundColor: COLORS.mint, borderColor: COLORS.royalGreen },
  pandaButtonText: { color: COLORS.cypress, fontWeight: "800", fontSize: 11 },
});
