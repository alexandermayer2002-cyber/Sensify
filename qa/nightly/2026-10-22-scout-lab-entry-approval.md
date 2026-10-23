# Nightly Scout — Lab Entry + Approval — 2026-10-22

Area 2 (day 22 mod 10). Walked the live site at 430px with a fresh test account
(+qa2610220705l2): intake → lab entry (all three method tabs, manual search probes,
a synthetic lab-report PDF through the real AI extraction, submit, auto-approve →
"Starts tomorrow"), screenshotting each state. Read src/pages/LabResults.js,
AdminDashboard.js (lab tab + approveLab, read-only — no admin surface touched),
netlify/functions/test-approve-lab.js, ai-proxy.js, src/utils/testMode.js,
aiClient.js, protocolEngine.js (getTestingOrder), and the Dashboard lab-state cards.
Built on 2026-10-20 and 2026-10-21 reports; nothing repeated.

**Regression context:** 14/16 (regress_summary.json, stamp 2610220652). Two FAILs:
`p1.walk` — a 9s goto timeout on the second navigation; re-ran path 1 alone right
after and it went 7/7 green, so environmental noise, not a regression.
`p4.verdicts_tracking_state` — same known failure as last night (tracking-mode
Verdicts tab has no labeled example wall while FoodMap.js's comment above the
tracking branch still claims it stays); still open for Alex to rule on, nothing
new tonight. Effective product state: everything the suite can reach is green
except that one known mismatch.

