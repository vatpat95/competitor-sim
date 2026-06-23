/**
 * Unit tests for profileBuilderV2.js
 *
 * Tests the v2 scoring model:
 * - High exposure drives higher motivation
 * - Financial capacity does NOT leak into motivation
 * - Intent dimensions are independent 0–100 (not normalized)
 * - All new v2 outputs are present and in valid ranges
 */

import { buildCompetitorProfileV2 } from './profileBuilderV2.js';

// ── TEST DATA ─────────────────────────────────────────────────────────────

const sampleYourCompany = {
  name: 'TelcoX',
  revenueGrowthRate: 12.0,
  ebitdaMargin: 20.0,
  cashPosition: 'strong',
  debtToEbitda: 2.0,
  operationalFlexibility: 'high',
  annualRevenue: 5000, // $5B
  moveType: 'price_cut',
  strategicMove: '10% price cut on core plan',
};

const sampleCompetitor = {
  name: 'ValueNet',
  revenueGrowthRate: 18.5,
  ebitdaMargin: 12.3,
  cashPosition: 'strong',
  debtToEbitda: 1.8,
  rdSpendPct: 3.5,
  lastThreePriceMoves: [
    { direction: 'down', magnitude: 15, context: 'Q4' },
    { direction: 'down', magnitude: 12, context: 'Q2' },
    { direction: 'hold', magnitude: 0, context: 'Q1' },
  ],
  marketShareTrend: 'gaining',
  headcountTrend: 'growing',
  geographicFocus: 'North America, expanding EMEA',
  ceoPriorityStatement: 'We will be the price-value leader. We are aggressive on market share.',
  recentNewsSignals: ['Hired 200 sales reps', 'Expanded into 4 new markets'],
  regulatoryConstraints: '',
  competitorType: 'low_cost_challenger',
  // v2 new fields
  annualRevenue: 3000, // $3B
  ownershipType: 'public',
  operationalFlexibility: 'high',
  switchingFriction: 'medium',
  marketOverlapPct: 75,
  responseConstraintLevel: 'none',
};

// ── TEST HELPERS ──────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passCount++;
  } else {
    console.log(`✗ FAIL: ${message}`);
    failCount++;
  }
}

function between(x, lo, hi, tolerance = 0) {
  return x >= lo - tolerance && x <= hi + tolerance;
}

// ── TEST 1: HIGH EXPOSURE DRIVES HIGHER MOTIVATION ────────────────────────

console.log('\n=== TEST 1: Exposure drives motivation ===');

// Same competitor, high exposure
const highExposure = { ...sampleCompetitor, exposureToMove: 90 };
const profileHigh = buildCompetitorProfileV2(highExposure, sampleYourCompany);

// Same competitor, low exposure
const lowExposure = { ...sampleCompetitor, exposureToMove: 10 };
const profileLow = buildCompetitorProfileV2(lowExposure, sampleYourCompany);

console.log(`High exposure (90%) motivation: ${profileHigh.motivationScore}`);
console.log(`Low exposure (10%) motivation: ${profileLow.motivationScore}`);

assert(
  profileHigh.motivationScore > profileLow.motivationScore,
  'High exposure motivation > Low exposure motivation'
);

assert(
  profileHigh.motivationScore > profileLow.motivationScore + 10,
  'Exposure difference is meaningful (>10 points)'
);

// ── TEST 2: FINANCIAL CAPACITY DOES NOT LEAK INTO MOTIVATION ──────────────

console.log('\n=== TEST 2: Financial capacity independence ===');

// Same exposure and market factors, different financial capacity
const strongFinance = { ...sampleCompetitor, cashPosition: 'strong', debtToEbitda: 1.0 };
const weakFinance = { ...sampleCompetitor, cashPosition: 'weak', debtToEbitda: 5.0 };

const profileStrong = buildCompetitorProfileV2(strongFinance, sampleYourCompany);
const profileWeak = buildCompetitorProfileV2(weakFinance, sampleYourCompany);

console.log(`Strong financial motivation: ${profileStrong.motivationScore}`);
console.log(`Weak financial motivation: ${profileWeak.motivationScore}`);
console.log(`Difference: ${Math.abs(profileStrong.motivationScore - profileWeak.motivationScore)}`);

// Motivation should be the same or very similar (diff < 5) because motivation
// is driven by stakes and disposition, NOT financial capacity
const motivationDiff = Math.abs(profileStrong.motivationScore - profileWeak.motivationScore);
assert(
  motivationDiff < 5,
  'Financial capacity does NOT significantly leak into motivation (diff < 5)'
);

// But response capacity should be very different
console.log(`Strong financial capacity: ${profileStrong.responseCapacityScore}`);
console.log(`Weak financial capacity: ${profileWeak.responseCapacityScore}`);
assert(
  profileStrong.responseCapacityScore > profileWeak.responseCapacityScore + 10,
  'Financial capacity significantly affects response capacity (>10 point diff)'
);

// ── TEST 3: INTENT DIMENSIONS ARE INDEPENDENT 0–100 ────────────────────────

