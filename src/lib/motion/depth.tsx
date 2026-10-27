import { useRef, type CSSProperties, type ReactNode } from "react";

import { gsap } from "./gsap";
import { useIsomorphicLayoutEffect, useMediaQuery, useReducedMotion } from "./hooks";
import { depth } from "./tokens";
import { cn } from "@/lib/utils";

/**
 * 3D depth system.
 *
 * The rule this exists to enforce: **depth is structure, not decoration.**
 *
 * Every transform here is on a compositor-friendly `transform`, driven by
 * `rotateX`/`rotateY`/`translateZ` only. Nothing animates layout, and nothing
 * is WebGL — a canvas would add ~150KB and, more importantly, would fight the
 * editorial typography rather than support it.
 *
 * Two mechanisms:
 *
 *   <DepthScene>  puts a perspective camera in front of a group of children so
 *                 they occupy real Z space. Because the camera rotates, children
 *                 placed at different `translateZ` parallax against each other
 *                 automatically — no per-element JavaScript at all.
 *
 *   <Tilt3D>      a pointer-tracked plane tilt for interactive surfaces.
 *
 * All of it degrades to flat under `prefers-reduced-motion`, and tilt is
 * disabled on coarse pointers where there is no cursor to track.
 */

/* ------------------------------------------------------------------ *
 * DepthScene
 * ------------------------------------------------------------------ */

type DepthSceneProps = {
  children: ReactNode;
  /**
   * Applied to the **inner** element — the one that is the content container and
   * the camera. Put layout classes (grid, flex, padding) here.
   */
  className?: string;
  /** Applied to the outer perspective wrapper. Rarely needed. */
  outerClassName?: string;
  /**
   * Enables pointer-driven camera rotation.
   * Off by default: it should be used where the payoff is real (the hero), not
   * everywhere, or the whole page starts wobbling.
   */
  interactive?: boolean;
  /** Distance from the viewer. Lower = more dramatic. */
  perspective?: number;
};

/**
 * A perspective camera looking at its children.
 *
 * Two elements, because one element cannot be both its own perspective origin
 * and the thing that rotates with children at different Z depths:
 *
 *   outer — owns `perspective`, never transforms
 *   inner — owns the rotation, `preserve-3d`, and your layout classes
 *
 * `className` lands on the **inner** element. Putting layout on the outer was a
 * real bug during development: the grid went on the wrapper, the children ended
 * up one level too deep, and the hero silently collapsed to a single column.
 *
 * Do not put `overflow: hidden` on either element — overflow forces
 * `transform-style: flat` on descendants and collapses the Z space back to 2D.
 * Clip on a grandchild instead.
 */
