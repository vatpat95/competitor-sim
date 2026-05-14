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

// ── Primitive UI pieces ───────────────────────────────────────────────────────

function Badge({ children, variant = 'gray' }) {
  const variants = {
    green:  'bg-green-100 text-green-700',
    amber:  'bg-amber-100 text-amber-700',
    red:    'bg-red-100 text-red-700',
    blue:   'bg-blue-100 text-blue-700',
    gray:   'bg-gray-100 text-gray-600',
    indigo: 'bg-indigo-100 text-indigo-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant] ?? variants.gray}`}>
      {children}
    </span>
  )
}

function SectionTitle({ children }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{children}</h2>
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  )
}

// ── Confidence arc ────────────────────────────────────────────────────────────

function ConfidenceGauge({ score }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <svg width="44" height="44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <div className="text-sm font-semibold text-gray-800">{score}</div>
        <div className="text-xs text-gray-400">confidence</div>
      </div>
    </div>
  )
}

// ── Timing badge ──────────────────────────────────────────────────────────────

function TimingBadge({ timing }) {
  const map = {
    immediate:       { label: 'Immediate',      variant: 'red' },
    within_30_days:  { label: 'Within 30 days', variant: 'amber' },
    within_quarter:  { label: 'This quarter',   variant: 'green' },
    wait_and_see:    { label: 'Wait & see',     variant: 'gray' },
  }
  const { label, variant } = map[timing] ?? { label: timing, variant: 'gray' }
  return <Badge variant={variant}>{label}</Badge>
}

// ── Section 1: Header ─────────────────────────────────────────────────────────

function SimHeader({ result }) {
  const { equilibriumReached, totalRounds, simulationMetadata } = result
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-gray-100">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Simulation complete</h1>
        {simulationMetadata?.timestamp && (
          <p className="text-sm text-gray-400 mt-0.5">{formatTs(simulationMetadata.timestamp)}</p>
        )}
      </div>
      <Badge variant={equilibriumReached ? 'green' : 'amber'}>
        Equilibrium {equilibriumReached ? 'reached' : 'not reached'} in {totalRounds} round{totalRounds !== 1 ? 's' : ''}
      </Badge>
    </div>
  )
}

// ── Section 2: Strategic recommendation ──────────────────────────────────────

