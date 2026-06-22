// Ask Sensify — core assistant logic.
// Builds the Food Map context + system prompt, sends to the AI proxy,
// and returns a structured response (reply text + any foods to log).

import { aiCall } from './aiClient'
import { supabase } from '../supabase'

// Format the user's Food Map into compact context for the model
export function buildFoodMapContext(foodMap) {
  const safe = foodMap.filter(f => f.verdict === 'Safe').map(f => f.food)
  const limit = foodMap.filter(f => f.verdict === 'Limit').map(f => f.food)
  const avoid = foodMap.filter(f => f.verdict === 'Avoid').map(f => f.food)
  return {
    safe,
    limit,
    avoid,
    text: `SAFE (tolerated, eat freely): ${safe.join(', ') || 'none recorded'}
LIMIT (small amounts only): ${limit.join(', ') || 'none recorded'}
AVOID (confirmed triggers): ${avoid.join(', ') || 'none recorded'}`,
  }
}

const SYSTEM_PROMPT = `You are Ask Sensify, a food assistant inside the Sensify wellness app. The user has completed a food sensitivity program and has a personal Food Map sorting foods into Safe, Limit, and Avoid.

YOUR JOB:
1. Answer "can I eat this?" questions by checking foods against their Food Map.
2. When the user describes a meal they ate, acknowledge it and note anything on their Limit or Avoid list.
3. Answer general questions about navigating food given their map (e.g. "what's safe at an Italian restaurant?").

HOW TO REASON ABOUT FOODS:
- A dish contains many ingredients. Think about the common ingredients of a dish and check each against the map. Example: a cream sauce contains dairy; if dairy is Avoid, flag it.
- If a food is directly on their map, use that verdict.
- If a food is NOT on their map, say so plainly. Do not invent a verdict.

SAFETY RULES (critical):
- NEVER give a false all-clear. If you are not sure whether a dish contains one of their trigger foods, say so and suggest they check or ask.
- Be conservative. "This likely contains dairy, which is on your Avoid list, so I'd be cautious" is better than a confident wrong answer.
- You are not a doctor. Do not diagnose, do not give medical or treatment advice, do not discuss portions as medical dosing.
- If they mention a severe reaction (trouble breathing, swelling, etc.), tell them to seek medical help. Do not coach them through it.

STYLE:
- Warm, brief, plain language. Talk like a knowledgeable friend, not a clinician.
- No em dashes. No hype. Get to the point.

LOGGING:
- When the user describes food they actually ate (past tense, "I had", "I ate"), treat it as a meal to log.
- At the very end of your reply, if and only if they described eating something, append a line exactly like:
[[LOG: food1, food2, food3]]
listing the individual foods. If they did not describe eating anything, do not append this line.`

// Send a turn to the assistant. Returns { reply, foodsToLog }
export async function askSensify({ userMessage, foodMap, history = [] }) {
  const mapContext = buildFoodMapContext(foodMap)

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
