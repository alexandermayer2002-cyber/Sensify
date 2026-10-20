# Sensify Design Language — the 2026-10-20 pass

The approved direction, in one sentence: **same voice, better materials.** The
serif verdicts, the honest copy, and the earned-color law stay exactly as they
are. The physical feel changes: depth, warmth, roundness, scale, and motion.
North star: quiet luxury wellness lab. Never generic pastel habit-app, never
sterile admin panel.

`src/styles/system.css` is the single source of material truth. This document
says how to apply it.

## Hard laws (violating any of these fails review)

1. **Copy is frozen.** No sentence changes anywhere unless a task explicitly
   lists it. No em dashes, no new italics (the one serif-italic title motif
   that exists may stay), no emojis, ever.
2. **Verdict colors are reserved.** Teal = Safe, amber = Limit, red = Avoid,
   plus true severity states. Never on filters, tabs, decoration, or emphasis.
   Use `.sn-stamp-*` for verdicts; `.sn-chip`/`.sn-chip-on` (forest) for
   everything selectable.
3. **No invented numbers.** No wellness scores, no percentages we do not
   compute. Design may only amplify numbers that already exist.
4. **One micro-label system.** `.sn-micro` (mono, wide, quiet) is the only
   eyebrow/label style. Kill every bold-sans-caps and plain-caps label.
5. **Logic untouched.** Data fetching, computation, handlers, storage: zero
   changes, except items explicitly assigned as logic fixes in an agent's own
   task.
6. **The ruling screens keep their stillness.** THE RULING / verdict-entry
   moments get materials (shadows, radii, type scale) but NO entrance
   animation theatrics; their gravitas is the brand's best asset.

## Materials

- **Cards**: `.sn-card` — white, radius 24, borderless, lifted by shadow.
  Delete every `border: 1px solid rgba(0,0,0,0.0x)` card outline. Inner
  panels radius 16, small controls 10, pills 999. No other radii.
- **Atmosphere**: the body background (system.css) is a lit gradient wash.
  Remove per-page flat background colors so it shows through. Section-level
  washes may use forest/amber tints at <= 8% alpha.
- **Dark surfaces**: `.sn-hero` (radial sage glow over deep forest). Dark
  cards never sit flat: they carry shadow-3.
- **Rows inside cards**: `.sn-row` (warm tint, radius 16) instead of bordered
  or beige boxes. Highlighted row: `.sn-row-up`.

## Typography

- Body is **Plus Jakarta Sans** (via body default; remove per-file
  `fontFamily: 'DM Sans'` declarations and per-file Google Fonts @imports —
  fonts load once in index.css).
- **Fraunces** owns headlines, verdicts, and every important number, at
  display scale: hero day 36-44px, headline numbers 36-48px, card titles
  18-22px. `.sn-num` for numerals.
- Supporting text gets genuinely small (12-13px) so scale contrast exists.
  The key stat of any card leads at display size; nuance follows small.
- `.sn-micro` labels: fewer than before, never more than two per card.

## Living data

- Progress: `.sn-track`/`.sn-fill`/`.sn-dot` (thick, gradient, glow). The
  skinny 4-6px gray bar is retired everywhere.
- Anything cyclical (streak, cycle day) may be an SVG ring: stroke 5,
  `--forest-300`, round caps, `snDraw` on mount.
- Numbers that changed since last visit may count up on load (200-400ms).
- Entrance: cards stagger in with `.sn-rise` / `-2` / `-3` / `-4`. Subtle,
  once, never on tab switches within a page.
- Hover: `.sn-card-hov` on tappable cards, buttons lift 1px. All motion
  respects prefers-reduced-motion (system.css handles it).

## Desktop (>= 900px)

Phone-stretched layouts are the failure mode. Each page picks a real grid:
- Dashboard: slim full-width hero band (one sentence, one CTA, one progress
  line), then main column (today's story) + one coherent right rail.
- Content pages: max-width 680-760 for reading, 1100+ only with real columns.
- The floating pill bottom bar is phone-only; desktop keeps the top nav,
  restyled to the system.

## Review bar

A screen passes when: no hairline card borders remain, no label outside
`.sn-micro`, no verdict color off-verdict, type scale shows real contrast,
progress elements are alive, desktop is designed rather than stretched, and
it still reads unmistakably as Sensify (serif, forest, honest) rather than a
generic wellness app.
