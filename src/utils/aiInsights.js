import { aiPrompt } from './aiClient'
import { getTestingOrder } from './protocolEngine'

const stripDashes = (text = '') => text
  // Numeric ranges like "1-3" or "4 – 14" become "1 to 3" (not a comma)
  .replace(/(\d)\s*[—–-]\s*(\d)/g, '$1 to $2')
  // Sentence dashes (space-dash-space) become commas
  .replace(/\s+[—–]\s+/g, ', ')
  .replace(/\s+-\s+/g, ', ')
  // Any stray em/en dash left becomes a comma
  .replace(/[—–]/g, ', ')

const callClaude = async (prompt, maxTokens = 200) => {
  const raw = await aiPrompt(prompt, maxTokens)
  return stripDashes(raw)
}

const formatFoods = (foods = [], level = null) => {
  const filtered = level ? foods.filter(f => f.level === level) : foods
  return filtered.map(f => f.name).join(', ') || 'none'
}

const formatSymptoms = (symptoms = []) => symptoms.join(', ') || 'general wellness'

// DAY 1 — Protocol activation
export const generateDay1Message = async ({ name, profile, labResult }) => {
  const highFoods = formatFoods(labResult?.foods, 'High')
  const moderateFoods = formatFoods(labResult?.foods, 'Moderate')
  const lowFoods = formatFoods(labResult?.foods, 'Low')
  const totalFoods = labResult?.foods?.length || 0
  const symptoms = formatSymptoms(profile?.symptoms)

  const prompt = `You are the analysis engine inside Sensify, a food sensitivity wellness program. Write a Day 1 activation message for a new program participant. If the eliminated foods are Common trigger foods, this person is on the common-triggers protocol: they are eliminating those CHOSEN foods, not their lab-flagged foods. Never describe a lab food as being eliminated unless it appears in an eliminate list.

USER:
- Name: ${name}
- Symptom focus: ${symptoms}
- Common trigger foods to eliminate (chosen protocol, not lab-flagged): ${formatFoods(labResult?.foods, 'Common')}
- High sensitivity foods to eliminate: ${highFoods}
- Moderate sensitivity foods to eliminate: ${moderateFoods}
- Low sensitivity foods to eliminate: ${lowFoods}
- Total foods being eliminated: ${totalFoods}

Write the Day 1 briefing in EXACTLY this structure, three sections, each introduced by its header on its own line, nothing before the first header:
WHAT CHANGES TODAY:
(1-2 sentences naming their specific eliminated foods and what leaves the plate today)
HOW THIS WEEK MAY FEEL:
(1-2 sentences; week 1 is an adjustment, some feel worse before better, that is normal and informative)
YOUR ONE JOB:
(1 sentence; full compliance this week, nothing else matters yet)

Rules:
- Reference their specific foods by name in the first section
- Direct, specific, calm. Not a cheerleader, not a coach
- Do NOT mention texts, replies, or daily check-ins via SMS
- Do NOT start with "Welcome" or "Congratulations"
- Voice: a sharp analyst who knows their case. Never use cheerleader phrases like momentum, journey, or wins
- Never use em dashes or hyphens as punctuation. Use commas or periods instead
- Keep the three headers EXACTLY as written above, uppercase with the colon

Write only the briefing. Nothing outside the three sections.`

  return callClaude(prompt, 250)
}

// DAY 3 — Early check-in
export const generateDay3Message = async ({ name, profile, labResult }) => {
  const topFood = labResult?.foods?.find(f => {
    const freq = profile?.food_frequency?.[f.name]
    return freq === 'daily' || freq === '3-5x'
  })?.name || labResult?.foods?.[0]?.name || 'your flagged foods'
  const symptoms = formatSymptoms(profile?.symptoms)

  const prompt = `You are the analysis engine inside Sensify. Write a Day 3 check-in message for a program participant.

USER:
- Name: ${name}
- Symptom focus: ${symptoms}
- Most frequently eaten flagged food: ${topFood}

Write 2-3 sentences acknowledging day 3. Rules:
- Acknowledge cravings are normal at this point
- Reference their most frequently eaten flagged food specifically
- Tell them cravings peak around day 5 and fade
- Warm and grounding, not generic
- Do NOT mention texts, SMS, or daily replies
- Do NOT say "Great job" or "Well done"

Write only the message. No labels.`

  return callClaude(prompt, 150)
}

