import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/tracks";

export type RepeatMode = "off" | "all" | "one";

/**
 * All playback logic lives here, built on a single HTMLAudioElement.
 * The UI only reads state and calls the returned actions.
 */
export function useAudioPlayer(tracks: Track[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [muted, setMuted] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [error, setError] = useState<string | null>(null);
  const [durations, setDurations] = useState<Record<number, number>>({});

  // Refs so event handlers always see the latest settings.
  const settings = useRef({ autoplay, shuffle, repeat, index });
  settings.current = { autoplay, shuffle, repeat, index };
  const shouldPlayRef = useRef(false);

  /** Pick the next index, honouring shuffle and wrapping at the end. */
  const nextIndex = useCallback(
    (from: number) => {
      if (settings.current.shuffle && tracks.length > 1) {
        let n = from;
        while (n === from) n = Math.floor(Math.random() * tracks.length);
        return n;
      }
      return (from + 1) % tracks.length;
    },
    [tracks.length],
  );

  // Create the audio element once (client only) and wire events.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onMeta = () => {
      setDuration(audio.duration);
      setDurations((d) => ({ ...d, [tracks[settings.current.index].id]: audio.duration }));
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setIsPlaying(false);
      setError("This track couldn't be loaded. Try another song.");
    };
    const onEnded = () => {
      const { repeat, autoplay, index } = settings.current;
      if (repeat === "one") {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      const atEnd = !settings.current.shuffle && index === tracks.length - 1;
      if (!autoplay || (atEnd && repeat === "off")) {
        setIsPlaying(false);
        return;
      }
      shouldPlayRef.current = true;
      setIndex(nextIndex(index));
    };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
    };
  }, [tracks, nextIndex]);

  // Preload durations for the playlist using throwaway metadata loads.
  useEffect(() => {
    tracks.forEach((t) => {
      const a = new Audio();
      a.preload = "metadata";
      a.src = t.src;
      a.addEventListener("loadedmetadata", () =>
        setDurations((d) => ({ ...d, [t.id]: a.duration })),
      );
    });
  }, [tracks]);

  // Load a new source when the track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    audio.src = tracks[index].src;
    audio.load();
    if (shouldPlayRef.current) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [index, tracks]);

  // Keep element volume in sync.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume / 100;
  }, [volume, muted]);

  const play = useCallback(() => {
    shouldPlayRef.current = true;
    audioRef.current?.play().catch(() => setError("Playback failed. Try another song."));
  }, []);
  const pause = useCallback(() => {
    shouldPlayRef.current = false;
    audioRef.current?.pause();
  }, []);
  const toggle = useCallback(() => (audioRef.current?.paused ? play() : pause()), [play, pause]);

  const next = useCallback(() => {
    shouldPlayRef.current = isPlaying || shouldPlayRef.current;
    setIndex((i) => nextIndex(i));
  }, [isPlaying, nextIndex]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    // Restart current song if we're more than 3s in.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setIndex((i) => (i - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  const selectTrack = useCallback(
    (i: number) => {
      shouldPlayRef.current = true;
      if (i === settings.current.index) play();
      else setIndex(i);
    },
    [play],
  );

  const seek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(audio.duration)) {
      audio.currentTime = t;
      setCurrentTime(t);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    setVolumeState(clamped);
    setMuted(clamped === 0);
  }, []);

  /** Mute keeps `volume` untouched, so unmuting restores the last level. */
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (m && volume === 0) setVolumeState(50);
      return !m;
    });
  }, [volume]);

  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    [],
  );

  return {
    track: tracks[index],
    index,
    isPlaying,
    currentTime,
    duration,
    durations,
    volume,
    muted,
    autoplay,
    shuffle,
    repeat,
    error,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    selectTrack,
    setVolume,
    toggleMute,
    setAutoplay,
    setShuffle,
    cycleRepeat,
  };
}
