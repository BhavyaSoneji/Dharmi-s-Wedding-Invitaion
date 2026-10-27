import { gsap } from "./gsap";
import { distance, duration, gsapEase, scroll, stagger } from "./tokens";

/**
 * The site's animation vocabulary.
 *
 * These are pure factory functions: they build a timeline or tween but never
 * attach it. That separation is deliberate — it lets a caller `.add()` them into
 * a larger timeline, hand them to a ScrollTrigger, or play them immediately,
 * without any duplication of the underlying motion design.
 *
 * Every function honours a `reduced` flag by returning an inert timeline that
 * simply sets the end state, so the static experience is always correct and we
 * never have to branch at the call site.
 *
 * -- Why `gsap.set` + `.to()` and never `.from()` -----------------------------
 * The stylesheet hides `[data-reveal]` elements at `opacity: 0` before hydration,
 * so server-rendered markup does not flash visible and then snap away. But
 * `.from()` resolves its end value by *reading the element's current computed
 * style* — which at that moment is the guard's 0. So `.from({ opacity: 0 })`
 * resolves to 0 -> 0 and the element never appears. That bug shipped silently
 * once and blanked every section below the hero.
 *
 * `gsap.set()` writes an explicit, deterministic start state and `.to()` names
 * the end state outright. Neither consults the stylesheet, so these animations
 * are correct whether or not the guard happens to be active.
 */

/* ------------------------------------------------------------------ *
 * Text
 * ------------------------------------------------------------------ */

/**
 * Rises and fades text into place.
 * The default entrance for headings and paragraphs.
 */
export function revealUp(
  targets: gsap.TweenTarget,
  options: { delay?: number; y?: number; reduced?: boolean } = {},
) {
  const { delay = 0, y = distance.rise, reduced = false } = options;

  if (reduced) {
    return gsap.timeline({ paused: true }).set(targets, { opacity: 1, y: 0 });
  }

  gsap.set(targets, { opacity: 0, y });

  return gsap.timeline({ paused: true, delay }).to(targets, {
    opacity: 1,
    y: 0,
    duration: duration.glide,
    ease: gsapEase.out,
  });
}

/**
 * Reveals text line by line behind a clipping mask.
 *
 * This is the "expensive" text entrance, reserved for hero-scale type and the
 * couple's names. `SplitText` wraps each line in its own overflow-hidden box, so
 * lines rise out of nothing rather than fading in place.
 *
 * The caller must pass elements that SplitText can measure, and must call
 * `SplitText.create(...).revert()` — `revealMask` does this for you when given a
 * `split` instance, which is why the primitive takes the splitter as an argument.
 */
export function revealMask(
  lines: gsap.TweenTarget,
  options: { delay?: number; y?: number; stagger?: number; reduced?: boolean } = {},
) {
  const { delay = 0, y = 105, stagger: step = stagger.default, reduced = false } = options;

  if (reduced) {
    return gsap.timeline({ paused: true }).set(lines, { yPercent: 0, opacity: 1 });
  }

  gsap.set(lines, { yPercent: y, opacity: 0 });

  return gsap.timeline({ paused: true, delay }).to(lines, {
    yPercent: 0,
    opacity: 1,
    duration: duration.slow,
    ease: gsapEase.outExpo,
    stagger: step,
  });
}

/* ------------------------------------------------------------------ *
 * Mask bleed
 * ------------------------------------------------------------------ */

/**
 * How far a mask's clip edge is pushed beyond its box, in em.
 *
 * Measured against the worst case on the site, not guessed: at `leading-[0.78]`
 * the numeral "31" needs 45px of glyph box at a 208px font size — 0.22em — and
 * the hero's three-line name cascade needs 0.14em. 0.3em covers both with room
 * to spare, and because it is an outward-only change to the clip edge it costs
 * no layout.
 */
const MASK_BLEED = "0.3em";

