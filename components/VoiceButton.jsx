import * as Speech from "expo-speech";
import { Pressable, StyleSheet, Text, View } from "react-native";
import PandaMascot from "./PandaMascot";
import { COLORS } from "../constants/theme";

export default function VoiceButton({ text }) {
  function speakFrench() {
    if (!text) {
      return;
    }

    Speech.stop();
    Speech.speak(text, {
      language: "fr-FR",
      rate: 0.85
    });
  }

  if (!text) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed ? styles.pressedButton : null]}
      onPress={speakFrench}
    >
      <View style={styles.mascotBox}>
        <PandaMascot size={40} speaking />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.buttonTitle}>Panda says it</Text>
        <Text style={styles.buttonText}>Tap to hear the French phrase</Text>
      </View>
      <Text style={styles.soundWaves}>)))</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: COLORS.grey,
    borderRadius: 15,
    flexDirection: "row",
    marginTop: 16,
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: "100%"
  },
  pressedButton: {
    backgroundColor: COLORS.black
  },
  mascotBox: {
    height: 46,
    justifyContent: "center",
    marginRight: 8,
    overflow: "visible",
    width: 48
  },
  textBox: {
    flex: 1
  },
  buttonTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900"
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 11,
    marginTop: 2,
    opacity: 0.9
  },
  soundWaves: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 6
  }
});
