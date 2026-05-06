import hiyoko1 from "./hiyoko1.webp";
import hiyoko2 from "./hiyoko2.webp";
import hiyoko3 from "./hiyoko3.webp";
import hiyoko4 from "./hiyoko4.webp";
import hiyoko5 from "./hiyoko5.webp";
import hiyoko6 from "./hiyoko6.webp";
import hiyoko7 from "./hiyoko7.webp";
import hiyoko8 from "./hiyoko8.webp";
import hiyoko9 from "./hiyoko9.webp";
import hiyoko10 from "./hiyoko10.webp";

export const HIYOKO_IMAGE_URLS = [
  hiyoko1,
  hiyoko2,
  hiyoko3,
  hiyoko4,
  hiyoko5,
  hiyoko6,
  hiyoko7,
  hiyoko8,
  hiyoko9,
  hiyoko10,
] as const;

export const getRandomHiyokoImageUrl = () =>
  HIYOKO_IMAGE_URLS[Math.floor(Math.random() * HIYOKO_IMAGE_URLS.length)];

export const NEXT_SCREEN_IMAGE_URLS = [...HIYOKO_IMAGE_URLS];
