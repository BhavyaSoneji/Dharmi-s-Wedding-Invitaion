import { Fragment, useCallback, useRef, useState } from "react";

import { weddingData } from "@/data/weddingData";
import { Envelope } from "@/components/chrome/Envelope";
import { gsap, ScrollTrigger, SplitText, applyMaskBleed } from "@/lib/motion";
import { useIsomorphicLayoutEffect, useMediaQuery, useReducedMotion } from "@/lib/motion";

/**
 * Hero — "The Photograph Develops".
 *
 * The reference direction this builds on got the palette, the type contrast and
 * the ceremonial centred composition right. What it did not have was an
 * *opening* — the page simply appeared, fully resolved, with no anticipation and
 * nothing to look forward to. That is the thing worth fixing here.
 *
 * The idea: the names arrive first, alone in the dark. Then the photograph comes
 * up *behind* them the way a print develops in a tray — flat, desaturated and
 * lifted, resolving to full contrast — while an aperture opens outward from a
 * horizontal seam. The photograph is never wiped in and never faded in; it comes
 * up. That is the difference between a page that loads and a page that opens.
 *
 * Sequencing, and why each thing is where it is:
 *
 *   0.00s  Aperture opens from the centre seam while the photograph develops.
 *          One tween: the stylesheet derives both the clip-path seam and the
 *          tonal shift from --reveal, so they cannot drift apart.
 *   0.50s  The kicker, alone in the dark for half a second before anything
 *          arrives. That pause is the whole trick: it makes the names feel like
 *          the first event rather than the fourth.
 *   0.75s  Sachin / weds / Dharmi, masked line by line.
 *   1.40s  The rule draws across.
 *   1.85s  The cue to go on.
 *
 * There is no date in the hero. It used to fade in here at 1.50s, both as
 * "22 November 2026" and again spelled out in words. The Date section is sealed
 * behind a tape precisely so the date is something you uncover, and printing it
 * on the first page spent that before the visitor reached it.
 *
 * Everything is transform, opacity, clip-path or a one-shot filter. Nothing
 * animates layout, and the filter is removed once it has done its job.
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const developRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);

  const [assetsReady, setAssetsReady] = useState(false);
  const [sequenceDone, setSequenceDone] = useState(false);

  const reduced = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  /* Stable identities: without these the effect runs twice in development and
     builds two overlapping timelines. */
  // The opening sequence waits for the responsive hero photograph to load.
  const markReady = useCallback(() => setAssetsReady(true), []);
  const onSequenceDone = useCallback(() => setSequenceDone(true), []);

  /* The cached-image race.
     A photograph already in the HTTP cache can finish decoding before React's
     load listener is attached, so onLoad never fires and `assetsReady` stays
     false forever — the envelope never releases and the hero sits undeveloped.
     A short poll closes that gap without guessing at a timeout: it stops the
     moment the bytes are there. onError closes the other, so a broken file
     cannot hang the page either. */
  useIsomorphicLayoutEffect(() => {
    const img = heroImgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      markReady();
      return;
    }
    const timer = window.setInterval(() => {
      if (img.complete && img.naturalWidth > 0) {
        window.clearInterval(timer);
        markReady();
      }
    }, 120);
    return () => window.clearInterval(timer);
  }, [markReady]);

  /** Show the finished photograph and drop the filter. */
  const settle = useCallback(() => {
    const node = developRef.current;
    if (!node) return;
    gsap.set(node, { "--reveal": 1 });
    // An attribute rather than clearProps: the filter lives in the stylesheet,
    // so there is no inline value for clearProps to remove.
    node.setAttribute("data-settled", "true");
  }, []);

  /* ------------------------------------------------------------------ *
   * Opening: the photograph develops
   * ------------------------------------------------------------------ */

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const develop = developRef.current;
    if (!root || !develop) return;

    const q = gsap.utils.selector(root);

    /* Reduced motion: show the finished state and skip the whole sequence.
       The photograph must never be left behind a half-played reveal. */
    if (reduced) {
      settle();
      /* `data-hero-tail` is gone from this selector along with the date it
         animated. Leaving it in would put a non-matching selector in the same
         gsap.set() call as the two that do match — harmless for GSAP, but it
         reads as though the tail is still here. */
      gsap.set(q("[data-hero-cue], [data-hero-kicker]"), {
        opacity: 1,
        y: 0,
      });
      gsap.set(q("[data-hero-rule]"), { scaleX: 1 });
      gsap.set(q("[data-petals]"), { opacity: 1 });
      return;
    }

    /* Still waiting on the opening sequence. The overlay covers the page, so
       there is nothing to see — but the undeveloped state must be forced, and
       `data-settled` cleared.

       This is the bug that silently disabled the whole effect. The two branches
       used to share one condition and one call to settle(), so settle() ran on
       every render while the loader was still up: --reveal was pinned to 1 and
       `data-settled` was set. That attribute turns the filter off, and with the
       filter off the photograph simply appeared with no aperture and no tonal
       shift. The signature move was rendering while looking like it worked. */
    if (!sequenceDone) {
      develop.removeAttribute("data-settled");
      gsap.set(develop, { "--reveal": 0 });
      return;
    }

    let cancelled = false;
    let ctx: gsap.Context | undefined;
    let master: gsap.core.Timeline | undefined;
    const splits: SplitText[] = [];

    const build = () => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        const kicker = q("[data-hero-kicker]")[0] as HTMLElement;
        const names = q("[data-hero-name]")[0] as HTMLElement;
        const rule = q("[data-hero-rule]")[0] as HTMLElement;
        const cue = q("[data-hero-cue]")[0] as HTMLElement;
        const petals = q("[data-petals]")[0] as HTMLElement;

        /* Start from the undeveloped state explicitly. Relying on the stylesheet
           alone would tie the animation to when CSS happened to apply, and a
           late stylesheet would produce a visible pop. */
        develop.removeAttribute("data-settled");
        gsap.set(develop, { "--reveal": 0 });
        gsap.set(q("[data-hero-cue], [data-hero-kicker]"), {
          opacity: 0,
          y: 18,
        });
        gsap.set(rule, { scaleX: 0 });
        gsap.set(petals, { opacity: 0 });

        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        master = tl;

        /* 1 — Aperture and tonal shift, in one tween.

           The stylesheet derives both the clip-path seam and the undeveloped
           filter from --reveal, so a single property drives them and they are
           incapable of disagreeing. It resolves to identity at 1, and
           power2.inOut makes the photograph come up like a print in a tray
           rather than fading in linearly.

           These durations were halved. The whole reveal used to run about 2.9s
           from the names' first movement to the last, and it began 0.55s BEFORE
           the envelope finished clearing - so the first thing a visitor saw the
           instant the envelope left was a dark frame with a kicker on it, then
           another two seconds of names arriving. The envelope is the thing they
           asked to open; the site behind it should already be under way. */
        tl.to(develop, { "--reveal": 1, duration: 0.95, ease: "power2.inOut" }, 0)
          /* 2 — The kicker, now arriving with the photograph rather than alone in
             the dark for half a second. That beat of silence is the delay. */
          .fromTo(kicker, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, 0)
          /* 3 — The rule under the names. */
          .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.5 }, 0.6)
          /* 4 — The cue.

             There is no date step here any more. The hero used to fade in
             "22 November 2026" and then the same date spelled out in words; both
             are gone, because the date is the thing The Date reveals. The step is
             removed rather than left targeting an empty array, which GSAP accepts
             but which leaves a tween in the timeline that can never do anything. */
          .fromTo(cue, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, 0.9)
          /* Petals fade up rather than starting to fall out of nowhere. */
          .fromTo(petals, { opacity: 0 }, { opacity: 1, duration: 0.9 }, 0.1)
          /* Once the reveal has played, remove the filter entirely rather than
             parking on contrast(1) saturate(1) for the rest of the visit. */
          .call(settle, undefined, 0.95);

        if (names) {
          const split = SplitText.create(names, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              // The hero's names are set at leading-[0.9], so the glyph box is
              // ~0.14em taller than the line box and the masks were clipping the
              // bottom of "Sachin" and "Dharmi" before the reveal even started.
              applyMaskBleed(self.lines as Element[]);
              gsap.set(self.lines, { yPercent: 112 });
              /* No delay, and a third off the duration. With the envelope's exit
                 ending 0.55s into this timeline, a 0.65s delay meant the names
                 had not begun to move by the time the envelope was gone. They now
                 start with the photograph, so the two arrive together and the
                 handover reads as one continuous move rather than a beat of
                 empty frame followed by a cascade. */
              return gsap.to(self.lines, {
                yPercent: 0,
                duration: 0.75,
                stagger: 0.08,
                ease: "expo.out",
                delay: 0.05,
              });
            },
          });
          splits.push(split);
        }

        /* A long, slow drift so the hero is never completely still. Twenty-six
           seconds is long enough that it reads as atmosphere rather than motion. */
        if (frameRef.current) {
          gsap.to(frameRef.current, {
            scale: 1.035,
            yPercent: -1.4,
            duration: 26,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }
      }, root);

      master?.play();
    };

    build();

    /* Failsafe. This is the first thing anyone sees, so it must not be able to
       strand the hero in its undeveloped state. */
    const failsafe = window.setTimeout(() => {
      master?.progress(1).timeScale(1);
      settle();
      splits.forEach((split) => gsap.set(split.lines, { yPercent: 0, opacity: 1 }));
    }, 6000);

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      ctx?.revert();
      // SplitText writes DOM outside React's view, so ctx.revert cannot undo it.
      splits.forEach((split) => split.revert());
    };
  }, [reduced, sequenceDone, settle]);

  /* ------------------------------------------------------------------ *
   * Scroll — the frame recedes, the type dissolves. Differing rates are what
   * read as depth rather than as a flat pan.
   * ------------------------------------------------------------------ */

  useIsomorphicLayoutEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const frame = frameRef.current;
    if (!root || !frame) return;

    const ctx = gsap.context(() => {
      const copy = gsap.utils.selector(root);

      gsap
        .timeline({
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "82% top",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
        .to(copy("[data-hero-copy]"), { yPercent: -20, opacity: 0, ease: "none" }, 0)
        // A full-bleed photograph cannot shrink — that would pull its edges in
        // from the viewport and show the ground behind it. It pushes in instead,
        // which reads as the camera moving closer rather than the page closing.
        .to(frame, { scale: 1.06, ease: "none" }, 0);
    });

    return () => ctx.revert();
  }, [reduced, isDesktop]);

  return (
    <>
      {/* The envelope. It is the first screen and it requires a tap: the
          interaction is the opening, and an invitation that opens by itself is
          not an invitation being opened. */}
      <Envelope
        ready={assetsReady || reduced}
        monogram={weddingData.couple.monogram}
        dateLine={weddingData.heroLoaderLine}
        onDone={onSequenceDone}
      />

      <section
        id="top"
        ref={rootRef}
        className="grain relative min-h-[100svh] overflow-hidden bg-ground-warm"
        aria-label="Wedding invitation"
      >
        {/* Ambient petals, behind everything, so the frame sits in front of them
            and the depth reads as real rather than painted on. */}
        <div
          data-petals
          aria-hidden="true"
          className="petals pointer-events-none absolute inset-0 overflow-hidden"
        >
          <span className="petal" />
          <span className="petal" />
          <span className="petal" />
          <span className="petal" />
          <span className="petal" />
          <span className="petal" />
          <span className="petal" />
        </div>

        {/* ---- The photograph, full bleed ----
            The photograph is the page now, not a picture hung on it. It runs
            edge to edge at every width, and the type sits on the image the way
            it does in a printed invitation rather than inside a mount. */}
        <div ref={frameRef} className="absolute inset-0">
          <div
            ref={developRef}
            data-develop
            className="relative h-full w-full overflow-hidden bg-emerald-deep"
          >
            {/* Art direction, not a crop. A landscape arch cannot be cropped
                into a phone without losing the arch, and a portrait cannot be
                cropped into a laptop without losing the couple. The browser
                picks the picture before it downloads anything. */}
            <picture>
              <source
                media="(min-width: 768px)"
                srcSet={weddingData.heroImages.desktop.srcSet}
                sizes="100vw"
              />
              <img
                ref={heroImgRef}
                src={weddingData.heroImages.mobile.src}
                srcSet={weddingData.heroImages.mobile.srcSet}
                sizes="100vw"
                width={weddingData.heroImages.mobile.width}
                height={weddingData.heroImages.mobile.height}
                alt="Dharmi leaning her head against Sachin on the step of the sandstone archway"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                onLoad={markReady}
                onError={markReady}
                className="h-full w-full object-cover object-[22%_45%] md:object-[50%_56%]"
              />
            </picture>

            {/* Two scrims, because the two photographs fail in opposite ways.
                On a phone the type lands on bright, out-of-focus foliage, so it
                needs a local wash behind the letters that fades out before it
                reaches their faces. On a laptop the arch is already dark, and all
                the type needs is a gentle top weight. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 md:hidden"
              style={{
                background:
                  "linear-gradient(to bottom, rgb(10 20 18 / 0.68) 0%, rgb(10 20 18 / 0.58) 30%, rgb(10 20 18 / 0.22) 44%, rgb(10 20 18 / 0.0) 56%, rgb(10 20 18 / 0.26) 100%)",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden md:block"
              style={{
                background:
                  "linear-gradient(to bottom, rgb(10 20 18 / 0.52) 0%, rgb(10 20 18 / 0.30) 26%, rgb(10 20 18 / 0.04) 52%, rgb(10 20 18 / 0.22) 100%)",
              }}
            />
            {/* A neutral darkening only. The previous emerald-tinted multiply
                put a colour wash on the photograph itself, which is exactly
                what the palette is not supposed to do. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink/12" />

            {/* ---- Type, on the photograph ----

                  High on a phone so the names sit in the sky above the couple;
                  centred on a laptop, where the arch gives the block room. */}
            <div
              data-hero-copy
              className="absolute inset-0 flex flex-col items-center justify-start px-5 pt-[13vh] text-center md:justify-start md:pt-[8.5vh]"
            >
              <p
                data-hero-kicker
                className="mb-[clamp(1.2rem,2.2vw,2rem)] font-medium uppercase tracking-[0.42em] text-gold-bright"
                style={{
                  fontSize: "clamp(0.6rem, 0.85vw, 0.72rem)",
                  textShadow: "0 1px 14px rgb(0 0 0 / 0.55)",
                }}
              >
                {weddingData.heroKicker}
              </p>

              <h1
                data-hero-name
                className="flex flex-col items-center font-display font-light leading-[0.9] tracking-[-0.03em] text-cream"
                style={{
                  fontSize: "clamp(3.2rem, 7.4vw, 7.2rem)",
                  textShadow: "0 2px 4px rgb(0 0 0 / 0.28), 0 20px 64px rgb(0 0 0 / 0.38)",
                }}
              >
                {/* Driven by `couple.nameOrder` so the bride-first order is stated once in
                      the data and the hero cannot drift from the rest of the page.

                      A Fragment, not a wrapping element, and that is load-bearing.
                      Wrapping each name in a span made those spans INLINE, so
                      SplitText found two lines where there are three and masked
                      "weds" and "Sachin" together as one line - which is not how
                      they are set, and which stopped the cascade reading as a
                      single continuous move. The h1's direct children have to be
                      the three block-level lines.

                      "weds" rides inside the h1 as a line of it, so SplitText
                      masks and reveals all three as one cascade. */}
                {weddingData.couple.nameOrder.map((person, i) => (
                  <Fragment key={person.role}>
                    {i === 1 && (
                      <span
                        className="my-[0.16em] block font-light italic text-gold-bright"
                        style={{ fontSize: "0.32em" }}
                      >
                        weds
                      </span>
                    )}
                    <span className={`block${person.italic ? " italic" : ""}`}>{person.name}</span>
                  </Fragment>
                ))}
              </h1>

              <span
                data-hero-rule
                aria-hidden="true"
                className="my-[clamp(1.1rem,2.2vw,1.9rem)] block h-px w-[min(6rem,14vw)] origin-left bg-cream/45"
              />

              {/* No date here, deliberately.

                    The date belongs to The Date, which is sealed behind the tape
                    and revealed when it is opened. Printing it on the first page
                    gave it away before that, and made the sealed section a
                    formality rather than a reveal. `displayDate` is still used by
                    the footer, so the value itself
                    stays in the data — only the hero stops showing it. */}
            </div>
          </div>
        </div>

        {/* ---- The cue to go on ----
            A drawn line rather than a bouncing arrow. It reads as a thread being
            pulled rather than as a button. */}
        <a
          data-hero-cue
          href="#invitation"
          className="group absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 text-cream/80 transition-colors duration-500 hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream md:bottom-9 md:left-10 md:translate-x-0 md:items-start"
          style={{ textShadow: "0 1px 12px rgb(0 0 0 / 0.6)" }}
          aria-label="Enter the invitation"
        >
          <span className="meta text-[0.5rem] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0.5">
            Enter
          </span>
          <span className="relative block h-12 w-px overflow-hidden bg-cream/35">
            <span
              className="absolute inset-x-0 top-0 block h-4 bg-gold-bright"
              style={{ animation: "hero-cue 2.8s cubic-bezier(0.65,0,0.35,1) infinite" }}
            />
          </span>
          <style>{`
            @keyframes hero-cue {
              0%   { transform: translateY(-110%); }
              58%  { transform: translateY(320%); }
              100% { transform: translateY(320%); }
            }
            @media (prefers-reduced-motion: reduce) {
              @keyframes hero-cue { 0%, 100% { transform: translateY(0); opacity: .45; } }
            }
          `}</style>
        </a>
      </section>
    </>
  );
}
