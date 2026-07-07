import { buildCompetitorProfileV2 } from './profileBuilderV2.js';
import { buildCompetitorSystemPrompt, buildCompetitorRoundPrompt } from './prompts.js';

// ── 1. Build ValueNet profile ────────────────────────────────────────────────
const yourCompany = { name: 'YourCo', ebitdaMargin: 15, cashPosition: 'moderate', debtToEbitda: 2, annualRevenue: 3000, operationalFlexibility: 'medium' };
const valuenetProfile = buildCompetitorProfileV2({
  name: "ValueNet",
  revenueGrowthRate: 18.5,
  ebitdaMargin: 12.3,
  cashPosition: "strong",
  debtToEbitda: 1.8,
  rdSpendPct: 3.5,
  lastThreePriceMoves: [
    { direction: "down", magnitude: 22, context: "Aggressive Q4 campaign targeting mid-market" },
    { direction: "down", magnitude: 20, context: "Response to new entrant pricing pressure" },
    { direction: "down", magnitude: 18, context: "Renewal season discount push" },
  ],
  marketShareTrend: "gaining",
  headcountTrend: "growing",
  geographicFocus: "North America, expanding EMEA",
  ceoPriorityStatement:
    "Our mission is to be the undisputed price-value leader in every market we enter. We will outgrow the competition by making our product impossible to ignore on price.",
  recentNewsSignals: [
    "Announced expansion into 4 new metro markets",
    "Hired 200 sales reps in Q1",
    "Launched 'ValueNet Unlimited' tier at 15% below nearest competitor",
    "Partnership with mid-market procurement platform",
  ],
  regulatoryConstraints: "",
  exposureToMove: 50,
  marketOverlapPct: 75,
  operationalFlexibility: 'high',
  switchingFriction: 'medium',
  responseConstraintLevel: 'none',
  ownershipType: 'public',
  annualRevenue: 3000,
}, yourCompany);

// ── 2. Build and print system prompt ────────────────────────────────────────
const systemPrompt = buildCompetitorSystemPrompt(valuenetProfile);
console.log("=== SYSTEM PROMPT ===");
console.log(systemPrompt);

// ── 3. Assertions on system prompt ──────────────────────────────────────────
const errors = [];

if (!systemPrompt.includes("Response Capacity") && !systemPrompt.includes("responseCapacityScore") && !systemPrompt.includes("Capacity Score")) {
  errors.push('System prompt missing response capacity score reference');
}
if (!systemPrompt.includes("STRATEGIC INTENT")) {
  errors.push('System prompt missing "STRATEGIC INTENT"');
}
if (!systemPrompt.includes("Respond ONLY with valid JSON")) {
  errors.push('System prompt missing "Respond ONLY with valid JSON"');
}
if (systemPrompt.length <= 500) {
  errors.push(`System prompt too short: ${systemPrompt.length} chars (expected > 500)`);
}

// ── 4. Build and print round prompt ─────────────────────────────────────────
const roundPrompt = buildCompetitorRoundPrompt(
  "A new low-cost entrant just launched at 25% below market rate.",
  valuenetProfile,
  [
    {
      competitorName: "AlphaInc",
      primaryResponse: { type: "price_cut", magnitude: 10, timing: "immediate" },
    },
  ]
);
console.log("\n=== ROUND PROMPT ===");
console.log(roundPrompt);

// ── 5. Result ────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  throw new Error(`PROMPT CHECK FAILURES:\n  - ${errors.join('\n  - ')}`);
}

console.log("\nALL PROMPT CHECKS PASSED");