// DAY 14 — Two week milestone
export const generateDay14Message = async ({ name, profile, checkins }) => {
  const week1 = checkins?.find(c => c.week_number === 1)
  const week2 = checkins?.find(c => c.week_number === 2)
  const symptoms = formatSymptoms(profile?.symptoms)

  const hasData = week1 && week2
  const bloatingW1 = week1?.answers?.bloating
  const bloatingW2 = week2?.answers?.bloating
  const energyW1 = week1?.answers?.energy
  const energyW2 = week2?.answers?.energy
  const bloatingChange = bloatingW1 && bloatingW2 ? Math.round(((bloatingW1 - bloatingW2) / bloatingW1) * 100) : null
  const energyChange = energyW1 && energyW2 ? Math.round(((energyW2 - energyW1) / energyW1) * 100) : null

  const prompt = `You are the analysis engine inside Sensify. Write a Day 14 milestone message.

USER:
- Name: ${name}
- Symptom focus: ${symptoms}
- Baseline bloating: ${profile?.baseline_bloating || 'not recorded'}/10
- Week 1 bloating: ${bloatingW1 || 'not yet recorded'}/10
- Week 2 bloating: ${bloatingW2 || 'not yet recorded'}/10
- Bloating change: ${bloatingChange !== null ? `${bloatingChange > 0 ? '-' : '+'}${Math.abs(bloatingChange)}%` : 'no data yet'}
- Baseline energy: ${profile?.baseline_energy || 'not recorded'}/10
- Week 1 energy: ${energyW1 || 'not yet recorded'}/10
- Week 2 energy: ${energyW2 || 'not yet recorded'}/10
- Energy change: ${energyChange !== null ? `${energyChange > 0 ? '+' : ''}${energyChange}%` : 'no data yet'}

Write 2-3 sentences. Rules:
- Reference specific numbers if available
- If improvement: acknowledge it specifically
- If no improvement yet: normalize it — week 3 and 4 is when the signal gets clearer
- Do NOT mention texts or SMS
- Specific and grounded, not generic praise

Write only the message. No labels.`

  return callClaude(prompt, 200)
}

// DAY 28 — One month progress summary
export const generateDay28Message = async ({ name, profile, checkins }) => {
  const symptoms = formatSymptoms(profile?.symptoms)
  const checkinSummary = checkins?.slice(0, 4).map((c, i) =>
    `Week ${c.week_number}: bloating ${c.answers?.bloating || '—'}, energy ${c.answers?.energy || '—'}, compliance ${c.answers?.compliance || '—'}`
  ).join('\n') || 'No check-ins yet'

  const latest = checkins?.[0]
  const bloatingImprovement = profile?.baseline_bloating && latest?.answers?.bloating
    ? Math.round(((profile.baseline_bloating - latest.answers.bloating) / profile.baseline_bloating) * 100)
    : null
  const energyImprovement = profile?.baseline_energy && latest?.answers?.energy
    ? Math.round(((latest.answers.energy - profile.baseline_energy) / profile.baseline_energy) * 100)
    : null

  const prompt = `You are the analysis engine inside Sensify. Write a Day 28 one-month progress summary.

USER:
- Name: ${name}
- Symptom focus: ${symptoms}
- Baseline bloating: ${profile?.baseline_bloating || '—'}/10
- Baseline energy: ${profile?.baseline_energy || '—'}/10
- Latest bloating: ${latest?.answers?.bloating || '—'}/10
- Latest energy: ${latest?.answers?.energy || '—'}/10
- Bloating improvement: ${bloatingImprovement !== null ? `${bloatingImprovement}%` : 'insufficient data'}
- Energy improvement: ${energyImprovement !== null ? `${energyImprovement}%` : 'insufficient data'}
- Four week summary:
${checkinSummary}
- Days until reintroduction: 28

Write 4-5 sentences. Rules:
- Reference specific numbers and percentage improvements
- Identify the clearest trend from their data
- Connect compliance to outcomes explicitly if pattern exists
- Tell them what the next 4 weeks look like
- Mention reintroduction unlocks in 28 days
- Do NOT mention texts or SMS
- Analytical and specific — this is the most data-rich insight

Write only the message. No labels.`

  return callClaude(prompt, 300)
}

