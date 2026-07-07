# CompetitorSim — Scoring Model v2 Specification & Implementation Guide

**Status:** Proposed (not yet built)
**Author / owner:** Vatsal
**Replaces:** the hardcoded scoring in `backend/profileBuilder.js` (v1)
**Audience:** (a) leadership — Part 1 is the design rationale; (b) Claude Code — Part 3 is the build instructions; (c) Vatsal — Part 4 is how to verify it without being an engineer.

---

## How to use this document

- **Part 1** explains *what* the new model is and *why* — read this yourself, and use it for the leadership deck.
- **Part 2** is the precise model definition (inputs, formulas, outputs). This is the contract.
- **Part 3** is a step-by-step build plan written as instructions you paste to Claude Code, one phase at a time.
- **Part 4** is how you, a non-engineer, confirm each phase actually worked before moving on.

Do **not** try to build everything at once. Go phase by phase. After each phase, verify (Part 4), then continue. If a phase goes wrong, Part 4 tells you how to undo it.

---

# PART 1 — The design rationale (the "why")

## What changes from v1

The v1 model produced three scores per competitor — Financial Capacity, Aggression, Strategic Intent. It worked, but it was:

1. **One-sided** — it scored competitors but never scored *your own* company, so it couldn't reason about *relative* strength, which is what actually drives competitive reaction.
2. **Move-agnostic** — "aggression" was a single global trait, even though a rival reacts very differently to a price cut vs. a market entry vs. a product launch.
3. **Internally double-counting** — financial capacity leaked 30% into the aggression score, so the two "independent" scores were mechanically correlated.
4. **Missing the most important variable** — *stakes*: how much of the rival's business your specific move actually threatens.
5. **Brittle on intent** — strategic intent was scored by raw text matching (`"share" in CEO statement`), which breaks on negation ("we will *not* chase share") and synonyms.

## The v2 spine: AMC

v2 reorganizes the model around the **Awareness–Motivation–Capability (AMC)** framework — the standard academic model in competitive-dynamics research for predicting whether and how a rival responds. A competitor responds only when they:

- **A — Awareness:** notice the move and attribute it to you,
- **M — Motivation:** have a reason to respond (their stakes are threatened), and
- **C — Capability:** are actually able to respond.

This gives the model a recognized theoretical foundation (a much stronger IP story than "three scores we picked"), and a clean structure for the new dimensions.

## The headline output changes

Instead of emitting a raw `aggressionIndex` number, v2 emits a **Predicted Reaction Profile** per competitor:

- **Response Likelihood** (0–100) — will they react at all?
- **Response Speed** — fast / moderate / slow
- **Response Intensity** (0–100) — how hard?
- **Likely Response Vectors** — ranked list (match price / undercut / hold & defend on value / product response / marketing / legal-regulatory / ignore & monitor)
- **Confidence** (0–100) — based on how complete the input data is

This is richer for the AI agents downstream and far more credible to a strategist than a single number.

## Two principles preserved from v1

- **Deterministic scoring, AI reasoning.** All scores are still computed by fixed formulas (auditable, repeatable). The AI agents still do the strategic reasoning *on top of* the scores.
- **Easy to set up.** Every new input has a sensible default, so a user can still run a simulation by filling in only the core fields. The new dimensions improve the answer when provided but never block a run.

---

# PART 2 — The model definition (the contract)

> Notation: `clamp(lo, hi, x)` means "keep x between lo and hi." All scores are 0–100 unless stated. All weights live in a new config file (see Part 3) so they can be tuned without touching formulas.

## 2.1 Inputs

### Existing competitor inputs (keep all of these from v1)
`name, revenueGrowthRate, ebitdaMargin, cashPosition, debtToEbitda, rdSpendPct, lastThreePriceMoves, marketShareTrend, headcountTrend, geographicFocus, ceoPriorityStatement, recentNewsSignals, regulatoryConstraints, competitorType`

