/**
 * CompetitorSim v2 Scoring Configuration
 *
 * All weights, multipliers, maps, and thresholds used in the v2 scoring model.
 * This file is the single source of truth for all scoring constants.
 * Change a weight here, and it affects all simulations immediately.
 */

export const SCORING_VERSION = 'v2.0';

// ── FINANCIAL FIREPOWER (Step 2.2.1) ──────────────────────────────────────
// Cash position categorical scores
export const CASH_SCORE_MAP = {
  strong: 100,
  moderate: 50,
  weak: 10,
};

// Debt-to-EBITDA penalty: 100 - (debt/EBITDA * multiplier)
export const DEBT_SCORE_MULTIPLIER = 15;

// EBITDA margin conversion: margin * multiplier
export const MARGIN_SCORE_MULTIPLIER = 3;

// Financial Firepower rollup weights
export const FINANCIAL_FIREPOWER_WEIGHTS = {
  cash: 0.40,      // Cash position is the strongest signal
  debt: 0.35,      // Leverage limits response capacity
  margin: 0.25,    // Margin health adds stability
};

// ── SCALE (Step 2.2.2) ───────────────────────────────────────────────────
// Log-scale calculation for absolute revenue size.
// Formula: clamp(0, 100, (log10(annualRevenue) - 1) / 4 * 100)
// Produces: $10M → 0, $1B → 50, $100B → 100
export const SCALE_LOG_OFFSET = 1;
export const SCALE_LOG_DIVISOR = 4;

// ── OPERATIONAL FLEXIBILITY (Step 2.2.3) ─────────────────────────────────
// Base operational flexibility by flexibility level
export const OPS_BASE_MAP = {
  high: 80,
  medium: 50,
  low: 25,
};

// Headcount trend adjustment to operational flexibility
export const OPS_ADJUSTMENT_BY_HEADCOUNT = {
  growing: 10,      // Growing headcount = +10 flexibility
  flat: 0,          // Flat = no change
  shrinking: -10,   // Shrinking = -10 flexibility
};

// ── RESPONSE CAPACITY ROLLUP (Step 2.2) ──────────────────────────────────
// Default weights (used when moveType = 'other' or unknown)
export const RESPONSE_CAPACITY_WEIGHTS_DEFAULT = {
  financialFirepower: 0.50,
  scale: 0.30,
  operationalFlex: 0.20,
};

// moveType-keyed weight tables (Phase 2)
// Rationale: a price war is won on balance-sheet stamina; a product-launch response is an execution-speed problem
export const RESPONSE_CAPACITY_WEIGHTS_BY_MOVE_TYPE = {
  price_cut:          { financialFirepower: 0.55, scale: 0.25, operationalFlex: 0.20 },
  price_increase:     { financialFirepower: 0.55, scale: 0.25, operationalFlex: 0.20 },
  bundle_promo:       { financialFirepower: 0.50, scale: 0.25, operationalFlex: 0.25 },
  product_launch:     { financialFirepower: 0.35, scale: 0.25, operationalFlex: 0.40 },
  market_entry:       { financialFirepower: 0.30, scale: 0.45, operationalFlex: 0.25 },
  capacity_expansion: { financialFirepower: 0.30, scale: 0.40, operationalFlex: 0.30 },
  other:              { financialFirepower: 0.50, scale: 0.30, operationalFlex: 0.20 },
};

// ── RELATIVE FIREPOWER THRESHOLDS (Step 2.2) ──────────────────────────────
export const RELATIVE_FIREPOWER_THRESHOLDS = {
  stronger: 1.25,   // 25% or more more capable = "stronger than you"
  weaker: 0.80,     // 20% or less capable = "weaker than you"
  // Between 0.80 and 1.25 = "evenly matched"
};

// ── MOTIVATION: STAKES / EXPOSURE (Step 2.3.1) ────────────────────────────
// How much of their business your move threatens (0-100)
export const STAKES_SCORE_WEIGHTS = {
  exposureToMove: 0.60,   // Direct revenue exposure is the primary driver
  marketOverlapPct: 0.40, // Geographic/segment overlap matters but less
};

