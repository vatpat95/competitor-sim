import { useState } from 'react'

const COMPETITOR_TYPE_OPTIONS = [
  { value: 'low_cost_challenger', label: 'Low-cost Challenger' },
  { value: 'incumbent_leader',    label: 'Incumbent / Market Leader' },
  { value: 'premium_brand',       label: 'Premium Brand' },
  { value: 'regional_player',     label: 'Regional / Niche Player' },
  { value: 'fast_follower',       label: 'Fast Follower' },
  { value: 'disruptor',           label: 'Disruptor / New Entrant' },
]

// ── v2 Score computation (mirrors backend profileBuilderV2.js + scoringConfig.js) ─
// Keep this in sync with the backend — CLAUDE.md notes the live scorecard and the
// API response must agree on these formulas.

const AGGRESSION_KEYWORDS = ['defend', 'aggressive', 'fight', 'match', "won't cede", 'price war', 'undercut', 'retaliate']
const GROWTH_KEYWORDS = ['share', 'growth', 'volume', 'market', 'expand', 'acquisition']
const MARGIN_KEYWORDS = ['margin', 'profit', 'profitability', 'return', 'yield', 'earnings']
const NICHE_KEYWORDS = ['focus', 'segment', 'specific', 'rural', 'premium', 'boutique', 'specialized']
const INNOVATION_KEYWORDS = ['innovate', 'innovation', 'premium', 'quality', 'experience', 'features', 'differentiate', 'technology']
const NEGATION_WORDS = ['not', "won't", "doesn't", "don't", 'rather than', 'instead of', 'avoid']

const PRICE_RELEVANCE_BY_MOVE_TYPE = {
  price_cut: 1.0, price_increase: 1.0, bundle_promo: 1.0,
  product_launch: 0.5, market_entry: 0.5, capacity_expansion: 0.5, other: 0.5,
}
const SHARE_DRIVE_MAP = { gaining: 70, stable: 35, losing: 55 }
const OPS_BASE_MAP = { high: 80, medium: 50, low: 25 }
const OPS_ADJ_BY_HEADCOUNT = { growing: 10, flat: 0, shrinking: -10 }
const CONSTRAINTS_DAMPENER_MAP = { none: 1.0, moderate: 0.7, severe: 0.4 }
const OWNERSHIP_INTENSITY_MOD_MAP = { public: 1.0, pe_backed: 0.85, family_private: 1.0, state_owned: 0.90 }
const OWNERSHIP_SPEED_PENALTY = { public: false, pe_backed: false, family_private: false, state_owned: true }
const MOVE_VISIBILITY_DEFAULTS = {
  price_cut: 'high', price_increase: 'high', bundle_promo: 'high',
  product_launch: 'high', market_entry: 'high', capacity_expansion: 'medium', other: 'medium',
}
const AWARENESS_SCORE_MAP = { high: 90, medium: 65, low: 40 }

function clamp(lo, hi, v) { return Math.max(lo, Math.min(hi, v)) }
function round1(v) { return Math.round(v * 10) / 10 }

function scoreRhetoric(text) {
  if (!text) return 0
  const lower = text.toLowerCase()
  const count = AGGRESSION_KEYWORDS.filter(kw => lower.includes(kw)).length
  if (count >= 2) return 80
  if (count === 1) return 40
  return 0
}

function scoreIntentDimension(lower, keywords) {
  let score = 0
  for (const kw of keywords) {
    const idx = lower.indexOf(kw.toLowerCase())
    if (idx === -1) continue
    const before = lower.substring(Math.max(0, idx - 50), idx)
    const words = before.split(/\s+/).slice(-4)
    const negated = NEGATION_WORDS.some(neg => words.some(w => w.includes(neg)))
    if (!negated) score += 25
  }
  return clamp(0, 100, score)
}

function scoreStrategicIntent(ceoPriorityStatement, recentNewsSignals) {
  const text = `${ceoPriorityStatement || ''} ${(recentNewsSignals || []).join(' ')}`
  const lower = text.toLowerCase()
  return {
    growthMaximizer: scoreIntentDimension(lower, GROWTH_KEYWORDS),
    marginDefender: scoreIntentDimension(lower, MARGIN_KEYWORDS),
    nichePlayer: scoreIntentDimension(lower, NICHE_KEYWORDS),
    innovationBetter: scoreIntentDimension(lower, INNOVATION_KEYWORDS),
  }
}

