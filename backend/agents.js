import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  buildCompetitorSystemPrompt,
  buildCompetitorRoundPrompt,
  buildOrchestratorPrompt,
} from './prompts.js';

// Load .env from project root (one level above /backend)
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';

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

function hasShifted(r1, r2) {
  if (!r1?.primaryResponse || !r2?.primaryResponse) return false;
  const typeChanged = r1.primaryResponse.type !== r2.primaryResponse.type;
  const magnitudeShift = Math.abs((r1.primaryResponse.magnitude ?? 0) - (r2.primaryResponse.magnitude ?? 0)) > 15;
  return typeChanged || magnitudeShift;
}

// ── Single competitor API call ────────────────────────────────────────────────

async function callCompetitorAgent(profile, messages) {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: buildCompetitorSystemPrompt(profile),
    messages,
  });
  const text = res.content[0].text;
  return parseResponse(text, profile.name);
}

// ── Round runners ─────────────────────────────────────────────────────────────

async function runRound1(competitors, triggerMessage) {
  const calls = competitors.map(profile =>
    callCompetitorAgent(profile, [{ role: 'user', content: triggerMessage }]).then(response => ({
      competitorName: profile.name,
      profile,
      response,
      round: 1,
    }))
  );
  return Promise.all(calls);
}

async function runRoundN(competitors, triggerMessage, triggerEvent, previousResults, roundNumber) {
  const calls = competitors.map((profile, i) => {
    const round1Response = previousResults[i].response;
    const others = otherResponses(previousResults, profile.name);
    const roundPrompt = buildCompetitorRoundPrompt(triggerEvent, profile, others);

    const messages = [
      { role: 'user', content: triggerMessage },
      { role: 'assistant', content: JSON.stringify(round1Response) },
      { role: 'user', content: roundPrompt },
    ];

    return callCompetitorAgent(profile, messages).then(response => ({
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
 *   yourCompany: { name: string, strategicMove: string, context: string },
 *   competitors: object[]
 * }} scenario
 */
export async function runSimulation(scenario) {
  const { yourCompany, competitors } = scenario;
  const triggerMessage = buildTriggerMessage(yourCompany);
  const triggerEvent = `${yourCompany.name} has announced: ${yourCompany.strategicMove}`;

  // ── Round 1 ─────────────────────────────────────────────────────────────────
  console.log('[simulation] Round 1 — independent reactions...');
  const round1Results = await runRound1(competitors, triggerMessage);

  // ── Round 2 ─────────────────────────────────────────────────────────────────
  console.log('[simulation] Round 2 — reactive adjustments...');
  const round2Results = await runRoundN(competitors, triggerMessage, triggerEvent, round1Results, 2);

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
    round3Results = await runRoundN(competitors, triggerMessage, triggerEvent, round2Results, 3);
  }

  // ── Orchestrator ────────────────────────────────────────────────────────────
  console.log('[simulation] Running orchestrator synthesis...');
  const allFinalResponses = round3Results.map(r => ({
    competitorName: r.competitorName,
    finalPrimaryResponse: r.response.primaryResponse ?? {},
    finalAlternativeResponse: r.response.alternativeResponse ?? {},
    confidenceScore: r.response.confidenceScore ?? 0,
    dataPointsDriving: r.response.dataPointsDriving ?? [],
  }));

  const orchRes = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      'You are a senior strategy consultant synthesizing a competitive simulation. ' +
      'Respond only with valid JSON.',
    messages: [
      {
        role: 'user',
        content: buildOrchestratorPrompt(triggerEvent, allFinalResponses, yourCompany),
      },
    ],
  });

  const orchestratorOutput = parseResponse(orchRes.content[0].text, 'orchestrator');

  // ── Return ───────────────────────────────────────────────────────────────────
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
      timestamp: new Date().toISOString(),
      yourCompany,
    },
  };
}
