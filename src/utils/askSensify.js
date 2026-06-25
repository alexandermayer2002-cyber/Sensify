// Ask Sensify — core assistant logic.
// Builds the Food Map context + system prompt, sends to the AI proxy,
// and returns a structured response (reply text + any foods to log).

import { aiCall } from './aiClient'
import { supabase } from '../supabase'

// Format the user's Food Map + lab results into compact context for the model.
// The key insight: most foods are fine. The lab flags a small suspect list.
// Of those, some are confirmed via reintroduction (Safe/Limit/Avoid) and some
// are still being tested. Everything NOT flagged by the lab is fine to eat.
export function buildFoodMapContext(foodMap, labFoods = []) {
  const safe = foodMap.filter(f => f.verdict === 'Safe').map(f => f.food)
  const limit = foodMap.filter(f => f.verdict === 'Limit').map(f => f.food)
  const avoid = foodMap.filter(f => f.verdict === 'Avoid').map(f => f.food)

  // Lab-flagged foods that don't yet have a verdict = still eliminated, treat as AVOID for now
  const verdictedNames = new Set(foodMap.map(f => (f.food || '').toLowerCase()))
  const flagged = labFoods.filter(f => ['High', 'Moderate', 'Low'].includes(f.level))
  const notYetTested = flagged
    .filter(f => !verdictedNames.has((f.name || '').toLowerCase()))
    .map(f => f.name)
  const labClean = labFoods.filter(f => f.level === 'No sensitivity').map(f => f.name)

  return {
    safe, limit, avoid, notYetTested, labClean,
    text: `The user is in a food sensitivity protocol. Their lab flagged a specific list of foods as showing some sensitivity. Those flagged foods are eliminated and tested one at a time through reintroduction. Everything the lab did NOT flag was never a concern and is fine to eat.

CONFIRMED SAFE (reintroduced and tolerated, eat freely): ${safe.join(', ') || 'none yet'}
CONFIRMED LIMIT (reintroduced, fine in small amounts only): ${limit.join(', ') || 'none yet'}
CONFIRMED AVOID (reintroduced, confirmed trigger, do not eat): ${avoid.join(', ') || 'none yet'}
FLAGGED BUT NOT YET TESTED (showed sensitivity on the lab, not yet reintroduced): ${notYetTested.join(', ') || 'none'}
LAB CAME BACK CLEAN (never flagged, safe to eat): ${labClean.join(', ') || 'not specified'}

CRITICAL RULES:
1. FLAGGED BUT NOT YET TESTED foods must be treated as AVOID for now. They showed sensitivity and have not been cleared through reintroduction, so the user should not eat them yet. Tell them it is still being eliminated and they will test it later in the protocol.
2. CONFIRMED foods follow their verdict exactly (Safe, Limit, or Avoid).
3. Any food NOT in the lists above was never flagged by the lab and is fine to eat normally. Do not treat unlisted foods as unknown or risky.
4. So the only foods that are fine to eat are: the Confirmed Safe list, the Lab Clean list, and anything not mentioned at all. Everything on the Avoid, Limit, and Not Yet Tested lists requires caution, with Avoid and Not Yet Tested meaning do not eat.`,
  }
}

const SYSTEM_PROMPT = `You are Ask Sensify, a food assistant inside the Sensify wellness app. The user has completed a food sensitivity program and has a personal Food Map sorting foods into Safe, Limit, and Avoid.

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
  - verdict = your overall call. SAFE if nothing is a concern, LIMIT if it involves a Limit food, HOLD if it involves a flagged-but-not-yet-tested food (still in elimination), AVOID if it involves a confirmed Avoid food.
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

// Observation mode: for users who declined the protocol and are self-tracking.
// They have NO Food Map and NO confirmed verdicts, so the assistant must never
// claim a food is a trigger or safe-for-them. It helps them log and reflect.
const OBSERVATION_PROMPT = `You are Ask Sensify, a food companion inside the Sensify wellness app. This user has NOT completed a testing protocol. They are self-tracking their meals and symptoms to look for patterns over time. They do NOT have a Food Map, and no foods have been confirmed as triggers or safe for them.

