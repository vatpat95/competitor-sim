/**
 * @typedef {{ direction: "up"|"down"|"hold", magnitude: number, context: string }} PriceMove
 *
 * @typedef {{
 *   name: string,
 *   revenueGrowthRate: number,
 *   ebitdaMargin: number,
 *   cashPosition: "strong"|"moderate"|"weak",
 *   debtToEbitda: number,
 *   rdSpendPct: number,
 *   lastThreePriceMoves: PriceMove[],
 *   marketShareTrend: "gaining"|"stable"|"losing",
 *   headcountTrend: "growing"|"flat"|"shrinking",
 *   geographicFocus: string,
 *   ceoPriorityStatement: string,
 *   recentNewsSignals: string[],
 *   regulatoryConstraints: string
 * }} RawInputs
 */

/**
 * Builds a structured competitor profile with scoring from raw competitive intelligence inputs.
 *
 * @param {RawInputs} rawInputs
 * @returns {{
 *   name: string,
 *   financialCapacityScore: number,
 *   aggressionIndex: number,
 *   strategicIntentVector: { growthMaximizer: number, marginDefender: number, nichePlayer: number, innovationBetter: number },
 *   reactionPatternSummary: string,
 *   constraintSummary: string,
 *   signalSummary: string
 * }}
 */
export function buildCompetitorProfile(rawInputs) {
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
    ceoPriorityStatement,
    recentNewsSignals,
    regulatoryConstraints,
  } = rawInputs;

  // ── 1. financialCapacityScore ────────────────────────────────────────────
  const cashScoreMap = { strong: 100, moderate: 50, weak: 10 };
  const cashScore = cashScoreMap[cashPosition];
  const debtScore = Math.max(0, 100 - debtToEbitda * 15);
  const marginScore = Math.min(100, ebitdaMargin * 3);
  const financialCapacityScore = Math.round(
    ((cashScore * 0.40) + (debtScore * 0.35) + (marginScore * 0.25)) * 10
  ) / 10;

  // ── 2. aggressionIndex ──────────────────────────────────────────────────
  const downMoves = lastThreePriceMoves.filter(m => m.direction === "down");
  const priceMovementScore =
    downMoves.length > 0
      ? (downMoves.reduce((sum, m) => sum + m.magnitude, 0) / downMoves.length) * 4
      : 0;

  const shareScoreMap = { gaining: 80, stable: 40, losing: 20 };
  const shareScore = shareScoreMap[marketShareTrend];
  const capacityBonus = financialCapacityScore * 0.3;

  const aggressionIndex = Math.min(
    100,
    Math.round(
      ((priceMovementScore * 0.4) + (shareScore * 0.3) + (capacityBonus * 0.3)) * 10
    ) / 10
  );

  // ── 3. strategicIntentVector ─────────────────────────────────────────────
  const ceo = ceoPriorityStatement.toLowerCase();

  const rawGrowth =
    (revenueGrowthRate > 10 ? 3 : revenueGrowthRate > 5 ? 2 : 1) +
    (marketShareTrend === "gaining" ? 2 : 0) +
    (ceo.includes("share") ? 1 : 0) +
    (ceo.includes("growth") ? 1 : 0);

  const holdCount = lastThreePriceMoves.filter(m => m.direction === "hold").length;
  const rawMargin =
    (ebitdaMargin > 25 ? 3 : ebitdaMargin > 15 ? 2 : 1) +
    holdCount +
    (ceo.includes("margin") ? 1 : 0) +
    (ceo.includes("profit") ? 1 : 0);

  const rawNiche =
    (marketShareTrend === "losing" ? 2 : 1) +
    (ceo.includes("focus") ? 1 : 0) +
    (ceo.includes("rural") ? 2 : 0) +
    (ceo.includes("specific") ? 1 : 0) +
    (financialCapacityScore < 40 ? 2 : 0);

  const rawInnovation =
    (rdSpendPct > 8 ? 3 : rdSpendPct > 4 ? 2 : 1) +
    (ceo.includes("innovat") ? 2 : 0) +
    (ceo.includes("premium") ? 1 : 0) +
    (ceo.includes("experience") ? 1 : 0);

  const intentTotal = rawGrowth + rawMargin + rawNiche + rawInnovation;
  const strategicIntentVector = {
    growthMaximizer: Math.round((rawGrowth / intentTotal) * 1000) / 1000,
    marginDefender: Math.round((rawMargin / intentTotal) * 1000) / 1000,
    nichePlayer: Math.round((rawNiche / intentTotal) * 1000) / 1000,
    innovationBetter: Math.round((rawInnovation / intentTotal) * 1000) / 1000,
  };

  // ── 4. reactionPatternSummary ────────────────────────────────────────────
  const downCount = downMoves.length;
  const holdCountAll = holdCount;
  let reactionPatternSummary;

  if (downCount >= 2) {
    const timeframe = aggressionIndex > 60 ? "fast" : "moderate";
    reactionPatternSummary =
      `Has shown a pattern of active price matching, typically responding within ${timeframe} timeframes.`;
  } else if (holdCountAll >= 2) {
    reactionPatternSummary =
      "Has historically held pricing through competitive pressure, preferring to compete on value rather than price.";
  } else {
    reactionPatternSummary =
      "Shows opportunistic pricing behavior — selectively matching competitors where margin allows.";
  }

  // ── 5. constraintSummary ─────────────────────────────────────────────────
  const cashLabel = { strong: "a strong cash position", moderate: "a moderate cash position", weak: "a weak cash position" }[cashPosition];
  const debtLabel =
    debtToEbitda > 4 ? "high leverage" :
    debtToEbitda > 2 ? "moderate leverage" :
    "low leverage";

  let constraintSummary =
    `With ${cashLabel} and ${debtLabel} (${debtToEbitda}x debt/EBITDA), ` +
    (cashPosition === "weak" || debtToEbitda > 4
      ? "their ability to fund aggressive competitive responses — such as sustained price cuts or large-scale promotions — is materially limited."
      : "they retain reasonable flexibility to respond to competitive moves without immediate financial strain.");

  if (regulatoryConstraints) {
    constraintSummary += ` Additionally, regulatory constraints apply: ${regulatoryConstraints}`;
  }

  // ── 6. signalSummary ─────────────────────────────────────────────────────
  const headcountContext = {
    growing: "investing in capacity",
    flat: "holding steady",
    shrinking: "under cost pressure",
  }[headcountTrend];

  const signalLines = recentNewsSignals.slice(0, 5);
  const signalText =
    signalLines.length > 0
      ? `Recent signals include: ${signalLines.join("; ")}.`
      : "No recent news signals available.";

  const signalSummary =
    `${signalText} Headcount is ${headcountTrend}, suggesting the organization is ${headcountContext}. ` +
    `Taken together, these indicators point to a competitor that is ` +
    (headcountTrend === "growing" && aggressionIndex > 55
      ? "actively building out capability and likely to increase competitive pressure in the near term."
      : headcountTrend === "shrinking"
      ? "managing costs carefully, which may limit their capacity for new competitive initiatives."
      : "maintaining its current competitive posture without significant near-term escalation signals.");

  // ── Return ───────────────────────────────────────────────────────────────
  return {
    name,
    // Raw financials passed through for prompt rendering
    ebitdaMargin,
    revenueGrowthRate,
    cashPosition,
    debtToEbitda,
    // Computed scores
    financialCapacityScore,
    aggressionIndex,
    strategicIntentVector,
    reactionPatternSummary,
    constraintSummary,
    signalSummary,
  };
}
