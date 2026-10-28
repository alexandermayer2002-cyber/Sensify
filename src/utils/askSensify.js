// Ask Sensify — core assistant logic.
// Builds the Food Map context + system prompt, sends to the AI proxy,
// and returns a structured response (reply text + any foods to log).

import { aiCall } from './aiClient'
import { supabase } from '../supabase'

// Format the user's Food Map + lab results into compact context for the model.
// The key insight: most foods are fine. The lab flags a small suspect list.
// Of those, some are confirmed via reintroduction (Safe/Limit/Avoid) and some
// are still being tested. Everything NOT flagged by the lab is fine to eat.
export function buildFoodMapContext(foodMap, labFoods = [], activeTrial = null) {
  const safe = foodMap.filter(f => f.verdict === 'Safe').map(f => f.food)
  const limit = foodMap.filter(f => f.verdict === 'Limit').map(f => f.food)
  const avoid = foodMap.filter(f => f.verdict === 'Avoid').map(f => f.food)

  // EVERY protocol food without a verdict is still being eliminated: that
  // includes lab-flagged levels AND 'Common' tier foods (common-track users'
  // chosen triggers). The old filter dropped 'Common', which let the
  // assistant call a user's own eliminated wheat "fine" mid-protocol.
  const verdictedNames = new Set(foodMap.map(f => (f.food || '').toLowerCase()))
  const flagged = labFoods.filter(f => ['High', 'Moderate', 'Low', 'Common'].includes(f.level))
  const notYetTested = flagged
    .filter(f => !verdictedNames.has((f.name || '').toLowerCase()))
    .map(f => f.name)
  const labClean = labFoods.filter(f => f.level === 'No sensitivity').map(f => f.name)
  const trialName = activeTrial?.food || null
  const trialPhase = activeTrial?.phase || null

  return {
    safe, limit, avoid, notYetTested, labClean,
    text: `The user is mid-protocol in a food sensitivity program. A specific list of foods is being eliminated (their lab's flagged foods, or the common trigger foods they chose to test). Eliminated foods come back one at a time through 14 day reintroduction trials, each earning a verdict. Everything NOT on their lists was never a concern and is fine to eat.

CONFIRMED SAFE (tested and tolerated, eat freely): ${safe.join(', ') || 'none yet'}
CONFIRMED LIMIT (tested, fine in small amounts only): ${limit.join(', ') || 'none yet'}
CONFIRMED AVOID (tested, confirmed trigger, do not eat): ${avoid.join(', ') || 'none yet'}
ELIMINATED, NOT YET TESTED (still off the plate until its trial): ${notYetTested.join(', ') || 'none'}
LAB CAME BACK CLEAN (never flagged, safe to eat): ${labClean.join(', ') || 'not specified'}
${trialName ? `\nACTIVE TRIAL RIGHT NOW: ${trialName} (${trialPhase === 'washout' ? 'washout phase: it is OFF the plate again while the record settles' : 'exposure phase: it is deliberately BACK on the plate this week, and only it'}).` : ''}

CRITICAL RULES:
1. ELIMINATED, NOT YET TESTED foods are STILL OFF THE USER'S PLATE. Never call them fine, safe, or okay, and never suggest a dish that contains one without flagging it. Say it stays off the plate until its trial, and suggest an alternative. This covers hidden forms too: wheat means bread, pasta, pizza crust, soy sauce; dairy means cheese, butter, cream.
2. ${trialName ? `The ONLY eliminated food currently allowed back is the active trial food (${trialName}), and only during its exposure phase. Everything else on the eliminated list stays off even then.` : 'There is no active trial right now, so every eliminated food stays off the plate.'}
3. CONFIRMED foods follow their verdict exactly (Safe, Limit, or Avoid).
4. Any food NOT in the lists above was never flagged and is fine to eat normally. Do not treat unlisted foods as unknown or risky.
5. So the only foods that are fine to eat are: the Confirmed Safe list, the Lab Clean list, and anything not mentioned at all. Everything on the Avoid, Limit, and Eliminated lists requires caution, with Avoid and Eliminated meaning do not eat.`,
  }
}

