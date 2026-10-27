import { useCallback, useRef, useState } from "react";

import { weddingData } from "@/data/weddingData";
import { gsap, ScrollTrigger } from "@/lib/motion";
import { useIsomorphicLayoutEffect, useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { SectionLabel } from "./SectionLabel";

/**
 * III — Moments. A horizontal gallery driven by vertical scroll.
 *
 * Twenty-three photographs at full size, across seven locations and seven
 * outfits. A horizontal track is the only way to let all of them be seen that
 * big, and vertical scroll mapped onto horizontal travel is the only gesture
 * that keeps working on a touch screen without stealing it.
 *
 * ## The travel
 *
 * The user still scrolls normally. The section maps that onto X and pins while
 * it does so, then releases. It is a scroll-linked transform, not a scroll-hijack:
 * there is no `preventDefault`, no wheel capture and no touch handler anywhere
 * here, so the gesture is never taken away from the visitor.
 *
 * One trigger drives the travel AND the progress readout. Two overlapping
 * triggers — one pinned for the movement, one unpinned for the counter — looked
 * fine and then disagreed with each other, because they measured slightly
 * different scroll ranges and the counter would advance while the bar sat at
 * zero.
 *
 * ## Sizing
 *
 * The composition is pinned, so it has to fit inside 100svh or the photographs
 * get cropped. That fit is *measured* rather than predicted — see `sizeCards`
 * below — because the chrome around the photograph is not a constant.
 *
 * An earlier version sized the card from `vw` and put a `max-h` on the track.
 * The max-height did nothing at all: a flex container only clips to a max-height
 * when it also has `overflow: hidden`, so the photograph simply overflowed the
 * track's own box and the captions spilled past the progress row and over the
 * images.
 *
 * ## Two modes
 *
 * Where the photographs fit within the viewport width — which is what happens on
 * short laptops and on wide monitors — there is little or no horizontal travel
 * available, and pinning for 80px of scroll makes the gallery snap across in one
 * flick. Those viewports get a still row showing everything at once. Everywhere
 * else gets the pinned scroll-driven gallery. The choice is made from
 * measurement, not from a breakpoint, and the progress readout is hidden in row
 * mode because a counter stuck at "01" would be reporting a journey that is not
 * happening.
 *
 * Row mode is guarded by a small item count. A still row is a better answer than
 * a snap for a handful of photographs and a nonsense answer for a full gallery: the cards
 * would be squeezed to their 180px floor and simply overflow. The guard means the
 * fallback can only fire when it can actually fit.
 *
 * ## Reduced motion
 *
 * No pin and no travel — the track becomes a plain vertical stack, so every
 * photograph is reachable without a scroll gesture. `styles.css` enforces the
 * same fallback for the `transform` the trigger would otherwise have written.
 */
export function Moments() {
  const { moments } = weddingData;

  /**
   * Minimum horizontal travel, in px, for the pinned gallery to be worth pinning.
   *
   * Below this the pin is over in a single flick and the whole gallery appears to
   * snap, which is worse than a still row of three photographs.
   */
  const MIN_TRAVEL = 200;

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const reduced = useReducedMotion();

  /**
   * "gallery" = pinned, scroll-driven horizontal track.
   * "row"     = all three photographs at once, no pin and no travel.
   *
   * Which one is right depends on the viewport, and the decision is made from
   * measurement in `sizeCards` rather than from a breakpoint.
   */
  const [mode, setMode] = useState<"gallery" | "row">("gallery");

  /**
   * Sizes the card from the height the pin actually leaves it, then decides
   * whether this viewport gets the scrolling gallery or a still row.
   *
   * The obvious approach — a `min()` of the viewport width and a hand-tuned
   * multiple of `svh` — cannot be made correct. The chrome around the photograph
   * (section label, caption block, progress row, section padding) is not a fixed
   * number of pixels: it scales with the type ramp and with `clamp()`ed spacing,
   * so any constant is wrong by 35–53px at four of the eight breakpoints, which
   * is exactly enough to crop the photograph inside a pinned viewport.
   *
   * So measure it instead. This is not circular: the chrome does not depend on
   * the card's width except through the caption, which is why the loop
   * re-measures until the answer stops moving.
   */
  const sizeCards = useCallback(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const cs = getComputedStyle(section);
    const padding = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

    // The two `shell` children: the label above the track, the progress row below.
    const shells = Array.from(section.querySelectorAll(":scope > .shell")) as HTMLElement[];
    const chrome = shells.reduce((sum, el) => sum + el.offsetHeight, 0);

    /* The figure also carries height that is NOT the photograph: the mount's
       padding and border, plus the caption block. Those live inside the track,
       so the section-level `chrome` above does not include them — and
       subtracting only the section chrome let the image alone eat the entire
       budget, cropping the composition by up to 40px.

       Measuring `figure.offsetHeight - img.offsetHeight` gets both at once, in
       real pixels, instead of predicting them. */
    const card = track.querySelector<HTMLElement>(".moments-card");
    const image = card?.querySelector<HTMLImageElement>("img");
    let overhead = card && image ? card.offsetHeight - image.offsetHeight : 0;

    // Narrowing the card can reflow the caption from two lines to one, which
    // changes `overhead` — so re-measure until the answer stops moving. Two
    // passes is enough for one wrap; the cap stops anything pathological.
    let width = 0;
    for (let pass = 0; pass < 3; pass++) {
      // 22px of guard: 8 for the floor/rounding described above, and 14 for the
      // 12px gap between the section label and the track, which is a margin and
      // therefore invisible to the `offsetHeight` measurement of the chrome.
      const available = window.innerHeight - padding - chrome - overhead - 22;
      if (available <= 0) return;
      // * 0.8 because the card is 4:5 — height is width * 5/4.
      const next = Math.max(
        180,
        Math.floor(Math.min(window.innerWidth - 40, available * 0.8, 700)),
      );
      /* Set it on the TRACK, not the section.

         `styles.css` declares `--mom-card-w` on `.moments-track` itself as the
         pre-measurement fallback, and a custom property declared directly on an
         element always wins over an inherited one. Writing the measured value to
         the section therefore did nothing at all — the track kept resolving its
         own `min()`, the cards stayed at a constant width, and the composition
         stayed 40px too tall inside a pinned viewport. */
      track.style.setProperty("--mom-card-w", `${next}px`);
      if (next === width) break;
      width = next;
      const card2 = track.querySelector<HTMLElement>(".moments-card");
      const img2 = card2?.querySelector<HTMLImageElement>("img");
      overhead = card2 && img2 ? card2.offsetHeight - img2.offsetHeight : overhead;
    }

    /* Decide whether this viewport gets the scrolling gallery or a plain row.

       On a 1280x720 laptop the vertical budget caps the card at ~382px, and
       three of those plus gaps come to 1250px — inside a 1280px viewport. So
       there is only ~78px of horizontal travel available, and pinning for 78px
       of scroll makes the whole gallery snap across in a gesture. That is worse
       than not animating at all.

       It is geometric, not a bug: a 4:5 photograph that fits the height of a
       720px window cannot also be wide enough for three of them to exceed that
       window. So on short viewports the gallery becomes a static row showing all
       three at once — which is the better presentation there anyway — and the
       pinned gallery is reserved for viewports with real travel. */
    const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
    const gutter = 40;
    const count = moments.items.length;
    const rowFit = (window.innerWidth - gutter - gap * (count - 1)) / count;
    const travel = width * count + gap * (count - 1) + gutter - window.innerWidth;

    if (count <= 6 && travel < MIN_TRAVEL) {
      // Show everything at once: size each card so the row exactly fills the
      // viewport, and let the section stand still.
      track.style.setProperty("--mom-card-w", `${Math.max(180, Math.floor(rowFit))}px`);
      setMode("row");
    } else {
      setMode("gallery");
    }
    // `moments` is a module constant, so its length cannot change at runtime.
    // It is listed anyway: the linter cannot know that, and a stale count here
    // would size the row for the wrong number of cards.
  }, [moments.items.length]);

  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    sizeCards();
    if (reduced || mode === "row") return;

    ScrollTrigger.addEventListener("refreshInit", sizeCards);
    window.addEventListener("resize", sizeCards);
    window.addEventListener("orientationchange", sizeCards);

    /* How far the track can travel without leaving a gap at the end.

       NOT `track.scrollWidth - window.innerWidth`. The track is
       `overflow: visible` — it has to be, so the photographs bleed past the
       section's edge and get clipped by the section instead — and a visible
       element has no scrollable overflow region, so `scrollWidth` just reports
       `clientWidth`. Subtracting the viewport from that returned 64px of
       travel on every desktop and the gallery simply sat still.

       Summing the children is explicit and immune to that, and `offsetWidth` is
       unaffected by the transform the trigger writes. Recomputed on every
       refresh because the card width is a function of the viewport. */
    const distance = () => {
      const kids = Array.from(track.children) as HTMLElement[];
      if (!kids.length) return 0;
      const cs = getComputedStyle(track);
      const gap = parseFloat(cs.columnGap || "0") || 0;
      let content = gap * (kids.length - 1);
      for (const k of kids) content += k.offsetWidth;
      content += (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      return Math.max(0, content - window.innerWidth + 48);
    };

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${distance()}`,
          // On a touch screen the browser's own momentum is the easing, so adding
          // scrub lag on top of it makes the gallery feel like it is fighting the
          // finger. A little smoothing still helps a mouse wheel, which arrives
          // in coarse notches.
          scrub: 0.55,
          pin: true,
          anticipatePin: 1,
          // `invalidateOnRefresh` is what re-reads the function-based `x` and
          // `end` after a resize. Do NOT also pass `onRefresh: ScrollTrigger.refresh`
          // — refresh fires onRefresh, which calls refresh, and the whole
          // section dies with a stack overflow.
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
            const next = Math.min(moments.items.length - 1, Math.floor(p * moments.items.length));
            if (progressRef.current) {
              progressRef.current.textContent = String(next + 1).padStart(2, "0");
            }
          },
        },
      });

      /* No per-card fade.

         The set used to ease each frame up from 40% as it came level with the
         centre, with one ScrollTrigger per card keyed to `left 95%`. That worked
         for three frames laid out across a single screen; across ten it
         does not, because the cards past the first screenful sit thousands of
         pixels to the right of the layout viewport and their triggers resolve to
         positions the page can never scroll to. The result was every frame pinned
         at 40% — a gallery that looked washed out rather than composed.

         It is also the wrong idea for this set. The photographs are the subject,
         not a slideshow of one active slide; dimming twenty-two of them to
         advertise the twenty-third trades the thing the page is for against a
         focus effect nobody asked for. */
    });

    return () => {
      ctx.revert();
      ScrollTrigger.removeEventListener("refreshInit", sizeCards);
      window.removeEventListener("resize", sizeCards);
      window.removeEventListener("orientationchange", sizeCards);
    };
  }, [reduced, mode, sizeCards]);

  return (
    /* Padding is small and in svh. `section-y`'s clamp(5rem,12vw,10rem) grows
       with viewport *width*, which has nothing to do with the height budget this
       pinned section has to fit inside, and at 320px of padding there simply is
       not enough room left for a photograph worth the name. `justify-center`
       centres the group in whatever space is left over after the card is sized. */
    <section
      id="moments"
      ref={sectionRef}
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-cream py-[clamp(1rem,2.5svh,2.25rem)]"
      data-mode={mode}
      aria-label="Moments"
    >
      <div className="shell shrink-0">
        <SectionLabel numeral={moments.numeral}>{moments.label}</SectionLabel>
      </div>

      {/* The track runs full-bleed and is clipped by the section, which is what
          makes the last photograph feel like there is somewhere further to go. */}
      <div
        ref={trackRef}
        className="moments-track mt-3 flex shrink-0 gap-4 px-5 will-change-transform sm:gap-6 lg:gap-8"
      >
        {moments.items.map((item, index) => (
          <figure
            key={item.numeral}
            data-moment={item.numeral}
            data-index={index}
            className="moments-card shrink-0"
          >
            {/* Mounted on cream-white, NOT on emerald.

                This sat on `bg-emerald-deep`, the same hue family as The Date's
                deep green ground directly above. Because the track is pinned
                full-bleed with no cream between the two sections, the eye joined
                the two dark grounds into one shape and read deep green bleeding
                down into this page. `bg-card` is a near-white that belongs here,
                and the mount now reads the way a print sits on paper. */}
            <div
              className={cn(
                "relative overflow-hidden border border-gold/25 bg-card p-2 md:p-2.5",
                // Shadow lift for the first photograph — see the `lift` note in
                // weddingData. Shadows only: brightening would blow the
                // marigolds, which already sit at 178/255.
                item.lift && "moments-lift",
              )}
            >
              <img
                src={item.src}
                srcSet={item.srcSet}
                sizes="(min-width: 1024px) 34rem, 88vw"
                alt={item.alt}
                width={item.width}
                height={item.height}
                loading={index === 0 ? "eager" : "lazy"}
                decoding={index === 0 ? "sync" : "async"}
                style={{ objectPosition: item.position }}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>

            <figcaption className="mt-[clamp(0.75rem,1.6svh,1.25rem)] flex items-start gap-3">
              <span aria-hidden="true" className="meta pt-1 text-[0.5625rem] text-gold">
                {item.numeral}
              </span>
              <div>
                {/* The world is the location AND the outfit — the two changed
                    together, so naming the world names both. It is the reason the
                    gallery can carry seven of them without a caption that reads
                    like a spreadsheet. */}
                <span className="meta block text-[0.5rem] text-gold">{item.world}</span>
                <h3 className="mt-1.5 font-display text-xl leading-tight text-emerald md:text-[1.75rem]">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.caption}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="shell shrink-0">
        <div
          data-moments-progress
          className="mt-[clamp(1.5rem,3svh,2.5rem)] flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
        >
          <p className="font-display text-lg tracking-[0.16em] text-ink/70 md:text-2xl">
            {moments.closing}
          </p>

          {/* The readout only means something while the gallery is being driven by
              scroll. In `row` mode every photograph is already on screen, so a
              counter stuck at "01" beside a bar at zero would be reporting a
              journey that is not happening. */}
          {mode === "gallery" && (
            <div className="flex items-center gap-4">
              <span ref={progressRef} className="meta text-[0.5625rem] tnum text-muted-foreground">
                01
              </span>
              <span aria-hidden="true" className="relative block h-px w-24 bg-ink/12 md:w-32">
                <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-gold" />
              </span>
              <span className="meta text-[0.5625rem] tnum text-muted-foreground">
                {String(moments.items.length).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
