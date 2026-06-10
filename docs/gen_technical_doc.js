const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, ExternalHyperlink, PageNumber, Header, Footer,
  PageBreak, TableOfContents
} = require('docx');
const fs = require('fs');

const NAVY = '1E2761';
const LIGHT_BLUE = 'CADCFC';
const ACCENT = '4472C4';
const GRAY_BG = 'F2F4F8';
const DARK_GRAY = '404040';
const CODE_BG = 'F4F4F4';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, color: NAVY, font: 'Calibri' })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: ACCENT, font: 'Calibri' })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: DARK_GRAY, font: 'Calibri' })]
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '333333', ...opts })]
  });
}

function bodyRuns(runs) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: runs.map(r => new TextRun({ size: 22, font: 'Calibri', color: '333333', ...r }))
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '333333' })]
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    shading: { fill: CODE_BG, type: ShadingType.CLEAR },
    indent: { left: 360 },
    children: [new TextRun({ text, size: 20, font: 'Courier New', color: '333333' })]
  });
}

function callout(text, color = LIGHT_BLUE) {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    indent: { left: 360, right: 360 },
    shading: { fill: color, type: ShadingType.CLEAR },
    children: [new TextRun({ text, size: 22, font: 'Calibri', italics: true, color: NAVY })]
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer(before = 120) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun('')] });
}

function twoColTable(rows, widths = [3000, 6360]) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(([left, right], i) => new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: widths[0], type: WidthType.DXA },
          shading: { fill: i === 0 ? NAVY : GRAY_BG, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({
            children: [new TextRun({
              text: left, size: 20, font: 'Calibri', bold: i === 0,
              color: i === 0 ? 'FFFFFF' : NAVY
            })]
          })]
        }),
        new TableCell({
          borders,
          width: { size: widths[1], type: WidthType.DXA },
          shading: { fill: i === 0 ? NAVY : 'FFFFFF', type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({
            children: [new TextRun({
              text: right, size: 20, font: 'Calibri', bold: i === 0,
              color: i === 0 ? 'FFFFFF' : '333333'
            })]
          })]
        })
      ]
    }))
  });
}

