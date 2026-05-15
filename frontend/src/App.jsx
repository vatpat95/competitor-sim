import { useState, useEffect, useRef } from 'react'
import CompetitorProfileForm from './components/CompetitorProfileForm'
import SimulationResults from './components/SimulationResults'

// ── Defaults ──────────────────────────────────────────────────────────────────

function defaultCompetitor() {
  return {
    name: '',
    revenueGrowthRate: 0,
    ebitdaMargin: 0,
    cashPosition: 'moderate',
    debtToEbitda: 0,
    rdSpendPct: 0,
    lastThreePriceMoves: [],
    marketShareTrend: 'stable',
    headcountTrend: 'flat',
    geographicFocus: '',
    ceoPriorityStatement: '',
    recentNewsSignals: [],
    regulatoryConstraints: '',
  }
}

// ── Demo dataset ──────────────────────────────────────────────────────────────

const DEMO_YOUR_COMPANY = {
  name: 'TelcoX',
  strategicMove: 'Launch of a new mid-market bundle priced 10% above ValueNet but with a 90-day free trial and dedicated onboarding',
  context: 'We are targeting ValueNet\'s recent mid-market gains with a value-add play rather than a price war, betting that trial conversion and onboarding quality will differentiate us.',
}

const DEMO_COMPETITORS = [
  {
    name: 'ValueNet',
    revenueGrowthRate: 18.5,
    ebitdaMargin: 12.3,
    cashPosition: 'strong',
    debtToEbitda: 1.8,
    rdSpendPct: 3.5,
    lastThreePriceMoves: [
      { direction: 'down', magnitude: 22, context: 'Aggressive Q4 campaign targeting mid-market' },
      { direction: 'down', magnitude: 20, context: 'Response to new entrant pricing pressure' },
      { direction: 'down', magnitude: 18, context: 'Renewal season discount push' },
    ],
    marketShareTrend: 'gaining',
    headcountTrend: 'growing',
    geographicFocus: 'North America, expanding EMEA',
    ceoPriorityStatement: 'Our mission is to be the undisputed price-value leader in every market we enter. We will outgrow the competition by making our product impossible to ignore on price.',
    recentNewsSignals: [
      'Announced expansion into 4 new metro markets',
      'Hired 200 sales reps in Q1',
      'Launched \'ValueNet Unlimited\' tier at 15% below nearest competitor',
      'Partnership with mid-market procurement platform',
    ],
    regulatoryConstraints: '',
  },
  {
    name: 'PremiumConnect',
    revenueGrowthRate: 7.2,
    ebitdaMargin: 31.5,
    cashPosition: 'strong',
    debtToEbitda: 0.9,
    rdSpendPct: 11.0,
    lastThreePriceMoves: [
      { direction: 'hold', magnitude: 0, context: 'Held price during market-wide discount cycle' },
      { direction: 'up',   magnitude: 5, context: 'Premium tier repricing post-feature release' },
      { direction: 'hold', magnitude: 0, context: 'Maintained pricing despite competitor cuts' },
    ],
    marketShareTrend: 'stable',
    headcountTrend: 'flat',
    geographicFocus: 'North America, Western Europe',
    ceoPriorityStatement: 'We compete on innovation and customer experience, not price. Our margins fund the R&D that keeps us two years ahead. We will not chase volume at the expense of profitability.',
    recentNewsSignals: [
      'Launched AI-powered analytics suite exclusive to Enterprise tier',
      'Won three analyst \'leader\' rankings in enterprise segment',
      'Renewed multi-year contracts with 4 Fortune 500 accounts',
    ],
    regulatoryConstraints: 'Subject to enterprise data residency requirements in EU; limits rapid geographic expansion.',
  },
  {
    name: 'RegionalPlus',
    revenueGrowthRate: 3.1,
    ebitdaMargin: 8.7,
    cashPosition: 'weak',
    debtToEbitda: 4.2,
    rdSpendPct: 2.1,
    lastThreePriceMoves: [
      { direction: 'down', magnitude: 10, context: 'Reactive cut after losing two regional accounts' },
      { direction: 'hold', magnitude: 0,  context: 'Could not afford further cuts' },
      { direction: 'down', magnitude: 6,  context: 'End-of-year retention discount for at-risk accounts' },
    ],
    marketShareTrend: 'losing',
    headcountTrend: 'shrinking',
    geographicFocus: 'US Midwest and Southeast regional markets',
    ceoPriorityStatement: 'We are focused on protecting our core rural and regional customer base. Our local relationships and dedicated support are what national players cannot replicate.',
    recentNewsSignals: [
      'Closed two regional offices to cut overhead',
      'Lost 3 mid-market accounts to ValueNet in Q1',
      'Announced \'Regional Loyalty\' pricing program for long-term customers',
    ],
    regulatoryConstraints: 'State-level telecom licensing in 6 states limits ability to exit or restructure quickly.',
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBar({ activeTab, setActiveTab, canRunSim }) {
  const tabs = [
    { id: 'setup',       label: 'Scenario Setup',      step: '01' },
    { id: 'competitors', label: 'Competitor Profiles',  step: '02' },
    { id: 'simulate',    label: 'Run Simulation',       step: '03', requiresReady: true },
  ]

  return (
    <div className="flex border-b border-gray-800">
      {tabs.map(tab => {
        const disabled = tab.requiresReady && !canRunSim
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            disabled={disabled}
            onClick={() => !disabled && setActiveTab(tab.id)}
            className={[
              'relative flex items-center gap-2.5 px-6 py-4 text-sm font-medium transition-colors border-b-2',
              isActive
                ? 'border-sky-400 text-white bg-gray-900/50'
                : 'border-transparent text-gray-400',
              disabled
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:text-gray-200 hover:bg-gray-900/30 cursor-pointer',
            ].join(' ')}
          >
            <span className={[
              'text-xs font-bold font-mono w-6 h-6 rounded flex items-center justify-center shrink-0',
              isActive ? 'bg-sky-400 text-gray-900' : 'bg-gray-800 text-gray-500',
            ].join(' ')}>
              {tab.step}
            </span>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-200">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

function ScenarioSetupTab({ yourCompany, setYourCompany, onLoadDemo }) {
  function update(key, value) {
    setYourCompany(prev => ({ ...prev, [key]: value }))
  }

  const inputCls = 'w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Your Company &amp; Strategic Move</h2>
          <p className="text-sm text-gray-400 mt-0.5">Define the competitive trigger you want to simulate.</p>
        </div>
        <button
          onClick={onLoadDemo}
          className="shrink-0 px-4 py-2 text-sm font-medium text-sky-400 border border-sky-800 rounded-lg hover:bg-sky-950 transition-colors"
        >
          Load Demo
        </button>
      </div>

      <div className="space-y-4">
        <Field label="Company Name" hint="Your company's name as it will appear in the simulation.">
          <input
            type="text"
            value={yourCompany.name}
            onChange={e => update('name', e.target.value)}
            placeholder="e.g. TelcoX"
            className={inputCls}
          />
        </Field>

        <Field
          label="Strategic Move"
          hint="The competitive action you are announcing. Be specific — this is the trigger the competitors will react to."
        >
          <input
            type="text"
            value={yourCompany.strategicMove}
            onChange={e => update('strategicMove', e.target.value)}
            placeholder="e.g. 10% price cut on core unlimited plan"
            className={inputCls}
          />
        </Field>

        <Field
          label="Context (optional)"
          hint="Additional background that helps the simulation understand your rationale."
        >
          <textarea
            value={yourCompany.context}
            onChange={e => update('context', e.target.value)}
            placeholder="e.g. Attempting to gain market share in urban markets ahead of Q3 budget season"
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>

      {yourCompany.name && yourCompany.strategicMove && (
        <div className="p-4 bg-emerald-950 border border-emerald-800 rounded-lg">
          <p className="text-sm text-emerald-300">
            <span className="font-semibold">{yourCompany.name}</span> is announcing:{' '}
            <span className="italic text-emerald-200">{yourCompany.strategicMove}</span>
          </p>
          <p className="text-xs text-emerald-500 mt-1">
            Ready — proceed to Competitor Profiles.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Simulate tab ─────────────────────────────────────────────────────────────

const STEPS = [
  { delay: 0,     label: 'Building competitor profiles...' },
  { delay: 2000,  label: 'Round 1 — independent reactions...' },
  { delay: 6000,  label: 'Round 2 — adjusting for market dynamics...' },
  { delay: 12000, label: 'Synthesizing strategic recommendation...' },
]

function LoadingPanel() {
  const [reached, setReached] = useState(0)
  const timers = useRef([])

  useEffect(() => {
    STEPS.forEach((step, i) => {
      const t = setTimeout(() => setReached(i), step.delay)
      timers.current.push(t)
    })
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div className="py-10 space-y-4">
      <p className="text-sm font-medium text-gray-500 mb-8 uppercase tracking-wider text-xs">Simulation running — 20–40 seconds</p>
      {STEPS.map((step, i) => {
        const done = i < reached
        const active = i === reached
        return (
          <div key={i} className="flex items-center gap-4">
            <div className={[
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all',
              done   ? 'bg-emerald-500 text-white' :
              active ? 'bg-sky-500 text-white animate-pulse' :
                       'bg-gray-800 text-gray-600',
            ].join(' ')}>
              {done ? '✓' : i + 1}
            </div>
            <span className={[
              'text-sm transition-colors',
              done   ? 'text-emerald-400 font-medium' :
              active ? 'text-sky-300 font-medium' :
                       'text-gray-600',
            ].join(' ')}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SimulateTab({ isLoading, error, simulationResult, onRun, onRerun, onBack, yourCompany, competitors }) {
  const filledCompetitors = competitors.filter(c => c.name.trim())

  const hasRun = useRef(false)
  useEffect(() => {
    if (!hasRun.current && !isLoading && !simulationResult && !error) {
      hasRun.current = true
      onRun()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Simulation Results</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {yourCompany.name} · {filledCompetitors.length} competitor{filledCompetitors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-3 py-2 text-sm text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
          >
            ← Edit Scenario
          </button>
          {simulationResult && !isLoading && (
            <button
              onClick={onRerun}
              className="px-3 py-2 text-sm font-medium text-sky-400 border border-sky-800 rounded-lg hover:bg-sky-950 transition-colors"
            >
              Re-run
            </button>
          )}
        </div>
      </div>

      {isLoading && <LoadingPanel />}

      {error && !isLoading && (
        <div className="p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-sm font-semibold text-red-300">Simulation failed</p>
          <p className="text-sm text-red-400 mt-1 font-mono">{error}</p>
          <button
            onClick={onRerun}
            className="mt-3 px-3 py-1.5 text-sm font-medium text-red-400 border border-red-800 rounded-lg hover:bg-red-900 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {simulationResult && !isLoading && (
        <SimulationResults
          result={simulationResult}
          yourCompany={yourCompany}
          rawCompetitors={competitors}
        />
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('setup')
  const [activeCompetitor, setActiveCompetitor] = useState(0)
  const [yourCompany, setYourCompany] = useState({ name: '', strategicMove: '', context: '' })
  const [competitors, setCompetitors] = useState([
    defaultCompetitor(),
    defaultCompetitor(),
    defaultCompetitor(),
  ])
  const [simulationResult, setSimulationResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const canRunSim = Boolean(yourCompany.name.trim() && yourCompany.strategicMove.trim())

  async function runSimulation() {
    setSimulationResult(null)
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yourCompany, competitors }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
      setSimulationResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function loadDemo() {
    setYourCompany(DEMO_YOUR_COMPANY)
    setCompetitors(DEMO_COMPETITORS)
    setSimulationResult(null)
    setError(null)
    setActiveCompetitor(0)
    setActiveTab('competitors')
  }

  const inputCls = 'w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors'

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Header */}
      <header style={{ background: '#0b1426', borderBottom: '1px solid #1e3a5f' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: 'white' }}>
              CS
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">CompetitorSim</h1>
              <p className="text-xs" style={{ color: '#4a7fa5' }}>Strategic Intelligence Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-500">AI Engine Active</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1f2937' }}>
          <TabBar activeTab={activeTab} setActiveTab={setActiveTab} canRunSim={canRunSim} />

          <div className="p-6">
            {activeTab === 'setup' && (
              <ScenarioSetupTab
                yourCompany={yourCompany}
                setYourCompany={setYourCompany}
                onLoadDemo={loadDemo}
              />
            )}

            {activeTab === 'competitors' && (
              <div>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">Competitor Profiles</h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Fill in data for each competitor. Scores update in real time.
                    </p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('simulate') }}
                    disabled={!canRunSim}
                    className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: canRunSim ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : undefined, color: canRunSim ? 'white' : undefined, border: !canRunSim ? '1px solid #374151' : undefined }}
                  >
                    Run Simulation →
                  </button>
                </div>

                {/* Competitor sub-tabs */}
                <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid #1f2937' }}>
                  {competitors.map((c, i) => {
                    const label = c.name.trim() || `Competitor ${String.fromCharCode(65 + i)}`
                    const isActive = activeCompetitor === i
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveCompetitor(i)}
                        className={[
                          'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                          isActive
                            ? 'border-sky-400 text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-300',
                        ].join(' ')}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                <CompetitorProfileForm
                  competitor={competitors[activeCompetitor]}
                  index={activeCompetitor}
                  onChange={(idx, updated) =>
                    setCompetitors(prev => prev.map((c, j) => j === idx ? updated : c))
                  }
                />
              </div>
            )}

            {activeTab === 'simulate' && (
              <SimulateTab
                isLoading={isLoading}
                error={error}
                simulationResult={simulationResult}
                onRun={runSimulation}
                onRerun={() => { setSimulationResult(null); setError(null); runSimulation() }}
                onBack={() => setActiveTab('setup')}
                yourCompany={yourCompany}
                competitors={competitors}
              />
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          Powered by Anthropic Claude · Multi-agent competitive simulation
        </p>
      </main>
    </div>
  )
}
