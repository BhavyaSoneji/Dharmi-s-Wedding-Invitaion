import { useRef, type ElementType, type ReactNode } from "react";

import { gsap, ScrollTrigger, SplitText } from "./gsap";
import { useIsomorphicLayoutEffect, useMediaQuery, useReducedMotion } from "./hooks";
import {
  fadeGroup,
  imageReveal,
  magnetic,
  parallax,
  revealChars,
  revealMask,
  revealUp,
  scaleOnScroll,
  staggerReveal,
  applyMaskBleed,
} from "./primitives";
import { duration, gsapEase } from "./tokens";

/* ------------------------------------------------------------------ *
 * Reveal
 * ------------------------------------------------------------------ */

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Vertical travel in px. 0 disables the offset, leaving a pure fade. */
  y?: number;
  delay?: number;
  /** Where in the viewport the reveal fires. */
  start?: string;
  id?: string;
};

/**
 * Scroll-triggered entrance for a single element.
 *
 * Marked with `data-reveal` so the stylesheet can hide it before hydration —
 * without that, server-rendered markup paints visible and then snaps away.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  y = 26,
  delay = 0,
  start,
  id,
}: RevealProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const tl = revealUp(element, { delay, y, reduced });
    if (reduced) {
      tl.play();
      return;
    }

    ScrollTrigger.create({
      trigger: element,
      start: start ?? "top 88%",
      once: true,
      onEnter: () => tl.play(),
    });
  }, [delay, y, reduced, start]);

  return (
    <Tag ref={ref} id={id} data-reveal="up" className={className}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ *
 * RevealGroup
 * ------------------------------------------------------------------ */

/**
 * Staggers the reveal across direct children.
 * One trigger for the whole group, so the cascade starts when the group enters
 * rather than each child triggering independently and out of order.
 */
export function RevealGroup({
  children,
  as: Tag = "div",
  className,
  step,
  y,
  variant = "up",
  start,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  step?: number;
  y?: number;
  variant?: "up" | "fade";
  start?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const children_ = gsap.utils.toArray<HTMLElement>(":scope > *", element);
    if (!children_.length) return;

    const tl =
      variant === "fade"
        ? fadeGroup(children_, { reduced })
        : staggerReveal(children_, { step, y, reduced });

    if (reduced) {
      tl.play();
      return;
    }

    ScrollTrigger.create({
      trigger: element,
      start: start ?? "top 84%",
      once: true,
      onEnter: () => tl.play(),
    });
  }, [step, y, reduced, variant, start]);

  return (
    <Tag ref={ref} data-reveal={variant === "fade" ? "fade" : "group"} className={className}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ *
 * MaskReveal
 * ------------------------------------------------------------------ */

type MaskRevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** "lines" is right for headings; "words" for dense body copy. */
  mode?: "lines" | "words" | "chars";
  delay?: number;
  start?: string;
  /** Play on mount instead of on scroll. Used for hero type. */
  immediate?: boolean;
};

/**
 * Text that rises out of a clipping mask, line by line.
 *
 * SplitText wraps the content in its own DOM, so the split instance is created
 * and reverted within the same effect — React never sees the generated nodes,
 * and unmounting cannot leak them.
 */
