/**
 * intentExtractor.js
 *
 * Extracts strategic intent dimensions from CEO statements + news signals using
 * Claude at temperature=0. Falls back to keyword scoring if the API call fails.
 *
 * The four dimensions (0–100, independent, NOT normalized):
 *   growthMaximizer  — prioritising market share and revenue growth
 *   marginDefender   — protecting profitability and pricing power
 *   nichePlayer      — focusing on a specific segment or differentiated position
 *   innovationBetter — investing in product differentiation and R&D
 *
 * Returns: { growthMaximizer, marginDefender, nichePlayer, innovationBetter, method, rawModelOutput }
 * method is 'llm' on success, 'keyword_fallback' on any failure.
 */

import { scoreStrategicIntentKeywordFallback } from './profileBuilderV2.js';

const INTENT_PROMPT = (ceoStatement, newsSignals) => {
  const newsBlock = (newsSignals || []).length > 0
    ? `\nRecent signals:\n${newsSignals.map(s => `- ${s}`).join('\n')}`
    : '';

  return `You are a corporate strategy analyst. Read the competitor's CEO statement and recent signals below, then score their strategic intent on four independent dimensions (0–100 each). These are NOT percentages and do NOT need to sum to 100 — each dimension is scored on its own merits.

CEO statement: "${ceoStatement || '(none provided)'}"${newsBlock}

Scoring guide:
- growthMaximizer (0–100): How strongly is this company pursuing revenue growth and market share expansion? 0 = explicitly avoiding share chase, 100 = share leadership is the overriding priority.
- marginDefender (0–100): How strongly is this company protecting profitability and pricing power? 0 = willing to sacrifice margin for volume, 100 = margin discipline is non-negotiable.
- nichePlayer (0–100): How strongly is this company focused on a specific segment, customer type, or differentiated position rather than broad market coverage? 0 = competing everywhere, 100 = deliberately narrow focus.
- innovationBetter (0–100): How strongly is this company investing in product differentiation, R&D, or capability-building as a competitive weapon? 0 = no innovation signal, 100 = innovation is the stated core strategy.

Important: Use the full semantic meaning of the text, including negations and qualifications. "We will not chase market share" is a LOW growthMaximizer signal despite containing the words "market share."

Respond with ONLY a valid JSON object — no explanation, no markdown, no prose:
{"growthMaximizer": <0-100>, "marginDefender": <0-100>, "nichePlayer": <0-100>, "innovationBetter": <0-100>}`;
};

/**
 * Extracts strategic intent dimensions using the Claude API.
 * Falls back to keyword scoring on any failure.
 *
 * @param {string} ceoPriorityStatement
 * @param {string[]} recentNewsSignals
 * @param {{anthropicClient: object, model: string}} options
 * @returns {Promise<{growthMaximizer, marginDefender, nichePlayer, innovationBetter, method, rawModelOutput}>}
 */
export async function extractStrategicIntent(ceoPriorityStatement, recentNewsSignals, { anthropicClient, model } = {}) {
  const fallback = (reason) => {
    const kw = scoreStrategicIntentKeywordFallback(ceoPriorityStatement, recentNewsSignals);
    return { ...kw, method: 'keyword_fallback', rawModelOutput: null, fallbackReason: reason };
  };

  if (!anthropicClient) return fallback('no_client');
  if (!ceoPriorityStatement && (!recentNewsSignals || recentNewsSignals.length === 0)) {
    return fallback('no_input');
  }

  try {
    const response = await anthropicClient.messages.create({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      temperature: 0,
      messages: [{
        role: 'user',
        content: INTENT_PROMPT(ceoPriorityStatement, recentNewsSignals),
      }],
    });

    const rawText = response.content[0]?.text?.trim() ?? '';

    // Strip optional markdown fences if the model added them
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(jsonText);

    const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    return {
      growthMaximizer: clamp(parsed.growthMaximizer),
      marginDefender: clamp(parsed.marginDefender),
      nichePlayer: clamp(parsed.nichePlayer),
      innovationBetter: clamp(parsed.innovationBetter),
      method: 'llm',
      rawModelOutput: rawText,
    };
  } catch (err) {
    return fallback(`llm_error: ${err.message}`);
  }
}
