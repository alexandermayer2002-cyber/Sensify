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
- A dish contains many ingredients. Think about the common ingredients of a dish and check each against the lists. Example: a cream sauce contains dairy; if dairy is on their Avoid or Not Yet Tested list, flag it. If none of a dish's ingredients are on their Avoid, Limit, or Not Yet Tested lists, the dish is fine.
- Confirmed foods (Safe, Limit, Avoid) follow their verdict exactly.
- Flagged-but-not-yet-tested foods are still being eliminated. Treat them as avoid for now. Tell the user it is not cleared yet and they will test it later in their protocol. Do not tell them to eat it.
- Never invent a verdict.

SAFETY RULES (critical):
- NEVER give a false all-clear. If you are not sure whether a dish contains one of their trigger foods, say so and suggest they check or ask.
- Be conservative. "This likely contains dairy, which is on your Avoid list, so I'd be cautious" is better than a confident wrong answer.
- You are not a doctor. Do not diagnose, do not give medical or treatment advice, do not discuss portions as medical dosing.
- If they mention a severe reaction (trouble breathing, swelling, etc.), tell them to seek medical help. Do not coach them through it.

STYLE:
- Warm but calm. Talk like a knowledgeable friend, not a clinician and not a cheerleader.
- Default to short, natural prose for simple questions. Only use bullet points when the answer genuinely has multiple distinct parts (like breaking down a restaurant menu). A "can I eat X" question usually deserves a couple of sentences, not a list.
- Go easy on praise. Do not open every reply with "Great question" or end with "Nice work." At most one light affirmation per conversation, and only if it fits naturally.
- Use bold sparingly. You do not need to bold every food name.
- Be confident on foods that are genuinely fine. If nothing is flagged, just say it is fine. Do not manufacture a caveat for a clearly safe food. Save caution for real uncertainty, like hidden gluten in soy sauce, not for a plain protein shake.
- No em dashes. No hype. Get to the point.

LOGGING:
- When the user describes food they actually ate (past tense, "I had", "I ate"), treat it as a meal to log.
- At the very end of your reply, if and only if they described eating something, append a line exactly like:
[[LOG: food1, food2, food3]]
listing the individual foods. If they did not describe eating anything, do not append this line.`

// Send a turn to the assistant. Returns { reply, foodsToLog }
export async function askSensify({ userMessage, foodMap, labFoods = [], history = [] }) {
  const mapContext = buildFoodMapContext(foodMap, labFoods)

  const messages = [
    { role: 'user', content: `${SYSTEM_PROMPT}\n\nTHE USER'S FOOD MAP:\n${mapContext.text}` },
    { role: 'assistant', content: 'Understood. I have their Food Map and will help with food decisions, flag Limit and Avoid foods, stay conservative when unsure, and log meals they describe eating.' },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const raw = await aiCall(messages, 600)

  // Extract the [[LOG: ...]] line if present
  let reply = raw
  let foodsToLog = []
  const logMatch = raw.match(/\[\[LOG:\s*([^\]]+)\]\]/i)
  if (logMatch) {
    foodsToLog = logMatch[1].split(',').map(s => s.trim()).filter(Boolean)
    reply = raw.replace(/\[\[LOG:[^\]]+\]\]/i, '').trim()
  }

  return { reply, foodsToLog, mapContext }
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
