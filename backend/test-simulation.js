import { runSimulation } from './agents.js';

// ── Demo competitor raw inputs ────────────────────────────────────────────────
// NOTE: These are raw inputs. agents.js will build v2 profiles internally.

const valuenet = {
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
  // v2 new fields
  annualRevenue: 3000,
  ownershipType: "public",
  operationalFlexibility: "high",
  switchingFriction: "medium",
  exposureToMove: 65,
  marketOverlapPct: 80,
  responseConstraintLevel: "none",
};

const premiumconnect = {
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
  // v2 new fields
  annualRevenue: 5500,
  ownershipType: "public",
  operationalFlexibility: "medium",
  switchingFriction: "low",
  exposureToMove: 20,
  marketOverlapPct: 40,
  responseConstraintLevel: "moderate",
};

const regionalplus = {
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
  // v2 new fields
  annualRevenue: 800,
  ownershipType: "family_private",
  operationalFlexibility: "low",
  switchingFriction: "high",
  exposureToMove: 45,
  marketOverlapPct: 50,
  responseConstraintLevel: "severe",
};

// ── Your company ──────────────────────────────────────────────────────────────

const yourCompany = {
  name: "OurCo",
  strategicMove: "Launch of a new mid-market bundle priced 10% above ValueNet but with a 90-day free trial and dedicated onboarding",
  context: "We are targeting ValueNet's recent mid-market gains with a value-add play rather than a price war, betting that trial conversion and onboarding quality will differentiate us.",
  // v2 financial fields (for relative firepower calculation)
  revenueGrowthRate: 15.0,
  ebitdaMargin: 22.0,
  cashPosition: "strong",
  debtToEbitda: 1.5,
  operationalFlexibility: "high",
  annualRevenue: 4500, // $4.5B
  moveType: "product_launch",
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

// ── Print v2 Predicted Reaction Profiles ──────────────────────────────────────
console.log("\n=== PREDICTED REACTION PROFILES (v2) ===");
for (const profile of result.competitorProfiles) {
  console.log(`\n[${profile.name}]`);
  console.log("Relative Firepower:", profile.relativeLabel);
  console.log("Response Capacity:", profile.responseCapacityScore);
  console.log("Motivation:", profile.motivationScore);
  console.log("Awareness:", profile.awarenessScore);
  const prp = profile.predictedReactionProfile;
  console.log("Predicted Reaction Profile:");
  console.log(`  - Likelihood: ${prp.responseLikelihood}%`);
  console.log(`  - Speed: ${prp.responseSpeed}`);
  console.log(`  - Intensity: ${prp.responseIntensity}`);
  console.log(`  - Likely vectors: ${prp.likelyResponseVectors.join(", ")}`);
  console.log(`  - Confidence: ${prp.confidence}`);
}

// ── Print equilibrium ─────────────────────────────────────────────────────────
console.log("\n=== EQUILIBRIUM REACHED ===", result.equilibriumReached);
console.log("Total rounds run:", result.totalRounds);

// ── Print orchestrator output ─────────────────────────────────────────────────
console.log("\n=== ORCHESTRATOR OUTPUT ===");
console.log(JSON.stringify(result.orchestratorOutput, null, 2));

// ── Assertions ────────────────────────────────────────────────────────────────
const errors = [];

// Check scoring version is v2.0
if (result.simulationMetadata?.scoringVersion !== 'v2.0') {
  errors.push(`Scoring version should be 'v2.0', got '${result.simulationMetadata?.scoringVersion}'`);
}

// Check yourCompanyProfile exists (v2)
if (!result.yourCompanyProfile) {
  errors.push(`yourCompanyProfile is missing (v2 requirement)`);
}

// All 3 competitors have Predicted Reaction Profile (v2)
for (const profile of result.competitorProfiles) {
  if (!profile.predictedReactionProfile) {
    errors.push(`${profile.name}: missing predictedReactionProfile (v2)`);
  }
  const prp = profile.predictedReactionProfile;
  if (prp) {
    if (typeof prp.responseLikelihood !== 'number' || prp.responseLikelihood < 0 || prp.responseLikelihood > 100) {
      errors.push(`${profile.name}: predictedReactionProfile.responseLikelihood invalid`);
    }
    if (!['fast', 'moderate', 'slow'].includes(prp.responseSpeed)) {
      errors.push(`${profile.name}: predictedReactionProfile.responseSpeed invalid (${prp.responseSpeed})`);
    }
    if (typeof prp.responseIntensity !== 'number' || prp.responseIntensity < 0 || prp.responseIntensity > 100) {
      errors.push(`${profile.name}: predictedReactionProfile.responseIntensity invalid`);
    }
    if (!Array.isArray(prp.likelyResponseVectors) || prp.likelyResponseVectors.length === 0) {
      errors.push(`${profile.name}: predictedReactionProfile.likelyResponseVectors missing or empty`);
    }
  }
}

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