// SLIP-UP ACKNOWLEDGMENT
export const generateSlipupMessage = async ({ name, food, sensitivityLevel, currentDay }) => {
  const prompt = `You are the analysis engine inside Sensify. Write a slip-up acknowledgment message.

USER:
- Name: ${name}
- Food they slipped on: ${food}
- Sensitivity level of that food: ${sensitivityLevel === 'Common' ? 'a common trigger food from their chosen protocol, not lab-flagged' : (sensitivityLevel || 'flagged')}
- Current day of program: ${currentDay}

Write 2-3 sentences. Rules:
- Reference the specific food they slipped on
- Explain what one exposure means for their timeline — brief delay not a reset
- Tell them what to watch for in the next 48-72 hours symptom-wise
- Non-judgmental, practical, forward-looking
- Do NOT mention texts or SMS
- Do NOT say "It's okay" or use dismissive language

Write only the message. No labels.`

  return callClaude(prompt, 150)
}

// DAY 57 — Reintroduction unlocks
export const generateDay57Message = async ({ name, profile, labResult }) => {
  // ONE frequency-ordered queue (the doctrine): every non-never food unlocks
  // at day 57, ordered by how often the user eats it. No tier language.
  const queue = getTestingOrder(
    (labResult?.foods || []).filter(f => {
      const freq = profile?.food_frequency?.[f.name]
      return freq !== 'never'
    }),
    profile?.food_frequency
  ).map(f => f.name)

  const symptoms = formatSymptoms(profile?.symptoms)

  const prompt = `You are the analysis engine inside Sensify. Write a Day 57 reintroduction unlock message.

USER:
- Name: ${name}
- Symptom focus: ${symptoms}
- All their foods are now available to test, in this order (ranked by how often they eat each one, most-eaten first): ${queue.join(', ') || 'none recorded'}
- They just completed 8 weeks of elimination

Write 3-4 sentences. Rules:
- Celebrate completing 8 weeks, this is a real milestone
- Explain the reintroduction cycle briefly: one food at a time, 14 days per food
- Tell them to go to the Reintro tab to choose their first food
- Name the first food in the list and say "we suggest starting with [food]" or similar, and say WHY: it ranks highest in how often they eat it
- They can follow the suggested order or pick any food themselves
- NEVER mention sensitivity tiers, Low/Moderate/High groups, or anything unlocking later. Everything is available now.
- Confident and celebratory but not over the top
- Do NOT use markdown formatting like **bold** or *italic*, plain text only
- Do NOT mention texts or SMS
- Do NOT say "Congratulations" as the opening word

Write only the message. No labels.`

  return callClaude(prompt, 250)
}

// REINTRODUCTION FOOD BRIEFING
export const generateReintroFoodBriefing = async ({ name, food, sensitivityLevel, profile, symptomPattern }) => {
  const symptoms = formatSymptoms(profile?.symptoms)
  const hasDigestive = profile?.symptoms?.includes('Digestive')
  const hasEnergy = profile?.symptoms?.includes('Energy')

  const isHigh = sensitivityLevel === 'High'

  const prompt = `You are the analysis engine inside Sensify. Write a food briefing for a reintroduction cycle.

USER:
- Name: ${name}
- Food being tested: ${food}
- Sensitivity level: ${sensitivityLevel}
- Symptom focus: ${symptoms}
- Tracks digestive symptoms: ${hasDigestive}
- Tracks energy symptoms: ${hasEnergy}

Output EXACTLY three sections separated by these literal delimiters on their own lines: [WATCH] then the watch-for text, [TIP] then the tip text, [SAFETY] then the safety text. No other headers, no preamble.

${symptomPattern ? `Their elimination-era symptom pattern: ${symptomPattern}. Aim the [WATCH] section at it.\n` : ''}
Rules:
- [WATCH]: two sentences max. What symptoms to observe on exposure days, specific to their symptom focus, plus that timing matters (right after eating vs building later). Frame as OBSERVE and LOG, never predictions. Say "watch for" and "note whether", never "you will feel"
- [TIP]: one sentence. One practical tip for the exposure phase
- [SAFETY]: one sentence listing the stop-immediately symptoms (difficulty breathing, throat tightening, swelling, hives, vomiting) and to seek medical care
- Do NOT brief the washout period, the app handles day-by-day washout guidance itself
- Weight the safety language more strongly for a ${sensitivityLevel} sensitivity food${isHigh ? ' (High sensitivity: make the safety section unmissable)' : ''}
- Do not diagnose, do not predict outcomes, do not give dosage or medical instructions beyond observing and logging
- Do NOT mention texts or SMS
- Specific to the actual food, not generic reintroduction advice
- No em dashes or hyphens as punctuation

CRITICAL: Never state, suggest, or imply a serving size, portion, quantity, or amount to eat (no cups, grams, pieces, "a small portion", "build gradually", etc). Do not give a titration or ramp up schedule. The protocol itself dictates portions, not you. If you mention eating the food, refer only to "your normal serving" without specifying any amount.

Do NOT use markdown formatting like **bold** or *italic* — plain text only.
Write only the message. No labels.`

  return callClaude(prompt, 220)
}

