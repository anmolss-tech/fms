import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PandaBanner from "../../components/PandaBanner";
import { COLORS } from "../../constants/theme";
import { getTrackedApps, updateAppCategory } from "../../database/db";
import { categoryLabel, formatDuration } from "../../utils/activityFormat";

const CATEGORIES = ["distracting", "productive", "social", "neutral", "unknown"];

export default function CategoriesScreen() {
  const [apps, setApps] = useState([]);

  const load = useCallback(async () => {
    setApps(await getTrackedApps());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => console.log("Category load failed:", error));
    }, [load])
  );

  async function cycleCategory(app) {
    const index = Math.max(0, CATEGORIES.indexOf(app.category));
    const next = CATEGORIES[(index + 1) % CATEGORIES.length];
    await updateAppCategory(app.package_name, app.app_name, next, false);
    await load();
  }

  async function toggleIgnored(app) {
    await updateAppCategory(app.package_name, app.app_name, app.category, !app.is_excluded);
    await load();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PandaBanner
        title="Teach Panda your categories"
        subtitle="Tap a category to cycle it. Ignore apps you do not want included in your procrastination score."
      />

      <View style={styles.legend}>
        <Text style={styles.legendText}>Category order: Distracting → Productive → Social → Neutral → Uncategorized.</Text>
      </View>

      {apps.map((app) => (
        <View key={app.package_name} style={styles.card}>
          <View style={styles.flex}>
            <Text style={styles.title}>{app.app_name}</Text>
            <Text style={styles.package}>{app.package_name}</Text>
            <Text style={styles.time}>Recorded: {formatDuration(app.seconds)}</Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              style={[styles.categoryButton, app.is_excluded ? styles.disabled : null]}
              onPress={() => cycleCategory(app)}
              disabled={Boolean(app.is_excluded)}
            >
              <Text style={styles.categoryText}>{categoryLabel(app.category)}</Text>
            </Pressable>
            <Pressable style={styles.ignoreButton} onPress={() => toggleIgnored(app)}>
              <Text style={styles.ignoreText}>{app.is_excluded ? "Include" : "Ignore"}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: { padding: 16, paddingBottom: 36 },
  legend: { backgroundColor: COLORS.mint, borderColor: COLORS.sage, borderWidth: 1, borderRadius: 13, padding: 11, marginBottom: 10 },
  legendText: { color: COLORS.mutedText, fontSize: 11, lineHeight: 16 },
  card: { backgroundColor: COLORS.cardCream, borderColor: COLORS.line, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 9, flexDirection: "row", alignItems: "center" },
  flex: { flex: 1, paddingRight: 8 },
  title: { color: COLORS.cypress, fontWeight: "900", fontSize: 14 },
  package: { color: COLORS.mutedText, fontSize: 10, marginTop: 3 },
  time: { color: COLORS.royalGreen, fontSize: 11, marginTop: 5, fontWeight: "700" },
  actions: { alignItems: "flex-end" },
  categoryButton: { backgroundColor: COLORS.mint, borderColor: COLORS.royalGreen, borderWidth: 1, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 9, minWidth: 96, alignItems: "center" },
  disabled: { opacity: 0.45 },
  categoryText: { color: COLORS.cypress, fontWeight: "900", fontSize: 10 },
  ignoreButton: { marginTop: 6, paddingVertical: 4, paddingHorizontal: 8 },
  ignoreText: { color: COLORS.error, fontWeight: "800", fontSize: 10 },
});
