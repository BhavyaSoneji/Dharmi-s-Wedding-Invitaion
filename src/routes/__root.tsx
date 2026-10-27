import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { MusicToggle } from "@/components/chrome/MusicToggle";
import { SectionRail } from "@/components/chrome/SectionRail";
import { useIsomorphicLayoutEffect } from "@/lib/motion";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="grain flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow text-gold-bright">Page not found</p>
        <h1 className="display-1 mt-6 text-cream">This page has wandered off.</h1>
        <p className="body-copy mx-auto mt-6 text-center text-cream/80">
          The page you were looking for doesn&apos;t exist, or has moved.
        </p>
        <Link
          to="/"
          className="meta mt-10 inline-flex items-center justify-center border border-cream/25 px-8 py-4 text-cream transition-colors duration-500 hover:border-gold-bright hover:bg-gold-bright hover:text-ink"
        >
          Return to the invitation
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="grain flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow text-gold-bright">Something went wrong</p>
        <h1 className="display-2 mt-6 text-cream">This page didn&apos;t load.</h1>
        <p className="body-copy mx-auto mt-5 text-center text-cream/80">
          A fault on our end, not yours. Try refreshing, or head back to the beginning.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="meta border border-cream/25 px-7 py-3.5 text-cream transition-colors duration-500 hover:border-gold-bright hover:bg-gold-bright hover:text-ink"
          >
            Try again
          </button>
          <a
            href="/"
            className="meta border border-cream/15 px-7 py-3.5 text-cream/80 transition-colors duration-500 hover:border-cream/40"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { property: "og:type", content: "website" },
      // Matches the deep green-charcoal hero ground so mobile browser chrome
      // blends into the first screen.
      { name: "theme-color", content: "#17211f" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        // Fraunces and Jost carry the editorial display and readable body copy.
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=Jost:wght@300;400;500&family=Noto+Serif+Gujarati:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * Runs before first paint.
 *
 * Reveals start hidden, and the stylesheet applies that via an `html.motion`
 * class. Without something adding that class pre-paint, server-rendered HTML
 * renders visible and then snaps invisible the moment GSAP initialises — a flash
 * on every load.
 *
 * Two conditions, both required: motion is permitted by the OS setting, and
 * JavaScript is genuinely running (so the class is never added without JS).
 *
 * The failsafe timer is the important part. If hydration throws — a stale deploy,
 * a chunk that failed to load — nothing would ever animate these elements in and
 * the page would read as permanently blank. Five seconds later the class comes
 * off and every section is visible regardless.
 */
const MOTION_BOOT = `
(function(){
  try {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.className += ' motion';
      setTimeout(function(){
        if (!document.documentElement.hasAttribute('data-hydrated')) {
          document.documentElement.className = document.documentElement.className.replace(/\\bmotion\\b/, '');
        }
      }, 5000);
    }
  } catch (e) {}
})();
`;

function RootShell({ children }: { children: ReactNode }) {
  /* A layout effect, deliberately. React flushes layout effects children-first,
     so every Reveal below has already written its own opacity:0 inline by the
     time this runs. Setting the attribute here lifts the stylesheet's
     pre-hydration guard at exactly the right moment: content stays hidden, but
     now GSAP is holding it there rather than CSS, so the animations can take over.
     In a passive effect the ordering is not guaranteed and the guard could lift
     a beat early, producing a visible flash. */
  useIsomorphicLayoutEffect(() => {
    document.documentElement.setAttribute("data-hydrated", "1");
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-cream focus:px-5 focus:py-3 focus:text-[0.625rem] focus:uppercase focus:tracking-[0.2em] focus:text-ink"
        >
          Skip to content
        </a>

        {children}

        {/* Persistent controls, outside the document flow. */}
        <SectionRail />
        <MusicToggle />

        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
