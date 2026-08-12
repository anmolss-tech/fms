import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PandaBanner from "../../components/PandaBanner";
import { COLORS, SHADOW } from "../../constants/theme";
import {
  getRecentPhoneCalls,
  getRecentWhatsAppCalls,
  getTodaySummary,
  getTopApps,
  initDatabase,
} from "../../database/db";
import { refreshTracker } from "../../services/refreshService";
import {
  getPandaStatus,
  hasCallLogPermission,
  hasNotificationListenerAccess,
  hasUsageAccess,
  isNativeTrackerAvailable,
} from "../../services/nativeTracker";
import { getSyncConfig, getWeeklySyncStatus } from "../../services/syncService";
import { categoryLabel, formatClock, formatDuration } from "../../utils/activityFormat";

export default function ActivityScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [topApps, setTopApps] = useState([]);
  const [phoneCalls, setPhoneCalls] = useState([]);
  const [whatsappCalls, setWhatsappCalls] = useState([]);
  const [permissions, setPermissions] = useState({ usage: false, calls: false, whatsapp: false });
  const [panda, setPanda] = useState({ state: "happy", testMode: false });
  const [profile, setProfile] = useState({ userName: "", deviceName: "" });
  const [weeklySync, setWeeklySync] = useState(null);

  const loadData = useCallback(async () => {
    try {
      await initDatabase();
      const [nextSummary, apps, calls, waCalls, usage, callAccess, waAccess, pandaStatus, syncConfig, syncStatus] = await Promise.all([
        getTodaySummary(),
        getTopApps(),
        getRecentPhoneCalls(),
        getRecentWhatsAppCalls(),
        hasUsageAccess(),
        hasCallLogPermission(),
        hasNotificationListenerAccess(),
        getPandaStatus(),
        getSyncConfig(),
        getWeeklySyncStatus(),
      ]);
      setSummary(nextSummary);
      setTopApps(apps);
      setPhoneCalls(calls);
      setWhatsappCalls(waCalls);
      setPermissions({ usage, calls: callAccess, whatsapp: waAccess });
      setPanda(pandaStatus);
      setProfile({ userName: syncConfig.userName || "", deviceName: syncConfig.deviceName || "" });
      setWeeklySync(syncStatus);
    } catch (error) {
      console.log("Activity dashboard load failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function refreshNow() {
    setRefreshing(true);
    try {
      await refreshTracker({ sync: false });
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.royalGreen} />
      </View>
    );
  }

  const categorySeconds = summary?.categorySeconds || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PandaBanner
        title="Where did my time go?"
        subtitle="SQLite records activity locally every day. Vercel sends unsynced history to MongoDB only on the weekly schedule."
      />

      {!isNativeTrackerAvailable() ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Tracker requires the APK build</Text>
          <Text style={styles.warningText}>Expo Go cannot load the custom Android tracking module.</Text>
        </View>
      ) : null}

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>TODAY'S PROCRASTINATION SCORE</Text>
        <Text style={styles.score}>{summary?.procrastinationScore || 0}%</Text>
        <Text style={styles.scoreHelp}>Based only on phone-use time you marked as Distracting.</Text>
      </View>

      <View style={styles.grid}>
        <Metric title="Tracked apps" value={formatDuration(summary?.trackedSeconds)} />
        <Metric title="French study" value={formatDuration(summary?.frenchSeconds)} />
        <Metric title="Phone calls" value={formatDuration(summary?.callSeconds)} />
        <Metric title="WhatsApp calls*" value={formatDuration(summary?.whatsappCallSeconds)} />
      </View>

      <SectionTitle title="Activity categories" />
      {["distracting", "productive", "social", "neutral", "unknown"].map((category) => (
        <View key={category} style={styles.rowCard}>
          <Text style={styles.rowTitle}>{categoryLabel(category)}</Text>
          <Text style={styles.rowValue}>{formatDuration(categorySeconds[category] || 0)}</Text>
        </View>
      ))}

      <SectionTitle title="Top apps today" />
      {topApps.length === 0 ? (
        <Empty text="Grant Usage Access, then tap Refresh now." />
      ) : (
        topApps.map((app) => (
          <View key={app.package_name} style={styles.rowCard}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{app.app_name}</Text>
              <Text style={styles.rowSub}>{categoryLabel(app.category)}</Text>
            </View>
            <Text style={styles.rowValue}>{formatDuration(app.seconds)}</Text>
          </View>
        ))
      )}

      <SectionTitle title="Recent regular calls" />
      {phoneCalls.length === 0 ? (
        <Empty text="No imported phone calls yet." />
      ) : (
        phoneCalls.map((call) => (
          <View key={call.event_id} style={styles.rowCard}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{call.contact_name || call.phone_number || "Unknown"}</Text>
              <Text style={styles.rowSub}>{call.direction} · {formatClock(call.started_at)}{call.source === "best_effort_notification" ? " · notification estimate" : ""}</Text>
            </View>
            <Text style={styles.rowValue}>{formatDuration(call.duration_seconds)}</Text>
          </View>
        ))
      )}

      <SectionTitle title="Recent WhatsApp calls" />
      {whatsappCalls.length === 0 ? (
        <Empty text="Best-effort tracking appears here after Notification Access is enabled and WhatsApp exposes an ongoing call notification." />
      ) : (
        whatsappCalls.map((call) => (
          <View key={call.event_id} style={styles.rowCard}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{call.contact_label || "WhatsApp contact"}</Text>
              <Text style={styles.rowSub}>{call.direction} · {formatClock(call.started_at)} · best effort</Text>
            </View>
            <Text style={styles.rowValue}>{formatDuration(call.duration_seconds)}</Text>
          </View>
        ))
      )}

      <View style={styles.statusBox}>
        <Text style={styles.statusTitle}>Tracker status</Text>
        <StatusLine label="Usage Access" enabled={permissions.usage} />
        <StatusLine label="Call Log" enabled={permissions.calls} />
        <StatusLine label="Call Notification Access" enabled={permissions.whatsapp} />
        <StatusLine label="Panda icon" enabled value={panda?.state || "happy"} />
        <StatusLine label="Profile" enabled={Boolean(profile.userName)} value={profile.userName || "Not set"} />
        <StatusLine label="Device" enabled={Boolean(profile.deviceName)} value={profile.deviceName || "Not set"} />
        <StatusLine
          label="Weekly cloud sync"
          enabled
          value={weeklySync?.due ? "Due" : (weeklySync?.nextSyncAt ? new Date(weeklySync.nextSyncAt).toLocaleDateString() : "Not configured")}
        />
        <Text style={styles.smallNote}>* WhatsApp and call-notification fallback detection are best effort and can vary by app/Android version.</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={refreshNow} disabled={refreshing}>
        <Text style={styles.primaryText}>{refreshing ? "Refreshing…" : "Refresh local data"}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push("/activity/categories")}>
        <Text style={styles.secondaryText}>Classify my apps</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push("/activity/settings")}>
        <Text style={styles.secondaryText}>Profile, Vercel weekly sync & Panda test</Text>
      </Pressable>
    </ScrollView>
  );
}