console.log('\n=== TEST 3: Intent dimensions independence ===');

const intentProfile = buildCompetitorProfileV2(sampleCompetitor, sampleYourCompany);
const intent = intentProfile.strategicIntentVector;

console.log(`Intent vector:`, intent);

// Each dimension should be 0–100
assert(between(intent.growthMaximizer, 0, 100), 'growthMaximizer is 0–100');
assert(between(intent.marginDefender, 0, 100), 'marginDefender is 0–100');
assert(between(intent.nichePlayer, 0, 100), 'nichePlayer is 0–100');
assert(between(intent.innovationBetter, 0, 100), 'innovationBetter is 0–100');

// Sum should NOT be exactly 100 (v1 was normalized; v2 is not)
const intentSum = intent.growthMaximizer + intent.marginDefender + intent.nichePlayer + intent.innovationBetter;
console.log(`Intent sum: ${intentSum} (should not be ~100 for v2)`);
assert(
  intentSum !== 100 && intentSum > 50, // Could be anywhere, but not normalized to 100
  'Intent dimensions do NOT sum to exactly 100 (independent scaling)'
);

// Competitor has growth/price keywords, so growth should be high
assert(
  intent.growthMaximizer > intent.marginDefender,
  'Growth intent is higher than margin intent (based on keywords)'
);

// ── TEST 4: PREDICTED REACTION PROFILE EXISTS AND IS VALID ────────────────

console.log('\n=== TEST 4: Predicted Reaction Profile ===');

const testProfile = buildCompetitorProfileV2(sampleCompetitor, sampleYourCompany);
const prp = testProfile.predictedReactionProfile;

console.log(`Response likelihood: ${prp.responseLikelihood}`);
console.log(`Response speed: ${prp.responseSpeed}`);
console.log(`Response intensity: ${prp.responseIntensity}`);
console.log(`Likely vectors: ${prp.likelyResponseVectors.join(', ')}`);
console.log(`Confidence: ${prp.confidence}`);

assert(between(prp.responseLikelihood, 0, 100), 'responseLikelihood is 0–100');
assert(
  ['fast', 'moderate', 'slow'].includes(prp.responseSpeed),
  'responseSpeed is valid (fast/moderate/slow)'
);
assert(between(prp.responseIntensity, 0, 100), 'responseIntensity is 0–100');
assert(Array.isArray(prp.likelyResponseVectors) && prp.likelyResponseVectors.length > 0, 'likelyResponseVectors is non-empty array');
assert(between(prp.confidence, 0, 100), 'confidence is 0–100');

// ── TEST 5: RELATIVE FIREPOWER ────────────────────────────────────────────

console.log('\n=== TEST 5: Relative Firepower ===');

const relProfile = buildCompetitorProfileV2(sampleCompetitor, sampleYourCompany);
console.log(`Competitor response capacity: ${relProfile.responseCapacityScore}`);
console.log(`Relative firepower ratio: ${relProfile.relativeFirepowerRatio}`);
console.log(`Relative label: ${relProfile.relativeLabel}`);

assert(
  between(relProfile.relativeFirepowerRatio, 0, 3),
  'relativeFirepowerRatio is in reasonable range (0–3)'
);
assert(['stronger than you', 'weaker than you', 'evenly matched'].includes(relProfile.relativeLabel), 'relativeLabel is valid');

// ── TEST 6: ALL REQUIRED FIELDS PRESENT ───────────────────────────────────

console.log('\n=== TEST 6: Output completeness ===');

const fullProfile = buildCompetitorProfileV2(sampleCompetitor, sampleYourCompany);

const requiredFields = [
  'name',
  'responseCapacityScore',
  'motivationScore',
  'awarenessScore',
  'strategicIntentVector',
  'predictedReactionProfile',
  'stakesSummary',
  'reactionPatternSummary',
  'constraintSummary',
  'signalSummary',
  'reactionProfileSummary',
  'relativeFirepowerRatio',
  'relativeLabel',
];

for (const field of requiredFields) {
  assert(field in fullProfile, `Field '${field}' is present`);
}

// ── TEST 7: SCORES ARE ALL 0–100 OR VALID ────────────────────────────────

console.log('\n=== TEST 7: Score ranges ===');

assert(between(fullProfile.responseCapacityScore, 0, 100), 'responseCapacityScore is 0–100');
assert(between(fullProfile.motivationScore, 0, 100), 'motivationScore is 0–100');
assert(between(fullProfile.awarenessScore, 0, 100), 'awarenessScore is 0–100');
assert(between(fullProfile.priceReactivity, 0, 100), 'priceReactivity is 0–100');
assert(between(fullProfile.shareDrive, 0, 100), 'shareDrive is 0–100');
assert(between(fullProfile.rhetoric, 0, 100), 'rhetoric is 0–100');
assert(between(fullProfile.disposition, 0, 100), 'disposition is 0–100');

// ── TEST 8: PHASE 1 — moveType-keyed weight tables ───────────────────────
// a) All 7 rows × 3 tables must have weights that sum to 1.0 ± 0.001
// b) Same competitor under price_cut vs market_entry must produce different scores
// c) Same competitor under industry pharma vs retail must produce different scores

