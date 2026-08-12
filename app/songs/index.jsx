import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TextInput, View } from "react-native";
import LevelCard from "../../components/LevelCard";
import PandaBanner from "../../components/PandaBanner";
import { COLORS } from "../../constants/theme";
import { getSongSources } from "../../utils/courseData";

export default function SongsScreen() {
  const [songs, setSongs] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedSongs = getSongSources();
    setSongs(loadedSongs);
    setIsLoading(false);
  }, []);

  function getFilteredSongs() {
    const results = [];
    const search = searchText.toLowerCase();

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const text = song.title + " " + song.startCard + " " + song.youtubeUrl;

      if (text.toLowerCase().includes(search)) {
        results.push(song);
      }
    }

    return results;
  }

  function openSong(song) {
    router.push("/levels/song?songId=" + song.id);
  }

  function openYoutube(url) {
    Linking.openURL(url);
  }

  function renderSongCard({ item }) {
    return (
      <LevelCard
        title={item.title}
        subtitle={item.subtitle}
        detail={"First line: " + item.startCard}
        youtubeUrl={item.youtubeUrl}
        onYoutubePress={() => openYoutube(item.youtubeUrl)}
        openText="View Levels"
        onPress={() => openSong(item)}
      />
    );
  }

  const filteredSongs = getFilteredSongs();

  return (
    <View style={styles.container}>
      <PandaBanner
        compact
        speaking
        title="Songs"
        subtitle="Learn French lyrics slowly, one musical line at a time."
      />

      <TextInput
        style={styles.input}
        placeholder="Search songs"
        placeholderTextColor={COLORS.mutedText}
        value={searchText}
        onChangeText={setSearchText}
      />

      {isLoading ? <ActivityIndicator size="large" color={COLORS.royalGreen} /> : null}

      {!isLoading && filteredSongs.length === 0 ? (
        <Text style={styles.emptyText}>No songs found.</Text>
      ) : null}

      {!isLoading && filteredSongs.length > 0 ? (
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderSongCard}
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
