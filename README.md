What goes in TRACKER_API_TOKEN?

Put a long random secret string there.

For example, do not literally use:

TRACKER_API_TOKEN=PUT_A_LONG_RANDOM_SECRET_HERE

Generate one on your Mac with:

openssl rand -hex 32

It will give you something similar to:

a8c991496df4d53a105c753a0fe591e2e13fdf6e0a08a299d8e34f6cd0cb782e

Then put that exact value into:

fms/tracker-server/.env


So run:

cd fms
npm install

and then:

cd tracker-server
npm install

Or from the outer fms folder, you can do both without changing folders:

npm install
npm --prefix tracker-server install
npm --prefix tracker-server start

# French Made Simple

French Made Simple is a beginner-friendly React Native / Expo Router app for learning French using local data.

The app uses local JSON/JS data and Expo Speech for French text-to-speech. There is no backend, no API call, no login, no storage, and no advanced features.

## Main Idea

The Home screen has four study categories:

1. French - KieranBall
2. Grammar
3. Ccube
4. Songs

French - KieranBall uses English to French practice. Ccube and Songs use French lines with pronunciation help.

## Setup

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npx expo start -c
```

## Updated Flow

### French - KieranBall

Home -> French - KieranBall -> choose Course 1 or Course 2 -> choose level size -> choose level -> practice cards.

The course screen shows:

- Course title
- Number of cards
- Clickable YouTube link
- View Levels button

Inside each course, the user can choose how many cards should be in each level:

- 50 cards per level
- 100 cards per level
- 250 cards per level

### Ccube

Home -> Ccube -> choose video -> choose level size -> choose level -> practice cards.

The back of the Ccube card shows pronunciation help and the normal French sentence.

### Songs

Home -> Songs -> choose song -> choose level size -> choose level -> practice cards.

The back of the song card shows pronunciation help and the normal French lyric line.

### Grammar

Home -> Grammar -> choose topic -> practice examples.

Grammar now reads topic files from `data/grammar/topics/`. The Grammar screen still stays simple: search, choose topic, then practice examples.

## Screens

1. `app/index.jsx`  
   Home screen with four choices.

2. `app/sentences/index.jsx`  
   Shows KieranBall courses using `FlatList` and search using `TextInput`.

3. `app/levels/[type].jsx`  
   Shows levels inside a selected KieranBall course, Ccube video, or song. The user can choose 50, 100, or 250 cards per level.

4. `app/grammar/index.jsx`  
   Shows grammar topics using `FlatList` and search using `TextInput`.

5. `app/ccube/index.jsx`  
   Shows Ccube video sources using `FlatList` and search using `TextInput`.

6. `app/songs/index.jsx`  
   Shows song sources using `FlatList` and search using `TextInput`.

7. `app/practice/[type].jsx`  
   Shows one practice card at a time. It reads route parameters and decides whether to show KieranBall, grammar, Ccube, or song cards. The practice screen has previous and next arrows on both left and right sides of the card. It also shows a grey French voice button whenever French text is visible.

## Reusable Component

`components/LevelCard.jsx` is reused by the KieranBall, Grammar, Ccube, Songs, and Levels screens.

It can show:

- Title
- Subtitle
- Detail text
- Optional clickable YouTube button
- Open / View Levels / Practice button

## Local Data Hierarchy

```text
data/
  kieranBall/
    course1.json
    course2.json
    courseIndex.js
  grammar/
    grammarTopics.js
    topics/
      course1_grammar_topics.json
      course2_grammar_topics.json
      78_eased_grammar_topics.json
      79_eased_grammar_topics.json
      81_eased_grammar_topics.json
      82_eased_grammar_topics.json
      84_eased_grammar_topics.json
      115_eased_grammar_topics.json
      song_jusqua_mon_dernier_souffle_grammar_topics.json
  ccube/
    78_eased.json
    79_eased.json
    81_eased.json
    82_eased.json
    84_eased.json
    115_eased.json
    ccubeIndex.js
  songs/
    song_jusqua_mon_dernier_souffle_pronunciation_cards.json
    songIndex.js
  sourceIndex/
    french_learning_sources_index.json
```

## Helper File

`utils/courseData.js` acts like a simple local data helper.

It gives the screens these simple functions:

- `getSentenceCourses()`
- `getSentenceCourse(courseId)`
- `getSentenceLevels(courseId, cardsPerLevel)`
- `getSentenceLevel(courseId, levelId, cardsPerLevel)`
- `getGrammarTopics()`
- `getGrammarTopic(topicId)`
- `getCcubeSources()`
- `getCcubeSource(sourceId)`
- `getCcubeLevels(sourceId, cardsPerLevel)`
- `getCcubeLevel(sourceId, levelId, cardsPerLevel)`
- `getSongSources()`
- `getSongSource(songId)`
- `getSongLevels(songId, cardsPerLevel)`
- `getSongLevel(songId, levelId, cardsPerLevel)`

The helper uses simple arrays, `for` loops, and local data.

## Course Concepts Used

- `useState`
- `useEffect`
- Event handling
- `TextInput`
- Expo Router navigation
- Passing route parameters between screens
- `FlatList`
- `ActivityIndicator`
- `Pressable`
- `StyleSheet`
- Expo Speech for French text-to-speech
- Reusable component
- Organized file structure

## Data Flow Example

KieranBall Course 1:

`course1.json` -> `courseIndex.js` -> `courseData.js` -> `sentences/index.jsx` -> `levels/[type].jsx` -> `practice/[type].jsx`

Example route flow:

```text
/sentences
/levels/sentence?courseId=course1
/practice/sentence?courseId=course1&levelId=1&cardsPerLevel=50
```

Ccube example:

```text
/ccube
/levels/ccube?sourceId=ccube_78
/practice/ccube?sourceId=ccube_78&levelId=1&cardsPerLevel=50
```

## French Voice Feature

The practice screen uses `expo-speech` through `components/VoiceButton.jsx`.

The voice button:

- appears when French text is visible
- is grey normally
- turns black while pressed
- speaks the current French sentence using `fr-FR`

For KieranBall cards, the voice button appears after the user flips to the French side. For Ccube, Songs, and French-only grammar examples, the voice button appears immediately because the visible card text is already French.


## Grammar category flow

Grammar is now split into smaller source groups so the list does not become too large as new categories are added.

Flow:

```text
Grammar
  ↓
KieranBall / Ccube / Songs
  ↓
Course, video, or song source
  ↓
Grammar topics for only that source
  ↓
Practice screen
```

This structure will also make it easy to add future categories like Bbarters without creating one huge grammar list.

## Cypress Green + Cream Panda Theme

The app now uses one shared colour palette from `constants/theme.js`:

- Cypress green for navigation and strong headings
- Royal green for buttons and progress
- Cream backgrounds and card surfaces
- Mint and sage for soft accents

Reusable visual components:

- `components/PandaMascot.jsx` — code-built panda mascot with a green scarf
- `components/PandaBanner.jsx` — reusable title banner with the mascot
- `components/VoiceButton.jsx` — grey voice button that turns black while pressed and shows the panda speaking

The practice screen also includes a simple progress bar so the user can see how far they are through the current level. This stays beginner-friendly because the percentage is calculated directly from `cardIndex` and `cards.length`.

---

## Personal Procrastination Tracker (v1.1)

This project now includes an optional Android-only local-first procrastination tracker, regular-call history, best-effort WhatsApp-call detection, a SQLite activity dashboard, optional MongoDB sync through an included Express API, and time-based Panda launcher icons.

See **`TRACKER_SETUP.md`** before building/testing these native features.

Build the shareable APK with:

```bash
./build-apk.sh
```
