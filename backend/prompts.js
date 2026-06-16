/**
 * @typedef {{ competitorName: string, primaryResponse: object }} AgentRoundResponse
 *
 * @typedef {{
 *   competitorName: string,
 *   competitorType: string,
 *   finalPrimaryResponse: object,
 *   finalAlternativeResponse: object,
 *   confidenceScore: number,
 *   dataPointsDriving: string[]
 * }} FinalResponse
 */

const COMPETITOR_TYPE_LABELS = {
  low_cost_challenger: 'Low-cost Challenger',
  incumbent_leader:    'Incumbent / Market Leader',
  premium_brand:       'Premium Brand',
  regional_player:     'Regional / Niche Player',
  fast_follower:       'Fast Follower',
  disruptor:           'Disruptor / New Entrant',
};

/**
 * Builds the system prompt for a competitor agent, embedding the full v2 scored profile
 * (Awareness / Motivation / Capability + Predicted Reaction Profile + relative firepower).
 *
 * @param {object} profile - Output of buildCompetitorProfileV2()
 * @param {{ industryLabel?: string, companyType?: string, companyTypeLabel?: string, marketGeography?: string, marketOverview?: string }} scenarioContext
 * @returns {string}
 */
export function buildCompetitorSystemPrompt(profile, scenarioContext = {}) {
  const {
    name,
    ebitdaMargin,
    revenueGrowthRate,
    cashPosition,
    debtToEbitda,
    responseCapacityScore,
    motivationScore,
    awarenessScore,
    relativeFirepowerRatio,
    relativeLabel,
    strategicIntentVector,
    predictedReactionProfile,
    stakesSummary,
    reactionPatternSummary,
    constraintSummary,
    signalSummary,
    geographicFocus,
    competitorType,
    ceoPriorityStatement,
  } = profile;

  const {
    industryLabel = '',
    companyTypeLabel = '',
    marketGeography = '',
    marketOverview = '',
    yourCompanyProfile = null,
  } = scenarioContext;

  const capacityInterpretation =
    responseCapacityScore >= 70
      ? 'high — can sustain aggressive or prolonged competitive moves'
      : responseCapacityScore >= 40
      ? 'moderate — selective responses only; cannot sustain prolonged price wars'
      : 'low — constrained to defensive or low-cost responses only';

  const motivationInterpretation =
    motivationScore >= 65
      ? 'high — this move directly threatens what matters to you, you are inclined to respond forcefully'
      : motivationScore >= 40
      ? 'moderate — this move is worth watching and may warrant a measured response'
      : 'low — this move is not a priority threat; you would rather hold position';

  const awarenessInterpretation =
    awarenessScore >= 80
      ? 'very visible — you will notice and attribute this move immediately'
      : awarenessScore >= 55
      ? 'moderately visible — you will likely notice this within normal market monitoring'
      : 'low visibility — you may not notice or attribute this move quickly';

  // Strategic Intent Vector v2: four independent 0-100 scores (not normalized to 100%)
  const intentLabels = {
    growthMaximizer: 'Growth Maximizer (prioritizes volume and share above margin)',
    marginDefender: 'Margin Defender (protects profitability; resists price erosion)',
    nichePlayer: 'Niche Player (focuses on specific segments; avoids broad battles)',
    innovationBetter: 'Innovation / Better Product (competes on features, not price)',
  };

  const sortedIntent = Object.entries(strategicIntentVector)
    .sort(([, a], [, b]) => b - a)
    .map(([dimension, score]) => `  - ${intentLabels[dimension] ?? dimension}: ${score}/100`)
    .join('\n');

  const myTypeLabel = COMPETITOR_TYPE_LABELS[competitorType] ?? '';
  const contextLines = [
    industryLabel    && `- Industry: ${industryLabel}`,
    myTypeLabel      && `- Your Role in This Market: ${myTypeLabel}`,
    geographicFocus  && `- Your Geographic Footprint: ${geographicFocus}`,
    marketGeography  && `- Overall Market Geography: ${marketGeography}`,
    companyTypeLabel && `- Triggering Company's Role: ${companyTypeLabel} (this shapes how seriously you take their move)`,
    marketOverview   && `- Market Overview: ${marketOverview}`,
  ].filter(Boolean);

  const industryContextBlock = contextLines.length > 0
    ? `INDUSTRY CONTEXT:\n${contextLines.join('\n')}\n\n`
    : '';

  const relativeFirepowerLine = relativeLabel
    ? `RELATIVE POSITION: You are ${relativeLabel} the company making this move (your response capacity: ${responseCapacityScore}/100 vs. theirs — ratio ${relativeFirepowerRatio}).`
    : '';

  const reactionProfileLines = predictedReactionProfile
    ? `PREDICTED REACTION PROFILE (your most likely posture toward this specific move):
- Likelihood you respond at all: ${predictedReactionProfile.responseLikelihood}%
- Likely speed: ${predictedReactionProfile.responseSpeed}
- Likely intensity: ${predictedReactionProfile.responseIntensity}/100
- Most plausible approaches: ${predictedReactionProfile.likelyResponseVectors.join('; ')}
(This is a planning signal, not a script — use your judgment, but your actual response should be broadly consistent with this profile unless your constraints or strategic priorities argue otherwise.)`
    : '';

  // Build what this competitor knows about the triggering company's financial strength
  const opponentBlock = (yourCompanyProfile && yourCompanyProfile.ebitdaMargin > 0)
    ? `TRIGGERING COMPANY — WHAT YOU KNOW FROM PUBLIC FILINGS:
- ${yourCompanyProfile.name}: Revenue growth ${yourCompanyProfile.revenueGrowthRate}% YoY, EBITDA margin ${yourCompanyProfile.ebitdaMargin}%, ${yourCompanyProfile.cashPosition} cash position, Debt-to-EBITDA ${yourCompanyProfile.debtToEbitda}x
- Financial capacity: ${yourCompanyProfile.responseCapacityScore}/100 — factor this into how long they can sustain this move
- ${yourCompanyProfile.constraintSummary}
`
    : '';

  return `You are the Chief Strategy Officer of ${name}. You make competitive decisions based on your company's actual data and constraints.

SIMULATION BOUNDARY — STRICT: You are operating in a closed simulation. The ONLY facts you know about this company and its competitors are those explicitly stated in this prompt. Do not draw on any training data about companies that may share these names. If a data point was not provided above, it does not exist in this simulation and must not be used.

---
${industryContextBlock}${opponentBlock}COMPANY FINANCIALS:
- EBITDA Margin: ${ebitdaMargin}% | Revenue Growth: ${revenueGrowthRate}% YoY
- Cash Position: ${cashPosition} | Debt-to-EBITDA: ${debtToEbitda}x

COMPETITIVE SCORES:
- Response Capacity Score: ${responseCapacityScore}/100 → ${capacityInterpretation}
- Motivation to Respond: ${motivationScore}/100 → ${motivationInterpretation}
- Awareness: ${awarenessScore}/100 → ${awarenessInterpretation}
${relativeFirepowerLine}

STRATEGIC INTENT (each dimension scored independently — you can be high on more than one):
${sortedIntent}

CEO STRATEGIC PRIORITY: "${ceoPriorityStatement}"
(This is the verbatim stated priority of your leadership. Your response must be consistent with this mandate.)

WHY THIS MOVE MATTERS TO YOU: ${stakesSummary}

${reactionProfileLines}

REACTION PATTERN: ${reactionPatternSummary}
CONSTRAINTS: ${constraintSummary}
RECENT INTELLIGENCE: ${signalSummary}
---

When responding to a competitive trigger, you MUST:
1. Ground your response in your response capacity — you cannot spend or cut beyond what your capacity allows
2. Weigh how much this specific move actually threatens you (your stakes/exposure) — do not react as hard to a move that barely touches your business as to one that hits your core
3. Act consistently with your strategic priorities — a margin defender does not suddenly become a price warrior
4. Consider your constraints — they are real limits, not suggestions
5. Reference specific real numbers (margins, growth rates, debt levels) when explaining your decision

LANGUAGE RULES — these are strict:
- Write rationale as a business executive speaking to their board, not as an analyst citing a model
- Never use scoring jargon: no "intent vector", "aggression index", "capacity score", "response capacity score", "motivation score", "awareness score", "strategic weight", "stakes score", "Growth Maximizer", "Margin Defender", "predicted reaction profile", "relative firepower"
- If you reference being more or less exposed than a rival, say it in plain business terms (e.g. "this move barely touches our core business" or "this hits nearly half our revenue base") — never cite the underlying percentage label as a score
- ALWAYS include the actual numbers — but embed them in plain English sentences
  - Good: "We grew revenue 18.5% last year, so protecting that momentum matters more than margin right now"
  - Bad: "Growth Maximizer intent at 55.6% dominates our response calculus"
  - Bad: "Our strong cash position gives us flexibility" (no number — useless)
  - Good: "With only 1.8x debt-to-EBITDA and strong cash reserves, we can absorb a price investment without financial strain"
- The numbers build credibility — never drop them, just frame them in plain English
- dataPointsDriving items must be plain facts with real numbers: e.g. "Revenue up 18.5% last year — we have momentum to protect", "Margins at 12.3% — thin enough that a price war would hurt us", "400 new sales reps hired in Q4 — we have the feet on the street to act fast"
- watchSignal must be a concrete observable event with a clear threshold: "If [specific measurable thing] happens, we would [specific change to response]"

Respond ONLY with valid JSON in this exact shape:
{
  "primaryResponse": {
    "type": "price_cut"|"price_hold"|"price_increase"|"bundle_add"|"marketing_surge"|"niche_pivot"|"alliance"|"no_response",
    "magnitude": number (0-30, percentage change or intensity 0-10 for non-price),
    "timing": "immediate"|"within_30_days"|"within_quarter"|"wait_and_see",
    "rationale": string (2-3 plain-English sentences explaining why, using real numbers not score names)
  },
  "alternativeResponse": { same shape, the second most likely move },
  "keyAssumption": string (one plain-English sentence: "We are assuming that...")
  "confidenceScore": number (0-100),
  "dataPointsDriving": string[] (exactly 3 items — plain facts with real numbers, no score terminology),
  "watchSignal": string ("If [observable event], we would [change our response]")
}
No markdown, no explanation outside the JSON.`;
}

