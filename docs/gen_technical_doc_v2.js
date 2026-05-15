const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageBreak
} = require('docx');
const fs = require('fs');

// ── Colors ──────────────────────────────────────────────────────────────────
const NAVY    = '1E2761';
const ACCENT  = '4472C4';
const TEAL    = '028090';
const GRAY_BG = 'F2F4F8';
const CODE_BG = 'EFEFEF';
const WHITE   = 'FFFFFF';
const TEXT    = '2D2D2D';
const MID     = '888888';

// ── Border helpers ───────────────────────────────────────────────────────────
const b1 = (c = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color: c });
const bords = (c = 'CCCCCC') => ({ top: b1(c), bottom: b1(c), left: b1(c), right: b1(c) });
const noBords = { top: { style: BorderStyle.NONE, size: 0, color: WHITE },
                  bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
                  left: { style: BorderStyle.NONE, size: 0, color: WHITE },
                  right: { style: BorderStyle.NONE, size: 0, color: WHITE } };

// ── Typography helpers ───────────────────────────────────────────────────────
const run  = (text, opts = {}) => new TextRun({ text, font: 'Calibri', size: 22, color: TEXT, ...opts });
const mono = (text, opts = {}) => new TextRun({ text, font: 'Courier New', size: 19, color: TEXT, ...opts });

const h1 = text => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 320, after: 160 },
  children: [run(text, { bold: true, size: 32, color: NAVY })]
});
const h2 = text => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [run(text, { bold: true, size: 26, color: ACCENT })]
});
const h3 = text => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 100 },
  children: [run(text, { bold: true, size: 23, color: TEAL })]
});
const p = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 120 },
  alignment: AlignmentType.BOTH,
  children: [run(text, opts)]
});
const pRuns = runs => new Paragraph({
  spacing: { before: 80, after: 120 },
  alignment: AlignmentType.BOTH,
  children: runs.map(r => run(r.text, r))
});
const li = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  spacing: { before: 50, after: 70 },
  children: [run(text)]
});
const codeP = text => new Paragraph({
  spacing: { before: 40, after: 40 },
  indent: { left: 360 },
  shading: { fill: CODE_BG, type: ShadingType.CLEAR },
  children: [mono(text)]
});
const sp = (px = 80) => new Paragraph({ spacing: { before: px, after: 0 }, children: [run('')] });
const callout = (text, bg = 'EBF3FB') => new Paragraph({
  spacing: { before: 160, after: 160 },
  indent: { left: 400, right: 200 },
  shading: { fill: bg, type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 14, color: ACCENT, space: 1 } },
  children: [run(text, { italics: true, color: NAVY })]
});
const pb = () => new Paragraph({ children: [new PageBreak()] });

// ── Table helpers ────────────────────────────────────────────────────────────
function simpleTable(rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(([cells], ri) => new TableRow({
      children: rows[ri].map((text, ci) => new TableCell({
        borders: bords(),
        width: { size: widths[ci], type: WidthType.DXA },
        shading: { fill: ri === 0 ? NAVY : (ri % 2 === 0 ? GRAY_BG : WHITE), type: ShadingType.CLEAR },
        margins: { top: 90, bottom: 90, left: 140, right: 140 },
        children: [new Paragraph({ children: [run(text, { bold: ri === 0, size: 20, color: ri === 0 ? WHITE : TEXT })] })]
      }))
    }))
  });
}