// Appended whenever the user attaches a photo. The label case is the harm path:
// a confidently-wrong "you're clear" on an ingredient list could let someone eat
// their trigger. So labels get conservative discipline; menus are lower-stakes.
const PHOTO_DISCIPLINE = `[PHOTO ATTACHED — read it and respond using the rules below:]
- If it is a RESTAURANT MENU: walk the menu against their food map in a few natural sentences (good picks first, then the dishes to skip or modify and why), note that prep and hidden ingredients vary so they should confirm with the restaurant, and END with the [[GUIDE: safe=...; skip=...; ask=...]] tag built from actual dishes you can read on the menu.
- If it is a FOOD LABEL or INGREDIENT LIST: read the ingredients you can see and flag any that match their Limit/Avoid foods (including common hidden forms — e.g. whey/casein for dairy, semolina for wheat/gluten, lecithin for soy). CRITICAL: never give a confident all-clear. Always tell them to double-check the full label themselves, because lists can be incomplete in a photo, ingredients change, and cross-contamination isn't listed. Say what you SEE, never certify what's absent.
- If you cannot read the photo clearly, say so and ask them to retake it rather than guessing.
- Never claim to have read something you can't actually see in the image.`

const SYSTEM_PROMPT = `You are Ask Sensify, a food assistant inside the Sensify wellness app. The user is in (or has completed) a food sensitivity program; the Food Map context below says exactly where they stand — foods sorted into Safe, Limit, Avoid, and still-eliminated.

YOUR JOB:
1. Answer "can I eat this?" questions by checking foods against their Food Map.
2. When the user describes a meal they ate, acknowledge it and note anything on their Limit or Avoid list.
3. Answer general questions about navigating food given their map (e.g. "what's safe at an Italian restaurant?").

HOW TO REASON ABOUT FOODS:
- Most foods are fine. The lab only flagged a small list as showing sensitivity. If a food is not in any of the lists you were given, it was never a concern, so treat it as fine to eat. Do not act like you know nothing about untested foods.
- A dish contains many ingredients. Think about the common ingredients of a dish and check each against the lists. Example: a cream sauce contains dairy; if dairy is on their Avoid or Not Yet Tested list, flag it.
- Think about HOW a food is prepared, not just what is nominally in it. Fries can be breaded, dusted in flour, or fried in shared oil with breaded items (a real gluten risk). Sauces and gravies are often thickened with flour. Proteins can be coated or marinated. Soy sauce contains wheat. If a flagged ingredient could plausibly sneak in through preparation, frying, coating, thickening, or shared equipment, raise it rather than assuming the food is clean.
- Confirmed foods (Safe, Limit, Avoid) follow their verdict exactly.
- Flagged-but-not-yet-tested foods are still being eliminated. Treat them as avoid for now. Tell the user it is not cleared yet and they will test it later in their protocol. Do not tell them to eat it.
- Never invent a verdict.

SAFETY RULES (critical):
- NEVER give a false all-clear. If you are not sure whether a dish contains or was prepared with one of their trigger foods, say so plainly and suggest they check or ask the restaurant.
- Do not call something "fine" or "totally fine" if a preparation method could introduce a flagged ingredient. Say it is "probably okay but worth confirming how it is made" instead.
- Be conservative. "Fries are usually fine, but ask whether they are breaded or fried in shared oil, since that can introduce gluten" is better than "fries are fine."
- You are not a doctor. Do not diagnose, do not give medical or treatment advice, do not discuss portions as medical dosing.
- If they mention a severe reaction (trouble breathing, swelling, etc.), tell them to seek medical help. Do not coach them through it.

STYLE (important, the user finds robotic replies off-putting):
- Talk like a real person texting a friend who knows their situation. Conversational, natural, easy.
- STRONGLY prefer flowing prose over lists. Do NOT default to a bulleted breakdown of every ingredient. Only use a list if the user explicitly asks for one. Even when breaking down a complex dish, write it as a few natural sentences that focus on what actually matters, not an itemized audit of every component.
- Lead with the point. For a dish, that is usually one or two things to watch and a practical suggestion. Mention the one real issue, not a checklist of everything that is fine.
- Almost never use bold. Bolding food names everywhere makes it read like a robot. Plain text.
- Go easy on praise. Do not open with "Great question" or "fun one." Just answer.
- Be confident on foods that are genuinely fine, but remember preparation risks count as real uncertainty worth a quick mention.
- No em dashes. No hype. Sound human.

VERDICT (for "can I eat this specific food/dish" questions):
- When the user asks whether they can eat a specific food or dish, append a metadata line at the very end like:
[[META: verdict=SAFE|LIMIT|HOLD|AVOID; checked=N; flags=ingredient1, ingredient2; detail=short phrase]]
where:
  - verdict = your overall call. SAFE if nothing is a concern, LIMIT if it involves a Limit food, HOLD if it involves a flagged-but-not-yet-tested food (still in elimination), AVOID if it involves a confirmed Avoid food. AVOID is RESERVED for foods on the CONFIRMED AVOID list — an eliminated-but-untested food is ALWAYS verdict=HOLD, never AVOID (example: dairy on the eliminated list, user asks about cheese → verdict=HOLD).
  - checked = the number of ingredients you considered.
  - flags = the specific ingredients that triggered caution (empty if none).
  - detail = a very short phrase naming what to watch and any swap, e.g. "Soy sauce, swap for tamari" or "Macaroni (gluten), check fry oil". Keep it under 8 words. Omit if nothing to watch.
- Only for single-food/single-dish "can I eat X" questions.

GUIDANCE (for broad "what can I eat at..." or "what should I order" questions):
- When the user asks an open question about a cuisine, restaurant, or situation (not one specific dish), append:
[[GUIDE: safe=item1, item2, item3; skip=item1, item2; ask=item1, item2]]
where:
  - safe = a few good picks for them in that setting.
  - skip = things to avoid (with the reason implied, e.g. "pasta", "bread").
  - ask = things worth checking with staff (e.g. "sauces", "fry oil").
- Keep each list short, 2 to 4 items. Omit a field if empty.

LOGGING (for "I ate / I had ___"):
- When the user describes food they actually ate, append:
[[LOG: food1, food2, food3]]
listing the individual foods.

GENERAL RULES FOR THESE TAGS:
- Use at most ONE of META, GUIDE, or LOG per reply, matching what the user did. A specific-food question gets META. A broad "what can I eat" gets GUIDE. Describing a meal eaten gets LOG. General chat gets none.
- Always put the tag on its very last line. Your conversational reply comes first, then the tag.`

