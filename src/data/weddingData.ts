import gallery01_480 from "@/assets/gallery-01-monument-480.jpg";
import gallery01_768 from "@/assets/gallery-01-monument-768.jpg";
import gallery01_1200 from "@/assets/gallery-01-monument-1200.jpg";
import gallery02_480 from "@/assets/gallery-02-monument-steps-480.jpg";
import gallery02_768 from "@/assets/gallery-02-monument-steps-768.jpg";
import gallery02_1200 from "@/assets/gallery-02-monument-steps-1200.jpg";
import gallery03_480 from "@/assets/gallery-03-hillside-run-480.jpg";
import gallery03_768 from "@/assets/gallery-03-hillside-run-768.jpg";
import gallery03_1200 from "@/assets/gallery-03-hillside-run-1200.jpg";
import gallery04_480 from "@/assets/gallery-04-hillside-walk-480.jpg";
import gallery04_768 from "@/assets/gallery-04-hillside-walk-768.jpg";
import gallery04_1200 from "@/assets/gallery-04-hillside-walk-1200.jpg";
import gallery05_480 from "@/assets/gallery-05-shops-480.jpg";
import gallery05_768 from "@/assets/gallery-05-shops-768.jpg";
import gallery05_1200 from "@/assets/gallery-05-shops-1200.jpg";
import gallery06_480 from "@/assets/gallery-06-monument-gate-480.jpg";
import gallery06_768 from "@/assets/gallery-06-monument-gate-768.jpg";
import gallery06_1200 from "@/assets/gallery-06-monument-gate-1200.jpg";
import gallery07_480 from "@/assets/gallery-07-shore-480.jpg";
import gallery07_768 from "@/assets/gallery-07-shore-768.jpg";
import gallery07_1200 from "@/assets/gallery-07-shore-1200.jpg";
import gallery08_480 from "@/assets/gallery-08-shore-dusk-480.jpg";
import gallery08_768 from "@/assets/gallery-08-shore-dusk-768.jpg";
import gallery08_1200 from "@/assets/gallery-08-shore-dusk-1200.jpg";
import gallery09_480 from "@/assets/gallery-09-city-night-480.jpg";
import gallery09_768 from "@/assets/gallery-09-city-night-768.jpg";
import gallery09_1200 from "@/assets/gallery-09-city-night-1200.jpg";
import gallery10_480 from "@/assets/gallery-10-forest-walk-480.jpg";
import gallery10_768 from "@/assets/gallery-10-forest-walk-768.jpg";
import gallery10_1200 from "@/assets/gallery-10-forest-walk-1200.jpg";
import gallery11_480 from "@/assets/gallery-11-garden-pond-480.jpg";
import gallery11_768 from "@/assets/gallery-11-garden-pond-768.jpg";
import gallery11_1200 from "@/assets/gallery-11-garden-pond-1200.jpg";
import heroArch1200 from "@/assets/hero-arch-1200.jpg";
import heroArch1800 from "@/assets/hero-arch-1800.jpg";
import heroArch2400 from "@/assets/hero-arch-2400.jpg";
import heroSeated480 from "@/assets/hero-seated-480.jpg";
import heroSeated768 from "@/assets/hero-seated-768.jpg";
import heroSeated1200 from "@/assets/hero-seated-1200.jpg";

/**
 * Single source of truth for every word and image on the site.
 *
 * Structure follows the page's ceremonial logic: a dark threshold, then eight
 * numbered movements, then a dark close. Section numbers are Roman throughout —
 * they appear in the visible section labels and in the edge navigation, so they
 * live here rather than being typed into components.
 */