console.log('\n=== TEST 8: Phase 1 — moveType-keyed weights ===');

import * as config from './scoringConfig.js';

// a) Weight table integrity — all rows sum to 1.0
const MOVE_TYPES = ['price_cut', 'price_increase', 'bundle_promo', 'product_launch', 'market_entry', 'capacity_expansion', 'other'];
const TOLERANCE = 0.001;

for (const mt of MOVE_TYPES) {
  const capW = config.RESPONSE_CAPACITY_WEIGHTS_BY_MOVE_TYPE[mt];
  const capSum = capW.financialFirepower + capW.scale + capW.operationalFlex;
  assert(Math.abs(capSum - 1.0) < TOLERANCE, `RESPONSE_CAPACITY_WEIGHTS_BY_MOVE_TYPE['${mt}'] sums to 1.0 (got ${capSum.toFixed(4)})`);

  const motW = config.MOTIVATION_WEIGHTS_BY_MOVE_TYPE[mt];
  const motSum = motW.stakes + motW.disposition;
  assert(Math.abs(motSum - 1.0) < TOLERANCE, `MOTIVATION_WEIGHTS_BY_MOVE_TYPE['${mt}'] sums to 1.0 (got ${motSum.toFixed(4)})`);

  const dispW = config.DISPOSITION_WEIGHTS_BY_MOVE_TYPE[mt];
  const dispSum = dispW.priceReactivity + dispW.shareDrive + dispW.rhetoric;
  assert(Math.abs(dispSum - 1.0) < TOLERANCE, `DISPOSITION_WEIGHTS_BY_MOVE_TYPE['${mt}'] sums to 1.0 (got ${dispSum.toFixed(4)})`);
}

// b) price_cut vs market_entry — scores must differ
const yourCoPriceCut = { ...sampleYourCompany, moveType: 'price_cut', industry: 'other' };
const yourCoMarketEntry = { ...sampleYourCompany, moveType: 'market_entry', industry: 'other' };
const profilePriceCut = buildCompetitorProfileV2(sampleCompetitor, yourCoPriceCut);
const profileMarketEntry = buildCompetitorProfileV2(sampleCompetitor, yourCoMarketEntry);
assert(
  profilePriceCut.responseCapacityScore !== profileMarketEntry.responseCapacityScore ||
  profilePriceCut.motivationScore !== profileMarketEntry.motivationScore,
  `price_cut vs market_entry produces different scores (cap: ${profilePriceCut.responseCapacityScore} vs ${profileMarketEntry.responseCapacityScore}, mot: ${profilePriceCut.motivationScore} vs ${profileMarketEntry.motivationScore})`
);
console.log(`  price_cut  → cap=${profilePriceCut.responseCapacityScore}, mot=${profilePriceCut.motivationScore}, disp=${profilePriceCut.disposition}`);
console.log(`  market_entry → cap=${profileMarketEntry.responseCapacityScore}, mot=${profileMarketEntry.motivationScore}, disp=${profileMarketEntry.disposition}`);

// c) industry pharma_biotech vs cpg_fmcg — scores must differ
const yourCoPharma = { ...sampleYourCompany, moveType: 'price_cut', industry: 'pharma_biotech' };
const yourCoCPG = { ...sampleYourCompany, moveType: 'price_cut', industry: 'cpg_fmcg' };
const profilePharma = buildCompetitorProfileV2(sampleCompetitor, yourCoPharma);
const profileCPG = buildCompetitorProfileV2(sampleCompetitor, yourCoCPG);
assert(
  profilePharma.responseCapacityScore !== profileCPG.responseCapacityScore ||
  profilePharma.motivationScore !== profileCPG.motivationScore ||
  profilePharma.disposition !== profileCPG.disposition,
  `pharma_biotech vs cpg_fmcg produces different scores (cap: ${profilePharma.responseCapacityScore} vs ${profileCPG.responseCapacityScore}, mot: ${profilePharma.motivationScore} vs ${profileCPG.motivationScore})`
);
console.log(`  pharma_biotech → cap=${profilePharma.responseCapacityScore}, mot=${profilePharma.motivationScore}, disp=${profilePharma.disposition}`);
console.log(`  cpg_fmcg       → cap=${profileCPG.responseCapacityScore}, mot=${profileCPG.motivationScore}, disp=${profileCPG.disposition}`);

// ── SAMPLE PROFILE OUTPUT ──────────────────────────────────────────────────

console.log('\n=== SAMPLE FULL PROFILE ===');
console.log(JSON.stringify(fullProfile, null, 2));

// ── RESULTS ────────────────────────────────────────────────────────────────

console.log(`\n${'='.repeat(50)}`);
console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
console.log(`${'='.repeat(50)}`);

if (failCount === 0) {
  console.log('\n✓ ALL CHECKS PASSED');
  process.exit(0);
} else {
  console.log(`\n✗ ${failCount} CHECKS FAILED`);
  process.exit(1);
}
