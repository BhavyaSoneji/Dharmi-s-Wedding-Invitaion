import { useEffect, useRef, type ReactNode } from "react";

import { weddingData } from "@/data/weddingData";
import { gsap } from "@/lib/motion";
import { useIsomorphicLayoutEffect, useReducedMotion } from "@/lib/motion";
import { SectionLabel } from "./SectionLabel";

type YouTubeStateChange = { data: number };

type YouTubePlayer = {
  destroy: () => void;
};

type YouTubeIframeApi = {
  PlayerState: { ENDED: number; PLAYING: number };
  Player: new (
    element: HTMLIFrameElement,
    options: { events: { onStateChange: (event: YouTubeStateChange) => void } },
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeIframeApi> | undefined;

function loadYouTubeIframeApi() {
  if (window.YT) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeIframeApi>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) resolve(window.YT);
      else reject(new Error("YouTube Player API did not initialize."));
    };

    if (document.getElementById("youtube-iframe-api")) return;

    const script = document.createElement("script");
    script.id = "youtube-iframe-api";
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("YouTube Player API failed to load."));
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

/**
 * V — Our Story.
 *
 * The couple's pre-wedding film, embedded from YouTube. The player API keeps
 * the ambient music in sync with film playback.
 */
export function Film() {
  const { film } = weddingData;
  const posterRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    let player: YouTubePlayer | undefined;
    let active = true;

    loadYouTubeIframeApi()
      .then((youtube) => {
        if (!active || !playerRef.current) return;

        player = new youtube.Player(playerRef.current, {
          events: {
            onStateChange: ({ data }) => {
              if (data === youtube.PlayerState.PLAYING) {
                window.dispatchEvent(new CustomEvent("film:play"));
              } else if (data === youtube.PlayerState.ENDED) {
                window.dispatchEvent(new CustomEvent("film:end"));
              }
            },
          },
        });
      })
      .catch(() => {
        // The embedded player remains available if the optional API is blocked.
      });

    return () => {
      active = false;
      player?.destroy();
    };
  }, []);

  // A slow scale-in on the poster as it enters. Deliberately short: the panel is
  // large, so a slow reveal here would feel like lag.
  useIsomorphicLayoutEffect(() => {
    const poster = posterRef.current;
    if (!poster || reduced) return;
    gsap.fromTo(
      poster,
      { autoAlpha: 0, scale: 0.98 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: poster, start: "top 88%", once: true },
      },
    );
  }, [reduced]);

  return (
    <section id="film" className="section-y bg-cream" aria-label="Our story">
      <div className="shell">
        <SectionLabel numeral={film.numeral}>{film.label}</SectionLabel>

        <div className="mt-12 text-center md:mt-16">
          <RevealInline>
            <p className="eyebrow">{film.eyebrow}</p>
          </RevealInline>
          <MaskHeading>{film.heading}</MaskHeading>
          <RevealInline delay={0.12}>
            <p className="body-copy mx-auto mt-6 text-center">{film.sub}</p>
          </RevealInline>
        </div>

        <div
          ref={posterRef}
          className="scrim relative mt-12 aspect-video w-full overflow-hidden bg-ink md:mt-16"
        >
          <iframe
            ref={playerRef}
            src={`${film.videoUrl}?enablejsapi=1&playsinline=1&rel=0`}
            title="Dharmi and Sachin's wedding film"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </section>
  );
}

/* Small local wrappers so this file reads as layout, not as motion plumbing. */
import { MaskReveal, Reveal } from "@/lib/motion";

function RevealInline({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className="flex justify-center">
      {children}
    </Reveal>
  );
}

function MaskHeading({ children }: { children: ReactNode }) {
  return (
    <MaskReveal as="h2" className="display-1 mt-5 text-emerald">
      {children}
    </MaskReveal>
  );
}