### NEW competitor inputs (all optional, with defaults)
| Field | Type | Default | Meaning |
|---|---|---|---|
| `annualRevenue` | number ($M) | `null` | Absolute size — the "war chest." If null, scale uses a neutral 50. |
| `ownershipType` | `"public" \| "pe_backed" \| "family_private" \| "state_owned"` | `"public"` | Shapes patience & willingness to sustain a fight. |
| `operationalFlexibility` | `"high" \| "medium" \| "low"` | `"medium"` | Can they physically move fast (capacity, supply chain)? |
| `switchingFriction` | `"high" \| "medium" \| "low"` | `"medium"` | How locked-in their customers are (high = insulated, slower to react). |
| `exposureToMove` | number 0–100 | `50` | % of their revenue your move threatens. **Most important new field.** |
| `marketOverlapPct` | number 0–100 | `70` | How much they compete in your markets/segments. |
| `responseConstraintLevel` | `"none" \| "moderate" \| "severe"` | `"none"` | How much regulation/antitrust/investor pressure limits their response. |

### NEW: your own company gets scored too
Add the same financial fields to `yourCompany`: `annualRevenue, ebitdaMargin, cashPosition, debtToEbitda, operationalFlexibility`. These let us compute **relative** firepower.

### NEW: structured move type
Add to `yourCompany` (or the move object):
| Field | Type | Default | Meaning |
|---|---|---|---|
| `moveType` | `"price_cut" \| "price_increase" \| "product_launch" \| "market_entry" \| "bundle_promo" \| "capacity_expansion" \| "other"` | `"price_cut"` | Selects move-specific weighting. |
| `moveVisibility` | `"high" \| "medium" \| "low"` | derived from `moveType` | How noticeable the move is (feeds Awareness). |

---

## 2.2 Pillar C — Response Capacity (can they respond?)

Computed for **each competitor AND your own company**.

