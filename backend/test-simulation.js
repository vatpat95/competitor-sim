import { runSimulation } from './agents.js';
import { buildCompetitorProfile } from './profileBuilder.js';

// ── Demo competitor profiles ──────────────────────────────────────────────────

const valuenet = buildCompetitorProfile({
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
});

const premiumconnect = buildCompetitorProfile({
  name: "PremiumConnect",
  revenueGrowthRate: 7.2,
  ebitdaMargin: 31.5,
  cashPosition: "strong",
  debtToEbitda: 0.9,
  rdSpendPct: 11.0,
  lastThreePriceMoves: [
    { direction: "hold", magnitude: 0, context: "Held price during market-wide discount cycle" },
    { direction: "up",   magnitude: 5, context: "Premium tier repricing post-feature release" },
    { direction: "hold", magnitude: 0, context: "Maintained pricing despite competitor cuts" },
  ],
  marketShareTrend: "stable",
  headcountTrend: "flat",
  geographicFocus: "North America, Western Europe",
  ceoPriorityStatement:
    "We compete on innovation and customer experience, not price. Our margins fund the R&D that keeps us two years ahead. We will not chase volume at the expense of profitability.",
  recentNewsSignals: [
    "Launched AI-powered analytics suite exclusive to Enterprise tier",
    "Won three analyst 'leader' rankings in enterprise segment",
    "Renewed multi-year contracts with 4 Fortune 500 accounts",
  ],
  regulatoryConstraints: "Subject to enterprise data residency requirements in EU; limits rapid geographic expansion.",
});

const regionalplus = buildCompetitorProfile({
  name: "RegionalPlus",
  revenueGrowthRate: 3.1,
  ebitdaMargin: 8.7,
  cashPosition: "weak",
  debtToEbitda: 4.2,
  rdSpendPct: 2.1,
  lastThreePriceMoves: [
    { direction: "down", magnitude: 10, context: "Reactive cut after losing two regional accounts" },
    { direction: "hold", magnitude: 0,  context: "Could not afford further cuts" },
    { direction: "down", magnitude: 6,  context: "End-of-year retention discount for at-risk accounts" },
  ],
  marketShareTrend: "losing",
  headcountTrend: "shrinking",
  geographicFocus: "US Midwest and Southeast regional markets",
  ceoPriorityStatement:
    "We are focused on protecting our core rural and regional customer base. Our local relationships and dedicated support are what national players cannot replicate.",
  recentNewsSignals: [
    "Closed two regional offices to cut overhead",
    "Lost 3 mid-market accounts to ValueNet in Q1",
    "Announced 'Regional Loyalty' pricing program for long-term customers",
  ],
  regulatoryConstraints: "State-level telecom licensing in 6 states limits ability to exit or restructure quickly.",
});

// ── Your company ──────────────────────────────────────────────────────────────

const yourCompany = {
  name: "OurCo",
  strategicMove: "Launch of a new mid-market bundle priced 10% above ValueNet but with a 90-day free trial and dedicated onboarding",
  context: "We are targeting ValueNet's recent mid-market gains with a value-add play rather than a price war, betting that trial conversion and onboarding quality will differentiate us.",
};

// ── Run simulation ────────────────────────────────────────────────────────────

console.log("Running simulation — this will make several API calls...\n");
const result = await runSimulation({ yourCompany, competitors: [valuenet, premiumconnect, regionalplus] });

// ── Print round 1 results ─────────────────────────────────────────────────────
console.log("\n=== ROUND 1 RESPONSES ===");
for (const entry of result.rounds.round1) {
  console.log(`\n[${entry.competitorName}]`);
  console.log(JSON.stringify(entry.response, null, 2));
}

// ── Print equilibrium ─────────────────────────────────────────────────────────
console.log("\n=== EQUILIBRIUM REACHED ===", result.equilibriumReached);
console.log("Total rounds run:", result.totalRounds);

// ── Print orchestrator output ─────────────────────────────────────────────────
console.log("\n=== ORCHESTRATOR OUTPUT ===");
console.log(JSON.stringify(result.orchestratorOutput, null, 2));

// ── Assertions ────────────────────────────────────────────────────────────────
const errors = [];

// All 3 competitors have primaryResponse.type
for (const entry of result.rounds.round1) {
  const type = entry.response?.primaryResponse?.type;
  if (!type) {
    errors.push(`${entry.competitorName}: missing primaryResponse.type`);
  }
}

// orchestratorOutput.strategicRecommendation is a non-empty string
const rec = result.orchestratorOutput?.strategicRecommendation;
if (typeof rec !== 'string' || rec.trim() === '') {
  errors.push(`orchestratorOutput.strategicRecommendation is missing or empty`);
}

// orchestratorOutput.watchlistSignals is an array with at least 1 item
const signals = result.orchestratorOutput?.watchlistSignals;
if (!Array.isArray(signals) || signals.length < 1) {
  errors.push(`orchestratorOutput.watchlistSignals is missing or empty`);
}

// ── Result ────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  throw new Error(`SIMULATION TEST FAILURES:\n  - ${errors.join('\n  - ')}`);
}

console.log("\nSIMULATION TEST PASSED");