// ── MOTIVATION: DISPOSITION / BEHAVIORAL AGGRESSION (Step 2.3.2) ──────────
// Price move magnitude scaling
export const PRICE_REACTIVITY_MAGNITUDE_MULTIPLIER = 4;

// How much price-move history matters by move type
export const PRICE_RELEVANCE_BY_MOVE_TYPE = {
  price_cut: 1.0,
  price_increase: 1.0,
  bundle_promo: 1.0,
  product_launch: 0.5,
  market_entry: 0.5,
  capacity_expansion: 0.5,
  other: 0.5,
};

// Market share trend baseline aggression
export const SHARE_DRIVE_MAP = {
  gaining: 70,    // Momentum = aggressive push
  stable: 35,     // Stable = moderate
  losing: 55,     // Losing = may fight back hard
};

// Aggression rhetoric scoring
// 0 terms found → 0, 1 term → 40, 2+ terms → 80
export const RHETORIC_THRESHOLDS = {
  none: 0,        // 0 aggression terms
  low: 40,        // 1 aggression term
  high: 80,       // 2+ aggression terms
};

// Aggression keywords
export const AGGRESSION_KEYWORDS = [
  'defend',
  'aggressive',
  'fight',
  'match',
  'won\'t cede',
  'price war',
  'undercut',
  'retaliate',
];

// Disposition rollup defaults (used when moveType = 'other' or unknown)
export const DISPOSITION_WEIGHTS_DEFAULT = {
  priceReactivity: 0.45,
  shareDrive: 0.30,
  rhetoric: 0.25,
};

// moveType-keyed disposition weights
// Rationale: for a product launch, CEO posture predicts counter-launch better than past pricing behavior
export const DISPOSITION_WEIGHTS_BY_MOVE_TYPE = {
  price_cut:          { priceReactivity: 0.55, shareDrive: 0.25, rhetoric: 0.20 },
  price_increase:     { priceReactivity: 0.50, shareDrive: 0.25, rhetoric: 0.25 },
  bundle_promo:       { priceReactivity: 0.45, shareDrive: 0.30, rhetoric: 0.25 },
  product_launch:     { priceReactivity: 0.20, shareDrive: 0.30, rhetoric: 0.50 },
  market_entry:       { priceReactivity: 0.15, shareDrive: 0.35, rhetoric: 0.50 },
  capacity_expansion: { priceReactivity: 0.25, shareDrive: 0.45, rhetoric: 0.30 },
  other:              { priceReactivity: 0.45, shareDrive: 0.30, rhetoric: 0.25 },
};

// ── MOTIVATION ROLLUP (Step 2.3) ──────────────────────────────────────────
// Default stakes vs. disposition weights
export const MOTIVATION_WEIGHTS_DEFAULT = {
  stakes: 0.60,
  disposition: 0.40,
};

// moveType-keyed motivation weights
// Rationale: market_entry is an existential threat — stakes dominate; price_increase may be an umbrella opportunity
export const MOTIVATION_WEIGHTS_BY_MOVE_TYPE = {
  price_cut:          { stakes: 0.65, disposition: 0.35 },
  price_increase:     { stakes: 0.55, disposition: 0.45 },
  bundle_promo:       { stakes: 0.60, disposition: 0.40 },
  product_launch:     { stakes: 0.45, disposition: 0.55 },
  market_entry:       { stakes: 0.70, disposition: 0.30 },
  capacity_expansion: { stakes: 0.55, disposition: 0.45 },
  other:              { stakes: 0.60, disposition: 0.40 },
};

// ── AWARENESS (Step 2.4) ──────────────────────────────────────────────────
// Default visibility by move type
export const MOVE_VISIBILITY_DEFAULTS = {
  price_cut: 'high',
  price_increase: 'high',
  bundle_promo: 'high',
  product_launch: 'high',
  market_entry: 'high',
  capacity_expansion: 'medium',
  other: 'medium',
};

// Awareness score by visibility level
export const AWARENESS_SCORE_MAP = {
  high: 90,
  medium: 65,
  low: 40,
};