YOUR JOB:
1. Help them log what they eat. When they describe a meal, acknowledge it warmly and log it.
2. Help them notice patterns over time by reflecting back what they have told you (e.g. "you have mentioned bloating after dairy a couple of times now, that might be worth watching").
3. Answer general food questions with normal, common-sense nutrition knowledge.

CRITICAL — WHAT YOU MUST NOT DO:
- You have NO Food Map for this user. NEVER tell them a food is "safe for you" or "a trigger for you" or give them a verdict. You do not have the data to know that, and claiming it would be wrong and potentially harmful.
- Never say "you can eat this" or "avoid this" as if it is confirmed for them. Instead, speak in terms of what is worth watching or noticing.
- If they ask "can I eat X," do not give a verdict. Explain you are not testing foods for them right now, but you can help them notice how they feel after eating it, and that if they want real answers they can start the full protocol anytime.
- Do not invent patterns. Only reflect back what they have actually logged. If there is not enough data yet, say so honestly ("we do not have enough logged yet to see a pattern, keep tracking").

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

export async function askSensify({ userMessage, foodMap, labFoods = [], history = [], observationMode = false }) {
  if (observationMode) {
    // Tracking user: no Food Map, observation-only behavior.
    const messages = [
      { role: 'user', content: OBSERVATION_PROMPT },
      { role: 'assistant', content: 'Understood. I will help them log meals and notice patterns over time, and I will never give a verdict or claim a food is safe or a trigger for them, since they have no Food Map.' },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ]
    const raw = await aiCall(messages, 600, 'ask')
    let reply = raw
    let foodsToLog = []
    const logMatch = raw.match(/\[\[LOG:\s*([^\]]+)\]\]/i)
    if (logMatch) {
      foodsToLog = logMatch[1].split(',').map(s => s.trim()).filter(Boolean)
      reply = reply.replace(/\[\[LOG:[^\]]+\]\]/i, '').trim()
    }
    return { reply, foodsToLog, verdict: null, guide: null }
  }

  const mapContext = buildFoodMapContext(foodMap, labFoods)

  const messages = [
    { role: 'user', content: `${SYSTEM_PROMPT}\n\nTHE USER'S FOOD MAP:\n${mapContext.text}` },
    { role: 'assistant', content: 'Understood. I have their Food Map and will help with food decisions, flag Limit and Avoid foods, stay conservative when unsure, and log meals they describe eating.' },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const raw = await aiCall(messages, 600, 'ask')

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

// Classify a logged food against the map for storage + flagging
export function classifyFood(foodName, mapContext) {
  const lower = foodName.toLowerCase()
  if (mapContext.avoid.some(f => lower.includes(f.toLowerCase()) || f.toLowerCase().includes(lower))) return { mapStatus: 'avoid' }
  if (mapContext.limit.some(f => lower.includes(f.toLowerCase()) || f.toLowerCase().includes(lower))) return { mapStatus: 'limit' }
  if (mapContext.safe.some(f => lower.includes(f.toLowerCase()) || f.toLowerCase().includes(lower))) return { mapStatus: 'safe' }
  return { mapStatus: 'unknown' }
}

// Persist a meal log
export async function saveMealLog({ userId, rawText, foods, mapContext }) {
  const classified = foods.map(name => ({ name, ...classifyFood(name, mapContext) }))
  const flagged = classified.some(f => f.mapStatus === 'avoid' || f.mapStatus === 'limit')
  try {
    await supabase.from('meal_logs').insert({
      user_id: userId,
      raw_text: rawText,
      foods: classified,
      flagged,
    })
  } catch (e) {}
  return { classified, flagged }
}

// Persist a chat message
export async function saveMessage({ userId, role, content }) {
  try {
    await supabase.from('ask_sensify_messages').insert({ user_id: userId, role, content })
  } catch (e) {}
}

// Load recent chat history
export async function loadHistory(userId, limit = 30) {
  try {
    const { data } = await supabase
      .from('ask_sensify_messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit)
    return data || []
  } catch (e) {
    return []
  }
}
