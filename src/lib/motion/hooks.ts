import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { gsap } from "./gsap";

/** useLayoutEffect that does not warn during SSR. */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Tracks the user's reduced-motion preference, live.
 *
 * Returns false during SSR and the first client render so markup matches, then
 * settles. Components that only *reduce* motion on `true` can safely treat the
 * first frame as "no preference" — nothing visible depends on it.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Boolean media-query state, SSR-safe.
 *
 * Used where layout *and* motion must both change (e.g. the hero switches from
 * a scroll-pinned sequence to a static composition on mobile).
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * Runs a GSAP setup function inside a scoped context and reverts it on unmount.
 *
 * Every animation created inside the callback is tracked and destroyed, and any
 * ScrollTriggers created inside are killed. `revert: true` restores inline
 * styles too, which is what stops a component from leaving a translated element
 * behind when it unmounts mid-tween.
 */
export function useGsapContext(setup: () => void, deps: React.DependencyList = []) {
  const scope = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(setup, scope);
    return () => ctx.revert();
  }, deps);

  return scope;
}
