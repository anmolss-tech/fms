import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/theme";

export default function PandaMascot({ size = 82, speaking = false }) {
  const faceSize = size * 0.72;
  const earSize = size * 0.25;
  const eyePatchWidth = size * 0.19;
  const eyePatchHeight = size * 0.25;

  return (
    <View style={[styles.wrapper, { width: size, height: size + 16 }]}>
      {speaking ? (
        <View style={[styles.speechBubble, { right: -size * 0.18, top: size * 0.02 }]}>
          <Text style={styles.speechText}>♪</Text>
          <Text style={styles.speechWaves}>)))</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.ear,
          {
            width: earSize,
            height: earSize,
            borderRadius: earSize,
            left: size * 0.08,
            top: size * 0.04
          }
        ]}
      />
      <View
        style={[
          styles.ear,
          {
            width: earSize,
            height: earSize,
            borderRadius: earSize,
            right: size * 0.08,
            top: size * 0.04
          }
        ]}
      />

      <View
        style={[
          styles.face,
          {
            width: faceSize,
            height: faceSize,
            borderRadius: faceSize,
            left: (size - faceSize) / 2,
            top: size * 0.11
          }
        ]}
      >
        <View
          style={[
            styles.eyePatch,
            {
              width: eyePatchWidth,
              height: eyePatchHeight,
              borderRadius: eyePatchWidth,
              left: faceSize * 0.18,
              top: faceSize * 0.22,
              transform: [{ rotate: "18deg" }]
            }
          ]}
        >
          <View style={styles.eye} />
        </View>

        <View
          style={[
            styles.eyePatch,
            {
              width: eyePatchWidth,
              height: eyePatchHeight,
              borderRadius: eyePatchWidth,
              right: faceSize * 0.18,
              top: faceSize * 0.22,
              transform: [{ rotate: "-18deg" }]
            }
          ]}
        >
          <View style={styles.eye} />
        </View>

        <View style={[styles.nose, { top: faceSize * 0.5 }]} />
        <Text style={[styles.smile, { top: faceSize * 0.52, fontSize: size * 0.19 }]}>⌣</Text>
        <View style={[styles.cheek, { left: faceSize * 0.16, top: faceSize * 0.57 }]} />
        <View style={[styles.cheek, { right: faceSize * 0.16, top: faceSize * 0.57 }]} />
      </View>

      <View
        style={[
          styles.scarf,
          {
            width: size * 0.58,
            height: size * 0.16,
            borderRadius: size * 0.08,
            left: size * 0.21,
            top: size * 0.72
          }
        ]}
      />
      <View
        style={[
          styles.scarfTail,
          {
            width: size * 0.16,
            height: size * 0.28,
            borderRadius: size * 0.05,
            left: size * 0.48,
            top: size * 0.76,
            transform: [{ rotate: "16deg" }]
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative"
  },
  ear: {
    backgroundColor: COLORS.black,
    position: "absolute"
  },
  face: {
    backgroundColor: COLORS.cardCream,
    borderColor: COLORS.cypress,
    borderWidth: 2,
    position: "absolute",
    zIndex: 2
  },
  eyePatch: {
    alignItems: "center",
    backgroundColor: COLORS.black,
    justifyContent: "center",
    position: "absolute"
  },
  eye: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    height: 7,
    width: 7
  },
  nose: {
    alignSelf: "center",
    backgroundColor: COLORS.black,
    borderRadius: 10,
    height: 7,
    position: "absolute",
    width: 10
  },
  smile: {
    color: COLORS.black,
    left: 0,
    right: 0,
    textAlign: "center",
    fontWeight: "900",
    position: "absolute"
  },
  cheek: {
    backgroundColor: "#E5A9A0",
    borderRadius: 10,
    height: 6,
    opacity: 0.75,
    position: "absolute",
    width: 10
  },
  scarf: {
    backgroundColor: COLORS.royalGreen,
    borderColor: COLORS.cypress,
    borderWidth: 1,
    position: "absolute",
    zIndex: 3
  },
  scarfTail: {
    backgroundColor: COLORS.royalGreen,
    borderColor: COLORS.cypress,
    borderWidth: 1,
    position: "absolute",
    zIndex: 1
  },
  speechBubble: {
    alignItems: "center",
    backgroundColor: COLORS.mint,
    borderColor: COLORS.cypress,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: "absolute",
    zIndex: 5
  },
  speechText: {
    color: COLORS.cypress,
    fontSize: 13,
    fontWeight: "900"
  },
  speechWaves: {
    color: COLORS.cypress,
    fontSize: 9,
    fontWeight: "900",
    marginLeft: 2
  }
});
