import { useRef, type ReactNode } from "react";

import { weddingData } from "@/data/weddingData";
import { gsap } from "@/lib/motion";
import { useIsomorphicLayoutEffect, useReducedMotion } from "@/lib/motion";
import { SectionLabel } from "./SectionLabel";

/**
 * V — Our Story.
 *
 * The couple's own pre-wedding film, self-hosted. The video is the subject; the
 * poster frame is the hero arch shot so the panel is never an empty rectangle
 * while the file loads.
 */
export function Film() {
  const { film } = weddingData;
  const posterRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

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
          <video
            src={weddingData.film.videoUrl}
            poster={weddingData.heroImages.desktop.src}
            controls
            preload="metadata"
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            onPlay={() => window.dispatchEvent(new CustomEvent("film:play"))}
            onEnded={() => window.dispatchEvent(new CustomEvent("film:end"))}
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
