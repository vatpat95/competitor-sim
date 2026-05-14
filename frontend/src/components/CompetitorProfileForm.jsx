// ── Score computation (mirrors backend profileBuilder.js) ────────────────────

function computeScores(c) {
  const cashScoreMap = { strong: 100, moderate: 50, weak: 10 }
  const cashScore = cashScoreMap[c.cashPosition] ?? 50
  const debtScore = Math.max(0, 100 - (c.debtToEbitda || 0) * 15)
  const marginScore = Math.min(100, (c.ebitdaMargin || 0) * 3)
  const financialCapacityScore =
    Math.round((cashScore * 0.4 + debtScore * 0.35 + marginScore * 0.25) * 10) / 10

  const moves = c.lastThreePriceMoves || []
  const downMoves = moves.filter(m => m.direction === 'down')
  const priceMovementScore =
    downMoves.length > 0
      ? (downMoves.reduce((s, m) => s + (m.magnitude || 0), 0) / downMoves.length) * 4
      : 0
  const shareScoreMap = { gaining: 80, stable: 40, losing: 20 }
  const shareScore = shareScoreMap[c.marketShareTrend] ?? 40
  const capacityBonus = financialCapacityScore * 0.3
  const aggressionIndex = Math.min(
    100,
    Math.round((priceMovementScore * 0.4 + shareScore * 0.3 + capacityBonus * 0.3) * 10) / 10
  )

  const ceo = (c.ceoPriorityStatement || '').toLowerCase()
  const holdCount = moves.filter(m => m.direction === 'hold').length
  const growth = c.revenueGrowthRate || 0
  const margin = c.ebitdaMargin || 0
  const rd = c.rdSpendPct || 0

  const rawGrowth =
    (growth > 10 ? 3 : growth > 5 ? 2 : 1) +
    (c.marketShareTrend === 'gaining' ? 2 : 0) +
    (ceo.includes('share') ? 1 : 0) +
    (ceo.includes('growth') ? 1 : 0)

  const rawMargin =
    (margin > 25 ? 3 : margin > 15 ? 2 : 1) +
    holdCount +
    (ceo.includes('margin') ? 1 : 0) +
    (ceo.includes('profit') ? 1 : 0)

  const rawNiche =
    (c.marketShareTrend === 'losing' ? 2 : 1) +
    (ceo.includes('focus') ? 1 : 0) +
    (ceo.includes('rural') ? 2 : 0) +
    (ceo.includes('specific') ? 1 : 0) +
    (financialCapacityScore < 40 ? 2 : 0)

  const rawInnovation =
    (rd > 8 ? 3 : rd > 4 ? 2 : 1) +
    (ceo.includes('innovat') ? 2 : 0) +
    (ceo.includes('premium') ? 1 : 0) +
    (ceo.includes('experience') ? 1 : 0)

  const total = rawGrowth + rawMargin + rawNiche + rawInnovation
  return {
    financialCapacityScore,
    aggressionIndex,
    intent: {
      growthMaximizer: Math.round((rawGrowth / total) * 1000) / 1000,
      marginDefender: Math.round((rawMargin / total) * 1000) / 1000,
      nichePlayer: Math.round((rawNiche / total) * 1000) / 1000,
      innovationBetter: Math.round((rawInnovation / total) * 1000) / 1000,
    },
  }
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeader({ title }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 mt-6 first:mt-0">
      {title}
    </h3>
  )
}

function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

function NumInput({ value, onChange, step = 0.1, min = 0, placeholder = '0' }) {
  return (
    <input
      type="number"
      value={value === 0 ? '' : value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      step={step}
      min={min}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  )
}

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'flex-1 py-2 text-sm font-medium transition-colors',
            value === opt.value ? opt.activeClass : 'bg-white text-gray-500 hover:bg-gray-50',
          ].join(' ')}
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