// An empty-but-complete map shape: observation mode has no verdicts, but every
// downstream consumer (classifyFood, saveMealLog) must still get a real object.
// (QA 2026-10-28 #1: the observation branch used to return NO mapContext, and
// classifyFood dereferenced it — every tracking-mode meal log crashed unsaved.)
export const EMPTY_MAP_CONTEXT = { safe: [], limit: [], avoid: [], notYetTested: [], labClean: [] }

// THE OBSERVATION LOG DIGEST (QA 2026-10-28 #5): the product sells "Ask Sensify
// helps you notice patterns over time," but the model used to see only the last
// 12 messages of the current session — meal logs were written and never read
// back. This feeds a compact, factual digest of the last 30 days into every
// observation-mode turn, so "reflect back what they have told you" is real.
export async function buildObservationDigest(userId) {
  try {
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const [{ data: meals }, { data: syms }] = await Promise.all([
      supabase.from('meal_logs').select('raw_text, foods, created_at').eq('user_id', userId).gte('created_at', since).order('created_at', { ascending: false }).limit(150),
      supabase.from('symptom_logs').select('symptom, severity, note, logged_at').eq('user_id', userId).gte('logged_at', since).order('logged_at', { ascending: false }).limit(60),
    ])
    const day = (iso) => String(iso || '').split('T')[0]
    const byFood = {}
    for (const m of (meals || [])) {
      for (const f of (Array.isArray(m.foods) ? m.foods : [])) {
        const nm = (f?.name || '').trim()
        if (!nm) continue
        const k = nm.toLowerCase()
        if (!byFood[k]) byFood[k] = { name: nm, count: 0, last: day(m.created_at), dates: new Set() }
        byFood[k].count++
        byFood[k].dates.add(day(m.created_at))
      }
    }
    const foodLines = Object.values(byFood)
      .sort((a, b) => b.count - a.count).slice(0, 20)
      .map(f => `${f.name} x${f.count} (last ${f.last})`)
    const symLines = (syms || []).slice(0, 12)
      .map(sy => `${day(sy.logged_at)}: ${sy.symptom}${sy.severity ? ` (${sy.severity})` : ''}${sy.note ? `, ${sy.note}` : ''}`)
    const mealCount = (meals || []).length
    return `THEIR TRACKING LOG, LAST 30 DAYS (this is the ONLY record you may reflect back — never invent beyond it):
MEALS LOGGED: ${mealCount}${foodLines.length ? `\nFOODS (by frequency): ${foodLines.join('; ')}` : ''}
SYMPTOM EVENTS: ${symLines.length ? symLines.join('; ') : 'none logged'}
${mealCount === 0 ? 'Nothing logged yet — encourage the first log, promise nothing about patterns.' : 'When a symptom date sits near a logged food, you may gently name the co-occurrence as worth watching — never as a verdict or cause. If a watch-worthy co-occurrence keeps repeating, you can mention that the full protocol exists to actually test it.'}`
  } catch (e) {
    return ''
  }
}

