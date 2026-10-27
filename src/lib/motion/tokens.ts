/**
 * Motion design tokens.
 *
 * One place defines how fast, how far and how soft every animation on this site
 * moves. Components never invent raw durations or cubic-beziers — they pick a
 * token, so the whole page shares a single motion language.
 *
 * The three speeds map to the three emotional registers of the site:
 *   snappy  — UI feedback, hovers, small state changes. User-initiated.
 *   glide   — reveals, entrances, transitions. The default.
 *   cinematic — hero storytelling, pinned sequences, large imagery. Rare.
 */

export const duration = {
  instant: 0.18,
  fast: 0.32,
  glide: 0.7,
  slow: 1.1,
  cinematic: 1.7,
} as const;

export type DurationToken = keyof typeof duration;

/**
 * Easings as cubic-bezier arrays.
 *
 * - `out` is the house curve: leaves fast, arrives softly. Used for ~80% of
 *   motion because reveals should feel instant to trigger and expensive to land.
 * - `inOut` is for movement that begins and ends on screen (scroll-linked
 *   transforms) where a symmetric curve avoids a visible "gear change".
 * - `outExpo` is the slow-settle used on hero type for maximum drama.
 */
export const ease = {
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

/** GSAP-native equivalents, for use inside timelines and ScrollTrigger. */
export const gsapEase = {
  out: "power3.out",
  inOut: "power2.inOut",
  outExpo: "expo.out",
  soft: "power2.out",
} as const;

/**
 * Scroll distances are expressed as percentages of the viewport rather than
 * pixel offsets so pinned sequences stay framed on short laptop screens.
 */
export const scroll = {
  /** Section enters the lower third of the viewport. */
  enter: "top 82%",
  /** Section is comfortably in view for mid-point triggers. */
  center: "top 55%",
  /** Section has left the upper viewport. */
  leave: "bottom 18%",
  /** Pin length for a full-viewport pinned sequence. */
  pinHold: "+=100%",
} as const;

/** Shared stagger so groups cascade at a consistent rhythm. */
export const stagger = {
  tight: 0.045,
  default: 0.08,
  loose: 0.14,
} as const;

export const distance = {
  /** Vertical reveal travel. Kept small — long travel reads as lag. */
  rise: 26,
  riseLarge: 60,
} as const;

/**
 * 3D depth tokens.
 *
 * Deliberately small numbers. Past roughly 8° of rotation a tilt stops reading
 * as a physical surface catching light and starts reading as a novelty effect.
 * Depth should be felt, not noticed.
 */
export const depth = {
  /** Camera distance in px. Larger = weaker, more natural perspective. */
  perspective: 1600,
  /** Camera rotation on a scene. Very small — this is atmosphere. */
  sceneRotateX: 2.2,
  sceneRotateY: 3,
  /** Tilt on an interactive surface. */
  cardRotateX: 6,
  cardRotateY: 7,
  /** How far a hovered surface lifts toward the viewer. */
  cardLift: 14,
  /** Hero plane offsets in px. Negative is further from the camera. */
  zPhoto: -70,
  zCopy: 40,
  zAccent: 90,
} as const;
