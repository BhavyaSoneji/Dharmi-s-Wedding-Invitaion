import { useCallback, useEffect, useRef, useState } from "react";

import { useIsomorphicLayoutEffect } from "@/lib/motion";
import { SEQUENCE_DONE } from "@/lib/site";

/**
 * The soundtrack.
 *
 * Served straight from `public/`, so replacing the track is a file operation and
 * nothing else — replace `public/wedding-ambient.mp3` and it is picked up on the
 * next build, with no code change and no hashed-asset manifest to update.
 *
 * Served locally rather than from a CDN so the site has no runtime dependency on
 * anything outside its own deploy.
 */
const SOURCE = "/wedding-ambient.mp3";

/**
 * How the track opens.
 *
 * It does not open on its own. It starts when the visitor opens the envelope —
 * the seal's click handler is a genuine user activation, which is precisely what
 * browsers require before they will play sound. There is no autoplay to attempt
 * and nothing to work around; see `startWithSound` below.
 *
 * `preload` is `"metadata"`, not `"none"`. Playback has to begin streaming from
 * somewhere, and `"none"` is an instruction not to fetch the resource at all —
 * which left the track at `readyState 0` with no duration and a `play()` that
 * never resolved. `"metadata"` fetches just enough to learn the duration and lets
 * the rest stream, so the tap is answered immediately rather than after a fetch.
 */
