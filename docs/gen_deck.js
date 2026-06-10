const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches

// ── Palette ──────────────────────────────────────────────────────────────────
const NAVY    = '1E2761';
const BLUE    = '4472C4';
const TEAL    = '028090';
const ICE     = 'C5D8F0';
const WHITE   = 'FFFFFF';
const OFFWHITE= 'F4F7FB';
const GRAY    = 'B0BAC8';
const DARK    = '1A1A2E';
const GREEN   = '1A6B4A';
const AMBER   = 'E8A020';

// ── Shared styles ────────────────────────────────────────────────────────────
const FONT = 'Calibri';

function addBg(slide, color = NAVY) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color } });
}

function addAccentBar(slide, color = TEAL) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: '100%', fill: { color } });
}

function slideTitle(slide, text, sub = null, light = true) {
  const color = light ? WHITE : NAVY;
  slide.addText(text, { x: 0.5, y: 0.28, w: 12.3, h: 0.7, fontSize: 34, bold: true, color, fontFace: FONT });
  if (sub) slide.addText(sub, { x: 0.5, y: 0.95, w: 12.3, h: 0.35, fontSize: 16, color: light ? ICE : BLUE, fontFace: FONT, italic: true });
}

function dividerLine(slide, y = 1.22, color = TEAL) {
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 12.33, h: 0.04, fill: { color } });
}

// ── SLIDE 1: Title ────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, NAVY);
  // Accent stripe left
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: '100%', fill: { color: TEAL } });
  // Large title
  s.addText('CompetitorSim', {
    x: 0.6, y: 1.5, w: 8, h: 1.2,
    fontSize: 60, bold: true, color: WHITE, fontFace: FONT
  });
  s.addText('Validating AI-Powered Competitive Reaction Simulation', {
    x: 0.6, y: 2.7, w: 10, h: 0.55,
    fontSize: 22, color: ICE, fontFace: FONT
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 3.35, w: 4.5, h: 0.05, fill: { color: TEAL } });
  s.addText('Proof of Concept  ·  Executive Briefing  ·  May 2025', {
    x: 0.6, y: 3.5, w: 8, h: 0.35,
    fontSize: 14, color: GRAY, fontFace: FONT, italic: true
  });
  s.addText('Built on Anthropic Claude', {
    x: 0.6, y: 6.8, w: 5, h: 0.35,
    fontSize: 13, color: GRAY, fontFace: FONT
  });
}

// ── SLIDE 2: The Problem ──────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, OFFWHITE);
  addAccentBar(s, NAVY);

  s.addText('The Problem: We Plan Our Moves, Not Theirs', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 30, bold: true, color: NAVY, fontFace: FONT
  });
  dividerLine(s, 0.95, NAVY);

  const bullets = [
    {
      icon: '⚠',
      head: 'Strategies are built without modeling competitor reactions',
      body: 'Traditional tools — benchmarking, expert judgment, war-gaming — show only what competitors DID, not what they WILL DO when you act.'
    },
    {
      icon: '📉',
      head: '"Competitor neglect" costs companies billions',
      body: 'Strategies built on static assumptions fail when rivals respond unexpectedly. Executives focus internally and overlook how competitors will counter their moves.'
    },
    {
      icon: '⚡',
      head: 'Markets now move faster than any human planning cycle',
      body: 'Amazon makes 250M+ price changes per day. Competitors pivot overnight. Traditional war-games produce 2–3 scenarios once a year — no match for real velocity.'
    },
  ];

  bullets.forEach((b, i) => {
    const y = 1.1 + i * 1.8;
    s.addShape(pptx.ShapeType.roundRect, { x: 0.5, y, w: 12.33, h: 1.55, fill: { color: WHITE }, line: { color: ICE, width: 1 }, rectRadius: 0.06 });
    s.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 0.08, h: 1.55, fill: { color: NAVY } });
    s.addText(b.head, { x: 0.75, y: y + 0.12, w: 11.8, h: 0.38, fontSize: 15, bold: true, color: NAVY, fontFace: FONT });
    s.addText(b.body, { x: 0.75, y: y + 0.55, w: 11.8, h: 0.85, fontSize: 13, color: '#444444', fontFace: FONT, wrap: true });
  });
}