// MODERATE TIER UNLOCK — Day 113
export const generateModerateUnlockMessage = async ({ name, profile, labResult }) => {
  const moderateFoods = labResult?.foods
    ?.filter(f => f.level === 'Moderate')
    ?.filter(f => {
      const freq = profile?.food_frequency?.[f.name]
      return freq && freq !== 'never' && freq !== 'rarely'
    })
    ?.map(f => f.name) || []

  const prompt = `You are the analysis engine inside Sensify. Write a Moderate tier unlock message for day 113.

USER:
- Name: ${name}
- Moderate sensitivity foods now available: ${moderateFoods.join(', ') || 'none in this tier'}

Write 2-3 sentences. Rules:
- Acknowledge the milestone — month 4
- Name their specific Moderate foods now available
- Note these are more likely to cause reactions than Low foods — pay closer attention
- Same protocol: one food, 14 days, verdict
- Do NOT mention texts or SMS

Write only the message. No labels.`

  return callClaude(prompt, 150)
}

// HIGH TIER UNLOCK — Day 169
export const generateHighUnlockMessage = async ({ name, profile, labResult }) => {
  const highFoods = labResult?.foods
    ?.filter(f => f.level === 'High')
    ?.filter(f => {
      const freq = profile?.food_frequency?.[f.name]
      return freq && freq !== 'never' && freq !== 'rarely'
    })
    ?.map(f => f.name) || []

  const prompt = `You are the analysis engine inside Sensify. Write a High sensitivity tier unlock message for day 169.

USER:
- Name: ${name}
- High sensitivity foods now available to test: ${highFoods.join(', ') || 'none in this tier'}

Write 2-3 sentences. Rules:
- Acknowledge this is the final tier — month 6
- Name their specific High foods now available
- Set expectations — High sensitivity foods are most likely to cause clear reactions, which is actually useful data
- They're close to their complete Food Map
- Do NOT mention texts or SMS

Write only the message. No labels.`

  return callClaude(prompt, 150)
}

// PROGRAM COMPLETE — Food Map reveal
export const generateProgramCompleteMessage = async ({ name, profile, labResult, foodMap, checkins }) => {
  const safeFoods = foodMap?.filter(f => f.verdict === 'Safe').map(f => f.food) || []
  const limitFoods = foodMap?.filter(f => f.verdict === 'Limit').map(f => f.food) || []
  const avoidFoods = foodMap?.filter(f => f.verdict === 'Avoid').map(f => f.food) || []
  const symptoms = formatSymptoms(profile?.symptoms)

  const latest = checkins?.[0]
  const bloatingImprovement = profile?.baseline_bloating && latest?.answers?.bloating
    ? Math.round(((profile.baseline_bloating - latest.answers.bloating) / profile.baseline_bloating) * 100)
    : null
  const energyImprovement = profile?.baseline_energy && latest?.answers?.energy
    ? Math.round(((latest.answers.energy - profile.baseline_energy) / profile.baseline_energy) * 100)
    : null

  const prompt = `You are the analysis engine inside Sensify. Write the program completion Food Map reveal message.

USER:
- Name: ${name}
- Symptom focus: ${symptoms}
- Baseline bloating: ${profile?.baseline_bloating || '—'}/10
- Latest bloating: ${latest?.answers?.bloating || '—'}/10
- Bloating improvement: ${bloatingImprovement !== null ? `${bloatingImprovement}%` : 'not tracked'}
- Baseline energy: ${profile?.baseline_energy || '—'}/10
- Latest energy: ${latest?.answers?.energy || '—'}/10
- Energy improvement: ${energyImprovement !== null ? `${energyImprovement}%` : 'not tracked'}
- Safe foods: ${safeFoods.join(', ') || 'none confirmed'}
- Limit foods: ${limitFoods.join(', ') || 'none'}
- Avoid foods: ${avoidFoods.join(', ') || 'none confirmed'}
- Total foods tested: ${foodMap?.length || 0}

Write 4-5 sentences. Rules:
- Open with the time frame — six months
- Reference their specific improvement numbers
- Name their confirmed triggers from Avoid list
- Name their safe foods
- End with something personal about what this means for them going forward
- This is the emotional payoff of the entire program — make it feel earned and personal
- Do NOT mention texts or SMS
- Specific, warm, narrative — not clinical

Write only the message. No labels.`

  return callClaude(prompt, 350)
}

