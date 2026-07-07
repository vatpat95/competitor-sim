/**
 * CompetitorSim v2 Profile Builder
 *
 * Builds a scored competitor profile from raw inputs using the v2 AMC framework
 * (Awareness, Motivation, Capability). This is the deterministic scoring engine.
 *
 * Main export: buildCompetitorProfileV2(rawInputs, yourCompany)
 * Returns a fully-scored profile with Predicted Reaction Profile output.
 */

import * as config from './scoringConfig.js';

// ── HELPER FUNCTIONS ──────────────────────────────────────────────────────

function clamp(lo, hi, x) {
  return Math.max(lo, Math.min(hi, x));
}

function round(x) {
  return Math.round(x * 10) / 10;
}

function average(arr) {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Extracts aggression keywords from text.
 * Counts terms and maps to rhetoric score (0, 40, or 80).
 */
function scoreRhetoric(text) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const count = config.AGGRESSION_KEYWORDS.filter(kw => lower.includes(kw)).length;
  if (count >= 2) return config.RHETORIC_THRESHOLDS.high;
  if (count === 1) return config.RHETORIC_THRESHOLDS.low;
  return config.RHETORIC_THRESHOLDS.none;
}

/**
 * Strategic Intent Vector v2 — Keyword fallback method.
 * Scores each of 4 dimensions independently 0–100.
 * Handles negation (roughly) and doesn't normalize to sum to 1.
 */
export function scoreStrategicIntentKeywordFallback(ceoPriorityStatement, recentNewsSignals) {
  const text = (ceoPriorityStatement || '') + ' ' + (recentNewsSignals || []).join(' ');
  const lower = text.toLowerCase();

  // Helper: count keywords, respecting simple negation
  function scoreIntent(keywords) {
    let score = 0;
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      const index = lower.indexOf(kwLower);
      if (index === -1) continue;

      // Simple negation check: look back up to NEGATION_LOOKAHEAD_WORDS words
      const beforeText = lower.substring(Math.max(0, index - 50), index);
      const wordsBeforeKeyword = beforeText.split(/\s+/).slice(-config.NEGATION_LOOKAHEAD_WORDS);
      const hasNegation = config.NEGATION_WORDS.some(neg => wordsBeforeKeyword.some(w => w.includes(neg)));

      if (!hasNegation) score += 25; // Each keyword adds 25 points; cap at 100
    }
    return clamp(0, 100, score);
  }

  const growthMaximizer = scoreIntent(config.GROWTH_KEYWORDS);
  const marginDefender = scoreIntent(config.MARGIN_KEYWORDS);
  const nichePlayer = scoreIntent(config.NICHE_KEYWORDS);
  const innovationBetter = scoreIntent(config.INNOVATION_KEYWORDS);

  return {
    growthMaximizer: round(growthMaximizer),
    marginDefender: round(marginDefender),
    nichePlayer: round(nichePlayer),
    innovationBetter: round(innovationBetter),
  };
}

/**
 * Calculates financial firepower (0–100) from financial inputs.
 */
function calcFinancialFirepower(cashPosition, debtToEbitda, ebitdaMargin) {
  const cashScore = config.CASH_SCORE_MAP[cashPosition] ?? config.CASH_SCORE_MAP.moderate;
  const debtScore = clamp(0, 100, 100 - debtToEbitda * config.DEBT_SCORE_MULTIPLIER);
  const marginScore = clamp(0, 100, ebitdaMargin * config.MARGIN_SCORE_MULTIPLIER);

  const firepower =
    config.FINANCIAL_FIREPOWER_WEIGHTS.cash * cashScore +
    config.FINANCIAL_FIREPOWER_WEIGHTS.debt * debtScore +
    config.FINANCIAL_FIREPOWER_WEIGHTS.margin * marginScore;

  return round(firepower);
}

/**
 * Calculates scale (0–100) from absolute annual revenue.
 * Log-scaled: $10M→0, $1B→50, $100B→100.
 */
function calcScale(annualRevenue) {
  if (annualRevenue === null || annualRevenue === undefined || annualRevenue === 0) {
    return 50; // Neutral default
  }
  const logRatio = (Math.log10(annualRevenue) - config.SCALE_LOG_OFFSET) / config.SCALE_LOG_DIVISOR;
  return round(clamp(0, 100, logRatio * 100));
}

/**
 * Calculates operational flexibility (0–100) from base level, headcount trend, and R&D spend.
 * rdSpendPct boosts ops for product_launch and market_entry moves only.
 */