export function DepthScene({
  children,
  className,
  outerClassName,
  interactive = false,
  perspective = depth.perspective,
}: DepthSceneProps) {
  const cameraRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const finePointer = useMediaQuery("(pointer: fine)");

  useIsomorphicLayoutEffect(() => {
    const camera = cameraRef.current;
    if (!camera || reduced || !interactive || !finePointer) return;

    const rotateX = gsap.quickTo(camera, "rotationX", { duration: 0.9, ease: "power3.out" });
    const rotateY = gsap.quickTo(camera, "rotationY", { duration: 0.9, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      // -0.5..0.5 from the viewport centre.
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      rotateX(ny * -depth.sceneRotateX * 2);
      rotateY(nx * depth.sceneRotateY * 2);
    };

    const onLeave = () => {
      rotateX(0);
      rotateY(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, reduced, finePointer]);

  return (
    <div className={outerClassName} style={{ perspective: `${perspective}px` }}>
      <div
        ref={cameraRef}
        className={cn(interactive && !reduced && "will-change-transform", className)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * DepthLayer
 * ------------------------------------------------------------------ */

/**
 * Places a child at a fixed distance from the camera.
 *
 * Under a rotating <DepthScene>, layers at different Z offsets parallax against
 * one another on their own. That is the whole trick: real depth for one
 * transform on the parent, rather than a scroll handler per element.
 */
export function DepthLayer({
  children,
  z = 0,
  className,
  style,
}: {
  children: ReactNode;
  /** Distance in px. Negative is further from the viewer. */
  z?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(className)}
      style={{
        transform: reduced ? undefined : `translateZ(${z}px)`,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tilt3D
 * ------------------------------------------------------------------ */

type Tilt3DProps = {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees, per axis. */
  max?: number;
  /** How far the surface lifts toward the viewer on hover, in px. */
  lift?: number;
  /** Adds a specular sheen that tracks the pointer. */
  sheen?: boolean;
  /** How long the pointer must be present before the tilt engages. */
  delay?: number;
};

/**
 * A surface that tilts in 3D toward the pointer.
 *
 * Rotates around its own centre and lifts slightly toward the viewer, so the
 * element reads as a physical plane catching light rather than as a flat card
 * being skewed. Springs back to flat on leave.
 *
 * The perspective lives on the wrapper and the rotation on the child, because
 * an element cannot rotate around its own origin *and* act as its own
 * perspective origin.
 */
export function Tilt3D({
  children,
  className,
  max = 1,
  lift = depth.cardLift,
  sheen = false,
  delay = 0,
}: Tilt3DProps) {
  const planeRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const finePointer = useMediaQuery("(pointer: fine)");
  const enabled = !reduced && finePointer;

  useIsomorphicLayoutEffect(() => {
    const plane = planeRef.current;
    if (!plane || !enabled) return;

    const rx = gsap.quickTo(plane, "rotationX", { duration: 0.55, ease: "power3.out" });
    const ry = gsap.quickTo(plane, "rotationY", { duration: 0.55, ease: "power3.out" });
    const rz = gsap.quickTo(plane, "z", { duration: 0.55, ease: "power3.out" });
    // The sheen tracks the pointer, so it needs to be a touch quicker than the
    // tilt or it visibly lags behind the surface it is meant to be describing.
    const sheenX = sheenRef.current
      ? gsap.quickTo(sheenRef.current, "xPercent", { duration: 0.35, ease: "power2.out" })
      : null;
    const sheenY = sheenRef.current
      ? gsap.quickTo(sheenRef.current, "yPercent", { duration: 0.35, ease: "power2.out" })
      : null;
    const sheenO = sheenRef.current
      ? gsap.quickTo(sheenRef.current, "opacity", { duration: 0.3, ease: "power2.out" })
      : null;

    let armed = delay === 0;
    let armTimer: number | undefined;

    const onMove = (event: PointerEvent) => {
      if (!armed) return;
      const rect = plane.getBoundingClientRect();
      // -0.5..0.5 across the element.
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;

      rx(-py * max * depth.cardRotateX * 2);
      ry(px * max * depth.cardRotateY * 2);
      rz(lift);

      sheenX?.(px * 60);
      sheenY?.(py * 60);
      sheenO?.(0.85);
    };

    const onEnter = () => {
      if (delay > 0 && !armed) {
        armTimer = window.setTimeout(() => {
          armed = true;
        }, delay);
      }
    };

    const onLeave = () => {
      armed = delay === 0;
      if (armTimer !== undefined) window.clearTimeout(armTimer);
      rx(0);
      ry(0);
      rz(0);
      sheenX?.(0);
      sheenY?.(0);
      sheenO?.(0);
    };

    plane.addEventListener("pointermove", onMove);
    plane.addEventListener("pointerenter", onEnter);
    plane.addEventListener("pointerleave", onLeave);

    return () => {
      plane.removeEventListener("pointermove", onMove);
      plane.removeEventListener("pointerenter", onEnter);
      plane.removeEventListener("pointerleave", onLeave);
      if (armTimer !== undefined) window.clearTimeout(armTimer);
    };
  }, [enabled, max, lift, sheen, delay]);

  return (
    <div
      className={cn(enabled && "[perspective:900px]", className)}
      style={{ perspective: enabled ? "900px" : undefined }}
    >
      <div
        ref={planeRef}
        className={cn("relative h-full w-full", enabled && "will-change-transform")}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}

        {/* Specular highlight. A single wide, very low-opacity gradient that
            slides across the surface — the cue that sells a plane as physical
            rather than as a rotated screenshot. */}
        {sheen && (
          <span
            ref={sheenRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0"
            style={{
              background:
                "linear-gradient(105deg, transparent 32%, oklch(1 0 0 / 0.5) 48%, transparent 64%)",
            }}
          />
        )}
      </div>
    </div>
  );
}