// ── SLIDE 3: Traditional Tools Have a Ceiling ────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, OFFWHITE);
  addAccentBar(s, NAVY);

  s.addText('Traditional Tools Have a Ceiling', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 30, bold: true, color: NAVY, fontFace: FONT
  });
  dividerLine(s, 0.95, NAVY);

  const cols = [
    { title: 'Benchmarking', icon: '📊', color: '2C5F8A', limit: 'Rearview mirror', detail: 'Reflects past performance — not future intent. Tells you what rivals achieved, not what they plan next.' },
    { title: 'Expert Judgment', icon: '🧠', color: NAVY, limit: 'Bounded by bias', detail: 'Cognitive biases cause strategists to overweight their own data. Misses unconventional disruptor moves.' },
    { title: 'War-Gaming', icon: '♟', color: TEAL, limit: '2–3 scenarios / year', detail: 'Intensive but covers only a handful of futures. Real markets generate far more possibilities at far greater speed.' },
  ];

  cols.forEach((c, i) => {
    const x = 0.5 + i * 4.12;
    // Header box
    s.addShape(pptx.ShapeType.rect, { x, y: 1.1, w: 3.9, h: 1.1, fill: { color: c.color } });
    s.addText(c.title, { x, y: 1.18, w: 3.9, h: 0.5, fontSize: 18, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
    s.addText(c.limit, { x, y: 1.68, w: 3.9, h: 0.4, fontSize: 13, color: ICE, fontFace: FONT, align: 'center', italic: true });
    // Body box
    s.addShape(pptx.ShapeType.rect, { x, y: 2.22, w: 3.9, h: 3.8, fill: { color: WHITE }, line: { color: ICE, width: 1 } });
    s.addText(c.detail, { x: x + 0.15, y: 2.4, w: 3.6, h: 3.5, fontSize: 13, color: '#444444', fontFace: FONT, wrap: true, valign: 'top' });
  });

  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 6.2, w: 12.33, h: 0.55, fill: { color: NAVY } });
  s.addText('None of these tools can simulate how competitors will respond in real time — before you act.', {
    x: 0.7, y: 6.25, w: 12, h: 0.45, fontSize: 13, bold: true, color: WHITE, fontFace: FONT, align: 'center'
  });
}

// ── SLIDE 4: The Breakthrough ─────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, NAVY);
  addAccentBar(s, TEAL);

  s.addText('AI Agents Can Simulate How Rivals Think', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 30, bold: true, color: WHITE, fontFace: FONT
  });
  dividerLine(s, 0.95, TEAL);

  s.addText('AI agents are trained on competitor behavioral data and reason like the rivals they model:', {
    x: 0.5, y: 1.05, w: 12.3, h: 0.4, fontSize: 14, color: ICE, fontFace: FONT
  });

  const points = [
    ['Pricing & Promo History', 'How has the rival changed prices in the past? Do they match cuts or protect margin?'],
    ['Leadership Tone & Signals', 'What do executives signal in earnings calls? AI parses rhetoric into behavioral intent.'],
    ['Financial Constraints', 'Debt levels, cash reserves — a cash-constrained rival cannot sustain a price war.'],
    ['Product & Launch Patterns', 'Roadmap cadence and past launches reveal strategic priorities.'],
  ];

  points.forEach(([head, body], i) => {
    const x = 0.5 + (i % 2) * 6.3;
    const y = 1.6 + Math.floor(i / 2) * 2.0;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 6.0, h: 1.7, fill: { color: '243672' }, line: { color: TEAL, width: 1 }, rectRadius: 0.06 });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h: 1.7, fill: { color: TEAL } });
    s.addText(head, { x: x + 0.2, y: y + 0.12, w: 5.6, h: 0.4, fontSize: 14, bold: true, color: WHITE, fontFace: FONT });
    s.addText(body, { x: x + 0.2, y: y + 0.55, w: 5.6, h: 1.0, fontSize: 12, color: ICE, fontFace: FONT, wrap: true });
  });

  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 5.9, w: 12.33, h: 0.6, fill: { color: TEAL } });
  s.addText('Result: Run thousands of "what-if" competitive scenarios in minutes — not months of workshops.', {
    x: 0.6, y: 5.95, w: 12.1, h: 0.5, fontSize: 14, bold: true, color: WHITE, fontFace: FONT, align: 'center'
  });
}