// CHECK IF A MILESTONE MESSAGE HAS ALREADY BEEN SENT
export const checkMilestoneShown = async (supabase, userId, milestoneKey) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('shown_milestones')
      .eq('id', userId)
      .single()
    const v = data?.shown_milestones
    // Object is the canonical shape ({ day1: true, day1_text: '...' });
    // arrays are legacy rows from before the formats were unified.
    return Array.isArray(v) ? v.includes(milestoneKey) : !!(v && v[milestoneKey])
  } catch (e) {
    return false
  }
}

// Canonical shape for profiles.shown_milestones: an OBJECT whose keys are
// milestone flags (true) or stored values (day1_text). Legacy array rows
// are converted on first write. Two writers previously used two shapes
// (array here, object on the test-taken card), each clobbering the other.
export const normalizeMilestones = (v) => {
  // The DB column only accepts JSON ARRAYS (confirmed live: object writes 400
  // with "expected JSON array"), so the array IS the storage format, encoded
  // as ["flag", "key:value", ...]. This decodes to an object for reading.
  if (Array.isArray(v)) {
    const out = {}
    for (const item of v) {
      if (typeof item !== 'string') continue
      const i = item.indexOf(':')
      if (i === -1) out[item] = true
      else out[item.slice(0, i)] = item.slice(i + 1)
    }
    return out
  }
  return v || {}
}

// The inverse: object -> the array shape the column accepts.
export const serializeMilestones = (obj) => {
  const out = []
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === true) out.push(k)
    else if (typeof v === 'string' && v.length > 0) out.push(k + ':' + v)
    // false/null/undefined are dropped: absence is the off state
  }
  return out
}

export const markMilestoneShown = async (supabase, userId, milestoneKey) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('shown_milestones')
      .eq('id', userId)
      .single()
    const current = normalizeMilestones(data?.shown_milestones)
    if (!current[milestoneKey]) {
      await supabase.from('profiles').update({
        shown_milestones: serializeMilestones({ ...current, [milestoneKey]: true })
      }).eq('id', userId)
    }
  } catch (e) {}
}

// ── REINTRODUCTION VERDICT ──────────────────────────────────
// The provisional verdict comes from the rule engine (verdictEngine.js)
// based on logged daily data. The AI may CONFIRM it, or adjust by ONE
// level with a stated reason. It never overrides the data wholesale.
// Returns { verdict, analysis }.
// SYMPTOM-NIGHT RECALL PARSE: free text -> canonical foods, hidden forms
// named. Returns [{ name, from }] or [] on any failure; the raw text is
// stored regardless, so a failed parse loses nothing.
export const parseRecallFoods = async (rawText) => {
  try {
    const prompt = `Extract the distinct foods and food ingredients from this meal description, including hidden forms (teriyaki or soy sauce contains wheat; parmesan is dairy; mayo contains egg). One per line, format: Canonical food | the phrase it came from. Canonical food should be the simple base food name (Wheat, Dairy, Eggs, Coffee, Tomato, Beef...). No other text.

MEAL: "${String(rawText).slice(0, 400)}"`
    const raw = await callClaude(prompt, 220)
    return raw.split('\n').map(l => {
      const [name, from] = l.split('|').map(s => (s || '').trim())
      return name && name.length < 40 ? { name, from: from || name } : null
    }).filter(Boolean).slice(0, 10)
  } catch (e) { return [] }
}

