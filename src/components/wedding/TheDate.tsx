import { useCallback, useRef, useState } from "react";

import { weddingData } from "@/data/weddingData";
import { gsap } from "@/lib/motion";
import {
  MaskReveal,
  Reveal,
  useIsomorphicLayoutEffect,
  useReducedMotion,
} from "@/lib/motion";
import { Countdown } from "./Countdown";
import { Lozenge, SectionLabel } from "./SectionLabel";

/**
 * II — The Date. Emerald, the day set as numerals, sealed under a tape.
 *
 * The date is the single most useful fact on the page and it was simply
 * *present* — visible on arrival like any other heading, which is the one thing
 * a printed invitation never does. The day is what you have to tear open to
 * read. So it arrives sealed.
 *
 * Two rules keep the seal honest rather than annoying:
 *
 *  1. It costs one gesture. The tape peels on click, on Enter/Space, or on a
 *     drag past 64px in any direction. There is no puzzle to solve and nothing
 *     that can trap a visitor — the SectionLabel above and the rail to the side
 *     both still say what this section is.
 *  2. It never comes back. Once lifted, the tape is gone and the date stays
 *     legible. A seal that re-forms on scroll would be a punishment for
 *     scrolling past.
 *
 * Reduced motion: no tape at all. The seal is a flourish, and the thing it hides
 * is the content, so without motion there is nothing to reveal — the date is
 * simply there.
 */
export function TheDate() {
  const { theDate } = weddingData;
  const reduced = useReducedMotion();

  const [unsealed, setUnsealed] = useState(false);
  const tapeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /* One flag for "is the date still behind the tape", so the tape and the blur
     can never disagree.

     These were two separate conditions and that was a real bug: reduced motion
     suppressed the tape but not the blur, so a visitor asking for less motion
     was shown a blurred, 42%-opacity date with no tape and therefore no way to
     reveal it. Reduced motion now means the date is simply present, which is the
     right answer anyway — the seal is a flourish and the thing it hides is the
     content. */
  const sealed = !reduced && !unsealed;

  /* The lift, once. `unsealed` is the single source of truth: the tape is
     unmounted by React and the numerals are unblurred by GSAP, so neither can
     disagree about whether the seal is still in place. */
  const unseal = useCallback(() => setUnsealed(true), []);

  useIsomorphicLayoutEffect(() => {
    if (!unsealed) return;
    const content = contentRef.current;
    if (!content) return;

    const ctx = gsap.context(() => {
      gsap.to(content, {
        filter: "blur(0px)",
        opacity: 1,
        scale: 1,
        duration: 1.15,
        ease: "power2.out",
        // blur() is a paint-level filter, so it is dropped the moment it has
        // done its job rather than left on a full-width element for the rest of
        // the visit.
        onComplete: () => gsap.set(content, { clearProps: "filter" }),
      });
    }, contentRef);

    return () => ctx.revert();
  }, [unsealed]);

  return (
    <section
      id="date"
      className="grain section-y-lg relative overflow-hidden bg-emerald text-cream"
      aria-label="The date"
    >
      <div className="shell relative z-10">
        <SectionLabel tone="dark" numeral={theDate.numeral}>
          {theDate.label}
        </SectionLabel>

        {/* Held back until the tape is lifted, then it rises into the space above the
            date.

            It was previously on screen from the start, which undercut the whole
            arrangement: a live clock sitting above a sealed date told a visitor
            exactly how long they had left, and gave the section its subject before
            they had done anything. Now the section asks to be opened first.

            Gated on `sealed`, not on `unsealed`. Under reduced motion the date is
            never sealed — `sealed` is `!reduced && !unsealed` — so those visitors
            get the finished state immediately and see the countdown at once,
            which is what the rest of that path does too.

            It is unmounted rather than hidden, so it reserves no space while
            sealed. That also closes the gap that was sitting between the section
            label and the tape; the countdown fills it once there is something to
            fill it with. */}
        {!sealed && (
          <Reveal delay={0.12}>
            <Countdown />
          </Reveal>
        )}

        {/* The day as a numeral stack: 31 in gold, "of" small, January in cream
            italic. Size contrast does the work — no rule or box needed.

            Wrapped in a plain relative box so the tape can be positioned against
            the numerals themselves rather than against the section. The wrapper
            is deliberately filter-free: `filter` on an ancestor establishes a
            containing block for absolute descendants, so putting the tape inside
            the blurred div would have positioned it correctly AND blurred it. */}
        <div className="relative mt-14 md:mt-20">
          <div
            ref={contentRef}
            data-date-content
            className="flex flex-col items-center"
            // Blurred and dimmed until unsealed. This is an inline style because the
            // values are animated by GSAP and have to survive re-renders; putting
            // them in a class would have them reset on every state change.
            // NOTE the polarity: sealed means the blur IS applied. Swapping
            // `sealed` and `unsealed` here when the flag was renamed inverted
            // this ternary, which left the tape drawn over a fully-visible date
            // in normal motion and a blurred, unreachable date under reduced
            // motion. Both states looked plausible in a screenshot, so only
            // asserting on both at once caught it.
            style={
              sealed
                ? {
                    filter: "blur(20px)",
                    opacity: 0.42,
                    scale: "0.985",
                    // Sealed content is inert. `filter` blurs but does not intercept
                    // pointer events, so without this the date content stayed
                    // interactive underneath the tape before it was lifted.
                    pointerEvents: "none",
                  }
                : undefined
            }
          >
            <MaskReveal
              as="p"
              className="flex items-baseline justify-center font-display text-[clamp(6rem,20vw,13rem)] font-light leading-[0.78] tracking-[-0.04em] text-gold-bright"
            >
              {theDate.dayNumber}
              <span className="ml-4 self-center font-sans text-[0.7rem] font-medium uppercase tracking-[0.3em] text-cream/80 md:ml-6 md:text-xs">
                {theDate.of}
              </span>
            </MaskReveal>

            <MaskReveal
              as="p"
              className="-mt-2 font-display text-[clamp(3rem,10vw,6.5rem)] font-light leading-none tracking-[-0.03em] text-cream italic"
            >
              {theDate.monthName}
            </MaskReveal>

            <Reveal delay={0.14} className="mt-10 flex justify-center">
              <Lozenge tone="dark" />
            </Reveal>

            <Reveal delay={0.2} className="mt-8 text-center">
              <p className="meta text-cream/80">{theDate.qualifier}</p>
            </Reveal>

            <Reveal delay={0.26} className="mt-5 text-center">
              <p className="serif-meta text-cream/80">{theDate.line}</p>
            </Reveal>

          </div>

          {sealed && <Seal onLift={unseal} tapeRef={tapeRef} />}
        </div>
      </div>
    </section>
  );
}

