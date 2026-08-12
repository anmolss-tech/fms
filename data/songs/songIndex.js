import souffleCards from "./song_jusqua_mon_dernier_souffle_pronunciation_cards.json";

export const songSources = [
  {
    id: "song_jusqua_mon_dernier_souffle",
    title: "Jusqu’à mon dernier souffle",
    subtitle: souffleCards.length + " pronunciation cards",
    youtubeUrl: "https://www.youtube.com/watch?v=LcJxrtURopg",
    startCard: souffleCards[0].fre,
    cards: souffleCards
  }
];
