import { buildCompetitorProfile } from './profileBuilder.js';

// ── ValueNet Demo Dataset ────────────────────────────────────────────────────
const valueNetInputs = {
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
};

// ── Run ──────────────────────────────────────────────────────────────────────
const result = buildCompetitorProfile(valueNetInputs);
console.log(JSON.stringify(result, null, 2));

// ── Assertions ───────────────────────────────────────────────────────────────
const errors = [];

// 1. financialCapacityScore between 55 and 75
if (result.financialCapacityScore < 55 || result.financialCapacityScore > 75) {
  errors.push(
    `financialCapacityScore out of range: expected 55–75, got ${result.financialCapacityScore}`
  );
}

// 2. aggressionIndex above 60
if (result.aggressionIndex <= 60) {
  errors.push(
    `aggressionIndex too low: expected > 60, got ${result.aggressionIndex}`
  );
}

// 3. strategicIntentVector values sum to ~1.0 (within 0.01)
const intentSum = Object.values(result.strategicIntentVector).reduce((a, b) => a + b, 0);
if (Math.abs(intentSum - 1.0) > 0.01) {
  errors.push(
    `strategicIntentVector does not sum to 1.0: got ${intentSum.toFixed(5)}`
  );
}

// 4. All 6 fields present and non-empty
const requiredFields = [
  'financialCapacityScore',
  'aggressionIndex',
  'strategicIntentVector',
  'reactionPatternSummary',
  'constraintSummary',
  'signalSummary',
];
for (const field of requiredFields) {
  const value = result[field];
  if (value === undefined || value === null) {
    errors.push(`Missing field: ${field}`);
  } else if (typeof value === 'string' && value.trim() === '') {
    errors.push(`Empty string field: ${field}`);
  } else if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
    errors.push(`Empty object field: ${field}`);
  }
}

// ── Result ───────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  throw new Error(`ASSERTION FAILURES:\n  - ${errors.join('\n  - ')}`);
}

console.log('\nALL CHECKS PASSED');
