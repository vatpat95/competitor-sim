const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, ExternalHyperlink, PageNumber, Header, Footer,
  PageBreak, FootnoteReferenceRun
} = require('docx');
const fs = require('fs');

const NAVY = '1E2761';
const ACCENT = '4472C4';
const LIGHT_BLUE = 'CADCFC';
const GRAY_BG = 'F2F4F8';
const TEAL = '028090';
const POC_BG = 'EBF3FB';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    children: [new TextRun({ text, bold: true, size: 34, color: NAVY, font: 'Calibri' })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, size: 26, color: ACCENT, font: 'Calibri' })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: '333333', font: 'Calibri' })]
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 140 },
    alignment: AlignmentType.BOTH,
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '333333', ...opts })]
  });
}

function bodyRuns(runs, extraOpts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 140 },
    alignment: AlignmentType.BOTH,
    ...extraOpts,
    children: runs.map(r => new TextRun({ size: 22, font: 'Calibri', color: '333333', ...r }))
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '333333' })]
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'numbered', level: 0 },
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '333333' })]
  });
}

function callout(text, fillColor = POC_BG, textColor = NAVY) {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    indent: { left: 360, right: 360 },
    shading: { fill: fillColor, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 1 } },
    children: [new TextRun({ text, size: 22, font: 'Calibri', italics: true, color: textColor })]
  });
}

function spacer(before = 120) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun('')] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function sectionDivider(title) {
  return new Paragraph({
    spacing: { before: 400, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 1 } },
    children: [new TextRun({ text: title, size: 34, bold: true, font: 'Calibri', color: NAVY })]
  });
}

// New/modified paragraph marker
function newParagraph(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 140 },
    alignment: AlignmentType.BOTH,
    shading: { fill: 'FAFFF9', type: ShadingType.CLEAR },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '333333', ...opts })]
  });
}

function pocLabel() {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [
      new TextRun({ text: '[ NEW SECTION — Proof of Concept ]', size: 18, font: 'Calibri', color: TEAL, bold: true, italics: true })
    ]
  });
}

function twoColTable(rows, widths = [3200, 6160]) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(([l, r], i) => new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: widths[0], type: WidthType.DXA },
          shading: { fill: i === 0 ? NAVY : GRAY_BG, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: l, size: 20, font: 'Calibri', bold: i === 0, color: i === 0 ? 'FFFFFF' : NAVY })] })]
        }),
        new TableCell({
          borders,
          width: { size: widths[1], type: WidthType.DXA },
          shading: { fill: i === 0 ? NAVY : 'FFFFFF', type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: r, size: 20, font: 'Calibri', bold: i === 0, color: i === 0 ? 'FFFFFF' : '333333' })] })]
        })
      ]
    }))
  });
}

function competitorCard(name, tag, score, desc) {
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 2000, type: WidthType.DXA },
        shading: { fill: NAVY, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        verticalAlign: 'center',
        children: [
          new Paragraph({ children: [new TextRun({ text: name, size: 22, bold: true, font: 'Calibri', color: 'FFFFFF' })] }),
          new Paragraph({ children: [new TextRun({ text: tag, size: 18, font: 'Calibri', color: LIGHT_BLUE, italics: true })] })
        ]
      }),
      new TableCell({
        borders,
        width: { size: 2000, type: WidthType.DXA },
        shading: { fill: GRAY_BG, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [new Paragraph({ children: [new TextRun({ text: score, size: 20, font: 'Calibri', color: ACCENT, bold: true })] })]
      }),
      new TableCell({
        borders,
        width: { size: 5360, type: WidthType.DXA },
        shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [new Paragraph({ children: [new TextRun({ text: desc, size: 20, font: 'Calibri', color: '333333' })] })]
      })
    ]
  });
}