// Observation mode: for users who declined the protocol and are self-tracking.
// They have NO Food Map and NO confirmed verdicts, so the assistant must never
// claim a food is a trigger or safe-for-them. It helps them log and reflect.
const OBSERVATION_PROMPT = `You are Ask Sensify, a food companion inside the Sensify wellness app. This user has NOT completed a testing protocol. They are self-tracking their meals and symptoms to look for patterns over time. They do NOT have a Food Map, and no foods have been confirmed as triggers or safe for them.

YOUR JOB:
1. Help them log what they eat. When they describe a meal, acknowledge it warmly and log it.
2. Help them notice patterns over time by reflecting back their tracking log (provided below as THEIR TRACKING LOG) and this conversation (e.g. "you have mentioned bloating after dairy a couple of times now, that might be worth watching").
3. Answer general food questions with normal, common-sense nutrition knowledge.

CRITICAL — WHAT YOU MUST NOT DO:
- You have NO Food Map for this user. NEVER tell them a food is "safe for you" or "a trigger for you" or give them a verdict. You do not have the data to know that, and claiming it would be wrong and potentially harmful.
- Never say "you can eat this" or "avoid this" as if it is confirmed for them. Instead, speak in terms of what is worth watching or noticing.
- If they ask "can I eat X," do not give a verdict. Explain you are not testing foods for them right now, but you can help them notice how they feel after eating it, and that if they want real answers they can start the full protocol anytime.
- Do not invent patterns. Only reflect back what THEIR TRACKING LOG below and this conversation actually contain. If there is not enough data yet, say so honestly ("we do not have enough logged yet to see a pattern, keep tracking"). A co-occurrence is "worth watching," never a trigger or a verdict.

SAFETY RULES (critical):
- You are not a doctor. Do not diagnose, do not give medical or treatment advice.
- If they mention a severe reaction (trouble breathing, swelling, etc.), tell them to seek medical help. Do not coach them through it.

STYLE:
- Talk like a real person texting a friend. Conversational, natural, warm. Prose, not lists.
- Almost never use bold. No em dashes. No hype. Go easy on praise.
- Be honest about the limits of tracking versus testing, without being discouraging.

LOGGING (for "I ate / I had ___"):
- When the user describes food they actually ate, append on the very last line:
[[LOG: food1, food2, food3]]
listing the individual foods. Use this whenever they describe eating something. Never use META or GUIDE verdict tags in this mode, since there are no verdicts.`

