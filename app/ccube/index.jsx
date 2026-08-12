import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TextInput, View } from "react-native";
import LevelCard from "../../components/LevelCard";
import PandaBanner from "../../components/PandaBanner";
import { COLORS } from "../../constants/theme";
import { getCcubeSources } from "../../utils/courseData";

export default function CcubeScreen() {
  const [sources, setSources] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedSources = getCcubeSources();
    setSources(loadedSources);
    setIsLoading(false);
  }, []);

  function getFilteredSources() {
    const results = [];
    const search = searchText.toLowerCase();

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const text = source.title + " " + source.startCard + " " + source.youtubeUrl;

      if (text.toLowerCase().includes(search)) {
        results.push(source);
      }
    }

    return results;
  }

  function openSource(source) {
    router.push("/levels/ccube?sourceId=" + source.id);
  }

  function openYoutube(url) {
    Linking.openURL(url);
  }

  function renderSourceCard({ item }) {
    return (
      <LevelCard
        title={item.title}
        subtitle={item.subtitle}
        detail={"First line: " + item.startCard}
        youtubeUrl={item.youtubeUrl}
        onYoutubePress={() => openYoutube(item.youtubeUrl)}
        openText="View Levels"
        onPress={() => openSource(item)}
      />
    );
  }

  const filteredSources = getFilteredSources();

  return (
    <View style={styles.container}>
      <PandaBanner
        compact
        title="Ccube"
        subtitle="Practise authentic French lines with a friendly pronunciation guide."
      />

      <TextInput
        style={styles.input}
        placeholder="Search Ccube videos"
        placeholderTextColor={COLORS.mutedText}
        value={searchText}
        onChangeText={setSearchText}
      />

      {isLoading ? <ActivityIndicator size="large" color={COLORS.royalGreen} /> : null}

      {!isLoading && filteredSources.length === 0 ? (
        <Text style={styles.emptyText}>No Ccube videos found.</Text>
      ) : null}

      {!isLoading && filteredSources.length > 0 ? (
        <FlatList
          data={filteredSources}
          keyExtractor={(item) => item.id}
          renderItem={renderSourceCard}
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
  input: {
    backgroundColor: COLORS.cardCream,
    borderColor: COLORS.sage,
    borderRadius: 14,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 14,
    padding: 13
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
