# Sachin weds Dharmi — wedding invitation

A single-page wedding invitation. TanStack Start (SSR) · React 19 · TypeScript ·
Tailwind v4 · GSAP 3.15 · Three.js.

Built with [Lovable](https://lovable.dev) and hand-finished. See `AGENTS.md`
before pushing — the project is connected to a Lovable project and rewriting
published git history will break the sync.

```sh
npm i
npm run dev      # Vite's local URL (usually http://localhost:5173)
npm run build
npm run preview
npm run lint
```

---

## Photography-led identity

The palette follows the real shoot: Dharmi's emerald clothing, cool green-blue
shadows around the carved pavilion, pale stone and warm sandstone. The
photographs remain unfiltered; subdued interface colors let them carry the
color and emotion.

| Role | Color | Hex |
| --- | --- | --- |
| Primary | Emerald | `#0F5D4C` |
| Secondary | Deep green | `#0A4034` |
| Accent | Soft brass | `#E3C99B` |
| Light background | Warm bone | `#F1EBE1` |
| Dark background | Green charcoal | `#17211F` |
| Surface | Paper ivory | `#FBF7F0` |
| Main text | Green charcoal | `#131A18` |
| Supporting text | Muted charcoal | `#4A504C` |

Display type uses Fraunces; Jost carries body copy and labels. The hero uses the
wide pavilion portrait on larger screens and the seated portrait on narrow
screens. The moments gallery follows the shoot from the pavilion through the
hillside, street, shore, city, lake and pool.

---

## The page

A dark threshold, seven numbered movements, a dark close.

| | Section | Ground |
| --- | --- | --- |
| — | Hero — names set over the photograph | near-black deep green |
| I | The Invitation | cream |
| II | The Date — 22 / of / November | deep green |
| III | Moments — horizontal-scroll gallery | cream |
| IV | The Celebrations — the five rites of the day | deep green |
| V | Our Story — a photographic interlude | cream |
| VI | For Our Guests | cream-deep |
| VII | From the heart | cream |
| — | Footer | near-black deep green |

The Roman numerals appear in the visible section labels **and** drive the
right-edge navigation rail. Both read from `sections` in `weddingData.ts`, so
adding a movement is a one-line change.

---

## Where things live

```
src/
  data/weddingData.ts      EVERY word and image on the site. Edit this first.
  styles.css               design tokens, type scale, utilities, motion guard
  lib/motion/              the motion system (see below)
  components/
    chrome/                SectionRail, MusicToggle, OpeningSequence — persistent site furniture
    media/                 PhotoDepth (WebGL)
    wedding/               the sections, plus SectionLabel
  routes/
    __root.tsx             html shell, fonts, SEO, 404/error pages
    index.tsx              the page + social preview tags
```

**There is no `src/pages/`, no `app/`, no `layout.tsx`.** This is file-based
TanStack routing — every `.tsx` in `src/routes/` is a route, and `__root.tsx` is
the only layout. `routeTree.gen.ts` is generated; do not edit it.

---

## The motion system

All animation goes through `src/lib/motion/`. Components never call `gsap.to`
directly.

| File | Purpose |
| --- | --- |
| `tokens.ts` | Every duration, easing, stagger and depth value on the site |
| `gsap.ts` | The only place GSAP is imported. Registers ScrollTrigger + SplitText once |
| `primitives.ts` | Animation factories — `revealUp`, `revealMask`, `parallax`, `magnetic`, … |
| `components.tsx` | React wrappers — `<Reveal>`, `<MaskReveal>`, `<Parallax>`, `<MaskedImage>`, `<Magnetic>` |
| `depth.tsx` | 3D — `<DepthScene>`, `<DepthLayer>`, `<Tilt3D>` |
| `hooks.ts` | `useReducedMotion`, `useMediaQuery`, `useIsomorphicLayoutEffect` |

### Two rules that matter

**1. Never `.from()`. Always `gsap.set()` then `.to()`.**

`styles.css` hides `[data-reveal]` elements at `opacity: 0` before hydration.
GSAP's `.from()` resolves its *end* value by reading the element's current
computed style — which is that 0. So `.from({ opacity: 0 })` resolves to
0 → 0 and the element never appears. This bug shipped once and silently blanked
every section below the hero.

**2. Every trigger goes inside a `gsap.context()`, and SplitText gets `.revert()`.**

SplitText writes DOM outside React's view, so `ctx.revert()` cannot undo it. Any
component that splits text must revert the instance in its own cleanup, or the
line wrappers leak.

### Scroll-linked sections

`Moments` is the only section that maps vertical scroll onto horizontal travel.
It is a scroll-linked transform, not a scroll-hijack: the user scrolls normally
and the section maps that onto X. One pinned ScrollTrigger drives both the travel
and the progress readout — two overlapping triggers once disagreed with each
other, with the counter advancing while the bar sat at zero.

On mobile and under reduced motion the track becomes a plain vertical stack, so
every photograph is reachable without a scroll gesture.

### Depth (3D)

Depth is structure, not decoration. `<DepthScene>` puts a perspective camera in
front of a group; children at different `translateZ` then parallax against each
other automatically. `<Tilt3D>` is a pointer-tracked plane tilt.

Two constraints worth knowing before editing:

1. **`className` on `<DepthScene>` lands on the inner element** (the camera and
   content container), not the outer perspective wrapper. Putting layout on the
   outer was a real bug — the grid ended up one level too deep and the hero
   silently collapsed to a single column.
2. **Never put `overflow` on `<DepthScene>` or `<Tilt3D>`.** Overflow forces
   `transform-style: flat` on descendants and collapses the Z space back to 2D,
   with no error.

### WebGL (Three.js)

`components/media/PhotoDepth.tsx` renders the hero photograph on the GPU with a
custom fragment shader.

**What it does, and why it is not a particle field.** The obvious Three.js move on
a wedding site is floating geometry, and that is exactly what makes a site read
as generated. This does the one thing CSS structurally cannot: **volumetric
parallax inside a flat image.** The shader offsets sampling per-pixel by a depth
field derived from the image's own luminance and a subject-centred falloff, so
the couple and the garlands travel further than the sandstone arch behind them.
Plus a very low-amplitude refraction — the image reads as being behind glass,
which is the right metaphor when the whole design is a printed card on a table —
and one narrow specular band.

**Cost: ~180KB gzip**, in its own lazily-imported chunk so it downloads in
parallel and does not block first paint. That is more than two thirds of the
site's entire JS budget, so the load is gated behind `canAffordWebGL()` —
`deviceMemory <= 2` or `hardwareConcurrency <= 2` or reduced motion skips it
entirely.

**Degradation is total and automatic.** No WebGL, reduced motion, no JS, a failed
texture, or a lost context all land on the same place: the plain `<img>` that
lives permanently underneath the canvas. The photograph is never absent. The
render loop pauses via `IntersectionObserver` when the hero scrolls out of view.

---

## The sealed date

The date arrives behind a piece of tape.

The day is the single most useful fact on the page, and it was simply *present* —
visible on arrival like any other heading, which is the one thing a printed
invitation never does. The date is what you have to open to read.

It costs one gesture: click, Enter/Space, or a drag past 64px. A real `<button>`
sits underneath the drag handlers so keyboard and screen-reader users get the same
gesture as everyone else. It never comes back once lifted.

**`setPointerCapture` on pointerdown is load-bearing.** Without it the drag dies
the moment the cursor leaves the tape — move and up are then delivered to whatever
is underneath, `onPointerUp` never runs, and the seal silently fails to open. The
tape is ~66px tall and the threshold is 64px of travel, so leaving it is the
normal case rather than an edge case.

Two things about the blur, both of which were wrong first:

- **It must stay perceptible.** An early pass used `opacity: 0.26` with a 14px
  blur, which on deep green left nothing at all under the tape. The date was not
  mysterious, it was simply absent, so there was no reason to lift anything.
  `blur(9px)` at `0.42` reads as a date you cannot quite make out.
- **The ternary polarity is load-bearing.** `sealed ? {blur…} : undefined`. When
  the flag was renamed from `unsealed` to `sealed` the swap inverted this, which
  put the tape over a fully-visible date in normal motion and a blurred,
  unreachable date under reduced motion. Both states look plausible in a
  screenshot, so it was only caught by asserting on both at once.

Reduced motion gets **no tape at all** — the seal is a flourish and the thing it
hides is the content, so without motion there is nothing to reveal and the date
is simply there. `reduced` and `unsealed` are combined into a single `sealed`
flag precisely so the tape and the blur cannot disagree.

Sealed content also gets `pointer-events: none`. `filter` blurs but does not
intercept pointer events, so without it the "Add to calendar" button stayed
clickable underneath the tape.

---

## Masked headings were slicing off descenders

Every display heading is set deliberately tight — `leading-[0.98]` on
`display-1`, `leading-[0.78]` on the date numerals, `leading-[0.9]` on the hero
names. `MaskReveal` wraps each line in a SplitText mask, and a SplitText mask is
the **line box**, clipping with `overflow: clip`. But the glyph box of a display
serif is always taller than its line box, so every masked heading was quietly
losing the bottom of its descenders:

| heading | size / leading | glyph box | line box | cut |
|---|---|---|---|---|
| "Things to know" | 80px / 0.98 | 87px | 78px | 9px |
| "Will you join us?" | 80px / 0.98 | 87px | 78px | 9px |
| "Sachin & Dharmi" | 88px / 0.92 | 93px | 81px | 12px |
| "31 OF" | 208px / 0.78 | 207px | 162px | 45px |

The "j" in "join" and the "g" in "Things" were both sliced flat.

`applyMaskBleed()` (in `lib/motion/primitives.ts`) sets `overflow-clip-margin`
on every mask, which expands a clip edge outward **without touching layout** — no
padding, no negative margin, no reflow. The tight leading that gives the
typography its character is preserved. The masks still hide the text before the
reveal plays, because `revealMask` starts every line at `opacity: 0`.

A text-first audit cannot find this class of bug: a SplitText mask is an empty
div, so it has no text of its own to look at. Detect it by walking for
`overflow: clip` boxes whose content exceeds them, then checking whether real text
lives inside.

---

## Moments — measuring instead of predicting

The section is pinned, so its composition must fit inside `100svh` with the
photographs uncropped. Three separate mistakes came out of trying to *predict*
that with CSS constants:

1. **`max-h` on a flex track does nothing.** A flex container only clips to a
   max-height when it also has `overflow: hidden`. Without it the photograph
   overflowed the track's own box, and because `my-auto` was centring that box,
   the captions spilled past the progress row and over the images.

2. **`scrollWidth` is meaningless on an `overflow: visible` element.** The track
   must stay visible so the photographs bleed past the section's edge and get
   clipped by the section. A visible element has no scrollable overflow region,
   so `scrollWidth` just returns `clientWidth` — which made travel come out at
   64px on every desktop and the gallery sat still. Sum the children instead;
   `offsetWidth` is unaffected by the transform.

3. **A CSS custom property declared on an element beats an inherited one.**
   `styles.css` declares `--mom-card-w` on `.moments-track` as the pre-measurement
   fallback. Writing the measured value to the *section* therefore did nothing at
   all, and the cards stayed at a constant width. Write it to the track.

So `sizeCards()` measures the real chrome — section padding, the two `shell`
blocks, and `figure.offsetHeight - img.offsetHeight` for the mount and caption —
and writes the result back. It loops until the value stops moving, because
narrowing the card can reflow the caption from two lines to one.

`onRefresh: ScrollTrigger.refresh` must **not** be passed to the trigger. Refresh
fires `onRefresh`, which calls refresh; the section died with a stack overflow.
`invalidateOnRefresh` is what re-reads the function-based `x` and `end`.

### Two modes

Where three photographs fit within the viewport width — short laptops and wide
monitors — there is little or no travel available, and pinning for 80px of scroll
makes the whole gallery snap across in one flick. Those viewports get a **still
row** showing all three at once (`MIN_TRAVEL = 200`). Everywhere else gets the
pinned gallery. The choice comes from measurement, not a breakpoint, and the
progress readout is hidden in row mode because a counter stuck at "01" would be
reporting a journey that is not happening.

---

## The first photograph's tonal lift

Measured before deciding anything: the card rendered at mean luminance 98 from a
source of 97, so **no overlay, blend or filter in the UI was responsible**. The
file carries crushed shadows — 5th percentile 25 against a median of 98 — and it
sits beside a cream ground around 235, which makes a correctly exposed mid-tone
read as murky by comparison.

`brightness` alone would have blown the marigold garlands, which already reach
178. Pulling contrast down while lifting brightness raises the black point and
leaves the highlights alone:

```
filter: brightness(1.13) contrast(0.92) saturate(1.06);
```

Verified by percentile bands rather than by eye — shadows 25 → ~36, highlights
178 → ~198, nothing crossing 250.

The second photograph is darker still (median 18, 5th percentile 1) and is
deliberately **not** lifted: it is a low-light candle shot, and a lift would have
washed out the highlights that make it work.

---

## Pinned sections and the vertical budget

Moments is pinned, so its composition must fit inside `100svh`. It did not: ~320px
of `section-y` padding plus a 680px card plus captions and the progress row came
to 1281px inside a 900px viewport, and every photograph was cropped top and bottom
while pinned.

Two fixes, both about measuring against the right axis:

1. **Padding is in `svh`, not `vw`.** `section-y`'s `clamp(5rem,12vw,10rem)`
   resolves to 320px on a laptop — but it grows with viewport *width*, which has
   nothing to do with the height budget.
2. **The card is sized by width in `svh`**, so its height follows through its
   aspect ratio. Figure caption plus progress row come to roughly 170px and
   padding is 22svh, leaving `0.78 - 1.25k` of the viewport for the photograph;
   `k = 0.36` keeps that positive down to a 640px-tall window.

**Do not put a `max-h` on the track expecting it to cap the card.** A flex
container only clips to a max-height when it also has `overflow: hidden`.
Without it the photograph overflowed the track's own box, and because `my-auto`
centres that box, the captions spilled downwards past the progress row and
overlapped the images.

---

## The envelope — the first screen

The visitor arrives at a **sealed envelope** and has to open it.

Five flat layers in a CSS `preserve-3d` rig, built in `src/envelope.css`: the
back, the lining, the card, the notched front, the flap, and the wax seal.
**No WebGL.** Five polygons do not justify a second rendering loop in front of a
page that already has one, and CSS gives real perspective and real z-ordering for
free.

### Layer order is the whole illusion

| Layer | Z | What it is |
| --- | --- | --- |
| `env__back` | −6px | the far face |
| `env__lining` | −4px | the envelope's interior |
| `env__card` | −2px | the invitation, tucked behind the pocket |
| `env__front` | +1px | the near face, V-notched |
| `env__flap` | +3px | hinged on its top edge |
| `env__seal` | +7px | the wax disc |

The card is **behind** the notched front and rises *through* the notch, so it is
revealed by geometry rather than faded in. That is what separates an envelope
opening from a rectangle rotating away.

### The lining earns its keep

The flap hinges at the top edge and the pocket's notch starts partway down, so the
wedges between them at the upper corners are **geometrically unavoidable** — no
single triangle and no single rectangle covers them. Without the lining, a sealed
envelope showed the invitation card through those wedges and as a pale band along
its top: two triangles that read as a rendering mistake rather than as paper. A
real envelope shows its own interior there, so that is what this layer is.

### The timeline

One GSAP timeline, 2.1s from tap to handover. Measured, not assumed.

```
0.00  seal presses              0.12s   the first thing that happens is a response
0.10  seal lets go and drops    0.52s
0.16  envelope turns to face you 0.95s   the object is handled, not rotated
0.24  flap hinges open          0.95s   to −172°, past flat
0.60  card rises AND advances    1.05s   the two together read as depth
1.22  card keeps coming          0.70s
1.55  onDone → hero develops underneath, envelope clears
```

The seal press is 120ms because nothing feels more broken than a tap met with a
delay. `onDone` fires at 1.55s rather than at the end so the hero develops
*underneath* the clearing envelope and there is never a frame of bare page.

Start states are set with `gsap.set`, never `.from()` — a `.from()` reads the DOM
at build time and animates *to* those values, so a stale element starts from the
wrong place and nothing appears to happen.

### Three ways it cannot strand the visitor

- The release is **held** until the hero photograph has loaded, because the hero
  develops on `onDone` and would otherwise develop a photograph that has not
  arrived. Capped at six seconds, so a photograph that never loads cannot hold the
  page hostage.
- A timeline that throws is caught, and the page is handed over immediately. An
  opaque overlay with no way past it is worse than a missing flourish.
- The root removes itself on unmount, so no orphan overlay is left behind.

### Reduced motion

No rotation, no travel: the seal lets go, the flap and card cross-fade, ~1s. The
**tap is still required** — the interaction *is* the opening, and removing it
would leave a page that changes on its own with no cause. A device without
`preserve-3d` still gets an envelope via `@supports`; only the rotation is lost.

### What it replaced

`OpeningSequence` — a monogram on a hairline sweep — was removed, not kept
alongside. Nothing else imported it.

## The hero reveal

The hero does not fade in. It **develops**.

1. **The names arrive first, alone in the dark.** Half a second of nothing but
   the kicker is what makes the names feel like the first event rather than the
   fourth.

2. **The photograph develops.** An aperture opens outward from a horizontal seam
   at the vertical centre while the image itself comes up the way a print comes
   up in a tray — flat, desaturated, lifted blacks resolving to full contrast. A
   warm bloom leads it and dies as it completes, so the photograph looks lit from
   within rather than faded in.

### One property drives the whole effect

Everything — the clip-path seam, the contrast/saturation/brightness shift and the
bloom — is derived from a single `--reveal` custom property animated 0 → 1:

```css
clip-path: inset(calc((1 - var(--reveal)) * 50%) 0% calc((1 - var(--reveal)) * 50%) 0%);
filter: contrast(calc(0.15 + 0.85 * var(--reveal)))
        saturate(var(--reveal))
        brightness(calc(1.35 - 0.35 * var(--reveal)));
```

One tween therefore cannot leave the aperture and the tonal shift out of sync,
and both resolve to identity at 1. A `data-settled` attribute then drops the
filter entirely rather than parking on `contrast(1) saturate(1)` for the rest of
the visit.

**Do not gate the opening on the GPU layer.** It waits on the `<img>`, via
`PhotoDepth.onImageLoad`. Waiting on the texture means holding the visitor on a
monogram while 180KB of Three.js downloads — for an effect that only ever
enhances an image they are already looking at.

### Ambient petals

Seven out-of-focus petals drift down through the dark ground, because this is a
wedding. Sized in `cqw` so they scale with the viewport, heavily blurred and very
low contrast so they read as depth-of-field bokeh rather than as particles. Each
has its own duration, delay and drift so the field never loops in sync. Under
reduced motion they are **removed**, not frozen — a static petal hanging in
mid-air reads as a bug.

---

## Typography and the hero frame

The hero frame is `container-type: inline-size`, and every measurement inside it
is in `cqw`. The type is therefore sized against **the frame**, not the viewport.
Sized against the viewport instead, the names grow with the window while the
photograph does not, and on a wide screen they burst out of the bottom of the
frame and collide with the cue below.

---

## Reduced motion

`prefers-reduced-motion` is a first-class mode, not a kill switch. The inline
script in `__root.tsx` skips adding the `motion` class entirely, so reveals never
start hidden; CSS resets animations and smooth-scroll; the Moments gallery becomes
a vertical stack. The site is a complete, composed, static document.

---

## Content

All copy, dates, venue, contact details and image captions live in
`src/data/weddingData.ts`. Nothing is hard-coded in a component.

The real wedding details are in place — names, date, venue, contacts, the five
rites of the day with their Gujarati names, and the hashtag. A few items still
need confirmation or a live-service connection before launch:

- **The couple's film** has not been supplied. The page uses an original photo
  and links to the gallery until their film is ready.
- **The contact phone numbers** were supplied directly and are what the site
  shows, but they do not match the two printed on the invitation. One of the two
  sources is a typo — worth checking against the card before this is sent out.

### The venue map link is a real pin, not a search

`venue.mapUrl` is `https://maps.app.goo.gl/t89wfedCmj3MN44n9`, decoded from the
"Location Code" QR printed on the invitation. It was previously a name search,
which would have sent a guest in Bahucharaji to a guessed pin. `venue.qr.src`
points at the same location as an image for guests who would rather scan.

The QR is easy to break silently, because a squashed one still "loads". Three
traps bit during this build, all caught only by measuring or decoding rather than
looking:

- Putting the caption beside the code in a `flex` row let it take the width the
  code needed — 390px rendered a 51×120 rectangle. Stacked on mobile now, with
  `shrink-0` on the card.
- `col-start-2` below `md` spawned an implicit second column on a
  single-column grid and squeezed it to 85px at 320px.
- The first asset was a plain generated code with a floor near 110px. The
  couple's own artwork overlays the modules with a halftone screen and a
  photograph, which costs contrast: measured against
  `public/venue-location-qr.jpeg`, a decoder loses the code below **196px**.

So the component renders it at **240px** — about 20% clear of that floor — and
the checks assert the rendered box is square to within a pixel, is 240px wide,
and *decodes when screenshotted out of the live page*. That last one is the only
assertion that would have caught the size problem: the image loads perfectly at
132px and simply stops being a QR.

The artwork is stored exactly as supplied, with "Umiya Wadi, Becharaji" baked
into the caption area. Not cropped, not regenerated — the text is part of it.

---

## Assets

See `src/assets/README.md`. The couple photography ships at three widths each.

### Background music

The soundtrack lives at **`public/wedding-ambient.mp3`** — served straight from
`public/`, so replacing it is a file operation with no code change and no hashed
asset manifest to update. It is served locally rather than from a CDN so the site
has no runtime dependency on anything outside its own deploy.

`preload="metadata"`, not `"none"`: autoplay cannot begin against a resource the
browser has been told not to fetch. The track starts on load, muted, and the
mute is lifted on the visitor's first real gesture (`pointerdown`, `keydown` or
`touchstart` — **not** `scroll`, which does not grant user activation).

