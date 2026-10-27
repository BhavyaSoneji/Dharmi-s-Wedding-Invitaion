import type { ReactNode } from "react";

import { ArrowUpRight, Bell, MapPin, Phone } from "lucide-react";

import { weddingData } from "@/data/weddingData";
import { MaskReveal, Reveal, RevealGroup } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CircleIcon, SectionLabel } from "./SectionLabel";

/**
 * VI — For Our Guests.
 *
 * Each item is a row with its circular icon and label on the left and the
 * statement on the right. The two columns are deliberately unequal: the label
 * column is narrow and quiet, the statement column is wide and set large in the
 * display serif, because the statement is what a guest actually reads.
 *
 * Real venue and contact values are placeholders. When they are supplied the
 * layout absorbs a full address without reflowing.
 */
export function Details() {
  const { guests } = weddingData;

  /* Declared rather than inferred. The rows mix a single map link with a pair of
     phone numbers, and letting TypeScript infer that union produced three
     different errors where the JSX consumed it. */
  type RowLink = { label: string; href: string; external?: boolean };
  type RowQr = { src: string; alt: string; caption: string };
  type Row = {
    icon: ReactNode;
    label: string;
    value: string;
    note: string;
    links: RowLink[];
    qr?: RowQr;
  };

  const rows: Row[] = [
    {
      icon: <MapPin className="h-4 w-4" />,
      label: guests.venue.label,
      value: guests.venue.value,
      note: guests.venue.note,
      links: guests.venue.mapUrl
        ? [{ label: "Open in Maps", href: guests.venue.mapUrl, external: true }]
        : [],
      qr: guests.venue.qr,
    },
    {
      icon: <Phone className="h-4 w-4" />,
      label: guests.contact.label,
      value: guests.contact.value,
      note: guests.contact.note,
      /* Both numbers from the invitation, each tappable. An email, if one is ever
         added, joins them rather than replacing them. */
      links: [
        ...guests.contact.phones.map((p) => ({ label: p.label, href: p.href })),
        ...(guests.contact.email
          ? [{ label: guests.contact.email, href: `mailto:${guests.contact.email}` }]
          : []),
      ],
    },
    {
      icon: <Bell className="h-4 w-4" />,
      label: guests.reminder.label,
      value: guests.reminder.value,
      note: guests.reminder.note,
      links: [],
    },
  ];

  return (
    <section id="guests" className="section-y bg-cream-deep" aria-label="For our guests">
      <div className="shell">
        <SectionLabel numeral={guests.numeral}>{guests.label}</SectionLabel>

        <MaskReveal
          as="h2"
          className="display-1 mx-auto mt-12 max-w-3xl text-center text-emerald md:mt-16"
        >
          {guests.heading}
        </MaskReveal>

        <RevealGroup as="dl" className="mt-14 border-t border-border md:mt-20">
          {rows.map((row) => (
            <div
              key={row.label}
              /* The venue row carries a third column for the QR. Only that row
                 gets the extra track, so the other two stay aligned to the
                 same two-column rhythm as before. */
              className={cn(
                "grid gap-x-8 gap-y-6 border-b border-border py-10 md:py-12",
                row.qr
                  ? "md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]"
                  : "md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]",
              )}
            >
              <div className="flex items-center gap-4">
                <CircleIcon>{row.icon}</CircleIcon>
                <span className="meta text-muted-foreground">{row.label}</span>
              </div>

              <dd className="min-w-0">
                <p className="font-display text-2xl leading-snug text-emerald md:text-[2rem]">
                  {row.value}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">{row.note}</p>
                {row.links.length > 0 && (
                  /* A phone number or a map link is useless unless it can be
                     acted on, so these are real anchors rather than plain text.
                     `tel:` must not open a new tab; an external map should. */
                  <span className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                    {row.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noreferrer" : undefined}
                        className="link-wipe meta inline-flex min-h-10 items-center gap-2 text-sm text-emerald"
                      >
                        {link.label}
                        {link.external && <ArrowUpRight className="h-3 w-3" aria-hidden="true" />}
                      </a>
                    ))}
                  </span>
                )}
              </dd>

              {row.qr && (
                /* A QR needs a light, quiet background to scan, so the card is
                   explicitly white rather than inheriting the cream section.
                   The padding is the quiet zone — trimming it stops some
                   scanners locking on.

                   The supplied
                   artwork carries a halftone screen and a photograph across its
                   modules, which costs contrast. Measured on the rendered
                   element, 5 runs per size, the floor is 176px on a 1x display
                   (dead at 160 and 168) and 160px at 2x. Keep 176px on mobile
                   to preserve the measured 1x scan floor, and use 200px on
                   larger screens for extra scanning margin.

                   Stacked on mobile, in a row on desktop. It was a row on both,
                   and the caption took the width the code needed: on a 390px
                   screen the image compressed to 51x120, which is not a QR any
                   scanner can read. `shrink-0` on the card stops that recurring,
                   and `h-auto` with a fixed width means the aspect ratio is
                   derived from the file rather than imposed in two places.

                   No `col-start-2` below md: this grid is single-column there,
                   so pinning a column index spawned an implicit second column
                   and squeezed the code to 85px on a 320px screen. On mobile it
                   simply auto-places under the address; only desktop pins it
                   into the third track. */
                <Reveal
                  delay={0.1}
                  className="flex flex-col items-start gap-3 md:col-start-3 md:row-start-1 md:flex-row md:items-center md:gap-5"
                >
                  <div className="shrink-0 rounded-sm bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
                    <img
                      src={row.qr.src}
                      alt={row.qr.alt}
                      width={200}
                      height={200}
                      loading="lazy"
                      decoding="async"
                      className="block h-auto w-44 md:w-[12.5rem]"
                    />
                  </div>
                  <span className="meta text-muted-foreground md:hidden">{row.qr.caption}</span>
                </Reveal>
              )}
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