function StrategicRec({ out }) {
  const { strategicRecommendation, betterAlternative } = out
  return (
    <div>
      <SectionTitle>Strategic recommendation</SectionTitle>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-4">
        <p className="text-sm text-gray-800 leading-relaxed">{strategicRecommendation}</p>

        {betterAlternative && (
          <div className="bg-white border border-blue-100 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Consider instead</p>
            <p className="text-sm font-semibold text-gray-800">{betterAlternative.move}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{betterAlternative.reasoning}</p>
            <div className="flex items-start gap-2 pt-1">
              <span className="text-xs font-medium text-gray-400 shrink-0 mt-0.5">Expected outcome</span>
              <p className="text-xs text-gray-600 leading-relaxed">{betterAlternative.expectedOutcome}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section 3: Market equilibrium + player outcomes ───────────────────────────

function outcomeVariant(o) {
  return o === 'wins' ? 'green' : o === 'loses' ? 'red' : 'amber'
}

function MarketEquilibrium({ out, yourCompanyName }) {
  const { marketEquilibrium, playerOutcomes } = out
  if (!playerOutcomes) return null

  const entries = Object.entries(playerOutcomes).map(([key, val]) => ({
    name: key === 'yourCompany' ? (yourCompanyName || 'Your Company') : key,
    ...val,
  }))

  return (
    <div>
      <SectionTitle>Market equilibrium</SectionTitle>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{marketEquilibrium}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {entries.map(({ name, outcome, reasoning }) => (
          <Card key={name} className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-gray-800 leading-tight">{name}</span>
              <Badge variant={outcomeVariant(outcome)}>{fmt(outcome)}</Badge>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{reasoning}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Section 4: Competitor response cards ──────────────────────────────────────

function CompetitorCard({ r1entry, r2entry }) {
  const { competitorName, profile, response: r1 } = r1entry
  const r2 = r2entry?.response

  const typeChanged = r1?.primaryResponse?.type !== r2?.primaryResponse?.type
  const final = r2?.primaryResponse ?? r1?.primaryResponse
  const finalAlt = r2?.alternativeResponse ?? r1?.alternativeResponse
  const finalData = r2?.dataPointsDriving ?? r1?.dataPointsDriving ?? []
  const finalConf = r2?.confidenceScore ?? r1?.confidenceScore ?? 0
  const finalWatch = r2?.watchSignal ?? r1?.watchSignal

  const capScore = profile?.financialCapacityScore ?? 0
  const aggScore = profile?.aggressionIndex ?? 0

  const capVariant = capScore >= 70 ? 'green' : capScore >= 40 ? 'amber' : 'red'
  const aggVariant = aggScore >= 70 ? 'red' : aggScore >= 45 ? 'amber' : 'blue'

  const isMagnitudeIntensity = ['bundle_add', 'marketing_surge', 'niche_pivot', 'alliance', 'no_response'].includes(final?.type)
  const magnitudeLabel = isMagnitudeIntensity
    ? `${final?.magnitude}/10 intensity`
    : `${final?.magnitude}%`

  return (
    <Card className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-gray-900">{competitorName}</h3>
          {typeChanged && (
            <Badge variant="indigo">↻ Adjusted</Badge>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span title={`Financial firepower: ${capScore}/100. ${capScore >= 70 ? 'Can fund sustained competitive moves.' : capScore >= 40 ? 'Selective responses only.' : 'Financially constrained — limited options.'}`}>
            <Badge variant={capVariant}>
              {capScore >= 70 ? 'High firepower' : capScore >= 40 ? 'Moderate firepower' : 'Low firepower'} · {capScore}
            </Badge>
          </span>
          <span title={`Aggression: ${aggScore}/100. ${aggScore >= 70 ? 'Highly aggressive — expect fast, large moves.' : aggScore >= 45 ? 'Will respond to direct threats.' : 'Low aggression — unlikely to escalate.'}`}>
            <Badge variant={aggVariant}>
              {aggScore >= 70 ? 'Very aggressive' : aggScore >= 45 ? 'Moderately aggressive' : 'Low aggression'} · {aggScore}
            </Badge>
          </span>
        </div>
        {typeChanged && (
          <p className="text-xs text-indigo-600 mt-2">
            Changed from <span className="font-medium">{fmt(r1?.primaryResponse?.type)}</span> → <span className="font-medium">{fmt(final?.type)}</span>
          </p>
        )}
      </div>

      {/* Primary response */}
      <div className="px-4 py-3 border-b border-gray-100 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{fmt(final?.type)}</span>
          {final?.magnitude > 0 && (
            <span className="text-xs text-gray-500">{magnitudeLabel}</span>
          )}
          <TimingBadge timing={final?.timing} />
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{final?.rationale}</p>
      </div>

      {/* Data points */}
      {finalData.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 mb-2">Driving data points</p>
          <ul className="space-y-1">
            {finalData.map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                <span className="text-gray-300 mt-0.5 shrink-0">—</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer: confidence + watch signal */}
      <div className="px-4 py-3 mt-auto space-y-3">
        <ConfidenceGauge score={finalConf} />
        {finalWatch && (
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 font-medium mb-0.5">Watch signal</p>
            <p className="text-xs text-gray-500 italic leading-relaxed">{finalWatch}</p>
          </div>
        )}
      </div>
    </Card>
  )
}

function CompetitorResponses({ result }) {
  const { rounds } = result
  const r1 = rounds?.round1 ?? []
  const r2 = rounds?.round2 ?? []

  return (
    <div>
      <SectionTitle>Competitor responses</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {r1.map((entry, i) => (
          <CompetitorCard key={entry.competitorName} r1entry={entry} r2entry={r2[i]} />
        ))}
      </div>
    </div>
  )
}

// ── Section 5: Confidence bands ───────────────────────────────────────────────

function ConfidenceBands({ bands }) {
  if (!bands) return null
  const cols = [
    { key: 'bestCase',   label: 'Best Case',   headerClass: 'bg-green-50 border-green-200 text-green-700' },
    { key: 'likelyCase', label: 'Likely Case', headerClass: 'bg-blue-50 border-blue-200 text-blue-700' },
    { key: 'worstCase',  label: 'Worst Case',  headerClass: 'bg-red-50 border-red-200 text-red-700' },
  ]
  return (
    <div>
      <SectionTitle>Scenario outcomes</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cols.map(({ key, label, headerClass }) => {
          const band = bands[key]
          if (!band) return null
          return (
            <Card key={key} className="overflow-hidden">
              <div className={`px-4 py-2.5 border-b ${headerClass} font-semibold text-sm`}>
                {label}
              </div>
              <div className="px-4 py-3 space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">{band.description}</p>
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Conditions required</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{band.conditions}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── Section 6: Watchlist ──────────────────────────────────────────────────────

function Watchlist({ signals, risks }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {signals?.length > 0 && (
        <div>
          <SectionTitle>Watchlist signals</SectionTitle>
          <Card className="overflow-hidden divide-y divide-gray-100">
            {signals.map((signal, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{signal}</p>
              </div>
            ))}
          </Card>
        </div>
      )}

      {risks?.length > 0 && (
        <div>
          <SectionTitle>Key risks</SectionTitle>
          <Card className="overflow-hidden divide-y divide-gray-100">
            {risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="text-amber-400 text-sm shrink-0 mt-0.5">⚠</span>
                <p className="text-sm text-gray-700 leading-relaxed">{risk}</p>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}

// ── Collapsible round-by-round reasoning ─────────────────────────────────────

function RoundTimeline({ result }) {
  const [open, setOpen] = useState(false)
  const { rounds } = result
  const competitors = rounds?.round1?.map(r => r.competitorName) ?? []

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Show round-by-round reasoning
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-6">
          {competitors.map(name => {
            const roundEntries = ['round1', 'round2', 'round3']
              .map(key => rounds?.[key]?.find(r => r.competitorName === name))
              .filter(Boolean)

            // Deduplicate consecutive identical rounds (when round3 = round2 alias)
            const deduped = roundEntries.filter((r, i) => {
              if (i === 0) return true
              const prev = roundEntries[i - 1]
              return r.response?.primaryResponse?.type !== prev.response?.primaryResponse?.type ||
                     r.response?.primaryResponse?.magnitude !== prev.response?.primaryResponse?.magnitude
            })

            return (
              <div key={name}>
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">{name}</p>
                <div className="flex items-start gap-0">
                  {deduped.map((entry, i) => {
                    const pr = entry.response?.primaryResponse
                    return (
                      <div key={i} className="flex items-start gap-0">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                            {entry.round}
                          </div>
                          {i < deduped.length - 1 && <div className="w-px h-8 bg-gray-200 my-1" />}
                        </div>
                        <div className="ml-3 pb-6">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-gray-800">{fmt(pr?.type)}</span>
                            {pr?.magnitude > 0 && (
                              <span className="text-xs text-gray-400">{pr.magnitude}%</span>
                            )}
                            <TimingBadge timing={pr?.timing} />
                          </div>
                          {i > 0 && deduped[i - 1]?.response?.primaryResponse?.type !== pr?.type && (
                            <p className="text-xs text-indigo-600 mt-0.5">
                              ↻ Changed from {fmt(deduped[i - 1]?.response?.primaryResponse?.type)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed line-clamp-3">
                            {pr?.rationale}
                          </p>
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

// ── Sensitivity helpers ───────────────────────────────────────────────────────

// Convert 0-100 slider to rawInput overrides that approximate that capacity score
function applyFinancialStrength(rawCompetitor, sliderVal) {
  let cashPosition, debtToEbitda
  if (sliderVal < 40) {
    cashPosition = 'weak'
    debtToEbitda = 8 - (sliderVal / 40) * 4        // 8 → 4
  } else if (sliderVal < 70) {
    cashPosition = 'moderate'
    debtToEbitda = 4 - ((sliderVal - 40) / 30) * 2 // 4 → 2
  } else {
    cashPosition = 'strong'
    debtToEbitda = 2 - ((sliderVal - 70) / 30) * 1.8 // 2 → 0.2
  }
  return { ...rawCompetitor, cashPosition, debtToEbitda: Math.round(debtToEbitda * 10) / 10 }
}

function extractPriceMagnitude(strategicMove) {
  const m = strategicMove.match(/(\d+(\.\d+)?)\s*%/)
  return m ? parseFloat(m[1]) : 10
}

function capacityLabel(v) {
  return v < 40 ? 'Weak' : v < 70 ? 'Moderate' : 'Strong'
}

// ── Sensitivity panel ─────────────────────────────────────────────────────────

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
        // Build modified payload
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

        const newMove = yourCompany.strategicMove.replace(
          /\d+(\.\d+)?\s*%/,
          `${priceMag}%`
        )
        const extraContext = marketGrowth !== 2
          ? ` Market growth rate is currently ${marketGrowth > 0 ? '+' : ''}${marketGrowth}% — ${marketGrowth > 3 ? 'a growing market reduces urgency to fight for share' : marketGrowth < 0 ? 'a shrinking market intensifies competitive pressure' : 'moderate market growth'}.`
          : ''

        const res = await fetch('http://localhost:3001/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            yourCompany: {
              ...yourCompany,
              strategicMove: newMove,
              context: (yourCompany.context || '') + extraContext,
            },
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

  return (
    <div className="relative">
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Adjust assumptions — see how outcomes change</h3>
          <p className="text-xs text-gray-400 mt-0.5">Drag any slider to re-run the simulation with modified parameters.</p>
        </div>

        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {/* Financial strength */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span className="font-medium">{firstName} financial strength</span>
              <span className="font-semibold text-gray-700">{capacityLabel(capStrength)} ({capStrength})</span>
            </div>
            <input
              type="range" min={0} max={100} value={capStrength}
              onChange={e => setCapStrength(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-0.5">
              <span>Weak</span><span>Moderate</span><span>Strong</span>
            </div>
          </div>

          {/* Price magnitude */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span className="font-medium">Your price cut magnitude</span>
              <span className="font-semibold text-gray-700">{priceMag}% price cut</span>
            </div>
            <input
              type="range" min={5} max={25} value={priceMag}
              onChange={e => setPriceMag(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-0.5">
              <span>5%</span><span>15%</span><span>25%</span>
            </div>
          </div>

          {/* Market growth */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span className="font-medium">Market growth rate</span>
              <span className="font-semibold text-gray-700">{marketGrowth > 0 ? '+' : ''}{marketGrowth}% market growth</span>
            </div>
            <input
              type="range" min={-5} max={10} value={marketGrowth}
              onChange={e => setMarketGrowth(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-0.5">
              <span>-5%</span><span>+2%</span><span>+10%</span>
            </div>
          </div>

          {/* Regulatory cap toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Regulatory pricing cap in effect</p>
              <p className="text-xs text-gray-400 mt-0.5">Limits competitor ability to respond with price cuts</p>
            </div>
            <button
              type="button"
              onClick={() => setRegCap(v => !v)}
              className={[
                'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
                regCap ? 'bg-blue-600' : 'bg-gray-200',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200',
                  regCap ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Recalculating overlay */}
      {recalculating && (
        <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-600">Recalculating...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function SimulationResults({ result, yourCompany, rawCompetitors }) {
  const [currentResult, setCurrentResult] = useState(result)
  const out = currentResult.orchestratorOutput ?? {}
  const yourCompanyName = currentResult.simulationMetadata?.yourCompany?.name

  // Reset when a fresh top-level result comes in (e.g. Re-run)
  useEffect(() => { setCurrentResult(result) }, [result])

  return (
    <div className="space-y-8">
      <SimHeader result={currentResult} />
      <StrategicRec out={out} />
      <MarketEquilibrium out={out} yourCompanyName={yourCompanyName} />

      {yourCompany && rawCompetitors && (
        <SensitivityPanel
          baseResult={currentResult}
          yourCompany={yourCompany}
          rawCompetitors={rawCompetitors}
          onResultUpdate={setCurrentResult}
        />
      )}

      <CompetitorResponses result={currentResult} />
      <ConfidenceBands bands={out.confidenceBands} />
      <Watchlist signals={out.watchlistSignals} risks={out.keyRisks} />
      <RoundTimeline result={currentResult} />
    </div>
  )
}