export const generateReintroVerdict = async ({ name, food, provisionalVerdict, signals, dailyLogs = [], surveyAnswers = {}, accuracyNote, contextNote, dayGrainContext, disagreeDetail, doses }) => {
  const exposureSummary = dailyLogs
    .filter(l => l.phase === 'exposure')
    .map(l => `Day(ate:${l.ate_food ? 'yes' : 'no'}, symptoms:${(l.symptoms || []).map(s => typeof s === 'string' ? s : `${s?.name || 'symptom'}/${s?.intensity || 'logged'}`).join(',') || 'none'})`)
    .join(' ')
  const washoutSummary = dailyLogs
    .filter(l => l.phase === 'washout')
    .map(l => (l.symptoms || []).map(s => typeof s === 'string' ? s : `${s?.name || 'symptom'}/${s?.intensity || 'logged'}`).join(',') || 'none')
    .join(' | ')

  const prompt = `You are the analysis engine inside Sensify reviewing a completed food reintroduction.

FOOD: ${food}
PROVISIONAL VERDICT (computed from logged data by a rule engine): ${provisionalVerdict}
LOGGED EXPOSURE DAYS: ${exposureSummary || 'no daily logs'}
LOGGED WASHOUT SYMPTOMS: ${washoutSummary || 'none logged'}
SIGNALS: ${JSON.stringify(signals || {})}
${doses && Object.keys(doses).length > 0 ? `EXPOSURE SERVING SIZES (user-reported per day): ${Object.entries(doses).map(([d, p]) => `${d}: ${p}`).join(', ')}. If the verdict is Limit, cite the serving pattern when it is informative (reactions only at large servings is a different Limit than reactions at every size). Never invent amounts beyond small/normal/large.` : ''}
USER CONFIRMED ACCURACY: ${accuracyNote === 'accurate' ? 'says the logged data is accurate' : accuracyNote === 'worse' ? 'says it actually felt WORSE than logged' : accuracyNote === 'milder' ? 'says it actually felt MILDER than logged' : 'no response'}
${disagreeDetail ? `DISAGREEMENT DETAIL (asked only because the testimony disputes the logs):
- What they felt: ${[...(disagreeDetail.felt || []), disagreeDetail.feltText].filter(Boolean).join(', ') || 'not specified'}
- When it was strongest: ${disagreeDetail.when === 'exposure' ? 'on the days they ate the food' : disagreeDetail.when === 'washout' ? 'in the washout days after' : 'spread across the whole two weeks'}
- Their own attribution: ${disagreeDetail.cause === 'food' ? 'they think it was the food' : disagreeDetail.cause === 'unsure' ? 'they are not sure what caused it' : 'they think it was probably something else, not the food'}
WEIGHING THE DISAGREEMENT:
- Testimony concentrated on exposure days and attributed to the food is the strongest case for moving one level away from Safe; cite those specifics in the analysis.
- Testimony spread evenly across the whole two weeks fits a background cause at least as well as the food; say so, and lean toward the logged data.
- If they attribute it to something else themselves, keep the data verdict and name their context as context, never as the cause of a shift.
- Still never move more than one level, and name the gap between logs and testimony honestly in the analysis.
` : ''}${dayGrainContext ? dayGrainContext + '\n' : ''}USER NOTED CONTEXT (other things going on, may explain symptoms): ${contextNote ? `"${contextNote}"` : 'none noted'}

YOUR TASK:
Decide the final verdict: Safe, Limit, or Avoid. Then write a 2 to 3 sentence explanation.

CRITICAL RULES:
- The provisional verdict is based on real logged data. You may CONFIRM it, or move it by AT MOST one level (Safe<->Limit or Limit<->Avoid) and only if clearly justified. NEVER jump Safe<->Avoid.
- If a severe reaction was logged, the verdict is Avoid and cannot be changed.
- Weigh the logged data first. If the user said it felt worse or milder than logged, factor that in. If they noted an outside factor (illness, travel, stress) that could explain a symptom flare, you may discount that flare, which could move the verdict one level toward Safe.
- Explain in plain language what in their data drove the verdict. Do not reference "the user's belief about whether it's a trigger" since we did not ask that.
- Do NOT diagnose a medical condition. Do NOT give dosage, portion, or treatment instructions.
- Do NOT predict the future ("you will react"). Describe what their data showed.
- No em dashes or hyphens as punctuation. No coach language.

Respond in EXACTLY this format with no extra text:
VERDICT: <Safe|Limit|Avoid>
ANALYSIS: <2 to 3 sentences>`

  const raw = await callClaude(prompt, 260)
  const verdictMatch = raw.match(/VERDICT:\s*(Safe|Limit|Avoid)/i)
  const analysisMatch = raw.match(/ANALYSIS:\s*([\s\S]+)/i)
  return {
    verdict: verdictMatch ? verdictMatch[1].replace(/^\w/, c => c.toUpperCase()) : provisionalVerdict,
    analysis: analysisMatch ? stripDashes(analysisMatch[1].trim()) : '',
  }
}