// ── CONSTRAINTS & OWNERSHIP MODIFIERS (Step 2.5) ──────────────────────────
// How much regulatory/antitrust/investor constraints dampen response
export const CONSTRAINTS_DAMPENER_MAP = {
  none: 1.0,      // No constraints = full response
  moderate: 0.7,  // Moderate constraints = 70% of potential
  severe: 0.4,    // Severe constraints = only 40% response
};

// Ownership type intensity modifier (PE vs. public vs. family vs. state)
export const OWNERSHIP_INTENSITY_MOD_MAP = {
  public: 1.0,        // Public = full competitive intensity
  pe_backed: 0.85,    // PE-backed = margin-focused, avoids price wars
  family_private: 1.0,
  state_owned: 0.90,  // State-owned = bureaucratic, slightly dampened
};

// State-owned ownership incurs a speed penalty (slower decision-making)
export const OWNERSHIP_SPEED_PENALTY = {
  public: false,
  pe_backed: false,
  family_private: false,
  state_owned: true,
};

// ── RESPONSE PROFILE THRESHOLDS (Step 2.7) ────────────────────────────────
// Likelihood cap when capacity is very low
export const RESPONSE_LIKELIHOOD_CAPACITY_CAP = {
  threshold: 25,  // If capacity < 25, cap likelihood at 50
  cap: 50,
};

// Response speed logic thresholds
export const RESPONSE_SPEED_THRESHOLDS = {
  fast_disposition: 60,     // Disposition must be > 60 for "fast"
  fast_capacity: 50,        // Capacity must be > 50 for "fast"
  slow_capacity: 35,        // Capacity < 35 forces "slow"
};

// Confidence calculation: % of optional fields populated
// Used in Phase 4+ when we can add frontend inputs
export const OPTIONAL_FIELDS_FOR_CONFIDENCE = [
  'annualRevenue',
  'ownershipType',
  'operationalFlexibility',
  'switchingFriction',
  'exposureToMove',
  'marketOverlapPct',
  'responseConstraintLevel',
];

// ── STRATEGIC INTENT VECTOR KEYWORDS (Step 2.6 Fallback) ────────────────────
// Keywords for growth maximizer intent
export const GROWTH_KEYWORDS = ['share', 'growth', 'volume', 'market', 'expand', 'acquisition'];

// Keywords for margin defender intent
export const MARGIN_KEYWORDS = ['margin', 'profit', 'profitability', 'return', 'yield', 'earnings'];

// Keywords for niche player intent
export const NICHE_KEYWORDS = ['focus', 'segment', 'specific', 'rural', 'premium', 'boutique', 'specialized'];

// Keywords for innovation / differentiation intent
export const INNOVATION_KEYWORDS = ['innovate', 'innovation', 'premium', 'quality', 'experience', 'features', 'differentiate', 'technology'];

// Negation words that cancel keyword matches (within ~4 words before the keyword)
export const NEGATION_WORDS = ['not', 'won\'t', 'won\'t', 'doesn\'t', 'don\'t', 'rather than', 'instead of', 'avoid'];

// ── TEXT ANALYSIS CONSTANTS ───────────────────────────────────────────────
// How many words to look back for negation
export const NEGATION_LOOKAHEAD_WORDS = 4;

// ── PROSE SUMMARY CONFIDENCE LEVELS ──────────────────────────────────────
// Used to label confidence in the Predicted Reaction Profile
export const CONFIDENCE_LABELS = {
  high: { threshold: 80, label: 'High' },
  medium: { threshold: 50, label: 'Medium' },
  low: { threshold: 0, label: 'Low' },
};

