# CompetitorSim

AI-powered competitive response simulator. Enter your strategic move and your competitors' financial and behavioural profiles — CompetitorSim models how each competitor will react across multiple rounds of reasoning, then synthesises a strategic recommendation for your company.

---

## What it does

1. **Profile your competitors** — input financial data (margins, debt, cash), pricing history, market position, and qualitative signals (CEO statements, recent news)
2. **Define your move** — a price cut, product launch, market entry, or any strategic trigger
3. **Run the simulation** — three AI agents (one per competitor) independently decide how to respond, then observe each other's moves and reconsider. An orchestrator agent synthesises the final competitive landscape
4. **Get a recommendation** — plain-English strategic advice with specific numbers, scenario outcomes (best/likely/worst), key risks, and actionable watchlist signals

---

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Backend | Node.js, Express |
| AI | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |

---

## Getting started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd competitor-sim

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your key:
```
ANTHROPIC_API_KEY=your-key-here
```

### 3. Start the backend

```bash
cd backend
node server.js
# → CompetitorSim backend running on port 3001
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Usage

### Quick start with demo data

1. Go to the **Scenario Setup** tab
2. Click **Load Demo Data** — this populates a telecom scenario with three competitors (ValueNet, PremiumConnect, RegionalPlus)
3. Click the **Run Simulation** tab — the simulation fires automatically (~30–60 seconds)
4. Read the results dashboard

### Custom scenario

1. **Scenario Setup** — enter your company name, your strategic move, and optional context
2. **Competitor Profiles** — fill in data for up to 3 competitors. The live scorecard on the right updates as you type, showing financial firepower, aggression level, and dominant strategy
3. **Run Simulation** — click the tab to run. Watch the multi-step progress display

### Sensitivity analysis

After results load, use the **Adjust assumptions** panel to drag sliders and see how outcomes shift:
- Change a competitor's financial strength
- Adjust your price cut magnitude
- Change the market growth rate
- Toggle a regulatory pricing cap

Each change re-runs the full simulation with modified parameters.

---

## How the scoring works

CompetitorSim converts raw competitor data into three scores before the AI agents see it:

**Financial Capacity Score (0–100)**
Measures how much financial room a competitor has to mount or sustain a competitive response. Combines cash position (40%), debt-to-EBITDA (35%), and EBITDA margin (25%).
- 70–100: Can fund aggressive or prolonged moves
- 40–70: Selective responses only
- 0–40: Financially constrained — defensive moves only

**Aggression Index (0–100)**
Measures how likely a competitor is to respond forcefully and quickly. Driven by historical price move magnitude, market share trend, and financial capacity.
- 70+: Expect fast, large-magnitude responses
- 45–70: Will respond to direct threats
- 0–45: Prefers to hold position or respond gradually

**Strategic Intent Vector**
Four dimensions (summing to 100%) that shape how the AI agent makes decisions:
- **Market share focus** — prioritises volume over margins
- **Margin protection** — resists price erosion, defends profitability
- **Niche / segment focus** — avoids broad battles, defends specific customers
- **Product differentiation** — competes on features and quality, not price

---

## Project structure

```
competitor-sim/
├── .env.example              API key placeholder
├── backend/
│   ├── server.js             Express API (POST /api/simulate, GET /api/health)
│   ├── agents.js             Multi-round simulation engine
│   ├── profileBuilder.js     Deterministic scoring engine
│   ├── prompts.js            Prompt library for all AI agents
│   ├── test-profile.js       Scoring unit tests
│   ├── test-prompts.js       Prompt generation tests
│   ├── test-simulation.js    Full live simulation test
│   └── test-e2e.js           End-to-end API test
└── frontend/
    └── src/
        ├── App.jsx                        App shell, state, API call
        └── components/
            ├── CompetitorProfileForm.jsx  Data entry + live scorecard
            └── SimulationResults.jsx      Results dashboard
```

---

## API

### `GET /api/health`

```json
{ "status": "ok", "timestamp": "2026-05-14T22:00:00.000Z" }
```

### `POST /api/simulate`

**Request body:**
```json
{
  "yourCompany": {
    "name": "TelcoX",
    "strategicMove": "10% price cut on core unlimited plan",
    "context": "Targeting urban market share"
  },
  "competitors": [
    {
      "name": "ValueNet",
      "revenueGrowthRate": 18.5,
      "ebitdaMargin": 12.3,
      "cashPosition": "strong",
      "debtToEbitda": 1.8,
      "rdSpendPct": 3.5,
      "lastThreePriceMoves": [
        { "direction": "down", "magnitude": 22, "context": "Q4 campaign" }
      ],
      "marketShareTrend": "gaining",
      "headcountTrend": "growing",
      "geographicFocus": "North America",
      "ceoPriorityStatement": "We will be the price-value leader in every market.",
      "recentNewsSignals": ["Hired 200 sales reps in Q1"],
      "regulatoryConstraints": ""
    }
  ]
}
```

**Response:** Full simulation result including rounds, orchestrator output, competitor profiles, and metadata. See `test-e2e.js` for the full response shape.

---

## Running tests

```bash
cd backend

node test-profile.js     # unit tests — no API calls
node test-prompts.js     # prompt tests — no API calls
node test-simulation.js  # live simulation — ~60s, uses Anthropic API
node test-e2e.js         # full stack — requires server running on :3001
```

---

## Cost

Each simulation run makes approximately 7–10 Anthropic API calls (3 per round × 2–3 rounds + 1 orchestrator call). At current `claude-sonnet-4-6` pricing, a typical 3-competitor simulation costs roughly $0.10–0.25.

---

## License

MIT
