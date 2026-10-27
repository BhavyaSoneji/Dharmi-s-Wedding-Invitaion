import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Heart } from "lucide-react";

import { weddingData } from "@/data/weddingData";
import { Magnetic, MaskReveal, Reveal } from "@/lib/motion";
import { SectionLabel } from "./SectionLabel";

/**
 * VII — From the heart.
 *
 * A guestbook. Wishes persist to localStorage, capped at twelve so the wall
 * never becomes an unbounded list, and the caption says plainly that they are
 * kept on the reader's own device — the truth, and a small courtesy.
 */

const STORAGE_KEY = "dr-wishes";
const MAX_WISHES = 12;

type Wish = { id: string; name: string; message: string };

function readWishes(): Wish[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate the shape: a hand-edited or half-written value must not be able
    // to crash the render.
    return parsed
      .filter(
        (item): item is Wish =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Wish).id === "string" &&
          typeof (item as Wish).name === "string" &&
          typeof (item as Wish).message === "string",
      )
      .slice(0, MAX_WISHES);
  } catch {
    return [];
  }
}

export function Wishes() {
  const { wishes } = weddingData;

  const [list, setList] = useState<Wish[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setList(readWishes());
  }, []);

  const remaining = 300 - message.length;
  const canSubmit = useMemo(
    () => name.trim().length >= 2 && message.trim().length >= 3,
    [name, message],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const next: Wish[] = [
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : String(Date.now()),
        name: name.trim().slice(0, 60),
        message: message.trim().slice(0, 300),
      },
      ...list,
    ].slice(0, MAX_WISHES);

    setList(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota or private mode — the wish still shows for this session */
    }
    setName("");
    setMessage("");
  };

  return (
    <section id="wishes" className="section-y bg-cream" aria-label="Leave a wish">
      <div className="shell">
        <SectionLabel numeral={wishes.numeral}>{wishes.label}</SectionLabel>

        <MaskReveal
          as="h2"
          className="display-1 mx-auto mt-12 max-w-3xl text-center text-emerald md:mt-16"
        >
          {wishes.heading}
        </MaskReveal>

        <div className="mt-14 grid gap-14 md:mt-20 lg:grid-cols-2 lg:gap-20">
          {/* ---- Form ---- */}
          <Reveal delay={0.1}>
            <form onSubmit={submit} noValidate className="space-y-8">
              <div>
                <label htmlFor="wish-name" className="meta mb-3 block text-muted-foreground">
                  {wishes.nameLabel}
                </label>
                <input
                  id="wish-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={60}
                  required
                  minLength={2}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="wish-message" className="meta mb-3 block text-muted-foreground">
                  {wishes.messageLabel}
                </label>
                <textarea
                  id="wish-message"
                  name="message"
                  rows={5}
                  required
                  minLength={3}
                  maxLength={300}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className={`${fieldClass} resize-none leading-relaxed`}
                />
                <p aria-hidden="true" className="meta mt-2.5 text-[0.5rem] text-muted-foreground">
                  {remaining} remaining
                </p>
              </div>

              <Magnetic strength={0.24}>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="group inline-flex items-center gap-4 border border-emerald bg-emerald px-9 py-4 text-cream transition-colors duration-500 hover:border-emerald-deep hover:bg-emerald-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald"
                >
                  <Heart
                    className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-disabled:scale-100"
                    aria-hidden="true"
                  />
                  <span className="meta">{wishes.submit}</span>
                </button>
              </Magnetic>
            </form>
          </Reveal>

          {/* ---- The wall ---- */}
          <Reveal delay={0.16}>
            <div className="border-t border-border lg:border-t-0">
              {list.length === 0 ? (
                <>
                  <p className="font-display text-2xl italic leading-snug text-ink/80 md:text-[1.75rem]">
                    {wishes.empty}
                  </p>
                  <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
                    {wishes.persistence}
                  </p>
                </>
              ) : (
                <>
                  <ol aria-live="polite" className="max-h-[26rem] space-y-7 overflow-y-auto pr-2">
                    {list.map((wish, index) => (
                      <li key={wish.id} className="border-b border-border pb-7 last:border-b-0">
                        <blockquote className="border-l border-gold/70 pl-6">
                          <p className="font-display text-xl italic leading-snug text-ink md:text-[1.4rem]">
                            “{wish.message}”
                          </p>
                          <footer className="mt-3">
                            <cite className="meta not-italic text-muted-foreground">
                              — {wish.name}
                            </cite>
                            {index === 0 && (
                              <span className="meta ml-3 text-[0.5rem] text-gold">just now</span>
                            )}
                          </footer>
                        </blockquote>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
                    {wishes.persistence}
                  </p>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const fieldClass =
  "w-full border border-border bg-transparent px-4 py-3.5 text-sm text-ink transition-colors duration-300 placeholder:text-muted-foreground hover:border-ink/35 focus:border-emerald";