### Two non-obvious things about autoplay

**Browsers block *unmuted* autoplay outright**, so an element that simply calls
`play()` with sound on fails for effectively every visitor. Muted autoplay is
permitted, which is why the track starts silent and lifts a moment later. There
is no "click to enable sound" interstitial.

**`audio.muted = true` must be set as a property, in the same synchronous block
as the `play()` call.** React can land the `muted` *attribute* after a passive
effect has already run, and `play()` consults the *property* — so the element
looked muted on screen while the browser still judged it audible and refused:

```
NotAllowedError: play() failed because the user didn't interact with the
document first.
```

This is why the setup is a `useIsomorphicLayoutEffect` rather than
`useEffect`: the assignment has to happen before the browser evaluates whether
autoplay is allowed.

Turning the music off is remembered in `localStorage` and still wins over
autoplay on later visits, and the control remains available to turn it back on —
an earlier version hid the button permanently once it was switched off, which
made that decision irreversible on that device.

Verified on the current file — 24.46s, 48kHz stereo:

- **Looping is safe.** The track starts from silence (first 250ms peak −65.9 dBFS)
  and fades out over its final ~25ms, so each repeat falls into a brief natural
  pause rather than clicking. This is worth re-checking after any future swap:
  `<audio loop>` cuts hard from the last sample to the first, and a track that
  both starts and ends loud will click every 24 seconds.
- **The file is over-encoded.** 320kbps for ambient music that plays at 0.32
  volume. Re-encoding at 128kbps would take it from 955KB to roughly 390KB with
  no perceptible difference at that level.

**On sourcing the audio:** it has to be something you have the right to host. A
YouTube URL cannot be used as a source here for two independent reasons — the
audio cannot be lifted out of a video under YouTube's Terms of Service, and the
IFrame Player API requires a *visible* player, so it cannot be hidden to supply
ambient audio either. If a YouTube track is wanted on the site, the route is the
official visible embed or a separately licensed copy.
