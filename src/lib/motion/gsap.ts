/**
 * Single entry point for GSAP.
 *
 * Every motion component imports from here rather than from "gsap" directly, so
 * plugins are registered exactly once no matter how many modules are loaded, and
 * server-side rendering never has to reason about plugin order.
 *
 * Registration itself is SSR-safe; creating ScrollTriggers is not, and that only
 * ever happens inside effects in the components below.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * Only the two plugins this site actually uses are registered.
 *
 * GSAP is happy to register Observer and Flip as well, but each one adds to the
 * client bundle whether or not it runs. ScrollTrigger drives the scroll
 * storytelling and SplitText drives every masked text entrance; nothing on this
 * site needs the other two.
 */

let registered = false;

if (typeof window !== "undefined" && !registered) {
  registered = true;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // ScrollTrigger measures against a refreshed layout. Fonts landing late shift
  // every trigger position, and mobile browsers resize when the URL bar hides.
  // Without these, sections fire at the wrong scroll offset.
  ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
  });
}

export { gsap, ScrollTrigger, SplitText };