function aggTier(v) {
  if (v >= 70) return { label: 'Highly aggressive', sub: 'Expect fast, large-magnitude responses to any competitive trigger', color: 'text-red-600', bar: 'bg-red-500' }
  if (v >= 45) return { label: 'Selectively aggressive', sub: 'Will respond to direct threats but avoids broad price wars', color: 'text-amber-600', bar: 'bg-amber-500' }
  return { label: 'Low aggression', sub: 'Tends to hold position or respond gradually — unlikely to escalate', color: 'text-blue-600', bar: 'bg-blue-400' }
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
  const { financialCapacityScore, aggressionIndex, intent } = scores
  const cap = capTier(financialCapacityScore)
  const agg = aggTier(aggressionIndex)

  // Find dominant intent
  const topIntent = Object.entries(intent).sort(([,a],[,b]) => b - a)[0]
  const topMeta = INTENT_META[topIntent?.[0]] ?? {}

  return (
    <div className="sticky top-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Competitor Profile</h3>
      </div>

      {/* Financial Capacity */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">Financial firepower</span>
          <span className="text-xs font-bold text-gray-700">{financialCapacityScore.toFixed(0)}/100</span>
        </div>
        <ScoreBar value={financialCapacityScore} colorClass={cap.bar} />
        <div className="mt-1.5">
          <span className={`text-xs font-semibold ${cap.color}`}>{cap.label}</span>
          <p className="text-xs text-gray-400 leading-snug mt-0.5">{cap.sub}</p>
        </div>
        <div className="flex justify-between text-[10px] text-gray-300 mt-1.5">
          <span>0 — Can't compete</span>
          <span>100 — Deep pockets</span>
        </div>
      </div>

      {/* Aggression Index */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">Likely to fight back?</span>
          <span className="text-xs font-bold text-gray-700">{aggressionIndex.toFixed(0)}/100</span>
        </div>
        <ScoreBar value={aggressionIndex} colorClass={agg.bar} />
        <div className="mt-1.5">
          <span className={`text-xs font-semibold ${agg.color}`}>{agg.label}</span>
          <p className="text-xs text-gray-400 leading-snug mt-0.5">{agg.sub}</p>
        </div>
        <div className="flex justify-between text-[10px] text-gray-300 mt-1.5">
          <span>0 — Passive</span>
          <span>100 — Very aggressive</span>
        </div>
      </div>

      {/* Strategic Intent */}
      <div className="px-4 py-3">
        <p className="text-xs font-medium text-gray-500 mb-2.5">How they compete</p>
        {Object.entries(intent)
          .sort(([,a],[,b]) => b - a)
          .map(([key, val]) => {
            const meta = INTENT_META[key]
            const pct = (val * 100).toFixed(0)
            const isTop = key === topIntent?.[0]
            return (
              <div key={key} className="mb-2.5">
                <div className="flex items-baseline justify-between mb-1">
                  <span className={`text-xs ${isTop ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>
                    {meta.label}
                  </span>
                  <span className={`text-xs font-bold ${isTop ? 'text-gray-800' : 'text-gray-400'}`}>{pct}%</span>
                </div>
                <ScoreBar value={val} colorClass={meta.color} showPct />
                {isTop && (
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{meta.desc}</p>
                )}
              </div>
            )
          })}
        <p className="text-[10px] text-gray-300 mt-2 leading-snug">
          Dominant strategy shapes how the AI models this competitor's decisions.
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CompetitorProfileForm({ competitor, onChange, index }) {
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

  const scores = computeScores(competitor)
  const moves = competitor.lastThreePriceMoves || []
  const signals = competitor.recentNewsSignals || []

  return (
    <div className="flex gap-6">
      {/* ── Form ── */}
      <div className="flex-1 min-w-0">
        {/* Competitor name */}
        <FieldRow label="Competitor name">
          <input
            type="text"
            value={competitor.name || ''}
            onChange={e => update('name', e.target.value)}
            placeholder="e.g. ValueNet"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FieldRow>

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
              { value: 'strong',   label: 'Strong',   activeClass: 'bg-green-100 text-green-700 font-semibold' },
              { value: 'moderate', label: 'Moderate', activeClass: 'bg-amber-100 text-amber-700 font-semibold' },
              { value: 'weak',     label: 'Weak',     activeClass: 'bg-red-100 text-red-700 font-semibold' },
            ]}
          />
        </FieldRow>

        {/* Section 2 — Pricing behavior */}
        <SectionHeader title="Pricing Behavior (most recent first)" />

        {moves.length === 0 && (
          <p className="text-sm text-gray-400 mb-3">No price moves added yet.</p>
        )}

        {moves.map((move, i) => (
          <div key={i} className="flex gap-2 mb-2 items-start">
            <select
              value={move.direction}
              onChange={e => updateMove(i, 'direction', e.target.value)}
              className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <input
              type="text"
              value={move.context}
              onChange={e => updateMove(i, 'context', e.target.value)}
              placeholder="Brief context"
              className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => removeMove(i)}
              className="px-2 py-2 text-gray-400 hover:text-red-500 transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        ))}

        {moves.length < 3 && (
          <button
            type="button"
            onClick={addMove}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
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
              { value: 'gaining', label: 'Gaining', activeClass: 'bg-green-100 text-green-700 font-semibold' },
              { value: 'stable',  label: 'Stable',  activeClass: 'bg-blue-100 text-blue-700 font-semibold' },
              { value: 'losing',  label: 'Losing',  activeClass: 'bg-red-100 text-red-700 font-semibold' },
            ]}
          />
        </FieldRow>

        <FieldRow label="Headcount trend">
          <ToggleGroup
            value={competitor.headcountTrend}
            onChange={v => update('headcountTrend', v)}
            options={[
              { value: 'growing',   label: 'Growing',   activeClass: 'bg-green-100 text-green-700 font-semibold' },
              { value: 'flat',      label: 'Flat',      activeClass: 'bg-blue-100 text-blue-700 font-semibold' },
              { value: 'shrinking', label: 'Shrinking', activeClass: 'bg-red-100 text-red-700 font-semibold' },
            ]}
          />
        </FieldRow>

        <FieldRow label="Geographic focus">
          <input
            type="text"
            value={competitor.geographicFocus || ''}
            onChange={e => update('geographicFocus', e.target.value)}
            placeholder="e.g. North America, expanding EMEA"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeSignal(i)}
                className="px-2 text-gray-400 hover:text-red-500 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          ))}
          {signals.length < 5 && (
            <button
              type="button"
              onClick={addSignal}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </FieldRow>
      </div>

      {/* ── Live score card ── */}
      <div className="w-56 shrink-0">
        <LiveScoreCard scores={scores} />
      </div>
    </div>
  )
}