/**
 * Builds the user message for rounds 2 and 3 of a simulation, including competitor round-1 moves.
 *
 * @param {string} triggerEvent - Description of the competitive trigger
 * @param {object} profile - Output of buildCompetitorProfile() for this agent
 * @param {AgentRoundResponse[]} otherAgentsResponses - Round-1 responses from all other competitors
 * @param {{ industryLabel?: string, marketGeography?: string }} scenarioContext
 * @returns {string}
 */
export function buildCompetitorRoundPrompt(triggerEvent, profile, otherAgentsResponses, scenarioContext = {}) {
  const competitorMoves = otherAgentsResponses
    .map(({ competitorName, primaryResponse }) => {
      const { type, magnitude, timing } = primaryResponse;
      return `  - ${competitorName}: ${type} | magnitude ${magnitude} | ${timing}`;
    })
    .join('\n');

  const { industryLabel = '', marketGeography = '' } = scenarioContext;
  const { geographicFocus = '' } = profile;
  const contextRecall = [industryLabel, marketGeography || geographicFocus].filter(Boolean).join(' | ');
  const recallLine = contextRecall ? `Market context: ${contextRecall}\n\n` : '';

  return `TRIGGER EVENT: ${triggerEvent}

${recallLine}MARKET UPDATE — your competitors have made the following moves:
${competitorMoves}

Given these market dynamics now unfolding, reconsider your position.
Does your round-1 response change? If so, explain why using your profile data.
If not, explain why you are holding your position.
Respond in the same JSON format.`;
}

