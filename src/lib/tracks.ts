/** Playlist data: royalty-free SoundHelix samples with Unsplash covers. */
export interface Track {
  id: number;
  title: string;
  artist: string;
  cover: string;
  src: string;
}

const img = (id: string) => `https://images.unsplash.com/${id}?w=600&h=600&fit=crop&auto=format`;
const song = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

export const TRACKS: Track[] = [
  { id: 1, title: "Neon Horizon", artist: "Aurora Drive", cover: img("photo-1470225620780-dba8ba36b745"), src: song(1) },
  { id: 2, title: "Midnight Static", artist: "The Low Hum", cover: img("photo-1493225457124-a3eb161ffa5f"), src: song(2) },
  { id: 3, title: "Golden Hour", artist: "Saffron Sky", cover: img("photo-1511379938547-c1f69419868d"), src: song(3) },
  { id: 4, title: "Paper Satellites", artist: "Echo Bloom", cover: img("photo-1514525253161-7a46d19cd819"), src: song(4) },
  { id: 5, title: "Velvet Circuit", artist: "Nova Lane", cover: img("photo-1487180144351-b8472da7d491"), src: song(5) },
  { id: 6, title: "Glass Rivers", artist: "Kite & Coast", cover: img("photo-1459749411175-04bf5292ceea"), src: song(6) },
];

/** Format seconds as m:ss (handles NaN/Infinity). */
export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