function moduleTable(modules) {
  // header + rows
  const allRows = [['Module / File', 'Responsibility', 'Key Exports / Functions']].concat(modules);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 3600, 3360],
    rows: allRows.map(([mod, resp, exp], i) => new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 2400, type: WidthType.DXA },
          shading: { fill: i === 0 ? NAVY : (i % 2 === 0 ? GRAY_BG : 'FFFFFF'), type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: mod, size: 19, font: 'Courier New', bold: i === 0, color: i === 0 ? 'FFFFFF' : '1E2761' })] })]
        }),
        new TableCell({
          borders,
          width: { size: 3600, type: WidthType.DXA },
          shading: { fill: i === 0 ? NAVY : (i % 2 === 0 ? GRAY_BG : 'FFFFFF'), type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: resp, size: 19, font: 'Calibri', bold: i === 0, color: i === 0 ? 'FFFFFF' : '333333' })] })]
        }),
        new TableCell({
          borders,
          width: { size: 3360, type: WidthType.DXA },
          shading: { fill: i === 0 ? NAVY : (i % 2 === 0 ? GRAY_BG : 'FFFFFF'), type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: exp, size: 19, font: 'Calibri', bold: i === 0, color: i === 0 ? 'FFFFFF' : '333333' })] })]
        })
      ]
    }))
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }, {
          level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } }
        }]
      },
      {
        reference: 'numbered',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } }
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Calibri', color: NAVY },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Calibri', color: ACCENT },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Calibri', color: DARK_GRAY },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 1 } },
          children: [
            new TextRun({ text: 'CompetitorSim — Technical Architecture & Deep Dive', size: 18, font: 'Calibri', color: '888888' }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 1 } },
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: 'Page ', size: 18, font: 'Calibri', color: '888888' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Calibri', color: '888888' }),
            new TextRun({ text: ' of ', size: 18, font: 'Calibri', color: '888888' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: 'Calibri', color: '888888' })
          ]
        })]
      })
    },
    children: [
      // ─── COVER ───────────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 2400, after: 200 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'CompetitorSim', size: 72, bold: true, font: 'Calibri', color: NAVY })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 120 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Technical Architecture & Deep-Dive Documentation', size: 36, font: 'Calibri', color: ACCENT })]
      }),
      new Paragraph({
        spacing: { before: 120, after: 80 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'An AI-Powered Competitive Reaction Simulator', size: 26, font: 'Calibri', italics: true, color: DARK_GRAY })]
      }),
      new Paragraph({
        spacing: { before: 800, after: 80 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Version 1.0  |  May 2025', size: 22, font: 'Calibri', color: '888888' })]
      }),
      new Paragraph({
        spacing: { before: 80, after: 80 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Built as proof of concept for the whitepaper:', size: 22, font: 'Calibri', color: '888888' })]
      }),
      new Paragraph({
        spacing: { before: 80, after: 2400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '“Simulating Competitors: How AI Agents Redefine Competitive Strategy in 2025”', size: 22, font: 'Calibri', italics: true, color: NAVY })]
      }),
      pageBreak(),

      // ─── TABLE OF CONTENTS ─────────────────────────────────────────
      new Paragraph({
        spacing: { before: 240, after: 400 },
        children: [new TextRun({ text: 'Table of Contents', size: 36, bold: true, font: 'Calibri', color: NAVY })]
      }),
      new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
      pageBreak(),

      // ─── 1. EXECUTIVE SUMMARY ────────────────────────────────────────
      h1('1. Executive Summary'),
      body('CompetitorSim is a working, interactive proof-of-concept application that demonstrates the practical feasibility of AI-powered competitive reaction simulation. It was purpose-built to validate the theoretical framework described in the accompanying whitepaper, which argues that AI multi-agent systems can replace guesswork in predicting how competitors will respond to strategic moves.'),
      body('The tool allows any user—no coding required—to input their company’s strategic move and profiles of up to three competitors, then watch a Claude-powered multi-agent simulation play out in real time. Within 60 seconds, it returns:'),
      bullet('Round-by-round competitor responses with reasoning'),
      bullet('An equilibrium state (when competitive dynamics stabilize)'),
      bullet('A synthesized strategic recommendation with risk analysis'),
      bullet('Interactive sensitivity sliders for what-if exploration'),
      spacer(),
      callout('The most important result: CompetitorSim’s built-in TelcoX demo delivers the exact second-order insight the whitepaper predicts — that a 10% price cut triggers a margin-eroding price war, and that a bundling + segmentation strategy would outperform it. The tool proves the theory works in practice.'),

      spacer(240),

      // ─── 2. PROBLEM & PURPOSE ────────────────────────────────────────
      h1('2. Problem Statement & Purpose'),
      body('Competitive strategy has a fundamental blind spot: organizations invest heavily in planning their own moves, but dramatically underinvest in anticipating how competitors will respond. Traditional approaches have well-documented limitations:'),
      spacer(),
      twoColTable([
        ['Tool', 'Core Limitation'],
        ['Benchmarking', 'Backward-looking — reflects what rivals did, not what they will do'],
        ['Expert Judgment', 'Bounded by cognitive biases; misses disruptive or unconventional responses'],
        ['War-Gaming Workshops', 'Produces 2–3 scenarios once a year; cannot match real-market velocity'],
        ['Spreadsheet Modeling', 'Static; assumes one future, ignores cascading competitor reactions'],
      ], [2600, 6760]),
      spacer(240),
      body('CompetitorSim exists to close this gap by providing a fast, repeatable, AI-powered simulation environment where competitive dynamics can be explored before a strategic move is executed in the real world.'),
      body('Specifically, the tool was built to answer: “If our company does X, how will each of our top competitors respond — and what will the market look like after everyone has adjusted?”'),
      pageBreak(),

      // ─── 3. HIGH-LEVEL ARCHITECTURE ─────────────────────────────────
      h1('3. High-Level Architecture'),
      body('CompetitorSim follows a clean separation of concerns across five backend modules and a React frontend. Data flows in one direction: from user input through scoring, simulation, and synthesis to structured output.'),
      spacer(),
      twoColTable([
        ['Layer', 'Components'],
        ['Frontend (UI)', 'React 19 + Vite + Tailwind CSS 4 (app.jsx, CompetitorProfileForm.jsx, SimulationResults.jsx)'],
        ['API Layer', 'Express.js server on port 3001 (server.js) — single POST /api/simulate endpoint'],
        ['Scoring Engine', 'Deterministic profileBuilder.js — converts raw inputs to 3 numeric scores per competitor'],
        ['Simulation Engine', 'agents.js — multi-round Claude API orchestration with equilibrium detection'],
        ['Prompt Library', 'prompts.js — templates for competitor agent system prompts and orchestrator'],
      ], [2600, 6760]),
      spacer(240),

      h2('3.1 Data Flow Diagram'),
      body('The following describes the complete end-to-end data flow for a simulation run:'),
      spacer(),
      code('User Input (React UI)'),
      code('    │'),
      code('    ├── yourCompany: { name, strategicMove, context }'),
      code('    └── competitors[]: [ { 12 raw data fields each } ]'),
      code('    │'),
      code('    ▼'),
      code('POST /api/simulate (Express server.js)'),
      code('    │'),
      code('    ▼'),
      code('profileBuilder.buildCompetitorProfile(rawInputs)  ← per competitor'),
      code('    │  Outputs: { financialCapacity, aggressionIndex, strategicIntent,'),
      code('    │             behavioralSummary, constraints, opportunities }'),
      code('    │'),
      code('    ▼'),
      code('agents.runSimulation(scenario)'),
      code('    │'),
      code('    ├── Round 1: callCompetitorAgent() × N competitors (parallel)'),
      code('    ├── Round 2: agents see each other’s Round 1 moves'),
      code('    ├── Equilibrium check: drift > 15 points? → Round 3 : stop'),
      code('    └── Orchestrator: synthesize all rounds → market state + recommendation'),
      code('    │'),
      code('    ▼'),
      code('JSON response → React frontend → SimulationResults.jsx'),
      pageBreak(),

      // ─── 4. MODULE DEEP DIVE ─────────────────────────────────────────
      h1('4. Module-by-Module Deep Dive'),

      h2('4.1 profileBuilder.js — The Scoring Engine'),
      body('This is the most architecturally important module because it determines what the AI “knows” about each competitor before any reasoning begins. Rather than passing raw, unstructured input directly to Claude, profileBuilder converts 12 user-provided data points into deterministic, normalized scores on three behavioral axes. This grounds the AI simulation in structured data.'),
      spacer(),
      h3('Input: 12 Data Fields per Competitor'),
      twoColTable([
        ['Field', 'What It Captures'],
        ['revenue', 'Annual revenue (e.g. "$2.4B") — used to gauge scale'],
        ['revenueGrowth', 'YoY revenue growth rate — signals momentum'],
        ['cashReserves', 'Available cash/liquidity — determines ability to act aggressively'],
        ['debtLevel', 'Debt load (low/medium/high) — constrains strategic options'],
        ['marketShare', 'Current market share % — proxy for competitive position'],
        ['marketShareTrend', 'Whether share is growing, stable, or declining'],
        ['pricePositioning', 'Premium, mid-market, or value — shapes likely response type'],
        ['recentActions', 'Recent strategic moves (acquisitions, launches, cuts)'],
        ['leadershipStyle', 'Executive rhetoric (aggressive, conservative, opportunistic)'],
        ['innovationRate', 'How frequently they launch new products or features'],
        ['regulatoryConstraints', 'Industry or regional limits on behavior'],
        ['customerLoyalty', 'Brand stickiness — affects how much they need to react defensively'],
      ], [2400, 6960]),
      spacer(200),
      h3('Output: 3 Behavioral Scores'),
      body('Each score is computed deterministically from the input fields using weighted formulas:'),
      spacer(),
      bullet('Financial Capacity (0–100): Composite of cash reserves, debt level, and revenue scale. A high score means the competitor can absorb costs to execute an aggressive counter-move. A low score means they are financially constrained and will likely avoid expensive responses.'),
      bullet('Aggression Index (0–100): Derived from leadership style, market share trend, recent actions, and price positioning. A high score indicates a competitor who is likely to escalate — out-discount, out-invest, or retaliate directly. A low score suggests a defensive or opportunistic posture.'),
      bullet('Strategic Intent (0–100): Combines innovation rate, market share ambition, and recent strategic moves. High intent means the competitor is actively trying to change their position. Low intent suggests they are managing the status quo.'),
      spacer(),
      body('The scores, alongside a plain-English behavioral summary and lists of constraints and opportunities, are then passed to the AI agents as structured context. This is what makes the simulation explainable rather than a black box — every AI decision is anchored to specific scored inputs.'),
      spacer(),
      callout('Design rationale: Scoring is intentionally kept separate from AI reasoning. The deterministic scoring engine ensures reproducibility and traceability. The AI layer then adds semantic nuance — interpreting what the scores mean in the context of the specific competitive scenario.'),
      spacer(200),

      h2('4.2 prompts.js — The Prompt Library'),
      body('All prompt templates live in prompts.js. This is a critical architectural decision — centralizing prompts prevents drift and makes it easy to tune the simulation’s behavior without touching business logic.'),
      spacer(),
      h3('Three Prompt Functions'),
      spacer(),
      bullet('buildSystemPrompt(profile, scenario): Constructs the system prompt for each competitor agent. It injects the competitor’s full scored profile (translated to plain English, not raw numbers), the triggering strategic move, and the market context. The prompt instructs Claude to reason in character as this specific competitor, using numbers and plain language — no MBA jargon.'),
      bullet('buildRoundPrompt(round, otherMoves): Generates the user-turn prompt for Round 2+ that includes what other competitors did in the previous round. This is what enables reactive, multi-agent dynamics — each agent sees the competitive landscape as it evolves.'),
      bullet('buildOrchestratorPrompt(allRounds, scenario): The synthesis prompt fed to the final orchestrator agent. It receives a structured summary of all rounds for all competitors and asks for: (1) market equilibrium state, (2) strategic recommendation, (3) risk analysis.'),
      spacer(),
      h3('Response Format Enforcement'),
      body('All prompts require JSON-only responses from Claude. This is enforced via explicit prompt instructions and validated in agents.js after each call. The JSON schema includes:'),
      code('// Competitor agent response'),
      code('{'),
      code('  "response": "narrative description of action",'),
      code('  "action": "specific move (price cut, bundle launch, etc.)",'),
      code('  "magnitude": 0-100,   // intensity of the response'),
      code('  "type": "aggressive|defensive|opportunistic|neutral",'),
      code('  "reasoning": "plain English explanation"'),
      code('}'),
      spacer(),
      code('// Orchestrator response'),
      code('{'),
      code('  "marketEquilibrium": "...",'),
      code('  "recommendation": "...",'),
      code('  "riskAnalysis": "...",'),
      code('  "keyInsights": ["...", "..."]'),
      code('}'),
      pageBreak(),

      h2('4.3 agents.js — The Simulation Engine'),
      body('This module contains the core loop that drives the multi-round simulation. It is the heart of CompetitorSim.'),
      spacer(),
      h3('runSimulation(scenario)'),
      body('The main exported function. Accepts the full scenario object (company info + competitor profiles with scores) and returns a complete simulation result.'),
      spacer(),
      h3('Simulation Flow in Detail'),
      spacer(),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 60 },
        children: [new TextRun({ text: 'Round 1 — Independent Reactions', bold: true, size: 22, font: 'Calibri', color: NAVY })]
      }),
      body('Each competitor agent receives the trigger event (e.g. “TelcoX is cutting prices 10%”) and its own profile. It does not yet know what other competitors will do. Claude is called once per competitor with the system prompt from prompts.buildSystemPrompt() and a neutral user turn describing only the trigger.'),
      spacer(),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 60 },
        children: [new TextRun({ text: 'Round 2 — Reactive Adjustments', bold: true, size: 22, font: 'Calibri', color: NAVY })]
      }),
      body('Each competitor agent now receives the Round 1 moves of all other competitors via prompts.buildRoundPrompt(). This is the key multi-agent interaction point. An aggressive competitor might escalate when they see a rival has already moved; a conservative competitor might hold when they see the market is already destabilizing.'),
      spacer(),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 60 },
        children: [new TextRun({ text: 'Equilibrium Check — Did Anything Change?', bold: true, size: 22, font: 'Calibri', color: NAVY })]
      }),
      body('After Round 2, agents.js checks whether any competitor meaningfully shifted their strategy. The threshold is a 15-point change in magnitude or a change in response type. If no competitor shifted beyond this threshold, the system declares equilibrium and skips Round 3, saving API cost and reflecting real market dynamics (competitors often reach stable reactions quickly).'),
      spacer(),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 60 },
        children: [new TextRun({ text: 'Round 3 (Conditional) — Final Stabilization', bold: true, size: 22, font: 'Calibri', color: NAVY })]
      }),
      body('If equilibrium was not reached, a third round runs. In practice this handles scenarios where the competitive response is still evolving — e.g., one competitor reacting to another’s Round 2 escalation. After Round 3 the simulation ends regardless, preventing infinite loops.'),
      spacer(),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 60 },
        children: [new TextRun({ text: 'Orchestrator — Market Synthesis', bold: true, size: 22, font: 'Calibri', color: NAVY })]
      }),
      body('The final call is to a separate orchestrator agent that receives a summary of all rounds for all competitors. It produces the market equilibrium state, strategic recommendation, and risk analysis. The orchestrator uses a 4096-token response allowance (vs 1000 for competitor agents) to allow for richer synthesis.'),
      spacer(),
      h3('callCompetitorAgent(competitor, round, context)'),
      body('The internal function that wraps each Claude API call. It:'),
      bullet('Builds the prompt using prompts.js functions'),
      bullet('Calls the Anthropic SDK with model: claude-sonnet-4-6'),
      bullet('Parses the JSON response and validates required fields'),
      bullet('Returns a structured result object with all round data attached'),
      spacer(),
      callout('API cost management: Competitor agents use max_tokens: 1000, keeping response time fast (~3–5s per call). The orchestrator uses max_tokens: 4096 for deeper synthesis. A full 3-competitor, 3-round simulation makes approximately 9 competitor calls + 1 orchestrator call = ~$0.10–0.25 at current Claude pricing.'),
      pageBreak(),

      h2('4.4 server.js — The API Layer'),
      body('A minimal Express server with two endpoints:'),
      spacer(),
      twoColTable([
        ['Endpoint', 'Purpose'],
        ['GET /api/health', 'Returns { status: "ok" } — used by frontend to verify backend is running'],
        ['POST /api/simulate', 'Accepts scenario JSON, runs full simulation via agents.js, returns complete result'],
      ], [2800, 6560]),
      spacer(200),
      body('CORS is configured to allow any localhost port (matches /^http:\\/\\/localhost:\\d+$/), enabling the Vite dev server to communicate with the Express backend without port-specific configuration.'),
      body('All environment variables (ANTHROPIC_API_KEY) are loaded via dotenv from the project root. A 401 from the Anthropic API surfaces as a clear error message rather than a generic server crash.'),
      spacer(200),

      h2('4.5 Frontend — React UI'),
      body('The frontend is a React 19 + Vite application styled with Tailwind CSS 4. It provides the full user experience: data entry, simulation triggering, and results display.'),
      spacer(),
      h3('App.jsx — Application Shell'),
      body('Holds all application state: yourCompany, competitors[], activeTab, result, loading, error. Manages the three-tab interface (Setup → Competitors → Results). Issues the POST /api/simulate request and passes the response down to SimulationResults.'),
      spacer(),
      h3('CompetitorProfileForm.jsx — Data Entry + Live Scorecard'),
      body('Renders the 12-field input form for each competitor. Critically, it mirrors the profileBuilder.js scoring logic in the browser, recalculating Financial Capacity, Aggression Index, and Strategic Intent scores live as the user types. This gives immediate feedback on how input values translate to behavioral scores before any simulation is run.'),
      spacer(),
      h3('SimulationResults.jsx — Results Dashboard'),
      body('Displays the full simulation output: per-round competitor responses, equilibrium status, orchestrator verdict. Also renders the sensitivity analysis panel with four sliders:'),
      bullet('Competitor financial strength adjustment'),
      bullet('Your price cut magnitude'),
      bullet('Market growth rate'),
      bullet('Regulatory cap strength'),
      body('Each slider change triggers an independent re-simulation POST, allowing strategists to explore how small changes in assumptions affect the outcome without re-entering all data.'),
      pageBreak(),

      // ─── 5. AI INTEGRATION ───────────────────────────────────────────
      h1('5. AI Integration Details'),
      h2('5.1 Model Selection'),
      body('CompetitorSim uses claude-sonnet-4-6 for all Claude API calls. This model was chosen for its balance of reasoning depth and response speed. The simulation requires nuanced strategic reasoning (not just text completion), so a capable model is essential. Haiku would be faster but produces less strategic depth; Opus would be more capable but adds unnecessary latency and cost for this use case.'),
      spacer(200),

      h2('5.2 Prompt Design Philosophy'),
      body('The prompt architecture reflects three deliberate design choices:'),
      spacer(),
      bullet('Plain language over jargon: All prompts explicitly prohibit MBA-speak and require responses in numbers + plain English. This improves output quality because Claude is less likely to fall back on vague strategic platitudes.'),
      bullet('Character grounding: Each competitor agent is told “You ARE [Competitor Name]” and given their specific profile. This role-playing framing significantly improves the realism and differentiation of responses across competitors.'),
      bullet('Structured output enforcement: JSON-only responses enable reliable programmatic parsing. The schema is embedded in the prompt and validated in code, preventing hallucinated or reformatted outputs from breaking the simulation.'),
      spacer(200),

      h2('5.3 No Caching in Current Version'),
      body('The current implementation does not use prompt caching (despite the Anthropic SDK supporting it). This is an optimization opportunity: the competitor system prompt (which includes the full profile) is the same across rounds for a given competitor and could be cached to reduce cost and latency in multi-round simulations. This is noted as a future enhancement.'),
      spacer(200),

      h2('5.4 Error Handling'),
      body('The agent call layer wraps each Claude API call in a try/catch. On failure:'),
      bullet('Network timeouts return a fallback response object rather than crashing the simulation'),
      bullet('Malformed JSON responses trigger a retry with an explicit “respond only in valid JSON” instruction'),
      bullet('API 401/429 errors surface to the frontend as actionable error messages (not generic 500s)'),
      pageBreak(),

      // ─── 6. SCORING SYSTEM DETAIL ────────────────────────────────────
      h1('6. Scoring System Detail'),
      body('The three behavioral scores are the bridge between raw competitor data and AI reasoning. Understanding them is essential to interpreting simulation results correctly.'),
      spacer(),

      h2('6.1 Financial Capacity (0–100)'),
      body('Measures the competitor’s ability to absorb costs and execute expensive counter-moves.'),
      spacer(),
      bullet('High score (70–100): Large cash reserves, low debt, strong revenue. This competitor can match or out-invest any move you make. Expect aggressive, sustained responses.'),
      bullet('Medium score (40–69): Moderate resources. Will respond selectively — protecting their highest-value segments while conceding less strategic ground.'),
      bullet('Low score (0–39): Cash-constrained or debt-heavy. Cannot match costly responses. Likely to pivot to niche or defensive moves rather than direct retaliation.'),
      spacer(200),

      h2('6.2 Aggression Index (0–100)'),
      body('Measures how likely the competitor is to escalate rather than absorb or deflect.'),
      spacer(),
      bullet('High score (70–100): Market-share hungry, historically proactive, aggressive leadership tone. Expect them to match and exceed your move.'),
      bullet('Medium score (40–69): Balanced — will react proportionally. The response type (defensive vs. opportunistic) depends more on their Strategic Intent.'),
      bullet('Low score (0–39): Brand-protective or conservative. More likely to differentiate rather than compete head-on on price or volume.'),
      spacer(200),

      h2('6.3 Strategic Intent (0–100)'),
      body('Measures how actively this competitor is trying to change their market position.'),
      spacer(),
      bullet('High score (70–100): Actively innovating, launching products, seeking share gains. Your move gives them an excuse to accelerate.'),
      bullet('Medium score (40–69): Opportunistic. Will exploit openings you create but won’t overextend.'),
      bullet('Low score (0–39): Status-quo manager. Focused on retention over growth. Responds to minimize disruption rather than capitalize on it.'),
      spacer(200),

      callout('Score interaction example: A competitor with Financial Capacity=85, Aggression=90, Intent=80 will produce the most dramatic and sustained competitive response — think Tesla-style aggressive pricing. A competitor with Capacity=30, Aggression=40, Intent=60 will likely find a creative niche pivot rather than engage directly — think a regional player going rural.'),
      pageBreak(),

      // ─── 7. MULTI-ROUND DYNAMICS ─────────────────────────────────────
      h1('7. Multi-Round Simulation Dynamics'),
      body('The multi-round structure is what distinguishes CompetitorSim from a simple “what will competitor X do” prompt. It models the iterative nature of real competitive responses.'),
      spacer(),

      h2('7.1 Why Multiple Rounds Matter'),
      body('In real markets, competitive reactions are rarely instantaneous or final. A competitor sees your move, makes an initial response, then adjusts as they see what others are doing. A price war doesn’t start with one cut — it escalates through a sequence of moves and counter-moves. CompetitorSim models this by:'),
      bullet('Making each competitor react to the trigger independently first (Round 1)'),
      bullet('Then making each competitor react to the full competitive landscape (Round 2+)'),
      bullet('Checking whether any meaningful strategic shift occurred before deciding to run another round'),
      spacer(200),

      h2('7.2 The Equilibrium Check'),
      body('After each round from Round 2 onward, agents.js compares each competitor’s current response to their previous round response on two dimensions:'),
      bullet('Magnitude drift: Did the intensity score change by more than 15 points?'),
      bullet('Type change: Did the response type change (e.g. from “aggressive” to “defensive”)?'),
      body('If no competitor changed on either dimension, the market is in equilibrium. The simulation stops and the orchestrator synthesizes the final state. This is both computationally efficient and strategically realistic — most competitive dynamics do stabilize after 2–3 rounds.'),
      spacer(200),

      h2('7.3 Emergent Behaviors'),
      body('The multi-round structure produces behaviors that would not appear in a single-round simulation:'),
      bullet('Cascading escalation: One competitor’s aggressive Round 1 move causes a second competitor to escalate in Round 2, which then causes the first to escalate further in Round 3.'),
      bullet('Niche pivoting: A financially constrained competitor who would initially try to match price sees in Round 2 that two stronger rivals have already engaged in a price war and pivots to an underserved segment instead.'),
      bullet('Defensive coalescence: Two competitors who would normally compete with each other both choose defensive moves in response to a disruptive trigger, effectively creating a temporary alignment of interests.'),
      pageBreak(),

      // ─── 8. SETUP & CONFIGURATION ────────────────────────────────────
      h1('8. Setup & Configuration'),
      h2('8.1 Prerequisites'),
      bullet('Node.js 18 or higher'),
      bullet('An Anthropic API key (sign up at anthropic.com)'),
      bullet('npm (bundled with Node.js)'),
      spacer(200),

      h2('8.2 Environment Variables'),
      body('Create a .env file in the project root (not in /backend):'),
      code('ANTHROPIC_API_KEY=sk-ant-your-key-here'),
      spacer(200),

      h2('8.3 Running the Application'),
      code('# Terminal 1 — Start the backend'),
      code('cd backend'),
      code('npm install'),
      code('node server.js'),
      code('# Server starts on http://localhost:3001'),
      spacer(),
      code('# Terminal 2 — Start the frontend'),
      code('cd frontend'),
      code('npm install'),
      code('npm run dev'),
      code('# UI available at http://localhost:5173'),
      spacer(200),

      h2('8.4 Running Tests'),
      body('All test files are in /backend:'),
      spacer(),
      twoColTable([
        ['Test File', 'What It Tests'],
        ['node test-profile.js', 'Unit tests for scoring math in profileBuilder.js — no API calls'],
        ['node test-prompts.js', 'Validates prompt generation outputs — no API calls'],
        ['node test-simulation.js', 'Full end-to-end simulation with live Claude API (~30–60s)'],
        ['node test-e2e.js', 'Full stack test against the running server (start server first)'],
      ], [3000, 6360]),
      spacer(200),

      h2('8.5 Demo Data'),
      body('The frontend includes a “Load Demo Data” button that populates the TelcoX scenario:'),
      bullet('Your company: TelcoX — planning a 10% price cut on core plan'),
      bullet('ValueNet — aggressive challenger with strong financials'),
      bullet('PremiumConnect — premium brand focused on innovation and loyalty'),
      bullet('RegionalPlus — cost-constrained regional player'),
      body('This scenario is the same one described in the whitepaper’s “Practical Example” section. Running it end-to-end produces the results the whitepaper predicts: ValueNet triggers a price war, PremiumConnect bundles, RegionalPlus pivots to niche, and the orchestrator recommends a bundling strategy over the price cut.'),
      pageBreak(),

      // ─── 9. LIMITATIONS & FUTURE DIRECTIONS ─────────────────────────
      h1('9. Limitations & Future Directions'),
      h2('9.1 Current Limitations'),
      spacer(),
      twoColTable([
        ['Limitation', 'Detail'],
        ['Manual data entry', 'Competitor profiles are entered by hand. No live data integration yet.'],
        ['No prompt caching', 'Multi-round calls re-send full system prompts each time, increasing cost.'],
        ['Max 3 competitors', 'UI and simulation engine are designed for up to 3 rivals.'],
        ['No persistence', 'Results are not saved between sessions; no history or comparison view.'],
        ['No calibration loop', 'No mechanism yet to compare simulation predictions against actual outcomes.'],
      ], [2800, 6560]),
      spacer(200),

      h2('9.2 Planned Enhancements'),
      bullet('Live data feeds: Integrate earnings call transcripts, patent filings, and news APIs to auto-populate competitor profiles'),
      bullet('Prompt caching: Cache competitor system prompts across rounds to reduce API cost and latency'),
      bullet('Calibration dashboard: Track simulation predictions vs. actual competitor moves over time to tune scoring formulas'),
      bullet('More competitors: Scale to 5–6 competitors with dynamic UI'),
      bullet('Industry templates: Pre-configured scoring weights for Telecom, Banking, Retail, Automotive, and Tech'),
      bullet('Report export: One-click PDF/DOCX export of simulation results for board presentations'),
      spacer(200),

      // ─── 10. CONCLUSION ──────────────────────────────────────────────
      h1('10. Conclusion'),
      body('CompetitorSim demonstrates that the AI multi-agent simulation framework described in the whitepaper is not theoretical — it can be built, run, and deliver meaningful strategic insights in production-like conditions today.'),
      body('The architecture is deliberately straightforward: a deterministic scoring layer that grounds AI behavior in real data, a multi-round simulation engine that models the iterative nature of competitive dynamics, and an orchestrator that synthesizes second-order insights that would be difficult for any single human analyst to surface.'),
      body('The TelcoX demo scenario proves the core thesis: that the obvious strategic move (a price cut) can be revealed as suboptimal by AI simulation, because the system surfaces the cascade of competitor reactions that a static analysis would miss. That is exactly the value the whitepaper describes — and CompetitorSim delivers it.'),
      spacer(),
      callout('CompetitorSim is production-ready as a proof of concept and a foundation for a full-scale strategic intelligence capability. The path from here to enterprise deployment is well-defined: richer data feeds, calibration loops, and scaled competitor coverage.'),
      spacer(400),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 80 },
        children: [new TextRun({ text: '— End of Document —', size: 20, font: 'Calibri', color: '888888', italics: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: 'CompetitorSim • Built on Anthropic Claude • May 2025', size: 18, font: 'Calibri', color: '888888' })]
      }),
    ]
  }]
});

const OUT = '/Users/vatsalpatni/Documents/Claude_Projects/competitor-sim/docs/CompetitorSim_Technical_Documentation.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log('Written:', OUT);
}).catch(e => { console.error(e); process.exit(1); });
