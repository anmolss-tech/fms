import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, SHADOW } from "../constants/theme";

export default function LevelCard({ title, subtitle, detail, youtubeUrl, onYoutubePress, openText, onPress }) {
  return (
    <View style={styles.card}>
      <View style={styles.greenStripe} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {detail ? <Text style={styles.detail}>{detail}</Text> : null}

      {youtubeUrl ? (
        <Pressable
          style={({ pressed }) => [styles.youtubeButton, pressed ? styles.youtubePressed : null]}
          onPress={onYoutubePress}
        >
          <Text style={styles.youtubeIcon}>▶</Text>
          <Text style={styles.youtubeText}>Watch source video</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.openButton, pressed ? styles.openPressed : null]}
        onPress={onPress}
      >
        <Text style={styles.openText}>{openText ? openText : "Open"}</Text>
        <Text style={styles.openArrow}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...SHADOW,
    backgroundColor: COLORS.cardCream,
    borderColor: COLORS.line,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
    padding: 16,
    paddingLeft: 20
  },
  greenStripe: {
    backgroundColor: COLORS.royalGreen,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 6
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800"
  },
  subtitle: {
    color: COLORS.royalGreen,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 5
  },
  detail: {
    color: COLORS.mutedText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7
  },
  youtubeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.warmCream,
    borderColor: COLORS.gold,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 12,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  youtubePressed: {
    backgroundColor: COLORS.mint
  },
  youtubeIcon: {
    color: COLORS.royalGreen,
    fontSize: 12,
    marginRight: 7
  },
  youtubeText: {
    color: COLORS.cypress,
    fontSize: 13,
    fontWeight: "800"
  },
  openButton: {
    alignItems: "center",
    backgroundColor: COLORS.cypress,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 13,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  openPressed: {
    backgroundColor: COLORS.black
  },
  openText: {
    color: COLORS.cream,
    fontSize: 15,
    fontWeight: "800"
  },
  openArrow: {
    color: COLORS.cream,
    fontSize: 24,
    fontWeight: "800",
    marginLeft: 8,
    marginTop: -2
  }
});
