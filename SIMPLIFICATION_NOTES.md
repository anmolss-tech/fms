# Simplification Notes

This version keeps the app beginner-friendly and marks-focused.

## What was added

- Home now has four categories.
- KieranBall courses now open into their own level screen.
- Ccube videos now open into their own level screen.
- Songs now open into their own level screen.
- Users can choose 50, 100, or 250 cards per level.
- YouTube links are clickable using React Native `Linking.openURL()`.
- Ccube and Song card backs show pronunciation help and the normal French sentence.
- Course 1 and Course 2 data were replaced with the new uploaded JSON files.
- Added a reusable `VoiceButton` component for French text-to-speech.
- Added `expo-speech` to `package.json`.

## What was not added

- No backend
- No API call
- No AsyncStorage
- No login
- No animation
- No advanced state management

## Why the level screen exists

Large data files are easier to practice when broken into smaller levels.

Example:

```text
Course 1 has many cards.
The user chooses 50 cards per level.
The app creates Level 1, Level 2, Level 3, etc.
```

This keeps the app simple and also gives the user control.

## Latest Update

- Applied the two-sided arrow layout from the earlier project version.
- The practice screen now has previous and next arrows on both left and right sides of the flashcard.
- Added imported grammar topic JSON files under `data/grammar/topics/`.
- Updated `data/grammar/grammarTopics.js` so all grammar topics from KieranBall, CCube, and Songs are available in the Grammar screen.
- Grammar examples with no English text now safely show the French example instead of a blank card.


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


## Voice update

The French voice feature was added in a simple way.

- `components/VoiceButton.jsx` handles the speak button.
- `app/practice/[type].jsx` decides which French text should be spoken.
- The button is grey normally and black while pressed, matching the navigation button behaviour.
- KieranBall speaks the French answer after the card is flipped.
- Ccube and Songs speak the normal French sentence, not the pronunciation spelling.

## Panda Theme Update

- Added a shared cypress-green, royal-green, cream, mint, and sage palette.
- Added a reusable panda mascot built only with React Native `View` and `Text`.
- Added reusable panda banners across the app.
- Updated cards, search inputs, YouTube buttons, level selectors, and headers.
- Redesigned the voice button so the panda appears to speak the French phrase.
- The voice button remains grey normally and turns black while pressed.
- Added a simple practice progress bar using the current card number and total card count.
- No new backend, API, storage, authentication, or advanced library was added.
