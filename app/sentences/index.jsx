import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TextInput, View } from "react-native";
import LevelCard from "../../components/LevelCard";
import PandaBanner from "../../components/PandaBanner";
import { COLORS } from "../../constants/theme";
import { getSentenceCourses } from "../../utils/courseData";

export default function SentenceCoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedCourses = getSentenceCourses();
    setCourses(loadedCourses);
    setIsLoading(false);
  }, []);

  function getFilteredCourses() {
    const results = [];
    const search = searchText.toLowerCase();

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const text = course.title + " " + course.sourceTitle + " " + course.startCard + " " + course.youtubeUrl;

      if (text.toLowerCase().includes(search)) {
        results.push(course);
      }
    }

    return results;
  }

  function openCourse(course) {
    router.push("/levels/sentence?courseId=" + course.courseId);
  }

  function openYoutube(url) {
    Linking.openURL(url);
  }

  function renderCourseCard({ item }) {
    return (
      <LevelCard
        title={item.title}
        subtitle={item.subtitle}
        detail={"First card: " + item.startCard}
        youtubeUrl={item.youtubeUrl}
        onYoutubePress={() => openYoutube(item.youtubeUrl)}
        openText="View Levels"
        onPress={() => openCourse(item)}
      />
    );
  }

  const filteredCourses = getFilteredCourses();

  return (
    <View style={styles.container}>
      <PandaBanner
        compact
        title="French - KieranBall"
        subtitle="Choose a course first. Its levels are kept neatly inside."
      />

      <TextInput
        style={styles.input}
        placeholder="Search KieranBall courses"
        placeholderTextColor={COLORS.mutedText}
        value={searchText}
        onChangeText={setSearchText}
      />

      {isLoading ? <ActivityIndicator size="large" color={COLORS.royalGreen} /> : null}

      {!isLoading && filteredCourses.length === 0 ? (
        <Text style={styles.emptyText}>No courses found.</Text>
      ) : null}

      {!isLoading && filteredCourses.length > 0 ? (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.courseId}
          renderItem={renderCourseCard}
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
