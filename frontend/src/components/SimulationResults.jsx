import { useState, useEffect, useRef } from 'react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(type) {
  return (type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatTs(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Verdict logic ─────────────────────────────────────────────────────────────

function deriveVerdict(out) {
  const outcome = out?.playerOutcomes?.yourCompany?.outcome
  const hasBetter = Boolean(out?.betterAlternative?.move)

  if (outcome === 'loses' || outcome === 'loses_significantly') {
    return { verdict: 'REVISE STRATEGY', color: '#dc2626', bg: '#450a0a', border: '#7f1d1d', dot: 'bg-red-500', tag: 'red' }
  }
  if (outcome === 'wins' || outcome === 'gains') {
    if (hasBetter) {
      return { verdict: 'PROCEED WITH CAUTION', color: '#d97706', bg: '#1c1400', border: '#78350f', dot: 'bg-amber-400', tag: 'amber' }
    }
    return { verdict: 'PROCEED', color: '#16a34a', bg: '#052e16', border: '#14532d', dot: 'bg-emerald-500', tag: 'green' }
  }
  // neutral outcome: revise if there's a clear alternative, otherwise caution
  if (hasBetter) {
    return { verdict: 'REVISE STRATEGY', color: '#dc2626', bg: '#450a0a', border: '#7f1d1d', dot: 'bg-red-500', tag: 'red' }
  }
  return { verdict: 'PROCEED WITH CAUTION', color: '#d97706', bg: '#1c1400', border: '#78350f', dot: 'bg-amber-400', tag: 'amber' }
}

// ── Primitive UI ──────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#4a7fa5' }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div className="border-t" style={{ borderColor: '#1f2937' }} />
}

function TimingBadge({ timing }) {
  const map = {
    immediate:       { label: 'Immediate',      cls: 'bg-red-900/60 text-red-300 border-red-800' },
    within_30_days:  { label: '< 30 days',      cls: 'bg-amber-900/60 text-amber-300 border-amber-800' },
    within_quarter:  { label: 'This quarter',   cls: 'bg-blue-900/60 text-blue-300 border-blue-800' },
    wait_and_see:    { label: 'Wait & see',     cls: 'bg-gray-800 text-gray-400 border-gray-700' },
  }
  const { label, cls } = map[timing] ?? { label: timing ?? '—', cls: 'bg-gray-800 text-gray-400 border-gray-700' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {label}
    </span>
  )
}

function ThreatBadge({ cap, agg }) {
  if (cap >= 70 && agg >= 70) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border bg-red-900/60 text-red-300 border-red-800">HIGH</span>
  if (cap >= 40 && agg >= 45) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border bg-amber-900/60 text-amber-300 border-amber-800">MEDIUM</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border bg-gray-800 text-gray-400 border-gray-700">LOW</span>
}

function OutcomePill({ outcome }) {
  const map = {
    wins:               'bg-emerald-900/60 text-emerald-300 border-emerald-800',
    gains:              'bg-emerald-900/60 text-emerald-300 border-emerald-800',
    breaks_even:        'bg-blue-900/60 text-blue-300 border-blue-800',
    holds:              'bg-blue-900/60 text-blue-300 border-blue-800',
    loses:              'bg-red-900/60 text-red-300 border-red-800',
    loses_significantly:'bg-red-900/60 text-red-300 border-red-800',
  }
  const cls = map[outcome] ?? 'bg-gray-800 text-gray-400 border-gray-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${cls}`}>
      {fmt(outcome)}
    </span>
  )
}

// ── Section 1: Verdict banner ─────────────────────────────────────────────────

