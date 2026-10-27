import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useIsomorphicLayoutEffect, useReducedMotion } from "@/lib/motion";

/**
 * PhotoDepth — the hero photograph, rendered on the GPU.
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT A PARTICLE FIELD
 * --------------------------------------------------
 * The obvious thing to reach for with Three.js on a wedding site is floating
 * geometry or a particle starfield. That is exactly the move that makes a site
 * read as generated. This component does something CSS structurally cannot:
 *
 *   **Volumetric parallax inside a flat image.**
 *
 * CSS can move a whole plane in Z. It cannot make the *near* parts of a
 * photograph travel further than the *far* parts. Here a fragment shader offsets
 * sampling per-pixel by a depth field derived from the image's own luminance and
 * a subject-centred falloff, so the couple and the garlands sit forward while the
 * sandstone arch recedes. Moving the pointer reveals real depth in a flat JPEG.
 *
 * On top of that, a very low-amplitude refraction so the image reads as being
 * behind glass — which is the right metaphor, because the whole design is a
 * printed invitation on a table. Then a single soft specular band, as if that
 * glass caught the light.
 *
 * Everything is deliberately under a few percent of displacement. The effect
 * should be *felt* and never *noticed*. If a reviewer can point at it, it is
 * too strong.
 *
 * DEGRADATION — this is an enhancement, never a requirement
 * --------------------------------------------------------
 *  - Reduced motion  -> plain <img>, no WebGL context created at all
 *  - No WebGL2/WebGL -> plain <img>
 *  - SSR             -> plain <img>
 *  - Context lost    -> falls back to the <img> underneath
 *
 * The <img> is always in the DOM underneath the canvas. That is the fallback, the
 * no-JS case and the print case all at once — the photograph is never absent.
 */

/**
 * Is this device plausibly able to afford a WebGL context?
 *
 * Three.js is ~180KB gzip — more than two thirds of this site's entire JS budget.
 * That is a fair trade on hardware that renders it well and a poor one on hardware
 * that will drop frames. These are the signals browsers actually expose; none of
 * them are reliable on their own, so they are used only to rule a device *out*,
 * never to promise one in.
 */
function canAffordWebGL() {
  if (typeof navigator === "undefined") return false;
  // The browser already knows: if it can make a 2D canvas it can usually do WebGL,
  // but a software rasteriser on a low-end phone is the case worth avoiding.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number" && memory <= 2) return false;
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores <= 2) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2  uPointer;   // -0.5 .. 0.5
  uniform float uScroll;    // 0 .. 1 through the hero
  uniform float uTime;
  uniform float uAmount;    // 0 when disabled, so it eases rather than snaps
  uniform vec2  uTexel;     // 1 / texture size, for grain
  varying vec2 vUv;

  // Cheap hash for grain. Not noise() — this has to run every frame per pixel.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    // --- depth field -------------------------------------------------------
    // Two terms, multiplied:
    //   1. a subject-centred radial falloff — the couple are near the middle of
    //      the frame, so the centre travels furthest and the edges least
    //   2. luminance — bright, dense, close subjects (garlands, the couple's
    //      clothing) push further forward than dark distant sandstone
    vec3 probe = texture2D(uTexture, uv).rgb;
    float luma = dot(probe, vec3(0.299, 0.587, 0.114));

    vec2 fromCentre = uv - 0.5;
    float radial = 1.0 - smoothstep(0.12, 0.72, length(fromCentre * vec2(1.0, 1.12)));
    float density = smoothstep(0.18, 0.86, luma);
    float depth = clamp(radial * 0.72 + density * 0.42, 0.0, 1.0);

    // --- refraction --------------------------------------------------------
    // Two out-of-phase sine bands. Amplitude is tiny (< 0.4% of the frame) — this
    // is the "behind glass" cue, not a wobble.
    float t = uTime * 0.28;
    vec2 ripple = vec2(
      sin(uv.y * 22.0 + t) * cos(uv.x * 15.0 - t * 0.7),
      cos(uv.x * 19.0 - t * 0.8) * sin(uv.y * 13.0 + t * 0.5)
    ) * 0.0016;

    // --- parallax ----------------------------------------------------------
    // The whole point: offset scales with the depth field, so near and far
    // separate. Plus a slow scroll drift, integrated with the rest of the page.
    vec2 parallax = uPointer * depth * 0.055;
    parallax.y -= uScroll * 0.05 * (0.35 + depth * 0.65);

    vec2 shifted = uv + (parallax + ripple) * uAmount;

    // Clamp rather than wrap: wrapping would slide the opposite edge of the
    // photograph into frame as a visible seam.
    vec4 texel = texture2D(uTexture, clamp(shifted, vec2(0.0015), vec2(0.9985)));

    // --- specular band -----------------------------------------------------
    // One narrow band travelling diagonally, as if light moved across glass.
    // Edge-weighted so it brightens the periphery, where a real reflection
    // would catch, and stays out of the couple's faces.
    //
    // Kept narrow and weak on purpose. At a wider band and higher gain this
    // read as a blown-out hot spot in the corner of the photograph rather than
    // as a reflection — which is the opposite of the intent.
    float band = 1.0 - smoothstep(0.0, 0.17, abs(fract((uv.x * 0.45 + uv.y * 0.28) - uTime * 0.045) - 0.5));
    float edge = smoothstep(0.42, 0.98, length(fromCentre * vec2(1.0, 1.15)));
    float sheen = band * edge * 0.026 * uAmount;

    vec3 color = texel.rgb + vec3(sheen * 0.95, sheen * 0.92, sheen * 0.85);

    // --- grain -------------------------------------------------------------
    // Matches the CSS grain utility so the GPU and DOM layers share a texture.
    float g = hash(uv / uTexel * 0.5 + uTime * 0.0004) - 0.5;
    color += g * 0.021;

    // No mask in the shader on purpose. The arch silhouette belongs to CSS
    // (border-radius plus overflow-hidden on the parent), so there is exactly
    // one source of truth for the shape. A shader mask would have to be kept in
    // exact agreement with that border-radius by hand, and the first time they
    // drifted by a pixel it would show as a sliver along one edge — visible
    // only in the fallback, which is the worst possible way to find out.
    gl_FragColor = vec4(color, texel.a);

    /* The texture is decoded from sRGB to linear on upload (colorSpace is set
       to SRGBColorSpace), so the shader works in linear light. Without this
       chunk nothing converts the result back, and the framebuffer receives
       linear values it interprets as sRGB — which is why the hero photograph
       rendered roughly 1.8x darker than the file, with the shadows crushed and
       the blue sky turned to navy. ShaderMaterial does not get this for free;
       every hand-written fragment shader has to ask for it. */
    #include <colorspace_fragment>
  }