export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [audible, setAudible] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const optedOutRef = useRef(false);
  const filmPausedMusicRef = useRef(false);

  const isOptedOut = () => {
    try {
      return window.localStorage.getItem("dr-music") === "off";
    } catch {
      /* storage blocked — treat as not opted out */
      return false;
    }
  };

  /**
   * Start playback, with sound.
   *
   * There is no muted autoplay here any more, and that is a deliberate reversal
   * of the previous behaviour rather than an oversight.
   *
   * The page used to start the track silently and lift the mute on the first
   * gesture, because browsers block audible autoplay and muted autoplay was the
   * only thing permitted. The envelope changed that: its seal is a real control,
   * and tapping it is a real user activation. So there is nothing left to work
   * around. The music now starts at the moment the visitor opens the envelope,
   * audible, from the first bar — which is what an invitation being opened should
   * sound like, and what a muted track leaking under a loading screen was not.
   *
   * It also means the track begins at 0:00 rather than resuming wherever a
   * silent autoplay had drifted to while the visitor was still reading the
   * screen.
   */
  const startWithSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || optedOutRef.current) return;
    if (!audio.paused) return;
    audio.muted = false;
    audio.play().then(
      () => {
        setPlaying(true);
        setAudible(true);
      },
      () => {
        /* Refused after all. Leave the control usable so the visitor can start
           it deliberately. */
        audio.muted = true;
      },
    );
  }, []);

  /* Set volume and read the preference before paint. No `play()` here at all:
     there is no autoplay to attempt, and the element does not need to be running
     for the envelope's tap to start it. */
  useIsomorphicLayoutEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Ambient, not foreground. A wedding invitation that ambushes the listener
    // with an obtrusive loop is a worse experience than no music at all.
    audio.volume = 0.32;
    /* Muted as a PROPERTY, not left to the `muted` attribute in the markup.
       React can land that attribute after this effect has run, and `play()`
       consults the property — so the element looks muted on screen while the
       browser still sees it as audible and refuses:

         NotAllowedError: play() failed because the user didn't interact
         with the document first. */
    audio.muted = true;

    optedOutRef.current = isOptedOut();
    if (optedOutRef.current) audio.pause();
  }, []);

  /* The two cues that can start the music, and they do the same thing.

     SEQUENCE_DONE is dispatched by the envelope from inside its click handler,
     so it arrives with activation in hand and is the intended trigger — the
     visitor opening the envelope is the moment the music belongs.

     The three DOM activation events are the fallback for anyone who reaches the
     music some other way: reduced motion, or a browser where the envelope's
     handler did not run. Scroll is deliberately NOT among them, because it does
     not grant user activation.

     The opt-out is honoured in both, so a visitor who has deliberately switched
     the music off is not ambushed by a stray tap. */
  useEffect(() => {
    const opts = { once: true, passive: true } as const;
    window.addEventListener(SEQUENCE_DONE, startWithSound, opts);
    window.addEventListener("pointerdown", startWithSound, opts);
    window.addEventListener("keydown", startWithSound, opts);
    window.addEventListener("touchstart", startWithSound, opts);

    return () => {
      window.removeEventListener(SEQUENCE_DONE, startWithSound);
      window.removeEventListener("pointerdown", startWithSound);
      window.removeEventListener("keydown", startWithSound);
      window.removeEventListener("touchstart", startWithSound);
    };
  }, [startWithSound]);

  /* Track the element rather than trusting our own state, so the control cannot
     claim to be playing when the browser has paused it behind our back — or the
     reverse. The initial sync matters because playback can already be under way
     by the time this attaches. */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    if (!audio.paused) setPlaying(true);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  /* Stop playback when the page is leaving, including when it enters the
     back/forward cache. Browsers already stop audio on a normal close; this
     makes the stop explicit for navigation and cached page exits too. */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const stopOnPageExit = () => {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        /* The track may not have loaded enough to seek yet. */
      }
    };

    window.addEventListener("pagehide", stopOnPageExit);
    return () => window.removeEventListener("pagehide", stopOnPageExit);
  }, []);

  /* Pause the soundtrack while the couple's film is playing, so the video's
     audio is not fighting the ambient track. Resume when the film ends, unless
     the visitor has deliberately opted out of music. */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onFilmPlay = () => {
      if (!audio.paused) {
        audio.pause();
        filmPausedMusicRef.current = true;
        setPlaying(false);
        setAudible(false);
      }
    };
    const onFilmEnd = () => {
      if (optedOutRef.current || !filmPausedMusicRef.current) return;
      filmPausedMusicRef.current = false;
      audio.muted = false;
      audio.play().then(
        () => {
          setPlaying(true);
          setAudible(true);
        },
        () => {
          /* Refused — leave the control usable. */
        },
      );
    };

    window.addEventListener("film:play", onFilmPlay);
    window.addEventListener("film:end", onFilmEnd);
    return () => {
      window.removeEventListener("film:play", onFilmPlay);
      window.removeEventListener("film:end", onFilmEnd);
    };
  }, []);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      audio.muted = true;
      setAudible(false);
      setPlaying(false);
      /* Marked in the ref as well as storage, so the first-gesture listener
         stands down immediately rather than waiting for the next mount to
         re-read localStorage. */
      optedOutRef.current = true;
      try {
        window.localStorage.setItem("dr-music", "off");
      } catch {
        /* ignore */
      }
      return;
    }

    // Reached by a deliberate tap, so user activation is in hand and the track
    // can come up with sound rather than waiting for another gesture.
    optedOutRef.current = false;
    audio.muted = false;
    setAudible(true);
    try {
      await audio.play();
      setPlaying(true);
      try {
        window.localStorage.setItem("dr-music", "on");
      } catch {
        /* ignore */
      }
    } catch {
      setLoadFailed(true);
    }
  }, [playing]);

  /* Only hidden when there is genuinely nothing to play. It deliberately stays
     available after a visitor turns the music OFF, so that decision is
     reversible — previously an opt-out removed the control permanently. */
  if (loadFailed) return null;

  const label = playing
    ? audible
      ? "Pause background music"
      : "Unmute background music"
    : "Play background music";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={label}
      title={playing ? (audible ? "Pause music" : "Unmute music") : "Play music"}
      /* Pinned to the viewport rather than left in the document flow. It used to
         carry no positioning at all, which parked it after the last section —
         so the one control a guest might reach for was the hardest thing on the
         page to find.

         `z-40` matches the edge rail, and the rail is vertically centred and
         desktop-only, so the two never meet. Below `lg` the rail is hidden and
         this is the only pinned control.

         The safe-area insets keep it clear of the iOS home indicator and of
         rounded display corners, which a bare `bottom-5` sits underneath. */
      className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-cream/85 text-ink shadow-[0_2px_10px_-2px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-colors hover:border-gold hover:text-emerald"
    >
      <audio
        ref={audioRef}
        src={SOURCE}
        loop
        // "metadata", not "none": autoplay cannot start against a resource the
        // browser has been told not to fetch.
        preload="metadata"
        // No `autoPlay` attribute. Playback is started deliberately from the
        // effect above so that the first attempt is already the audible one,
        // timed to the opening sequence, rather than a muted start that the
        // markup gets there before anything else has run.
        muted
        onError={() => setLoadFailed(true)}
      />

      {/* Three bars that only animate while playing, driven by a CSS class
          rather than JS so the animation costs nothing on the main thread. */}
      <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden="true">
        {[0, 1, 2].map((bar) => (
          <span
            key={bar}
            className="block w-[2.5px] origin-bottom rounded-full bg-current transition-[height,opacity] duration-300 group-hover:bg-emerald"
            style={{
              height: playing ? undefined : "4px",
              // Muted playback is still running, so the bars keep moving; they
              // just read at half strength to say "not audible yet".
              opacity: playing && !audible ? 0.45 : undefined,
              animation: playing
                ? `eq 1.05s ease-in-out ${bar * 0.17}s infinite alternate`
                : undefined,
            }}
          />
        ))}
      </span>

      <style>{`
        @keyframes eq {
          from { height: 4px; opacity: 0.55; }
          to   { height: 14px; opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes eq { from, to { height: 9px; opacity: 1; } }
        }
      `}</style>
    </button>
  );
}