function VerdictBanner({ out, result }) {
  const v = deriveVerdict(out)
  const { equilibriumReached, totalRounds } = result
  const yourOutcome = out?.playerOutcomes?.yourCompany

  return (
    <div className="rounded-xl p-5" style={{ background: v.bg, border: `1px solid ${v.border}` }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full shrink-0 ${v.dot}`} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: v.color, opacity: 0.7 }}>AI Recommendation</p>
            <p className="text-2xl font-bold" style={{ color: v.color }}>{v.verdict}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {yourOutcome && (
            <div className="text-right">
              <p className="text-gray-500 mb-1">Your outcome</p>
              <OutcomePill outcome={yourOutcome.outcome} />
            </div>
          )}
          <div className="text-right">
            <p className="text-gray-500 mb-1">Simulation</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded border border-gray-700 bg-gray-800 text-gray-300 text-xs font-medium">
              {totalRounds} round{totalRounds !== 1 ? 's' : ''} · {equilibriumReached ? 'Equilibrium reached' : 'Equilibrium pending'}
            </span>
          </div>
        </div>
      </div>
      {yourOutcome?.reasoning && (
        <p className="text-sm mt-4 leading-relaxed" style={{ color: v.color, opacity: 0.75 }}>
          {yourOutcome.reasoning}
        </p>
      )}
    </div>
  )
}

// ── Section 2: Recommendation + Market snapshot ───────────────────────────────

function RecommendationPanel({ out }) {
  const { strategicRecommendation, betterAlternative, marketEquilibrium } = out

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Recommendation — 2/3 width */}
      <div className="lg:col-span-2 rounded-xl p-5" style={{ background: '#0f172a', border: '1px solid #1e3a5f' }}>
        <SectionLabel>Strategic Recommendation</SectionLabel>
        <p className="text-sm text-gray-200 leading-relaxed">{strategicRecommendation}</p>

        {betterAlternative && (
          <div className="mt-4 p-4 rounded-lg" style={{ background: '#0b1426', border: '1px solid #1e3a5f' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#0ea5e9' }}>Consider instead</p>
            <p className="text-sm font-semibold text-white mb-1">{betterAlternative.move}</p>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">{betterAlternative.reasoning}</p>
            <div className="pt-3" style={{ borderTop: '1px solid #1e3a5f' }}>
              <p className="text-xs text-gray-500 font-medium mb-1">Expected outcome</p>
              <p className="text-xs text-gray-300 leading-relaxed">{betterAlternative.expectedOutcome}</p>
            </div>
          </div>
        )}
      </div>

      {/* Market snapshot — 1/3 width */}
      <div className="rounded-xl p-5" style={{ background: '#111827', border: '1px solid #1f2937' }}>
        <SectionLabel>Market Equilibrium</SectionLabel>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">{marketEquilibrium}</p>

        {out.playerOutcomes && (
          <div className="space-y-2.5">
            {Object.entries(out.playerOutcomes).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-300 font-medium truncate">
                  {key === 'yourCompany' ? (out._yourCompanyName ?? 'You') : key}
                </span>
                <OutcomePill outcome={val.outcome} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section 3: Competitive response matrix ────────────────────────────────────

function competitorFinalData(r1entry, r2entry) {
  const r2 = r2entry?.response
  const r1resp = r1entry?.response
  const final = r2?.primaryResponse ?? r1resp?.primaryResponse
  const watch = r2?.watchSignal ?? r1resp?.watchSignal
  const cap = r1entry.profile?.financialCapacityScore ?? 0
  const agg = r1entry.profile?.aggressionIndex ?? 0
  const typeChanged = r2 && r1resp?.primaryResponse?.type !== r2?.primaryResponse?.type

  const isMagnitudeIntensity = ['bundle_add', 'marketing_surge', 'niche_pivot', 'alliance', 'no_response'].includes(final?.type)
  const magnitude = final?.magnitude > 0
    ? (isMagnitudeIntensity ? `${final.magnitude}/10 intensity` : `${final.magnitude}%`)
    : null

  return { final, watch, cap, agg, typeChanged, magnitude, rationale: final?.rationale }
}

function CompetitiveResponseMatrix({ result }) {
  const { rounds } = result
  const r1 = rounds?.round1 ?? []
  const r2 = rounds?.round2 ?? []

  if (r1.length === 0) return null

  return (
    <div>
      <SectionLabel>Competitive Response Matrix</SectionLabel>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1f2937' }}>
        {/* Table header */}
        <div className="grid text-xs font-bold uppercase tracking-wider text-gray-500 px-4 py-3"
          style={{ gridTemplateColumns: '1.2fr 1.8fr 1fr 0.7fr 2fr', background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
          <div>Competitor</div>
          <div>Expected Response</div>
          <div>Timing</div>
          <div>Threat</div>
          <div>Implication for You</div>
        </div>

        {r1.map((entry, i) => {
          const { final, watch, cap, agg, typeChanged, magnitude } = competitorFinalData(entry, r2[i])
          const implication = watch ?? final?.rationale ?? '—'

          return (
            <div
              key={entry.competitorName}
              className="grid items-start px-4 py-4 text-sm gap-x-4"
              style={{
                gridTemplateColumns: '1.2fr 1.8fr 1fr 0.7fr 2fr',
                borderTop: i > 0 ? '1px solid #1f2937' : undefined,
                background: i % 2 === 0 ? '#111827' : '#0f172a',
              }}
            >
              {/* Competitor */}
              <div>
                <p className="font-semibold text-white text-sm">{entry.competitorName}</p>
                {typeChanged && (
                  <span className="text-xs text-indigo-400 mt-0.5">↻ Adjusted</span>
                )}
              </div>

              {/* Response */}
              <div>
                <p className="font-medium text-gray-200">{fmt(final?.type)}</p>
                {magnitude && <p className="text-xs text-gray-500 mt-0.5">{magnitude}</p>}
              </div>

              {/* Timing */}
              <div>
                <TimingBadge timing={final?.timing} />
              </div>

              {/* Threat */}
              <div>
                <ThreatBadge cap={cap} agg={agg} />
              </div>

              {/* Implication */}
              <div>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{implication}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Section 4: Scenario outcomes ──────────────────────────────────────────────

function ScenarioOutcomes({ bands }) {
  if (!bands) return null
  const cols = [
    { key: 'bestCase',   label: 'Best Case',   border: '#14532d', bg: '#052e16', labelColor: '#86efac' },
    { key: 'likelyCase', label: 'Base Case',   border: '#1e3a5f', bg: '#0f172a', labelColor: '#93c5fd' },
    { key: 'worstCase',  label: 'Worst Case',  border: '#7f1d1d', bg: '#450a0a', labelColor: '#fca5a5' },
  ]

  return (
    <div>
      <SectionLabel>Scenario Range</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cols.map(({ key, label, border, bg, labelColor }) => {
          const band = bands[key]
          if (!band) return null
          return (
            <div key={key} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: labelColor }}>{label}</p>
              <p className="text-sm text-gray-200 leading-relaxed mb-3">{band.description}</p>
              <div className="pt-3" style={{ borderTop: `1px solid ${border}` }}>
                <p className="text-xs text-gray-500 font-medium mb-1">Conditions</p>
                <p className="text-xs text-gray-400 leading-relaxed">{band.conditions}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Section 5: Watchpoints ────────────────────────────────────────────────────

function Watchpoints({ signals, risks }) {
  const hasSignals = signals?.length > 0
  const hasRisks = risks?.length > 0
  if (!hasSignals && !hasRisks) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hasSignals && (
        <div>
          <SectionLabel>Watch For These Signals</SectionLabel>
          <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1f2937' }}>
            {signals.map((signal, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3" style={{ borderTop: i > 0 ? '1px solid #1f2937' : undefined }}>
                <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: '#1e3a5f', color: '#7dd3fc' }}>
                  {i + 1}
                </span>
                <p className="text-sm text-gray-300 leading-relaxed">{signal}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasRisks && (
        <div>
          <SectionLabel>Key Risks</SectionLabel>
          <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1f2937' }}>
            {risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3" style={{ borderTop: i > 0 ? '1px solid #1f2937' : undefined }}>
                <span className="text-amber-400 text-sm shrink-0 mt-0.5">▲</span>
                <p className="text-sm text-gray-300 leading-relaxed">{risk}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section 6: Sensitivity panel ──────────────────────────────────────────────

function applyFinancialStrength(rawCompetitor, sliderVal) {
  let cashPosition, debtToEbitda
  if (sliderVal < 40) {
    cashPosition = 'weak'
    debtToEbitda = 8 - (sliderVal / 40) * 4
  } else if (sliderVal < 70) {
    cashPosition = 'moderate'
    debtToEbitda = 4 - ((sliderVal - 40) / 30) * 2
  } else {
    cashPosition = 'strong'
    debtToEbitda = 2 - ((sliderVal - 70) / 30) * 1.8
  }
  return { ...rawCompetitor, cashPosition, debtToEbitda: Math.round(debtToEbitda * 10) / 10 }
}

function extractPriceMagnitude(strategicMove) {
  const m = (strategicMove || '').match(/(\d+(\.\d+)?)\s*%/)
  return m ? parseFloat(m[1]) : 10
}

function capacityLabel(v) {
  return v < 40 ? 'Weak' : v < 70 ? 'Moderate' : 'Strong'
}

function SensitivityPanel({ baseResult, yourCompany, rawCompetitors, onResultUpdate }) {
  const firstName = rawCompetitors[0]?.name || 'Competitor A'
  const defaultCap = Math.round(baseResult.competitorProfiles?.[0]?.financialCapacityScore ?? 70)
  const defaultPrice = extractPriceMagnitude(yourCompany.strategicMove)

  const [capStrength, setCapStrength] = useState(defaultCap)
  const [priceMag, setPriceMag] = useState(defaultPrice)
  const [marketGrowth, setMarketGrowth] = useState(2)
  const [regCap, setRegCap] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  const debounceRef = useRef(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setRecalculating(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const modifiedCompetitors = rawCompetitors.map((c, i) => {
          let mc = i === 0 ? applyFinancialStrength(c, capStrength) : { ...c }
          if (regCap) {
            mc = {
              ...mc,
              regulatoryConstraints: [mc.regulatoryConstraints, 'Regulatory pricing cap in effect — price changes require regulatory approval.'].filter(Boolean).join(' '),
            }
          }
          return mc
        })

        const newMove = (yourCompany.strategicMove || '').replace(/\d+(\.\d+)?\s*%/, `${priceMag}%`)
        const extraContext = marketGrowth !== 2
          ? ` Market growth rate is currently ${marketGrowth > 0 ? '+' : ''}${marketGrowth}% — ${marketGrowth > 3 ? 'a growing market reduces urgency to fight for share' : marketGrowth < 0 ? 'a shrinking market intensifies competitive pressure' : 'moderate market growth'}.`
          : ''

        const res = await fetch('http://localhost:3001/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            yourCompany: { ...yourCompany, strategicMove: newMove, context: (yourCompany.context || '') + extraContext },
            competitors: modifiedCompetitors,
          }),
        })
        const data = await res.json()
        if (res.ok) onResultUpdate(data)
      } catch (e) {
        console.error('[sensitivity] re-run failed:', e)
      } finally {
        setRecalculating(false)
      }
    }, 500)

    return () => clearTimeout(debounceRef.current)
  }, [capStrength, priceMag, marketGrowth, regCap])

  const sliderCls = 'w-full h-1.5 rounded-full appearance-none cursor-pointer accent-sky-500'

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1f2937' }}>
        <div className="px-5 py-4" style={{ background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
          <p className="text-sm font-semibold text-white">Sensitivity Analysis</p>
          <p className="text-xs text-gray-500 mt-0.5">Adjust assumptions to re-run the simulation and see how outcomes shift.</p>
        </div>

        <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6" style={{ background: '#111827' }}>
          {/* Financial strength */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400 font-medium">{firstName} financial strength</span>
              <span className="text-gray-200 font-semibold">{capacityLabel(capStrength)} ({capStrength})</span>
            </div>
            <input type="range" min={0} max={100} value={capStrength}
              onChange={e => setCapStrength(Number(e.target.value))} className={sliderCls} />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Weak</span><span>Moderate</span><span>Strong</span>
            </div>
          </div>

          {/* Price magnitude */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400 font-medium">Price move magnitude</span>
              <span className="text-gray-200 font-semibold">{priceMag}%</span>
            </div>
            <input type="range" min={5} max={25} value={priceMag}
              onChange={e => setPriceMag(Number(e.target.value))} className={sliderCls} />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>5%</span><span>15%</span><span>25%</span>
            </div>
          </div>

          {/* Market growth */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400 font-medium">Market growth rate</span>
              <span className="text-gray-200 font-semibold">{marketGrowth > 0 ? '+' : ''}{marketGrowth}%</span>
            </div>
            <input type="range" min={-5} max={10} value={marketGrowth}
              onChange={e => setMarketGrowth(Number(e.target.value))} className={sliderCls} />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>-5%</span><span>+2%</span><span>+10%</span>
            </div>
          </div>

          {/* Regulatory toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Regulatory pricing cap</p>
              <p className="text-xs text-gray-600 mt-0.5">Limits competitor ability to respond with price cuts</p>
            </div>
            <button
              type="button"
              onClick={() => setRegCap(v => !v)}
              className={[
                'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
                regCap ? 'bg-sky-500' : 'bg-gray-700',
              ].join(' ')}
            >
              <span className={[
                'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200',
                regCap ? 'translate-x-4' : 'translate-x-0',
              ].join(' ')} />
            </button>
          </div>
        </div>
      </div>

      {recalculating && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(17,24,39,0.75)' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg" style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-300">Re-running simulation...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section 7: Collapsible round detail ───────────────────────────────────────

function RoundDetail({ result }) {
  const [open, setOpen] = useState(false)
  const { rounds } = result
  const competitors = rounds?.round1?.map(r => r.competitorName) ?? []

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1f2937' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors"
        style={{ background: '#0d1117' }}
      >
        <span>Round-by-round reasoning <span className="text-xs text-gray-600 font-normal ml-2">Supporting detail</span></span>
        <span className="text-gray-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 py-5 space-y-6" style={{ background: '#111827', borderTop: '1px solid #1f2937' }}>
          {competitors.map(name => {
            const roundEntries = ['round1', 'round2', 'round3']
              .map(key => rounds?.[key]?.find(r => r.competitorName === name))
              .filter(Boolean)

            const deduped = roundEntries.filter((r, i) => {
              if (i === 0) return true
              const prev = roundEntries[i - 1]
              return r.response?.primaryResponse?.type !== prev.response?.primaryResponse?.type ||
                     r.response?.primaryResponse?.magnitude !== prev.response?.primaryResponse?.magnitude
            })

            return (
              <div key={name}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{name}</p>
                <div className="space-y-3">
                  {deduped.map((entry, i) => {
                    const pr = entry.response?.primaryResponse
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                          style={{ background: '#1e3a5f', color: '#7dd3fc' }}>
                          {entry.round}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-medium text-gray-200">{fmt(pr?.type)}</span>
                            {pr?.magnitude > 0 && <span className="text-xs text-gray-500">{pr.magnitude}%</span>}
                            <TimingBadge timing={pr?.timing} />
                          </div>
                          {i > 0 && deduped[i-1]?.response?.primaryResponse?.type !== pr?.type && (
                            <p className="text-xs text-indigo-400 mb-1">↻ Changed from {fmt(deduped[i-1]?.response?.primaryResponse?.type)}</p>
                          )}
                          <p className="text-xs text-gray-500 leading-relaxed max-w-lg line-clamp-3">{pr?.rationale}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function SimulationResults({ result, yourCompany, rawCompetitors }) {
  const [currentResult, setCurrentResult] = useState(result)
  const out = { ...(currentResult.orchestratorOutput ?? {}), _yourCompanyName: currentResult.simulationMetadata?.yourCompany?.name ?? yourCompany?.name }

  useEffect(() => { setCurrentResult(result) }, [result])

  return (
    <div className="space-y-6">
      <VerdictBanner out={out} result={currentResult} />
      <RecommendationPanel out={out} />
      <CompetitiveResponseMatrix result={currentResult} />
      <ScenarioOutcomes bands={out.confidenceBands} />

      {yourCompany && rawCompetitors && (
        <SensitivityPanel
          baseResult={currentResult}
          yourCompany={yourCompany}
          rawCompetitors={rawCompetitors}
          onResultUpdate={setCurrentResult}
        />
      )}

      <Watchpoints signals={out.watchlistSignals} risks={out.keyRisks} />
      <RoundDetail result={currentResult} />
    </div>
  )
}