**Step 1 — Financial Firepower** (same math as v1's financialCapacityScore):
```
cashScore   = { strong: 100, moderate: 50, weak: 10 }[cashPosition]
debtScore   = clamp(0, 100, 100 - debtToEbitda * 15)
marginScore = clamp(0, 100, ebitdaMargin * 3)
financialFirepower = 0.40*cashScore + 0.35*debtScore + 0.25*marginScore
```

**Step 2 — Scale** (absolute war-chest size, log-scaled):
```
if annualRevenue is null:  scale = 50
else:                      scale = clamp(0, 100, (log10(annualRevenue) - 1) / 4 * 100)
// $10M→0, $1B→50, $100B→100  (annualRevenue is in $millions)
```

**Step 3 — Operational Flexibility:**
```
opsBase = { high: 80, medium: 50, low: 25 }[operationalFlexibility]
opsAdj  = headcountTrend === "growing" ? +10 : headcountTrend === "shrinking" ? -10 : 0
operationalFlex = clamp(0, 100, opsBase + opsAdj)
```

**Rollup:**
```
responseCapacityScore = 0.50*financialFirepower + 0.30*scale + 0.20*operationalFlex
```

**Relative Firepower** (the asymmetry — the single most predictive number):
```
relativeFirepowerRatio = competitor.responseCapacityScore / yourCompany.responseCapacityScore
relativeLabel = ratio >= 1.25 ? "stronger than you"
              : ratio <= 0.80 ? "weaker than you"
              : "evenly matched"
```

---

## 2.3 Pillar M — Motivation (will they want to respond?)

**Step 1 — Stakes / Exposure** (move-specific — how threatened are they?):
```
stakesScore = 0.60*exposureToMove + 0.40*marketOverlapPct
```

**Step 2 — Disposition / Behavioral Aggression** (cleaned up; NO capacity double-count):
```
// price reactivity — count ALL non-hold price moves, not just down moves
priceMoves = lastThreePriceMoves.filter(m => m.direction !== "hold")
rawPriceReactivity = priceMoves.length > 0
    ? clamp(0, 100, (avg magnitude of priceMoves) * 4)
    : 0
// price history matters more for price-type moves, less for others
priceRelevance = (moveType is "price_cut"|"price_increase"|"bundle_promo") ? 1.0 : 0.5
priceReactivity = rawPriceReactivity * priceRelevance

shareDrive = { gaining: 70, stable: 35, losing: 55 }[marketShareTrend]
// note: "losing" is NOT lowest — a player losing share may fight back hard

rhetoric = aggression-language score from ceoPriorityStatement + recentNewsSignals
           (see 2.6 — keyword buckets: 0 / 40 / 80)

disposition = 0.45*priceReactivity + 0.30*shareDrive + 0.25*rhetoric
```

**Rollup** (stakes dominate — in practice exposure drives reaction more than temperament):
```
motivationScore = 0.60*stakesScore + 0.40*disposition
```

---

## 2.4 Pillar A — Awareness (will they notice & attribute it?)

```
visibilityDefault = {
  price_cut: "high", price_increase: "high", bundle_promo: "high",
  product_launch: "high", market_entry: "high",
  capacity_expansion: "medium", other: "medium"
}[moveType]
effectiveVisibility = moveVisibility ?? visibilityDefault
awarenessScore  = { high: 90, medium: 65, low: 40 }[effectiveVisibility]
awarenessFactor = awarenessScore / 100   // used as a multiplier below
```

---

## 2.5 Constraints & ownership modifiers

```
constraintsDampener = { none: 1.0, moderate: 0.7, severe: 0.4 }[responseConstraintLevel]

// ownership shapes intensity & speed
ownershipIntensityMod = ownershipType === "pe_backed" ? 0.85   // margin-focused, avoids price wars
                      : ownershipType === "state_owned" ? 0.90
                      : 1.0
ownershipSpeedPenalty = (ownershipType === "state_owned") ? true : false
```

---

## 2.6 Strategic Intent Vector v2 (de-brittled, independent 0–100)

Four dimensions, each scored **independently 0–100** (NOT normalized to sum to 1 — a company can be both high-growth and high-innovation).

**Primary method — LLM extraction (deterministic & auditable):**
- One Claude call, `temperature: 0`, given `ceoPriorityStatement + recentNewsSignals`.
- Returns `{ growthMaximizer, marginDefender, nichePlayer, innovationBetter }`, each 0–100.
- **Store the raw model output** alongside the result for audit. Pinning temperature 0 keeps it repeatable.

**Fallback method — improved keywords (used when no API key, and in unit tests):**
- Same four dimensions, but: (a) handle negation — if "not"/"won't"/"rather than" appears within ~4 words before a keyword, do not count it; (b) use intensity buckets, not raw counts; (c) **remove** the v1 rule `financialCapacity < 40 → +2 niche` (that baked an assumption in as fact).

**Rhetoric score (reused in 2.3):** scan the same text for aggression terms — `defend, aggressive, fight, match, won't cede, price war, undercut, retaliate`. 0 terms → 0; 1 term → 40; 2+ → 80.

---

## 2.7 OUTPUT — Predicted Reaction Profile (the new headline)

```
responseLikelihood = round( motivationScore * awarenessFactor )
   // if responseCapacityScore < 25, cap likelihood at 50 (they may want to but can barely act)

responseIntensity  = round( min(motivationScore, responseCapacityScore)
                            * constraintsDampener * ownershipIntensityMod )
   // you can only hit as hard as you are BOTH motivated AND able AND allowed

responseSpeed =
   "fast"     if disposition > 60 AND responseCapacityScore > 50 AND not ownershipSpeedPenalty
   "slow"     if responseCapacityScore < 35 OR ownershipSpeedPenalty OR switchingFriction === "high"
   "moderate" otherwise

likelyResponseVectors = ranked list, by these rules (apply in order, collect matches):
   - stakesScore < 30                          → "Ignore / monitor only"
   - responseConstraintLevel === "severe"      → "Constrained — limited or non-price response"
   - intent.marginDefender highest & price move → "Hold price, defend on value / non-price levers"
   - intent.growthMaximizer high & responseCapacity > 55 & price move → "Match or undercut on price"
   - intent.innovationBetter highest           → "Differentiate via product / features"
   - regulatoryConstraints present & move aggressive → "Possible legal / regulatory response"
   (always include at least one vector; if none match, default "Measured competitive response")

confidence = based on % of optional fields populated (more data → higher confidence)
```

## 2.8 Keep producing the prose summaries

v1's `reactionPatternSummary`, `constraintSummary`, `signalSummary` are consumed by the prompts — keep them. **Add** a new `stakesSummary` (plain-English explanation of exposure/overlap) and a `reactionProfileSummary` (plain-English version of 2.7).

## 2.9 Versioning

Bump `SCORING_VERSION` to `"v2.0"`. Every simulation result records which scoring version produced it (the codebase already has this constant in `agents.js`).

---

# PART 3 — Build plan (instructions to give Claude Code)

Build in **5 phases**. Do one phase, verify it (Part 4), then move to the next. Each phase below is written so you can paste the **bold "Tell Claude Code:"** block more or less directly into a Claude Code session in the `competitor-sim` project.

### Phase 0 — Safety net (do this first, once)

**Tell Claude Code:**
> "We're about to make significant changes to the scoring model in the competitor-sim project. Before we start: create a new git branch called `feat/scoring-model-v2`, confirm the working tree is clean, and confirm all existing tests pass by running `node test-profile.js` and `node test-prompts.js` from the backend folder. Do not change any code yet — just set up the branch and report the test results."

Why: this keeps your current working version safe. If anything breaks, you can throw away the branch and your old version is untouched.

### Phase 1 — Config file + new scoring engine (backend only, no AI)

**Tell Claude Code:**
> "Read `docs/CompetitorSim_Scoring_Model_v2_Spec.md` Part 2 in full. Then:
> 1. Create a new file `backend/scoringConfig.js` that exports every weight, multiplier, map, and threshold from Part 2 as a single config object, with a comment on each explaining what it is. Include `SCORING_VERSION = 'v2.0'`.
> 2. Create a new file `backend/profileBuilderV2.js` exporting `buildCompetitorProfileV2(rawInputs, yourCompany)` that implements Part 2 sections 2.2 through 2.8, reading all numbers from `scoringConfig.js`. For the Strategic Intent Vector (2.6), implement the **keyword fallback method only** for now (we'll add the LLM method in Phase 5). Do NOT modify the existing `profileBuilder.js` — leave v1 fully intact.
> 3. Update `backend/test-profile.js` (or create `backend/test-profile-v2.js`) with assertions that check the new scores against hand-worked example numbers from the spec, including: a high-exposure competitor scores higher motivation than a low-exposure one; financial capacity no longer leaks into motivation; intent dimensions are independent 0–100 and do not sum to 1.
> 4. Run the test file and show me the output. All assertions must pass."

### Phase 2 — Wire the new engine into the simulation

**Tell Claude Code:**
> "Now switch the simulation engine to use the v2 profile. In `backend/agents.js`:
> 1. Import `buildCompetitorProfileV2` and call it for each competitor, also passing `yourCompany` so relative firepower is computed. Also build a Response Capacity score for `yourCompany` itself.
> 2. Set `SCORING_VERSION` to `'v2.0'` and make sure it's recorded in the result metadata.
> 3. Keep the old `buildCompetitorProfile` import available but unused, so we can revert quickly if needed.
> Then run `node test-simulation.js` and show me the output. I want to see that the Predicted Reaction Profile (likelihood, speed, intensity, vectors) appears for each competitor."

### Phase 3 — Feed the reaction profile into the prompts

**Tell Claude Code:**
> "Update `backend/prompts.js` so the competitor agent prompts and the orchestrator prompt use the new Predicted Reaction Profile and the relative-firepower comparison, instead of just the old raw scores. Follow the existing prompt language rules in CLAUDE.md — plain English, real numbers, never echo internal score names. Then run `node test-simulation.js` again and show me two competitors' full reasoning so I can check the language reads naturally and reflects stakes and relative strength."

### Phase 4 — Frontend: inputs + scorecard

**Tell Claude Code:**
> "Now update the frontend so a user can enter the new fields and see the new output.
> 1. In `frontend/src/App.jsx`, add the new fields to `defaultCompetitor()` and to the `yourCompany` state, with the defaults from the spec. Add a `moveType` and `moveVisibility` selector to the scenario setup.
> 2. In `CompetitorProfileForm.jsx`, add inputs for the new competitor fields using the existing `sharedInputCls` styling. Keep them in a collapsible 'Advanced / optional' section so the form still looks simple by default.
> 3. Update the live scorecard and `SimulationResults.jsx` to display the Predicted Reaction Profile (likelihood, speed, intensity, vectors) and the relative-firepower label.
> 4. Mirror the v2 scoring math in the form's live `computeScores()` so the scorecard matches the backend (CLAUDE.md notes these must stay in sync).
> Then start the backend and frontend and tell me exactly what to click to see it working."

### Phase 5 — (Optional) LLM intent extraction

**Tell Claude Code:**
> "Replace the keyword fallback for the Strategic Intent Vector with the primary LLM-extraction method from spec section 2.6: one Claude call at temperature 0 returning the four intent dimensions as 0–100 values, with the raw model output stored in the result for audit. Keep the keyword method as an automatic fallback when no API key is present, so the unit tests still run offline. Run `node test-profile.js` and `node test-simulation.js` and show me both still pass."

---

# PART 4 — How to verify each phase (for a non-engineer)

You don't need to read code. For each phase, here's what "it worked" looks like and how to check.

### General rules
- After each phase, ask Claude Code: **"Summarize what you changed, confirm the relevant tests pass, and show me the test output."**
- The test scripts print PASS/FAIL lines. You're looking for **no FAIL lines** and no red "Error" stack traces.
- If something looks wrong, tell Claude Code: **"This doesn't look right — [describe what you see]. Diagnose and fix before continuing."**

### Phase-by-phase checks

**Phase 0:** Claude Code reports a new branch `feat/scoring-model-v2` and that existing tests pass. ✅ if both are true.

**Phase 1 (the important one):** Ask Claude Code to **"run the v2 test file and also print the full scored profile for one sample competitor."** Eyeball these by hand:
- Is there a `responseCapacityScore`, a `motivationScore`, an `awarenessScore`, and a `predictedReactionProfile`? 
- Do the four intent numbers each sit between 0 and 100 and **not** add up to exactly 100? (That confirms the normalization fix.)
- Ask: **"Show me the same competitor with `exposureToMove` set to 90 vs. 10 — does motivation go up when exposure is higher?"** It should. That's the single most important behavior to confirm.

**Phase 2:** Ask: **"Run a full simulation and show me the Predicted Reaction Profile for all three competitors as a table."** Check each has likelihood, speed, intensity, and at least one likely vector, and that they differ across competitors (identical numbers would suggest the inputs aren't flowing through).

**Phase 3:** Read two competitors' reasoning text. It should mention things like being threatened/exposed, and being stronger or weaker than you — in plain English. It should **not** contain internal jargon like "motivationScore 62.4" or "growthMaximizer 0.31."

**Phase 4:** In the browser (Claude Code will give you the URL, usually `http://localhost:5173`):
- The form still looks simple — new fields are tucked under an "Advanced / optional" section.
- Load the demo, change one competitor's `exposureToMove` to a high value, and watch the scorecard's reaction profile shift.
- Run a simulation and confirm the results dashboard shows the new reaction profile and a "stronger/weaker than you" label.

**Phase 5:** Ask Claude Code to **"show the raw intent extraction output that got stored"** for one competitor and confirm the four numbers look sensible for that CEO statement (e.g., a margin-focused statement scores high on marginDefender).

### If you need to undo everything
**Tell Claude Code:** *"Abandon the v2 work — switch back to the main branch and delete the `feat/scoring-model-v2` branch. I want my original version back."* Because v1 was never modified (we built v2 in new files on a branch), your working POC is fully preserved.

---

## Appendix — quick-reference: what's new vs. v1

| Area | v1 | v2 |
|---|---|---|
| Framework | 3 ad-hoc scores | AMC (Awareness / Motivation / Capability) |
| Your own company | not scored | scored → relative firepower |
| Move type | ignored | drives weighting |
| Stakes / exposure | absent | first-class, highest-weight motivation input |
| Capacity | financial only | financial + scale + operational |
| Aggression | double-counts capacity | clean disposition, no double-count |
| Constraints | prose only | scored dampener + ownership modifiers |
| Intent | substring match, normalized | independent 0–100, negation-aware / LLM-extracted |
| Output | raw scores | Predicted Reaction Profile (likelihood, speed, intensity, vectors, confidence) |
| Weights | hardcoded in formula | externalized in `scoringConfig.js` |