// ── SLIDE 5: Introducing CompetitorSim ───────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, OFFWHITE);
  addAccentBar(s, TEAL);

  s.addText('CompetitorSim: Theory Becomes Tool', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 30, bold: true, color: NAVY, fontFace: FONT
  });
  s.addText('A working proof of concept that operationalizes the AI simulation framework', {
    x: 0.5, y: 0.93, w: 12.3, h: 0.35, fontSize: 14, color: TEAL, fontFace: FONT, italic: true
  });
  dividerLine(s, 1.3, TEAL);

  const caps = [
    {
      num: '01', color: NAVY,
      title: 'Competitor Profiling',
      body: 'Input 12 data points per rival. The scoring engine deterministically converts them into Financial Capacity, Aggression Index, and Strategic Intent scores (0–100).'
    },
    {
      num: '02', color: '2C5F8A',
      title: 'Multi-Round Simulation',
      body: '2–3 rounds of Claude AI reasoning. Each round, agents see what rivals did and decide whether to adjust. Equilibrium detection stops the simulation when dynamics stabilize (>15-point drift threshold).'
    },
    {
      num: '03', color: TEAL,
      title: 'Orchestrated Synthesis',
      body: 'A dedicated orchestrator agent reads all rounds and outputs: market equilibrium state, strategic recommendation, and risk analysis — in plain language executives can act on.'
    },
  ];

  caps.forEach((c, i) => {
    const x = 0.5 + i * 4.12;
    s.addShape(pptx.ShapeType.rect, { x, y: 1.5, w: 3.9, h: 0.65, fill: { color: c.color } });
    s.addText(c.num, { x, y: 1.52, w: 1.0, h: 0.6, fontSize: 24, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
    s.addText(c.title, { x: x + 1.0, y: 1.58, w: 2.8, h: 0.5, fontSize: 14, bold: true, color: WHITE, fontFace: FONT });
    s.addShape(pptx.ShapeType.rect, { x, y: 2.17, w: 3.9, h: 4.0, fill: { color: WHITE }, line: { color: ICE, width: 1 } });
    s.addText(c.body, { x: x + 0.15, y: 2.35, w: 3.6, h: 3.6, fontSize: 13, color: '#333333', fontFace: FONT, wrap: true, valign: 'top' });
  });
}

// ── SLIDE 6: Architecture ─────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, OFFWHITE);
  addAccentBar(s, NAVY);

  s.addText('Three-Layer Architecture', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 30, bold: true, color: NAVY, fontFace: FONT
  });
  dividerLine(s, 0.95, NAVY);

  // Layer 1 — Frontend
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.1, w: 12.33, h: 0.42, fill: { color: ICE } });
  s.addText('LAYER 1  —  FRONTEND  (React + Vite + Tailwind)', { x: 0.6, y: 1.13, w: 12, h: 0.36, fontSize: 12, bold: true, color: NAVY, fontFace: FONT });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.54, w: 3.9, h: 0.55, fill: { color: WHITE }, line: { color: BLUE, width: 1 } });
  s.addText('Setup Tab\nEnter company + move', { x: 0.55, y: 1.57, w: 3.8, h: 0.48, fontSize: 11, color: NAVY, fontFace: FONT, align: 'center' });
  s.addShape(pptx.ShapeType.rect, { x: 4.5, y: 1.54, w: 4.1, h: 0.55, fill: { color: WHITE }, line: { color: BLUE, width: 1 } });
  s.addText('Competitors Tab\n12-field form + live scorecard', { x: 4.55, y: 1.57, w: 4.0, h: 0.48, fontSize: 11, color: NAVY, fontFace: FONT, align: 'center' });
  s.addShape(pptx.ShapeType.rect, { x: 8.7, y: 1.54, w: 4.13, h: 0.55, fill: { color: WHITE }, line: { color: BLUE, width: 1 } });
  s.addText('Results Tab\nRounds + recommendation + sliders', { x: 8.75, y: 1.57, w: 4.0, h: 0.48, fontSize: 11, color: NAVY, fontFace: FONT, align: 'center' });

  // Arrow
  s.addText('▼  POST /api/simulate', { x: 5.5, y: 2.18, w: 3, h: 0.3, fontSize: 12, color: NAVY, fontFace: FONT, align: 'center', italic: true });

  // Layer 2 — API
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2.52, w: 12.33, h: 0.52, fill: { color: NAVY } });
  s.addText('LAYER 2  —  EXPRESS API SERVER  (server.js · localhost:3001)', { x: 0.6, y: 2.57, w: 12, h: 0.42, fontSize: 13, bold: true, color: WHITE, fontFace: FONT, align: 'center' });

  // Arrow + three modules
  s.addText('▼', { x: 6.2, y: 3.1, w: 1, h: 0.28, fontSize: 14, color: NAVY, fontFace: FONT, align: 'center' });

  const mods = [
    { label: 'profileBuilder.js', sub: 'Scoring Engine', desc: 'Financial Capacity\nAggression Index\nStrategic Intent', color: '2C5F8A' },
    { label: 'agents.js', sub: 'Simulation Engine', desc: 'Round 1 → Round 2\nEquilibrium check\nOrchestrator call', color: NAVY },
    { label: 'prompts.js', sub: 'Prompt Library', desc: 'System prompts\nRound prompts\nOrchestrator prompt', color: TEAL },
  ];
  mods.forEach((m, i) => {
    const x = 0.5 + i * 4.12;
    s.addShape(pptx.ShapeType.rect, { x, y: 3.42, w: 3.9, h: 0.45, fill: { color: m.color } });
    s.addText(`${m.label}  ·  ${m.sub}`, { x, y: 3.45, w: 3.9, h: 0.38, fontSize: 12, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
    s.addShape(pptx.ShapeType.rect, { x, y: 3.89, w: 3.9, h: 0.85, fill: { color: WHITE }, line: { color: ICE, width: 1 } });
    s.addText(m.desc, { x: x + 0.1, y: 3.92, w: 3.7, h: 0.8, fontSize: 11, color: '#333333', fontFace: FONT, align: 'center' });
  });

  // Arrow to Claude
  s.addText('▼  Claude API calls (claude-sonnet-4-6)', { x: 4.3, y: 4.82, w: 4.5, h: 0.3, fontSize: 12, color: NAVY, fontFace: FONT, align: 'center', italic: true });

  // Layer 3 — Claude
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 5.18, w: 12.33, h: 0.52, fill: { color: TEAL } });
  s.addText('LAYER 3  —  ANTHROPIC CLAUDE API  ·  claude-sonnet-4-6  ·  JSON-only responses', { x: 0.6, y: 5.22, w: 12, h: 0.44, fontSize: 13, bold: true, color: WHITE, fontFace: FONT, align: 'center' });

  // Arrow back up
  s.addText('▼  JSON response → SimulationResults.jsx', { x: 4.3, y: 5.78, w: 4.5, h: 0.28, fontSize: 12, color: NAVY, fontFace: FONT, align: 'center', italic: true });

  s.addShape(pptx.ShapeType.rect, { x: 2.5, y: 6.15, w: 8.33, h: 0.45, fill: { color: GREEN } });
  s.addText('OUTPUT:  Rounds · Equilibrium · Recommendation · Risk Analysis · Sensitivity Sliders', { x: 2.55, y: 6.18, w: 8.2, h: 0.38, fontSize: 12, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
}

// ── SLIDE 7: TelcoX Setup ─────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, OFFWHITE);
  addAccentBar(s, TEAL);

  s.addText('Live Demo: TelcoX Considers a 10% Price Cut', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 30, bold: true, color: NAVY, fontFace: FONT
  });
  dividerLine(s, 0.95, TEAL);

  // Setup callout
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.08, w: 12.33, h: 0.55, fill: { color: NAVY } });
  s.addText('TelcoX is planning a 10% price reduction on its core plan. How will competitors react?', {
    x: 0.6, y: 1.12, w: 12, h: 0.45, fontSize: 14, bold: true, color: WHITE, fontFace: FONT, align: 'center'
  });

  const comps = [
    {
      name: 'ValueNet', type: 'Aggressive Challenger', color: '8B1A1A',
      scores: 'Financial: HIGH  ·  Aggression: HIGH  ·  Intent: HIGH',
      desc: 'Market share maximizer with strong cash reserves and aggressive leadership. Will out-discount TelcoX — likely escalating to a 15%+ counter-cut, even at the cost of short-term margin. High probability of triggering a full price war.'
    },
    {
      name: 'PremiumConnect', type: 'Premium Brand', color: '1E4D7B',
      scores: 'Financial: HIGH  ·  Aggression: LOW  ·  Intent: MEDIUM',
      desc: 'Brand and margin protector. Will hold its price but counter with streaming bundles and data add-ons to justify the premium. Focuses on retaining high-value customers through added value, not price competition.'
    },
    {
      name: 'RegionalPlus', type: 'Cost-Constrained Regional', color: TEAL,
      scores: 'Financial: LOW  ·  Aggression: MEDIUM  ·  Intent: MEDIUM',
      desc: 'Financially constrained — cannot sustain a price war. Will pivot to underserved rural segments and long-contract offers, sidestepping direct price competition rather than engaging head-to-head.'
    },
  ];

  comps.forEach((c, i) => {
    const x = 0.5 + i * 4.12;
    s.addShape(pptx.ShapeType.rect, { x, y: 1.72, w: 3.9, h: 0.8, fill: { color: c.color } });
    s.addText(c.name, { x, y: 1.76, w: 3.9, h: 0.42, fontSize: 17, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
    s.addText(c.type, { x, y: 2.18, w: 3.9, h: 0.3, fontSize: 11, color: ICE, fontFace: FONT, align: 'center', italic: true });
    s.addShape(pptx.ShapeType.rect, { x, y: 2.54, w: 3.9, h: 0.42, fill: { color: DARK } });
    s.addText(c.scores, { x: x + 0.05, y: 2.57, w: 3.8, h: 0.36, fontSize: 10, color: ICE, fontFace: FONT, align: 'center' });
    s.addShape(pptx.ShapeType.rect, { x, y: 2.98, w: 3.9, h: 3.2, fill: { color: WHITE }, line: { color: ICE, width: 1 } });
    s.addText(c.desc, { x: x + 0.12, y: 3.1, w: 3.65, h: 2.95, fontSize: 12, color: '#333333', fontFace: FONT, wrap: true, valign: 'top' });
  });
}

// ── SLIDE 8: Simulation Results ───────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, OFFWHITE);
  addAccentBar(s, TEAL);

  s.addText('The AI Reveals: Price Cut Triggers a Lose-Lose War', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 30, bold: true, color: NAVY, fontFace: FONT
  });
  dividerLine(s, 0.95, TEAL);

  const rounds = [
    {
      label: 'Round 1', color: NAVY,
      text: 'ValueNet signals a 15% counter-cut. PremiumConnect announces a streaming bundle. RegionalPlus flags a pivot to rural segments.'
    },
    {
      label: 'Round 2', color: '2C5F8A',
      text: 'PremiumConnect escalates bundle value having seen ValueNet move. RegionalPlus doubles down on niche. ValueNet holds aggressive posture.'
    },
    {
      label: 'Equilibrium', color: TEAL,
      text: 'No competitor shifted by more than 15 points. Equilibrium declared after Round 2. Orchestrator receives all round data.'
    },
  ];

  rounds.forEach((r, i) => {
    const x = 0.5 + i * 4.12;
    s.addShape(pptx.ShapeType.rect, { x, y: 1.08, w: 3.9, h: 0.45, fill: { color: r.color } });
    s.addText(r.label, { x, y: 1.1, w: 3.9, h: 0.4, fontSize: 14, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.55, w: 3.9, h: 2.0, fill: { color: WHITE }, line: { color: ICE, width: 1 } });
    s.addText(r.text, { x: x + 0.12, y: 1.65, w: 3.65, h: 1.75, fontSize: 12, color: '#333333', fontFace: FONT, wrap: true, valign: 'top' });
  });

  // Orchestrator result
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.72, w: 12.33, h: 0.42, fill: { color: NAVY } });
  s.addText('ORCHESTRATOR VERDICT', { x: 0.55, y: 3.74, w: 12.2, h: 0.36, fontSize: 13, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 4.16, w: 12.33, h: 1.5, fill: { color: WHITE }, line: { color: ICE, width: 1 } });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 4.16, w: 0.1, h: 1.5, fill: { color: TEAL } });
  s.addText('"A blanket 10% price cut initiates a margin-eroding price war driven by ValueNet, while PremiumConnect insulates itself through bundling and RegionalPlus finds safety in niche segmentation. Recommended alternative: a targeted bundle + segmentation strategy — delivers better subscriber gains with far less competitive blowback and materially better long-term profitability."',
    { x: 0.75, y: 4.24, w: 12, h: 1.3, fontSize: 12, color: '#222222', fontFace: FONT, italic: true, wrap: true });

  // Key insight
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 5.82, w: 12.33, h: 0.65, fill: { color: TEAL } });
  s.addText('This is the exact second-order insight the whitepaper predicts AI simulation will surface — and CompetitorSim delivered it in under 60 seconds.', {
    x: 0.6, y: 5.87, w: 12.1, h: 0.55, fontSize: 13, bold: true, color: WHITE, fontFace: FONT, align: 'center', wrap: true
  });
}