export const weddingData = {
  couple: {
    groom: "Sachin",
    bride: "Dharmi",
    monogram: "D · S",
    /**
     * The order both names appear in, everywhere they appear together.
     *
     * Bride first, at the couple's request. This array is the single source of
     * that order: the hero, the invitation lockup, the footer mark and the
     * social preview tags all read from it, so the sequence cannot drift out
     * of step between them the way six separately-written name pairs eventually
     * do.
     *
     * `italic` alternates rather than marking a role. The pair had a rhythm
     * before this change — plain, then italic — and keeping the alternation means
     * flipping the order does not also restyle the names.
     */
    nameOrder: [
      { role: "bride", name: "Dharmi", italic: false },
      { role: "groom", name: "Sachin", italic: true },
    ] as const,
  },

  displayDate: "22 November 2026",
  weekday: "Sunday",
  year: "2026",
  /**
   * The date set out in words, stored as an array so the line breaks are a design
   * decision rather than a consequence of viewport width.
   *
   * Unused at the moment. It used to sit beneath the numerals in the hero, which
   * gave the date away before The Date section revealed it — that section is
   * sealed behind a tape, and a date printed on the first page makes the seal
   * pointless. Kept because it is real copy from the invitation and belongs
   * somewhere in the page, not thrown away; reach for it if a quieter date
   * treatment is ever wanted somewhere the reveal has already happened.
   */
  dateInWords: ["Twenty-Second of November", "Two Thousand Twenty-Six"],

  /** Hero */
  heroKicker: "A celebration of love",
  /** Shown beneath the monogram in the opening sequence. */
  heroLoaderLine: "Two hearts, one beautiful beginning.",

  /** I — The Invitation */
  invitation: {
    numeral: "I",
    label: "The Invitation",
    blessing: "With the blessings of Shri Ganesha and Shir Vijya mata",
    familiesLead: "Together with",
    familiesAccent: "their families",
  },

  /** II — The Date */
  theDate: {
    numeral: "II",
    label: "The Date",
    dayNumber: "22",
    of: "of",
    monthName: "November",
    /** Small line under the rules. */
    qualifier: "Sunday · 2026",
    line: "Ceremony begins at 10:30 in the morning",
  },

  /**
   * III — Moments.
   *
   * Eleven selected photographs across all of the shoot's settings and outfits:
   * the sandstone pavilion, hillside, shops, old street, shore, city at night,
   * forest/lake, and pool. The edit keeps each scene distinct without making
   * visitors scroll through near-duplicate frames.
   *
   * All eleven selected frames are sequenced rather than grouped: a world can return later if the
   * light asks for it, because a contact sheet sorted by location reads as an
   * archive while a sequence reads as a day.
   *
   * Every image from the selected folder is included. Assets are delivered at 4:5. The crop is center-anchored for consistency,
   * in the file, with an anchor chosen per frame — not left to `object-fit`.
   */
  moments: {
    numeral: "III",
    label: "Moments",
    closing: "every little moment · one forever",
    items: [
      {
        numeral: "I",
        world: "The Monument",
        title: "A Quiet Welcome",
        caption: "A quiet moment beneath the sandstone",
        src: gallery01_1200,
        srcSet: `${gallery01_480} 480w, ${gallery01_768} 768w, ${gallery01_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple together beneath an old sandstone monument",
        position: "50% 50%",
        lift: false,
      },
      {
        numeral: "II",
        world: "The Monument",
        title: "Beneath the Arch",
        caption: "A little shade beneath the carved stone",
        src: gallery02_1200,
        srcSet: `${gallery02_480} 480w, ${gallery02_768} 768w, ${gallery02_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple sharing a moment beneath a carved stone arch",
        position: "50% 50%",
        lift: false,
      },
      {
        numeral: "III",
        world: "The Hillside",
        title: "Open Sky",
        caption: "Running into the open air",
        src: gallery03_1200,
        srcSet: `${gallery03_480} 480w, ${gallery03_768} 768w, ${gallery03_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple running across a green hillside under a blue sky",
        position: "50% 50%",
        lift: false,
      },
      {
        numeral: "IV",
        world: "The Hillside",
        title: "Across the Hillside",
        caption: "A sunlit walk across the open hillside",
        src: gallery04_1200,
        srcSet: `${gallery04_480} 480w, ${gallery04_768} 768w, ${gallery04_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple walking across a green hillside under a clear sky",
        position: "50% 50%",
        lift: false,
      },
      {
        numeral: "V",
        world: "The Shops",
        title: "A Day Out",
        caption: "A candid pause between the shops",
        src: gallery05_1200,
        srcSet: `${gallery05_480} 480w, ${gallery05_768} 768w, ${gallery05_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple exploring a colorful clothing shop",
        position: "50% 50%",
        lift: false,
      },
      {
        numeral: "VI",
        world: "The Monument",
        title: "Framed in Stone",
        caption: "A doorway steeped in history",
        src: gallery06_1200,
        srcSet: `${gallery06_480} 480w, ${gallery06_768} 768w, ${gallery06_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple beneath a weathered monument doorway",
        position: "50% 50%",
        lift: false,
      },
      {
        numeral: "VII",
        world: "The Shore",
        title: "The Quiet Shore",
        caption: "A quiet pause where the water meets the sand",
        src: gallery07_1200,
        srcSet: `${gallery07_480} 480w, ${gallery07_768} 768w, ${gallery07_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple standing together on a quiet beach in daylight",
        position: "50% 50%",
        lift: false,
      },
      {
        numeral: "VIII",
        world: "The Shore",
        title: "Last Light",
        caption: "Two silhouettes in the last light of day",
        src: gallery08_1200,
        srcSet: `${gallery08_480} 480w, ${gallery08_768} 768w, ${gallery08_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple standing together on the beach at dusk",
        position: "50% 50%",
        lift: false,
      },
      {
        numeral: "IX",
        world: "The City",
        title: "After Dark",
        caption: "Neon lights and a city evening",
        src: gallery09_1200,
        srcSet: `${gallery09_480} 480w, ${gallery09_768} 768w, ${gallery09_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple walking together on a city street at night",
        position: "50% 50%",
        lift: false,
      },
      {
        numeral: "X",
        world: "The Garden",
        title: "Among the Trees",
        caption: "A quiet portrait on a wooded garden path",
        src: gallery10_1200,
        srcSet: `${gallery10_480} 480w, ${gallery10_768} 768w, ${gallery10_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple posing together on a wooded garden path",
        position: "50% 50%",
        lift: false,
      },
      {
        numeral: "XI",
        world: "The Garden",
        title: "Still Waters",
        caption: "A quiet moment beside the pond",
        src: gallery11_1200,
        srcSet: `${gallery11_480} 480w, ${gallery11_768} 768w, ${gallery11_1200} 1200w`,
        width: 1200,
        height: 1500,
        alt: "The couple beside a peaceful garden pond",
        position: "50% 50%",
        lift: false,
      },
    ] as const,
  },

  /**
   * IV — The Celebrations.
   *
   * The five rites of the day, in the order they happen. Transcribed from the
   * wedding invitation, which heads this block "Mangalik Prasango" — the
   * auspicious programme — so the eyebrow follows that rather than inventing a
   * gloss for it.
   *
   * `date` holds the TIME, not the calendar date. Every rite falls on the same
   * day, so repeating "22 November 2026" five times would be noise; the date is
   * stated once in the hero and again in the Date section.
   *
   * `gu` is the Gujarati name exactly as it is printed on the card, set in its
   * own script beside the transliteration. `note` is the plain-English gloss of
   * that Gujarati term, so a guest who does not read the script still knows what
   * each rite is.
   */
  celebrations: {
    numeral: "IV",
    label: "The Celebrations",
    eyebrow: "The auspicious programme",
    /** The Gujarati heading from the invitation, set apart because the `eyebrow`
     *  tracking would otherwise space the conjuncts apart and break them. */
    eyebrowGu: "માંગલિક પ્રસંગો",
    heading: "Five rites, one day",
    cta: "Plan your visit",
    events: [
      {
        numeral: "I",
        name: "Mameru Ceremony",
        gu: "મામેરુ",
        date: "8:00 AM",
        note: "Mama visit her with gifts and blessings.",
      },
      {
        numeral: "II",
        name: "Jaan Aagman",
        gu: "જાન આગમન",
        date: "10:00 AM",
        note: "Arrival of the bride",
      },
      {
        numeral: "III",
        name: "Hast Melap",
        gu: "હસ્ત મેળાપ",
        date: "10:30 AM – 12:00 PM",
        note: "The ceremony",
      },
      {
        numeral: "IV",
        name: "Bhojan Samaroh",
        gu: "ભોજન સમારો",
        date: "12:30 PM",
        note: "The meal",
      },
      {
        numeral: "V",
        name: "Kanya Viday",
        gu: "કન્યા વિદાય",
        date: "3:00 PM",
        note: "Viday of the bride",
      },
    ] as const,
  },

  /** V — Our Story */
  film: {
    numeral: "V",
    label: "Our Story",
    eyebrow: "Before forever",
    heading: "A story told in photographs",
    sub: "From the sandstone pavilion to the shoreline, a few days we will keep close.",
    videoUrl: "https://www.youtube-nocookie.com/embed/xYr2r7IkbdE",
    cta: "Explore our moments",
  },

  /** VI — For Our Guests */
  guests: {
    numeral: "VI",
    label: "For our guests",
    heading: "Things to know",
    venue: {
      label: "The Venue",
      value: "Shri Umiya Mataji Pratikashram",
      note: "Bahucharaji, Gujarat",
      /**
       * Not a search. The invitation carries a "Location Code" QR, and it
       * decodes to this exact Maps pin — so this is the same location the
       * printed card points to, not a guess from the venue name.
       */
      mapUrl: "https://maps.app.goo.gl/t89wfedCmj3MN44n9",
      /**
       * The location QR the couple supplied, shown beside the venue so a guest
       * can point a camera at the screen instead of searching for the name.
       *
       * It carries their photograph across the middle and the caption
       * "Umiya Wadi, Becharaji" is baked into the artwork, so it is stored as
       * given and never cropped or regenerated here.
       *
       * Rendered size is load-bearing, and larger than it looks. The artwork
       * overlays the modules with a halftone dot screen and a photograph, which
       * costs contrast: measured against this exact file, a decoder loses the
       * code below 196px and holds it reliably from 196px up. The component
       * renders it at 240px for roughly 20% headroom over that floor. The
       * earlier plain generated code had a floor near 110px, which is why the
       * two sizes differ so much and why the check asserts 240 rather than the
       * old 100px minimum.
       */
      qr: {
        src: "/venue-location-qr.jpeg",
        alt: "QR code giving the location of the venue in Umiya Wadi, Bahucharaji",
        caption: "Scan for directions",
      },
    },
    contact: {
      label: "Contact",
      value: "Shri Manishbhai Naranbhai Patel & Smt. Vasantiben Manishbhai Patel",
      note: "For all enquiries",
      /**
       * Both numbers as `tel:` links so a guest on a phone can tap to call
       * either. The previous shape allowed a single link only.
       *
       * These are the corrected numbers, confirmed by the couple. Note they
       * still do not match the pair printed on the invitation card, which reads
       * 87380 65540 and 968865 96969 - one of the two sources is a typo, and
       * nobody has yet said which. The order here follows the `value` line
       * above, so the first number belongs to the first name.
       */
      phones: [
        { label: "+91 87340 95640", href: "tel:+918734095640" },
        { label: "+91 94286 86596", href: "tel:+919428686596" },
      ] as const,
      email: null as string | null,
    },
    reminder: {
      label: "A gentle reminder",
      value: "Please return closer to the celebration for final details.",
      note: "Kindly note",
    },
  },

  /** VII — From the heart */
  wishes: {
    numeral: "VII",
    label: "From the heart",
    heading: "Leave a wish",
    empty: "Your blessing will be the first on our wall.",
    /** Stated plainly rather than hidden — it is the truth about localStorage. */
    persistence: "Wishes are saved on this device only.",
    nameLabel: "Your name",
    messageLabel: "Your message",
    submit: "Send your wishes",
  },

  instagram: [
    { handle: "@_dharmii__", url: "https://www.instagram.com/_dharmii__/" },
    { handle: "@sachiin.v", url: "https://www.instagram.com/sachiin.v/" },
  ],
  signOff: "Made with love for a beautiful beginning",

  /**
   * The hero photograph, art-directed.
   *
   * Two different pictures rather than one crop: the arch shot is landscape and
   * only works when it can run the full width of the screen, and the seated shot
   * is portrait and only works when the screen is tall. Cropping one into the
   * other throws away the composition that makes either of them good.
   */
  heroImages: {
    desktop: {
      src: heroArch1200,
      srcSet: `${heroArch1200} 1200w, ${heroArch1800} 1800w, ${heroArch2400} 2400w`,
      width: 2400,
      height: 1600,
      alt: "Dharmi and Sachin standing together beneath the carved sandstone arches",
      position: "50% 56%",
    },
    mobile: {
      src: heroSeated768,
      srcSet: `${heroSeated480} 480w, ${heroSeated768} 768w, ${heroSeated1200} 1200w`,
      width: 1200,
      height: 1800,
      alt: "Dharmi leaning her head against Sachin on the step of the sandstone archway",
      position: "22% 45%",
    },
  },
} as const;

/**
 * The seven numbered movements, in order.
 *
 * Drives the right-edge navigation rail and the section observer. Kept derived so
 * adding a movement is a one-line change here rather than an edit in two
 * components.
 */
export const sections = [
  { id: "invitation", numeral: "I", label: "The Invitation" },
  { id: "date", numeral: "II", label: "The Date" },
  { id: "moments", numeral: "III", label: "Moments" },
  { id: "celebrations", numeral: "IV", label: "The Celebrations" },
  { id: "film", numeral: "V", label: "Our Story" },
  { id: "guests", numeral: "VI", label: "For our guests" },
  { id: "wishes", numeral: "VII", label: "From the heart" },
] as const;

/**
 * The two names in display order — bride first, per `couple.nameOrder`.
 *
 * Pulled out as plain strings because the places that need them are templates
 * rather than layouts: the social preview tags. Writing "Dharmi and Sachin"
 * into each of those by hand is exactly how a name order ends up correct in
 * the hero and reversed in a social preview.
 */
export const firstName = weddingData.couple.nameOrder[0].name;
export const secondName = weddingData.couple.nameOrder[1].name;
