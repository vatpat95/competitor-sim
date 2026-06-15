import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID, createHash } from 'crypto';
import {
  buildCompetitorSystemPrompt,
  buildCompetitorRoundPrompt,
  buildOrchestratorPrompt,
} from './prompts.js';
import { buildCompetitorProfile } from './profileBuilder.js';

// Load .env from project root (one level above /backend)
const __dirname = dirname(fileURLToPath(import.meta.url));
const { parsed: env } = config({ path: resolve(__dirname, '../.env'), override: true });

const anthropic = new Anthropic({ apiKey: env?.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY });

const COMPETITOR_MODEL            = 'claude-haiku-4-5-20251001';
const ORCHESTRATOR_MODEL          = 'claude-sonnet-4-6';
const PROMPT_VERSION              = 'v1.0';
const SCORING_VERSION             = 'v1.0';
const EQUILIBRIUM_MAGNITUDE_THRESHOLD = 15;

// ── Industry lookup (mirrors frontend INDUSTRY_OPTIONS) ───────────────────────

const INDUSTRY_OPTIONS = [
  { value: 'telecom',          label: 'Telecommunications' },
  { value: 'banking_finance',  label: 'Banking & Financial Services' },
  { value: 'saas_software',    label: 'SaaS / Software' },
  { value: 'retail_ecommerce', label: 'Retail & E-commerce' },
  { value: 'healthcare',       label: 'Healthcare & Life Sciences' },
  { value: 'insurance',        label: 'Insurance' },
  { value: 'media_streaming',  label: 'Media & Streaming' },
  { value: 'logistics',        label: 'Logistics & Supply Chain' },
  { value: 'energy_utilities', label: 'Energy & Utilities' },
  { value: 'automotive',       label: 'Automotive' },
  { value: 'hospitality',      label: 'Hospitality & Travel' },
  { value: 'manufacturing',    label: 'Manufacturing' },
  { value: 'other',            label: 'Other' },
];

