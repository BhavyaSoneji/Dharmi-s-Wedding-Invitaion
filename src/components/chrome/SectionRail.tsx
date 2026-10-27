import { useRef, useState } from "react";

import { sections } from "@/data/weddingData";
import { useIsomorphicLayoutEffect, useMediaQuery, useReducedMotion } from "@/lib/motion";

/**
 * The right-edge navigation rail.
 *
 * A column of dots, one per movement, with a hairline running behind them. The
 * active dot grows and turns gold; the line behind fills as the page scrolls.
 * Fixed to the right edge, desktop only — on a phone it would sit on top of the
 * content and there is no room for it beside a 390px viewport.
 *
 * The rail is written once with IntersectionObserver rather than a scroll
 * handler, so it costs nothing per frame and cannot miss a fast flick.
 */
export function SectionRail() {
  const [active, setActive] = useState(0);
  const fillRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  /* Which section owns the viewport. rootMargin biases the line towards the
     upper third — a section that is merely "touching" the bottom of the screen
     is not yet the one the reader is looking at. */
  useIsomorphicLayoutEffect(() => {
    if (reduced) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Pick whichever observed section is most visible; ties resolve to the
        // one nearest the top of the viewport.
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        }
        if (!best) return;
        const index = sections.findIndex((section) => section.id === best.target.id);
        if (index >= 0) setActive(index);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.15, 0.4, 0.75, 1] },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [reduced]);

  /* The hairline fill. GSAP scrub rather than a scroll listener so it shares
     the ticker with everything else on the page. */
  useIsomorphicLayoutEffect(() => {
    const fill = fillRef.current;
    if (!fill || reduced) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = `scaleY(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  if (!isDesktop) return null;

  return (
    <nav
      aria-label="Movements"
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-5 lg:flex xl:right-9"
    >
      <span className="meta mb-1 text-[0.5rem] text-muted-foreground">Invitation</span>

      <div className="relative flex flex-col items-center gap-4 py-1 pl-4">
        {/* The rail hairline, with a gold fill tracking page progress. */}
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-ink/12" />
        <span
          ref={fillRef}
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-px origin-top bg-gold"
          style={reduced ? { transform: "scaleY(1)" } : undefined}
        />

        {sections.map((section, index) => {
          const isActive = index === active;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={isActive ? "true" : undefined}
              className="group relative flex items-center gap-2.5"
            >
              {/* Screen-reader label; the dot itself carries no text. */}
              <span className="sr-only">
                {section.numeral} — {section.label}
              </span>
              <span
                aria-hidden="true"
                className={
                  isActive
                    ? "block h-[7px] w-[7px] rounded-full bg-gold ring-4 ring-gold/12 transition-all duration-500"
                    : "block h-[5px] w-[5px] rounded-full bg-ink/25 transition-all duration-500 group-hover:bg-ink/55"
                }
              />
            </a>
          );
        })}
      </div>
    </nav>
  );
}