/**
 * Stops SplitText masks from slicing ascenders and descenders off display type.
 *
 * A SplitText mask is the *line box* — the height of `line-height` — and it
 * clips with `overflow: clip`. But the glyph box of a display serif is always
 * taller than its line box, and the display headings here are set deliberately
 * tight (`leading-[0.98]` for `display-1`, `0.78` for the date numerals). So
 * every masked heading was quietly losing the bottom of its descenders: the "j"
 * in "Will you join us?" and the "g" in "Things to know" were both sliced flat,
 * and the "31" was losing 45px.
 *
 * `overflow-clip-margin` expands a `overflow: clip` edge outward without
 * touching layout at all — no padding, no negative margin, no reflow — which is
 * exactly what is needed here. The tight leading that gives the typography its
 * character is preserved, and the mask still hides the text before it plays
 * because `revealMask` starts every line at `opacity: 0`.
 *
 * Takes the split's own line/word/char elements rather than a list of masks,
 * because the mask is simply their parent and this does not depend on which of
 * those SplitText happened to expose.
 */
export function applyMaskBleed(parts: Element[]) {
  for (const part of parts) {
    const mask = part.parentElement;
    if (!mask) continue;
    const overflow = getComputedStyle(mask).overflow;
    // Only `clip` honours overflow-clip-margin; `hidden` does not, and applying
    // it there would look like it worked while doing nothing.
    if (overflow === "clip") mask.style.overflowClipMargin = MASK_BLEED;
  }
}

/** Character-by-character cascade. Only for short strings — a name, a numeral. */
export function revealChars(
  chars: gsap.TweenTarget,
  options: { delay?: number; stagger?: number; reduced?: boolean } = {},
) {
  const { delay = 0, stagger: step = 0.028, reduced = false } = options;

  if (reduced) {
    return gsap.timeline({ paused: true }).set(chars, { opacity: 1, yPercent: 0 });
  }

  gsap.set(chars, { opacity: 0, yPercent: 55, rotate: 4 });

  return gsap.timeline({ paused: true, delay }).to(chars, {
    opacity: 1,
    yPercent: 0,
    rotate: 0,
    duration: duration.glide,
    ease: gsapEase.out,
    stagger: step,
  });
}

/* ------------------------------------------------------------------ *
 * Containers & media
 * ------------------------------------------------------------------ */

/**
 * Wipes a clip-path mask across an element to reveal it.
 * The primary image-entrance on this site.
 */
export function imageReveal(
  target: gsap.TweenTarget,
  options: { delay?: number; from?: string; duration?: number; reduced?: boolean } = {},
) {
  const {
    delay = 0,
    from = "inset(100% 0% 0% 0%)",
    duration: dur = duration.cinematic,
    reduced = false,
  } = options;

  const tl = gsap.timeline({ paused: true, delay });

  if (reduced) {
    return tl.set(target, { clipPath: "inset(0% 0% 0% 0%)", scale: 1 });
  }

  return tl
    .fromTo(
      target,
      { clipPath: from },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: dur,
        ease: gsapEase.outExpo,
      },
    )
    .fromTo(target, { scale: 1.14 }, { scale: 1, duration: dur * 1.15, ease: gsapEase.out }, 0);
}

/**
 * Cascades a group of elements in sequence.
 * The workhorse for grids, lists and card rows.
 */
export function staggerReveal(
  targets: gsap.TweenTarget,
  // Options explicitly admit `undefined` so callers can forward optional props
  // straight through; the defaults below then decide the real value.
  options: {
    delay?: number | undefined;
    step?: number | undefined;
    y?: number | undefined;
    reduced?: boolean | undefined;
  } = {},
) {
  const { delay = 0, step = stagger.default, y = distance.rise, reduced = false } = options;

  if (reduced) {
    return gsap.timeline({ paused: true }).set(targets, { opacity: 1, y: 0 });
  }

  gsap.set(targets, { opacity: 0, y });

  return gsap.timeline({ paused: true, delay }).to(targets, {
    opacity: 1,
    y: 0,
    duration: duration.glide,
    ease: gsapEase.out,
    stagger: step,
  });
}

