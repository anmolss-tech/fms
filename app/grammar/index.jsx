import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import LevelCard from "../../components/LevelCard";
import PandaBanner from "../../components/PandaBanner";
import { COLORS } from "../../constants/theme";
import { getGrammarCategories } from "../../utils/courseData";

export default function GrammarScreen() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedCategories = getGrammarCategories();
    setCategories(loadedCategories);
    setIsLoading(false);
  }, []);

  function openCategory(category) {
    router.push("/grammar/" + category.id);
  }

  function renderCategoryCard({ item }) {
    return (
      <LevelCard
        title={item.title}
        subtitle={item.subtitle}
        detail={item.detail}
        openText="View Sources"
        onPress={() => openCategory(item)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <PandaBanner
        compact
        title="Grammar Garden"
        subtitle="Choose a source category so the topic list stays tidy as the app grows."
      />

      {isLoading ? <ActivityIndicator size="large" color={COLORS.royalGreen} /> : null}

      {!isLoading && categories.length > 0 ? (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryCard}
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
  listContent: {
    paddingBottom: 24
  }
});
