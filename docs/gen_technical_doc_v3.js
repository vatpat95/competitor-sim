/**
 * gen_technical_doc_v3.js
 * Regenerates CompetitorSim_Technical_Documentation.docx to reflect the
 * current codebase state as of June 2026.
 *
 * Run: node gen_technical_doc_v3.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageNumber, PageBreak,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Colors ───────────────────────────────────────────────────────────────────
const NAVY    = '1E2761';
const ACCENT  = '4472C4';
const TEAL    = '028090';
const GRAY_BG = 'F2F4F8';
const CODE_BG = 'EFEFEF';
const WHITE   = 'FFFFFF';
const TEXT    = '2D2D2D';

// ── Border helpers ───────────────────────────────────────────────────────────
const b1 = (c = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color: c });
const bords = (c = 'CCCCCC') => ({ top: b1(c), bottom: b1(c), left: b1(c), right: b1(c) });
const noBords = { top: { style: BorderStyle.NONE, size: 0, color: WHITE },
                  bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
                  left:   { style: BorderStyle.NONE, size: 0, color: WHITE },
                  right:  { style: BorderStyle.NONE, size: 0, color: WHITE } };

// ── Typography helpers ───────────────────────────────────────────────────────
const run  = (text, opts = {}) => new TextRun({ text, font: 'Calibri', size: 22, color: TEXT, ...opts });
const mono = (text, opts = {}) => new TextRun({ text, font: 'Courier New', size: 19, color: TEXT, ...opts });

const h1 = text => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 320, after: 160 },
  children: [run(text, { bold: true, size: 32, color: NAVY })],
});
const h2 = text => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [run(text, { bold: true, size: 26, color: ACCENT })],
});
const h3 = text => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 100 },
  children: [run(text, { bold: true, size: 23, color: TEAL })],
});
const p = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 120 },
  alignment: AlignmentType.BOTH,
  children: [run(text, opts)],
});
const pRuns = runs => new Paragraph({
  spacing: { before: 80, after: 120 },
  alignment: AlignmentType.BOTH,
  children: runs.map(r => run(r.text, r)),
});
const li = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  spacing: { before: 50, after: 70 },
  children: [run(text)],
});
const codeP = text => new Paragraph({
  spacing: { before: 40, after: 40 },
  indent: { left: 360 },
  shading: { fill: CODE_BG, type: ShadingType.CLEAR },
  children: [mono(text)],
});
const sp = (px = 80) => new Paragraph({ spacing: { before: px, after: 0 }, children: [run('')] });
const callout = (text, bg = 'EBF3FB') => new Paragraph({
  spacing: { before: 160, after: 160 },
  indent: { left: 400, right: 200 },
  shading: { fill: bg, type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 14, color: ACCENT, space: 1 } },
  children: [run(text, { italics: true, color: NAVY })],
});
const pb = () => new Paragraph({ children: [new PageBreak()] });

// ── Table helpers ────────────────────────────────────────────────────────────
function simpleTable(rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((cells, ri) => new TableRow({
      children: cells.map((text, ci) => new TableCell({
        borders: bords(),
        width: { size: widths[ci], type: WidthType.DXA },
        shading: { fill: ri === 0 ? NAVY : (ri % 2 === 0 ? GRAY_BG : WHITE), type: ShadingType.CLEAR },
        margins: { top: 90, bottom: 90, left: 140, right: 140 },
        children: [new Paragraph({
          children: [run(text, { bold: ri === 0, size: 20, color: ri === 0 ? WHITE : TEXT })],
        })],
      })),
    })),
  });
}

// ── Architecture diagram ─────────────────────────────────────────────────────
function archDiagram() {
  const fullBox = (label, sub, fill, textColor = WHITE) => new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: bords(fill),
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [run(label, { bold: true, size: 22, color: textColor })] }),
          ...(sub ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(sub, { size: 19, color: textColor, italics: true })] })] : []),
        ],
      })],
    })],
  });

  const arrowP = () => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: [run('▼', { bold: true, color: ACCENT, size: 22 })],
  });

  const threeBox = (cols) => {
    const w = [3060, 3060, 3060];
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: w,
      rows: [new TableRow({
        children: cols.map((col, ci) => new TableCell({
          borders: bords(TEAL),
          width: { size: w[ci], type: WidthType.DXA },
          shading: { fill: '0A4B5C', type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [run(col.title, { bold: true, size: 20, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [run(col.sub, { size: 18, color: 'B0D4DC', italics: true })] }),
          ],
        })),
      })],
    });
  };

  const twoBox = (left, right) => {
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4620, 4620],
      rows: [new TableRow({
        children: [left, right].map((col, ci) => new TableCell({
          borders: bords('2E7D32'),
          width: { size: 4620, type: WidthType.DXA },
          shading: { fill: '1B3A1C', type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [run(col.title, { bold: true, size: 20, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [run(col.sub, { size: 18, color: '90EE90', italics: true })] }),
          ],
        })),
      })],
    });
  };

  return [
    fullBox('BROWSER · React 19 + Vite 8 + Tailwind CSS v4', 'App.jsx | CompetitorProfileForm.jsx | SimulationResults.jsx', '2E4057'),
    arrowP(),
    fullBox('POST /api/simulate → JSON response', '', '3A3A3A'),
    arrowP(),
    fullBox('EXPRESS API SERVER · server.js · localhost:3001', 'GET /api/health | POST /api/simulate', '1E3A5F'),
    arrowP(),
    threeBox([
      { title: 'profileBuilder.js', sub: 'Scoring Engine\nFinancial Capacity\nAggression Index\nStrategic Intent' },
      { title: 'agents.js', sub: 'Simulation Engine\nRound 1 → Round 2\nEquilibrium Check\nRound 3 (conditional)\nPseudonymization' },
      { title: 'prompts.js', sub: 'Prompt Library\nSystem Prompt\nRound Prompt\nOrchestrator Prompt' },
    ]),
    arrowP(),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Competitor Agents: claude-haiku-4-5 · max_tokens 1,000 · Prompt caching enabled', { size: 19, italics: true, color: '888888' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Orchestrator: claude-sonnet-4-6 · max_tokens 16,000', { size: 19, italics: true, color: '888888' })] }),
    sp(60),
    fullBox('ANTHROPIC CLAUDE API', 'Two-model strategy: Haiku for agents · Sonnet for orchestrator synthesis', '006064'),
    arrowP(),
    twoBox(
      { title: 'SIMULATION OUTPUT', sub: 'Round results | Equilibrium state\nDecision brief | Risk analysis\nStrategic options | Monitoring plan' },
      { title: 'EVIDENCE LAYER', sub: 'Evidence classification per finding\nKnown Fact | User Input | Assumption\nModel Inference | Derived Calculation' }
    ),
    sp(60),
    p('Key: Dark blue = Frontend | Dark navy = Backend/API layer | Teal = Prompt/agent layer | Dark teal = External AI service | Dark green = Output', { italics: true, size: 18, color: '888888' }),
  ];
}

// ── Document body ─────────────────────────────────────────────────────────────
const children = [

  // ── Cover ─────────────────────────────────────────────────────────────────
  sp(200),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [run('CompetitorSim', { bold: true, size: 56, color: NAVY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 160 },
    children: [run('Technical Architecture & Deep-Dive Documentation', { size: 28, color: ACCENT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [run('An AI-Powered Competitive Reaction Simulator', { italics: true, size: 22, color: TEAL })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 0 },
    children: [run('June 2026 | Competitor agents: claude-haiku-4-5 | Orchestrator: claude-sonnet-4-6', { size: 19, color: '888888' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 0 },
    children: [run('Proof of concept for: "Simulating Competitors: How AI Agents Redefine Competitive Strategy in 2025"', { italics: true, size: 19, color: '888888' })],
  }),
  pb(),

  // ── 1. Executive Summary ──────────────────────────────────────────────────
  h1('1. Executive Summary'),
  p('CompetitorSim is a working, interactive proof-of-concept demonstrating the practical feasibility of AI-powered competitive reaction simulation. It was purpose-built to validate the theoretical framework described in the accompanying whitepaper, which argues that AI multi-agent systems can replace guesswork in predicting how competitors will respond to strategic moves.'),
  p('A user enters their company\'s strategic move and profiles of up to three competitors. Within approximately 20–40 seconds, a Claude-powered multi-agent simulation returns:'),
  li('Round-by-round competitor responses with plain-English reasoning'),
  li('An equilibrium state — when competitive dynamics stabilize'),
  li('A synthesized strategic recommendation with decision brief, confidence bands, and risk analysis'),
  li('Evidence classification per finding (Known Fact / User Input / Assumption / Model Inference / Derived Calculation)'),
  li('A 30/60/90-day monitoring plan with owner functions and quantitative triggers'),
  li('Strategic options comparison across 3–5 alternative moves'),
  sp(),
  callout('Key finding: The built-in demo scenarios — including a real-world T-Mobile Uncarrier backtest (March 2013) and a Coca-Cola vs. PepsiCo pricing backtest (February 2023) — deliver the second-order insights the whitepaper predicts. The tool proves the theory works in practice and validates against known historical outcomes.'),
  pb(),

  // ── 2. Problem Statement ──────────────────────────────────────────────────
  h1('2. Problem Statement & Purpose'),
  p('Competitive strategy has a fundamental blind spot: organizations invest heavily in planning their own moves but dramatically underinvest in anticipating how competitors will respond. Traditional approaches all have well-documented limits:'),
  sp(),
  simpleTable([
    ['Tool', 'Core Limitation'],
    ['Benchmarking', 'Backward-looking — reflects what rivals did, not what they will do'],
    ['Expert Judgment', 'Bounded by cognitive biases; misses disruptive or unconventional responses'],
    ['War-Gaming Workshops', 'Produces 2–3 scenarios once a year; cannot match real-market velocity'],
    ['Spreadsheet Modeling', 'Static; assumes one future, ignores cascading competitor reactions'],
  ], [2800, 6560]),
  sp(),
  p('CompetitorSim exists to close this gap — providing a fast, repeatable simulation environment where competitive dynamics can be explored before a strategic move is executed in the real world.'),
  pb(),

  // ── 3. Architecture ───────────────────────────────────────────────────────
  h1('3. Architecture'),
  p('CompetitorSim is a full-stack JavaScript application. The backend is a Node.js/Express API that orchestrates Claude AI calls; the frontend is a React 19 + Vite application. Data flows in one direction: user input → scoring → simulation → synthesis → output.'),
  sp(),
  h2('System Architecture Diagram'),
  sp(60),
  ...archDiagram(),
  sp(),
  h2('End-to-End Data Flow'),
  sp(),
  simpleTable([
    ['Step', 'What Happens', 'Module'],
    ['1 Input', 'User enters company move, financial profile, and up to 3 competitor profiles in the React UI. Includes industry, geography, market overview, and your company\'s own financials.', 'App.jsx'],
    ['2 Score', 'profileBuilder converts raw inputs into Financial Capacity, Aggression Index, and Strategic Intent Vector scores (0–100) for each competitor.', 'profileBuilder.js'],
    ['3 Pseudonymize', 'agents.js replaces competitor names with neutral pseudonyms (Competitor A, B, C) before any Claude call. This prevents the model from drawing on pre-training knowledge about named real companies.', 'agents.js'],
    ['4 Round 1', 'Each competitor agent is called independently in parallel — receives its profile + the trigger event only. No knowledge of other rivals yet.', 'agents.js'],
    ['5 Round 2', 'Each agent receives Round 1 moves of ALL other competitors and may adjust its response. All agents called in parallel.', 'agents.js'],
    ['6 Equilibrium', 'If no competitor shifted by >15 points in magnitude or changed response type: equilibrium declared, skip Round 3.', 'agents.js'],
    ['7 Round 3', '(Conditional) Final stabilization round if equilibrium was not reached after Round 2.', 'agents.js'],
    ['8 Synthesize', 'Orchestrator agent receives pseudonymized summary of all rounds and outputs the full strategic brief.', 'agents.js + prompts.js'],
    ['9 Remap', 'All pseudonyms are replaced back to real names across every string field in the orchestrator output before returning to the frontend.', 'agents.js'],
    ['10 Output', 'Full JSON result returned to React frontend, persisted to sessionStorage, and rendered in SimulationResults.jsx.', 'server.js + App.jsx'],
  ], [1200, 5760, 2400]),
  pb(),

  // ── 4. Module Deep Dive ───────────────────────────────────────────────────
  h1('4. Module-by-Module Deep Dive'),

  h2('4.1 profileBuilder.js — Scoring Engine'),
  p('The most architecturally important module. Rather than passing raw user input directly to Claude, profileBuilder converts structured input fields per competitor into three deterministic behavioral scores and several qualitative summaries. This grounds every AI decision in specific, auditable inputs rather than hallucinated assumptions.'),
  sp(),
  h3('Input Fields per Competitor'),
  sp(),
  simpleTable([
    ['Field', 'Type', 'What It Captures'],
    ['revenueGrowthRate', 'number (%)', 'YoY revenue growth — signals momentum and hunger'],
    ['ebitdaMargin', 'number (%)', 'Profitability — determines capacity to fund responses'],
    ['cashPosition', '"strong" | "moderate" | "weak"', 'Liquidity qualifier — primary driver of financial capacity score'],
    ['debtToEbitda', 'number (x)', 'Leverage — constrains strategic options'],
    ['rdSpendPct', 'number (% of revenue)', 'Innovation investment rate — shapes Strategic Intent'],
    ['lastThreePriceMoves', 'array of { direction, magnitude, context }', 'Historical pricing behavior — key input to Aggression Index'],
    ['marketShareTrend', '"gaining" | "stable" | "losing"', 'Competitive position direction'],
    ['headcountTrend', '"growing" | "flat" | "shrinking"', 'Organizational investment signal'],
    ['geographicFocus', 'string', 'Where the competitor operates'],
    ['competitorType', 'enum (6 options)', 'Market role: Low-cost Challenger, Incumbent, Premium Brand, Regional Player, Fast Follower, Disruptor'],
    ['ceoPriorityStatement', 'string (text)', 'Verbatim or paraphrased strategic mandate from leadership — drives Strategic Intent Vector'],
    ['recentNewsSignals', 'string[] (max 5)', 'Recent announcements, hires, filings — surfaces as signal summary in prompt'],
    ['regulatoryConstraints', 'string (optional)', 'Legal or structural limits on competitive response'],
  ], [2200, 2600, 4560]),
  sp(),
  h3('Output: 3 Behavioral Scores + 3 Qualitative Summaries'),
  sp(),
  simpleTable([
    ['Output', 'Formula Inputs', 'What High vs. Low Means'],
    ['Financial Capacity Score (0–100)', 'cashPosition (40%) + debtToEbitda (35%) + ebitdaMargin (25%)', 'High = can fund aggressive moves. Low = constrained, will avoid expensive responses.'],
    ['Aggression Index (0–100)', 'lastThreePriceMoves magnitude (40%) + marketShareTrend (30%) + financialCapacityScore bonus (30%)', 'High = will escalate and retaliate fast. Low = will absorb or differentiate.'],
    ['Strategic Intent Vector', 'ceoPriorityStatement keywords + revenueGrowthRate + ebitdaMargin + rdSpendPct + marketShareTrend', '4-dimensional normalized vector: growthMaximizer, marginDefender, nichePlayer, innovationBetter. Dominant dimension shapes response type.'],
    ['Reaction Pattern Summary', 'lastThreePriceMoves history + aggressionIndex', 'Plain-English behavioral pattern narrative injected into prompt'],
    ['Constraint Summary', 'cashPosition + debtToEbitda + regulatoryConstraints', 'Plain-English constraint narrative with real numbers'],
    ['Signal Summary', 'recentNewsSignals + headcountTrend + aggressionIndex', 'Plain-English intelligence summary injected into prompt'],
  ], [2400, 3200, 3760]),
  sp(),
  callout('Design principle: Scoring is deterministic and separate from AI reasoning. The scoring engine ensures reproducibility and traceability. The AI layer then adds semantic nuance — interpreting what the scores mean in the context of the specific competitive scenario.'),

  sp(),
  h2('4.2 prompts.js — Prompt Library'),
  p('All prompt templates are centralized here. This is a deliberate architectural choice — keeping prompts out of business logic makes them easy to tune without touching the simulation engine.'),
  sp(),
  simpleTable([
    ['Function', 'When Called', 'What It Does'],
    ['buildCompetitorSystemPrompt(profile, scenarioContext)', 'Once per competitor per round (cached)', 'Injects the full scored profile translated to plain English, industry/geography context, triggering company\'s financial profile (what the competitor would know from public filings), and all behavioral constraints. Instructs Claude to reason as the CSO of that company.'],
    ['buildCompetitorRoundPrompt(triggerEvent, profile, otherMoves, scenarioContext)', 'Round 2+ only', 'Provides each agent with all other competitors\' previous-round moves, enabling reactive multi-agent dynamics. Asks: does your position change given what rivals just did?'],
    ['buildOrchestratorPrompt(triggerEvent, allFinalResponses, yourCompanyProfile, scenarioContext)', 'Once per simulation', 'Synthesizes all rounds into the full strategic brief: decision brief, market equilibrium, player outcomes, strategic options, monitoring plan, evidence classification.'],
  ], [2800, 1800, 4760]),
  sp(),
  h3('Competitor Agent Response Schema'),
  codeP('{'),
  codeP('  "primaryResponse": {'),
  codeP('    "type": "price_cut"|"price_hold"|"price_increase"|"bundle_add"|"marketing_surge"|"niche_pivot"|"alliance"|"no_response",'),
  codeP('    "magnitude": number,    // 0-30: percentage change or intensity'),
  codeP('    "timing": "immediate"|"within_30_days"|"within_quarter"|"wait_and_see",'),
  codeP('    "rationale": string     // 2-3 plain-English sentences using real numbers'),
  codeP('  },'),
  codeP('  "alternativeResponse": { /* same shape */ },'),
  codeP('  "keyAssumption": string,  // "We are assuming that..."'),
  codeP('  "confidenceScore": number,  // 0-100'),
  codeP('  "dataPointsDriving": string[],  // exactly 3 plain facts with real numbers'),
  codeP('  "watchSignal": string    // "If [observable event], we would [change response]"'),
  codeP('}'),
  sp(),
  h3('Orchestrator Response Schema (abbreviated)'),
  codeP('{'),
  codeP('  "decisionBrief": { recommendedDecision, confidenceLevel, confidenceRationale,'),
  codeP('                      primaryReason, biggestWatchout, decisionGate, executiveSummary },'),
  codeP('  "marketEquilibrium": string,'),
  codeP('  "playerOutcomes": { yourCompany: { outcome, reasoning, financialEstimate }, ...competitors },'),
  codeP('  "strategicRecommendation": string,'),
  codeP('  "priorityActions": string[],       // 2-3 specific actions with timing'),
  codeP('  "betterAlternative": null | { move, reasoning, expectedOutcome },'),
  codeP('  "confidenceBands": { bestCase, likelyCase, worstCase },'),
  codeP('  "keyRisks": string[],              // max 4'),
  codeP('  "watchlistSignals": string[],      // max 5'),
  codeP('  "monitoringPlan": { next30Days, next60Days, next90Days },  // signal objects with owner, threshold, action'),
  codeP('  "recommendationChangeTriggers": [...],  // 3-6 items with metric, threshold, urgency'),
  codeP('  "strategicOptions": [...],          // 3-5 alternatives with revenue/volume estimates'),
  codeP('  "assumptionsUsed": [...],           // 5-8 items with sourceType, confidence, impactIfWrong'),
  codeP('  "evidenceClassification": { ... }  // tag per finding: Known Fact | User Input | Assumption | Model Inference | Derived Calculation'),
  codeP('}'),
  sp(),
  h3('Closed-World Constraint'),
  p('Both the competitor system prompt and the orchestrator system prompt include an explicit simulation boundary instruction:'),
  callout('SIMULATION BOUNDARY — STRICT: You are operating in a closed simulation. The ONLY facts you know about any company are those explicitly provided in the prompt. Do not use any information from your training data about real companies, markets, or historical events. Do not infer company identities from context clues or industry terminology. If a data point was not provided, it does not exist in this simulation.', 'FFF3E0'),
  p('This prevents parametric knowledge leakage — the LLM drawing on pre-training knowledge about named real companies to "fill in" facts not provided by the user. Combined with pseudonymization in agents.js, this ensures simulation outputs are driven entirely by the structured inputs provided.'),

  sp(),
  h2('4.3 agents.js — Simulation Engine'),
  p('The core orchestration loop. Accepts the scored scenario object and runs the full multi-round simulation. Key architectural features: pseudonymization of competitor names, prompt caching on system prompts, and fully parallel API calls within each round.'),
  sp(),
  h3('Pseudonymization'),
  p('Before any Claude call, agents.js replaces all competitor names with neutral labels ("Competitor A", "Competitor B", "Competitor C") and builds a reverse lookup map. This prevents the model from pattern-matching names to pre-training knowledge about real companies. After the orchestrator returns, a recursive string remapper walks the entire JSON output and restores all real names — including inside free-text prose fields like strategicRecommendation and monitoringPlan.'),
  sp(),
  h3('Prompt Caching'),
  p('The competitor system prompt (which includes the full scored profile) is marked with cache_control: { type: "ephemeral" } via the Anthropic SDK. Since each competitor\'s profile is identical across rounds, the system prompt is cache-hit from Round 2 onward, reducing both cost and latency. The Anthropic SDK logs cache_write and cache_read token counts per call for observability.'),
  sp(),
  h3('Round-by-Round Flow'),
  sp(),
  simpleTable([
    ['Round', 'What Each Agent Receives', 'Purpose'],
    ['Round 1', 'Own pseudonymized profile + trigger event only. No knowledge of other rivals.', 'Establishes independent baseline reactions.'],
    ['Round 2', 'Own profile + trigger + all Round 1 moves from other competitors', 'Models reactive adjustments — escalation, de-escalation, or pivot.'],
    ['Equilibrium check', 'Compares magnitude and type to Round 1 results', 'Stops simulation if no competitor shifted by >15 points. Skips Round 3.'],
    ['Round 3 (conditional)', 'Own profile + trigger + Round 2 moves', 'Final stabilization when equilibrium was not reached after Round 2.'],
    ['Orchestrator', 'Pseudonymized summary of all final-round responses for all competitors', 'Synthesizes market state, full strategic brief, evidence classification.'],
  ], [1600, 3800, 3960]),
  sp(),
  h3('Equilibrium Detection Logic'),
  p('After Round 2, agents.js checks two conditions for every competitor:'),
  li('Magnitude drift: Did intensity score change by more than 15 points vs. previous round?'),
  li('Type change: Did response type change (e.g. "price_cut" → "niche_pivot")?'),
  sp(60),
  p('If no competitor satisfies either condition, equilibrium is declared. In testing, approximately 70% of price-move scenarios reach equilibrium after Round 2.'),
  sp(),
  h3('API Call Budget'),
  sp(),
  simpleTable([
    ['Call Type', 'Model', 'Count per Run', 'Token Limit', 'Caching'],
    ['Competitor agent (Round 1)', 'claude-haiku-4-5', '1 per competitor (up to 3)', '1,000 tokens', 'System prompt cached on write'],
    ['Competitor agent (Round 2)', 'claude-haiku-4-5', '1 per competitor (up to 3)', '1,000 tokens', 'System prompt cache-hit'],
    ['Competitor agent (Round 3, conditional)', 'claude-haiku-4-5', '1 per competitor', '1,000 tokens', 'System prompt cache-hit'],
    ['Orchestrator', 'claude-sonnet-4-6', '1 per simulation', '16,000 tokens', 'No caching (unique per run)'],
    ['Total (2-round run)', '—', '7 calls', '—', '—'],
    ['Total (3-round run)', '—', '10 calls', '—', '—'],
  ], [2800, 1800, 1800, 1500, 1460]),

  sp(),
  h2('4.4 server.js — API Layer'),
  p('A minimal Express server. Two endpoints only:'),
  li('GET /api/health — returns { status: "ok", timestamp }. Used by the frontend to confirm the backend is running before allowing simulation.'),
  li('POST /api/simulate — accepts scenario JSON, runs the full simulation pipeline, returns complete result. All Claude calls happen synchronously within this request.'),
  sp(60),
  p('CORS is configured to accept any localhost port, enabling the Vite dev server to communicate without port-specific setup. API key errors from Anthropic surface as readable 401 messages rather than generic 500s. The server validates that yourCompany.name and yourCompany.strategicMove are present before executing the simulation.'),

  sp(),
  h2('4.5 Frontend — React UI'),
  p('The frontend is a dark-themed enterprise web application built on React 19, Vite 8, and Tailwind CSS v4. The UI is structured as a three-step workflow with numbered tab badges (01, 02, 03). A dark navy header (background #0B1426) anchors a consistent visual language across all views.'),
  sp(),
  h3('App.jsx'),
  p('Application shell. Holds all state: yourCompany (with full financial profile), competitors[], activeTab, simulationResult, isLoading, error. Manages the three-tab workflow and issues POST /api/simulate. Results are persisted to sessionStorage so they survive page refreshes within the same browser session.'),
  p('Three demo loaders are available in the Scenario Setup tab:'),
  li('Load Demo — Picks one of three TelcoX telecom scenarios at random (price cut / bundle launch / enterprise 5G). Designed to illustrate different verdicts.'),
  li('Load TMT Scenario — Real historical backtest: T-Mobile Uncarrier initiative (March 2013) vs. AT&T, Verizon, and Sprint. All financial inputs sourced from SEC filings. Known outcome: T-Mobile gained 22M subscribers post-Uncarrier.'),
  li('Load CPG Scenario — Real historical backtest: Coca-Cola pricing discipline vs. PepsiCo and Keurig Dr Pepper (February 2023). Known outcome: Coke held share, PepsiCo had 9 consecutive quarters of volume decline.'),
  sp(),
  h3('ScenarioSetupTab (Step 01)'),
  p('Collects the triggering company\'s move and context, plus optional market framing (industry, company type, geography, market overview). Also collects your company\'s own financial profile (revenueGrowthRate, ebitdaMargin, cashPosition, debtToEbitda, rdSpendPct, marketShareTrend, headcountTrend, ceoPriorityStatement) so the orchestrator can anchor financial estimates to real numbers and assess your capacity to sustain the move.'),
  sp(),
  h3('CompetitorProfileForm.jsx (Step 02)'),
  p('The structured data entry form per competitor, rendered in a two-column layout: form on the left, live scoring card on the right. The component mirrors profileBuilder.js scoring logic entirely in the browser — all three behavioral scores recalculate live as the user types. Section headers use a left-border accent style. Sections: Financial Health | Pricing Behavior | Market Position | Qualitative Signals.'),
  sp(),
  h3('SimulationResults.jsx — Consultant-Style Dashboard (Step 03)'),
  p('Results are rendered as a management consultant briefing. Components render in this order:'),
  li('Decision Brief: One-sentence verdict, confidence level + rationale, primary reason, biggest watchout, and decision gate. Designed for a CXO with 60 seconds.'),
  li('Verdict Banner: Color-coded verdict (PROCEED / PROCEED WITH CAUTION / REVISE STRATEGY) derived from the orchestrator\'s betterAlternative presence and yourCompany player outcome.'),
  li('Recommendation Panel: Strategic recommendation and alternative move (left, 2/3 width) alongside market equilibrium state with outcome labels per player (right, 1/3 width).'),
  li('Competitive Response Matrix: Scannable table. Columns: Competitor | Expected Response | Timing | Threat Level | Implication for You.'),
  li('Scenario Outcomes: Best Case / Base Case / Worst Case in color-coded columns.'),
  li('Strategic Options: Comparison table of 3–5 alternative moves with revenue upside, volume risk, competitor risk, and implementation complexity ratings.'),
  li('Monitoring Plan: Three panels (Next 30 / 60 / 90 Days) showing signals to watch, metrics, quantitative thresholds, owner functions, and action if triggered.'),
  li('Recommendation Change Triggers: The specific market events that would cause the recommendation to change, with metrics and urgency ratings.'),
  li('Assumptions Used: Every key assumption with source type (User Input / Model Inference / Default), confidence, and impact if wrong.'),
  li('Evidence Classification: Every finding tagged with its epistemic status, displayed as color-coded badges.'),
  li('Watchpoints: Numbered watchlist signals and key risks.'),
  li('Round Detail: Collapsible round-by-round reasoning, collapsed by default, labeled "Supporting detail."'),
  pb(),

  // ── 5. AI Integration ─────────────────────────────────────────────────────
  h1('5. AI Integration'),

  h2('5.1 Two-Model Strategy'),
  p('CompetitorSim uses two Claude models with different roles, optimizing for both quality and cost/speed:'),
  sp(),
  simpleTable([
    ['Role', 'Model', 'max_tokens', 'Rationale'],
    ['Competitor agents (Rounds 1–3)', 'claude-haiku-4-5', '1,000', 'Fast, cost-efficient structured JSON responses. Sufficient depth for single-competitor reaction reasoning. Up to 9 calls per simulation run.'],
    ['Orchestrator synthesis', 'claude-sonnet-4-6', '16,000', 'Full synthesis requires deeper reasoning and a large output schema. Single call per run. Token budget accommodates the rich monitoring plan and strategic options schema.'],
  ], [2200, 2200, 1400, 3560]),
  sp(),

  h2('5.2 Prompt Design Principles'),
  li('Plain language over jargon: Prompts explicitly prohibit MBA-speak and scoring terminology (no "intent vector", "aggression index"). Responses must use actual numbers embedded in plain English sentences.'),
  li('Character grounding: Each competitor agent is told "You are the Chief Strategy Officer of [Competitor X]" and given their specific scored profile. The role-playing framing significantly improves differentiation across competitors.'),
  li('Numbers + plain English: Both prompts enforce that every claim must include a real number. "With 4.2x debt-to-EBITDA, we cannot sustain a price war" not "We face financial constraints."'),
  li('Closed-world constraint: An explicit simulation boundary instruction in both system prompts prevents the model from drawing on pre-training knowledge about named real companies.'),
  li('JSON enforcement: Structured output is embedded in the prompt and validated in code, preventing reformatted responses from breaking the simulation.'),
  sp(),

  h2('5.3 Error Handling'),
  sp(),
  simpleTable([
    ['Error Condition', 'Handling Behavior'],
    ['Network timeout', 'Returns fallback response object; simulation continues with partial data'],
    ['Malformed JSON response', 'Triggers one retry with explicit JSON-only instruction'],
    ['Anthropic API 401 (invalid key)', 'Surfaces as actionable error message to frontend — not a generic 500'],
    ['Anthropic API 429 (rate limit)', 'Returns descriptive error; no silent retry loop'],
    ['Orchestrator missing fields', 'Per-field fallback objects ensure the full output schema is always complete, even if Claude omits a section'],
  ], [3200, 6160]),
  pb(),

  // ── 6. Scoring System ─────────────────────────────────────────────────────
  h1('6. Scoring System — Interpreting the Scores'),
  p('The three behavioral scores are the bridge between raw competitor data and AI reasoning. Every AI behavioral decision is anchored to these scores.'),
  sp(),
  simpleTable([
    ['Score Range', 'Financial Capacity', 'Aggression Index', 'Strategic Intent (dominant)'],
    ['70–100 (High)', 'Can fund sustained aggressive responses. Expect escalation, price wars, or large counter-investments.', 'Will out-discount, out-invest, or directly retaliate. Escalation is likely.', 'Actively seeking position change. Your move gives them an excuse to accelerate.'],
    ['40–69 (Medium)', 'Will respond selectively — protecting highest-value segments, conceding less strategic ground.', 'Balanced response. Proportional retaliation or opportunistic positioning.', 'Opportunistic. Exploits openings you create without overextending.'],
    ['0–39 (Low)', 'Cash-constrained or debt-heavy. Will avoid expensive responses. Expect niche pivots or defensive moves.', 'Brand-protective or conservative. Will differentiate rather than compete head-on.', 'Status-quo manager. Responds to minimize disruption rather than capitalize.'],
  ], [1560, 2600, 2600, 2600]),
  sp(),
  h3('Strategic Intent Vector — 4 Dimensions'),
  p('The Strategic Intent Vector is a normalized 4-dimensional score. The dominant dimension shapes the response type the AI model is most likely to select:'),
  sp(),
  simpleTable([
    ['Dimension', 'High When...', 'Typical Response Choices'],
    ['Growth Maximizer', 'Revenue growth >10%, gaining share, CEO talks about "growth" or "share"', 'price_cut, marketing_surge, bundle_add to capture volume'],
    ['Margin Defender', 'EBITDA margin >25%, price history shows holds, CEO talks about "margin" or "profit"', 'price_hold, price_increase, niche_pivot to protect P&L'],
    ['Niche Player', 'Losing share, low financial capacity, CEO focuses on "specific" segments', 'niche_pivot, no_response — retreat to defensible segments'],
    ['Innovation / Better Product', 'R&D spend >8% of revenue, CEO talks about "innovation" or "premium"', 'bundle_add, alliance — compete on value not price'],
  ], [2200, 3360, 3800]),
  sp(),
  callout('Score interaction example: Financial Capacity=85, Aggression=90, dominant intent=Growth Maximizer → maximum escalation, likely immediate price_cut with high magnitude. Financial Capacity=30, Aggression=40, dominant intent=Niche Player → creative niche_pivot, no expensive moves.'),
  pb(),

  // ── 7. Multi-Round Simulation Dynamics ───────────────────────────────────
  h1('7. Multi-Round Simulation Dynamics'),
  p('Multiple rounds are what distinguish CompetitorSim from a simple prompt-based prediction. Real competitive reactions are iterative — one company moves, rivals respond, then everyone adjusts to what others did.'),
  li('Round 1: Each competitor reacts to the trigger independently, establishing baseline responses.'),
  li('Round 2: Each competitor sees what rivals did in Round 1 and decides whether to adjust. This is the key multi-agent interaction point.'),
  li('Equilibrium: If reactions have stabilized (no type change, no magnitude shift >15 points), simulation ends.'),
  li('Round 3 (conditional): If reactions are still shifting, a final stabilization round runs.'),
  sp(),
  h2('Emergent Behaviors Observed in Testing'),
  li('Cascading escalation: One competitor\'s Round 1 aggression causes a second to escalate in Round 2, triggering further escalation in Round 3.'),
  li('Niche pivoting: A financially constrained competitor who attempts to match price in Round 1 sees in Round 2 that two stronger rivals are already in a price war — and pivots to an underserved segment instead.'),
  li('Defensive coalescence: Two competitors who normally compete with each other both choose defensive moves in response to a disruptive trigger, creating a temporary alignment.'),
  pb(),

  // ── 8. Parametric Knowledge Containment ──────────────────────────────────
  h1('8. Parametric Knowledge Containment'),
  p('LLMs are pre-trained on large corpora that include real company filings, news, and strategy analysis. This creates a risk — parametric knowledge leakage — where the model may draw on memorized facts about named real companies to "fill in" the simulation, rather than reasoning purely from the structured inputs provided by the user.'),
  p('This matters because it breaks the hypothesis validation framework: if the LLM already knows what Coca-Cola did in 2023, it may reverse-engineer its simulation toward the real historical outcome rather than deriving it from the input data.'),
  sp(),
  h2('Mitigation Layers'),
  sp(),
  simpleTable([
    ['Layer', 'Implementation', 'Where Applied'],
    ['Pseudonymization', 'Competitor names replaced with "Competitor A/B/C" before any Claude call. A reverse map restores real names post-simulation.', 'agents.js — wraps all Claude calls'],
    ['Closed-world instruction', 'Explicit system prompt instruction: only facts provided in the prompt exist in this simulation. Do not draw on training data about real companies.', 'prompts.js — both competitor and orchestrator system prompts'],
    ['Recursive string remap', 'After the orchestrator returns, all string fields (including prose in strategicRecommendation, monitoringPlan, decisionBrief, etc.) are walked and pseudonyms replaced with real names.', 'agents.js — remapStrings() function'],
    ['Evidence classification', 'Every finding is tagged with its epistemic source. "Known Fact" is restricted to claims directly supported by input numbers. Forward-looking claims must be "Model Inference."', 'Enforced via orchestrator prompt schema'],
  ], [1800, 4560, 3000]),
  sp(),
  callout('Note: The most robust additional protection is for users to avoid company-identifying jargon in the strategicMove and context fields. If the model can identify the company from industry-specific terminology, the closed-world instruction reduces but does not fully eliminate leakage.', 'FFF3E0'),
  pb(),

  // ── 9. Setup & Configuration ──────────────────────────────────────────────
  h1('9. Setup & Configuration'),

  h2('9.1 Prerequisites'),
  li('Node.js 18 or higher'),
  li('An Anthropic API key — sign up at console.anthropic.com'),
  li('npm (bundled with Node.js)'),
  sp(),

  h2('9.2 Environment Variables'),
  p('Create a .env file in the project root (not inside /backend):'),
  codeP('ANTHROPIC_API_KEY=sk-ant-your-key-here'),
  sp(),

  h2('9.3 Running the Application'),
  codeP('# Terminal 1 — Backend'),
  codeP('cd backend && npm install && node server.js'),
  codeP('# Starts on http://localhost:3001'),
  sp(60),
  codeP('# Terminal 2 — Frontend'),
  codeP('cd frontend && npm install && npm run dev'),
  codeP('# UI at http://localhost:5173'),
  sp(),

  h2('9.4 Test Suite'),
  sp(),
  simpleTable([
    ['File', 'What It Tests', 'API Calls?'],
    ['node test-profile.js', 'Scoring math in profileBuilder.js', 'No'],
    ['node test-prompts.js', 'Prompt generation outputs', 'No'],
    ['node test-simulation.js', 'Full simulation end-to-end (~30–60s)', 'Yes'],
    ['node test-e2e.js', 'Full stack test against running server', 'Yes'],
  ], [2800, 4800, 1760]),
  sp(),

  h2('9.5 Demo Scenarios'),
  sp(),
  simpleTable([
    ['Button', 'Scenario', 'Expected Verdict'],
    ['Load Demo (random)', 'Three TelcoX telecom scenarios: (1) 10% price cut, (2) Premium bundle launch, (3) Enterprise 5G private network. Same competitors, different moves.', 'Varies: REVISE / PROCEED WITH CAUTION / PROCEED'],
    ['Load TMT Scenario', 'Real backtest: T-Mobile Uncarrier initiative (March 2013) vs. AT&T, Verizon, Sprint. All financials from SEC filings. Known outcome: T-Mobile gained 22M subscribers.', 'PROCEED (disruptive move into uncontested position)'],
    ['Load CPG Scenario', 'Real backtest: Coca-Cola pricing discipline vs. PepsiCo and Keurig Dr Pepper (February 2023). Known outcome: Coke held share, PepsiCo had 9 consecutive quarters of volume decline.', 'PROCEED (pricing discipline holds; competitors blink first)'],
  ], [1800, 5160, 2400]),
  pb(),

  // ── 10. Limitations & Roadmap ─────────────────────────────────────────────
  h1('10. Limitations & Roadmap'),

  h2('10.1 Current Limitations'),
  sp(),
  simpleTable([
    ['Limitation', 'Impact', 'Roadmap Fix'],
    ['Manual data entry', 'Competitor profiles require hand-input; no live data feeds', 'Integrate earnings call API, news scraper, patent filings'],
    ['Max 3 competitors', 'UI and engine designed for up to 3 rivals only', 'Dynamic competitor scaling with scrollable UI'],
    ['No persistence', 'Results not saved beyond sessionStorage; no history or run comparison', 'Add local storage or lightweight DB'],
    ['No calibration loop', 'No mechanism to track prediction accuracy vs. real outcomes', 'Add post-simulation outcome logging and comparison view'],
    ['Parametric leakage risk', 'Pseudonymization and closed-world instruction reduce but do not eliminate leakage risk when company-specific jargon is used', 'Investigate system-level prompt injection defences; add user-facing warning when company names are detected in text fields'],
  ], [2000, 3200, 4160]),
  sp(),

  h2('10.2 Implemented vs. Original Roadmap'),
  p('The following items were listed as "Optimization Opportunities (Not Yet Implemented)" in the original documentation and have since been built:'),
  sp(),
  simpleTable([
    ['Item', 'Status', 'Implementation'],
    ['Prompt caching', 'Implemented', 'cache_control: { type: "ephemeral" } on competitor system prompts. Cache-hit from Round 2 onward.'],
    ['Parallel round calls', 'Implemented', 'Promise.all() used for all competitor agent calls within each round.'],
    ['Orchestrator max_tokens expanded', 'Implemented', 'Increased from 4,096 to 16,000 to support the full monitoring plan and strategic options schema.'],
    ['Your company financial profile', 'Implemented', 'Full financial inputs for the triggering company are collected in Step 01 and used to anchor orchestrator financial estimates.'],
    ['Evidence classification', 'Implemented', 'Every orchestrator finding is tagged with its epistemic source and displayed as color-coded badges in the UI.'],
    ['Parametric knowledge containment', 'Implemented', 'Pseudonymization + closed-world instructions + recursive string remap.'],
    ['Streaming', 'Not yet implemented', 'Orchestrator response could be streamed to the frontend for perceived faster delivery.'],
  ], [2200, 1600, 5560]),
  pb(),

  // ── 11. Conclusion ────────────────────────────────────────────────────────
  h1('11. Conclusion'),
  p('CompetitorSim demonstrates that AI multi-agent competitive simulation is not a theoretical concept — it can be built, run, and deliver meaningful strategic insights using commercially available tools today.'),
  p('The architecture is deliberately layered: a deterministic scoring engine grounds AI behavior in structured data; a pseudonymization and closed-world constraint layer ensures outputs reflect inputs rather than pre-training knowledge; a multi-round engine models the iterative nature of real competitive dynamics; and an orchestrator synthesizes second-order insights with full evidence classification so analysts understand exactly what is inference versus fact.'),
  p('The T-Mobile and Coca-Cola backtests validate the full framework against known historical outcomes. The path from here to enterprise deployment is well-defined: richer live data feeds, calibration loops against real outcomes, and scaled competitor coverage.'),
  sp(),
  callout('CompetitorSim is production-ready as a proof of concept and a clear foundation for a full-scale strategic intelligence capability.'),
  sp(200),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [run('CompetitorSim · Built on Anthropic Claude · June 2026', { italics: true, size: 18, color: '888888' })],
  }),
];

// ── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22, color: TEXT } },
    },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Calibri', color: NAVY },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Calibri', color: ACCENT },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 23, bold: true, font: 'Calibri', color: TEAL },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1 } },
          children: [
            run('CompetitorSim — Technical Documentation', { size: 18, color: '888888' }),
            run('\t', { size: 18 }),
            run('June 2026', { size: 18, color: '888888' }),
          ],
          tabStops: [{ type: 'right', position: 9360 }],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            run('Page ', { size: 18, color: '888888' }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 18, color: '888888' }),
            run(' of ', { size: 18, color: '888888' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 18, color: '888888' }),
          ],
        })],
      }),
    },
    children,
  }],
});

// ── Write ─────────────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buf => {
  const outPath = path.join(__dirname, 'CompetitorSim_Technical_Documentation.docx');
  fs.writeFileSync(outPath, buf);
  console.log('Written:', outPath);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
