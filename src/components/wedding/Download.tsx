import { Download as DownloadIcon } from "lucide-react";

import { Reveal } from "@/lib/motion";
import { SectionLabel } from "./SectionLabel";

/**
 * Download — invitation PDF.
 *
 * A small section after the wishes wall: any visitor can save the whole
 * invitation as a single PDF, page by page, for offline reading or sharing in
 * a chat that does not unfurl links. Shown on every device.
 */
export function Download() {
  return (
    <section
      id="download"
      className="section-y relative overflow-hidden bg-cream"
      aria-label="Download the invitation"
    >
      <div className="shell flex flex-col items-center text-center">
        <SectionLabel numeral="IX">Download</SectionLabel>

        <Reveal delay={0.04}>
          <p className="eyebrow mt-6">Take it with you</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="mt-4 font-display text-3xl text-ink md:text-4xl">
            The whole invitation, offline
          </h2>
        </Reveal>

        <Reveal delay={0.14}>
          <p className="body-copy mx-auto mt-4 max-w-sm text-center">
            A single PDF with every page of the invitation, so you can read it anywhere — even
            without a connection.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <a
            href="/wedding-invitation.pdf"
            download="Dharmi-and-Sachin-Invitation.pdf"
            className="group mt-8 inline-flex items-center gap-3 border border-emerald/30 bg-emerald px-8 py-4 text-cream transition-colors duration-500 hover:bg-emerald-deep"
          >
            <DownloadIcon className="h-4 w-4" aria-hidden="true" />
            <span className="meta">Download PDF</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