`;

type PhotoDepthProps = {
  src: string;
  srcSet?: string;
  sizes?: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
  /** Enables pointer/scroll response. Off for anything below the fold. */
  interactive?: boolean;
  /** Scales the whole effect. 1 = designed strength. */
  amount?: number;
  /**
   * Called once the texture has actually decoded, so the opening sequence can
   * wait on the real thing rather than on a fixed timeout. Without this the
   * photograph would still be arriving while it appears to develop.
   */
  onReady?: () => void;
  /**
   * Called when the plain <img> underneath has loaded.
   *
   * The opening sequence gates on THIS, not on the texture. Waiting for the
   * texture means waiting on the whole Three.js chunk first, which would hold
   * the visitor staring at a monogram while 180KB downloads — for an effect
   * that is a progressive enhancement on an image they are already looking at.
   */
  onImageLoad?: () => void;
};

export function PhotoDepth({
  src,
  srcSet,
  sizes,
  width,
  height,
  alt,
  className,
  interactive = true,
  amount = 1,
  onReady,
  onImageLoad,
}: PhotoDepthProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    // Never create a GL context for a visitor who asked for less motion — that
    // costs memory and battery for something they will never see. And never
    // download 180KB of Three.js onto hardware that cannot render it well.
    if (reduced || !canAffordWebGL()) {
      setFailed(true);
      // No GPU path means no texture callback ever fires. Release the opening
      // sequence here, or it waits out its own ceiling with nothing pending.
      onReady?.();
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // Three is ~150KB. It must never be in the server bundle, and it must never
    // be fetched by a visitor who ends up not needing it.
    void (async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          // Software rasterisers report this as unavailable; failing fast lets
          // the <img> underneath take over instead of dropping frames.
          powerPreference: "high-performance",
        });

        const gl = renderer.getContext();
        if (!gl) {
          setFailed(true);
          return;
        }

        const scene = new THREE.Scene();
        // Orthographic: the photograph should sit flat on the page, not recede
        // like a quad in a room. The depth comes from the shader, not the camera.
        const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 10);
        camera.position.z = 1;

        const uniforms = {
          uTexture: { value: null as import("three").Texture | null },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uScroll: { value: 0 },
          uTime: { value: 0 },
          uAmount: { value: 0 },
          uTexel: { value: new THREE.Vector2(1 / 1200, 1 / 1500) },
        };

        const material = new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          uniforms,
          transparent: true,
          depthWrite: false,
        });

        const geometry = new THREE.PlaneGeometry(1, 1);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const pointer = { x: 0, y: 0 };
        let scrollProgress = 0;
        const targetAmount = interactive ? amount : 0;
        let raf = 0;
        let running = true;

        /* ---- sizing: match the wrapper, cap DPR at 2 ---- */
        const resize = () => {
          const rect = wrap.getBoundingClientRect();
          if (rect.width < 1 || rect.height < 1) return;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          renderer.setPixelRatio(dpr);
          renderer.setSize(rect.width, rect.height, false);
          uniforms.uTexel.value.set(1 / rect.width, 1 / rect.height);
        };

        const ro = new ResizeObserver(resize);
        ro.observe(wrap);
        resize();

        /* ---- pointer ---- */
        const onPointer = (event: PointerEvent) => {
          const rect = wrap.getBoundingClientRect();
          pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
          pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
        };
        const onPointerLeave = () => {
          pointer.x = 0;
          pointer.y = 0;
        };
        if (interactive) {
          wrap.addEventListener("pointermove", onPointer, { passive: true });
          wrap.addEventListener("pointerleave", onPointerLeave);
        }

        /* ---- scroll: only while the hero is on screen ---- */
        const onScroll = () => {
          const rect = wrap.getBoundingClientRect();
          scrollProgress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        /* ---- pause when off-screen: a GL loop that renders an unseen canvas
               is pure battery drain ---- */
        const io = new IntersectionObserver(
          ([entry]) => {
            if (entry?.isIntersecting && !running) {
              running = true;
              raf = requestAnimationFrame(tick);
            } else if (!entry?.isIntersecting && running) {
              running = false;
              cancelAnimationFrame(raf);
            }
          },
          { threshold: 0 },
        );
        io.observe(wrap);

        /* ---- render loop ---- */
        const clockStart = performance.now();
        const tick = () => {
          if (!running) return;
          uniforms.uTime.value = (performance.now() - clockStart) / 1000;

          // Ease the pointer rather than reading it raw, or the image snaps to
          // the cursor and stops feeling like a physical thing.
          uniforms.uPointer.value.x += (pointer.x - uniforms.uPointer.value.x) * 0.055;
          uniforms.uPointer.value.y += (pointer.y - uniforms.uPointer.value.y) * 0.055;
          uniforms.uScroll.value += (scrollProgress - uniforms.uScroll.value) * 0.09;
          uniforms.uAmount.value += (targetAmount - uniforms.uAmount.value) * 0.04;

          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        /* ---- texture ---- */
        const loader = new THREE.TextureLoader();
        loader.load(
          src,
          (texture) => {
            if (disposed) {
              texture.dispose();
              return;
            }
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            texture.needsUpdate = true;
            uniforms.uTexture.value = texture;
            onReady?.();
          },
          undefined,
          () => {
            // Texture failed to load — hand back to the <img>.
            if (!disposed) setFailed(true);
          },
        );

        /* ---- context loss: bail to the <img> rather than freeze ---- */
        const onLost = (event: Event) => {
          event.preventDefault();
          running = false;
          cancelAnimationFrame(raf);
          setFailed(true);
        };
        canvas.addEventListener("webglcontextlost", onLost);

        cleanup = () => {
          running = false;
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          wrap.removeEventListener("pointermove", onPointer);
          wrap.removeEventListener("pointerleave", onPointerLeave);
          window.removeEventListener("scroll", onScroll);
          canvas.removeEventListener("webglcontextlost", onLost);
          uniforms.uTexture.value?.dispose();
          geometry.dispose();
          material.dispose();
          renderer.dispose();
        };
      } catch {
        // Any failure at all — no WebGL, blocked, OOM. The <img> is the product.
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [src, interactive, amount, reduced, onReady, onImageLoad]);

  return (
    <div ref={wrapRef} className={cn("relative overflow-hidden", className)}>
      {/*
        The photograph is always present as a real <img>, underneath. It is the
        fallback, the reduced-motion view, the no-JS view and the print view —
        one element covering every case where the GPU is not wanted.
      */}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        loading="eager"
        fetchPriority="high"
        decoding="sync"
        onLoad={onImageLoad}
        className={cn("h-full w-full object-cover will-change-transform", !failed && "opacity-0")}
        style={{ transition: "opacity 700ms cubic-bezier(0.22,1,0.36,1)" }}
      />

      {!failed && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
}