export function MaskReveal({
  children,
  as: Tag = "div",
  className,
  mode = "lines",
  delay = 0,
  start,
  immediate = false,
}: MaskRevealProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    // `as const` keeps the literal union SplitText expects for `mask`.
    const config = {
      lines: { type: "lines", mask: "lines" },
      words: { type: "words", mask: "words" },
      chars: { type: "chars", mask: "chars" },
    }[mode] as SplitText.Vars;

    // A reduced-motion visitor gets their text immediately with no split at all,
    // which avoids both the layout cost and any chance of text being stranded
    // behind a mask that never animates.
    if (reduced) {
      gsap.set(element, { opacity: 1 });
      return;
    }

    const split = SplitText.create(element, config);
    const targets = config.mask === "words" ? split.words : (split.lines ?? split.chars);
    // Before anything animates: the masks are currently clipping the descenders
    // off the display type.
    applyMaskBleed((targets ?? []) as Element[]);
    const tl = revealMask(targets as gsap.TweenTarget, { delay });
    if (mode === "chars")
      tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: duration.glide }, 0);

    if (immediate) {
      tl.play();
    } else {
      ScrollTrigger.create({
        trigger: element,
        start: start ?? "top 86%",
        once: true,
        onEnter: () => tl.play(),
      });
    }

    return () => split.revert();
  }, [mode, delay, immediate, reduced, start]);

  return (
    <Tag ref={ref} data-reveal="mask" className={className}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ *
 * Parallax
 * ------------------------------------------------------------------ */

/**
 * Scroll-linked vertical parallax.
 *
 * `overflow-hidden` must live on a *parent* of the moved element, otherwise the
 * image exposes the edge of its own box as it travels.
 */
export function Parallax({
  children,
  className,
  strength = 0.15,
  scale = false,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  scale?: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || reduced) return;

    const ctx = gsap.context(() => {
      parallax(element, strength, element.parentElement ?? undefined);
      if (scale) scaleOnScroll(element, { trigger: element.parentElement ?? undefined });
    });
    return () => ctx.revert();
  }, [strength, scale, reduced]);

  return (
    <div ref={ref} className={className} data-parallax={reduced ? undefined : strength}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * MaskedImage
 * ------------------------------------------------------------------ */

/**
 * An image that wipes in behind a clip-path mask.
 *
 * Wraps the <img> in an overflow-hidden frame and scales the inner image down
 * from an over-scale, so the reveal reads as a camera settling rather than a
 * rectangle appearing.
 */
export function MaskedImage({
  src,
  srcSet,
  alt,
  className = "",
  imgClassName = "",
  delay = 0,
  scaleFrom = 1.16,
  sizes,
  width = 1200,
  height = 1500,
  priority = false,
  position,
}: {
  src: string;
  srcSet?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  delay?: number;
  scaleFrom?: number;
  sizes?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** object-position override, e.g. "50% 30%" to reframe a phone photo. */
  position?: string;
}) {
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useIsomorphicLayoutEffect(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img) return;

    const tl = imageReveal(frame, { delay, reduced });
    if (!reduced) {
      tl.fromTo(
        img,
        { scale: scaleFrom },
        { scale: 1, duration: duration.cinematic, ease: gsapEase.out },
        0,
      );
      ScrollTrigger.create({
        trigger: frame,
        start: "top 88%",
        once: true,
        onEnter: () => tl.play(),
      });
    } else {
      tl.play();
    }
  }, [delay, reduced, scaleFrom]);

  return (
    <div ref={frameRef} className={`overflow-hidden ${className}`} data-reveal="image">
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        style={position ? { objectPosition: position } : undefined}
        className={`h-full w-full object-cover ${imgClassName}`}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Magnetic
 * ------------------------------------------------------------------ */

/**
 * Wraps children in a cursor-magnetic field.
 * Pointer-coarse devices and reduced-motion users get no effect at all.
 */
export function Magnetic({
  children,
  className,
  strength = 0.3,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduced = useReducedMotion();
  const isTouch = useMediaQuery("(pointer: coarse)");
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || reduced || isTouch) return;
    return magnetic(element, strength);
  }, [strength, reduced, isTouch]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * TextReveal — hero character cascade
 * ------------------------------------------------------------------ */

/**
 * Per-character cascade for short strings (names, numerals).
 * Split on mount, then run immediately rather than on scroll.
 */
export function TextReveal({
  children,
  className,
  delay = 0,
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (reduced) {
      gsap.set(element, { opacity: 1 });
      return;
    }

    const split = SplitText.create(element, { type: "chars", mask: "chars" });
    applyMaskBleed(split.chars as Element[]);
    revealChars(split.chars, { delay }).play();
    return () => split.revert();
  }, [delay, reduced]);

  return (
    <Tag ref={ref} data-reveal="chars" className={className}>
      {children}
    </Tag>
  );
}