// ── INDUSTRY WEIGHT MODIFIERS (Phase 2) ───────────────────────────────────
// Multipliers applied to each weight component AFTER moveType lookup.
// After applying, weights within each group are re-normalized to sum to 1.0.
// Default (all 1.0) = identical to pure moveType table.
// Keys match frontend INDUSTRY_OPTIONS values.
export const INDUSTRY_WEIGHT_MODIFIERS = {
  // Pharma: cash/R&D signal critical; price reactivity less behavioral (regulated)
  pharma_biotech:     { financialFirepower: 1.3, scale: 1.0, operationalFlex: 1.0, stakes: 1.0, disposition: 1.0, priceReactivity: 0.5, shareDrive: 1.0, rhetoric: 1.5 },
  // Telecom: scale dominates (network effects, infrastructure); ops less relevant
  telecom:            { financialFirepower: 1.0, scale: 1.3, operationalFlex: 0.8, stakes: 1.0, disposition: 1.0, priceReactivity: 1.0, shareDrive: 1.1, rhetoric: 1.0 },
  // Retail/FMCG: high price elasticity, thin margins make stakes more direct
  retail_ecommerce:   { financialFirepower: 1.0, scale: 1.0, operationalFlex: 1.1, stakes: 1.2, disposition: 1.0, priceReactivity: 1.3, shareDrive: 1.0, rhetoric: 0.9 },
  // CPG: similar to retail — price moves are direct and impactful
  cpg_fmcg:           { financialFirepower: 1.0, scale: 1.1, operationalFlex: 1.0, stakes: 1.1, disposition: 1.0, priceReactivity: 1.2, shareDrive: 1.1, rhetoric: 0.9 },
  // SaaS/software: operational speed matters; switching friction is structural
  saas_software:      { financialFirepower: 1.0, scale: 0.9, operationalFlex: 1.4, stakes: 1.0, disposition: 1.0, priceReactivity: 0.9, shareDrive: 1.0, rhetoric: 1.1 },
  // Financial services: regulatory context dampens rhetoric signal; compliance constraints real
  financial_services: { financialFirepower: 1.2, scale: 1.1, operationalFlex: 0.9, stakes: 1.0, disposition: 1.0, priceReactivity: 0.8, shareDrive: 1.0, rhetoric: 0.7 },
  // Energy/utilities: capex-intensive so scale matters; many state-adjacent so speed penalty common
  energy_utilities:   { financialFirepower: 1.1, scale: 1.2, operationalFlex: 0.8, stakes: 1.0, disposition: 1.0, priceReactivity: 0.9, shareDrive: 1.0, rhetoric: 0.9 },
  // Industrials/manufacturing: operational capacity central; financial endurance matters
  industrials_manufacturing: { financialFirepower: 1.1, scale: 1.1, operationalFlex: 1.1, stakes: 1.0, disposition: 1.0, priceReactivity: 1.0, shareDrive: 1.0, rhetoric: 0.9 },
  // Healthcare: similar to pharma but less R&D intensive
  healthcare:         { financialFirepower: 1.2, scale: 1.0, operationalFlex: 1.0, stakes: 1.0, disposition: 1.0, priceReactivity: 0.7, shareDrive: 1.0, rhetoric: 1.2 },
  // Media/entertainment: rhetoric and narrative matter; share trends very relevant
  media_entertainment: { financialFirepower: 1.0, scale: 1.0, operationalFlex: 1.1, stakes: 1.0, disposition: 1.0, priceReactivity: 0.8, shareDrive: 1.2, rhetoric: 1.3 },
  // Logistics/transport: ops and scale dominate; price reactivity moderate
  logistics_transport: { financialFirepower: 1.0, scale: 1.2, operationalFlex: 1.2, stakes: 1.0, disposition: 1.0, priceReactivity: 1.0, shareDrive: 1.0, rhetoric: 0.9 },
  // Real estate: financial firepower dominant (capital intensive); slow ops
  real_estate:        { financialFirepower: 1.3, scale: 1.1, operationalFlex: 0.7, stakes: 1.0, disposition: 1.0, priceReactivity: 0.8, shareDrive: 1.0, rhetoric: 0.9 },
  // Education/ed-tech: ops speed matters (software-like); share trend signals commitment
  education_edtech:   { financialFirepower: 1.0, scale: 0.9, operationalFlex: 1.2, stakes: 1.0, disposition: 1.0, priceReactivity: 0.9, shareDrive: 1.1, rhetoric: 1.1 },
  // Default/other: all 1.0 — pure moveType table
  other:              { financialFirepower: 1.0, scale: 1.0, operationalFlex: 1.0, stakes: 1.0, disposition: 1.0, priceReactivity: 1.0, shareDrive: 1.0, rhetoric: 1.0 },
};