/** Fades a group with a soft scale lift. For imagery rather than text. */
export function fadeGroup(
  targets: gsap.TweenTarget,
  options: { delay?: number; step?: number; reduced?: boolean } = {},
) {
  const { delay = 0, step = stagger.loose, reduced = false } = options;

  if (reduced) {
    return gsap.timeline({ paused: true }).set(targets, { opacity: 1, scale: 1 });
  }

  gsap.set(targets, { opacity: 0, scale: 1.04 });

  return gsap.timeline({ paused: true, delay }).to(targets, {
    opacity: 1,
    scale: 1,
    duration: duration.slow,
    ease: gsapEase.soft,
    stagger: step,
  });
}

/* ------------------------------------------------------------------ *
 * Scroll-linked
 * ------------------------------------------------------------------ */

/**
 * Vertical parallax, expressed as a fraction of the element's own height.
 *
 * Runs off ScrollTrigger's scrub so it stays in sync with the scroll position
 * rather than playing a fixed-length tween. Only transforms are animated, which
 * keeps this off the layout/paint path.
 */
export function parallax(target: gsap.TweenTarget, strength = 0.18, trigger?: Element) {
  return gsap.fromTo(
    target,
    { yPercent: -strength * 100 },
    {
      yPercent: strength * 100,
      ease: "none",
      scrollTrigger: {
        trigger: trigger ?? (target as Element),
        start: scroll.enter,
        end: scroll.leave,
        scrub: true,
        invalidateOnRefresh: true,
      },
    },
  );
}

/** Slow counter-zoom: the image tightens as it travels through the viewport. */
export function scaleOnScroll(
  target: gsap.TweenTarget,
  options: {
    from?: number | undefined;
    to?: number | undefined;
    trigger?: Element | undefined;
  } = {},
) {
  const { from = 1.18, to = 1, trigger } = options;

  return gsap.fromTo(
    target,
    { scale: from },
    {
      scale: to,
      ease: "none",
      scrollTrigger: {
        trigger: trigger ?? (target as Element),
        start: scroll.enter,
        end: scroll.leave,
        scrub: true,
        invalidateOnRefresh: true,
      },
    },
  );
}

/** Horizontal travel across the viewport. For accent rules and metadata rails. */
export function slideX(target: gsap.TweenTarget, from: number, to: number, trigger?: Element) {
  return gsap.fromTo(
    target,
    { x: from },
    {
      x: to,
      ease: "none",
      scrollTrigger: {
        trigger: trigger ?? (target as Element),
        start: scroll.enter,
        end: scroll.leave,
        scrub: true,
        invalidateOnRefresh: true,
      },
    },
  );
}

/* ------------------------------------------------------------------ *
 * Interaction
 * ------------------------------------------------------------------ */

/**
 * Magnetic pull toward the cursor.
 *
 * The element eases toward the pointer within a radius and springs back on
 * leave. Deliberately subtle — a displacement of ~0.3 of the travel distance so
 * it registers as weight rather than as a toy.
 */
export function magnetic(target: gsap.TweenTarget, strength = 0.32) {
  const element = target as HTMLElement;
  const quickX = gsap.quickTo(element, "x", { duration: 0.45, ease: "power3.out" });
  const quickY = gsap.quickTo(element, "y", { duration: 0.45, ease: "power3.out" });

  const onMove = (event: PointerEvent) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = element.getBoundingClientRect();
    quickX((event.clientX - rect.left - rect.width / 2) * strength);
    quickY((event.clientY - rect.top - rect.height / 2) * strength);
  };

  const onLeave = () => {
    quickX(0);
    quickY(0);
  };

  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerleave", onLeave);

  // Returned so callers can register this with gsap.context's cleanup.
  return () => {
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerleave", onLeave);
  };
}
