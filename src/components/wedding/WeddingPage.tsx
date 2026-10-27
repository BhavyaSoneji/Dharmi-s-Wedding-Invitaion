import { Celebrations } from "./Celebrations";
import { Details } from "./Details";
import { Download } from "./Download";
import { Film } from "./Film";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { Invitation } from "./Invitation";
import { Moments } from "./Moments";
import { TheDate } from "./TheDate";
import { Wishes } from "./Wishes";

/**
 * Page composition.
 *
 * A dark threshold, seven numbered movements, a dark close. The order is
 * ceremonial rather than functional: who is marrying, when, what it looked like,
 * what is happening, what they made, where to go, and what you would like to
 * say to them.
 *
 * Grounds alternate deliberately — ink, cream, emerald, cream, emerald-deep,
 * cream, cream-deep, cream, ink — so no two neighbours blend. The two
 * repetitions in the middle (Our Story and For Our Guests) are separated by a
 * hairline rather than a change of tone, because breaking the rhythm there
 * would read as an accident.
 */
export function WeddingPage() {
  return (
    <>
      {/* <main> is the page's only main landmark and the skip-link target. */}
      <main id="main">
        <Hero />
        <Invitation />
        <TheDate />
        <Moments />
        <Celebrations />
        <Film />
        <Details />
        <Wishes />
        <Download />
      </main>
      {/* Outside <main>: site chrome rather than page content. */}
      <Footer />
    </>
  );
}
