import { useCallback, useEffect, useRef, useState } from "react";

import { gsap, useIsomorphicLayoutEffect, useReducedMotion } from "@/lib/motion";
import { SEQUENCE_DONE } from "@/lib/site";

/**
 * The envelope.
 *
 * The first screen. Five flat layers in a CSS preserve-3d rig — back, card,
 * notched front, hinged flap, wax seal — built in `envelope.css`. No WebGL: five
 * polygons do not justify a second rendering loop in front of a page that
 * already has one, and CSS gives real perspective and real z-ordering for free.
 *
 * The tap does three things at once, which is what makes it feel like one
 * physical event rather than three animations queued together:
 *
 *   1. Dispatches SEQUENCE_DONE, which is the soundtrack's cue to start. Because
 *      this fires inside a real click handler the browser has user activation,
 *      so playback begins *with sound* — the autoplay wall that made this
 *      impossible on a plain page load is simply not there once the visitor has
 *      touched the envelope.
 *   2. Runs the opening timeline.
 *   3. On completion, calls `onDone` so the hero can develop underneath.
 *
 * On assets: the release is held until the hero photograph has loaded, because
 * the hero's own reveal starts on `onDone` and firing early would develop a
 * photograph that has not arrived. The wait is capped, because an envelope that
 * will not open is worse than a hero that develops slightly late.
 */