// ── SLIDE 9: Key Differentiators ──────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, NAVY);
  addAccentBar(s, TEAL);

  s.addText('What Makes This Approach Different', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 30, bold: true, color: WHITE, fontFace: FONT
  });
  dividerLine(s, 0.95, TEAL);

  const diffs = [
    {
      num: '01', color: TEAL,
      title: 'Deterministic + AI Hybrid',
      body: 'Scoring anchors AI behavior in real data — Financial Capacity, Aggression Index, Strategic Intent. LLM adds nuanced reasoning on top. Explainable, not a black box. Every decision is traceable to specific inputs.'
    },
    {
      num: '02', color: '4472C4',
      title: 'Equilibrium Detection',
      body: 'Simulation stops when competitive dynamics stabilize (no competitor shifts >15 points in magnitude or changes response type). Efficient and realistic — most price-move scenarios reach equilibrium in 2 rounds.'
    },
    {
      num: '03', color: '2C5F8A',
      title: 'Sensitivity Analysis',
      body: 'Four interactive sliders let strategists instantly re-run the simulation with modified assumptions: competitor financial strength, price cut magnitude, market growth rate, regulatory caps.'
    },
    {
      num: '04', color: '1A3D6B',
      title: 'Built for Speed',
      body: 'Full 3-competitor, 3-round simulation completes in under 60 seconds. ~7–10 Claude API calls. No workshops, no weeks of preparation. Repeatable as often as needed before a major decision.'
    },
  ];

  diffs.forEach((d, i) => {
    const x = 0.5 + (i % 2) * 6.25;
    const y = 1.1 + Math.floor(i / 2) * 2.8;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 6.0, h: 2.55, fill: { color: '1A2550' }, line: { color: d.color, width: 1 }, rectRadius: 0.06 });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.72, h: 2.55, fill: { color: d.color } });
    s.addText(d.num, { x, y: y + 0.8, w: 0.72, h: 0.6, fontSize: 22, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
    s.addText(d.title, { x: x + 0.85, y: y + 0.15, w: 5.0, h: 0.45, fontSize: 15, bold: true, color: WHITE, fontFace: FONT });
    s.addText(d.body, { x: x + 0.85, y: y + 0.65, w: 5.0, h: 1.75, fontSize: 12, color: ICE, fontFace: FONT, wrap: true });
  });
}

