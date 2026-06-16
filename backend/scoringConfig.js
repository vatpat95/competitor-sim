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
// How much of capacity comes from financial vs. scale vs. operational factors
export const RESPONSE_CAPACITY_WEIGHTS = {
  financialFirepower: 0.50,  // Financial strength is the foundation
  scale: 0.30,               // Absolute size matters for sustained action
  operationalFlex: 0.20,     // Speed to mobilize is worth 20%
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

// Disposition rollup: how much each factor drives behavioral aggression
export const DISPOSITION_WEIGHTS = {
  priceReactivity: 0.45,  // Price history is the strongest signal
  shareDrive: 0.30,       // Market position trends matter
  rhetoric: 0.25,         // CEO/news language is supportive
};

// ── MOTIVATION ROLLUP (Step 2.3) ──────────────────────────────────────────
// Stakes vs. disposition in overall motivation
export const MOTIVATION_WEIGHTS = {
  stakes: 0.60,       // Exposure drives motivation more than temperament
  disposition: 0.40,  // But disposition shapes how they respond
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