export function Envelope({
  ready,
  monogram,
  dateLine,
  onDone,
}: {
  /** True once the fonts and the hero photograph have both resolved. */
  ready: boolean;
  monogram: string;
  /** The line set on the card that emerges. */
  dateLine: string;
  /** Fired as the envelope starts clearing, so the hero develops underneath it. */
  onDone: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLButtonElement>(null);

  const [opening, setOpening] = useState(false);
  const reduced = useReducedMotion();

  const openedRef = useRef(false);
  const releasedRef = useRef(false);
  const timelineDoneRef = useRef(false);
  const waitingOnAssetsRef = useRef(false);

  /**
   * Take the overlay down, but only once BOTH halves are done: the opening
   * animation has finished, and the hero has been handed over.
   *
   * Removing on the animation alone was a genuine defect. The exit tween ends at
   * a fixed time, so if the photograph had not reported ready by then the
   * envelope would vanish over a hero still frozen in its undeveloped state —
   * an empty frame the visitor could do nothing about until a six-second
   * fallback released it. The envelope is a loading screen; if the page is not
   * ready, staying up is its job, not a failure.
   */
  const maybeRemove = useCallback(() => {
    if (timelineDoneRef.current && releasedRef.current) rootRef.current?.remove();
  }, []);

  /** Fire once, however many times this is reached. */
  const release = useCallback(() => {
    if (releasedRef.current) return;
    releasedRef.current = true;
    waitingOnAssetsRef.current = false;
    onDone();
    maybeRemove();
  }, [onDone, maybeRemove]);

  /* The hand-off. Called when the animation wants the page back, which is not
     necessarily when the page can have it: if the photograph is still arriving,
     hold the envelope and let it go the moment it lands. */
  const requestRelease = useCallback(() => {
    if (ready) {
      release();
      return;
    }
    waitingOnAssetsRef.current = true;
  }, [ready, release]);

  /* Waiting on the photograph turns into a release the moment it arrives... */
  useEffect(() => {
    if (ready && waitingOnAssetsRef.current) {
      waitingOnAssetsRef.current = false;
      release();
    }
  }, [ready, release]);

  /* ...and the cap, so a photograph that never reports ready cannot hold the page
     hostage. The opening now takes a little over three seconds, so leave enough
     room for that sequence before applying the broken-image fallback. */
  useEffect(() => {
    if (!opening) return;
    const cap = window.setTimeout(() => {
      waitingOnAssetsRef.current = false;
      release();
      /* The animation has almost certainly finished by now, but if it has not,
         tear the overlay down anyway rather than leaving it over a page the
         visitor has already been given. */
      rootRef.current?.remove();
    }, 4500);
    return () => window.clearTimeout(cap);
  }, [opening, release]);

  /* Reduced motion. No rotation, no travel: the seal lets go, the flap and card
     cross-fade, and the concept survives intact. The button is still required —
     the interaction IS the opening, and removing it would leave a page that
     changes on its own with no cause. */
  const open = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    setOpening(true);

    /* Inside the click handler, so the browser has granted activation by now.
       This is what lets the soundtrack come up with sound. */
    window.dispatchEvent(new CustomEvent(SEQUENCE_DONE));

    const root = rootRef.current;
    const rig = rigRef.current;
    const flap = flapRef.current;
    const card = cardRef.current;
    const seal = sealRef.current;

    if (!root || !rig || !flap || !card || !seal) {
      /* Nothing to animate — better to hand the page over than to sit on a
         broken envelope. */
      release();
      return;
    }

    if (reduced) {
      gsap
        .timeline({
          onComplete: () => {
            timelineDoneRef.current = true;
            maybeRemove();
          },
        })
        .to(seal, { opacity: 0, scale: 0.7, duration: 0.3, ease: "power2.in" }, 0)
        .to(flap, { opacity: 0, y: -18, duration: 0.45, ease: "power2.inOut" }, 0.12)
        .to(card, { opacity: 0, y: -26, duration: 0.45, ease: "power2.inOut" }, 0.24)
        .to({}, { duration: 0.01, onStart: requestRelease }, 0.42)
        .to(root, { opacity: 0, duration: 0.4, ease: "power2.inOut" }, 0.42);
      return;
    }

    let ctx: gsap.Context | undefined;

    try {
      ctx = gsap.context(() => {
        /* Start states set explicitly rather than implied by a `.from()`. A
           `.from()` here reads the DOM at build time and animates *to* those
           values, so a stale or already-animated element starts from the wrong
           place and nothing appears to happen. */
        gsap.set(seal, { scale: 1, opacity: 1, rotate: 0, y: 0 });
        gsap.set(flap, { rotationX: 0 });
        gsap.set(card, { y: 0, z: -2, scale: 1, opacity: 1 });
        gsap.set(rig, { rotationX: 6, rotationY: -8, scale: 1 });

        gsap
          .timeline({
            onComplete: () => {
              timelineDoneRef.current = true;
              maybeRemove();
            },
          })
          /* The press. Small and fast, so the first thing that happens is a
             response to the finger — nothing feels more broken than a tap that
             is met with a delay. */
          .to(seal, { scale: 1.16, duration: 0.12, ease: "power2.out" }, 0)
          /* The seal lets go and drops away. */
          .to(
            seal,
            { scale: 0.5, rotate: 16, y: 30, opacity: 0, duration: 0.52, ease: "power2.in" },
            0.1,
          )
          /* The envelope turns to face you as it opens. Small, but it is what
             turns "a shape rotated" into "an object handled". */
          .to(rig, { rotationX: 2, rotationY: 0, duration: 1.25, ease: "power2.inOut" }, 0.16)
          /* The flap. Hinged on its top edge, all the way past flat, so the
             inside of the envelope becomes visible behind it. */
          .to(flap, { rotationX: -172, duration: 1.25, ease: "power2.inOut" }, 0.24)
          /* The card comes up out of the notch AND toward the viewer. The two
             together are what read as depth; either alone reads as a slide. */
          .to(card, { y: "-38%", z: 64, duration: 1.35, ease: "power3.out" }, 0.72)
          /* After clearing the pocket, let the card settle back into the centre
             of the stage instead of continuing to drift toward the top edge. */
          .to(card, { y: 0, scale: 1.2, z: 120, duration: 1.05, ease: "power2.inOut" }, 2.02)
          /* Release here, not at the end: the hero develops underneath the
             clearing envelope, so there is never a frame of bare page between the
             two. The longer card movement gets a moment to settle before the
             site begins developing underneath it. */
          .to({}, { duration: 0.01, onStart: requestRelease }, 2.62)
          .to(root, { opacity: 0, scale: 1.03, duration: 0.52, ease: "power2.inOut" }, 2.62);
      }, root);
    } catch {
      /* A timeline that cannot be built must not leave the page behind an
         opaque overlay with no way past it. */
      release();
    }

    return () => ctx?.revert();
  }, [reduced, release, requestRelease, maybeRemove]);

  /* Remove ourselves if the component unmounts for any reason, so no orphan
     overlay is left sitting over the site. */
  useIsomorphicLayoutEffect(() => {
    return () => {
      const root = rootRef.current;
      if (root?.parentNode) root.remove();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="env grain fixed inset-0 z-[100] overflow-hidden"
      // Covers the page and is purely presentational. Assistive tech is not
      // told there is a dialog, and is not held inside one.
      aria-hidden="true"
    >
      <div className="env__stage">
        <div className="flex flex-col items-center justify-center px-5">
          <div ref={rigRef} className="env__rig">
            <span className="env__shadow" />

            {/* The far face, then the lining: the interior the card sits against. */}
            <div className="env__back" />
            <div className="env__lining" />

            {/* The invitation. Tucked behind the notched front; revealed by the
                geometry of the opening rather than faded in. */}
            <div ref={cardRef} className="env__card">
              <span className="env__card-mark">{monogram}</span>
              <span className="env__card-rule" />
              <span className="env__card-line">{dateLine}</span>
            </div>

            {/* The near face and its two creases. */}
            <div className="env__front">
              <span className="env__crease" style={{ left: "12%" }} />
              <span className="env__crease" style={{ left: "88%" }} />
            </div>

            {/* The flap. Pivots on its top edge. */}
            <div ref={flapRef} className="env__flap" />

            {/* The wax seal, inside the rig so it shares the envelope's depth and
                is occluded by the flap like everything else. The anchor holds the
                centring; the button itself carries no transform, which leaves GSAP
                free to own scale, rotation and travel. */}
            <div className="env__seal-anchor">
              <button
                ref={sealRef}
                type="button"
                className="env__seal"
                onClick={open}
                aria-label="Open the invitation"
                tabIndex={opening ? -1 : 0}
              >
                <span aria-hidden="true">{monogram}</span>
              </button>
            </div>
          </div>

          <div className="env__hint">
            <span className="env__hint-text">Tap to open</span>
            <span className="env__hint-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