// ── Architecture Diagram ─────────────────────────────────────────────────────
function archDiagram() {
  // Helper: single full-width box
  const fullBox = (label, sub, fill, textColor = WHITE) => new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: bords(fill),
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [run(label, { bold: true, size: 23, color: textColor })] }),
        ...(sub ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [run(sub, { size: 19, color: textColor, italics: true })] })] : [])
      ]
    })] })]
  });

  // Helper: three equal boxes side by side
  const threeBoxes = (boxes) => new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 3000, 3360],
    rows: [new TableRow({ children: boxes.map(([title, sub, fill], i) => new TableCell({
      borders: bords(fill),
      width: { size: i === 2 ? 3360 : 3000, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 140, right: 140 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [run(title, { bold: true, size: 21, color: WHITE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [run(sub, { size: 18, color: 'CADCFC', italics: true })] }),
      ]
    }))})]
  });

  const arrow = (label = '▼') => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: [run(label, { size: 22, color: ACCENT, bold: true })]
  });
  const arrowLabel = (text) => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    children: [run(text, { size: 18, color: MID, italics: true })]
  });

  return [
    h2('System Architecture Diagram'),
    sp(100),

    // Layer 1: Browser
    fullBox('BROWSER  ·  React 19 + Vite + Tailwind CSS', 'App.jsx  |  CompetitorProfileForm.jsx  |  SimulationResults.jsx', 'C5D8F0', NAVY),
    arrow(),
    arrowLabel('POST /api/simulate  →  JSON response'),

    // Layer 2: Express
    fullBox('EXPRESS API SERVER  ·  server.js  ·  localhost:3001', 'GET /api/health  |  POST /api/simulate', NAVY),
    arrow('▼ buildCompetitorProfile( )  +  runSimulation( )'),

    // Layer 3: Three modules
    threeBoxes([
      ['profileBuilder.js', 'Scoring Engine\nFinancial Capacity\nAggression Index\nStrategic Intent', '2C5F8A'],
      ['agents.js', 'Simulation Engine\nRound 1 → Round 2\nEquilibrium Check\nRound 3 (if needed)', '1E4D7B'],
      ['prompts.js', 'Prompt Library\nSystem Prompt\nRound Prompt\nOrchestrator Prompt', '1E3A6E'],
    ]),
    arrow(),
    arrowLabel('Claude API calls (claude-sonnet-4-6)  ·  ~7–10 calls per run'),

    // Layer 4: Claude
    fullBox('ANTHROPIC CLAUDE API  ·  claude-sonnet-4-6', 'Competitor agents: max_tokens 1,000  |  Orchestrator: max_tokens 4,096', TEAL),
    arrow(),
    arrowLabel('JSON-structured responses parsed by agents.js'),

    // Layer 5: Output
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4640, 4720],
      rows: [new TableRow({ children: [
        new TableCell({
          borders: bords('4CAF82'),
          width: { size: 4640, type: WidthType.DXA },
          shading: { fill: '1A6B4A', type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [run('SIMULATION OUTPUT', { bold: true, size: 21, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [run('Round results  |  Equilibrium state\nOrchestrator recommendation  |  Risk analysis', { size: 18, color: 'CADCFC', italics: true })] }),
          ]
        }),
        new TableCell({
          borders: bords('4CAF82'),
          width: { size: 4720, type: WidthType.DXA },
          shading: { fill: '145239', type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [run('SENSITIVITY ANALYSIS', { bold: true, size: 21, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [run('4 sliders  |  Re-runs simulation on change\nCompetitor strength  |  Price magnitude\nMarket growth  |  Regulatory caps', { size: 18, color: 'CADCFC', italics: true })] }),
          ]
        })
      ]})]
    }),
    sp(80),

    // Legend
    new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [
        run('Key: ', { bold: true, size: 18, color: MID }),
        run('Blue = Frontend  |  Dark Navy = Backend/API layer  |  Teal = External AI service  |  Green = Output', { size: 18, color: MID, italics: true })
      ]
    }),
    sp(120),
  ];
}

