import type { ReactNode } from "react";

import { Reveal } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The section label: a Roman numeral in a hairline circle, then the movement
 * name. It opens every one of the eight sections and is the strongest repeated
 * signal on the page — the thing that makes eight very different layouts feel
 * like one document.
 */
export function SectionLabel({
  numeral,
  children,
  tone = "light",
  className,
}: {
  numeral: string;
  children: ReactNode;
  /** "dark" for the sections on a dark ground. */
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex items-center justify-center gap-3.5",
        tone === "dark" ? "text-gold-bright" : "text-gold",
        className,
      )}
    >
      <span aria-hidden="true" className="numeral-badge">
        {numeral}
      </span>
      <span className="eyebrow">{children}</span>
    </Reveal>
  );
}

/** A centred ornamental rule: hairline, diamond, hairline. */
export function Lozenge({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center gap-3",
        tone === "dark" ? "text-gold-bright/50" : "text-gold/60",
      )}
    >
      <span className={cn("h-px w-10", tone === "dark" ? "bg-gold-bright/35" : "bg-gold/45")} />
      <span className="lozenge" />
      <span className={cn("h-px w-10", tone === "dark" ? "bg-gold-bright/35" : "bg-gold/45")} />
    </span>
  );
}

/** The circular outlined icon used down the left of the guest-information rows. */
export function CircleIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/45 text-gold"
    >
      {children}
    </span>
  );
}