function calcOperationalFlexibility(operationalFlexibility, headcountTrend, rdSpendPct, moveType) {
  const base = config.OPS_BASE_MAP[operationalFlexibility] ?? config.OPS_BASE_MAP.medium;
  const headcountAdj = config.OPS_ADJUSTMENT_BY_HEADCOUNT[headcountTrend] ?? 0;
  const rdBoost = config.RD_OPS_BOOST_MOVE_TYPES.has(moveType)
    ? clamp(0, config.RD_OPS_BOOST_MAX, (rdSpendPct ?? 0) * config.RD_OPS_BOOST_MULTIPLIER)
    : 0;
  return round(clamp(0, 100, base + headcountAdj + rdBoost));
}

/**
 * Calculates a real confidence score (40–100) based on how many optional fields were provided.
 */
function calcConfidence(rawInputs) {
  const populated = config.OPTIONAL_FIELDS_FOR_CONFIDENCE.filter(field => {
    const val = rawInputs[field];
    return val !== null && val !== undefined;
  }).length;
  const ratio = populated / config.OPTIONAL_FIELDS_FOR_CONFIDENCE.length;
  const { floor, ceiling } = config.CONFIDENCE_RANGE;
  return round(floor + ratio * (ceiling - floor));
}

/**
 * Applies industry modifiers to a weight object and re-normalizes so weights sum to 1.0.
 * @param {Object} baseWeights - {key: weight, ...}
 * @param {Object} modifiers   - {key: multiplier, ...} from INDUSTRY_WEIGHT_MODIFIERS
 * @param {string[]} keys      - which keys from modifiers apply to this weight group
 */
function applyIndustryModifiers(baseWeights, modifiers, keys) {
  const result = {};
  for (const k of keys) {
    result[k] = (baseWeights[k] ?? 0) * (modifiers[k] ?? 1.0);
  }
  const total = Object.values(result).reduce((a, b) => a + b, 0);
  if (total === 0) return baseWeights;
  for (const k of keys) result[k] = result[k] / total;
  return result;
}

/**
 * Calculates response capacity score (0–100).
 * Combines financial firepower, scale, and operational flexibility.
 * Weights are moveType-keyed and then adjusted by industry modifier.
 */
function calcResponseCapacity(cashPosition, debtToEbitda, ebitdaMargin, annualRevenue, operationalFlexibility, headcountTrend, moveType, industryKey, rdSpendPct) {
  const financialFirepower = calcFinancialFirepower(cashPosition, debtToEbitda, ebitdaMargin);
  const scale = calcScale(annualRevenue);
  const operationalFlex = calcOperationalFlexibility(operationalFlexibility, headcountTrend, rdSpendPct, moveType);

  const baseWeights = config.RESPONSE_CAPACITY_WEIGHTS_BY_MOVE_TYPE[moveType] ?? config.RESPONSE_CAPACITY_WEIGHTS_BY_MOVE_TYPE.other;
  const industryMod = config.INDUSTRY_WEIGHT_MODIFIERS[industryKey] ?? config.INDUSTRY_WEIGHT_MODIFIERS.other;
  const weights = applyIndustryModifiers(baseWeights, industryMod, ['financialFirepower', 'scale', 'operationalFlex']);

  const capacity =
    weights.financialFirepower * financialFirepower +
    weights.scale * scale +
    weights.operationalFlex * operationalFlex;

  return round(capacity);
}

/**
 * Calculates motivation score (0–100).
 * Combines stakes/exposure and behavioral disposition.
 * Weights are moveType-keyed and adjusted by industry modifier.
 */