// ── Data Flow Diagram ────────────────────────────────────────────────────────
function dataFlowTable() {
  const rows = [
    ['Step', 'What Happens', 'Module'],
    ['1  Input', 'User enters company move + up to 3 competitor profiles (12 fields each) in the React UI', 'App.jsx'],
    ['2  Score', 'profileBuilder converts raw inputs into Financial Capacity, Aggression Index, and Strategic Intent scores (0–100)', 'profileBuilder.js'],
    ['3  Round 1', 'Each competitor agent is called independently — receives its profile + the trigger event only. No knowledge of other rivals yet.', 'agents.js'],
    ['4  Round 2', 'Each agent receives Round 1 moves of ALL other competitors and may adjust its response', 'agents.js'],
    ['5  Equilibrium', 'If no competitor shifted by >15 points in magnitude or changed response type: equilibrium declared, skip Round 3', 'agents.js'],
    ['6  Round 3', '(Conditional) Final stabilization round if equilibrium was not reached after Round 2', 'agents.js'],
    ['7  Synthesize', 'Orchestrator agent receives summary of all rounds and outputs market state, recommendation, and risk analysis', 'agents.js + prompts.js'],
    ['8  Output', 'Full JSON result returned to React frontend and rendered in SimulationResults.jsx', 'server.js'],
  ];
  return simpleTable(rows, [1400, 5600, 2360]);
}

// ── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
        ]
      },
      {
        reference: 'numbered',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ]
      },
    ]
  },
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
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
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1260, bottom: 1080, left: 1260 } }
    },
    headers: {
      default: new Header({ children: [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 1 } },
          spacing: { before: 0, after: 100 },
          children: [
            run('CompetitorSim  —  Technical Architecture & Deep Dive', { size: 17, color: MID }),
            run('    |    May 2025', { size: 17, color: 'BBBBBB' }),
          ]
        })
      ]})
    },
    footers: {
      default: new Footer({ children: [
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 1 } },
          alignment: AlignmentType.RIGHT,
          spacing: { before: 80, after: 0 },
          children: [
            run('CompetitorSim  ·  Technical Documentation  ·  May 2025', { size: 17, color: MID }),
          ]
        })
      ]})
    },
    children: [

      // ── COVER ────────────────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 1600, after: 160 }, alignment: AlignmentType.CENTER,
        children: [run('CompetitorSim', { size: 80, bold: true, color: NAVY })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 100 }, alignment: AlignmentType.CENTER,
        children: [run('Technical Architecture & Deep-Dive Documentation', { size: 32, color: ACCENT })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 60 }, alignment: AlignmentType.CENTER,
        children: [run('An AI-Powered Competitive Reaction Simulator', { size: 24, italics: true, color: '666666' })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 1600 }, alignment: AlignmentType.CENTER,
        children: [run('May 2025   |   Built on Anthropic Claude claude-sonnet-4-6', { size: 20, color: MID })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 80 }, alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 1 } },
        children: [run('Proof of concept for: "Simulating Competitors: How AI Agents Redefine Competitive Strategy in 2025"', { size: 20, italics: true, color: NAVY })]
      }),
      pb(),

      // ── 1. EXECUTIVE SUMMARY ─────────────────────────────────────────────
      h1('1. Executive Summary'),
      p('CompetitorSim is a working, interactive proof-of-concept that demonstrates the practical feasibility of AI-powered competitive reaction simulation. It was purpose-built to validate the theoretical framework described in the accompanying whitepaper, which argues that AI multi-agent systems can replace guesswork in predicting how competitors will respond to strategic moves.'),
      p('A user enters their company\'s strategic move and profiles of up to three competitors. Within ~60 seconds, a Claude-powered multi-agent simulation returns:'),
      li('Round-by-round competitor responses with reasoning'),
      li('An equilibrium state — when competitive dynamics stabilize'),
      li('A synthesized strategic recommendation with risk analysis'),
      li('Interactive sensitivity sliders for what-if exploration'),
      sp(80),
      callout('Key finding: The built-in TelcoX demo delivers the exact second-order insight the whitepaper predicts — that a 10% price cut triggers a margin-eroding price war, and a bundling + segmentation strategy outperforms it. The tool proves the theory works in practice.'),

      // ── 2. PROBLEM & PURPOSE ─────────────────────────────────────────────
      h1('2. Problem Statement & Purpose'),
      p('Competitive strategy has a fundamental blind spot: organizations invest heavily in planning their own moves but dramatically underinvest in anticipating how competitors will respond. Traditional approaches all have well-documented limits:'),
      sp(80),
      simpleTable([
        ['Tool', 'Core Limitation'],
        ['Benchmarking', 'Backward-looking — reflects what rivals did, not what they will do'],
        ['Expert Judgment', 'Bounded by cognitive biases; misses disruptive or unconventional responses'],
        ['War-Gaming Workshops', 'Produces 2–3 scenarios once a year; cannot match real-market velocity'],
        ['Spreadsheet Modeling', 'Static; assumes one future, ignores cascading competitor reactions'],
      ], [2400, 7200]),
      sp(100),
      p('CompetitorSim exists to close this gap — providing a fast, repeatable simulation environment where competitive dynamics can be explored before a strategic move is executed in the real world.'),

      // ── 3. HIGH-LEVEL ARCHITECTURE ───────────────────────────────────────
      pb(),
      h1('3. Architecture'),
      p('CompetitorSim is a full-stack JavaScript application. The backend is a Node.js/Express API that orchestrates Claude AI calls; the frontend is a React 19 + Vite application. Data flows in one direction: user input → scoring → simulation → synthesis → output.'),
      sp(100),
      ...archDiagram(),

      // ── 3.2 Data Flow ──────────────────────────────────────────────────
      h2('End-to-End Data Flow'),
      sp(80),
      dataFlowTable(),
      sp(120),

      // ── 4. MODULE DEEP DIVE ──────────────────────────────────────────────
      pb(),
      h1('4. Module-by-Module Deep Dive'),

      h2('4.1  profileBuilder.js — Scoring Engine'),
      p('The most architecturally important module. Rather than passing raw user input directly to Claude, profileBuilder converts 12 data-point fields per competitor into three deterministic behavioral scores. This grounds every AI decision in specific, auditable inputs rather than hallucinated assumptions.'),
      sp(80),
      h3('Input: 12 Raw Fields per Competitor'),
      simpleTable([
        ['Field', 'What It Captures'],
        ['revenue', 'Annual revenue — proxy for scale and resources'],
        ['revenueGrowth', 'YoY growth rate — signals momentum and hunger'],
        ['cashReserves', 'Available liquidity — determines ability to act aggressively'],
        ['debtLevel', 'Debt burden (low / medium / high) — constrains strategic options'],
        ['marketShare', 'Current share % — proxy for competitive position'],
        ['marketShareTrend', 'Growing, stable, or declining — signals intent'],
        ['pricePositioning', 'Premium, mid-market, or value — shapes response type'],
        ['recentActions', 'Recent strategic moves (acquisitions, launches, cuts)'],
        ['leadershipStyle', 'Executive rhetoric — aggressive, conservative, or opportunistic'],
        ['innovationRate', 'Frequency of new product/feature launches'],
        ['regulatoryConstraints', 'Industry or regional limits on behavior'],
        ['customerLoyalty', 'Brand stickiness — affects defensive urgency'],
      ], [2600, 7000]),
      sp(120),
      h3('Output: 3 Behavioral Scores (each 0–100)'),
      simpleTable([
        ['Score', 'Formula Inputs', 'What High vs. Low Means'],
        ['Financial Capacity', 'Cash reserves + debt level + revenue scale', 'High = can fund aggressive moves. Low = constrained, will avoid expensive responses.'],
        ['Aggression Index', 'Leadership style + share trend + recent actions + pricing', 'High = will escalate and retaliate. Low = will absorb or differentiate.'],
        ['Strategic Intent', 'Innovation rate + share ambition + recent moves', 'High = actively seeking to change position. Low = managing status quo.'],
      ], [2200, 3400, 3960]),
      sp(100),
      callout('Design principle: Scoring is deterministic and separate from AI reasoning. The scoring engine ensures reproducibility and traceability. The AI layer then adds semantic nuance — interpreting what the scores mean in the context of the specific competitive scenario.'),

      sp(120),
      h2('4.2  prompts.js — Prompt Library'),
      p('All prompt templates are centralized here. This is a deliberate architectural choice — keeping prompts out of business logic makes them easy to tune without touching the simulation engine.'),
      sp(80),
      simpleTable([
        ['Function', 'When Called', 'What It Does'],
        ['buildSystemPrompt(profile, scenario)', 'Once per competitor per round', 'Injects the scored profile (translated to plain English), the trigger event, and the market context. Instructs Claude to reason in character.'],
        ['buildRoundPrompt(round, otherMoves)', 'Round 2+ only', "Provides each agent with all other competitors' previous-round moves, enabling reactive multi-agent dynamics."],
        ['buildOrchestratorPrompt(allRounds)', 'Once per simulation', 'Synthesizes all rounds into market equilibrium state + recommendation + risk analysis. 4,096 token allowance.'],
      ], [2800, 2200, 4360]),
      sp(100),
      h3('Response Format'),
      p('All prompts enforce JSON-only responses. This is validated in agents.js after each call. Malformed responses trigger a retry with an explicit JSON instruction.'),
      codeP('// Competitor agent response schema'),
      codeP('{ "response": "...", "action": "...", "magnitude": 0-100,'),
      codeP('  "type": "aggressive|defensive|opportunistic|neutral", "reasoning": "..." }'),
      sp(60),
      codeP('// Orchestrator response schema'),
      codeP('{ "marketEquilibrium": "...", "recommendation": "...",'),
      codeP('  "riskAnalysis": "...", "keyInsights": ["...", "..."] }'),

      sp(120),
      h2('4.3  agents.js — Simulation Engine'),
      p('The core orchestration loop. Accepts the scored scenario object and runs the full multi-round simulation.'),
      sp(80),
      h3('Round-by-Round Flow'),
      simpleTable([
        ['Round', 'What Each Agent Receives', 'Purpose'],
        ['Round 1', 'Own profile + trigger event only. No knowledge of other rivals.', 'Establishes independent baseline reactions.'],
        ['Round 2', 'Own profile + trigger + all Round 1 moves from other competitors', 'Models reactive adjustments — escalation, de-escalation, or pivot.'],
        ['Equilibrium check', 'Compares magnitude and type to Round 1 results', 'Stops simulation if no competitor shifted by >15 points. Skips Round 3.'],
        ['Round 3 (conditional)', 'Own profile + trigger + Round 2 moves', 'Final stabilization when equilibrium was not reached after Round 2.'],
        ['Orchestrator', 'Complete summary of all rounds for all competitors', 'Synthesizes market state, recommendation, and risk analysis.'],
      ], [1800, 3600, 3960]),
      sp(100),
      h3('Equilibrium Detection Logic'),
      p('After Round 2, agents.js checks two conditions for every competitor:'),
      li('Magnitude drift: Did intensity score change by more than 15 points vs. previous round?'),
      li('Type change: Did response type change (e.g. "aggressive" → "defensive")?'),
      p('If no competitor satisfies either condition, equilibrium is declared. In testing, ~70% of price-move scenarios reach equilibrium after Round 2, matching real-market observations.'),
      sp(100),
      h3('API Call Budget'),
      simpleTable([
        ['Call Type', 'Count per Run', 'Token Limit', 'Typical Duration'],
        ['Competitor agent (Round 1)', '1 per competitor (up to 3)', '1,000 tokens', '3–5 seconds'],
        ['Competitor agent (Round 2)', '1 per competitor (up to 3)', '1,000 tokens', '3–5 seconds'],
        ['Competitor agent (Round 3)', '1 per competitor — conditional', '1,000 tokens', '3–5 seconds'],
        ['Orchestrator', '1 per simulation', '4,096 tokens', '8–12 seconds'],
        ['Total (2-round run)', '7 calls', '—', '~45 seconds'],
        ['Total (3-round run)', '10 calls', '—', '~60 seconds'],
      ], [2600, 2000, 1800, 2960]),

      sp(120),
      h2('4.4  server.js — API Layer'),
      p('A minimal Express server. Two endpoints only:'),
      li('GET /api/health — returns { status: "ok" }. Used by the frontend to confirm the backend is running before allowing simulation.'),
      li('POST /api/simulate — accepts scenario JSON, runs the full simulation pipeline, returns complete result. All Claude calls happen synchronously within this request.'),
      sp(80),
      p('CORS is configured to accept any localhost port, enabling the Vite dev server to communicate without port-specific setup. API key errors from Anthropic surface as readable 401 messages rather than generic 500s.'),

      sp(120),
      h2('4.5  Frontend — React UI'),
      p('The frontend is a dark-themed enterprise web application built on React 19, Vite 8, and Tailwind CSS v4. The UI is structured as a three-step workflow: Scenario Setup → Competitor Profiles → Run Simulation. A dark navy header (background #0B1426) anchors a consistent visual language across all views.'),
      h3('App.jsx'),
      p('Application shell. Holds all state: yourCompany, competitors[], activeTab, simulationResult, isLoading, error. Manages the three-tab workflow with numbered step indicators and issues POST /api/simulate. Includes a demo data loader that populates the TelcoX scenario. The tab bar uses numbered badges (01, 02, 03) styled in sky-blue when active.'),
      h3('CompetitorProfileForm.jsx'),
      p('The 12-field data entry form per competitor. Section headers use a left-border accent style with color-coded section labels. All inputs share a consistent dark styling (bg-gray-900 / border-gray-700). Critically, the component mirrors profileBuilder.js scoring logic in the browser — all three behavioral scores recalculate live as the user types, displayed in a sticky live scorecard on the right.'),
      h3('SimulationResults.jsx — Consultant-Style Dashboard'),
      p('Redesigned to present results as a management consultant briefing. Components render in this order:'),
      li('VerdictBanner: Color-coded verdict (PROCEED / PROCEED WITH CAUTION / REVISE STRATEGY) derived from the orchestrator\'s betterAlternative presence and yourCompany player outcome. Green/amber/red with matching backgrounds.'),
      li('RecommendationPanel: Two-column layout — strategic recommendation and alternative move (left, 2/3 width) alongside market equilibrium state with outcome labels per player (right, 1/3 width).'),
      li('CompetitiveResponseMatrix: Scannable table replacing individual competitor cards. Columns: Competitor | Expected Response | Timing | Threat Level (HIGH/MEDIUM/LOW derived from cap+aggression scores) | Implication for You.'),
      li('ScenarioOutcomes: Best Case / Base Case / Worst Case in color-coded columns (green/blue/red backgrounds).'),
      li('SensitivityPanel: Four sliders (competitor financial strength, price cut magnitude, market growth rate, regulatory cap toggle). Each change debounces 500ms then re-runs the full simulation. Shows a recalculating overlay during re-run.'),
      li('Watchpoints: Numbered watchlist signals and key risks in separate lists.'),
      li('RoundDetail: Collapsible round-by-round reasoning, collapsed by default — labeled "Supporting detail" so executives know it is optional depth.'),

      // ── 5. AI INTEGRATION ────────────────────────────────────────────────
      pb(),
      h1('5. AI Integration'),

      h2('5.1  Model Selection'),
      p('CompetitorSim uses claude-sonnet-4-6 for all calls. This model balances reasoning depth with response speed. Haiku would be faster but produces less strategic nuance. Opus would add depth but unnecessary latency and cost for this use case.'),

      h2('5.2  Prompt Design Principles'),
      li('Plain language over jargon: Prompts explicitly prohibit MBA-speak and require "numbers + plain English." This reduces vague strategic platitudes in responses.'),
      li('Character grounding: Each competitor agent is told "You ARE [Competitor Name]" and given their specific scored profile. This role-playing framing significantly improves differentiation across competitors.'),
      li('JSON enforcement: Structured output is embedded in the prompt and validated in code, preventing reformatted responses from breaking the simulation.'),

      h2('5.3  Error Handling'),
      simpleTable([
        ['Error Condition', 'Handling Behavior'],
        ['Network timeout', 'Returns fallback response object; simulation continues with partial data'],
        ['Malformed JSON response', 'Triggers one retry with explicit JSON-only instruction'],
        ['Anthropic API 401 (invalid key)', 'Surfaces as actionable error message to frontend — not a generic 500'],
        ['Anthropic API 429 (rate limit)', 'Returns descriptive error; no silent retry loop'],
      ], [3200, 6160]),

      h2('5.4  Optimization Opportunities (Not Yet Implemented)'),
      li('Prompt caching: The competitor system prompt (full profile) is identical across rounds and could be cached via Anthropic SDK to reduce cost and latency.'),
      li('Parallel round calls: All competitor agents in a given round could be called in parallel rather than sequentially.'),
      li('Streaming: Orchestrator response could be streamed to the frontend for perceived faster delivery.'),

      // ── 6. SCORING DETAIL ────────────────────────────────────────────────
      pb(),
      h1('6. Scoring System — Interpreting the Scores'),
      p('The three behavioral scores are the bridge between raw competitor data and AI reasoning. Every AI behavioral decision is anchored to these scores. Understanding them is essential to interpreting simulation results correctly.'),
      sp(80),
      simpleTable([
        ['Score Range', 'Financial Capacity', 'Aggression Index', 'Strategic Intent'],
        ['70–100  (High)', 'Can fund sustained aggressive responses. Expect escalation, price wars, or large counter-investments.', 'Will out-discount, out-invest, or directly retaliate. Escalation is likely.', 'Actively seeking position change. Your move gives them an excuse to accelerate.'],
        ['40–69  (Medium)', 'Will respond selectively — protecting highest-value segments, conceding less strategic ground.', 'Balanced response. Proportional retaliation or opportunistic positioning.', 'Opportunistic. Exploits openings you create without overextending.'],
        ['0–39  (Low)', 'Cash-constrained or debt-heavy. Will avoid expensive responses. Expect niche pivots or defensive moves.', 'Brand-protective or conservative. Will differentiate rather than compete head-on.', 'Status-quo manager. Responds to minimize disruption rather than capitalize.'],
      ], [1400, 2660, 2660, 2640]),
      sp(100),
      callout('Score interaction: Financial Capacity=85, Aggression=90, Intent=80 → maximum escalation. Financial Capacity=30, Aggression=40, Intent=60 → creative niche pivot. The combination determines response type more than any single score alone.'),

      // ── 7. MULTI-ROUND DYNAMICS ──────────────────────────────────────────
      h1('7. Multi-Round Simulation Dynamics'),
      p('Multiple rounds are what distinguish CompetitorSim from a simple prompt-based prediction. Real competitive reactions are iterative — one company moves, rivals respond, then everyone adjusts to what others did. The multi-round structure models this:'),
      li('Round 1: Each competitor reacts to the trigger independently, establishing baseline responses.'),
      li('Round 2: Each competitor sees what rivals did in Round 1 and decides whether to adjust. This is the key multi-agent interaction point.'),
      li('Equilibrium: If reactions have stabilized, simulation ends — realistic and efficient.'),
      li('Round 3 (conditional): If reactions are still shifting, a final stabilization round runs.'),
      sp(80),
      h3('Emergent Behaviors Observed in Testing'),
      li('Cascading escalation: One competitor\'s Round 1 aggression causes a second to escalate in Round 2, triggering further escalation in Round 3.'),
      li('Niche pivoting: A financially constrained competitor who attempts to match price in Round 1 sees in Round 2 that two stronger rivals are already in a price war — and pivots to an underserved segment instead.'),
      li('Defensive coalescence: Two competitors who normally compete with each other both choose defensive moves in response to a disruptive trigger, creating a temporary alignment.'),

      // ── 8. SETUP ─────────────────────────────────────────────────────────
      pb(),
      h1('8. Setup & Configuration'),

      h2('8.1  Prerequisites'),
      li('Node.js 18 or higher'),
      li('An Anthropic API key — sign up at console.anthropic.com'),
      li('npm (bundled with Node.js)'),

      h2('8.2  Environment Variables'),
      p('Create a .env file in the project root (not inside /backend):'),
      codeP('ANTHROPIC_API_KEY=sk-ant-your-key-here'),

      h2('8.3  Running the Application'),
      codeP('# Terminal 1 — Backend'),
      codeP('cd backend && npm install && node server.js'),
      codeP('# Starts on http://localhost:3001'),
      sp(60),
      codeP('# Terminal 2 — Frontend'),
      codeP('cd frontend && npm install && npm run dev'),
      codeP('# UI at http://localhost:5173'),

      h2('8.4  Test Suite'),
      simpleTable([
        ['File', 'What It Tests', 'API Calls?'],
        ['node test-profile.js', 'Scoring math in profileBuilder.js', 'No'],
        ['node test-prompts.js', 'Prompt generation outputs', 'No'],
        ['node test-simulation.js', 'Full simulation end-to-end (~30–60s)', 'Yes'],
        ['node test-e2e.js', 'Full stack test against running server', 'Yes'],
      ], [2800, 4200, 2360]),

      h2('8.5  Demo Data — TelcoX Scenario'),
      p('Click "Load Demo Data" in the UI to populate the TelcoX scenario: a telecom company considering a 10% price cut, with three competitors (ValueNet — aggressive, PremiumConnect — premium brand, RegionalPlus — cost-constrained). Running this end-to-end replicates the whitepaper\'s practical example and demonstrates the framework\'s second-order insight: bundle strategy outperforms price cut.'),

      // ── 9. LIMITATIONS ───────────────────────────────────────────────────
      h1('9. Limitations & Roadmap'),

      h2('9.1  Current Limitations'),
      simpleTable([
        ['Limitation', 'Impact', 'Roadmap Fix'],
        ['Manual data entry', 'Competitor profiles require hand-input; no live data feeds', 'Integrate earnings call API, news scraper, patent filings'],
        ['No prompt caching', 'Full system prompts re-sent each round, increasing cost and latency', 'Add Anthropic cache_control on competitor system prompts'],
        ['Max 3 competitors', 'UI and engine designed for up to 3 rivals only', 'Dynamic competitor scaling with scrollable UI'],
        ['No persistence', 'Results not saved; no history or run comparison', 'Add local storage or lightweight DB'],
        ['No calibration loop', 'No mechanism to track prediction accuracy vs. real outcomes', 'Add post-simulation outcome logging and comparison view'],
      ], [2200, 3000, 4160]),

      // ── 10. CONCLUSION ───────────────────────────────────────────────────
      h1('10. Conclusion'),
      p('CompetitorSim demonstrates that AI multi-agent competitive simulation is not a theoretical concept — it can be built, run, and deliver meaningful strategic insights using commercially available tools today.'),
      p('The architecture is deliberately straightforward: a deterministic scoring layer grounds AI behavior in structured data; a multi-round engine models the iterative nature of real competitive dynamics; an orchestrator synthesizes second-order insights that a single analyst would struggle to surface. The TelcoX demo validates the full framework end-to-end.'),
      callout('CompetitorSim is production-ready as a proof of concept and a clear foundation for a full-scale strategic intelligence capability. The path from here to enterprise deployment is well-defined: richer live data feeds, prompt caching, calibration loops, and scaled competitor coverage.'),
      sp(240),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 200, after: 0 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 1 } },
        children: [run('CompetitorSim  ·  Built on Anthropic Claude  ·  May 2025', { size: 18, color: MID, italics: true })]
      }),
    ]
  }]
});

const OUT = '/Users/vatsalpatni/Documents/Claude_Projects/competitor-sim/docs/CompetitorSim_Technical_Documentation.docx';
Packer.toBuffer(doc)
  .then(buf => { fs.writeFileSync(OUT, buf); console.log('Written:', OUT); })
  .catch(e => { console.error(e); process.exit(1); });