function calcResponseCapacity(c) {
  const cashScoreMap = { strong: 100, moderate: 50, weak: 10 }
  const cashScore = cashScoreMap[c.cashPosition] ?? 50
  const debtScore = clamp(0, 100, 100 - (c.debtToEbitda || 0) * 15)
  const marginScore = clamp(0, 100, (c.ebitdaMargin || 0) * 3)
  const financialFirepower = cashScore * 0.40 + debtScore * 0.35 + marginScore * 0.25

  const annualRevenue = c.annualRevenue
  const scale = (annualRevenue === null || annualRevenue === undefined || annualRevenue === 0)
    ? 50
    : clamp(0, 100, ((Math.log10(annualRevenue) - 1) / 4) * 100)

  const opsBase = OPS_BASE_MAP[c.operationalFlexibility] ?? OPS_BASE_MAP.medium
  const opsAdj = OPS_ADJ_BY_HEADCOUNT[c.headcountTrend] ?? 0
  const operationalFlex = clamp(0, 100, opsBase + opsAdj)

  return round1(financialFirepower * 0.50 + scale * 0.30 + operationalFlex * 0.20)
}

function calcMotivation(c, moveType) {
  const exposureToMove = c.exposureToMove ?? 50
  const marketOverlapPct = c.marketOverlapPct ?? 70
  const stakesScore = exposureToMove * 0.60 + marketOverlapPct * 0.40

  const moves = (c.lastThreePriceMoves || []).filter(m => m.direction !== 'hold')
  const rawPriceReactivity = moves.length > 0
    ? clamp(0, 100, (moves.reduce((s, m) => s + (m.magnitude || 0), 0) / moves.length) * 4)
    : 0
  const priceRelevance = PRICE_RELEVANCE_BY_MOVE_TYPE[moveType] ?? 0.5
  const priceReactivity = rawPriceReactivity * priceRelevance

  const shareDrive = SHARE_DRIVE_MAP[c.marketShareTrend] ?? SHARE_DRIVE_MAP.stable
  const rhetoric = scoreRhetoric(`${c.ceoPriorityStatement || ''} ${(c.recentNewsSignals || []).join(' ')}`)

  const disposition = priceReactivity * 0.45 + shareDrive * 0.30 + rhetoric * 0.25
  const motivationScore = stakesScore * 0.60 + disposition * 0.40

  return { stakesScore: round1(stakesScore), disposition: round1(disposition), motivationScore: round1(motivationScore) }
}

function calcAwareness(moveType, moveVisibility) {
  const effectiveVisibility = moveVisibility || (MOVE_VISIBILITY_DEFAULTS[moveType] ?? 'high')
  return AWARENESS_SCORE_MAP[effectiveVisibility] ?? AWARENESS_SCORE_MAP.medium
}

/**
 * Computes the full v2 score set for the live scorecard, mirroring
 * backend/profileBuilderV2.js. yourCompany is optional — if absent,
 * relative firepower defaults to "evenly matched".
 */
