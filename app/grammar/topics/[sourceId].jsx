import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import LevelCard from "../../../components/LevelCard";
import PandaBanner from "../../../components/PandaBanner";
import { COLORS } from "../../../constants/theme";
import { getGrammarSource, getGrammarTopicsBySource } from "../../../utils/courseData";

export default function GrammarTopicListScreen() {
  const { sourceId } = useLocalSearchParams();
  const [source, setSource] = useState(null);
  const [topics, setTopics] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedSource = getGrammarSource(sourceId);
    const loadedTopics = getGrammarTopicsBySource(sourceId);

    setSource(loadedSource);
    setTopics(loadedTopics);
    setIsLoading(false);
  }, [sourceId]);

  function getFilteredTopics() {
    const results = [];
    const search = searchText.toLowerCase();

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const text = topic.title + " " + topic.subtitle + " " + topic.explanation;

      if (text.toLowerCase().includes(search)) {
        results.push(topic);
      }
    }

    return results;
  }

  function openTopic(topic) {
    router.push("/practice/grammar?topicId=" + topic.id);
  }

  function renderTopicCard({ item }) {
    return (
      <LevelCard
        title={item.title}
        subtitle={item.subtitle}
        detail={item.explanation}
        openText="Practice"
        onPress={() => openTopic(item)}
      />
    );
  }

  const filteredTopics = getFilteredTopics();

  return (
    <View style={styles.container}>
      <PandaBanner
        compact
        title={source ? source.title : "Grammar Topics"}
        subtitle={topics.length + " topics in this source. Pick one and practise with the panda."}
      />

      <TextInput
        style={styles.input}
        placeholder="Search grammar topics"
        placeholderTextColor={COLORS.mutedText}
        value={searchText}
        onChangeText={setSearchText}
      />

      {isLoading ? <ActivityIndicator size="large" color={COLORS.royalGreen} /> : null}

      {!isLoading && filteredTopics.length === 0 ? (
        <Text style={styles.emptyText}>No grammar topics found.</Text>
      ) : null}

      {!isLoading && filteredTopics.length > 0 ? (
        <FlatList
          data={filteredTopics}
          keyExtractor={(item) => item.id}
          renderItem={renderTopicCard}
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