/**
 * The tape. Draggable and clickable.
 *
 * A real button underneath, so keyboard and screen-reader users get the same
 * gesture as everyone else and the control is announced properly — dragging
 * alone would leave the date permanently sealed for anyone not using a mouse.
 */
function Seal({
  onLift,
  tapeRef,
}: {
  onLift: () => void;
  tapeRef: React.RefObject<HTMLDivElement | null>;
}) {
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center"
      // The seal is decorative chrome over content that is still in the DOM and
      // still reachable by assistive tech, so it is not a dialog and must not
      // behave like one.
      aria-hidden="true"
    >
      <div
        ref={tapeRef}
        className="absolute inset-x-0 top-[13%] flex justify-center"
        style={{ rotate: "-2.2deg" }}
      >
        <button
          type="button"
          onClick={onLift}
          className="group relative block w-[min(23rem,78vw)] -rotate-[0.6deg] cursor-pointer select-none border-y border-gold-bright/30 bg-gold-bright/[0.22] px-8 py-6 shadow-[0_14px_34px_-12px_rgba(0,0,0,0.65)] backdrop-blur-[3px] transition-all duration-500 hover:-translate-y-0.5 hover:bg-gold-bright/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
          // Drag support is added manually below so a real <button> can stay a
          // real <button> rather than a div with a keydown handler bolted on.
          onPointerDown={(e) => {
            if (e.button !== 0 && e.pointerType === "mouse") return;
            drag.current = { x: e.clientX, y: e.clientY, moved: false };
            /* Capture the pointer to this element.

               Without this the drag dies the moment the finger or cursor leaves
               the tape: move and up are then delivered to whatever is underneath,
               so onPointerUp never runs and the seal silently fails to lift.
               The tape is ~66px tall and the peel threshold is 64px of travel,
               so leaving it is the normal case rather than an edge case. */
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            const tape = tapeRef.current;
            if (!d || !tape) return;
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (Math.hypot(dx, dy) > 4) d.moved = true;
            // Follows the pointer at roughly a third of its travel, so the tape
            // feels attached at one edge and being peeled rather than dragged
            // like a rigid bar.
            tape.style.transform = `translate3d(${dx * 0.34}px, ${dy * 0.34}px, 0)`;
            tape.style.rotate = `${-2.2 + dx * 0.02}deg`;
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            const tape = tapeRef.current;
            drag.current = null;
            if (!d || !tape) return;

            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            // Peel past 64px and it lifts for good. A shorter drag springs back,
            // which is what tells you the gesture was too small without a word of
            // instruction.
            if (Math.hypot(dx, dy) > 64) {
              onLift();
              return;
            }
            gsap.to(tape, {
              x: 0,
              y: 0,
              rotate: -2.2,
              duration: 0.6,
              ease: "elastic.out(1, 0.45)",
            });
          }}
          onPointerCancel={() => {
            const tape = tapeRef.current;
            drag.current = null;
            if (tape) {
              gsap.to(tape, { x: 0, y: 0, rotate: -2.2, duration: 0.5, ease: "power3.out" });
            }
          }}
        >
          {/* A faint highlight along the top edge, where the tape catches the
              light. Drawn rather than a texture, so it stays crisp at any
              density and adds nothing to the payload. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 block h-px bg-gold-bright/35"
          />

          <span className="meta block text-gold-bright transition-colors duration-500 group-hover:text-gold-bright">
            Lift the tape to read the date
          </span>
        </button>
      </div>
    </div>
  );
}