function computeScores(c, yourCompany = {}) {
  const moveType = yourCompany?.moveType || 'price_cut'

  const responseCapacityScore = calcResponseCapacity(c)
  const yourCapacityScore = yourCompany?.name ? calcResponseCapacity(yourCompany) : 50
  const relativeFirepowerRatio = round1(responseCapacityScore / Math.max(yourCapacityScore, 1))
  const relativeLabel =
    relativeFirepowerRatio >= 1.25 ? 'stronger than you'
    : relativeFirepowerRatio <= 0.80 ? 'weaker than you'
    : 'evenly matched'

  const { stakesScore, disposition, motivationScore } = calcMotivation(c, moveType)
  const awarenessScore = calcAwareness(moveType, yourCompany?.moveVisibility)
  const awarenessFactor = awarenessScore / 100

  const constraintsDampener = CONSTRAINTS_DAMPENER_MAP[c.responseConstraintLevel] ?? 1.0
  const ownershipIntensityMod = OWNERSHIP_INTENSITY_MOD_MAP[c.ownershipType] ?? 1.0
  const ownershipSpeedPenalty = OWNERSHIP_SPEED_PENALTY[c.ownershipType] ?? false

  const intent = scoreStrategicIntent(c.ceoPriorityStatement, c.recentNewsSignals)

  let responseLikelihood = round1(motivationScore * awarenessFactor)
  if (responseCapacityScore < 25) responseLikelihood = Math.min(responseLikelihood, 50)

  const responseIntensity = round1(Math.min(motivationScore, responseCapacityScore) * constraintsDampener * ownershipIntensityMod)

  let responseSpeed = 'moderate'
  if (disposition > 60 && responseCapacityScore > 50 && !ownershipSpeedPenalty) responseSpeed = 'fast'
  else if (responseCapacityScore < 35 || ownershipSpeedPenalty || c.switchingFriction === 'high') responseSpeed = 'slow'

  const exposureToMove = c.exposureToMove ?? 50
  const vectors = []
  if (exposureToMove < 30) {
    vectors.push('Ignore / monitor only')
  } else {
    if (c.responseConstraintLevel === 'severe') vectors.push('Constrained — limited or non-price response')
    const priceMoveTypes = ['price_cut', 'price_increase', 'bundle_promo']
    if (intent.marginDefender > intent.growthMaximizer && priceMoveTypes.includes(moveType)) vectors.push('Hold price, defend on value / non-price levers')
    if (intent.growthMaximizer > 40 && responseCapacityScore > 55 && priceMoveTypes.includes(moveType)) vectors.push('Match or undercut on price')
    if (intent.innovationBetter > intent.growthMaximizer && intent.innovationBetter > intent.marginDefender) vectors.push('Differentiate via product / features')
    if (c.regulatoryConstraints && moveType === 'price_cut') vectors.push('Possible legal / regulatory response')
  }
  if (vectors.length === 0) vectors.push('Measured competitive response')

  return {
    responseCapacityScore,
    relativeFirepowerRatio,
    relativeLabel,
    motivationScore,
    stakesScore,
    awarenessScore,
    intent,
    predictedReactionProfile: {
      responseLikelihood,
      responseSpeed,
      responseIntensity,
      likelyResponseVectors: vectors,
    },
  }
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3 first:mt-0">
      <div className="w-1 h-4 rounded-full" style={{ background: '#0ea5e9' }} />
      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4a7fa5' }}>{title}</h3>
    </div>
  )
}

function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      {children}
    </div>
  )
}

const sharedInputCls = 'w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors'