function calcMotivation(exposureToMove, marketOverlapPct, moveType, lastThreePriceMoves, marketShareTrend, ceoPriorityStatement, recentNewsSignals, industryKey, revenueGrowthRate) {
  const industryMod = config.INDUSTRY_WEIGHT_MODIFIERS[industryKey] ?? config.INDUSTRY_WEIGHT_MODIFIERS.other;

  // Stakes (stakes/disposition split is moveType-keyed)
  const stakesScore =
    config.STAKES_SCORE_WEIGHTS.exposureToMove * exposureToMove +
    config.STAKES_SCORE_WEIGHTS.marketOverlapPct * marketOverlapPct;

  // Disposition: raw signals
  const priceMoves = (lastThreePriceMoves || []).filter(m => m.direction !== 'hold');
  const rawPriceReactivity = priceMoves.length > 0 ? clamp(0, 100, average(priceMoves.map(m => m.magnitude)) * config.PRICE_REACTIVITY_MAGNITUDE_MULTIPLIER) : 0;
  const priceRelevance = config.PRICE_RELEVANCE_BY_MOVE_TYPE[moveType] ?? 0.5;
  const priceReactivity = rawPriceReactivity * priceRelevance;

  const shareDrive = config.SHARE_DRIVE_MAP[marketShareTrend] ?? config.SHARE_DRIVE_MAP.stable;
  const rhetoric = scoreRhetoric(ceoPriorityStatement + ' ' + (recentNewsSignals || []).join(' '));

  // Revenue growth momentum: fast growers fight harder to protect momentum
  const growthMomentumAdj = clamp(
    config.GROWTH_MOMENTUM_FLOOR,
    config.GROWTH_MOMENTUM_CEILING,
    ((revenueGrowthRate ?? config.GROWTH_MOMENTUM_BASELINE) - config.GROWTH_MOMENTUM_BASELINE) * config.GROWTH_MOMENTUM_MULTIPLIER
  );

  // Disposition rollup with moveType + industry weights, then growth momentum added after
  const baseDispWeights = config.DISPOSITION_WEIGHTS_BY_MOVE_TYPE[moveType] ?? config.DISPOSITION_WEIGHTS_BY_MOVE_TYPE.other;
  const dispWeights = applyIndustryModifiers(baseDispWeights, industryMod, ['priceReactivity', 'shareDrive', 'rhetoric']);

  const dispositionBase =
    dispWeights.priceReactivity * priceReactivity +
    dispWeights.shareDrive * shareDrive +
    dispWeights.rhetoric * rhetoric;
  const disposition = round(clamp(0, 100, dispositionBase + growthMomentumAdj));

  // Motivation rollup with moveType + industry stakes/disposition split
  const baseMotWeights = config.MOTIVATION_WEIGHTS_BY_MOVE_TYPE[moveType] ?? config.MOTIVATION_WEIGHTS_BY_MOVE_TYPE.other;
  const motWeights = applyIndustryModifiers(baseMotWeights, industryMod, ['stakes', 'disposition']);

  const motivation =
    motWeights.stakes * stakesScore +
    motWeights.disposition * disposition;

  return {
    stakesScore: round(stakesScore),
    priceReactivity: round(priceReactivity),
    shareDrive: round(shareDrive),
    rhetoric: round(rhetoric),
    growthMomentumAdj: round(growthMomentumAdj),
    disposition,
    motivationScore: round(motivation),
  };
}

/**
 * Calculates awareness score (0–100).
 * Based on move visibility and move type.
 */
function calcAwareness(moveType, moveVisibility) {
  const effectiveVisibility = moveVisibility || (config.MOVE_VISIBILITY_DEFAULTS[moveType] ?? 'high');
  const awarenessScore = config.AWARENESS_SCORE_MAP[effectiveVisibility] ?? config.AWARENESS_SCORE_MAP.medium;
  return {
    awarenessScore: round(awarenessScore),
    awarenessFactor: awarenessScore / 100,
  };
}

/**
 * Generates the Predicted Reaction Profile (the v2 headline output).
 */
