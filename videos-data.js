/* All videos live here. Newest first. To add a video, add ONE line.
   title : shown under the thumbnail and in the player
   topic : one of Overthinking, Discipline, Hard seasons, Letting go, Life
   src   : path or URL of the MP4 (for example "videos/life-backwards.mp4"),
           or an embed URL (YouTube, Vimeo, Cloudflare Stream)
   cover : path of the cover image (9:16). Leave "" to use a title card.
   hi    : the word in the title to highlight in blue on the title card
   date  : the day it went up, as "YYYY-MM-DD". Drives the "New this week" label
           and tells search engines when it was published. Optional.
   dur   : length in seconds, shown on the thumbnail. Optional. */
window.VIDEOS = [
  { title: "Three fuel sources", topic: "Discipline", src: "videos/three-fuel-sources.mp4", cover: "videos/three-fuel-sources.jpg", hi: "fuel", date: "2026-11-09", dur: 58 },
  { title: "Life makes sense backwards", topic: "Letting go", src: "videos/life-makes-sense-backwards.mp4", cover: "videos/life-makes-sense-backwards.jpg", hi: "backwards", date: "2026-11-09", dur: 46 },
  { title: "Give it good problems to solve", topic: "Overthinking", src: "videos/give-it-good-problems-to-solve.mp4", cover: "videos/give-it-good-problems-to-solve.jpg", hi: "problems", date: "2026-11-09", dur: 43 }
];