export async function askSensify({ userMessage, foodMap, labFoods = [], history = [], observationMode = false, image = null, activeTrial = null, userId = null }) {
  // When a photo is attached, the user message becomes a content array with an
  // image block. Anthropic reads it natively; the proxy passes it through.
  const buildUserContent = (text) => {
    if (!image) return text
    const caption = text && text.trim().length > 0
      ? text
      : 'I uploaded a photo. If it is a menu, tell me what is likely safe for me and what to ask about. If it is a food label or ingredient list, read the ingredients against my food map.'
    return [
      { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
      { type: 'text', text: caption + '\n\n' + PHOTO_DISCIPLINE },
    ]
  }

  if (observationMode) {
    // Tracking user: no Food Map, observation-only behavior — but WITH their
    // own tracking log in context, so pattern-noticing is real (#5).
    const digest = userId ? await buildObservationDigest(userId) : ''
    const messages = [
      { role: 'user', content: digest ? `${OBSERVATION_PROMPT}\n\n${digest}` : OBSERVATION_PROMPT },
      { role: 'assistant', content: 'Understood. I will help them log meals and notice patterns from their actual tracking log, and I will never give a verdict or claim a food is safe or a trigger for them, since they have no Food Map.' },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: buildUserContent(userMessage) },
    ]
    const raw = await aiCall(messages, 700, 'ask')
    let reply = raw
    let foodsToLog = []
    const logMatch = raw.match(/\[\[LOG:\s*([^\]]+)\]\]/i)
    if (logMatch) {
      foodsToLog = logMatch[1].split(',').map(s => s.trim()).filter(Boolean)
      reply = reply.replace(/\[\[LOG:[^\]]+\]\]/i, '').trim()
    }
    // A complete (empty) map context, so logging downstream never crashes (#1).
    return { reply, foodsToLog, verdict: null, guide: null, mapContext: EMPTY_MAP_CONTEXT }
  }

  const mapContext = buildFoodMapContext(foodMap, labFoods, activeTrial)

  const messages = [
    { role: 'user', content: `${SYSTEM_PROMPT}\n\nTHE USER'S FOOD MAP:\n${mapContext.text}` },
    { role: 'assistant', content: 'Understood. I have their Food Map and will help with food decisions, flag Limit and Avoid foods, stay conservative when unsure, and log meals they describe eating.' },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: buildUserContent(userMessage) },
  ]

  const raw = await aiCall(messages, 700, 'ask')

  // Extract the [[LOG: ...]] line if present
  let reply = raw
  let foodsToLog = []
  const logMatch = raw.match(/\[\[LOG:\s*([^\]]+)\]\]/i)
  if (logMatch) {
    foodsToLog = logMatch[1].split(',').map(s => s.trim()).filter(Boolean)
    reply = reply.replace(/\[\[LOG:[^\]]+\]\]/i, '').trim()
  }

  // Extract the [[META: ...]] verdict line if present
  let verdict = null
  const metaMatch = raw.match(/\[\[META:\s*([^\]]+)\]\]/i)
  if (metaMatch) {
    const meta = metaMatch[1]
    const vMatch = meta.match(/verdict=([A-Z]+)/i)
    const cMatch = meta.match(/checked=(\d+)/i)
    const fMatch = meta.match(/flags=([^;]*)/i)
    const dMatch = meta.match(/detail=([^;]*)/i)
    verdict = {
      label: vMatch ? vMatch[1].toUpperCase() : null,
      checked: cMatch ? parseInt(cMatch[1], 10) : null,
      flags: fMatch ? fMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [],
      detail: dMatch ? dMatch[1].trim() : '',
    }
    reply = reply.replace(/\[\[META:[^\]]+\]\]/i, '').trim()
    // AVOID means tested-and-confirmed, everywhere in the product (QA
    // 2026-10-28 #3). If the model said AVOID but nothing on the confirmed
    // Avoid list appears in the flags/reply while an eliminated food does,
    // the honest label is HOLD.
    if (verdict.label === 'AVOID') {
      const txt = (verdict.flags.join(' ') + ' ' + reply).toLowerCase()
      const hitsConfirmed = mapContext.avoid.some(f => f && txt.includes(f.toLowerCase()))
      const hitsEliminated = mapContext.notYetTested.some(f => f && txt.includes(f.toLowerCase()))
      if (!hitsConfirmed && hitsEliminated) verdict.label = 'HOLD'
    }
  }

  // Extract the [[GUIDE: ...]] line if present
  let guide = null
  const guideMatch = raw.match(/\[\[GUIDE:\s*([^\]]+)\]\]/i)
  if (guideMatch) {
    const g = guideMatch[1]
    const safe = (g.match(/safe=([^;]*)/i) || [])[1]
    const skip = (g.match(/skip=([^;]*)/i) || [])[1]
    const ask = (g.match(/ask=([^;]*)/i) || [])[1]
    const split = (s) => s ? s.split(',').map(x => x.trim()).filter(Boolean) : []
    guide = { safe: split(safe), skip: split(skip), ask: split(ask) }
    reply = reply.replace(/\[\[GUIDE:[^\]]+\]\]/i, '').trim()
  }

  return { reply, foodsToLog, verdict, guide, mapContext }
}

