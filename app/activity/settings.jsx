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
import { getState } from "../../database/db";
import {
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
import { getSyncConfig, saveSyncConfig, syncUnsyncedData } from "../../services/syncService";

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

export default function TrackerSettingsScreen() {
  const [usageAccess, setUsageAccess] = useState(false);
  const [callAccess, setCallAccess] = useState(false);
  const [contactsAccess, setContactsAccess] = useState(false);
  const [notificationAccess, setNotificationAccess] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [token, setToken] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [pandaState, setPandaState] = useState("happy");
  const [lastSync, setLastSync] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [usage, calls, contacts, notifications, syncConfig, panda, syncAt] = await Promise.all([
      hasUsageAccess(),
      hasCallLogPermission(),
      hasContactsPermission(),
      hasNotificationListenerAccess(),
      getSyncConfig(),
      getPandaStatus(),
      getState("last_sync_at", null),
    ]);
    setUsageAccess(Boolean(usage));
    setCallAccess(Boolean(calls));
    setContactsAccess(Boolean(contacts));
    setNotificationAccess(Boolean(notifications));
    setApiUrl(syncConfig.apiUrl || "");
    setToken(syncConfig.token || "");
    setDeviceId(syncConfig.deviceId || "");
    setTestMode(Boolean(panda?.testMode));
    setPandaState(panda?.state || "happy");
    setLastSync(syncAt ? Number(syncAt) : null);
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

  async function saveMongoSettings() {
    setBusy(true);
    try {
      await saveSyncConfig(apiUrl, token);
      Alert.alert("Saved", "The API URL and private token were saved on this device.");
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
      const result = await syncUnsyncedData();
      if (result.ok) {
        Alert.alert("Sync complete", result.reason || "SQLite records were synchronized.");
      } else {
        Alert.alert("Sync not completed", result.reason || result.error || "Check the API settings.");
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
        subtitle="Grant only the permissions you want. SQLite works locally even when cloud sync is not configured."
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

      <Section title="2. MongoDB sync through your API" />
      <InfoBox
        title="MongoDB credentials stay off the phone"
        text="Enter the HTTPS URL of the included Node/Express tracker server. The optional API token is stored with Expo SecureStore."
      />
      <Text style={styles.label}>Tracker API URL</Text>
      <TextInput
        style={styles.input}
        value={apiUrl}
        onChangeText={setApiUrl}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="https://your-tracker-api.example.com"
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
        placeholder="same token as TRACKER_API_TOKEN on server"
        placeholderTextColor={COLORS.grey}
      />
      <Text style={styles.helper}>Device ID: {deviceId || "creating…"}</Text>
      <Text style={styles.helper}>Last sync: {lastSync ? new Date(lastSync).toLocaleString() : "Never"}</Text>
      <Pressable style={styles.primaryButton} onPress={saveMongoSettings} disabled={busy}>
        <Text style={styles.primaryText}>Save sync settings</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={syncNow} disabled={busy}>
        <Text style={styles.secondaryText}>{busy ? "Working…" : "Collect + sync now"}</Text>
      </Pressable>

      <Section title="3. Panda launcher icon" />
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
  secondaryText: { color: COLORS.cypress, fontWeight: "900" },
  switchRow: { backgroundColor: COLORS.cardCream, borderColor: COLORS.line, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center" },
  pandaGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 9, marginHorizontal: -4 },
  pandaButton: { backgroundColor: COLORS.cardCream, borderColor: COLORS.line, borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10, margin: 4 },
  pandaButtonSelected: { backgroundColor: COLORS.mint, borderColor: COLORS.royalGreen },
  pandaButtonText: { color: COLORS.cypress, fontWeight: "800", fontSize: 11 },
});
