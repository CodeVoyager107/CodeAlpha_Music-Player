import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Pause, Play, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume, Volume1, Volume2, VolumeX, AlertCircle, ListMusic,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TRACKS, formatTime } from "@/lib/tracks";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse — Modern Music Player" },
      { name: "description", content: "A sleek, responsive web music player with playlist, shuffle, repeat and keyboard shortcuts." },
      { property: "og:title", content: "Pulse — Modern Music Player" },
      { property: "og:description", content: "Stream a curated royalty-free playlist in a sleek dark player." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayerPage,
});

function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-label="Now playing">
      {[0, 0.2, 0.4].map((d) => (
        <span key={d} className="eq-bar h-full w-1 rounded-full bg-primary" style={{ animationDelay: `${d}s` }} />
      ))}
    </span>
  );
}

function IconButton({ active, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "press grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "text-primary hover:text-primary",
        className,
      )}
      {...props}
    />
  );
}

function PlayerPage() {
  const p = useAudioPlayer(TRACKS);
  const effectiveVol = p.muted ? 0 : p.volume;
  const VolIcon = effectiveVol === 0 ? VolumeX : effectiveVol < 35 ? Volume : effectiveVol < 70 ? Volume1 : Volume2;

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); p.toggle(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); p.next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); p.prev(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); p.setVolume((p.muted ? 0 : p.volume) + 5); }
      else if (e.key === "ArrowDown") { e.preventDefault(); p.setVolume((p.muted ? 0 : p.volume) - 5); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p]);

  return (
    <main className="bg-page min-h-screen px-4 py-8 md:py-14">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Player card */}
        <section className="shadow-soft rounded-3xl border bg-card p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            <span className="text-gradient">Pulse</span> · Now playing
          </p>

          <div className="mx-auto mt-6 aspect-square w-full max-w-xs">
            <div className="bg-gradient-accent shadow-glow h-full w-full rounded-full p-1.5">
              <img
                src={p.track.cover}
                alt={`${p.track.title} cover`}
                className={cn("spin-slow h-full w-full rounded-full object-cover", !p.isPlaying && "[animation-play-state:paused]")}
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <h1 className="truncate text-2xl font-bold md:text-3xl">{p.track.title}</h1>
            <p className="mt-1 text-muted-foreground">{p.track.artist}</p>
          </div>

          {p.error && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/15 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {p.error}
            </div>
          )}

          {/* Progress */}
          <div className="mt-6">
            <Slider
              aria-label="Seek"
              value={[p.currentTime]}
              max={p.duration || 1}
              step={0.1}
              onValueChange={([v]) => p.seek(v ?? 0)}
            />
            <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>{formatTime(p.currentTime)}</span>
              <span>{formatTime(p.currentTime)} / {formatTime(p.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between">
            <IconButton aria-label="Shuffle" aria-pressed={p.shuffle} active={p.shuffle} onClick={() => p.setShuffle(!p.shuffle)}>
              <Shuffle className="h-5 w-5" />
            </IconButton>
            <IconButton aria-label="Previous" onClick={p.prev}><SkipBack className="h-6 w-6" /></IconButton>
            <button
              type="button"
              aria-label={p.isPlaying ? "Pause" : "Play"}
              onClick={p.toggle}
              className="press bg-gradient-accent shadow-glow grid h-16 w-16 place-items-center rounded-full text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {p.isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="ml-1 h-7 w-7 fill-current" />}
            </button>
            <IconButton aria-label="Next" onClick={p.next}><SkipForward className="h-6 w-6" /></IconButton>
            <IconButton aria-label={`Repeat: ${p.repeat}`} active={p.repeat !== "off"} onClick={p.cycleRepeat}>
              {p.repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
            </IconButton>
          </div>

          {/* Volume + autoplay */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <IconButton aria-label={p.muted ? "Unmute" : "Mute"} onClick={p.toggleMute}>
              <VolIcon className="h-5 w-5" />
            </IconButton>
            <Slider aria-label="Volume" className="min-w-28 flex-1" value={[effectiveVol]} max={100} step={1} onValueChange={([v]) => p.setVolume(v ?? 0)} />
            <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{effectiveVol}</span>
            <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              Autoplay <Switch checked={p.autoplay} onCheckedChange={p.setAutoplay} />
            </label>
          </div>
        </section>

        {/* Playlist */}
        <section className="shadow-soft rounded-3xl border bg-card p-4 md:p-6">
          <h2 className="flex items-center gap-2 px-2 text-lg font-semibold">
            <ListMusic className="h-5 w-5 text-primary" /> Playlist
          </h2>
          <ul className="mt-3 space-y-1">
            {TRACKS.map((t, i) => {
              const current = i === p.index;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => p.selectTrack(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-accent active:scale-[0.99]",
                      current && "bg-accent",
                    )}
                  >
                    <img src={t.cover} alt="" className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate font-medium", current && "text-primary")}>{t.title}</p>
                      <p className="truncate text-sm text-muted-foreground">{t.artist}</p>
                    </div>
                    {current && p.isPlaying && <Equalizer />}
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                      {p.durations[t.id] ? formatTime(p.durations[t.id] ?? 0) : "--:--"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 px-2 text-xs text-muted-foreground">
            Shortcuts: Space play/pause · ← → previous/next · ↑ ↓ volume
          </p>
        </section>
      </div>
    </main>
  );
}
