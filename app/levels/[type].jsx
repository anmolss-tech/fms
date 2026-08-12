import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import LevelCard from "../../components/LevelCard";
import PandaBanner from "../../components/PandaBanner";
import { COLORS } from "../../constants/theme";
import {
  getCcubeLevels,
  getCcubeSource,
  getSentenceCourse,
  getSentenceLevels,
  getSongLevels,
  getSongSource
} from "../../utils/courseData";

export default function LevelPickerScreen() {
  const params = useLocalSearchParams();
  const [pageTitle, setPageTitle] = useState("Levels");
  const [sourceUrl, setSourceUrl] = useState("");
  const [levels, setLevels] = useState([]);
  const [cardsPerLevel, setCardsPerLevel] = useState(50);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let newTitle = "Levels";
    let newSourceUrl = "";
    let newLevels = [];

    if (params.type === "sentence") {
      const course = getSentenceCourse(params.courseId);

      if (course !== null) {
        newTitle = course.title;
        newSourceUrl = course.youtubeUrl;
        newLevels = getSentenceLevels(params.courseId, cardsPerLevel);
      }
    }

    if (params.type === "ccube") {
      const source = getCcubeSource(params.sourceId);

      if (source !== null) {
        newTitle = source.title;
        newSourceUrl = source.youtubeUrl;
        newLevels = getCcubeLevels(params.sourceId, cardsPerLevel);
      }
    }

    if (params.type === "song") {
      const song = getSongSource(params.songId);

      if (song !== null) {
        newTitle = song.title;
        newSourceUrl = song.youtubeUrl;
        newLevels = getSongLevels(params.songId, cardsPerLevel);
      }
    }

    setPageTitle(newTitle);
    setSourceUrl(newSourceUrl);
    setLevels(newLevels);
    setIsLoading(false);
  }, [params.type, params.courseId, params.sourceId, params.songId, cardsPerLevel]);

  function openYoutube() {
    if (sourceUrl !== "") {
      Linking.openURL(sourceUrl);
    }
  }

  function selectLevelSize(size) {
    if (cardsPerLevel !== size) {
      setIsLoading(true);
      setCardsPerLevel(size);
    }
  }

  function openLevel(level) {
    let path = "/practice/" + params.type + "?levelId=" + level.id + "&cardsPerLevel=" + cardsPerLevel;

    if (params.type === "sentence") {
      path = path + "&courseId=" + params.courseId;
    }

    if (params.type === "ccube") {
      path = path + "&sourceId=" + params.sourceId;
    }

    if (params.type === "song") {
      path = path + "&songId=" + params.songId;
    }

    router.push(path);
  }

  function getSizeButtonStyle(size, pressed) {
    return [
      styles.sizeButton,
      cardsPerLevel === size ? styles.sizeButtonSelected : null,
      pressed ? styles.sizeButtonPressed : null
    ];
  }

  function getSizeButtonTextStyle(size) {
    if (cardsPerLevel === size) {
      return styles.sizeButtonTextSelected;
    }

    return styles.sizeButtonText;
  }

  function renderLevelCard({ item }) {
    return (
      <LevelCard
        title={item.title}
        subtitle={item.subtitle}
        detail={"First card: " + item.startCard}
        openText="Practice"
        onPress={() => openLevel(item)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <PandaBanner
        compact
        title={pageTitle}
        subtitle="Pick a level size, then choose where you want to begin."
      />

      {sourceUrl !== "" ? (
        <Pressable
          style={({ pressed }) => [styles.youtubeButton, pressed ? styles.youtubePressed : null]}
          onPress={openYoutube}
        >
          <Text style={styles.youtubeIcon}>▶</Text>
          <Text style={styles.youtubeText}>Watch the source video</Text>
        </Pressable>
      ) : null}

      <View style={styles.selectorBox}>
        <Text style={styles.selectorTitle}>Cards in each level</Text>
        <Text style={styles.selectorHint}>Panda recommends 50 for a quick practice.</Text>

        <View style={styles.sizeRow}>
          <Pressable
            style={({ pressed }) => getSizeButtonStyle(250, pressed)}
            onPress={() => selectLevelSize(250)}
          >
            <Text style={getSizeButtonTextStyle(250)}>250</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => getSizeButtonStyle(100, pressed)}
            onPress={() => selectLevelSize(100)}
          >
            <Text style={getSizeButtonTextStyle(100)}>100</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => getSizeButtonStyle(50, pressed)}
            onPress={() => selectLevelSize(50)}
          >
            <Text style={getSizeButtonTextStyle(50)}>50</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? <ActivityIndicator size="large" color={COLORS.royalGreen} /> : null}

      {!isLoading && levels.length === 0 ? (
        <Text style={styles.emptyText}>No levels found.</Text>
      ) : null}

      {!isLoading && levels.length > 0 ? (
        <FlatList
          data={levels}
          keyExtractor={(item) => cardsPerLevel + "-" + item.id}
          renderItem={renderLevelCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    padding: 16
  },
  youtubeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.cardCream,
    borderColor: COLORS.gold,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  youtubePressed: {
    backgroundColor: COLORS.mint
  },
  youtubeIcon: {
    color: COLORS.royalGreen,
    marginRight: 7
  },
  youtubeText: {
    color: COLORS.cypress,
    fontWeight: "800"
  },
  selectorBox: {
    backgroundColor: COLORS.warmCream,
    borderColor: COLORS.sage,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 13
  },
  selectorTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  selectorHint: {
    color: COLORS.mutedText,
    fontSize: 12,
    marginTop: 3
  },
  sizeRow: {
    flexDirection: "row",
    marginTop: 11
  },
  sizeButton: {
    alignItems: "center",
    backgroundColor: COLORS.cardCream,
    borderColor: COLORS.sage,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
    padding: 11
  },
  sizeButtonSelected: {
    backgroundColor: COLORS.royalGreen,
    borderColor: COLORS.cypress
  },
  sizeButtonPressed: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black
  },
  sizeButtonText: {
    color: COLORS.cypress,
    fontWeight: "800"
  },
  sizeButtonTextSelected: {
    color: COLORS.cream,
    fontWeight: "900"
  },
  listContent: {
    paddingBottom: 24
  },
  emptyText: {
    color: COLORS.mutedText,
    marginTop: 20,
    textAlign: "center"
  }
});