// ── SLIDE 10: Framework Validation ───────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, OFFWHITE);
  addAccentBar(s, NAVY);

  s.addText('CompetitorSim Validates Every Pillar of the Framework', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 28, bold: true, color: NAVY, fontFace: FONT
  });
  dividerLine(s, 0.95, NAVY);

  // Table header
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.08, w: 6.1, h: 0.45, fill: { color: NAVY } });
  s.addText('Whitepaper Predicts', { x: 0.5, y: 1.1, w: 6.1, h: 0.4, fontSize: 13, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
  s.addShape(pptx.ShapeType.rect, { x: 6.72, y: 1.08, w: 6.11, h: 0.45, fill: { color: TEAL } });
  s.addText('CompetitorSim Delivers', { x: 6.72, y: 1.1, w: 6.1, h: 0.4, fontSize: 13, bold: true, color: WHITE, fontFace: FONT, align: 'center' });

  const rows = [
    ['LLM agents role-play competitor reasoning', 'Claude agents receive scored profiles + context, reason in character for each rival'],
    ['Multi-round equilibrium simulation', '2–3 rounds with 15-point drift threshold — stops when dynamics stabilize'],
    ['Deterministic data anchors AI behavior', 'Financial Capacity, Aggression Index, Strategic Intent — scored before any AI call'],
    ['Orchestrator surfaces second-order insights', 'Dedicated orchestrator synthesizes all rounds into recommendation + risk analysis'],
    ['Sensitivity analysis for what-if exploration', 'Interactive sliders re-run simulation instantly with modified parameters'],
  ];

  rows.forEach(([left, right], i) => {
    const y = 1.58 + i * 1.0;
    const fill = i % 2 === 0 ? 'EBF3FB' : WHITE;
    s.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 6.1, h: 0.9, fill: { color: fill }, line: { color: ICE, width: 1 } });
    s.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 0.08, h: 0.9, fill: { color: NAVY } });
    s.addText(left, { x: 0.7, y: y + 0.1, w: 5.7, h: 0.7, fontSize: 12, color: '#222222', fontFace: FONT, wrap: true });
    s.addShape(pptx.ShapeType.rect, { x: 6.72, y, w: 6.11, h: 0.9, fill: { color: fill }, line: { color: ICE, width: 1 } });
    s.addShape(pptx.ShapeType.rect, { x: 6.72, y, w: 0.08, h: 0.9, fill: { color: TEAL } });
    s.addText(right, { x: 6.92, y: y + 0.1, w: 5.7, h: 0.7, fontSize: 12, color: '#222222', fontFace: FONT, wrap: true });
    // checkmark
    s.addText('✓', { x: 6.4, y: y + 0.2, w: 0.35, h: 0.45, fontSize: 18, bold: true, color: GREEN, fontFace: FONT, align: 'center' });
  });
}

