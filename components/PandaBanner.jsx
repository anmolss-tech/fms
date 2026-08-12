import { StyleSheet, Text, View } from "react-native";
import PandaMascot from "./PandaMascot";
import { COLORS, SHADOW } from "../constants/theme";

export default function PandaBanner({ title, subtitle, compact = false, speaking = false }) {
  const mascotSize = compact ? 58 : 84;

  return (
    <View style={[styles.banner, compact ? styles.compactBanner : null]}>
      <View style={styles.textArea}>
        <Text style={[styles.title, compact ? styles.compactTitle : null]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <PandaMascot size={mascotSize} speaking={speaking} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    ...SHADOW,
    alignItems: "center",
    backgroundColor: COLORS.mint,
    borderColor: COLORS.sage,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 16,
    minHeight: 116,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  compactBanner: {
    minHeight: 86,
    paddingVertical: 8
  },
  textArea: {
    flex: 1,
    paddingRight: 10
  },
  title: {
    color: COLORS.cypress,
    fontSize: 27,
    fontWeight: "900"
  },
  compactTitle: {
    fontSize: 22
  },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5
  }
});
