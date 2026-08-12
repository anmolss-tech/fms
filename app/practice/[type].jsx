import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import * as Speech from "expo-speech";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  getCcubeLevel,
  getCcubeSource,
  getGrammarTopic,
  getSentenceCourse,
  getSentenceLevel,
  getSongLevel,
  getSongSource
} from "../../utils/courseData";
import PandaMascot from "../../components/PandaMascot";
import VoiceButton from "../../components/VoiceButton";
import { COLORS, SHADOW } from "../../constants/theme";
import { incrementCurrentSessionCards } from "../../database/db";
import { getActiveSessionId } from "../../services/sessionService";

export default function PracticeScreen() {
  const params = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [cards, setCards] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let newTitle = "Practice";
    let newNote = "Tap the card to show the answer.";
    let newSourceUrl = "";
    let newCards = [];

    if (params.type === "sentence") {
      const course = getSentenceCourse(params.courseId);
      const level = getSentenceLevel(params.courseId, params.levelId, params.cardsPerLevel);

      if (course !== null && level !== null) {
        newTitle = course.title + " - " + level.title;
        newNote = "Tap to reveal the French sentence.";
        newSourceUrl = course.youtubeUrl;
        newCards = level.cards;
      }
    }

    if (params.type === "grammar") {
      const topic = getGrammarTopic(params.topicId);

      if (topic !== null) {
        newTitle = topic.title;
        newNote = topic.explanation;
        newCards = topic.examples;
      }
    }

    if (params.type === "ccube") {
      const source = getCcubeSource(params.sourceId);
      const level = getCcubeLevel(params.sourceId, params.levelId, params.cardsPerLevel);

      if (source !== null && level !== null) {
        newTitle = source.title + " - " + level.title;
        newNote = "Tap to reveal pronunciation help and the normal sentence.";
        newSourceUrl = source.youtubeUrl;
        newCards = level.cards;
      }
    }

    if (params.type === "song") {
      const song = getSongSource(params.songId);
      const level = getSongLevel(params.songId, params.levelId, params.cardsPerLevel);

      if (song !== null && level !== null) {
        newTitle = song.title + " - " + level.title;
        newNote = "Tap to reveal pronunciation help and the normal sentence.";
        newSourceUrl = song.youtubeUrl;
        newCards = level.cards;
      }
    }

    setTitle(newTitle);
    setNote(newNote);
    setSourceUrl(newSourceUrl);
    setCards(newCards);
    setCardIndex(0);
    setShowBack(false);
    setIsLoading(false);
  }, [params.type, params.courseId, params.levelId, params.topicId, params.sourceId, params.songId, params.cardsPerLevel]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  function showNextCard() {
    if (cardIndex < cards.length - 1) {
      Speech.stop();
      setCardIndex(cardIndex + 1);
      setShowBack(false);
    }
  }

  function showPreviousCard() {
    if (cardIndex > 0) {
      Speech.stop();
      setCardIndex(cardIndex - 1);
      setShowBack(false);
    }
  }

  function flipCard() {
    if (!showBack) {
      getActiveSessionId()
        .then((sessionId) => incrementCurrentSessionCards(sessionId, 1))
        .catch(() => {});
    }
    setShowBack(!showBack);
  }

  function openYoutube() {
    if (sourceUrl !== "") {
      Linking.openURL(sourceUrl);
    }
  }

  function getArrowStyle(pressed, isDisabled) {
    return [
      styles.arrowButton,
      pressed && !isDisabled ? styles.pressedArrow : null,
      isDisabled ? styles.disabledArrow : null
    ];
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.royalGreen} />
      </View>
    );
  }

  const currentCard = cards[cardIndex];

  if (!currentCard) {
    return (
      <View style={styles.center}>
        <PandaMascot size={80} />
        <Text style={styles.noCardsTitle}>No cards found.</Text>
        <Text style={styles.noCardsText}>This panda has nothing to practise here yet.</Text>
      </View>
    );
  }

  const isFirstCard = cardIndex === 0;
  const isLastCard = cardIndex === cards.length - 1;
  const progress = ((cardIndex + 1) / cards.length) * 100;

  let languageLabel = "English";
  let mainText = currentCard.eng || currentCard.fre;
  let helperLabel = "";
  let helperText = "";
  let voiceText = "";

  if (params.type === "ccube" || params.type === "song") {
    if (showBack) {
      languageLabel = "Pronunciation help";
      mainText = currentCard.pronunciation;
      helperLabel = "Normal French sentence";
      helperText = currentCard.fre;
      voiceText = currentCard.fre;
    } else {
      languageLabel = "French";
      mainText = currentCard.fre;
      voiceText = currentCard.fre;
    }
  } else if (showBack) {
    languageLabel = "French";
    mainText = currentCard.fre;
    voiceText = currentCard.fre;
  } else if (!currentCard.eng && currentCard.fre) {
    languageLabel = "French example";
    mainText = currentCard.fre;
    voiceText = currentCard.fre;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <View style={styles.titleTextArea}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.note}>{note}</Text>
        </View>
        <PandaMascot size={60} speaking={voiceText !== ""} />
      </View>

      {sourceUrl !== "" ? (
        <Pressable
          style={({ pressed }) => [styles.sourceButton, pressed ? styles.sourcePressed : null]}
          onPress={openYoutube}
        >
          <Text style={styles.sourceIcon}>▶</Text>
          <Text style={styles.sourceUrl}>Watch source video</Text>
        </Pressable>
      ) : null}

      <View style={styles.progressHeader}>
        <Text style={styles.counter}>Card {cardIndex + 1} of {cards.length}</Text>
        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progress + "%" }]} />
      </View>

      <View style={styles.cardRow}>
        <View style={styles.sideControls}>
          <Pressable
            style={({ pressed }) => getArrowStyle(pressed, isLastCard)}
            onPress={showNextCard}
            disabled={isLastCard}
          >
            <Text style={styles.arrowText}>{">"}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => getArrowStyle(pressed, isFirstCard)}
            onPress={showPreviousCard}
            disabled={isFirstCard}
          >
            <Text style={styles.arrowText}>{"<"}</Text>
          </Pressable>
        </View>

        <View style={styles.flashcard}>
          <Pressable style={styles.cardTapArea} onPress={flipCard}>
            <View style={styles.languagePill}>
              <Text style={styles.languageLabel}>{languageLabel}</Text>
            </View>
            <Text style={styles.cardText}>{mainText}</Text>

            {helperText !== "" ? (
              <View style={styles.helperBox}>
                <Text style={styles.helperLabel}>{helperLabel}</Text>
                <Text style={styles.helperText}>{helperText}</Text>
              </View>
            ) : null}
          </Pressable>

          <VoiceButton text={voiceText} />

          <View style={styles.tapHint}>
            <Text style={styles.tapHintPanda}>🐼</Text>
            <Text style={styles.tapText}>Tap the card text to flip it</Text>
          </View>
        </View>

        <View style={styles.sideControls}>
          <Pressable
            style={({ pressed }) => getArrowStyle(pressed, isLastCard)}
            onPress={showNextCard}
            disabled={isLastCard}
          >
            <Text style={styles.arrowText}>{">"}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => getArrowStyle(pressed, isFirstCard)}
            onPress={showPreviousCard}
            disabled={isFirstCard}
          >
            <Text style={styles.arrowText}>{"<"}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
    paddingBottom: 28
  },
  center: {
    alignItems: "center",
    backgroundColor: COLORS.cream,
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  noCardsTitle: {
    color: COLORS.cypress,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 10
  },
  noCardsText: {
    color: COLORS.mutedText,
    marginTop: 5,
    textAlign: "center"
  },
  titleRow: {
    alignItems: "center",
    backgroundColor: COLORS.mint,
    borderColor: COLORS.sage,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    minHeight: 92,
    padding: 13
  },
  titleTextArea: {
    flex: 1,
    paddingRight: 8
  },
  title: {
    color: COLORS.cypress,
    fontSize: 20,
    fontWeight: "900"
  },
  note: {
    color: COLORS.mutedText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5
  },
  sourceButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.cardCream,
    borderColor: COLORS.gold,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  sourcePressed: {
    backgroundColor: COLORS.mint
  },
  sourceIcon: {
    color: COLORS.royalGreen,
    marginRight: 7
  },
  sourceUrl: {
    color: COLORS.cypress,
    fontSize: 13,
    fontWeight: "800"
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  counter: {
    color: COLORS.mutedText,
    fontSize: 13,
    fontWeight: "700"
  },
  progressPercent: {
    color: COLORS.royalGreen,
    fontSize: 13,
    fontWeight: "900"
  },
  progressTrack: {
    backgroundColor: COLORS.sage,
    borderRadius: 8,
    height: 8,
    marginBottom: 12,
    marginTop: 6,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: COLORS.royalGreen,
    borderRadius: 8,
    height: 8
  },
  cardRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  sideControls: {
    justifyContent: "center",
    minHeight: 300
  },
  arrowButton: {
    alignItems: "center",
    backgroundColor: COLORS.grey,
    borderRadius: 11,
    height: 132,
    justifyContent: "center",
    marginVertical: 5,
    width: 40
  },
  pressedArrow: {
    backgroundColor: COLORS.black
  },
  disabledArrow: {
    backgroundColor: COLORS.lightGrey
  },
  arrowText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900"
  },
  flashcard: {
    ...SHADOW,
    alignItems: "center",
    backgroundColor: COLORS.cardCream,
    borderColor: COLORS.royalGreen,
    borderRadius: 20,
    borderWidth: 2,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 8,
    minHeight: 300,
    padding: 16
  },
  cardTapArea: {
    alignItems: "center",
    width: "100%"
  },
  languagePill: {
    backgroundColor: COLORS.mint,
    borderRadius: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  languageLabel: {
    color: COLORS.cypress,
    fontSize: 12,
    fontWeight: "900"
  },
  cardText: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 29,
    textAlign: "center"
  },
  helperBox: {
    borderTopColor: COLORS.line,
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 14,
    width: "100%"
  },
  helperLabel: {
    color: COLORS.royalGreen,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  helperText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
    marginTop: 6,
    textAlign: "center"
  },
  tapHint: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 14
  },
  tapHintPanda: {
    fontSize: 16,
    marginRight: 5
  },
  tapText: {
    color: COLORS.mutedText,
    fontSize: 12
  }
});