// ── SLIDE 11: Industries ──────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, NAVY);
  addAccentBar(s, TEAL);

  s.addText('From Prototype to Strategic Capability', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 30, bold: true, color: WHITE, fontFace: FONT
  });
  s.addText('Industries where AI competitive simulation delivers highest value', {
    x: 0.5, y: 0.93, w: 12.3, h: 0.35, fontSize: 14, color: ICE, fontFace: FONT, italic: true
  });
  dividerLine(s, 1.3, TEAL);

  const industries = [
    { name: 'Telecom', color: '2C5F8A', detail: 'Pricing, bundling, 5G rollout reactions — prices fell 6% from 2020–2024 despite rising costs. A simulation can model how rivals retaliate to new unlimited plans or home broadband moves.' },
    { name: 'Retail', color: TEAL, detail: 'Seasonal promos, dynamic pricing, loyalty programs. Amazon adjusts 250M+ prices/day. AI agents can predict how a Walmart responds to an Amazon Prime Day.' },
    { name: 'Banking', color: '1E3A6E', detail: 'Interest rate moves, deposit wars, credit card offers. Banks in 2023 found themselves in a deposit pricing war — an AI simulation would have predicted who moves first.' },
    { name: 'Automotive', color: '1A5276', detail: 'EV pricing, dealer incentives, feature launches. Tesla\'s 2023 price cuts forced Ford to slash prices and GM to delay launches — a predictable cascade AI simulation would have surfaced.' },
    { name: 'Technology', color: '145A5A', detail: 'Cloud pricing, SaaS licensing, feature roadmaps. Microsoft, Google, and Amazon all rushed to integrate AI within months of each other in 2023 — winner-takes-all dynamics demand foresight.' },
  ];

  industries.forEach((ind, i) => {
    const x = 0.5 + (i % 3) * 4.12;
    const y = i < 3 ? 1.45 : 4.0;
    s.addShape(pptx.ShapeType.rect, { x, y, w: 3.9, h: 0.45, fill: { color: ind.color } });
    s.addText(ind.name, { x, y: y + 0.04, w: 3.9, h: 0.36, fontSize: 14, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
    s.addShape(pptx.ShapeType.rect, { x, y: y + 0.47, w: 3.9, h: 2.0, fill: { color: '1A2550' }, line: { color: ind.color, width: 1 } });
    s.addText(ind.detail, { x: x + 0.1, y: y + 0.58, w: 3.7, h: 1.8, fontSize: 11, color: ICE, fontFace: FONT, wrap: true });
  });

  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 6.85, w: 12.33, h: 0.42, fill: { color: TEAL } });
  s.addText('Companies that run AI simulations before major strategic moves will outmaneuver those that don\'t.', {
    x: 0.6, y: 6.88, w: 12.1, h: 0.36, fontSize: 13, bold: true, color: WHITE, fontFace: FONT, align: 'center'
  });
}

