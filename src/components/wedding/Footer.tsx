import { ArrowUp, Instagram } from "lucide-react";

import { weddingData } from "@/data/weddingData";
import { Magnetic, MaskReveal, Reveal } from "@/lib/motion";
import { Lozenge } from "./SectionLabel";

/**
 * The close.
 *
 * The names at the largest size on the page, on the darkest ground, with the
 * date and the hashtag set beneath in the same tracked caps used everywhere
 * else. It is the last thing on screen and the thing most likely to be
 * screenshotted, so it gets the room.
 */
export function Footer() {
  return (
    <footer className="grain relative overflow-hidden bg-ink text-cream">
      <div className="relative z-10 py-20 md:py-28">
        <div className="shell flex flex-col items-center text-center">
          <MaskReveal
            as="p"
            className="font-display text-[clamp(2.75rem,11vw,8.5rem)] font-light leading-[0.92] tracking-[-0.03em] text-cream"
          >
            {/* Bride first, from `couple.nameOrder` — same source as the hero and the
              invitation lockup. */}
            <span className="flex flex-wrap items-center justify-center gap-x-3 md:gap-x-5">
              {weddingData.couple.nameOrder.map((person, i) => (
                <span key={person.role} className="contents">
                  {i === 1 && (
                    <span className="text-[0.42em] font-light italic text-gold-bright">&amp;</span>
                  )}
                  {person.name}
                </span>
              ))}
            </span>
          </MaskReveal>

          <Reveal delay={0.14} className="mt-10 flex flex-col items-center gap-5">
            <Lozenge tone="dark" />
            <p className="meta text-cream/80">{weddingData.displayDate}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {weddingData.instagram.map((account) => (
                <a
                  key={account.handle}
                  href={account.url}
                  target="_blank"
                  rel="noreferrer"
                  className="meta inline-flex items-center gap-2.5 text-gold-bright transition-colors duration-500 hover:text-cream"
                >
                  <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
                  {account.handle}
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2} className="mt-14">
            <Magnetic strength={0.3}>
              <a
                href="#top"
                className="group inline-flex items-center gap-3 border border-cream/22 px-9 py-4 text-cream transition-colors duration-500 hover:border-gold-bright hover:bg-gold-bright hover:text-ink"
              >
                <ArrowUp
                  className="h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1"
                  aria-hidden="true"
                />
                <span className="meta">Back to the beginning</span>
              </a>
            </Magnetic>
          </Reveal>

          <Reveal delay={0.26} className="mt-14">
            <p className="text-xs text-cream/80">{weddingData.signOff}</p>
          </Reveal>
        </div>
      </div>
    </footer>
  );
}
