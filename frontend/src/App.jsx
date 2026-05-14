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
    { id: 'setup',       label: 'Scenario Setup' },
    { id: 'competitors', label: 'Competitor Profiles' },
    { id: 'simulate',    label: 'Run Simulation', requiresReady: true },
  ]

  return (
    <div className="flex border-b border-gray-200">
      {tabs.map(tab => {
        const disabled = tab.requiresReady && !canRunSim
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            disabled={disabled}
            onClick={() => !disabled && setActiveTab(tab.id)}
            className={[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500',
              disabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:text-gray-700 hover:border-gray-300 cursor-pointer',
            ].join(' ')}
          >
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
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function ScenarioSetupTab({ yourCompany, setYourCompany, onLoadDemo }) {
  function update(key, value) {
    setYourCompany(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your Company & Strategic Move</h2>
          <p className="text-sm text-gray-500 mt-0.5">Define the competitive trigger you want to simulate.</p>
        </div>
        <button
          onClick={onLoadDemo}
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Load Demo Data
        </button>
      </div>

      <div className="space-y-4">
        <Field label="Company Name" hint="Your company's name as it will appear in the simulation.">
          <input
            type="text"
            value={yourCompany.name}
            onChange={e => update('name', e.target.value)}
            placeholder="e.g. TelcoX"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </Field>
      </div>

      {yourCompany.name && yourCompany.strategicMove && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <span className="font-medium">{yourCompany.name}</span> is announcing:{' '}
            <span className="italic">{yourCompany.strategicMove}</span>
          </p>
          <p className="text-xs text-green-600 mt-1">
            Ready — go to Competitor Profiles to configure who will react.
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
    <div className="py-8 space-y-4">
      <p className="text-sm font-medium text-gray-500 mb-6">Simulation running — this takes ~20–40 seconds.</p>
      {STEPS.map((step, i) => {
        const done = i < reached
        const active = i === reached
        return (
          <div key={i} className="flex items-center gap-3">
            <div className={[
              'w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all',
              done   ? 'bg-green-500 text-white' :
              active ? 'bg-blue-500 text-white animate-pulse' :
                       'bg-gray-100 text-gray-300',
            ].join(' ')}>
              {done ? '✓' : i + 1}
            </div>
            <span className={[
              'text-sm transition-colors',
              done   ? 'text-green-600 font-medium' :
              active ? 'text-blue-600 font-medium' :
                       'text-gray-300',
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

  // Auto-run when tab is first shown and not yet loading/done
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
          <h2 className="text-lg font-semibold text-gray-900">Run Simulation</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {yourCompany.name} · {filledCompetitors.length} competitor{filledCompetitors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Edit Scenario
          </button>
          {simulationResult && !isLoading && (
            <button
              onClick={onRerun}
              className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Re-run Simulation
            </button>
          )}
        </div>
      </div>

      {isLoading && <LoadingPanel />}

      {error && !isLoading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700">Simulation failed</p>
          <p className="text-sm text-red-600 mt-1 font-mono">{error}</p>
          <button
            onClick={onRerun}
            className="mt-3 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">CompetitorSim</h1>
          <p className="text-sm text-gray-500">AI-powered competitive response simulation</p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">Competitor Profiles</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Fill in data for each competitor. Scores update in real time.
                  </p>
                </div>

                {/* Competitor sub-tabs */}
                <div className="flex gap-1 mb-6 border-b border-gray-200">
                  {competitors.map((c, i) => {
                    const label = c.name.trim() || `Competitor ${String.fromCharCode(65 + i)}`
                    const isActive = activeCompetitor === i
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveCompetitor(i)}
                        className={[
                          'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                          isActive
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
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
      </main>
    </div>
  )
}
