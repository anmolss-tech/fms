import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PandaBanner from "../components/PandaBanner";
import { COLORS, SHADOW } from "../constants/theme";

const categories = [
  {
    id: "sentences",
    icon: "🇫🇷",
    title: "French - KieranBall",
    description: "Build sentences from English to French.",
    route: "/sentences"
  },
  {
    id: "grammar",
    icon: "📚",
    title: "Grammar",
    description: "Study rules and practise examples by source.",
    route: "/grammar"
  },
  {
    id: "ccube",
    icon: "🎬",
    title: "Ccube",
    description: "Use real French lines with pronunciation help.",
    route: "/ccube"
  },
  {
    id: "songs",
    icon: "🎵",
    title: "Songs",
    description: "Learn lyrics one line at a time.",
    route: "/songs"
  },
  {
    id: "activity",
    icon: "🐼",
    title: "My Activity",
    description: "See app usage, calls, procrastination and Panda status.",
    route: "/activity"
  }
];

export default function HomeScreen() {
  function renderCategory(category) {
    return (
      <Pressable
        key={category.id}
        style={({ pressed }) => [styles.categoryCard, pressed ? styles.categoryPressed : null]}
        onPress={() => router.push(category.route)}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{category.icon}</Text>
        </View>

        <View style={styles.categoryTextArea}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <PandaBanner
        title="Bonjour, learner!"
        subtitle="Pick a path and let our little panda help you practise French."
      />

      <Text style={styles.sectionTitle}>Choose your learning path</Text>
      <Text style={styles.sectionSubtitle}>Four learning paths plus a private activity tracker stored on your device.</Text>

      {categories.map(renderCategory)}

      <View style={styles.tipBox}>
        <Text style={styles.tipEmoji}>🐼</Text>
        <View style={styles.tipTextArea}>
          <Text style={styles.tipTitle}>Panda tip</Text>
          <Text style={styles.tipText}>Start with 50-card levels for a quick daily practice session.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream
  },
  content: {
    padding: 16,
    paddingBottom: 30
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900"
  },
  sectionSubtitle: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    marginTop: 4
  },
  categoryCard: {
    ...SHADOW,
    alignItems: "center",
    backgroundColor: COLORS.cardCream,
    borderColor: COLORS.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 13,
    minHeight: 92,
    padding: 14
  },
  categoryPressed: {
    backgroundColor: COLORS.mint,
    borderColor: COLORS.royalGreen
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: COLORS.warmCream,
    borderColor: COLORS.sage,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    marginRight: 13,
    width: 48
  },
  icon: {
    fontSize: 24
  },
  categoryTextArea: {
    flex: 1
  },
  categoryTitle: {
    color: COLORS.cypress,
    fontSize: 18,
    fontWeight: "900"
  },
  categoryDescription: {
    color: COLORS.mutedText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4
  },
  arrow: {
    color: COLORS.royalGreen,
    fontSize: 32,
    fontWeight: "900",
    marginLeft: 8
  },
  tipBox: {
    alignItems: "center",
    backgroundColor: COLORS.cypress,
    borderRadius: 18,
    flexDirection: "row",
    marginTop: 4,
    padding: 14
  },
  tipEmoji: {
    fontSize: 35,
    marginRight: 12
  },
  tipTextArea: {
    flex: 1
  },
  tipTitle: {
    color: COLORS.cream,
    fontSize: 15,
    fontWeight: "900"
  },
  tipText: {
    color: COLORS.cream,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
    opacity: 0.92
  }
});
