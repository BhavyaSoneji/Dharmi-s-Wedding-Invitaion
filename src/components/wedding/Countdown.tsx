import { useEffect, useState } from "react";

/**
 * A live countdown to the ceremony.
 *
 * Not rendered at all while the date is sealed — see TheDate.tsx, which mounts it
 * on `!sealed`. It counts toward a time but never states one, so it has to arrive
 * after the reveal to be worth having; a clock ticking above a sealed date told a
 * visitor how long they had left and handed them the subject before they had done
 * anything.
 *
 * Hydration: the server has no idea what time it is for the visitor, so the first
 * render is a fixed placeholder and the real values arrive in an effect. The
 * digits are padded to two characters and set in tabular figures, so the value
 * settling from "—" to "09" does not reflow the row.
 *
 * Once the ceremony has passed the countdown stops rather than counting up. An
 * invitation that starts reporting elapsed time on the morning of the wedding
 * reads as a bug, and this page will outlive the day it is for.
 */

const TARGET = new Date("2026-11-22T10:30:00+05:30").getTime();

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function remaining(now: number): Remaining {
  const ms = Math.max(0, TARGET - now);
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const t = now === null ? null : remaining(now);
  const passed = now !== null && now >= TARGET;

  const cells: Array<{ label: string; value: string }> = [
    { label: "days", value: t ? String(t.days) : "—" },
    { label: "hours", value: t ? pad(t.hours) : "—" },
    { label: "minutes", value: t ? pad(t.minutes) : "—" },
    { label: "seconds", value: t ? pad(t.seconds) : "—" },
  ];

  return (
    /* `role="timer"` with a polite live region: a screen reader should hear the
       countdown but not be interrupted by it every second, so the region is
       marked aria-live but the value is not announced continuously — `off` on
       the per-second span, with the whole unit readable on demand. */
    <div className="mt-12 flex flex-col items-center md:mt-16">
      <p className="meta text-cream/80">{passed ? "The day has arrived" : "Until the ceremony"}</p>

      <div
        role="timer"
        aria-live="off"
        aria-label={passed ? "The ceremony has begun" : "Time remaining until the ceremony"}
        className="mt-5 flex items-start gap-4 sm:gap-7"
      >
        {cells.map((cell, i) => (
          <div key={cell.label} className="flex items-start gap-4 sm:gap-7">
            <div className="flex flex-col items-center">
              {/* `tnum` is what keeps this from twitching: without tabular figures
                  the seconds digit changes width every tick and the row shivers. */}
              <span className="tnum font-display text-[clamp(2rem,5vw,3.1rem)] font-light leading-none tracking-[-0.02em] text-gold-bright">
                {cell.value}
              </span>
              <span className="meta mt-2.5 text-[0.5rem] text-cream/80">{cell.label}</span>
            </div>
            {i < cells.length - 1 && (
              <span aria-hidden="true" className="mt-3 text-cream/20 select-none">
                <span className="font-display text-lg">·</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