// Classify a logged food against the map for storage + flagging.
// Tolerates a missing/partial map (observation mode) and knows about
// eliminated foods (QA 2026-10-28 #1/#4: a crash on absent mapContext killed
// every tracking-mode log, and mid-elimination trigger foods landed as
// clean "unknown" rows that the recall/health readers trusted).
export function classifyFood(foodName, mapContext) {
  const ctx = mapContext || EMPTY_MAP_CONTEXT
  const lower = foodName.toLowerCase()
  const hits = (list) => (list || []).some(f => f && (lower.includes(f.toLowerCase()) || f.toLowerCase().includes(lower)))
  if (hits(ctx.avoid)) return { mapStatus: 'avoid' }
  if (hits(ctx.limit)) return { mapStatus: 'limit' }
  if (hits(ctx.safe)) return { mapStatus: 'safe' }
  if (hits(ctx.notYetTested)) return { mapStatus: 'eliminated' }
  return { mapStatus: 'unknown' }
}

// Persist a meal log. `source: 'recall'` marks entries typed from memory on a
// symptom night: kept forever as leads, never weighed like prospective logs.
// Returns { saved } so the UI never claims "Added to today's log" over a
// failed insert (QA 2026-10-28 #2, the write-first family).
export async function saveMealLog({ userId, rawText, foods, mapContext, source }) {
  const classified = foods.map(name => ({ name, ...classifyFood(name, mapContext), ...(source ? { source } : {}) }))
  const flagged = classified.some(f => f.mapStatus === 'avoid' || f.mapStatus === 'limit' || f.mapStatus === 'eliminated')
  let saved = false
  try {
    const { error } = await supabase.from('meal_logs').insert({
      user_id: userId,
      raw_text: rawText,
      foods: classified,
      flagged,
    })
    saved = !error
  } catch (e) { saved = false }
  return { classified, flagged, saved }
}

// Persist a chat message — checked, with one quiet retry (history is context
// for future pattern-noticing, so a lost message is a real loss).
export async function saveMessage({ userId, role, content }) {
  try {
    const { error } = await supabase.from('ask_sensify_messages').insert({ user_id: userId, role, content })
    if (!error) return true
    const { error: e2 } = await supabase.from('ask_sensify_messages').insert({ user_id: userId, role, content })
    return !e2
  } catch (e) { return false }
}

// Load recent chat history — the LATEST messages (QA 2026-10-28 minor: oldest
// 30 ascending meant "View earlier conversation" showed week-one chat forever).
export async function loadHistory(userId, limit = 30) {
  try {
    const { data } = await supabase
      .from('ask_sensify_messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data || []).reverse()
  } catch (e) {
    return []
  }
}