const COMPETITOR_TYPE_LABELS = {
  low_cost_challenger: 'Low-cost Challenger',
  incumbent_leader:    'Incumbent / Market Leader',
  premium_brand:       'Premium Brand',
  regional_player:     'Regional / Niche Player',
  fast_follower:       'Fast Follower',
  disruptor:           'Disruptor / New Entrant',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripFences(text) {
  // Strip optional ```json ... ``` or ``` ... ``` markdown wrappers
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function parseResponse(text, competitorName) {
  try {
    return JSON.parse(stripFences(text));
  } catch {
    console.error(`[agents] JSON parse failed for ${competitorName}. Raw:\n${text}`);
    return { error: 'parse_failed', raw: text };
  }
}

function buildTriggerMessage(yourCompany) {
  return (
    `TRIGGER EVENT: ${yourCompany.name} has announced: ${yourCompany.strategicMove}. ` +
    `Context: ${yourCompany.context}. How do you respond?`
  );
}

function otherResponses(allResults, competitorName) {
  return allResults
    .filter(r => r.competitorName !== competitorName && r.response?.primaryResponse)
    .map(r => ({ competitorName: r.competitorName, primaryResponse: r.response.primaryResponse }));
}

function hashInput(yourCompany, competitors) {
  const normalized = JSON.stringify({
    yourCompany,
    competitors: [...competitors].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
  });
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function hasShifted(r1, r2) {
  if (!r1?.primaryResponse || !r2?.primaryResponse) return false;
  const typeChanged = r1.primaryResponse.type !== r2.primaryResponse.type;
  const magnitudeShift = Math.abs((r1.primaryResponse.magnitude ?? 0) - (r2.primaryResponse.magnitude ?? 0)) > EQUILIBRIUM_MAGNITUDE_THRESHOLD;
  return typeChanged || magnitudeShift;
}

// ── Single competitor API call ────────────────────────────────────────────────

async function callCompetitorAgent(profile, messages, scenarioContext = {}) {
  const res = await anthropic.messages.create({
    model: COMPETITOR_MODEL,
    max_tokens: 1000,
    system: [
      {
        type: 'text',
        text: buildCompetitorSystemPrompt(profile, scenarioContext),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  });
  const text = res.content[0].text;
  console.log(`[${profile.name}] cache_write=${res.usage?.cache_creation_input_tokens ?? 0} cache_read=${res.usage?.cache_read_input_tokens ?? 0} output=${res.usage?.output_tokens ?? 0}`);
  return parseResponse(text, profile.name);
}

// ── Round runners ─────────────────────────────────────────────────────────────

async function runRound1(competitors, triggerMessage, scenarioContext) {
  const calls = competitors.map(profile =>
    callCompetitorAgent(profile, [{ role: 'user', content: triggerMessage }], scenarioContext).then(response => ({
      competitorName: profile.name,
      profile,
      response,
      round: 1,
    }))
  );
  return Promise.all(calls);
}

async function runRoundN(competitors, triggerMessage, triggerEvent, previousResults, roundNumber, scenarioContext) {
  const calls = competitors.map((profile, i) => {
    const round1Response = previousResults[i].response;
    const others = otherResponses(previousResults, profile.name);
    const roundPrompt = buildCompetitorRoundPrompt(triggerEvent, profile, others, scenarioContext);

    const messages = [
      { role: 'user', content: triggerMessage },
      { role: 'assistant', content: JSON.stringify(round1Response) },
      { role: 'user', content: roundPrompt },
    ];

    return callCompetitorAgent(profile, messages, scenarioContext).then(response => ({
      competitorName: profile.name,
      profile,
      response,
      round: roundNumber,
    }));
  });
  return Promise.all(calls);
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Runs a full multi-round competitive simulation.
 *
 * @param {{
 *   yourCompany: { name: string, strategicMove: string, context: string, industry?: string, industryOther?: string, companyType?: string, marketGeography?: string, marketOverview?: string },
 *   competitors: object[]
 * }} scenario
 */
export async function runSimulation(scenario) {
  const { yourCompany, competitors } = scenario;
  const triggerMessage = buildTriggerMessage(yourCompany);
  const triggerEvent = `${yourCompany.name} has announced: ${yourCompany.strategicMove}`;

  // ── Build yourCompany scored profile (same scoring as competitors) ──────────
  const yourCompanyProfile = buildCompetitorProfile({
    name:                 yourCompany.name,
    revenueGrowthRate:    yourCompany.revenueGrowthRate    ?? 0,
    ebitdaMargin:         yourCompany.ebitdaMargin         ?? 0,
    cashPosition:         yourCompany.cashPosition         ?? 'moderate',
    debtToEbitda:         yourCompany.debtToEbitda         ?? 0,
    rdSpendPct:           yourCompany.rdSpendPct           ?? 0,
    lastThreePriceMoves:  yourCompany.lastThreePriceMoves  ?? [],
    marketShareTrend:     yourCompany.marketShareTrend     ?? 'stable',
    headcountTrend:       yourCompany.headcountTrend       ?? 'flat',
    geographicFocus:      yourCompany.marketGeography      ?? '',
    competitorType:       yourCompany.companyType          ?? '',
    ceoPriorityStatement: yourCompany.ceoPriorityStatement ?? '',
    recentNewsSignals:    yourCompany.recentNewsSignals    ?? [],
    regulatoryConstraints: yourCompany.regulatoryConstraints ?? '',
  });

  // ── Derive scenario context ──────────────────────────────────────────────────
  const industryOption = INDUSTRY_OPTIONS.find(o => o.value === yourCompany.industry);
  const scenarioContext = {
    industryLabel: industryOption?.label ?? yourCompany.industryOther ?? '',
    industryOther: yourCompany.industryOther ?? '',
    companyType: yourCompany.companyType ?? '',
    companyTypeLabel: COMPETITOR_TYPE_LABELS[yourCompany.companyType] ?? '',
    marketGeography: yourCompany.marketGeography ?? '',
    marketOverview: yourCompany.marketOverview ?? '',
    yourCompanyProfile,
  };

  // ── Pseudonymization — keep real names out of LLM prompts ──────────────────
  const pseudonymMap = new Map();
  pseudonymMap.set(yourCompany.name, 'Your Company');
  competitors.forEach((c, i) => {
    pseudonymMap.set(c.name, `Competitor ${String.fromCharCode(65 + i)}`);
  });
  const reverseMap = new Map([...pseudonymMap].map(([k, v]) => [v, k]));

  const pseudoCompetitors = competitors.map(c => ({ ...c, name: pseudonymMap.get(c.name) ?? c.name }));
  const pseudoYourCompanyProfile = { ...yourCompanyProfile, name: 'Your Company' };
  const pseudoScenarioContext = { ...scenarioContext, yourCompanyProfile: pseudoYourCompanyProfile };
  const pseudoTriggerMessage = triggerMessage.replace(yourCompany.name, 'Your Company');
  const pseudoTriggerEvent = triggerEvent.replace(yourCompany.name, 'Your Company');

  // ── Round 1 ─────────────────────────────────────────────────────────────────
  console.log('[simulation] Round 1 — independent reactions...');
  const round1Results = await runRound1(pseudoCompetitors, pseudoTriggerMessage, pseudoScenarioContext);

  // ── Round 2 ─────────────────────────────────────────────────────────────────
  console.log('[simulation] Round 2 — reactive adjustments...');
  const round2Results = await runRoundN(pseudoCompetitors, pseudoTriggerMessage, pseudoTriggerEvent, round1Results, 2, pseudoScenarioContext);

  // ── Equilibrium check ───────────────────────────────────────────────────────
  const shifted = round2Results.some((r2, i) => hasShifted(round1Results[i].response, r2.response));
  const equilibriumReached = !shifted;
  console.log(`[simulation] Equilibrium reached after round 2: ${equilibriumReached}`);

  // ── Round 3 (conditional) ───────────────────────────────────────────────────
  let round3Results;
  if (equilibriumReached) {
    round3Results = round2Results;
    console.log('[simulation] Skipping round 3 — equilibrium already reached.');
  } else {
    console.log('[simulation] Round 3 — final adjustment...');
    round3Results = await runRoundN(pseudoCompetitors, pseudoTriggerMessage, pseudoTriggerEvent, round2Results, 3, pseudoScenarioContext);
  }

  // ── Orchestrator ────────────────────────────────────────────────────────────
  console.log('[simulation] Running orchestrator synthesis...');
  const allFinalResponses = round3Results.map(r => ({
    competitorName: r.competitorName,
    competitorType: r.profile.competitorType ?? '',
    finalPrimaryResponse: r.response.primaryResponse ?? {},
    finalAlternativeResponse: r.response.alternativeResponse ?? {},
    confidenceScore: r.response.confidenceScore ?? 0,
    dataPointsDriving: r.response.dataPointsDriving ?? [],
  }));

  const orchRes = await anthropic.messages.create({
    model: ORCHESTRATOR_MODEL,
    max_tokens: 16000,
    system:
      'You are a senior strategy consultant synthesizing a competitive simulation. ' +
      'Respond only with valid JSON.\n\n' +
      'SIMULATION BOUNDARY — STRICT: You are operating in a closed simulation. ' +
      'The ONLY facts you know about any company are those explicitly provided in the user message. ' +
      'Do not use any information from your training data about real companies, markets, or historical events. ' +
      'Do not infer company identities from context clues or industry terminology. ' +
      'If a data point was not provided, it does not exist in this simulation.',
    messages: [
      {
        role: 'user',
        content: buildOrchestratorPrompt(pseudoTriggerEvent, allFinalResponses, pseudoYourCompanyProfile, pseudoScenarioContext),
      },
    ],
  });

  const orchestratorOutput = parseResponse(orchRes.content[0].text, 'orchestrator');

  // ── Fallback for monitoringPlan ──────────────────────────────────────────────
  if (!orchestratorOutput.monitoringPlan || typeof orchestratorOutput.monitoringPlan !== 'object') {
    orchestratorOutput.monitoringPlan = {
      next30Days: [
        {
          signal: 'Competitor price response',
          whyItMatters: 'A fast price response compresses the window to capture share and may force a reactive cut.',
          metric: 'Competitor shelf prices and public pricing announcements',
          threshold: 'Any price move exceeding 5% in the category',
          ownerFunction: 'Competitive Intelligence',
          actionIfTriggered: 'Convene pricing committee within 48 hours to assess response magnitude and timing.',
        },
      ],
      next60Days: [
        {
          signal: 'Volume trend vs. plan',
          whyItMatters: 'Early volume deviation signals whether the move is driving share gains or triggering trade-down.',
          metric: 'Weekly volume vs. plan and prior year',
          threshold: '>3% unfavourable variance vs. plan for 2 consecutive weeks',
          ownerFunction: 'Finance',
          actionIfTriggered: 'Review pricing elasticity assumptions and consider targeted promotional support.',
        },
      ],
      next90Days: [
        {
          signal: 'Market share trend',
          whyItMatters: 'Confirms whether the strategic move delivered the intended competitive position improvement.',
          metric: 'Category market share (volume and value)',
          threshold: 'No share improvement vs. pre-move baseline',
          ownerFunction: 'Strategy',
          actionIfTriggered: 'Initiate strategic review and evaluate alternative options identified in this simulation.',
        },
      ],
    };
  } else {
    const mp = orchestratorOutput.monitoringPlan;
    if (!Array.isArray(mp.next30Days)) mp.next30Days = [];
    if (!Array.isArray(mp.next60Days)) mp.next60Days = [];
    if (!Array.isArray(mp.next90Days)) mp.next90Days = [];
  }

  // ── Fallback for recommendationChangeTriggers ───────────────────────────────
  if (!Array.isArray(orchestratorOutput.recommendationChangeTriggers)) {
    orchestratorOutput.recommendationChangeTriggers = [
      {
        trigger: 'Competitor announces material price response',
        metricToMonitor: 'Competitor public pricing announcements or shelf price changes',
        threshold: 'Any price move exceeding 5% within the category',
        timeWindow: 'Next 30–60 days',
        recommendationImpact: 'Revisit move magnitude and timing — a fast competitive response compresses the window to capture share.',
        urgency: 'High',
      },
      {
        trigger: 'Market demand weakens significantly',
        metricToMonitor: 'Category volume or revenue growth rate',
        threshold: 'Growth rate drops more than 3 percentage points below current trend',
        timeWindow: 'Next 90 days',
        recommendationImpact: 'Shift focus from share gain to margin defense and consider scaling back the move.',
        urgency: 'Medium',
      },
    ];
  }

  // ── Fallback for strategicOptions ───────────────────────────────────────────
  if (!Array.isArray(orchestratorOutput.strategicOptions)) {
    orchestratorOutput.strategicOptions = [
      {
        optionName: 'Proceed as Planned',
        description: 'Execute the proposed strategic move as described.',
        revenueUpside: 'Insufficient input data to estimate',
        volumeRisk: 'Insufficient input data to estimate',
        competitorRisk: 'Medium',
        retailerOrCustomerRisk: 'Medium',
        implementationComplexity: 'Medium',
        overallAssessment: 'Preferred',
        rationale: 'The proposed move is the baseline; no alternative data was returned by the model.',
      },
    ];
  }

  // ── Fallback for assumptionsUsed ────────────────────────────────────────────
  if (!Array.isArray(orchestratorOutput.assumptionsUsed)) {
    orchestratorOutput.assumptionsUsed = [
      {
        assumption: 'Competitor response timing',
        value: 'Within 30–90 days',
        sourceType: 'Model Inference',
        confidence: 'Medium',
        impactIfWrong: 'Faster responses compress the window to execute priority actions; slower responses extend the advantage period.',
      },
      {
        assumption: 'Market conditions stability',
        value: 'No major demand or regulatory shifts',
        sourceType: 'Default',
        confidence: 'Medium',
        impactIfWrong: 'A significant demand shock or new regulation would require revisiting both the move magnitude and timing.',
      },
    ];
  }

  // ── Fallback for evidenceClassification ─────────────────────────────────────
  if (!orchestratorOutput.evidenceClassification || typeof orchestratorOutput.evidenceClassification !== 'object') {
    const n = (arr) => (Array.isArray(arr) ? arr.map(() => 'Model Inference') : []);
    const playerKeys = orchestratorOutput.playerOutcomes ? Object.keys(orchestratorOutput.playerOutcomes) : [];
    orchestratorOutput.evidenceClassification = {
      marketEquilibrium: 'Model Inference',
      strategicRecommendation: 'Model Inference',
      betterAlternative: orchestratorOutput.betterAlternative ? 'Model Inference' : null,
      priorityActions: n(orchestratorOutput.priorityActions),
      keyRisks: n(orchestratorOutput.keyRisks),
      watchlistSignals: n(orchestratorOutput.watchlistSignals),
      playerOutcomes: Object.fromEntries(playerKeys.map(k => [k, 'Model Inference'])),
      confidenceBands: { bestCase: 'Model Inference', likelyCase: 'Model Inference', worstCase: 'Model Inference' },
      decisionBrief: {
        recommendedDecision: 'Model Inference',
        primaryReason: 'Model Inference',
        biggestWatchout: 'Model Inference',
        decisionGate: 'Assumption',
      },
    };
  } else {
    // Patch any missing array lengths to match the actual arrays
    const ec = orchestratorOutput.evidenceClassification;
    const padArr = (tags, source) =>
      Array.isArray(tags) ? tags : (Array.isArray(source) ? source.map(() => 'Model Inference') : []);
    ec.priorityActions   = padArr(ec.priorityActions,   orchestratorOutput.priorityActions);
    ec.keyRisks          = padArr(ec.keyRisks,          orchestratorOutput.keyRisks);
    ec.watchlistSignals  = padArr(ec.watchlistSignals,  orchestratorOutput.watchlistSignals);
    if (!ec.playerOutcomes || typeof ec.playerOutcomes !== 'object') ec.playerOutcomes = {};
    if (!ec.confidenceBands || typeof ec.confidenceBands !== 'object') {
      ec.confidenceBands = { bestCase: 'Model Inference', likelyCase: 'Model Inference', worstCase: 'Model Inference' };
    }
    if (!ec.decisionBrief || typeof ec.decisionBrief !== 'object') {
      ec.decisionBrief = { recommendedDecision: 'Model Inference', primaryReason: 'Model Inference', biggestWatchout: 'Model Inference', decisionGate: 'Assumption' };
    }
  }

  // ── Fallback for decisionBrief ───────────────────────────────────────────────
  if (!orchestratorOutput.decisionBrief || typeof orchestratorOutput.decisionBrief !== 'object') {
    orchestratorOutput.decisionBrief = {
      recommendedDecision: orchestratorOutput.strategicRecommendation?.split('.')[0]?.trim() ?? 'See strategic recommendation below.',
      confidenceLevel: 'Medium',
      confidenceRationale: 'Structured confidence data unavailable — see full analysis below.',
      primaryReason: orchestratorOutput.keyRisks?.[0] ?? 'See key risks below.',
      biggestWatchout: orchestratorOutput.watchlistSignals?.[0] ?? 'Monitor competitor responses closely.',
      decisionGate: 'No quantitative trigger captured — refer to watchlist signals.',
      executiveSummary: orchestratorOutput.marketEquilibrium ?? 'See full analysis below.',
    };
  }

  // ── Remap pseudonyms back to real names ────────────────────────────────────
  const remapName = n => reverseMap.get(n) ?? n;

  function remapStrings(obj) {
    if (typeof obj === 'string') {
      let s = obj;
      for (const [pseudo, real] of reverseMap) s = s.replaceAll(pseudo, real);
      return s;
    }
    if (Array.isArray(obj)) return obj.map(remapStrings);
    if (obj && typeof obj === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(obj)) out[remapName(k)] = remapStrings(v);
      return out;
    }
    return obj;
  }

  for (const results of [round1Results, round2Results, round3Results]) {
    for (const r of results) {
      r.competitorName = remapName(r.competitorName);
      if (r.response) r.response = remapStrings(r.response);
    }
  }
  const remappedOrch = remapStrings(orchestratorOutput);
  Object.keys(remappedOrch).forEach(k => { orchestratorOutput[k] = remappedOrch[k]; });

  // ── Return ───────────────────────────────────────────────────────────────────
  const runId    = randomUUID();
  const createdAt = new Date().toISOString();

  return {
    rounds: {
      round1: round1Results,
      round2: round2Results,
      round3: round3Results,
    },
    equilibriumReached,
    totalRounds: equilibriumReached ? 2 : 3,
    orchestratorOutput,
    competitorProfiles: competitors,
    simulationMetadata: {
      timestamp: createdAt,
      yourCompany,
    },
    runMetadata: {
      runId,
      createdAt,
      modelName: `${COMPETITOR_MODEL} (competitors) / ${ORCHESTRATOR_MODEL} (orchestrator)`,
      modelProvider: 'Anthropic',
      promptVersion: PROMPT_VERSION,
      scoringVersion: SCORING_VERSION,
      appVersion: '1.0.0',
      temperature: 1.0,
      maxRounds: 3,
      equilibriumThreshold: EQUILIBRIUM_MAGNITUDE_THRESHOLD,
      inputHash: hashInput(yourCompany, competitors),
    },
  };
}
