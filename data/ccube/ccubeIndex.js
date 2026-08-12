import ccube78Cards from "./78_eased.json";
import ccube79Cards from "./79_eased.json";
import ccube81Cards from "./81_eased.json";
import ccube82Cards from "./82_eased.json";
import ccube84Cards from "./84_eased.json";
import ccube115Cards from "./115_eased.json";

export const ccubeSources = [
  {
    id: "ccube_78",
    title: "Décrivez votre Journée",
    subtitle: ccube78Cards.length + " pronunciation cards",
    youtubeUrl: "https://www.youtube.com/watch?v=HhHjxXG6slo&t=4s",
    startCard: ccube78Cards[0].fre,
    cards: ccube78Cards
  },
  {
    id: "ccube_79",
    title: "Family Activities and Routines",
    subtitle: ccube79Cards.length + " pronunciation cards",
    youtubeUrl: "https://www.youtube.com/watch?v=7XMq9q27514",
    startCard: ccube79Cards[0].fre,
    cards: ccube79Cards
  },
  {
    id: "ccube_81",
    title: "L’école",
    subtitle: ccube81Cards.length + " pronunciation cards",
    youtubeUrl: "https://www.youtube.com/watch?v=OgFitpV8Ixw",
    startCard: ccube81Cards[0].fre,
    cards: ccube81Cards
  },
  {
    id: "ccube_82",
    title: "Maison hantée et appartement à vendre",
    subtitle: ccube82Cards.length + " pronunciation cards",
    youtubeUrl: "https://www.youtube.com/watch?v=yaBKNzmhUX8&pp=0gcJCd4JAYcqlYzv",
    startCard: ccube82Cards[0].fre,
    cards: ccube82Cards
  },
  {
    id: "ccube_84",
    title: "Planning Chores at Breakfast / Household Chores",
    subtitle: ccube84Cards.length + " pronunciation cards",
    youtubeUrl: "https://www.youtube.com/watch?v=DD1qzYCYTWk",
    startCard: ccube84Cards[0].fre,
    cards: ccube84Cards
  },
  {
    id: "ccube_115",
    title: "Appartement à louer / Studio Tour",
    subtitle: ccube115Cards.length + " pronunciation cards",
    youtubeUrl: "https://www.youtube.com/watch?v=FSKbWJPhYVo",
    startCard: ccube115Cards[0].fre,
    cards: ccube115Cards
  }
];
