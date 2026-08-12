import { ccubeSources } from "../data/ccube/ccubeIndex";
import { grammarCategories, grammarSources, grammarTopics } from "../data/grammar/grammarTopics";
import { kieranBallCourses } from "../data/kieranBall/courseIndex";
import { songSources } from "../data/songs/songIndex";

export const LEVEL_SIZE_OPTIONS = [50, 100, 250];

function getSafeLevelSize(cardsPerLevel) {
  const numberValue = Number(cardsPerLevel);

  if (numberValue === 100) {
    return 100;
  }

  if (numberValue === 250) {
    return 250;
  }

  return 50;
}

function getCardPreview(card) {
  if (!card) {
    return "";
  }

  if (card.eng) {
    return card.eng;
  }

  return card.fre;
}

function makeLevels(source, cardsPerLevel) {
  const levelSize = getSafeLevelSize(cardsPerLevel);
  const levels = [];

  for (let startIndex = 0; startIndex < source.cards.length; startIndex = startIndex + levelSize) {
    const endIndex = Math.min(startIndex + levelSize, source.cards.length);
    const levelCards = source.cards.slice(startIndex, endIndex);
    const levelNumber = levels.length + 1;

    levels.push({
      id: String(levelNumber),
      title: "Level " + levelNumber,
      subtitle: "Cards " + (startIndex + 1) + " - " + endIndex + " of " + source.cards.length,
      startCard: getCardPreview(levelCards[0]),
      cards: levelCards
    });
  }

  return levels;
}

export function getSentenceCourses() {
  return kieranBallCourses;
}

export function getSentenceCourse(courseId) {
  for (let i = 0; i < kieranBallCourses.length; i++) {
    const course = kieranBallCourses[i];

    if (course.courseId === courseId) {
      return course;
    }
  }

  return null;
}

export function getSentenceLevels(courseId, cardsPerLevel) {
  const course = getSentenceCourse(courseId);

  if (course === null) {
    return [];
  }

  return makeLevels(course, cardsPerLevel);
}

export function getSentenceLevel(courseId, levelId, cardsPerLevel) {
  const levels = getSentenceLevels(courseId, cardsPerLevel);

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];

    if (level.id === levelId) {
      return level;
    }
  }

  return null;
}

export function getGrammarCategories() {
  return grammarCategories;
}

export function getGrammarSourcesByCategory(categoryId) {
  const sources = [];

  for (let i = 0; i < grammarSources.length; i++) {
    const source = grammarSources[i];

    if (source.categoryId === categoryId) {
      sources.push(source);
    }
  }

  return sources;
}

export function getGrammarSource(sourceId) {
  for (let i = 0; i < grammarSources.length; i++) {
    const source = grammarSources[i];

    if (source.id === sourceId) {
      return source;
    }
  }

  return null;
}

export function getGrammarTopics() {
  return grammarTopics;
}

export function getGrammarTopicsBySource(sourceId) {
  const topics = [];

  for (let i = 0; i < grammarTopics.length; i++) {
    const topic = grammarTopics[i];

    if (topic.sourceId === sourceId) {
      topics.push(topic);
    }
  }

  return topics;
}

export function getGrammarTopic(topicId) {
  for (let i = 0; i < grammarTopics.length; i++) {
    const topic = grammarTopics[i];

    if (topic.id === topicId) {
      return topic;
    }
  }

  return null;
}

export function getCcubeSources() {
  return ccubeSources;
}

export function getCcubeSource(sourceId) {
  for (let i = 0; i < ccubeSources.length; i++) {
    const source = ccubeSources[i];

    if (source.id === sourceId) {
      return source;
    }
  }

  return null;
}

export function getCcubeLevels(sourceId, cardsPerLevel) {
  const source = getCcubeSource(sourceId);

  if (source === null) {
    return [];
  }

  return makeLevels(source, cardsPerLevel);
}

export function getCcubeLevel(sourceId, levelId, cardsPerLevel) {
  const levels = getCcubeLevels(sourceId, cardsPerLevel);

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];

    if (level.id === levelId) {
      return level;
    }
  }

  return null;
}

export function getSongSources() {
  return songSources;
}

export function getSongSource(songId) {
  for (let i = 0; i < songSources.length; i++) {
    const song = songSources[i];

    if (song.id === songId) {
      return song;
    }
  }

  return null;
}

export function getSongLevels(songId, cardsPerLevel) {
  const song = getSongSource(songId);

  if (song === null) {
    return [];
  }

  return makeLevels(song, cardsPerLevel);
}

export function getSongLevel(songId, levelId, cardsPerLevel) {
  const levels = getSongLevels(songId, cardsPerLevel);

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];

    if (level.id === levelId) {
      return level;
    }
  }

  return null;
}
