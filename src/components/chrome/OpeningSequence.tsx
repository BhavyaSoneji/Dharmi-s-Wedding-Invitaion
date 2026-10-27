import { useEffect, useRef, useState } from "react";

import { gsap, useIsomorphicLayoutEffect } from "@/lib/motion";
import { SEQUENCE_DONE } from "@/lib/site";

/**
 * OpeningSequence — the first thing anyone sees.
 *
 * This is a real loading state, not theatre. There is genuinely something to
 * wait for: the display webfont and the hero photograph. Showing an honest, quiet
 * indicator while those arrive is better than pretending the page is instant and
 * then having the hero stutter into place 400ms later.
 *
 * Three rules keep it premium rather than annoying:
 *
 *  1. **A minimum on-screen time.** Even on a warm cache the overlay holds for
 *     ~700ms. An indicator that appears and vanishes in 80ms reads as a glitch,
 *     not as polish.
 *  2. **A hard ceiling.** At 2.4s it moves on regardless of what is still
 *     outstanding. A loader that can trap a visitor is worse than no loader.
 *  3. **An indeterminate sweep, not a fake percentage.** Reporting "73%" when the
 *     underlying progress is two discrete milestones would be a lie dressed as
 *     precision.
 *
 * It also does NOT gate on the GPU layer. Waiting for Three.js would mean holding
 * the visitor on a monogram while 180KB downloads, for an effect that only ever
 * enhances an image they are already looking at.
 *
 * Reduced motion: no sweep, no animation. The monogram simply holds, then the
 * overlay is removed. The content beneath is fully composed either way.
 */

const MIN_MS = 700;
const MAX_MS = 2400;

export function OpeningSequence({
  ready,
  monogram,
  dateLine,
  onDone,
}: {
  /** True once fonts and the hero photograph are both resolved. */
  ready: boolean;
  monogram: string;
  dateLine: string;
  /** Fired when the exit BEGINS, so the hero reveal can overlap this overlay. */
  onDone: () => void;
}) {
  const [gone, setGone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);
  const released = useRef(false);

  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  /** Fire once, however many times the exit effect re-runs. */
  const release = () => {
    if (released.current) return;
    released.current = true;
    onDone();

    /* The soundtrack is waiting on this moment to try for audible playback.
       Dispatched here rather than from the hero so that the signal belongs to
       the sequence that defines it — `MusicToggle` lives in the root document and
       listens on the window, so neither component has to know about the other.

       Fires on the reduced-motion path too (the branch above), which is why the
       music does not simply never start for those visitors. */
    window.dispatchEvent(new CustomEvent(SEQUENCE_DONE));
  };

  /* Both gates: the assets are in, and the minimum time has elapsed. */
  useEffect(() => {
    if (!ready) return;
    const elapsed = performance.now() - startedAt.current;
    const wait = Math.max(0, MIN_MS - elapsed);
    const timer = window.setTimeout(() => setGone(true), wait);
    return () => window.clearTimeout(timer);
  }, [ready]);

  /* The ceiling. Nobody is held past this, whatever is still loading. */
  useEffect(() => {
    const timer = window.setTimeout(() => setGone(true), MAX_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!gone) return;
    const root = rootRef.current;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!root || prefersReduced) {
      release();
      root?.remove();
      return;
    }

    const ctx = gsap.context(() => {
      gsap
        .timeline({ onComplete: () => root.remove() })
        /* The line collapses and the mark lifts first... */
        .to("[data-open-line]", { scaleX: 0, duration: 0.32, ease: "power2.inOut" }, 0)
        .to("[data-open-mark]", { yPercent: -24, opacity: 0, duration: 0.44, ease: "power2.in" }, 0)
        .to("[data-open-meta]", { opacity: 0, duration: 0.28, ease: "power2.in" }, 0)
        /* ...then the ground itself clears, so the photograph is revealed *from
           behind* the mark rather than after it. */
        .to(root, { opacity: 0, duration: 0.42, ease: "power2.inOut" }, 0.12);
    }, root);

    /* Released at the START of the exit, not the end. The hero's develop runs
       underneath this fade, which is what turns two queued animations into one
       continuous opening. */
    release();

    return () => ctx.revert();
  }, [gone, onDone]);

  return (
    <div
      ref={rootRef}
      className="grain fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ground-warm"
      // Presentational, and it covers the page. Assistive tech should not be
      // told there is a dialog, and should not be held inside one either.
      aria-hidden="true"
    >
      <span
        data-open-mark
        className="font-display text-4xl font-light tracking-[0.42em] text-cream/85 sm:text-5xl"
      >
        {monogram}
      </span>

      {/* The sweep. A travelling highlight, not a progress bar. */}
      <span className="relative mt-8 block h-px w-28 overflow-hidden bg-cream/12 sm:w-36">
        <span
          data-open-line
          className="absolute inset-y-0 left-0 block w-1/3 origin-left bg-gradient-to-r from-transparent via-gold-bright to-transparent"
          style={{ animation: "open-sweep 1.9s cubic-bezier(0.65,0,0.35,1) infinite" }}
        />
      </span>

      <span data-open-meta className="meta mt-6 text-[0.5rem] text-cream/30">
        {dateLine}
      </span>

      <style>{`
        @keyframes open-sweep {
          0%   { transform: translateX(-110%); }
          100% { transform: translateX(410%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-open-line] { animation: none !important; transform: scaleX(1) !important; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
