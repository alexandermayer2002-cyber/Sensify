# Nightly Scout — Maintain + household card — 2026-11-09

Area 9 (day 9 mod 10), second pass; first was 10-29, whose seven findings all
shipped in Deploy 14. Walked live at 430px as +fable1 (reintro day 64, 2 of 2
ruled: Dairy=Limit, Gluten=Safe) and read-only as the day-68 reintro fleet
persona (+qafleetreintroc1, 0 verdicts) and the tracking persona. Shots
MNT9C/E/F/G_* in the session scratchpad. Read MaintainHub.js, HouseholdCard.js,
MapHealth.js, App.js (Stripe return), AdminDashboard.js (activation), and all
four maintain/household functions. No product writes beyond mint-then-revoke of
fable1's household link (restored, token 404s).

**Regression context:** 57/58; the one FAIL (`fleet.tracking.walk`, a 9s goto
timeout) re-ran clean in isolation → environmental, zero real regressions.

## Deploy-14 fixes verified live tonight (10-29 items, all holding)

| 10-29 # | Verified how |
|---|---|
| #1 household card hides Limit/Avoid | Public card now shows "Dairy · SMALL AMOUNTS ONLY", Safe food absent (shot MNT9C_public_card) |
| #2 "unlimited" vs 25/day cap | ai-proxy exempts `maintain_active`; copy unchanged, now backed |
| #3 legacy food_map read | MaintainHubInner reads the verdict union (source) |
| #4 drift goes thin forever | meals count toward richness; live card reads "1 meal, 9 check-ins…" (shot MNT9E_04) |
| #5 stranded household link | HouseholdShareCard renders in the full hub (source) |
| #6 silent symptom write | checked insert + inline retry copy (source) |
| #7 Stripe customer churn | create-maintain-setup reuses the profile's customer (source); detach-on-cancel still open → tonight's #4 |
| minor: rate line ×N | printed once (live, `rate_line_count: 1`) |

Also verified: link revoke works and the token 404s immediately; zero console
errors on every account walked; no overflow at 430px anywhere in the area.

## Ranked findings (new this pass)

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | The Stripe setup return is fire-and-forget: App.js L24-31 fires verify-maintain-setup with `.catch(() => {})`, shows nothing, and races the profile load — a customer who just saved a card lands back on the app with no acknowledgment and (until a reload after the write wins) the same "Reserve Maintain, $0 today" button; if the verify call fails (mobile network blip on the redirect is the common case) the opt-in is never recorded anywhere while the card IS saved at Stripe — at completion activate-maintain answers "not opted in", no subscription starts, and the customer who believes they reserved pays nothing and trusts less | Await the verify, show a confirmed "You're set for Maintain" (or an error with a retry), and refetch the profile before rendering the Maintain tab |
| 2 | ADD | MED | A failed activation has no second chance: "Mark protocol complete" renders only while phase is elimination/reintroduction (AdminDashboard L1253) and is the only caller of activate-maintain — when that call fails the alert says "activate manually", but once phase is 'complete' the button is gone and no UI can start the subscription (opted-in, carded, complete, not active = stuck, $12.99/mo lost per month stuck) | Render a "Start Maintain subscription" button on complete + maintain_opt_in + !maintain_active profiles |
| 3 | CHANGE | MED | The preview sells drift detection to its first-ever audience with an empty hole: the "WHAT DRIFT DETECTION LOOKS LIKE" label renders unconditionally (MaintainHub L117) while MapHealth returns null with zero verdicts — verified live on the day-68 persona: label floats over nothing (shot MNT9F_01). Everyone meets the Maintain tab at day 57 with 0–1 verdicts, so the broken state is the default first impression | Lift MapHealth's rendered/empty state to the label (or render the label inside MapHealth), with a one-line "your first verdict will light this up" placeholder |
| 4 | CHANGE | MED | "Cancel my reservation" leaves the card attached at Stripe (10-29 #7's second half, still open): cancelOptIn only clears maintain_opt_in; nothing detaches the payment method and the copy never says the card stays on file — "cancel anytime" reads as "card gone" | A cancel function that detaches the saved payment method, or copy that says the card remains saved and how to remove it |
| 5 | CHANGE | LOW | activate-maintain creates a brand-new inline Stripe product per subscription (`product_data` at L39-45) — N subscribers = N identical "Sensify Maintain" products cluttering the Stripe dashboard and defeating per-product reporting | One Price ID in an env var, `items: [{ price: MAINTAIN_PRICE_ID }]` |
| 6 | CHANGE | LOW | household-card.js hand-duplicates COMMON_TIER_1/2 and the track rules from protocolEngine.js, guarded only by a "change these too" comment (in sync tonight, checked) — the next tier edit silently desyncs the cook's card from the user's app | Move the lists to a shared JSON both import, or add a sentinel check that diffs the two |

Probed and clean: tracking-mode accounts correctly see neither the Maintain tab
nor the household card (no protocol = no pitch, shot-verified); public card
leaks nothing new, 404s on revoked/garbage tokens; `phase` in the card JSON is
stale program_phase ('elimination' for a day-64 reintro user) but is unused by
the page — noted, not ranked.

## Still open from prior nights (not re-listed as new)

The five Alex-side console switches (11-08 advisor #1): INTAKE_DRAFT_MIGRATION,
PAYMENT_GATE_MIGRATION, email confirm ON, QA_DIGEST_KEY, F&F copy call — plus
the verdict-engine items with the mid-January deadline and the lab-kit
fulfillment ruling. Morning Brief remains blind until QA_DIGEST_KEY is set.