function Metric({ title, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );
}

function SectionTitle({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function StatusLine({ label, enabled, value }) {
  return (
    <View style={styles.statusLine}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, enabled ? styles.statusGood : styles.statusBad]}>
        {value || (enabled ? "Ready" : "Needs setup")}
      </Text>
    </View>
  );
}

function Empty({ text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: { padding: 16, paddingBottom: 36 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cream },
  warningBox: { backgroundColor: "#FFF1E6", borderColor: COLORS.gold, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  warningTitle: { color: COLORS.cypress, fontWeight: "900" },
  warningText: { color: COLORS.mutedText, marginTop: 4, lineHeight: 18 },
  scoreCard: { ...SHADOW, backgroundColor: COLORS.cypress, borderRadius: 20, padding: 18, marginBottom: 14, alignItems: "center" },
  scoreLabel: { color: COLORS.cream, fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  score: { color: COLORS.cream, fontSize: 50, fontWeight: "900", marginVertical: 3 },
  scoreHelp: { color: COLORS.cream, opacity: 0.86, textAlign: "center", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  metricCard: { ...SHADOW, width: "48.5%", backgroundColor: COLORS.cardCream, borderColor: COLORS.line, borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 10 },
  metricValue: { color: COLORS.cypress, fontWeight: "900", fontSize: 20 },
  metricTitle: { color: COLORS.mutedText, marginTop: 4, fontSize: 12 },
  sectionTitle: { color: COLORS.text, fontWeight: "900", fontSize: 18, marginTop: 14, marginBottom: 8 },
  rowCard: { backgroundColor: COLORS.cardCream, borderColor: COLORS.line, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  flex: { flex: 1, paddingRight: 10 },
  rowTitle: { color: COLORS.cypress, fontWeight: "800", fontSize: 14 },
  rowSub: { color: COLORS.mutedText, fontSize: 11, marginTop: 3 },
  rowValue: { color: COLORS.royalGreen, fontWeight: "900" },
  statusBox: { backgroundColor: COLORS.mint, borderColor: COLORS.sage, borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 14 },
  statusTitle: { color: COLORS.cypress, fontWeight: "900", fontSize: 16, marginBottom: 7 },
  statusLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  statusLabel: { color: COLORS.text, flex: 1 },
  statusValue: { fontWeight: "800" },
  statusGood: { color: COLORS.royalGreen },
  statusBad: { color: COLORS.error },
  smallNote: { color: COLORS.mutedText, fontSize: 11, lineHeight: 16, marginTop: 8 },
  primaryButton: { backgroundColor: COLORS.cypress, borderRadius: 14, padding: 14, alignItems: "center", marginTop: 14 },
  primaryText: { color: COLORS.cream, fontWeight: "900" },
  secondaryButton: { backgroundColor: COLORS.cardCream, borderColor: COLORS.royalGreen, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: "center", marginTop: 9 },
  secondaryText: { color: COLORS.cypress, fontWeight: "900", textAlign: "center" },
  empty: { backgroundColor: COLORS.warmCream, borderRadius: 12, padding: 12, marginBottom: 8 },
  emptyText: { color: COLORS.mutedText, fontSize: 12, lineHeight: 18 },
});