/**
 * Builds the user message for the orchestrator agent to synthesize all competitor final responses.
 *
 * @param {string} triggerEvent - Description of the competitive trigger
 * @param {FinalResponse[]} allFinalResponses - Final responses from all competitor agents
 * @param {{ name: string, strategicMove: string, context?: string }} yourCompanyContext - The player's company and move
 * @param {{ industryLabel?: string, companyTypeLabel?: string, marketGeography?: string, marketOverview?: string }} scenarioContext
 * @returns {string}
 */
export function buildOrchestratorPrompt(triggerEvent, allFinalResponses, yourCompanyProfile, scenarioContext = {}) {
  const {
    industryLabel = '',
    companyTypeLabel = '',
    marketGeography = '',
    marketOverview = '',
  } = scenarioContext;

  const scenarioLines = [
    industryLabel    && `- Industry: ${industryLabel}`,
    companyTypeLabel && `- Your Company's Market Role: ${companyTypeLabel}`,
    marketGeography  && `- Market Geography: ${marketGeography}`,
    marketOverview   && `- Market Overview: ${marketOverview}`,
  ].filter(Boolean);

  const scenarioBlock = scenarioLines.length > 0
    ? `\nSCENARIO CONTEXT:\n${scenarioLines.join('\n')}\n`
    : '';

  const competitorSummaries = allFinalResponses
    .map(({
      competitorName,
      competitorType,
      finalPrimaryResponse,
      finalAlternativeResponse,
      confidenceScore,
      dataPointsDriving,
      responseCapacityScore,
      relativeLabel,
      predictedReactionProfile,
    }) => {
      const typeLabel = COMPETITOR_TYPE_LABELS[competitorType] ?? '';
      const relativeLine = relativeLabel
        ? `    Relative strength vs. your company: ${relativeLabel} (their response capacity: ${responseCapacityScore}/100)`
        : '';
      const reactionLine = predictedReactionProfile
        ? `    Predicted reaction profile: ${predictedReactionProfile.responseLikelihood}% likely to respond, ${predictedReactionProfile.responseSpeed} speed, intensity ${predictedReactionProfile.responseIntensity}/100`
        : '';
      return [
        `  ${competitorName}:${typeLabel ? ` [${typeLabel}]` : ''}`,
        relativeLine,
        reactionLine,
        `    Primary: ${finalPrimaryResponse.type} | magnitude ${finalPrimaryResponse.magnitude} | ${finalPrimaryResponse.timing}`,
        `    Rationale: ${finalPrimaryResponse.rationale}`,
        `    Alternative: ${finalAlternativeResponse.type} | magnitude ${finalAlternativeResponse.magnitude} | ${finalAlternativeResponse.timing}`,
        `    Confidence: ${confidenceScore}/100`,
        `    Key data points: ${dataPointsDriving.join(' | ')}`,
      ].filter(Boolean).join('\n');
    })
    .join('\n\n');

  // Build yourCompany financial block — mirrors competitor rendering style
  const ycHasFinancials = yourCompanyProfile.ebitdaMargin > 0 || yourCompanyProfile.revenueGrowthRate !== 0;
  const ycCapacityInterp = yourCompanyProfile.responseCapacityScore >= 70
    ? 'high — can sustain aggressive or prolonged competitive moves'
    : yourCompanyProfile.responseCapacityScore >= 40
    ? 'moderate — selective; cannot sustain prolonged price wars'
    : 'low — constrained to defensive or low-cost responses only';

  // v2: intent dimensions are independent 0–100 scores, not normalized fractions
  const ycIntentSorted = Object.entries(yourCompanyProfile.strategicIntentVector ?? {})
    .sort(([,a],[,b]) => b - a)
    .map(([dim, score]) => {
      const labels = { growthMaximizer: 'Growth Maximizer', marginDefender: 'Margin Defender', nichePlayer: 'Niche Player', innovationBetter: 'Innovation / Premium' };
      return `  ${labels[dim] ?? dim}: ${score}/100`;
    }).join('\n');

  const ycFinancialBlock = ycHasFinancials ? `
YOUR COMPANY FINANCIAL PROFILE:
- Revenue Growth: ${yourCompanyProfile.revenueGrowthRate}% YoY | EBITDA Margin: ${yourCompanyProfile.ebitdaMargin}%
- Cash Position: ${yourCompanyProfile.cashPosition} | Debt-to-EBITDA: ${yourCompanyProfile.debtToEbitda}x
- Financial Capacity: ${yourCompanyProfile.responseCapacityScore}/100 → ${ycCapacityInterp}
- Strategic Intent:\n${ycIntentSorted}
${yourCompanyProfile.ceoPriorityStatement ? `- CEO Priority: "${yourCompanyProfile.ceoPriorityStatement}"` : ''}
- Execution Constraints: ${yourCompanyProfile.constraintSummary}
` : '';

  return `TRIGGER EVENT: ${triggerEvent}

YOUR COMPANY: ${yourCompanyProfile.name}${companyTypeLabel ? ` [${companyTypeLabel}]` : ''}
YOUR STRATEGIC MOVE: ${yourCompanyProfile.strategicMove ?? ''}${yourCompanyProfile.context ? `\nYOUR STRATEGIC CONTEXT: ${yourCompanyProfile.context}` : ''}
${ycFinancialBlock}${scenarioBlock}
COMPETITOR FINAL RESPONSES:
${competitorSummaries}

Your audience is a senior executive or board member who has 60 seconds to read this. Write everything in plain, direct English.

STRICT LANGUAGE RULES:
- Write for a senior executive who has 60 seconds and wants to know what to do and why
- No scoring jargon: no "strategic intent vector", "capacity score", "response capacity score", "predicted reaction profile", "relative firepower", "ARPU compression", "Growth Maximizer"
- When describing relative strength, translate it into plain business terms (e.g. "they have less than a third of your scale" or "they are financially outmatched") — never cite an internal ratio or label directly
- ALWAYS include actual numbers — they are what makes the analysis credible and trustworthy
  - Good: "ValueNet grew 18.5% last year and just hired 400 sales reps — they will move fast"
  - Bad: "Given ValueNet's high growth trajectory and capacity investment..." (vague, no numbers)
  - Good: "RegionalPlus carries 4.2x debt and has weak cash — they simply cannot afford to cut prices"
  - Bad: "RegionalPlus faces significant financial constraints limiting their response options"
- Numbers + plain English together = credibility. Never one without the other.
- Be direct and opinionated — say "do X by [date]" not "consider whether X might be appropriate"
- For betterAlternative: set to null if the current move is already the right call given the competitive dynamics — do NOT manufacture an alternative just to have one. Only populate it when a genuinely different move would produce a materially better outcome.
- For player outcomes: 1-2 plain sentences about what actually happens and why, with a number or fact to anchor it
- For financialEstimate: anchor every number to the company's actual input revenue or margin. If revenue is $35.3B and you estimate a 2–4% decline, show the dollar range (~$700M–$1.4B). Never invent round numbers unconnected to the inputs. Omit the field entirely if the input financials are insufficient to support a credible range — a missing field is better than a fabricated one.
- For scenarios: describe what a customer, salesperson, or CFO would actually see and experience
- For watchlist signals: "Watch for [specific observable thing] — if it happens, it means [plain implication with a number if possible] and you should [concrete action]"
- For key risks: "Risk: [what could go wrong, with numbers] → [plain consequence]"

Synthesize these competitive dynamics and respond ONLY with valid JSON in this exact shape:
{
  "decisionBrief": {
    "recommendedDecision": string (ONE sentence — the single clearest thing to do, written as a direct instruction, e.g. "Proceed with the 15% price cut and lock in multi-year contracts before ValueNet responds."),
    "confidenceLevel": "High" | "Medium" | "Low",
    "confidenceRationale": string (ONE sentence grounded in the data — why confidence is high/medium/low, e.g. "Two of three competitors lack the cash to respond aggressively within this quarter."),
    "primaryReason": string (ONE sentence — the single biggest reason for the recommendation, with a real number, e.g. "ValueNet carries 4.2x debt and cannot sustain a price war for more than 60 days."),
    "biggestWatchout": string (ONE sentence — the one risk most likely to change the outcome, e.g. "If PremiumConnect drops price >10% within 30 days, margin erosion will outpace the share gains."),
    "decisionGate": string (ONE sentence — a measurable, observable trigger that would cause a course change, e.g. "If any competitor announces a price response exceeding 8% within the first 30 days, revisit the magnitude of this move."),
    "executiveSummary": string (2-3 sentences. Plain English for a CXO with no prior context. What is happening, what is the recommended response, and what is the key thing to watch. No jargon. No hedging. Write it like a CFO briefing a board.)
  },
  "marketEquilibrium": string (2-3 plain sentences: paint a picture of what the market looks like 90 days from now after all these moves play out — what does a customer or salesperson actually see?),
  "playerOutcomes": {
    "yourCompany": { "outcome": "wins"|"neutral"|"loses", "reasoning": string (1-2 plain sentences about what actually happens to this company), "financialEstimate": string (ONE sentence with a specific range anchored to actual input financials — e.g. "Estimated 3–5% revenue uplift (~$X–$Y based on $Z revenue base) from [cause] over [timeframe]". Omit if inputs are insufficient.) },
    "[competitorName for each competitor]": { "outcome": "wins"|"neutral"|"loses", "reasoning": string (1-2 plain sentences), "financialEstimate": string (same format — anchor to this competitor's actual input financials, omit if insufficient) }
  },
  "strategicRecommendation": string (3-5 clear sentences. Start with the single most important thing to do NOW. Then the second priority. Be specific about timing and why. Write like you are the most trusted advisor in the room.),
  "priorityActions": string[] (exactly 2–3 items — the specific actions the player must take, in priority order. Each item is ONE sentence. Format: "Do [specific action] by [specific timing] — [one-sentence rationale with a real number]." Example: "Lock in 24-month subscriber contracts in the top 5 metro markets within the next 3 weeks — PremiumConnect has 31.5% EBITDA margin and will launch a counter-bundle within one quarter." Do NOT pad to reach 3 items — write 2 if that is the right answer.),
  "betterAlternative": null | {
    "move": string (a clear, specific move in plain English — not a category name),
    "reasoning": string (why this beats the current plan — use plain cause-and-effect),
    "expectedOutcome": string (what concretely happens if they do this)
  },
  "confidenceBands": {
    "bestCase": { "description": string (what success actually looks like — specific outcomes, not abstractions), "conditions": string (2-3 concrete things that would need to be true) },
    "likelyCase": { "description": string (the realistic outcome most people should plan for), "conditions": string },
    "worstCase": { "description": string (what a bad outcome actually looks like), "conditions": string }
  },
  "keyRisks": string[] (max 4, each written as "Risk: [what could go wrong] → [plain consequence]"),
  "watchlistSignals": string[] (max 5, each written as "Watch for [specific observable thing] — if it happens, [plain implication and action]"),
  "monitoringPlan": {
    "next30Days": array of 2–4 objects — the most urgent signals to monitor in the first 30 days post-decision,
    "next60Days": array of 2–4 objects — medium-term signals to track between days 30–60,
    "next90Days": array of 2–4 objects — longer-term strategic signals to monitor between days 60–90
  },
  Each monitoring item has this shape: {
    "signal": string (3–7 word label — what to watch for, e.g. "Competitor price cut announcement"),
    "whyItMatters": string (ONE sentence — the business consequence if this signal fires),
    "metric": string (the specific observable metric, e.g. "Shelf price scan data at top-10 grocery accounts"),
    "threshold": string (quantitative trigger wherever possible, e.g. ">5% price reduction" or "2+ consecutive weeks of volume decline >3%"),
    "ownerFunction": "Strategy" | "Finance" | "Sales" | "Marketing" | "Pricing" | "Competitive Intelligence" | "Revenue Growth Management" | "Other",
    "actionIfTriggered": string (ONE sentence — the specific action to take if this signal fires)
  },
  "recommendationChangeTriggers": array of 3–6 objects — the market signals that would cause the recommendation to change. Each object: {
    "trigger": string (short noun phrase describing the event — e.g. "Private label shelf space expands at top grocery accounts"),
    "metricToMonitor": string (the specific, observable metric — e.g. "Private label CSD facings at top-5 grocery chains"),
    "threshold": string (the measurable level that constitutes the trigger — e.g. ">2 point shelf-space increase" or ">10% price cut announcement". Use a quantitative threshold wherever possible; use a clearly stated qualitative signal only if no meaningful number exists),
    "timeWindow": string (the monitoring window — e.g. "Next 60–90 days" or "Within Q2 2023"),
    "recommendationImpact": string (ONE sentence — what specifically changes in the recommendation if this trigger fires, e.g. "Shift from broad price increase to targeted value-pack defense in price-sensitive channels"),
    "urgency": "High" | "Medium" | "Low"
  },
  "strategicOptions": array of 3–5 objects comparing the main strategic paths available. ALWAYS include the current proposed strategy as one option. Include at least one safer/lower-risk alternative and one more aggressive/higher-upside alternative. Each object: {
    "optionName": string (3–6 word label, e.g. "Proceed as Planned", "Deeper Price Cut", "Bundle Instead of Cut", "Hold Pricing, Increase Marketing"),
    "description": string (ONE sentence — what the company would actually do),
    "revenueUpside": string (estimated revenue impact range anchored to input financials — e.g. "+$1.2–2.4B over 12 months" or "+3–5% net revenue". Use a percentage range if no revenue figure was provided. NEVER return "High", "Medium", or "Low".),
    "volumeRisk": string (estimated volume impact if the downside materialises — e.g. "2–4% volume decline" or "~500K–1M subscriber loss". Use directional range with units. NEVER return "High", "Medium", or "Low".),
    "competitorRisk": "High" | "Medium" | "Low",
    "retailerOrCustomerRisk": "High" | "Medium" | "Low",
    "implementationComplexity": "High" | "Medium" | "Low",
    "overallAssessment": "Preferred" | "Viable" | "Risky" | "Not Recommended",
    "rationale": string (ONE sentence — why this assessment, grounded in the competitive dynamics)
  },
  "assumptionsUsed": array of 5–8 objects, each: {
    "assumption": string (short label — what is being assumed, e.g. "Competitor price response timing"),
    "value": string (the actual value assumed — use a range if uncertain, e.g. "Within 30–60 days" or "15–20% discount" or "Stable, no major shifts"),
    "sourceType": "User Input" | "Model Inference" | "Default",
    "confidence": "High" | "Medium" | "Low",
    "impactIfWrong": string (ONE sentence — what specifically changes in the recommendation if this assumption proves wrong)
  },
  "evidenceClassification": {
    "marketEquilibrium": tag,
    "strategicRecommendation": tag,
    "betterAlternative": tag | null,
    "priorityActions": tag[] (one tag per action, same order),
    "keyRisks": tag[] (one tag per risk, same order),
    "watchlistSignals": tag[] (one tag per signal, same order),
    "playerOutcomes": { "[each player key exactly as in playerOutcomes]": tag },
    "confidenceBands": { "bestCase": tag, "likelyCase": tag, "worstCase": tag },
    "decisionBrief": {
      "recommendedDecision": tag,
      "primaryReason": tag,
      "biggestWatchout": tag,
      "decisionGate": tag
    }
  }
}
No markdown, no explanation outside the JSON.

ASSUMPTIONS RULES — follow these exactly:
- Include 5–8 assumptions only. Do not pad with trivial ones.
- Choose only the assumptions that most directly drive the recommendation. If an assumption changed, would the recommendation change? If no, exclude it.
- "assumption" must be a short noun phrase (3–6 words), not a sentence.
- "value" must be the concrete value assumed. Use a range if uncertain (e.g. "2–4 weeks", "10–20%"). Use plain qualitative language if no number is available (e.g. "No major regulatory action expected"). Never use vague words like "normal" or "standard".
- "sourceType": "User Input" if the user explicitly provided this; "Model Inference" if the model derived or inferred it from the inputs; "Default" if it is a generic planning assumption not grounded in the inputs.
- "confidence": "High" only if grounded in explicit input data; "Medium" if plausible but uncertain; "Low" if speculative or highly variable.
- "impactIfWrong": one sentence — what specifically changes in the recommendation, not just "the analysis changes". Be concrete: "If [X] instead, then [specific consequence to the recommended action]."
- Do not fabricate external data. If no source exists, use "Model Inference" or "Default".

EVIDENCE CLASSIFICATION RULES — follow these exactly:
- tag must be one of: "Known Fact" | "Assumption" | "Model Inference" | "User Input" | "Derived Calculation"
- "Known Fact": only use when the claim is directly supported by specific numbers or facts from the competitor input data (revenue, margin, debt, headcount, pricing history). Never use this for forward-looking predictions.
- "User Input": use when the claim directly restates or applies what the user explicitly provided (their strategic move, their company context, their stated goals).
- "Assumption": use for planning conditions that are plausible but not guaranteed — market conditions, competitor intent, timing.
- "Model Inference": use for all forward-looking predictions, synthesized conclusions, and AI-generated judgments about what will happen. This is the default when in doubt.
- "Derived Calculation": use only when a claim is explicitly computed from input numbers (e.g., revenue impact anchored to stated revenue base, ratio comparisons between stated financials).
- If you are uncertain, default to "Model Inference". Never use "Known Fact" for anything you inferred or predicted.`;
}
