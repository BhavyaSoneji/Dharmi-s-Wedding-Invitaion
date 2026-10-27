import { Fragment } from "react";

import { weddingData } from "@/data/weddingData";
import { MaskReveal, Reveal } from "@/lib/motion";
import { Lozenge, SectionLabel } from "./SectionLabel";

/** I — The Invitation. Cream, centred, ceremonial. */
export function Invitation() {
  const { invitation, couple } = weddingData;

  return (
    <section
      id="invitation"
      className="section-y relative overflow-hidden bg-cream"
      aria-label="The invitation"
    >
      <div className="shell">
        <SectionLabel numeral={invitation.numeral}>{invitation.label}</SectionLabel>

        {/* role/aria-label sit on the glyph itself rather than on the reveal
            wrapper, so assistive tech announces the character rather than an
            otherwise-empty container. */}
        <Reveal delay={0.08} className="mt-12 flex justify-center md:mt-16">
          <span
            className="devanagari block text-6xl text-gold md:text-7xl"
            role="img"
            aria-label="Om"
          >
            ॐ
          </span>
        </Reveal>

        <Reveal delay={0.14} className="mt-9 text-center">
          <p className="eyebrow">{invitation.blessing}</p>
        </Reveal>

        <Reveal delay={0.2} className="mt-12 text-center">
          <p className="font-display text-2xl text-ink md:text-3xl">
            {invitation.familiesLead}{" "}
            <span className="italic text-gold">{invitation.familiesAccent}</span>
          </p>
        </Reveal>

        <Reveal delay={0.26} className="mt-10 flex justify-center">
          <Lozenge />
        </Reveal>

        {/* The names, as the subject of the invitation.

            Until now these appeared only in the hero, so the invitation itself
            read as a blessing and a formal request made on nobody's behalf. A
            printed invitation names the couple first and the wording follows —
            the sentence completes the name, not the other way round.

            Set as two lines with an italic ampersand, echoing the hero's
            three-line cascade but in ink on cream rather than cream over a
            photograph, so it reads as its own composition rather than a
            repeat. The ampersand is carried inside the h2 as a span so
            SplitText can mask and reveal all three lines as one cascade. */}
        <MaskReveal
          as="h2"
          className="mx-auto mt-14 flex max-w-4xl flex-col items-center text-center font-display text-[clamp(2.75rem,8vw,5.5rem)] font-light leading-[0.92] tracking-[-0.035em] text-ink"
        >
          {/* Bride first, from `couple.nameOrder` — the same array the hero reads, so the
            two lockups cannot end up in different orders.

            A Fragment rather than a wrapping element, and that is load-bearing: an
            inline wrapper made the ampersand and the second name a single
            SplitText line instead of two, so they masked together. */}
          {couple.nameOrder.map((person, i) => (
            <Fragment key={person.role}>
              {i === 1 && (
                <span
                  aria-hidden="true"
                  className="my-[0.08em] block text-[0.38em] italic text-gold"
                >
                  &amp;
                </span>
              )}
              <span className={`block${person.italic ? " italic" : ""}`}>{person.name}</span>
            </Fragment>
          ))}
        </MaskReveal>

        <MaskReveal
          as="p"
          className="measure mx-auto mt-12 text-center font-display text-xl leading-relaxed text-ink/80 italic md:text-[1.6rem]"
        >
          Invites you to celebrate the beginning of our forever
        </MaskReveal>
      </div>
    </section>
  );
}
