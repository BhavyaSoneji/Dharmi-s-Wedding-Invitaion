import { createFileRoute } from "@tanstack/react-router";

import { WeddingPage } from "@/components/wedding/WeddingPage";
import { firstName, secondName } from "@/data/weddingData";

/**
 * Home route.
 *
 * Social preview tags matter more than usual here: this URL's entire purpose is
 * to be pasted into a WhatsApp group. WhatsApp's link preview renders a
 * photograph or nothing — plain text links collapse to a bare blue URL. The
 * `og:image` is therefore load-bearing, not decoration, so it is referenced here
 * rather than left for hosting to inject.
 *
 * Absolute URLs are required by every crawler that reads these tags, so the
 * canonical origin is declared once below.
 *
 * Replace this reserved .example origin before deploying. Open Graph and
 * canonical URLs must be absolute, so leaving it in place makes link previews
 * unavailable instead of silently pointing guests at another site.
 */
const ORIGIN = "https://replace-with-your-domain.example";

export const Route = createFileRoute("/")({
  component: WeddingPage,
  head: () => ({
    meta: [
      { title: `${firstName} weds ${secondName} - 22 November 2026` },
      {
        name: "description",
        content: `${firstName} and ${secondName} invite you to celebrate our wedding on Sunday 22 November 2026 at Shri Umiya Mataji Pratikashram, Bahucharaji.`,
      },
      { name: "author", content: `${firstName} & ${secondName}` },

      { property: "og:type", content: "website" },
      { property: "og:site_name", content: `${firstName} weds ${secondName}` },
      { property: "og:title", content: `${firstName} weds ${secondName}` },
      {
        property: "og:description",
        content: "Together with our families — 22 November 2026, Bahucharaji.",
      },
      { property: "og:url", content: `${ORIGIN}/` },
      { property: "og:image", content: `${ORIGIN}/og-image.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: `${firstName} and ${secondName} beneath marigold garlands`,
      },
      { property: "og:locale", content: "en_IN" },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${firstName} weds ${secondName}` },
      {
        name: "twitter:description",
        content: "Together with our families — 22 November 2026, Bahucharaji.",
      },
      { name: "twitter:image", content: `${ORIGIN}/og-image.jpg` },
    ],
    links: [{ rel: "canonical", href: `${ORIGIN}/` }],
  }),
});