function buildPredictedReactionProfile(
  motivationScore,
  awarenessFactor,
  responseCapacityScore,
  disposition,
  constraintsDampener,
  ownershipIntensityMod,
  ownershipSpeedPenalty,
  switchingFriction,
  exposureToMove,
  responseConstraintLevel,
  moveType,
  intent,
  regulatoryConstraints,
  precomputedConfidence
) {
  // Response Likelihood
  let responseLikelihood = round(motivationScore * awarenessFactor);
  if (responseCapacityScore < config.RESPONSE_LIKELIHOOD_CAPACITY_CAP.threshold) {
    responseLikelihood = Math.min(responseLikelihood, config.RESPONSE_LIKELIHOOD_CAPACITY_CAP.cap);
  }

  // Response Intensity
  const responseIntensity = round(
    Math.min(motivationScore, responseCapacityScore) * constraintsDampener * ownershipIntensityMod
  );

  // Response Speed
  let responseSpeed = 'moderate';
  if (
    disposition > config.RESPONSE_SPEED_THRESHOLDS.fast_disposition &&
    responseCapacityScore > config.RESPONSE_SPEED_THRESHOLDS.fast_capacity &&
    !ownershipSpeedPenalty
  ) {
    responseSpeed = 'fast';
  } else if (
    responseCapacityScore < config.RESPONSE_SPEED_THRESHOLDS.slow_capacity ||
    ownershipSpeedPenalty ||
    switchingFriction === 'high'
  ) {
    responseSpeed = 'slow';
  }

  // Likely Response Vectors (ranked by likelihood)
  const vectors = [];

  // Rule 1: Low stakes = ignore
  if (exposureToMove < 30) {
    vectors.push('Ignore / monitor only');
  } else {
    // Rule 2: Severe constraints = non-price response
    if (responseConstraintLevel === 'severe') {
      vectors.push('Constrained — limited or non-price response');
    }

    // Rule 3: Margin defender intent (and price move) = hold price, defend on value
    if (intent.marginDefender > intent.growthMaximizer && ['price_cut', 'price_increase', 'bundle_promo'].includes(moveType)) {
      vectors.push('Hold price, defend on value / non-price levers');
    }

    // Rule 4: Growth maximizer + capacity + price move = match or undercut
    if (intent.growthMaximizer > 40 && responseCapacityScore > 55 && ['price_cut', 'price_increase', 'bundle_promo'].includes(moveType)) {
      vectors.push('Match or undercut on price');
    }

    // Rule 5: Innovation focus = differentiate
    if (intent.innovationBetter > intent.growthMaximizer && intent.innovationBetter > intent.marginDefender) {
      vectors.push('Differentiate via product / features');
    }

    // Rule 6: Regulatory constraints present = possible legal response
    if (regulatoryConstraints && moveType === 'price_cut') {
      vectors.push('Possible legal / regulatory response');
    }
  }

  // Always include at least one vector
  if (vectors.length === 0) {
    vectors.push('Measured competitive response');
  }

  const confidence = precomputedConfidence;

  return {
    responseLikelihood,
    responseSpeed,
    responseIntensity,
    likelyResponseVectors: vectors,
    confidence,
  };
}

/**
 * Generates plain-English summaries of stakes, reaction profile, and constraints.
 */
