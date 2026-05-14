const BASE = 'http://localhost:3001'
const start = Date.now()

// ── Assertion helper ──────────────────────────────────────────────────────────

const results = []

function assert(label, condition, detail = '') {
  const pass = Boolean(condition)
  results.push({ label, pass, detail })
  console.log(`  ${pass ? '✓' : '✗'} ${label}${detail ? `  (${detail})` : ''}`)
  return pass
}

// ── Demo payload ──────────────────────────────────────────────────────────────

const payload = {
  yourCompany: {
    name: 'TelcoX',
    strategicMove: 'Launch of a new mid-market bundle priced 10% above ValueNet but with a 90-day free trial and dedicated onboarding',
    context: 'Targeting ValueNet\'s recent mid-market gains with a value-add play rather than a price war.',
  },
  competitors: [
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
      ceoPriorityStatement: 'Our mission is to be the undisputed price-value leader in every market we enter.',
      recentNewsSignals: ['Announced expansion into 4 new metro markets', 'Hired 200 sales reps in Q1'],
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
      ceoPriorityStatement: 'We compete on innovation and customer experience, not price.',
      recentNewsSignals: ['Launched AI-powered analytics suite', 'Won three analyst leader rankings'],
      regulatoryConstraints: 'Subject to enterprise data residency requirements in EU.',
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
      ceoPriorityStatement: 'We are focused on protecting our core rural and regional customer base.',
      recentNewsSignals: ['Closed two regional offices to cut overhead', 'Lost 3 mid-market accounts to ValueNet in Q1'],
      regulatoryConstraints: 'State-level telecom licensing in 6 states limits ability to exit quickly.',
    },
  ],
}

// ── Test 1: Health check ──────────────────────────────────────────────────────

console.log('\n[1] Health check')
const healthRes = await fetch(`${BASE}/api/health`)
assert('GET /api/health returns 200', healthRes.status === 200, `status=${healthRes.status}`)
const healthBody = await healthRes.json()
assert('Health response has status=ok', healthBody.status === 'ok', `got: ${healthBody.status}`)

// ── Test 2: Full simulation ───────────────────────────────────────────────────

console.log('\n[2] Full 3-competitor simulation (this will take ~30s)...')
const simRes = await fetch(`${BASE}/api/simulate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

assert('POST /api/simulate returns 200', simRes.status === 200, `status=${simRes.status}`)

const result = await simRes.json()

// ── Test 3: Assertions on response ───────────────────────────────────────────

console.log('\n[3] Response assertions')

const r1 = result.rounds?.round1 ?? []
assert(
  'rounds.round1 has 3 entries',
  r1.length === 3,
  `got ${r1.length}`
)

const rec = result.orchestratorOutput?.strategicRecommendation
assert(
  'orchestratorOutput.strategicRecommendation is a non-empty string',
  typeof rec === 'string' && rec.trim().length > 0,
  `got: ${typeof rec}`
)

const signals = result.orchestratorOutput?.watchlistSignals
assert(
  'orchestratorOutput.watchlistSignals has at least 1 item',
  Array.isArray(signals) && signals.length >= 1,
  `got ${Array.isArray(signals) ? signals.length : typeof signals} items`
)

const outcomes = result.orchestratorOutput?.playerOutcomes
assert(
  'orchestratorOutput.playerOutcomes has at least 2 keys',
  outcomes && Object.keys(outcomes).length >= 2,
  `got ${outcomes ? Object.keys(outcomes).length : 0} keys`
)

const capScore = result.competitorProfiles?.[0]?.financialCapacityScore
assert(
  'competitorProfiles[0].financialCapacityScore is a number between 0–100',
  typeof capScore === 'number' && capScore >= 0 && capScore <= 100,
  `got: ${capScore}`
)

assert(
  'totalRounds is 2 or 3',
  result.totalRounds === 2 || result.totalRounds === 3,
  `got: ${result.totalRounds}`
)

// ── Summary ───────────────────────────────────────────────────────────────────

const elapsed = ((Date.now() - start) / 1000).toFixed(1)
const failed = results.filter(r => !r.pass)

console.log(`\nTotal time: ${elapsed}s`)
console.log(`Passed: ${results.length - failed.length}/${results.length}`)

if (failed.length > 0) {
  throw new Error(
    `E2E TEST FAILED — ${failed.length} assertion(s) failed:\n` +
    failed.map(r => `  ✗ ${r.label}${r.detail ? ` (${r.detail})` : ''}`).join('\n')
  )
}

console.log('\nE2E TEST PASSED')
