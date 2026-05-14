# CompetitorSim — Claude Code Guide

## What this project is

CompetitorSim simulates how competitors will react to a strategic move (price cut, bundle launch, market entry) using AI agents. Each competitor is modelled from real financial and behavioural data, scored across financial capacity and aggression, and run through 2–3 rounds of multi-agent reasoning before an orchestrator synthesises a strategic recommendation.

## Project structure

```
competitor-sim/
├── backend/              Node.js + Express API
│   ├── server.js         Express server, single POST /api/simulate endpoint
│   ├── agents.js         Multi-round simulation engine (Anthropic SDK)
│   ├── profileBuilder.js Scoring engine — converts raw inputs to scored profiles
│   ├── prompts.js        Prompt library for competitor agents and orchestrator
│   ├── test-profile.js   Unit test for profileBuilder scoring math
│   ├── test-prompts.js   Unit test for prompt generation
│   ├── test-simulation.js Integration test — runs a full live simulation
│   └── test-e2e.js       End-to-end test against the running server
└── frontend/             Vite + React + Tailwind UI
    └── src/
        ├── App.jsx                 App shell — 3 tabs, all state, API call
        └── components/
            ├── CompetitorProfileForm.jsx  Data entry + live scorecard
            └── SimulationResults.jsx      Full results dashboard
```

## Running locally

**Backend** (port 3001):
```bash
cd backend
node server.js         # production
node --watch server.js # dev with file watching
```

**Frontend** (port 5173):
```bash
cd frontend
npm run dev
```

Both must be running for the UI to work. Backend must start first.

## Environment variables

Copy `.env.example` to `.env` in the project root and fill in your key:
```
ANTHROPIC_API_KEY=your-key-here
```

The backend loads `.env` from the project root (`../` relative to `/backend`). Do not place `.env` inside `/backend`.

## Architecture decisions

**ES modules throughout** — both `backend/` and `frontend/` use `"type": "module"`. Use `import`/`export`, never `require`.

**Scoring is deterministic, reasoning is AI** — `profileBuilder.js` computes scores from a fixed formula (no AI). The AI agents receive those scores and generate strategic reasoning. This separation means scores are always consistent and auditable.

**Multi-round simulation** — Round 1 is independent reactions. Round 2 shows each competitor what the others decided and asks if they hold or adjust. If nobody shifts (type unchanged, magnitude within 15 points), equilibrium is declared and round 3 is skipped. This produces richer strategic dynamics than single-shot prompting.

**Prompt language rules** — Prompts in `prompts.js` enforce plain-English output with real numbers. Do not let the AI echo internal score names ("Growth Maximizer intent at 55.6%") — it must translate those into business language while keeping the actual numbers.

**CORS** — Backend allows any `localhost` port (`/^http:\/\/localhost:\d+$/`). Vite may pick 5173 or 5174 depending on what's already in use.

## Key files to know before editing

| File | What to know |
|------|-------------|
| `backend/profileBuilder.js` | All scoring formulas. If you change a formula, re-run `test-profile.js` and update the assertions. |
| `backend/prompts.js` | Three functions: system prompt per competitor, round 2/3 prompt, orchestrator prompt. Language rules are in the system prompt and orchestrator prompt comments. |
| `backend/agents.js` | `runSimulation()` is the main export. The model is set as `MODEL` constant at the top — update there only. |
| `frontend/src/App.jsx` | All app state lives here. `runSimulation()` fetch call is at line ~356. Demo data (`DEMO_COMPETITORS`, `DEMO_YOUR_COMPANY`) is defined at the top. |
| `frontend/src/components/SimulationResults.jsx` | Results dashboard. `SensitivityPanel` manages its own local state and re-POSTs independently. `currentResult` is local state seeded from the `result` prop. |

## Running tests

All test scripts are in `/backend` and require the `.env` to be present.

```bash
cd backend

# Unit tests (no API calls)
node test-profile.js    # scoring math
node test-prompts.js    # prompt generation

# Integration tests (live API calls — ~30–60s each)
node test-simulation.js  # full 3-competitor simulation
node test-e2e.js         # full stack against running server (start server first)
```

`test-e2e.js` requires the backend server to be running on port 3001.

## Model

Currently using `claude-sonnet-4-6`. Set in `backend/agents.js`:
```js
const MODEL = 'claude-sonnet-4-6'
```

Competitor agents use `max_tokens: 1000`. The orchestrator uses `max_tokens: 4096` — do not lower this; the synthesis output is long and will be cut off mid-JSON if reduced.

## Adding a new competitor field

1. Add the field to `defaultCompetitor()` in `frontend/src/App.jsx`
2. Add a form input in `CompetitorProfileForm.jsx`
3. If the field should affect scoring, update `computeScores()` in `CompetitorProfileForm.jsx` AND `buildCompetitorProfile()` in `backend/profileBuilder.js` — keep both in sync
4. Update the JSDoc typedef in `profileBuilder.js`
5. Re-run `test-profile.js`