function NumInput({ value, onChange, step = 0.1, min = 0, placeholder = '0' }) {
  return (
    <input
      type="number"
      value={value === 0 ? '' : value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      step={step}
      min={min}
      placeholder={placeholder}
      className={sharedInputCls}
    />
  )
}

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #374151' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'flex-1 py-2 text-sm font-medium transition-colors',
            value === opt.value ? opt.activeClass : 'text-gray-500 hover:text-gray-300',
          ].join(' ')}
          style={value !== opt.value ? { background: '#111827' } : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Score interpretation helpers ──────────────────────────────────────────────

function capTier(v) {
  if (v >= 70) return { label: 'High', sub: 'Can fund aggressive or sustained competitive moves', color: 'text-green-600', bar: 'bg-green-500' }
  if (v >= 40) return { label: 'Moderate', sub: 'Can respond selectively — cannot sustain a prolonged price war', color: 'text-amber-600', bar: 'bg-amber-500' }
  return { label: 'Low', sub: 'Constrained — likely limited to defensive or low-cost responses only', color: 'text-red-600', bar: 'bg-red-500' }
}

function motivationTier(v) {
  if (v >= 65) return { label: 'Highly motivated', sub: 'This move threatens what matters to them — expect a forceful response', color: 'text-red-600', bar: 'bg-red-500' }
  if (v >= 40) return { label: 'Moderately motivated', sub: 'Worth watching — may warrant a measured response', color: 'text-amber-600', bar: 'bg-amber-500' }
  return { label: 'Low motivation', sub: 'Not a priority threat — likely to hold position', color: 'text-blue-600', bar: 'bg-blue-400' }
}

function speedTier(speed) {
  if (speed === 'fast') return { label: 'Fast', color: 'text-red-600' }
  if (speed === 'slow') return { label: 'Slow', color: 'text-blue-600' }
  return { label: 'Moderate', color: 'text-amber-600' }
}

const INTENT_META = {
  growthMaximizer:  { label: 'Market share focus',   desc: 'Prioritises volume and growth over margins',          color: 'bg-blue-500' },
  marginDefender:   { label: 'Margin protection',    desc: 'Protects profitability — resists price erosion',       color: 'bg-green-500' },
  nichePlayer:      { label: 'Niche / segment focus', desc: 'Avoids broad battles — defends specific segments',    color: 'bg-purple-500' },
  innovationBetter: { label: 'Product differentiation', desc: 'Competes on features and quality, not price',       color: 'bg-indigo-500' },
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ScoreBar({ value, colorClass = 'bg-blue-500', showPct = false }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${Math.min(100, showPct ? value * 100 : value)}%` }}
      />
    </div>
  )
}

// ── Live score card ───────────────────────────────────────────────────────────

function LiveScoreCard({ scores }) {
  const {
    responseCapacityScore, relativeFirepowerRatio, relativeLabel,
    motivationScore, intent, predictedReactionProfile,
  } = scores
  const cap = capTier(responseCapacityScore)
  const mot = motivationTier(motivationScore)
  const spd = speedTier(predictedReactionProfile.responseSpeed)

  // Find dominant intent — note: v2 intent dimensions are independent 0–100, not normalized to 100%
  const topIntent = Object.entries(intent).sort(([,a],[,b]) => b - a)[0]
  const topMeta = INTENT_META[topIntent?.[0]] ?? {}
  const intentMax = Math.max(...Object.values(intent), 1)

  return (
    <div className="sticky top-6 rounded-xl overflow-hidden" style={{ background: '#0f172a', border: '1px solid #1e3a5f' }}>
      <div className="px-4 pt-4 pb-2" style={{ borderBottom: '1px solid #1e3a5f' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#4a7fa5' }}>Live Scoring</h3>
      </div>

      {/* Relative firepower */}
      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #1e3a5f', background: '#0b1220' }}>
        <span className="text-xs font-medium text-gray-500">Relative to your company</span>
        <p className="text-sm font-semibold text-gray-200 mt-0.5">{relativeLabel} <span className="text-xs text-gray-500 font-normal">({relativeFirepowerRatio.toFixed(2)}×)</span></p>
      </div>

      {/* Response Capacity */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e3a5f' }}>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">Response capacity</span>
          <span className="text-xs font-bold text-gray-300">{responseCapacityScore.toFixed(0)}/100</span>
        </div>
        <ScoreBar value={responseCapacityScore} colorClass={cap.bar} />
        <div className="mt-1.5">
          <span className={`text-xs font-semibold ${cap.color}`}>{cap.label}</span>
          <p className="text-xs text-gray-500 leading-snug mt-0.5">{cap.sub}</p>
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1.5">
          <span>0 — Can't compete</span>
          <span>100 — Deep pockets</span>
        </div>
      </div>

      {/* Motivation */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e3a5f' }}>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">Motivated to respond?</span>
          <span className="text-xs font-bold text-gray-300">{motivationScore.toFixed(0)}/100</span>
        </div>
        <ScoreBar value={motivationScore} colorClass={mot.bar} />
        <div className="mt-1.5">
          <span className={`text-xs font-semibold ${mot.color}`}>{mot.label}</span>
          <p className="text-xs text-gray-500 leading-snug mt-0.5">{mot.sub}</p>
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1.5">
          <span>0 — Indifferent</span>
          <span>100 — Highly threatened</span>
        </div>
      </div>

      {/* Predicted Reaction Profile */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e3a5f' }}>
        <p className="text-xs font-medium text-gray-500 mb-2">Predicted reaction</p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <p className="text-[10px] text-gray-600">Likelihood</p>
            <p className="text-sm font-bold text-gray-200">{predictedReactionProfile.responseLikelihood.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-600">Speed</p>
            <p className={`text-sm font-bold ${spd.color}`}>{spd.label}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-600">Intensity</p>
            <p className="text-sm font-bold text-gray-200">{predictedReactionProfile.responseIntensity.toFixed(0)}</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-600 mb-1">Most likely approach</p>
        <div className="flex flex-col gap-1">
          {predictedReactionProfile.likelyResponseVectors.map((v, i) => (
            <span key={i} className="text-xs text-gray-300 px-2 py-1 rounded" style={{ background: '#111827' }}>{v}</span>
          ))}
        </div>
      </div>

      {/* Strategic Intent */}
      <div className="px-4 py-3">
        <p className="text-xs font-medium text-gray-500 mb-2.5">How they compete</p>
        {Object.entries(intent)
          .sort(([,a],[,b]) => b - a)
          .map(([key, val]) => {
            const meta = INTENT_META[key]
            const isTop = key === topIntent?.[0]
            return (
              <div key={key} className="mb-2.5">
                <div className="flex items-baseline justify-between mb-1">
                  <span className={`text-xs ${isTop ? 'font-semibold text-gray-200' : 'text-gray-500'}`}>
                    {meta.label}
                  </span>
                  <span className={`text-xs font-bold ${isTop ? 'text-gray-100' : 'text-gray-600'}`}>{val.toFixed(0)}/100</span>
                </div>
                <ScoreBar value={val} colorClass={meta.color} />
                {isTop && (
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{meta.desc}</p>
                )}
              </div>
            )
          })}
        <p className="text-[10px] text-gray-600 mt-2 leading-snug">
          Each dimension is scored independently — a competitor can be high on more than one.
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CompetitorProfileForm({ competitor, onChange, index, yourCompany }) {
  function update(key, value) {
    onChange(index, { ...competitor, [key]: value })
  }

  function updateMove(i, key, value) {
    const moves = [...(competitor.lastThreePriceMoves || [])]
    moves[i] = { ...moves[i], [key]: value }
    if (key === 'direction' && value === 'hold') moves[i].magnitude = 0
    update('lastThreePriceMoves', moves)
  }

  function addMove() {
    if ((competitor.lastThreePriceMoves || []).length >= 3) return
    update('lastThreePriceMoves', [
      ...(competitor.lastThreePriceMoves || []),
      { direction: 'down', magnitude: 0, context: '' },
    ])
  }

  function removeMove(i) {
    const moves = (competitor.lastThreePriceMoves || []).filter((_, idx) => idx !== i)
    update('lastThreePriceMoves', moves)
  }

  function updateSignal(i, value) {
    const signals = [...(competitor.recentNewsSignals || [])]
    signals[i] = value
    update('recentNewsSignals', signals)
  }

  function addSignal() {
    if ((competitor.recentNewsSignals || []).length >= 5) return
    update('recentNewsSignals', [...(competitor.recentNewsSignals || []), ''])
  }

  function removeSignal(i) {
    update('recentNewsSignals', (competitor.recentNewsSignals || []).filter((_, idx) => idx !== i))
  }

  const scores = computeScores(competitor, yourCompany)
  const moves = competitor.lastThreePriceMoves || []
  const signals = competitor.recentNewsSignals || []

  return (
    <div className="flex gap-6">
      {/* ── Form ── */}
      <div className="flex-1 min-w-0">
        {/* Competitor name + type */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <FieldRow label="Competitor name">
            <input
              type="text"
              value={competitor.name || ''}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. ValueNet"
              className={sharedInputCls}
            />
          </FieldRow>
          <FieldRow label="Competitor type (optional)">
            <select
              value={competitor.competitorType || ''}
              onChange={e => update('competitorType', e.target.value)}
              className={sharedInputCls + ' cursor-pointer'}
              style={{ background: '#111827', border: '1px solid #374151' }}
            >
              <option value="">Select type...</option>
              {COMPETITOR_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FieldRow>
        </div>

        {/* Section 1 — Financial health */}
        <SectionHeader title="Financial Health" />

        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Revenue growth rate (%)">
            <NumInput value={competitor.revenueGrowthRate} onChange={v => update('revenueGrowthRate', v)} />
          </FieldRow>
          <FieldRow label="EBITDA margin (%)">
            <NumInput value={competitor.ebitdaMargin} onChange={v => update('ebitdaMargin', v)} />
          </FieldRow>
          <FieldRow label="Debt-to-EBITDA">
            <NumInput value={competitor.debtToEbitda} onChange={v => update('debtToEbitda', v)} />
          </FieldRow>
          <FieldRow label="R&D spend (% of revenue)">
            <NumInput value={competitor.rdSpendPct} onChange={v => update('rdSpendPct', v)} />
          </FieldRow>
        </div>

        <FieldRow label="Cash position">
          <ToggleGroup
            value={competitor.cashPosition}
            onChange={v => update('cashPosition', v)}
            options={[
              { value: 'strong',   label: 'Strong',   activeClass: 'bg-emerald-900 text-emerald-300 font-semibold' },
              { value: 'moderate', label: 'Moderate', activeClass: 'bg-amber-900 text-amber-300 font-semibold' },
              { value: 'weak',     label: 'Weak',     activeClass: 'bg-red-900 text-red-300 font-semibold' },
            ]}
          />
        </FieldRow>

        {/* Section 2 — Pricing behavior */}
        <SectionHeader title="Pricing Behavior (most recent first)" />

        {moves.length === 0 && (
          <p className="text-sm text-gray-600 mb-3">No price moves added yet.</p>
        )}

        {moves.map((move, i) => (
          <div key={i} className="flex gap-2 mb-2 items-start">
            <select
              value={move.direction}
              onChange={e => updateMove(i, 'direction', e.target.value)}
              className="px-2 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-200"
              style={{ background: '#111827', border: '1px solid #374151' }}
            >
              <option value="down">Price cut</option>
              <option value="hold">Price hold</option>
              <option value="up">Price increase</option>
            </select>
            <input
              type="number"
              value={move.magnitude === 0 ? '' : move.magnitude}
              onChange={e => updateMove(i, 'magnitude', parseFloat(e.target.value) || 0)}
              disabled={move.direction === 'hold'}
              placeholder="% mag"
              step="0.1"
              min="0"
              className="w-20 px-2 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-200"
              style={{ background: move.direction === 'hold' ? '#0d1117' : '#111827', border: '1px solid #374151', color: move.direction === 'hold' ? '#4b5563' : undefined }}
            />
            <input
              type="text"
              value={move.context}
              onChange={e => updateMove(i, 'context', e.target.value)}
              placeholder="Brief context"
              className="flex-1 px-2 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-200 placeholder-gray-600"
              style={{ background: '#111827', border: '1px solid #374151' }}
            />
            <button
              type="button"
              onClick={() => removeMove(i)}
              className="px-2 py-2 text-gray-600 hover:text-red-400 transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        ))}

        {moves.length < 3 && (
          <button
            type="button"
            onClick={addMove}
            className="text-sm font-medium mt-1 transition-colors"
            style={{ color: '#0ea5e9' }}
          >
            + Add move
          </button>
        )}

        {/* Section 3 — Market position */}
        <SectionHeader title="Market Position" />

        <FieldRow label="Market share trend">
          <ToggleGroup
            value={competitor.marketShareTrend}
            onChange={v => update('marketShareTrend', v)}
            options={[
              { value: 'gaining', label: 'Gaining', activeClass: 'bg-emerald-900 text-emerald-300 font-semibold' },
              { value: 'stable',  label: 'Stable',  activeClass: 'bg-sky-900 text-sky-300 font-semibold' },
              { value: 'losing',  label: 'Losing',  activeClass: 'bg-red-900 text-red-300 font-semibold' },
            ]}
          />
        </FieldRow>

        <FieldRow label="Headcount trend">
          <ToggleGroup
            value={competitor.headcountTrend}
            onChange={v => update('headcountTrend', v)}
            options={[
              { value: 'growing',   label: 'Growing',   activeClass: 'bg-emerald-900 text-emerald-300 font-semibold' },
              { value: 'flat',      label: 'Flat',      activeClass: 'bg-sky-900 text-sky-300 font-semibold' },
              { value: 'shrinking', label: 'Shrinking', activeClass: 'bg-red-900 text-red-300 font-semibold' },
            ]}
          />
        </FieldRow>

        <FieldRow label="Geographic focus">
          <input
            type="text"
            value={competitor.geographicFocus || ''}
            onChange={e => update('geographicFocus', e.target.value)}
            placeholder="e.g. North America, expanding EMEA"
            className={sharedInputCls}
          />
        </FieldRow>

        {/* Section 4 — Qualitative signals */}
        <SectionHeader title="Qualitative Signals" />

        <FieldRow label="CEO priority statement">
          <textarea
            value={competitor.ceoPriorityStatement || ''}
            onChange={e => update('ceoPriorityStatement', e.target.value)}
            rows={4}
            placeholder="Paste or paraphrase from their last earnings call or investor day"
            className={`${sharedInputCls} resize-none`}
          />
        </FieldRow>

        <FieldRow label="Recent news, hires, filings, or strategic announcements">
          {signals.map((signal, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={signal}
                onChange={e => updateSignal(i, e.target.value)}
                placeholder={`Signal ${i + 1}`}
                className={`flex-1 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-200 placeholder-gray-600`}
                style={{ background: '#111827', border: '1px solid #374151' }}
              />
              <button
                type="button"
                onClick={() => removeSignal(i)}
                className="px-2 text-gray-600 hover:text-red-400 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          ))}
          {signals.length < 5 && (
            <button
              type="button"
              onClick={addSignal}
              className="text-sm font-medium transition-colors"
              style={{ color: '#0ea5e9' }}
            >
              + Add signal
            </button>
          )}
        </FieldRow>

        <FieldRow label="Regulatory constraints (optional)">
          <textarea
            value={competitor.regulatoryConstraints || ''}
            onChange={e => update('regulatoryConstraints', e.target.value)}
            rows={2}
            placeholder="Any regulatory, legal, or structural limits on their competitive response"
            className={`${sharedInputCls} resize-none`}
          />
        </FieldRow>

        {/* v2 — Advanced / optional fields, collapsed by default to keep the form simple */}
        <AdvancedSection competitor={competitor} update={update} />
      </div>

      {/* ── Live score card ── */}
      <div className="w-56 shrink-0">
        <LiveScoreCard scores={scores} />
      </div>
    </div>
  )
}

// ── v2 Advanced / optional section ────────────────────────────────────────────

function SliderField({ label, value, onChange, hint }) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-xs font-semibold text-gray-400">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-sky-500"
      />
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
  )
}

const CONSTRAINT_CHIP_LABEL = { none: 'No constraints', moderate: 'Moderate constraints', severe: 'Severe constraints' }
const FLEX_CHIP_LABEL = { high: 'High flex', medium: 'Medium flex', low: 'Low flex' }
const FRICTION_CHIP_LABEL = { high: 'High friction', medium: 'Medium friction', low: 'Low friction' }

function SummaryChip({ children, highlight }) {
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{
        background: highlight ? '#1c1400' : '#1f2937',
        color: highlight ? '#fbbf24' : '#9ca3af',
        border: `1px solid ${highlight ? '#78350f' : '#374151'}`,
      }}
    >
      {children}
    </span>
  )
}

function AdvancedSection({ competitor, update }) {
  const [open, setOpen] = useState(false)

  const exposure = competitor.exposureToMove ?? 50
  const overlap = competitor.marketOverlapPct ?? 70
  const opsFlex = competitor.operationalFlexibility || 'medium'
  const friction = competitor.switchingFriction || 'medium'
  const constraint = competitor.responseConstraintLevel || 'none'

  // Highlight values that differ from the defaults — these are the ones a user has actually
  // gone in and judgment-tuned, vs. fields still sitting on the flat default assumption.
  const isDefault = exposure === 50 && overlap === 70 && opsFlex === 'medium' && friction === 'medium' && constraint === 'none'

  return (
    <div className="mt-5 rounded-lg overflow-hidden" style={{ border: '1px solid #1f2937' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
        style={{ background: '#0d1117' }}
      >
        <span>Advanced / optional <span className="text-xs text-gray-600 font-normal ml-2">Sharpens the prediction — not required to run</span></span>
        <span className="text-gray-600">{open ? '▲' : '▼'}</span>
      </button>

      {!open && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5" style={{ background: '#0d1117', borderTop: '1px solid #1f2937' }}>
          <SummaryChip highlight={exposure !== 50}>Exposure {exposure}%</SummaryChip>
          <SummaryChip highlight={overlap !== 70}>Overlap {overlap}%</SummaryChip>
          <SummaryChip highlight={opsFlex !== 'medium'}>{FLEX_CHIP_LABEL[opsFlex]}</SummaryChip>
          <SummaryChip highlight={friction !== 'medium'}>{FRICTION_CHIP_LABEL[friction]}</SummaryChip>
          <SummaryChip highlight={constraint !== 'none'}>{CONSTRAINT_CHIP_LABEL[constraint]}</SummaryChip>
          {isDefault && (
            <span className="text-[11px] text-gray-600 ml-1">— all on defaults, click to tune</span>
          )}
        </div>
      )}

      {open && (
        <div className="px-4 py-4" style={{ background: '#111827', borderTop: '1px solid #1f2937' }}>
          <FieldRow label="Exposure to this move">
            <SliderField
              label=""
              value={competitor.exposureToMove ?? 50}
              onChange={v => update('exposureToMove', v)}
              hint="% of their revenue this move actually threatens. The single biggest driver of whether they respond."
            />
          </FieldRow>

          <FieldRow label="Market overlap">
            <SliderField
              label=""
              value={competitor.marketOverlapPct ?? 70}
              onChange={v => update('marketOverlapPct', v)}
              hint="How much they compete in your markets/segments."
            />
          </FieldRow>

          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Annual revenue ($M)">
              <input
                type="number"
                value={competitor.annualRevenue ?? ''}
                onChange={e => update('annualRevenue', e.target.value === '' ? null : parseFloat(e.target.value))}
                placeholder="Unknown"
                step="1"
                className={sharedInputCls}
              />
            </FieldRow>
            <FieldRow label="Ownership type">
              <select
                value={competitor.ownershipType || 'public'}
                onChange={e => update('ownershipType', e.target.value)}
                className={sharedInputCls + ' cursor-pointer'}
                style={{ background: '#0d1117', border: '1px solid #374151' }}
              >
                <option value="public">Public</option>
                <option value="pe_backed">PE-backed</option>
                <option value="family_private">Family / private</option>
                <option value="state_owned">State-owned</option>
              </select>
            </FieldRow>
          </div>

          <FieldRow label="Operational flexibility">
            <ToggleGroup
              value={competitor.operationalFlexibility || 'medium'}
              onChange={v => update('operationalFlexibility', v)}
              options={[
                { value: 'high',   label: 'High',   activeClass: 'bg-emerald-900 text-emerald-300 font-semibold' },
                { value: 'medium', label: 'Medium', activeClass: 'bg-sky-900 text-sky-300 font-semibold' },
                { value: 'low',    label: 'Low',     activeClass: 'bg-red-900 text-red-300 font-semibold' },
              ]}
            />
          </FieldRow>

          <FieldRow label="Customer switching friction">
            <ToggleGroup
              value={competitor.switchingFriction || 'medium'}
              onChange={v => update('switchingFriction', v)}
              options={[
                { value: 'low',    label: 'Low',    activeClass: 'bg-red-900 text-red-300 font-semibold' },
                { value: 'medium', label: 'Medium', activeClass: 'bg-sky-900 text-sky-300 font-semibold' },
                { value: 'high',   label: 'High',   activeClass: 'bg-emerald-900 text-emerald-300 font-semibold' },
              ]}
            />
          </FieldRow>

          <FieldRow label="Response constraint level">
            <ToggleGroup
              value={competitor.responseConstraintLevel || 'none'}
              onChange={v => update('responseConstraintLevel', v)}
              options={[
                { value: 'none',     label: 'None',     activeClass: 'bg-emerald-900 text-emerald-300 font-semibold' },
                { value: 'moderate', label: 'Moderate', activeClass: 'bg-amber-900 text-amber-300 font-semibold' },
                { value: 'severe',   label: 'Severe',   activeClass: 'bg-red-900 text-red-300 font-semibold' },
              ]}
            />
          </FieldRow>
        </div>
      )}
    </div>
  )
}
