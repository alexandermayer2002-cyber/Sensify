const ANTHROPIC_API_KEY = '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'

const callClaude = async (prompt, maxTokens = 200) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text.trim()
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

  const prompt = `You are the AI health coach inside Sensify, a food sensitivity wellness program. Write a Day 1 activation message for a new program participant.

USER:
- Name: ${name}
- Symptom focus: ${symptoms}
- High sensitivity foods to eliminate: ${highFoods}
- Moderate sensitivity foods to eliminate: ${moderateFoods}
- Low sensitivity foods to eliminate: ${lowFoods}
- Total foods being eliminated: ${totalFoods}

Write a 3-4 sentence Day 1 message. Rules:
- Reference their specific flagged foods by name
- Acknowledge week 1 is an adjustment period — some feel worse before better
- Tell them what to focus on this week (full compliance, nothing else)
- Confident, warm, specific — not generic
- Do NOT mention texts, replies, or daily check-ins via SMS
- Do NOT start with "Welcome" or "Congratulations"
- Sound like a smart health coach who knows their case

Write only the message. No labels.`

  return callClaude(prompt, 250)
}

// DAY 3 — Early check-in
export const generateDay3Message = async ({ name, profile, labResult }) => {
  const topFood = labResult?.foods?.find(f => {
    const freq = profile?.food_frequency?.[f.name]
    return freq === 'daily' || freq === '3-5x'
  })?.name || labResult?.foods?.[0]?.name || 'your flagged foods'
  const symptoms = formatSymptoms(profile?.symptoms)

  const prompt = `You are the AI health coach inside Sensify. Write a Day 3 check-in message for a program participant.

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

  const prompt = `You are the AI health coach inside Sensify. Write a Day 14 milestone message.

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

  const prompt = `You are the AI health coach inside Sensify. Write a Day 28 one-month progress summary.

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
  const prompt = `You are the AI health coach inside Sensify. Write a slip-up acknowledgment message.

USER:
- Name: ${name}
- Food they slipped on: ${food}
- Sensitivity level of that food: ${sensitivityLevel || 'flagged'}
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
  const lowFoods = labResult?.foods
    ?.filter(f => f.level === 'Low')
    ?.filter(f => {
      const freq = profile?.food_frequency?.[f.name]
      return freq && freq !== 'never' && freq !== 'rarely'
    })
    ?.map(f => f.name) || []

  const symptoms = formatSymptoms(profile?.symptoms)
  const bloatingImprovement = profile?.baseline_bloating
    ? 'tracked throughout elimination'
    : 'not yet recorded'

  const prompt = `You are the AI health coach inside Sensify. Write a Day 57 reintroduction unlock message.

USER:
- Name: ${name}
- Symptom focus: ${symptoms}
- Low sensitivity foods now available to test: ${lowFoods.join(', ') || 'none in this tier'}
- They just completed 8 weeks of elimination

Write 3-4 sentences. Rules:
- Celebrate completing 8 weeks — this is a real milestone
- Name their specific Low sensitivity foods that are now available
- Explain the reintroduction cycle briefly — one food at a time, 14 days per food
- Tell them to go to the Reintro tab to choose their first food
- Confident and celebratory but not over the top
- Do NOT mention texts or SMS
- Do NOT say "Congratulations" as the opening word

Write only the message. No labels.`

  return callClaude(prompt, 250)
}

// REINTRODUCTION FOOD BRIEFING
export const generateReintroFoodBriefing = async ({ name, food, sensitivityLevel, profile }) => {
  const symptoms = formatSymptoms(profile?.symptoms)
  const hasDigestive = profile?.symptoms?.includes('Digestive')
  const hasEnergy = profile?.symptoms?.includes('Energy')

  const prompt = `You are the AI health coach inside Sensify. Write a food briefing for a reintroduction cycle.

USER:
- Name: ${name}
- Food being tested: ${food}
- Sensitivity level: ${sensitivityLevel}
- Symptom focus: ${symptoms}
- Tracks digestive symptoms: ${hasDigestive}
- Tracks energy symptoms: ${hasEnergy}

Write 3-4 sentences. Rules:
- Brief them specifically on testing ${food}
- Tell them what symptoms to watch for during exposure days (days 1-3) — specific to their symptom focus
- Tell them what to watch for during washout (days 4-14)
- One practical tip for the exposure phase
- Do NOT mention texts or SMS
- Specific to the actual food — not generic reintroduction advice

Write only the message. No labels.`

  return callClaude(prompt, 200)
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

  const prompt = `You are the AI health coach inside Sensify. Write a Moderate tier unlock message for day 113.

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

  const prompt = `You are the AI health coach inside Sensify. Write a High sensitivity tier unlock message for day 169.

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

  const prompt = `You are the AI health coach inside Sensify. Write the program completion Food Map reveal message.

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
    return data?.shown_milestones?.includes(milestoneKey) || false
  } catch (e) {
    return false
  }
}

export const markMilestoneShown = async (supabase, userId, milestoneKey) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('shown_milestones')
      .eq('id', userId)
      .single()
    const current = data?.shown_milestones || []
    if (!current.includes(milestoneKey)) {
      await supabase.from('profiles').update({
        shown_milestones: [...current, milestoneKey]
      }).eq('id', userId)
    }
  } catch (e) {}
}