function buildProseSummaries(
  exposureToMove,
  marketOverlapPct,
  responseLikelihood,
  responseSpeed,
  responseIntensity,
  likelyResponseVectors,
  cashPosition,
  debtToEbitda,
  regulatoryConstraints,
  responseConstraintLevel,
  relativeLabel
) {
  // Stakes summary
  const stakesSummary =
    exposureToMove > 70
      ? `This move directly threatens a significant portion (~${exposureToMove}%) of their business, with ${marketOverlapPct}% market overlap. They are highly exposed and will likely prioritize a response.`
      : exposureToMove > 40
        ? `This move has moderate exposure (~${exposureToMove}% of revenue) with ${marketOverlapPct}% market overlap. They will assess the threat carefully.`
        : `This move has limited exposure (~${exposureToMove}% of revenue). They may respond only if strategically important.`;

  // Reaction profile summary
  const speedLabel = responseSpeed === 'fast' ? 'quickly' : responseSpeed === 'slow' ? 'slowly' : 'within a reasonable timeframe';
  const vectorsText = likelyResponseVectors.slice(0, 2).join(' or ');
  const reactionProfileSummary =
    responseLikelihood > 70
      ? `Expect a ${speedLabel} response with ${responseIntensity > 60 ? 'significant' : 'moderate'} intensity. Likely approaches: ${vectorsText}.`
      : responseLikelihood > 40
        ? `A measured response is probable, likely via ${vectorsText}.`
        : `Response is unlikely unless circumstances shift. They may monitor and wait.`;

  // Constraint summary (reuse v1 logic)
  const cashLabel = { strong: 'a strong cash position', moderate: 'a moderate cash position', weak: 'a weak cash position' }[cashPosition];
  const debtLabel = debtToEbitda > 4 ? 'high leverage' : debtToEbitda > 2 ? 'moderate leverage' : 'low leverage';
  let constraintSummary =
    `With ${cashLabel} and ${debtLabel} (${debtToEbitda}x debt/EBITDA), ` +
    (cashPosition === 'weak' || debtToEbitda > 4
      ? 'their ability to fund aggressive competitive responses is materially limited.'
      : 'they retain reasonable flexibility to respond to competitive moves without immediate financial strain.');

  if (regulatoryConstraints) {
    constraintSummary += ` Additionally: ${regulatoryConstraints}`;
  }

  // Add response constraint context if severe
  if (responseConstraintLevel === 'severe') {
    constraintSummary += ' Moreover, regulatory or investor constraints significantly limit their response options.';
  }

  return {
    stakesSummary,
    reactionProfileSummary,
    constraintSummary,
  };
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────

/**
 * Main scoring function for v2.
 * Takes raw competitor and your-company data, returns a fully-scored profile
 * including Predicted Reaction Profile and all intermediate scores.
 *
 * @param {Object} rawInputs - Raw competitor data
 * @param {Object} yourCompany - Your company's data (needed for relative firepower)
 * @returns {Object} - Scored profile with all v2 outputs
 */
export function buildCompetitorProfileV2(rawInputs, yourCompany, precomputedIntent = null) {
  const {
    name,
    revenueGrowthRate,
    ebitdaMargin,
    cashPosition,
    debtToEbitda,
    rdSpendPct,
    lastThreePriceMoves,
    marketShareTrend,
    headcountTrend,
    geographicFocus,
    ceoPriorityStatement,
    recentNewsSignals,
    regulatoryConstraints,
    competitorType,
    // pass-through only — used when this function scores yourCompany (for buildOrchestratorPrompt)
    strategicMove,
    context,
    // v2 new fields (all optional with defaults)
    annualRevenue = null,
    ownershipType = 'public',
    operationalFlexibility = 'medium',
    switchingFriction = 'medium',
    exposureToMove = 50,
    marketOverlapPct = 70,
    responseConstraintLevel = 'none',
  } = rawInputs;

  // Move type and industry from yourCompany context
  const moveType = yourCompany?.moveType ?? 'price_cut';
  const industryKey = yourCompany?.industry ?? 'other';

  // ── PILLAR C: RESPONSE CAPACITY ────────────────────────────────────────
  const responseCapacityScore = calcResponseCapacity(
    cashPosition,
    debtToEbitda,
    ebitdaMargin,
    annualRevenue,
    operationalFlexibility,
    headcountTrend,
    moveType,
    industryKey,
    rdSpendPct
  );

  // Your company's capacity (for relative firepower) — same moveType/industry context
  const yourCapacityScore = yourCompany
    ? calcResponseCapacity(
        yourCompany.cashPosition,
        yourCompany.debtToEbitda,
        yourCompany.ebitdaMargin,
        yourCompany.annualRevenue,
        yourCompany.operationalFlexibility,
        'flat',
        moveType,
        industryKey,
        yourCompany.rdSpendPct
      )
    : 50; // Fallback

  const relativeFirepowerRatio = round(responseCapacityScore / Math.max(yourCapacityScore, 1));
  const relativeLabel =
    relativeFirepowerRatio >= config.RELATIVE_FIREPOWER_THRESHOLDS.stronger
      ? 'stronger than you'
      : relativeFirepowerRatio <= config.RELATIVE_FIREPOWER_THRESHOLDS.weaker
        ? 'weaker than you'
        : 'evenly matched';

  // ── PILLAR M: MOTIVATION ───────────────────────────────────────────────
  const motivationData = calcMotivation(
    exposureToMove,
    marketOverlapPct,
    moveType,
    lastThreePriceMoves,
    marketShareTrend,
    ceoPriorityStatement,
    recentNewsSignals,
    industryKey,
    revenueGrowthRate
  );

  // ── CONFIDENCE ─────────────────────────────────────────────────────────
  const confidence = calcConfidence(rawInputs);
  const { motivationScore } = motivationData;

  // ── PILLAR A: AWARENESS ────────────────────────────────────────────────
  const awarenessData = calcAwareness(moveType, yourCompany?.moveVisibility);
  const { awarenessScore, awarenessFactor } = awarenessData;

  // ── CONSTRAINTS & OWNERSHIP ────────────────────────────────────────────
  const constraintsDampener = config.CONSTRAINTS_DAMPENER_MAP[responseConstraintLevel] ?? config.CONSTRAINTS_DAMPENER_MAP.none;
  const ownershipIntensityMod = config.OWNERSHIP_INTENSITY_MOD_MAP[ownershipType] ?? 1.0;
  const ownershipSpeedPenalty = config.OWNERSHIP_SPEED_PENALTY[ownershipType] ?? false;

  // ── STRATEGIC INTENT VECTOR ────────────────────────────────────────────
  // Use precomputed LLM intent if provided (injected from agents.js pre-pass).
  // Falls back to keyword scoring if not provided (e.g. frontend live scorecard).
  const intent = precomputedIntent ?? scoreStrategicIntentKeywordFallback(ceoPriorityStatement, recentNewsSignals);

  // ── PREDICTED REACTION PROFILE ─────────────────────────────────────────
  const predictedReactionProfile = buildPredictedReactionProfile(
    motivationScore,
    awarenessFactor,
    responseCapacityScore,
    motivationData.disposition,
    constraintsDampener,
    ownershipIntensityMod,
    ownershipSpeedPenalty,
    switchingFriction,
    exposureToMove,
    responseConstraintLevel,
    moveType,
    intent,
    regulatoryConstraints,
    confidence
  );

  // ── PROSE SUMMARIES ────────────────────────────────────────────────────
  const { stakesSummary, reactionProfileSummary, constraintSummary } = buildProseSummaries(
    exposureToMove,
    marketOverlapPct,
    predictedReactionProfile.responseLikelihood,
    predictedReactionProfile.responseSpeed,
    predictedReactionProfile.responseIntensity,
    predictedReactionProfile.likelyResponseVectors,
    cashPosition,
    debtToEbitda,
    regulatoryConstraints,
    responseConstraintLevel,
    relativeLabel
  );

  // Reaction pattern summary (keep from v1 for compatibility with prompts)
  const downMoves = (lastThreePriceMoves || []).filter(m => m.direction === 'down');
  let reactionPatternSummary;
  if (downMoves.length >= 2) {
    const timeframe = motivationData.disposition > 60 ? 'fast' : 'moderate';
    reactionPatternSummary = `Has shown a pattern of active price matching, typically responding within ${timeframe} timeframes.`;
  } else if ((lastThreePriceMoves || []).filter(m => m.direction === 'hold').length >= 2) {
    reactionPatternSummary = 'Has historically held pricing through competitive pressure, preferring to compete on value rather than price.';
  } else {
    reactionPatternSummary = 'Shows opportunistic pricing behavior — selectively matching competitors where margin allows.';
  }

  // Signal summary (keep from v1)
  const headcountContext = {
    growing: 'investing in capacity',
    flat: 'holding steady',
    shrinking: 'under cost pressure',
  }[headcountTrend];

  const signalLines = (recentNewsSignals || []).slice(0, 5);
  const signalText = signalLines.length > 0 ? `Recent signals include: ${signalLines.join('; ')}.` : 'No recent news signals available.';

  const signalSummary =
    `${signalText} Headcount is ${headcountTrend}, suggesting the organization is ${headcountContext}. ` +
    `Taken together, these indicators point to a competitor that is ` +
    (headcountTrend === 'growing' && motivationData.disposition > 55
      ? 'actively building out capability and likely to increase competitive pressure in the near term.'
      : headcountTrend === 'shrinking'
        ? 'managing costs carefully, which may limit their capacity for new competitive initiatives.'
        : 'maintaining its current competitive posture without significant near-term escalation signals.');

  // ── RETURN FULL PROFILE ────────────────────────────────────────────────
  return {
    name,
    // Raw financials (for prompt rendering)
    ebitdaMargin,
    revenueGrowthRate,
    cashPosition,
    debtToEbitda,
    rdSpendPct,
    // Qualitative
    geographicFocus: geographicFocus || '',
    competitorType: competitorType || '',
    ceoPriorityStatement: ceoPriorityStatement || '',
    // pass-through only — populated when this profile represents yourCompany
    strategicMove,
    context,
    // v2: New fields passed through
    annualRevenue,
    ownershipType,
    operationalFlexibility,
    switchingFriction,
    exposureToMove,
    marketOverlapPct,
    responseConstraintLevel,
    // Computed scores — Capability pillar
    responseCapacityScore,
    relativeFirepowerRatio,
    relativeLabel,
    // Computed scores — Motivation pillar
    motivationScore,
    stakesScore: motivationData.stakesScore,
    priceReactivity: motivationData.priceReactivity,
    shareDrive: motivationData.shareDrive,
    rhetoric: motivationData.rhetoric,
    growthMomentumAdj: motivationData.growthMomentumAdj,
    disposition: motivationData.disposition,
    // Computed scores — Awareness pillar
    awarenessScore,
    // Strategic Intent Vector (independent 0–100, not normalized)
    strategicIntentVector: intent,
    // Predicted Reaction Profile (v2 headline output)
    predictedReactionProfile,
    // Prose summaries
    stakesSummary,
    reactionPatternSummary,
    constraintSummary,
    signalSummary,
    reactionProfileSummary,
  };
}