// ── SLIDE 12: Next Steps ──────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBg(s, NAVY);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: '100%', fill: { color: TEAL } });

  s.addText('The Path Forward', {
    x: 0.5, y: 0.28, w: 12.3, h: 0.65, fontSize: 34, bold: true, color: WHITE, fontFace: FONT
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.96, w: 12.33, h: 0.05, fill: { color: TEAL } });

  const steps = [
    {
      n: '1', color: TEAL,
      title: 'Validate with a Real Strategic Decision',
      body: 'Pick one high-stakes move coming up. Run CompetitorSim against it. Compare AI predictions to what actually happens in the market over the following weeks. One accurate call builds the confidence to scale.'
    },
    {
      n: '2', color: BLUE,
      title: 'Expand the Competitor Data Model',
      body: 'Enrich with live signals — earnings call transcripts, patent filings, news feeds. Richer inputs produce more accurate behavioral profiles and more reliable simulations.'
    },
    {
      n: '3', color: '2C5F8A',
      title: 'Integrate into Quarterly Strategy Reviews',
      body: 'Make competitive simulation a continuous capability, not a one-off experiment. Before each planning session, run a fresh set of simulations for key initiatives. Those who build this muscle early will outmaneuver others through faster adaptation.'
    },
  ];

  steps.forEach((st, i) => {
    const y = 1.15 + i * 1.85;
    s.addShape(pptx.ShapeType.roundRect, { x: 0.5, y, w: 12.33, h: 1.65, fill: { color: '1A2550' }, line: { color: st.color, width: 1 }, rectRadius: 0.06 });
    s.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 0.85, h: 1.65, fill: { color: st.color } });
    s.addText(st.n, { x: 0.5, y: y + 0.45, w: 0.85, h: 0.7, fontSize: 28, bold: true, color: WHITE, fontFace: FONT, align: 'center' });
    s.addText(st.title, { x: 1.5, y: y + 0.12, w: 11.1, h: 0.45, fontSize: 15, bold: true, color: WHITE, fontFace: FONT });
    s.addText(st.body, { x: 1.5, y: y + 0.62, w: 11.1, h: 0.9, fontSize: 12, color: ICE, fontFace: FONT, wrap: true });
  });

  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 6.8, w: 12.33, h: 0.45, fill: { color: TEAL } });
  s.addText('CompetitorSim  ·  Built on Anthropic Claude  ·  Full whitepaper available on request  ·  May 2025', {
    x: 0.6, y: 6.83, w: 12.1, h: 0.38, fontSize: 12, color: WHITE, fontFace: FONT, align: 'center'
  });
}

// ── Save ──────────────────────────────────────────────────────────────────────
const OUT = '/Users/vatsalpatni/Documents/Claude_Projects/competitor-sim/docs/CompetitorSim_Executive_Deck.pptx';
pptx.writeFile({ fileName: OUT })
  .then(() => console.log('Written:', OUT))
  .catch(e => { console.error(e); process.exit(1); });