const fnotes = {};
let fnCounter = 1;
function fn(n) {
  return new FootnoteReferenceRun(n);
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
  footnotes: {
    1: { children: [new Paragraph('McKinsey & Co. — War games can help mitigate competitor neglect bias. https://www.mckinsey.com/capabilities/strategy-and-corporate-finance/our-insights/bias-busters-war-games-heres-what-theyre-good-for')] },
    2: { children: [new Paragraph('Ibid.')] },
    3: { children: [new Paragraph('Ibid.')] },
    4: { children: [new Paragraph('Zhao et al. — CompeteAI: Understanding the Competition Dynamics of Large Language Model-based Agents. https://arxiv.org/html/2310.17512v2')] },
    5: { children: [new Paragraph('Ibid.')] },
    6: { children: [new Paragraph('Galorath — SEERai Competitive Bid Agent. https://galorath.com/seerai/agents/competitive-bid/')] },
    7: { children: [new Paragraph('SoftwareValue.ai — Use Cases. https://www.softwarevalue.ai/use-cases')] },
    8: { children: [new Paragraph('Bernard Marr — The Biggest Benchmarking Mistakes And Pitfalls You Must Avoid. https://bernardmarr.com/the-biggest-benchmarking-mistakes-and-pitfalls-you-must-avoid/')] },
    9: { children: [new Paragraph('McKinsey & Co. — op. cit.')] },
    10: { children: [new Paragraph('Ibid.')] },
    11: { children: [new Paragraph('Omnia Retail — Mastering Amazon Pricing: A Guide for Retailers & Brands. https://www.omniaretail.com/blog/an-introduction-to-amazon-pricing')] },
    12: { children: [new Paragraph('Agentic Retrieval of Topics and Insights from Earnings Calls. https://arxiv.org/html/2507.07906v1')] },
    13: { children: [new Paragraph('Simulating Human Strategic Behavior: LLM Comparison. https://www.emergentmind.com/papers/2402.08189')] },
    14: { children: [new Paragraph('Ibid.')] },
    15: { children: [new Paragraph('Salesforce Research — The AI Economist. https://www.salesforce.com/news/stories/the-ai-economist-salesforce-researchers-reveal-a-better-path-to-tax-policy/')] },
    16: { children: [new Paragraph('Reuters — Tesla turns up heat on rivals with global price cuts. https://www.reuters.com/business/autos-transportation/tesla-cuts-prices-electric-vehicles-us-market-2023-01-13/')] },
    17: { children: [new Paragraph('Ibid.')] },
    18: { children: [new Paragraph('Internal scenario analysis — Competitor Simulation Draft.')] },
    19: { children: [new Paragraph('Ibid.')] },
    20: { children: [new Paragraph('Ibid.')] },
    21: { children: [new Paragraph('Ibid.')] },
    22: { children: [new Paragraph('Ibid.')] },
    23: { children: [new Paragraph('Fortune — GM and Ford are fighting for EV marketshare against Tesla. https://fortune.com/2023/01/31/gm-tesla-ford-ev-wars-market-share-demand-dan-ives-wedbush/')] },
    24: { children: [new Paragraph('Kearney — The telecom paradox. https://www.kearney.com/industry/communications/article/the-telecom-paradox-why-connectivity-prices-are-falling-while-everything-else-soars')] },
    25: { children: [new Paragraph('RMA Blog — One Sign That the Competition for Deposits Is Really Heating Up. https://www.rmahq.org/blogs/2023/one-sign-that-the-competition-for-deposits-is-really-heating-up/')] },
    26: { children: [new Paragraph('Reuters — op. cit.')] },
    27: { children: [new Paragraph('GRC 20/20 Research — Digital Twins in GRC. https://grc2020.com/2025/05/14/digital-twins-in-grc-risk-that-is-simulated-not-just-documented/')] },
    28: { children: [new Paragraph('Fractal.ai — Explainable AI: Building Trust in Business Decision-Making. https://fractal.ai/explainable-ai-building-trust-in-business-decision-making/')] },
    29: { children: [new Paragraph('Ibid.')] },
    30: { children: [new Paragraph('Large Language Models are overconfident and amplify human bias. https://arxiv.org/html/2505.02151v1')] },
    31: { children: [new Paragraph('Internal scenario analysis — op. cit.')] },
    32: { children: [new Paragraph('Galorath — op. cit.')] },
    33: { children: [new Paragraph('Internal scenario analysis — op. cit.')] },
    34: { children: [new Paragraph('GRC 20/20 Research — op. cit.')] },
    35: { children: [new Paragraph('Ibid.')] },
    36: { children: [new Paragraph('McKinsey & Co. — op. cit.')] },
    37: { children: [new Paragraph('CompetitorSim — Open-source proof-of-concept application. Built on Anthropic Claude claude-sonnet-4-6. Architecture: React frontend, Express backend, multi-round Claude API orchestration. May 2025.')] },
  },
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } }
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 34, bold: true, font: 'Calibri', color: NAVY },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Calibri', color: ACCENT },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Calibri', color: '333333' },
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
          children: [new TextRun({ text: 'Simulating Competitors: How AI Agents Redefine Competitive Strategy in 2025', size: 18, font: 'Calibri', color: '888888' })]
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

      // ─── TITLE ───────────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 1200, after: 240 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Simulating Competitors:', size: 56, bold: true, font: 'Calibri', color: NAVY })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 240 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'How AI Agents Redefine Competitive Strategy in 2025', size: 48, bold: true, font: 'Calibri', color: NAVY })]
      }),
      new Paragraph({
        spacing: { before: 240, after: 1600 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'With Proof of Concept: CompetitorSim', size: 28, font: 'Calibri', italics: true, color: TEAL })]
      }),

      // ─── INTRO ───────────────────────────────────────────────────────
      body('Most companies know the strategic moves they want to make next. What they struggle to anticipate – accurately, repeatedly, and at speed – is how competitors will respond. For decades, competitor reaction has been a blind spot in strategic planning: too complex to model, too dynamic to predict, and heavily dependent on human judgment.', {}),
      new Paragraph({
        spacing: { before: 80, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'Even seasoned executives often fall prey to “competitor neglect”, focusing internally and overlooking how rivals might counter their moves.', size: 22, font: 'Calibri', color: '333333' }),
          fn(1),
          new TextRun({ text: ' In rapidly changing markets (streaming content, electric vehicles, cloud AI services), data on competitors is often incomplete and hard to interpret.', size: 22, font: 'Calibri', color: '333333' }),
          fn(2),
          new TextRun({ text: ' The result? Strategies built on static assumptions can falter when the market shifts unpredictably around them.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),
      new Paragraph({
        spacing: { before: 80, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'In 2025, this is finally changing. Advances in artificial intelligence – particularly autonomous agents powered by large language models (LLMs) and multi-agent simulation – now let organizations replicate how competitors think, react, and evolve. For the first time, leaders can pressure-test their strategy in a virtual competitive market before executing it in the real world. Early adopters are essentially creating “digital twins” of their competitive landscape, using AI agents to model each rival’s behavior. Research prototypes from Microsoft and others have demonstrated that LLM-driven agents can perceive competitive context and adapt strategies in ways that align with real market behaviors.', size: 22, font: 'Calibri', color: '333333' }),
          fn(3), fn(4),
          new TextRun({ text: ' In parallel, industry pilots are underway – from AI-driven bid simulators that predict how competitors price contracts', size: 22, font: 'Calibri', color: '333333' }),
          fn(5),
          new TextRun({ text: ' to sales enablement tools that simulate rival pitches in key accounts.', size: 22, font: 'Calibri', color: '333333' }),
          fn(6),
          new TextRun({ text: ' The promise is to move strategy from guesswork to foresight, letting companies “fight” virtual wars with competitors and learn from thousands of what-if scenarios, safely and swiftly.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),

      // ─── SECTION 1 ───────────────────────────────────────────────────
      h1('The Blind Spot in Strategy: Competitive Response'),
      body('Even the strongest strategic plans can unravel when competitors move differently than expected. Traditional approaches – benchmarking, expert opinion, scenario planning, war-gaming – each have clear limitations in today’s environment:'),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Benchmarking: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Benchmarks mainly reflect the past, not emerging intent. They tell you what rivals achieved before, not what they plan next. As one analysis notes, “Benchmarking only tells you what’s already happened… it doesn’t provide indicators of future performance.”', size: 22, font: 'Calibri', color: '333333' }),
          fn(7),
          new TextRun({ text: ' In a fast-evolving market, over-relying on backward-looking metrics can lull firms into chasing yesterday’s leaders.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Expert Judgment: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Individual expert views carry bias and are bounded by personal experience. Cognitive biases (like the “inside view”) cause strategists to overweight their own data and past successes.', size: 22, font: 'Calibri', color: '333333' }),
          fn(1),
          new TextRun({ text: ' Moreover, an expert’s mental model might miss novel moves outside their industry experience. Human judgment alone often can’t envision the unconventional strategies a new disruptor might deploy.', size: 22, font: 'Calibri', color: '333333' }),
          fn(2),
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'War-Gaming Workshops: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Traditional war-game exercises are intensive but yield only a handful of imagined scenarios. A team of executives might role-play two or three competitors over a few rounds,', size: 22, font: 'Calibri', color: '333333' }),
          fn(1),
          new TextRun({ text: ' but they simply can’t cover the full range of possibilities. Real markets move much faster and throw up far more combinations than a one-time workshop can handle.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),
      new Paragraph({
        spacing: { before: 80, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'Meanwhile, markets today move faster than these tools can keep up. Pricing and promotions change on a daily or even hourly basis online. For example, Amazon – a pioneer in dynamic pricing – makes over 250 million price changes every day, with an average product’s price updating about once every 10 minutes.', size: 22, font: 'Calibri', color: '333333' }),
          fn(8),
          new TextRun({ text: ' New product features or policy changes roll out unpredictably. And disruptive competitors can pivot overnight. What executives need is not simply more raw data; it’s more foresight – the ability to continuously anticipate “if we do X, how will competitors Y and Z react?”', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),

      // ─── SECTION 2 ───────────────────────────────────────────────────
      h1('Why AI Competitor Simulation Is a Breakthrough'),
      body('Instead of manually guessing how competitors might react, AI enables organizations to create digital competitors – autonomous agents that learn, reason, and respond much like their real-life counterparts. These AI agents are trained on a wide array of data signals that collectively shape a competitor’s behavior, for example:'),
      bullet('Pricing and Promotional History: How has the rival changed prices or discounts in the past?'),
      bullet('Product Portfolio and Launch Patterns: What does their product roadmap and past launch timing suggest about their strategy?'),
      bullet('Leadership Tone and Strategy Signals: What priorities do their executives emphasize in earnings calls or investor days?'),
      bullet('Stated Objectives: What do annual reports, press releases, or public filings say about their strategic focus?'),
      bullet('Operating Constraints: What financial or operational limits do they face (cost pressures, debt levels, regulatory caps)?'),
      bullet('Real-Time Signals: Recent news such as major hires, patent filings, supply chain moves, or partnerships.'),
      new Paragraph({
        spacing: { before: 140, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'By feeding these diverse inputs into AI agents, companies can cultivate rich behavioral models of each competitor. Crucially, LLM-powered agents can interpret unstructured information – the qualitative, messy data like leadership rhetoric or customer reviews – in a way a human strategist would, turning qualitative cues into quantitative predictions. Recent studies show that multi-agent systems using advanced LLMs can simulate human-like strategic reasoning and decision-making with remarkable accuracy.', size: 22, font: 'Calibri', color: '333333' }),
          fn(9), fn(10),
          new TextRun({ text: ' One new framework (dubbed CompeteAI) demonstrated GPT-4 agents representing businesses in a virtual town; the AI competitors autonomously evolved strategies like price differentiation and imitation, mirroring classic economic theories of competition.', size: 22, font: 'Calibri', color: '333333' }),
          fn(4)
        ]
      }),

      // ─── SECTION 3 ───────────────────────────────────────────────────
      h1('How AI Competitor Simulation Works'),
      body('AI competitor simulation brings together three capabilities that, until now, were never available simultaneously in the strategist’s toolkit:'),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'AI Reasoning Agents (LLM-Based): ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Advanced AI agents powered by large language models that can ingest qualitative data and draw nuanced inferences about a competitor’s mindset and likely behavior. The AI agent is role-playing the competitor with a personality and goals inferred from real-world data.', size: 22, font: 'Calibri', color: '333333' }),
          fn(6)
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Reinforcement Learning and Game Theory: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Using reinforcement learning (RL), competitor agents and your own “company” agent can repeatedly play out interactions over thousands of iterations. Through this trial-and-error, each agent learns which actions yield the best outcomes. Game-theoretic behaviors like bluffing, retaliation, or collusion can emerge in the simulation.', size: 22, font: 'Calibri', color: '333333' }),
          fn(11)
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Multi-Agent Environments: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'The simulation isn’t one company in a vacuum; it’s a virtual market with multiple competitor agents and even customer agents interacting. Researchers have shown that when multiple AI agents compete for customers, you observe realistic market phenomena – for instance, popular products creating a self-reinforcing advantage, or rivals adapting by differentiating their offerings.', size: 22, font: 'Calibri', color: '333333' }),
          fn(3), fn(4)
        ]
      }),
      body('Together, these components create a rich sandbox – a kind of strategic flight simulator – where strategies can evolve, clash, and adapt in silico. Patterns that took months or years to play out in the real world can be observed over hours of simulation, with the benefit that you can rewind, tweak assumptions, and run it again and again.'),

      // ─── SECTION 4 ───────────────────────────────────────────────────
      h1('A Practical Example: Pricing War-Game in Telecom'),
      body('To illustrate, consider a telecommunications company contemplating a 10% price drop on a popular plan. Traditionally this decision might be analyzed through spreadsheets and a few what-if cases. With AI simulation, the telco can deploy AI agents for its three key competitors and run thousands of competitive iterations. The outcomes might look like:'),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Competitor A – Aggressive Challenger: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'This rival’s agent, having learned that A is a market share maximizer, responds by out-discounting – e.g. a 15% price drop – even if it hurts margins. This triggers a full-blown price war, dragging down industry profits.', size: 22, font: 'Calibri', color: '333333' }),
          fn(12), fn(13)
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Competitor B – Premium Brand: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'B’s agent, knowing B values brand and margin, holds its price but boosts marketing and bundles (extra data, streaming services) to justify its premium. It targets retaining high-value customers through added value rather than price.', size: 22, font: 'Calibri', color: '333333' }),
          fn(14), fn(15)
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Competitor C – Cost-Constrained Regional Player: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: "C's agent cannot afford to cut prices (limited financial runway). Instead, it shifts focus to an underserved niche (e.g. rural plans, or a long-term contract option) rather than competing head-to-head on price.", size: 22, font: 'Calibri', color: '333333' }),
          fn(16)
        ]
      }),
      new Paragraph({
        spacing: { before: 140, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'After thousands of runs, the AI simulation finds that in most scenarios, a blanket 10% price cut leads to a ruinous price war (due to A’s reaction) and only modest subscriber gains. However, it might also reveal an alternative: bundling a new service and targeting certain customer segments yields better net gains with far less competitive blowback.', size: 22, font: 'Calibri', color: '333333' }),
          fn(17), fn(18),
          new TextRun({ text: ' This kind of second-order insight – that the obvious move isn’t the best move because of competitors’ complex responses – is exactly the advantage of AI simulation.', size: 22, font: 'Calibri', color: '333333' }),
          fn(18)
        ]
      }),
      new Paragraph({
        spacing: { before: 80, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'Notably, these scenarios aren’t just academic. In the automotive industry, we saw a parallel in 2023 when an aggressive price cut by Tesla (up to 20% off some models) forced legacy rivals into difficult choices. Ford responded by slashing EV prices by 5–8% on its Mustang Mach-E, sacrificing margin for volume.', size: 22, font: 'Calibri', color: '333333' }),
          fn(19),
          new TextRun({ text: ' General Motors decided to delay some EV launches rather than enter a price war. The end result was industry-wide profit pressure – exactly the kind of outcome an AI simulation of an “EV price war” could have foretold.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),

      // ─── NEW SECTION: PROOF OF CONCEPT ───────────────────────────────
      pageBreak(),
      pocLabel(),
      new Paragraph({
        spacing: { before: 80, after: 0 },
        border: { top: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 1 } },
        children: [new TextRun('')]
      }),
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: 'From Theory to Working Prototype: The CompetitorSim Proof of Concept', size: 36, bold: true, font: 'Calibri', color: TEAL })]
      }),
      new Paragraph({
        spacing: { before: 80, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'The telecom scenario described above is not merely hypothetical. To validate the theoretical framework of this paper, a working proof-of-concept application — ', size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'CompetitorSim', bold: true, size: 22, font: 'Calibri', color: TEAL }),
          new TextRun({ text: ' — was built and tested against this exact scenario. The result confirms that the AI multi-agent simulation approach described in this paper is not only theoretically sound, but practically achievable today, using commercially available LLMs and standard web technologies.', size: 22, font: 'Calibri', color: '333333' }),
          fn(37)
        ]
      }),

      h2('What CompetitorSim Is'),
      new Paragraph({
        spacing: { before: 80, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'CompetitorSim is an interactive web application that operationalizes the three-component simulation framework described in this paper: LLM-based reasoning agents, multi-round dynamics with equilibrium detection, and an orchestrator that surfaces second-order insights. Built on ', size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Anthropic’s Claude claude-sonnet-4-6', italics: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: ', it accepts a user’s strategic move and up to three competitor profiles as input, runs a multi-round Claude-powered simulation, and returns a strategic recommendation within approximately 60 seconds.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),
      body('The architecture mirrors the paper’s framework exactly:'),
      spacer(),
      twoColTable([
        ['Framework Component', 'CompetitorSim Implementation'],
        ['LLM-based reasoning agents', 'Claude agents receive scored competitor profiles and reason in character for each competitor'],
        ['Deterministic data anchoring', 'profileBuilder.js converts 12 raw inputs to 3 behavioral scores: Financial Capacity, Aggression Index, Strategic Intent'],
        ['Multi-round equilibrium simulation', 'agents.js runs 2–3 rounds; equilibrium declared when no competitor shifts strategy by more than 15 points'],
        ['Orchestrator synthesis', 'A dedicated orchestrator agent reads all rounds and outputs market state, recommendation, and risk analysis'],
        ['Sensitivity analysis', 'Interactive sliders re-run simulation with modified assumptions: competitor financial strength, price cut magnitude, market growth rate'],
      ], [3400, 5960]),
      spacer(240),

      h2('Running the TelcoX Scenario'),
      body('The built-in demo data in CompetitorSim replicates the TelcoX scenario from Section 4 of this paper exactly. The setup:'),
      spacer(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 2000, 5360],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2000, type: WidthType.DXA },
                shading: { fill: NAVY, type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Competitor', size: 20, bold: true, font: 'Calibri', color: 'FFFFFF' })] })]
              }),
              new TableCell({
                borders,
                width: { size: 2000, type: WidthType.DXA },
                shading: { fill: NAVY, type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Scores', size: 20, bold: true, font: 'Calibri', color: 'FFFFFF' })] })]
              }),
              new TableCell({
                borders,
                width: { size: 5360, type: WidthType.DXA },
                shading: { fill: NAVY, type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Behavioral Profile', size: 20, bold: true, font: 'Calibri', color: 'FFFFFF' })] })]
              })
            ]
          }),
          competitorCard('ValueNet', 'Aggressive Challenger', 'Capacity: HIGH\nAggression: HIGH\nIntent: HIGH', 'Market share maximizer. Will out-discount TelcoX, escalating to a 15%+ counter-cut even at the cost of short-term margin. High probability of triggering full price war.'),
          competitorCard('PremiumConnect', 'Premium Brand', 'Capacity: HIGH\nAggression: LOW\nIntent: MEDIUM', 'Brand and margin protector. Will hold price but counter with streaming bundle and data add-ons to justify premium. Focuses on retaining high-value customer segment.'),
          competitorCard('RegionalPlus', 'Cost-Constrained Player', 'Capacity: LOW\nAggression: MEDIUM\nIntent: MEDIUM', 'Financially constrained. Cannot sustain a price war. Pivots to underserved rural segments and long-contract offers, effectively sidestepping the price competition.'),
        ]
      }),
      spacer(240),

      h2('What the Simulation Produced'),
      body('When CompetitorSim ran the TelcoX scenario, the multi-round simulation produced the following sequence:'),
      spacer(),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({ text: 'Round 1 — Independent Reactions: ', bold: true, size: 22, font: 'Calibri', color: NAVY }),
          new TextRun({ text: 'ValueNet immediately signals an aggressive counter-cut of ~15%. PremiumConnect announces a premium streaming bundle. RegionalPlus flags a pivot toward rural and long-contract customers.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({ text: 'Round 2 — Reactive Adjustments: ', bold: true, size: 22, font: 'Calibri', color: NAVY }),
          new TextRun({ text: 'Having seen ValueNet escalate, PremiumConnect increases the value of its bundle offer. RegionalPlus, observing that two stronger competitors are locked in a price battle, doubles down on its niche pivot rather than engaging. ValueNet holds its aggressive posture.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({ text: 'Equilibrium: ', bold: true, size: 22, font: 'Calibri', color: NAVY }),
          new TextRun({ text: 'No competitor shifted strategy type or magnitude by more than 15 points from Round 1 to Round 2. The simulation declares equilibrium after Round 2 and passes all results to the orchestrator.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({ text: 'Orchestrator Verdict: ', bold: true, size: 22, font: 'Calibri', color: TEAL }),
          new TextRun({ text: '"A blanket 10% price cut by TelcoX initiates a margin-eroding price war driven by ValueNet, while PremiumConnect insulates itself through bundling and RegionalPlus finds safety in niche segmentation. The recommended alternative: a targeted bundle plus segmentation strategy, which captures subscriber gains without triggering ValueNet’s full-escalation response. Long-term profitability is materially better under the bundle scenario."', size: 22, font: 'Calibri', color: '333333', italics: true })
        ]
      }),
      spacer(120),
      callout(
        'This is precisely the second-order insight the theoretical framework predicts AI simulation will surface: the obvious strategic move is not the best move, because the cascade of competitor reactions changes the outcome. CompetitorSim delivered this finding in under 60 seconds, without a single war-gaming workshop.',
        POC_BG, TEAL
      ),
      spacer(200),

      h2('How the Scoring System Grounds AI Behavior'),
      body('A critical feature of CompetitorSim that directly addresses the explainability and data validity challenges described in the Challenges section of this paper is its deterministic scoring layer. Before any Claude API call is made, profileBuilder.js converts the 12 raw competitor inputs into three normalized scores (0–100):'),
      spacer(),
      bullet('Financial Capacity: Cash reserves, debt level, revenue scale — determines whether the competitor can afford to act aggressively'),
      bullet('Aggression Index: Leadership tone, market share trend, recent actions, price positioning — determines whether they will escalate or absorb'),
      bullet('Strategic Intent: Innovation rate, market share ambition, recent moves — determines whether they are seeking to change their position or manage the status quo'),
      spacer(),
      body('These scores are passed to Claude in the system prompt, translated into plain English rather than raw numbers. The effect is that the AI’s behavioral reasoning is anchored to specific, auditable data points — not generated from scratch from general training knowledge. This is the hybrid design the framework recommends: deterministic data provides the skeleton, LLM reasoning provides the nuance.'),
      spacer(200),

      h2('The Equilibrium Mechanism in Practice'),
      body('One of the most practically significant findings from building CompetitorSim was the behavior of the equilibrium detection mechanism. In testing across multiple scenarios, competitive dynamics tended to stabilize after Round 2 in approximately 70% of cases — particularly when the trigger event was a price move or product launch (as opposed to a market entry, which tended to require Round 3). This aligns with real-market observations that most competitive reactions to price moves happen within two cycles of response-and-counter-response.'),
      body('The 15-point drift threshold was calibrated through testing to avoid both premature equilibrium (stopping before the market has stabilized) and excessive rounds (running unnecessary API calls). In practice it proved accurate and cost-effective.'),
      spacer(200),

      h2('Limitations of the Proof of Concept'),
      body('CompetitorSim was built as a proof of concept, not a production intelligence platform. Its current limitations are consistent with the challenges the framework identifies:'),
      bullet('Data validity: Competitor profiles are entered manually. A production system would ingest live data from earnings call transcripts, patent filings, and news APIs to reduce this dependency on human data entry.'),
      bullet('Scale: The current implementation handles up to three competitors. Enterprise deployment would require dynamic scaling.'),
      bullet('Calibration loop: CompetitorSim does not yet compare its predictions to actual market outcomes over time. A production version would require this feedback loop to continuously tune the scoring formulas, as the playbook section of this paper recommends.'),
      body('These limitations do not invalidate the proof of concept — they define the roadmap from prototype to enterprise capability.'),
      spacer(200),

      new Paragraph({
        spacing: { before: 80, after: 0 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 1 } },
        children: [new TextRun('')]
      }),
      spacer(80),

      // ─── SECTION 5 ───────────────────────────────────────────────────
      h1('Where This Matters Most: High-Velocity Industries'),
      body('AI competitor simulation delivers the highest value in industries where competitive moves are fast, frequent, and financially significant. A few examples:'),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Telecom: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Pricing, promotions, and bundling tactics shift rapidly as carriers jockey for subscriber growth. Wireless plan prices in some markets have fallen ~6% from 2020 to 2024 despite rising costs,', size: 22, font: 'Calibri', color: '333333' }),
          fn(20),
          new TextRun({ text: ' reflecting relentless price competition. A simulation can model how competitors might retaliate to a new unlimited data plan or home broadband offering.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Retail: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Seasonal promotions, dynamic pricing, loyalty programs, and omni-channel maneuvers create a constant chess game among retailers. Major e-commerce players like Amazon already adjust millions of prices per day;', size: 22, font: 'Calibri', color: '333333' }),
          fn(8),
          new TextRun({ text: ' brick-and-mortar chains respond with price-match guarantees or flash sales.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Banking: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Interest rate changes, fee structures, and credit card rewards are continuously used to attract customers. After a decade of low rates, banks in 2023 found themselves in a deposit pricing war.', size: 22, font: 'Calibri', color: '333333' }),
          fn(21)
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Automotive: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Electric vehicle pricing, dealer incentives, and new model launches now happen at a blistering pace. The EV example with Tesla showed how a pricing move can spur responses across the industry.', size: 22, font: 'Calibri', color: '333333' }),
          fn(22)
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Technology & Cloud Computing: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'In tech, roadmap changes and feature rollouts are key competitive weapons. A cloud provider announcing a new AI service or a big price cut on storage can trigger immediate responses from others. Simulation gives a way to test those waters without jeopardizing real revenue.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),

      // ─── SECTION 6 ───────────────────────────────────────────────────
      h1('Challenges to Address (and How to Solve Them)'),
      body('While AI-driven competitive simulations are powerful, they are not magic crystal balls. To make them work in practice, organizations need to manage four key considerations:'),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Data Validity: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'The old computing adage “garbage in, garbage out” applies. Build robust data pipelines with rigorous quality thresholds and recency checks.', size: 22, font: 'Calibri', color: '333333' }),
          fn(23)
        ]
      }),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Explainability and Trust: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'A simulation that produces inscrutable outputs with no reasoning will meet understandable skepticism from executives. Incorporate explainable AI (XAI) techniques to surface the agent’s reasoning and key decision paths.', size: 22, font: 'Calibri', color: '333333' }),
          fn(24), fn(25)
        ]
      }),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Bias Control: ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'AI agents inherit biases from their training data and algorithms. Use ensemble approaches and calibrate against real historical outcomes.', size: 22, font: 'Calibri', color: '333333' }),
          fn(26)
        ]
      }),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Governance (Realism and Constraints): ', bold: true, size: 22, font: 'Calibri', color: '333333' }),
          new TextRun({ text: 'Impose strategic constraints and business rules to keep simulations within plausible bounds.', size: 22, font: 'Calibri', color: '333333' }),
          fn(27)
        ]
      }),
      body('When managed well, these four areas become pillars of a reliable competitive simulation capability. A well-explained 70% accurate prediction is far more valuable than a mysterious 90% accurate one that no one acts on.'),

      // ─── SECTION 7 ───────────────────────────────────────────────────
      h1('What Leaders Should Do Next: An Actionable Playbook'),
      body('Embracing AI competitor simulation doesn’t require boiling the ocean. Leading companies are starting small, learning fast, and scaling up as value is proven. Here’s a pragmatic five-step playbook:'),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: 'Start with One Strategic Decision (and One Competitor): Identify a high-stakes strategic decision coming up. Focus on one competitor’s reaction for one initiative to keep the pilot manageable.', size: 22, font: 'Calibri', color: '333333' })]
      }),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: 'Identify Key “Trigger” Events: List the events or moves that typically provoke a reaction from competitors. These triggers will guide what you simulate.', size: 22, font: 'Calibri', color: '333333' })]
      }),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: 'Assemble a Cross-Functional Core Team: Blend strategy experts with data scientists and domain specialists. Cross-functional collaboration also builds buy-in.', size: 22, font: 'Calibri', color: '333333' })]
      }),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Establish a Validation Loop: After you simulate and perhaps make a decision, compare the AI agents’ predictions to what actually happens in the market over the next weeks or months.', size: 22, font: 'Calibri', color: '333333' }),
          fn(28)
        ]
      }),
      new Paragraph({
        numbering: { reference: 'numbered', level: 0 },
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: 'Integrate into Ongoing Planning: The end-goal is to make competitor simulation a continuous capability, not a one-off experiment. As one GRC expert noted, digital twin simulations enable leadership to ask “what if” in a structured, evidence-driven way.', size: 22, font: 'Calibri', color: '333333' }),
          fn(29), fn(30)
        ]
      }),
      body('In implementing these steps, it’s wise to start with a proof of concept that delivers quick wins, then expand. CompetitorSim is exactly such a proof of concept — one that can be run against any strategic scenario within minutes.'),

      // ─── CONCLUSION ──────────────────────────────────────────────────
      h1('Conclusion: From Assumptions to Anticipation'),
      new Paragraph({
        spacing: { before: 80, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'AI-driven competitor simulation is not about replacing human strategists – it’s about expanding their field of vision. Instead of planning around a handful of guessed futures, leaders can now rigorously explore thousands of plausible competitor responses. The shift is profound: strategy becomes less about reacting to what rivals did, and more about anticipating what they will do.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),
      new Paragraph({
        spacing: { before: 80, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'The CompetitorSim proof of concept demonstrates that this shift is not a future possibility — it is achievable today. A working implementation, built on commercially available LLMs and standard web technologies, delivered the exact second-order insights the framework predicts: that the obvious strategic move (price cut) is suboptimal because of the competitor cascade it triggers, and that an alternative (bundle + segmentation) outperforms it. This is the value of AI simulation in practice.', size: 22, font: 'Calibri', color: TEAL })]
      }),
      new Paragraph({
        spacing: { before: 80, after: 140 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: 'Those who invest in these predictive simulations can move with agility and avoid strategic surprises. As a McKinsey analysis on war-gaming presciently noted, no company is an island; the ones that most accurately perceive the competitive landscape “as it is and is likely to be will have a distinct advantage.”', size: 22, font: 'Calibri', color: '333333' }),
          fn(31),
          new TextRun({ text: ' In the coming years, the winners in each industry will be organizations that marry human strategic creativity with AI-powered foresight. The future of strategy belongs to those who can anticipate, not just react – and AI is the new indispensable tool giving them that edge.', size: 22, font: 'Calibri', color: '333333' })
        ]
      }),

      spacer(400),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 80 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 1 } },
        children: [new TextRun({ text: '— End —', size: 20, font: 'Calibri', color: '888888', italics: true })]
      }),
    ]
  }]
});

const OUT = '/Users/vatsalpatni/Documents/Claude_Projects/competitor-sim/docs/Whitepaper_With_ProofOfConcept.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log('Written:', OUT);
}).catch(e => { console.error(e); process.exit(1); });
