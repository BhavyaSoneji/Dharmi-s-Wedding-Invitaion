import { ArrowRight } from "lucide-react";

import { weddingData } from "@/data/weddingData";
import { MaskReveal, Reveal, RevealGroup } from "@/lib/motion";
import { SectionLabel } from "./SectionLabel";

/**
 * IV — The Celebrations. deep green, the day's rites, listed.
 *
 * Rows rather than cards, because five cards would imply the five rites are
 * interchangeable and they are not: two are arrivals, one is the ceremony, one
 * is the meal and one is a departure. The Roman numerals and the hairline rules
 * make them read as a sequence running toward the ceremony.
 *
 * Every rite is on the same day, so the column opposite the name carries the
 * TIME — the only thing that actually distinguishes the rows. The date itself is
 * stated once, in the hero and again in The Date.
 */
export function Celebrations() {
  const { celebrations } = weddingData;

  return (
    <section
      id="celebrations"
      className="section-y grain relative overflow-hidden bg-emerald-deep text-cream"
      aria-label="The celebrations"
    >
      <div className="shell relative z-10">
        <SectionLabel tone="dark" numeral={celebrations.numeral}>
          {celebrations.label}
        </SectionLabel>

        <div className="mt-12 md:mt-16">
          <Reveal>
            <p className="eyebrow">
              {celebrations.eyebrow}
              {/* `tracking-normal normal-case` is load-bearing: the eyebrow's
                  wide tracking spaces Gujarati conjuncts apart and destroys
                  them, and Gujarati has no case to be shouted in. */}
              <span className="gujarati ml-3 tracking-normal normal-case">
                {celebrations.eyebrowGu}
              </span>
            </p>
          </Reveal>
          <MaskReveal as="h2" className="display-1 mt-5 text-cream">
            {celebrations.heading}
          </MaskReveal>
        </div>

        <RevealGroup as="ul" className="mt-12 border-t border-cream/15 md:mt-16">
          {celebrations.events.map((event) => (
            <li
              key={event.numeral}
              className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-b border-cream/15 py-8 transition-colors duration-500 hover:bg-cream/[0.03] md:grid-cols-[3rem_1fr_auto] md:gap-x-8 md:py-10"
            >
              <span aria-hidden="true" className="meta pt-2 text-[0.5625rem] text-gold-bright">
                {event.numeral}
              </span>

              <div className="min-w-0">
                <h3 className="font-display text-3xl leading-tight text-cream transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 md:text-[2.6rem]">
                  {event.name}
                </h3>
                {/* The Gujarati exactly as printed on the invitation, beside the
                    transliteration rather than replacing it. Not uppercase —
                    Gujarati has no case, and the `meta` tracking would space the
                    conjuncts apart and break them. */}
                <p className="gujarati mt-1.5 text-lg text-cream/80 md:text-xl">{event.gu}</p>
              </div>

              {/* The time sits opposite the name on desktop and beneath it on
                  mobile, so it never breaks the row. */}
              <div className="col-start-2 mt-4 flex flex-col gap-1.5 md:col-start-3 md:mt-0 md:items-end md:text-right">
                <span className="serif-meta text-[1.05rem] text-gold-bright md:text-[1.15rem]">
                  {event.date}
                </span>
                {event.note && (
                  <span className="meta text-[0.5rem] text-cream/80">{event.note}</span>
                )}
              </div>
            </li>
          ))}
        </RevealGroup>

        <Reveal delay={0.12} className="mt-12 flex justify-center md:mt-14">
          <a
            href="#guests"
            className="group inline-flex items-center gap-3.5 text-cream/80 transition-colors duration-500 hover:text-cream"
          >
            <span className="meta">{celebrations.cta}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5"
              aria-hidden="true"
            />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