> **Ruled 2026-10-23 (Alex):** the missing example wall is an intentional cut.
> Harness check realigned to the tracking-state copy, stale FoodMap.js comment
> rewritten — this FAIL is resolved, not open. Finding #1 below (admin-decline
> dead end) was approved and fixed the same day (`track_decision: 'declined'`
> added to approveLab's declined branch, awaiting next deploy); findings #2–#7
> remain open.

## What's solid

The happy path is genuinely good. The synthetic PDF went through the real
extraction live tonight: 4 foods returned with correct levels, and the two
foods the report listed as "No reaction"/"Not tested" were correctly excluded.
Manual entry's two-step read-back gate ("Review my entry → Looks right, submit")
is honest friction in the right place, flagged foods survive switching between
method tabs, the "N foods flagged so far" banner is good reassurance, no screen
in the flow overflows at 430px, the lab-results bucket is private with
short-lived signed URLs for admin viewing, and the test-only approval door is
pattern-checked server-side, exactly as its comment promises. The findings below
are mostly edges and the approval back-half.

## Ranked findings

### 1. CHANGE — Admin "Skip Protocol → Track" strands the customer in a dead-end dashboard
**Why:** approveLab's declined branch (AdminDashboard.js:352–366) sets
`program_phase/protocol_track = 'declined'` but never sets `track_decision`,
and every user-side tracking surface keys on `track_decision === 'declined'`
(Dashboard.js:1211–1215): isTracking stays false, needsCommonDecision stays
false, the pending card is gone (lab is 'approved'), so the user gets the bare
"Everything starts from here." greeting with no action card, no TrackingLanding,
no daily check-in — a $399 buyer whose review outcome is "track" lands in limbo
with nothing to do and no explanation.
**How:** Have the declined branch also set `track_decision: 'declined'` (or make
the user side treat `protocol_track === 'declined'` as tracking); one line either
way.

### 2. CHANGE — Manual entry is a closed list of 63 foods with a silent dead end
**Why:** Verified live: searching anything outside COMMON_FOODS ("goat cheese",
"quinoa"-class entries, any typo) renders an empty list — no "no match" message,
no way to add the food. Real IgG panels run 96–200+ foods; a buyer whose report
flags something off-list literally cannot enter it, and the screen's own
instruction ("Add each food your lab report flags") becomes a promise the picker
can't keep.
**How:** When search has no match, show a "No match — add '<term>' as a food"
row that creates a free-text entry (levels work the same); keep COMMON_FOODS as
suggestions, not a wall.

### 3. CHANGE — The pending-review card promises what the system cannot do  ⚑ COPY PROMISE FLAG
**Why:** "Reviewed within 24 hours. Your dashboard updates the moment it's
approved." (Dashboard.js:1802) — there is no realtime subscription, no
refetch-on-focus, and (per the two prior nights) no email/SMS anywhere, so the
dashboard updates only on a fresh visit, and nothing notifies the user that
approval happened. A phone user who checks once, sees "under review", and waits
to be told will wait forever; "within 24 hours" is also an unenforced solo-founder
SLA sitting in product copy. Same phantom-notification family as 10-20 #2 and
10-21 #6.
**How:** Soften to "Usually reviewed within a day — check back here", and/or
refetch profile+lab on visibilitychange (a few lines); an approval email is the
real fix once any mailer exists.

### 4. CHANGE — Extracted food names are never canonicalized, silently degrading the testing order
**Why:** Tonight's live extraction returned "Cow's Milk" even though the prompt's
own example says "Cow Milk"; getTestingOrder (protocolEngine.js:81) looks up
frequency by exact name key, so the intake's "Cow Milk — Daily" rating misses and
the food drops to rank 9 — the physician-flagged frequency-first doctrine quietly
stops applying to upload-path users, with no error anywhere. (Adjacent to the
Crab-first instrument gap noted in commit 464543d.)
**How:** After extraction, normalize names against COMMON_FOODS / the intake
frequency keys (lowercase, strip possessives, small alias map), or have the
prompt choose from the canonical list when a food matches one.

### 5. CHANGE — Admin lab card calls uploads "Manually entered", and a failed upload is swallowed silently
**Why:** The card's fallback tests the legacy column — `{!lab.file_url && (
"Manually entered — no file uploaded")}` (AdminDashboard.js:806) — but
LabResults.js now always writes `file_url: null` and stores `file_path`, so every
upload shows the PDF link *and* the contradictory "no file uploaded" line.
Worse, LabResults.js:216–224 ignores `storageError`: if the upload fails the
submission proceeds file-less, the admin sees a (then truthful) "manually
entered", and nobody — user or admin — learns the original document was lost.
**How:** Gate the fallback on `!lab.view_url`; on storageError tell the user and
offer retry before submitting; then retire the dead `file_url` write/fallback
entirely.

### 6. CHANGE — The analyze pipeline has no file-size or type guard
**Why:** The file goes base64 (+33%) through a Netlify function with a ~6MB
request cap and on to a vision API with its own limits; a normal 4–8MB phone
photo or a multi-page scan fails at the transport layer, and HEIC (iPhone
photo-library default) is an unsupported media type — all surfaced as the same
generic "Something went wrong reading your file", steering users away from the
flow's best feature.
**How:** Client-side: downscale/re-encode images to JPEG under ~2MB via canvas
before sending, reject oversized PDFs with a specific message ("under 5MB, or
enter manually"), and say *why* when it fails.

### 7. CHANGE — A raw "✦" escape renders as literal text in the upload info bar
**Why:** LabResults.js:310 puts `✦` in JSX text, where JS string escapes
don't apply — the live page shows the characters "✦" instead of the ✦ glyph
(screenshot L2_04), right at the top of the most-used screen in this area; small,
but it reads as broken to a paying customer.
**How:** `{'✦'}` (or paste ✦).

Minor notes, not ranked: the extracted-foods list shows a colored level badge
*and* a matching `<select>` per row (redundant controls, screenshot L2_13);
"My report shows no sensitivities" stays toggled-on while foods are flagged and
is then silently ignored at submit (should clear/disable when a food is picked);
the three staged processing messages are timers, not progress.

## Still open from prior nights

All 7 findings from 2026-10-20 (marketing) and all 7 from 2026-10-21
(signup+intake) remain open — no product commits since deploy 9, only QA.
Tonight's #3 is the third sighting of the phantom-notification family
(10-20 #2 privacy-policy SMS, 10-21 #6 consent-email reminders), and tonight's
#5/#6 extend 10-21's theme that failure paths fail silently. The
`p4.verdicts_tracking_state` harness/product mismatch from 10-21 is unchanged
and still awaits a ruling.
