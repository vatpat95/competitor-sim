import { useState, useEffect, useRef } from 'react'
import CompetitorProfileForm from './components/CompetitorProfileForm'
import SimulationResults from './components/SimulationResults'

// ── Enums ─────────────────────────────────────────────────────────────────────

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
  { value: 'other',            label: 'Other (describe below)' },
]

const COMPETITOR_TYPE_OPTIONS = [
  { value: 'low_cost_challenger', label: 'Low-cost Challenger' },
  { value: 'incumbent_leader',    label: 'Incumbent / Market Leader' },
  { value: 'premium_brand',       label: 'Premium Brand' },
  { value: 'regional_player',     label: 'Regional / Niche Player' },
  { value: 'fast_follower',       label: 'Fast Follower' },
  { value: 'disruptor',           label: 'Disruptor / New Entrant' },
]

// ── Defaults ──────────────────────────────────────────────────────────────────

function defaultCompetitor() {
  return {
    name: '',
    revenueGrowthRate: 0,
    ebitdaMargin: 0,
    cashPosition: 'moderate',
    debtToEbitda: 0,
    rdSpendPct: 0,
    lastThreePriceMoves: [],
    marketShareTrend: 'stable',
    headcountTrend: 'flat',
    geographicFocus: '',
    ceoPriorityStatement: '',
    recentNewsSignals: [],
    regulatoryConstraints: '',
    competitorType: '',
  }
}

// ── Demo scenarios ────────────────────────────────────────────────────────────
// Three telecom scenarios — same market, same competitors (ValueNet,
// PremiumConnect, RegionalPlus), different TelcoX strategic moves.
// The simulation shows how the same competitive field reacts completely
// differently depending on what TelcoX decides to do.
// loadDemo() picks one at random each click.

const TELECOM_COMPETITORS = [
  {
    name: 'ValueNet',
    revenueGrowthRate: 18.5,
    ebitdaMargin: 12.3,
    cashPosition: 'strong',
    debtToEbitda: 1.8,
    rdSpendPct: 3.5,
    lastThreePriceMoves: [
      { direction: 'down', magnitude: 22, context: 'Aggressive Q4 campaign targeting mid-market' },
      { direction: 'down', magnitude: 20, context: 'Response to new entrant pricing pressure' },
      { direction: 'down', magnitude: 18, context: 'Renewal season discount push' },
    ],
    marketShareTrend: 'gaining',
    headcountTrend: 'growing',
    geographicFocus: 'North America, expanding EMEA',
    competitorType: 'low_cost_challenger',
    ceoPriorityStatement: 'Our mission is to be the undisputed price-value leader in every market we enter. We will outgrow the competition by making our product impossible to ignore on price.',
    recentNewsSignals: [
      'Announced expansion into 4 new metro markets',
      'Hired 200 sales reps in Q1',
      "Launched 'ValueNet Unlimited' tier at 15% below nearest competitor",
      'Partnership with mid-market procurement platform',
    ],
    regulatoryConstraints: '',
  },
  {
    name: 'PremiumConnect',
    revenueGrowthRate: 7.2,
    ebitdaMargin: 31.5,
    cashPosition: 'strong',
    debtToEbitda: 0.9,
    rdSpendPct: 11.0,
    lastThreePriceMoves: [
      { direction: 'hold', magnitude: 0, context: 'Held price during market-wide discount cycle' },
      { direction: 'up',   magnitude: 5, context: 'Premium tier repricing post-feature release' },
      { direction: 'hold', magnitude: 0, context: 'Maintained pricing despite competitor cuts' },
    ],
    marketShareTrend: 'stable',
    headcountTrend: 'flat',
    geographicFocus: 'North America, Western Europe',
    competitorType: 'premium_brand',
    ceoPriorityStatement: 'We compete on innovation and customer experience, not price. Our margins fund the R&D that keeps us two years ahead. We will not chase volume at the expense of profitability.',
    recentNewsSignals: [
      'Launched AI-powered network management suite exclusive to Enterprise tier',
      "Won three analyst 'leader' rankings in enterprise connectivity segment",
      'Renewed multi-year contracts with 4 Fortune 500 accounts',
    ],
    regulatoryConstraints: 'Subject to enterprise data residency requirements in EU; limits rapid geographic expansion.',
  },
  {
    name: 'RegionalPlus',
    revenueGrowthRate: 3.1,
    ebitdaMargin: 8.7,
    cashPosition: 'weak',
    debtToEbitda: 4.2,
    rdSpendPct: 2.1,
    lastThreePriceMoves: [
      { direction: 'down', magnitude: 10, context: 'Reactive cut after losing two regional accounts' },
      { direction: 'hold', magnitude: 0,  context: 'Could not afford further cuts' },
      { direction: 'down', magnitude: 6,  context: 'End-of-year retention discount for at-risk accounts' },
    ],
    marketShareTrend: 'losing',
    headcountTrend: 'shrinking',
    geographicFocus: 'US Midwest and Southeast regional markets',
    competitorType: 'regional_player',
    ceoPriorityStatement: 'We are focused on protecting our core rural and regional customer base. Our local relationships and dedicated support are what national players cannot replicate.',
    recentNewsSignals: [
      'Closed two regional offices to cut overhead',
      'Lost 3 mid-market accounts to ValueNet in Q1',
      "Announced 'Regional Loyalty' pricing program for long-term customers",
    ],
    regulatoryConstraints: 'State-level telecom licensing in 6 states limits ability to exit or restructure quickly.',
  },
]

const DEMO_SCENARIOS = [
  // ── Scenario 1: Direct price cut — expected verdict: REVISE STRATEGY ──────────
  // TelcoX tries to win back mid-market share by cutting price 10%.
  // ValueNet (strong cash, 18.5% growth, deep price-cut history) will immediately
  // out-discount and escalate. TelcoX bleeds margin with no durable share gain.
  {
    yourCompany: {
      name: 'TelcoX',
      strategicMove: '10% price cut on our core unlimited plan, effective immediately, to reclaim mid-market accounts',
      context: 'Reacting to two consecutive quarters of mid-market share loss to ValueNet. The goal is to match their pricing and stop the bleed before Q3 renewal season.',
      industry: 'telecom',
      industryOther: '',
      companyType: 'incumbent_leader',
      marketGeography: 'North America',
      marketOverview: 'Mature market with ~2% annual growth, high churn (18–22% annually), and mid-market consolidation driven by low-cost challengers. Enterprise segment is sticky; SMB and mid-market are the current battleground.',
    },
    competitors: TELECOM_COMPETITORS,
  },

  // ── Scenario 2: Premium bundle launch — expected verdict: PROCEED WITH CAUTION ─
  // TelcoX launches a value bundle adding streaming, cloud backup and device
  // insurance at a 15% premium. This is not a price fight — it's a value play.
  // ValueNet can't easily match bundled content partnerships (no content licensing
  // history). RegionalPlus can't afford content licensing costs. But PremiumConnect
  // has the margin and brand equity to launch a counter-bundle quickly, so TelcoX
  // wins — but needs to move fast before PremiumConnect closes the gap.
  {
    yourCompany: {
      name: 'TelcoX',
      strategicMove: "Launch 'TelcoX ONE' bundle: unlimited data + streaming (3 major platforms) + 200GB cloud backup + device insurance for 15% above our current base plan, targeting families and dual-income households",
      context: 'Rather than compete on price, we are moving up the value stack. We have secured 18-month content partnerships that competitors do not have today. This is designed to reduce churn by increasing switching costs, not to acquire price-sensitive customers.',
      industry: 'telecom',
      industryOther: '',
      companyType: 'incumbent_leader',
      marketGeography: 'North America',
      marketOverview: 'Mature market with ~2% annual growth, high churn (18–22% annually), and mid-market consolidation driven by low-cost challengers. Enterprise segment is sticky; SMB and mid-market are the current battleground.',
    },
    competitors: TELECOM_COMPETITORS,
  },

  // ── Scenario 3: Enterprise 5G private network — expected verdict: PROCEED ──────
  // TelcoX launches a dedicated B2B 5G private network slicing product for
  // large manufacturing and logistics enterprises — a segment none of the three
  // competitors are positioned to serve. ValueNet has no enterprise sales motion.
  // PremiumConnect is consumer-focused with no 5G infrastructure.
  // RegionalPlus can't afford the CapEx. This is uncontested space.
  {
    yourCompany: {
      name: 'TelcoX',
      strategicMove: "Launch 'TelcoX Edge' — dedicated 5G private network slicing for enterprise manufacturing and logistics clients, starting at $80K annual contracts with guaranteed 99.99% uptime SLAs",
      context: 'We are pivoting a portion of our 5G CapEx toward B2B enterprise clients who need private, low-latency connectivity for factory automation and real-time logistics tracking. No competitor has a credible 5G private network product today. This is a land-and-expand play — get 10 anchor clients, build reference cases, then expand.',
      industry: 'telecom',
      industryOther: '',
      companyType: 'incumbent_leader',
      marketGeography: 'North America',
      marketOverview: 'Mature market with ~2% annual growth, high churn (18–22% annually), and mid-market consolidation driven by low-cost challengers. Enterprise segment is sticky; SMB and mid-market are the current battleground.',
    },
    competitors: TELECOM_COMPETITORS,
  },
]

// ── Real historical scenario — T-Mobile Uncarrier (March 2013) ────────────────
// All financial data sourced from SEC filings, official earnings releases, and
// contemporaneous press coverage. Figures marked [calc] are derived from confirmed
// primary numbers. Use this for the demo backtest: same scoring model, real
// inputs, known outcome (T-Mobile gained 22M subscribers post-Uncarrier).

const TMOBILE_UNCARRIER_SCENARIO = {
  yourCompany: {
    name: 'T-Mobile',
    strategicMove: "Launch the 'Uncarrier' initiative: eliminate all 2-year service contracts, introduce no-contract Simple Choice plans starting at $50/month per line for unlimited talk, text, and 500MB high-speed data; separate smartphone financing via Equipment Installment Plans instead of subsidized handset contracts",
    context: "T-Mobile is the 4th-largest US carrier and has been losing postpaid subscribers to AT&T and Verizon for consecutive years. A blocked AT&T acquisition in 2011 left the company independent with a $3B breakup fee. New CEO John Legere (September 2012) has an explicit disruptive mandate. T-Mobile's 4G LTE is launching in only 7 cities as of March 2013 — the bet is price transparency and contract freedom to poach customers frustrated with incumbent contract terms before Q3 renewal season.",
    industry: 'telecom',
    industryOther: '',
    companyType: 'disruptor',
    marketGeography: 'United States',
    marketOverview: 'US wireless market with ~300M subscribers (2013). AT&T and Verizon hold ~65% combined market share. Market transitioning to smartphones and LTE data plans. Monthly postpaid churn ranges 1.5–2.8% across carriers. AT&T and Verizon both restructured pricing upward in 2011–2012. Sprint is financially distressed from the Nextel integration and Network Vision rebuild. Growing consumer frustration with 2-year contracts, device upgrade restrictions, and opaque fees.',
    revenueGrowthRate: -3,        // FY2012: $21.3B vs $21.9B (2011) — 14 consecutive quarters of postpaid net losses. Source: TMUS 2012 10-K
    ebitdaMargin: 22,             // [calc] Adjusted OIBDA ~$4.7B / $21.3B revenue. Source: TMUS 2012 10-K
    cashPosition: 'moderate',     // $3B AT&T breakup fee received + ~$1.5B operating cash; offset by MetroPCS merger costs
    debtToEbitda: 3.2,            // [calc] Long-term debt ~$15.1B / ~$4.7B adjusted OIBDA. Source: TMUS 2012 10-K
    rdSpendPct: 1.5,              // Network investment heavy but classified as capex; minimal formal R&D line item
    marketShareTrend: 'losing',   // 4th-place carrier; losing postpaid net adds to AT&T and Verizon for 14 consecutive quarters
    headcountTrend: 'flat',       // ~35,000 employees pre-MetroPCS merger. Source: TMUS 2012 DEF 14A
    ceoPriorityStatement: "We are the un-carrier. We will do what the big guys refuse to do — eliminate contracts, end the two-year upgrade cycle, and compete on the customer's terms. Our LTE rollout is behind AT&T and Verizon but our pricing model is our weapon. We have 12 months to prove this works before the MetroPCS merger closes. — John Legere, T-Mobile CEO (strategic mandate, March 2013)",
    lastThreePriceMoves: [
      { direction: 'down', magnitude: 15, context: 'March 2013: Uncarrier launch — Simple Choice plans at $50/month, ~15% below comparable AT&T/Verizon postpaid plans with no annual contract. Source: T-Mobile Uncarrier press release Mar 26 2013.' },
      { direction: 'hold', magnitude: 0, context: 'FY2012: Held pricing flat while losing subscribers — previous management unwilling to cut ahead of AT&T acquisition attempt.' },
      { direction: 'hold', magnitude: 0, context: 'FY2011: Maintained rate card pricing through AT&T merger attempt and post-breakup period.' },
    ],
  },
  competitors: [
    {
      // Source: AT&T Q4 2012 SEC 8-K; CNN Money Jan 18 2012; AT&T full-year 2012 results
      name: 'AT&T',
      revenueGrowthRate: 1,           // Full-year 2012: $127.4B vs $126.7B in 2011 (SEC 8-K FY2013)
      ebitdaMargin: 32,               // [calc] Wireless service EBITDA margin ~40–41%; consolidated lower due to wireline drag
      cashPosition: 'strong',         // Best-ever cash from operations in 2012; returned $23B to shareholders
      debtToEbitda: 1.6,              // [calc] LTD $61.3B + $3.5B current = $64.8B total debt / ~$40B EBITDA
      rdSpendPct: 1,                  // Telco R&D minimal; innovation investment is capex (Project VIP: $22B+)
      lastThreePriceMoves: [
        { direction: 'up', magnitude: 25, context: 'Jan 2012: Hiked tiered data plans — lowest tier from $15→$20/month (+33%), mid-tier from $25→$30/month (+20%). Source: CNN Money Jan 18, 2012.' },
        { direction: 'up', magnitude: 10, context: 'Jul 2012: Launched Mobile Share pooled data plans — effective cost increase vs prior unlimited plans for most individual users.' },
        { direction: 'up', magnitude: 10, context: 'Jan 2011: Ended renewal discount perks; raised activation fee for additional family plan lines from $26 to $36 per line. Source: CNN Money Jan 20, 2011.' },
      ],
      marketShareTrend: 'stable',
      headcountTrend: 'shrinking',
      geographicFocus: 'United States (nationwide)',
      competitorType: 'incumbent_leader',
      ceoPriorityStatement: "Our wireless network performance continues to be terrific. 2013 is the year of the network. With Project VIP, we are delivering faster speeds to millions more customers and our 4G LTE network is on pace to cover 200 million Americans by year-end. We compete on network quality and reliability — not price.",
      recentNewsSignals: [
        'Jan 2012: Raised smartphone data plan prices 20–33% across tiered plans (CNN Money, confirmed)',
        'Jul 2012: Launched Mobile Share pooled data plans — pricing restructured upward for most users',
        'Project VIP: $22B+ network investment plan 2012–2015 targeting 300M LTE coverage',
        'Full-year 2012: Best-ever cash from operations; returned $23B to shareholders via dividends and buybacks',
      ],
      regulatoryConstraints: 'FCC/DOJ blocked AT&T acquisition of T-Mobile in 2011 (antitrust); future large-scale spectrum acquisitions subject to regulatory review',
    },
    {
      // Source: Verizon 2012 SEC 8-K filings; Verizon annual results confirmed in search
      name: 'Verizon',
      revenueGrowthRate: 4.5,         // Full-year 2012: $115.8B vs $110.8B in 2011, confirmed from SEC filings
      ebitdaMargin: 33,               // [calc] Quarterly EBITDA Q1 $9.2B + Q2 $9.8B + Q3 $9.65B → ~$38.5B FY / $115.8B revenue
      cashPosition: 'strong',         // Cash from operations $31.5B in 2012; free cash flow $13.4B in first 9 months
      debtToEbitda: 1.35,             // [calc] Year-end 2012 total debt $52.0B (confirmed) / ~$38.5B EBITDA
      rdSpendPct: 1,                  // Telco R&D minimal; innovation is network capex-driven
      lastThreePriceMoves: [
        { direction: 'up', magnitude: 10, context: 'Jan 2011: Ended "New Every Two" upgrade discount program — effective price increase for contract renewal customers. Source: CNN Money Jan 20, 2011.' },
        { direction: 'up', magnitude: 15, context: 'Jun 2012: Launched Share Everything pooled data plans — higher effective cost for individual users vs prior unlimited plans. Source: Fierce Network / Neowin.' },
        { direction: 'hold', magnitude: 0, context: '2012–early 2013: Held premium pricing position; no further rate changes ahead of T-Mobile Uncarrier launch.' },
      ],
      marketShareTrend: 'stable',
      headcountTrend: 'shrinking',
      geographicFocus: 'United States (nationwide)',
      competitorType: 'incumbent_leader',
      ceoPriorityStatement: "Verizon's consistent strategic investments in wireless, FiOS and global networks drove strong financial performance. We are focused on continuing to provide the best portfolio of products on the most reliable networks. — Lowell McAdam, Verizon CEO (confirmed quote)",
      recentNewsSignals: [
        'Jun 2012: Launched Share Everything pooled data plans — industry-first major shared data offering',
        'Full-year 2012: Revenue $115.8B (+4.5% YoY); wireless EBITDA service margin 46–50% (SEC filings)',
        'LTE network reached 500+ markets covering ~280M Americans by early 2013',
        'Surpassed 100M total wireless connections in 2012; year-end total debt reduced to $52.0B',
      ],
      regulatoryConstraints: 'FCC spectrum holding reviews; large-scale acquisitions require regulatory approval',
    },
    {
      // Source: Sprint Q4 2012 earnings release (SEC); Sprint Q1 2012 Business Wire; Sprint 10-K 2012
      name: 'Sprint',
      revenueGrowthRate: 5,           // Full-year 2012 consolidated net operating revenue $35.3B, up 5% YoY (SEC confirmed)
      ebitdaMargin: 13.6,             // [calc] Full-year 2012 Adjusted OIBDA $4.8B / $35.3B revenue (SEC confirmed)
      cashPosition: 'weak',           // Highly leveraged; SoftBank injection helped but underlying ops constrained
      debtToEbitda: 4.6,              // [calc] Long-term debt + leases ~$22.3B (SEC confirmed) / $4.8B OIBDA
      rdSpendPct: 1.5,                // [estimated] Minimal formal R&D; capex dominated by Network Vision rebuild ($6B+/yr)
      lastThreePriceMoves: [
        { direction: 'hold', magnitude: 0, context: '2012: Maintained unlimited data as sole differentiator while AT&T and Verizon launched tiered/shared plans — held pricing as competitive statement.' },
        { direction: 'hold', magnitude: 0, context: '2012: Held core plan pricing despite rising network rebuild costs — financially constrained by $22B+ long-term debt load.' },
        { direction: 'hold', magnitude: 0, context: 'Early 2013: No pricing action possible — $6B+ annual capex commitment for Network Vision LTE buildout consumed available capital.' },
      ],
      marketShareTrend: 'losing',
      headcountTrend: 'shrinking',
      geographicFocus: 'United States (nationwide)',
      competitorType: 'low_cost_challenger',
      ceoPriorityStatement: "2013 is a year of rebuilding. Like the third pig who built with brick, we are taking longer but building a stronger foundation. The Network Vision investment will deliver greater speeds and capacity. Our unlimited offer remains our unique competitive advantage — no other major carrier offers true unlimited data. — Dan Hesse, Sprint CEO (Marketplace interview, Dec 30 2013)",
      recentNewsSignals: [
        'Oct 2012: SoftBank of Japan announced acquisition of 70% Sprint stake for $20.1B (confirmed)',
        'Network Vision LTE rebuild underway — Nextel CDMA spectrum repurposed; Nextel shutdown scheduled mid-2013, ~4.4M subscribers migrating (Sprint 10-K)',
        'Full-year 2012: Revenue $35.3B (+5%), Adjusted OIBDA $4.8B — only major carrier losing postpaid subscribers (Sprint SEC filings)',
        'Sole major carrier offering unlimited data as AT&T and Verizon moved to tiered/shared plans',
      ],
      regulatoryConstraints: 'SoftBank acquisition required FCC/DOJ approval (cleared early 2013); Clearwire acquisition pending; Nextel spectrum repurposing under FCC oversight',
    },
  ],
}

// ── Real historical scenario — Coca-Cola pricing discipline vs PepsiCo (Feb 2023) ───
// INPUT DATA:    FY2022 financials (year ending Dec 31, 2022) — most recent full year at trigger date
// TRIGGER DATE:  February 9, 2023 — Coca-Cola Q4 2022 earnings call, Quincey announces 2023 pricing strategy
// PREDICTIONS:   Full-year 2023 — what unfolds over the next 12 months
// VERIFICATION:  2023 actual results — PepsiCo had 9 consecutive quarters of volume decline;
//                Coke maintained market share dominance. PepsiCo CEO acknowledged elasticity
//                "worse than expected" on Q3 2023 earnings call.
// EXPECTED VERDICT: PROCEED — Coca-Cola's pricing discipline holds; PepsiCo forced to moderate.

const COCACOLA_PEPSI_SCENARIO = {
  yourCompany: {
    name: 'Coca-Cola',
    strategicMove: "Announce mid-single-digit price increases across the US portfolio for 2023, backed by increased marketing investment — competing on brand strength and consumer value rather than promotional discounting or trade-spend",
    context: "Coca-Cola enters 2023 as the dominant US CSD player with 46.3% market share after 11% revenue growth in 2022. CEO James Quincey on Q4 2022 earnings (Feb 9, 2023): 'there will be pricing in 2023 to reflect the continuing inflation in import and SG&A costs' and 'we need to own that pricing by delivering value consumers appreciate through marketing and innovation.' Strategy: hold pricing, invest in brand, let competitors blink first as consumer wallet pressure mounts.",
    industry: 'other',
    industryOther: 'Consumer Packaged Goods (CPG) / Beverages',
    companyType: 'incumbent_leader',
    marketGeography: 'United States',
    marketOverview: "US beverage market ~$100B+ annual retail sales. CSD category declining ~1-2% annually by volume as consumers shift to water and energy drinks. Coca-Cola holds 46.3% US CSD share vs PepsiCo 24.7% (Statista 2022). All major players took 10-14% price increases in 2021-2022 to offset commodity inflation (US CPI peaked 9.1% June 2022). Consumer wallets under pressure — low-income households beginning to trade down to private label. Private label beverage shelf space expanding at major retailers.",
    revenueGrowthRate: 11,        // FY2022: $43.0B vs $38.7B (2021). Source: KO 10-K FY2022 (SEC)
    ebitdaMargin: 32,             // [calc] Op. income $10.9B + D&A ~$2.7B = $13.6B / $43.0B revenue. Source: KO FY2022 10-K
    cashPosition: 'strong',       // Cash + short-term investments ~$9.5B at FY2022 year-end. Source: KO FY2022 10-K
    debtToEbitda: 2.5,            // [calc] Total debt ~$34B / ~$13.6B EBITDA. Source: KO FY2022 10-K
    rdSpendPct: 0,                // CPG — R&D spend minimal; marketing investment (~$4B) is the primary competitive lever
    marketShareTrend: 'stable',   // 46.3% US CSD share — holding vs PepsiCo 24.7% (Statista 2022); no significant gain or loss
    headcountTrend: 'flat',       // ~79,000 employees (2022). Source: KO DEF 14A FY2022
    ceoPriorityStatement: "There will be pricing in 2023 to reflect the continuing inflation in import and SG&A costs. We need to own that pricing by delivering value consumers appreciate through marketing and innovation. Our 46% market share is a competitive moat we intend to defend through brand investment, not promotional discounting. — James Quincey, Coca-Cola CEO (Q4 2022 earnings call, Feb 9, 2023)",
    lastThreePriceMoves: [
      { direction: 'up', magnitude: 12, context: 'FY2022 full year: ~12% blended price/mix increase across US portfolio to offset commodity and packaging inflation. Source: KO FY2022 10-K (SEC).' },
      { direction: 'up', magnitude: 10, context: 'FY2021: ~10% effective price increase across sparkling beverages — first major pricing cycle of the post-COVID inflation period. Source: KO FY2021 10-K (SEC).' },
      { direction: 'hold', magnitude: 0, context: 'H1 2023 guidance: holding pricing; no further increases planned beyond carryover from 2022 rounds. Focus shifts to marketing investment to defend volume. Source: KO Q4 2022 earnings call, Feb 9, 2023.' },
    ],
  },
  competitors: [
    {
      // Source: PepsiCo 10-K FY2022 (SEC); PepsiCo Q4 2022 earnings CNBC Feb 9 2023; Statista US CSD share
      name: 'PepsiCo',
      revenueGrowthRate: 9,           // FY2022: $86.4B vs $79.5B (2021). Source: PepsiCo 10-K FY2022 (SEC)
      ebitdaMargin: 16,               // [calculated] Op. income $11.5B + D&A $2.7B = $14.2B / $86.4B revenue
      cashPosition: 'moderate',       // Cash $4.95B, short-term investments $394M. Source: PepsiCo 10-K FY2022
      debtToEbitda: 2.8,              // [calculated] Total debt $39.1B / $14.2B EBITDA. Source: PepsiCo 10-K FY2022
      rdSpendPct: 1,                  // ~$600-700M R&D on $86B revenue; CPG beverages industry norm
      lastThreePriceMoves: [
        { direction: 'up', magnitude: 12, context: 'Q2 2022: +12% price/mix increase across North America Beverages and Frito-Lay to offset commodity and supply chain inflation. Source: PepsiCo Q2 2022 8-K (SEC).' },
        { direction: 'up', magnitude: 10, context: 'Q1 2022: +10% price/mix increase, first major pricing action of the inflation cycle. Source: PepsiCo Q1 2022 8-K (SEC).' },
        { direction: 'up', magnitude: 7,  context: 'Q4 2022: +7% price/mix, moderating from H1 peak; PBNA volume -2% — early elasticity pressure. Source: PepsiCo Q4 2022 earnings, CNBC Feb 9 2023.' },
      ],
      marketShareTrend: 'losing',     // US CSD: 26% (2021) → 24.7% (2022). Source: Statista
      headcountTrend: 'growing',      // 291,000 (2021) → 309,000 (2022). Source: PepsiCo DEF 14A FY2022 (SEC)
      geographicFocus: 'United States (primary scenario focus); global operations in 200+ countries',
      competitorType: 'incumbent_leader',
      ceoPriorityStatement: "The truth is that the investment we've made in the brands in the last few years are paying off in the sense that our brands are being stretched to higher price points and consumers are following us. For 2023, we expect to deliver 6% organic revenue growth. — Ramon Laguarta, Q4 2022 earnings call and press release, February 9, 2023 (verbatim quotes)",
      recentNewsSignals: [
        'Q4 2022: North America Beverage volume -2% despite 7% pricing — first clear sign of consumer price resistance. Source: PepsiCo Q4 2022 earnings.',
        'FY2022: Organic revenue growth 14.4% driven almost entirely by price/mix, not volume. Source: PepsiCo FY2022 10-K (SEC).',
        'Management guidance Feb 2023: signalled backing off future price increases as inflation decelerates. Source: Q4 2022 earnings call (Yahoo Finance transcript).',
        'US CSD market share declined from 26% (2021) to 24.7% (2022). Source: Statista.',
      ],
      regulatoryConstraints: 'Standard US food and beverage regulations; sugar tax exposure in select municipalities; FTC oversight on acquisitions',
    },
    {
      // Source: KDP PR Newswire Feb 23 2023; KDP FY2022 earnings release; MacroTrends KDP employees
      name: 'Keurig Dr Pepper',
      revenueGrowthRate: 10.8,        // FY2022: $14.057B vs $12.683B (2021). Source: KDP PR Newswire Feb 23 2023
      ebitdaMargin: 23.6,             // Confirmed: EBITDA $3.314B / net sales $14.057B. Source: KDP FY2022 earnings
      cashPosition: 'moderate',       // Debt-to-EBITDA 2.8x as reported by management. Source: KDP FY2022 earnings
      debtToEbitda: 2.8,              // Management-disclosed figure. Source: KDP FY2022 earnings release
      rdSpendPct: 1,
      lastThreePriceMoves: [
        { direction: 'up', magnitude: 10, context: 'FY2022: Net sales grew 11% driven by pricing across Dr Pepper, 7UP, Snapple, and Keurig coffee. Source: KDP FY2022 annual results (PR Newswire Feb 23 2023).' },
        { direction: 'up', magnitude: 8,  context: '2021: Multiple pricing rounds across beverage and coffee portfolios to offset commodity inflation. Source: KDP investor materials.' },
        { direction: 'up', magnitude: 5,  context: 'Early 2023 guidance: Mid-single-digit revenue growth expected as pricing moderates from 2022 levels. Source: KDP Q4 2022 earnings Feb 23 2023.' },
      ],
      marketShareTrend: 'stable',
      headcountTrend: 'growing',      // ~27,000 (2021) → ~28,000 (2022). Source: MacroTrends KDP employee data
      geographicFocus: 'United States (primarily domestic; limited international footprint vs Coke/Pepsi)',
      competitorType: 'fast_follower',
      ceoPriorityStatement: "We accelerated our revenue growth for the fifth consecutive year, delivering 12% growth in Q4 and 11% for the full year. In 2023, we expect mid-single-digit revenue growth as the rate of pricing moderates and gross margins improve as the relationship between inflation and pricing normalises. — Bob Gamgort, KDP CEO (confirmed quote, Feb 23 2023 earnings release)",
      recentNewsSignals: [
        'FY2022: Net sales $14.1B (+10.8% YoY), fifth consecutive year of revenue growth acceleration. Source: KDP FY2022 earnings.',
        'EBITDA declined 8% in 2022 despite revenue growth — cost inflation outpaced pricing on margin line. Source: KDP 2022 results.',
        '2023 guidance: mid-single-digit revenue growth with explicit pricing moderation vs 2022 levels. Source: KDP Q4 2022 earnings Feb 2023.',
        'Strategic investments in energy drinks and cold brew platforms diversifying beyond traditional CSD and coffee.',
      ],
      regulatoryConstraints: 'Standard US food and beverage regulations; sugar tax exposure in select markets; antitrust scrutiny on coffee category consolidation',
    },
    { name: '', revenueGrowthRate: 0, ebitdaMargin: 0, cashPosition: 'moderate', debtToEbitda: 0, rdSpendPct: 0, lastThreePriceMoves: [], marketShareTrend: 'stable', headcountTrend: 'flat', geographicFocus: '', ceoPriorityStatement: '', recentNewsSignals: [], regulatoryConstraints: '', competitorType: '' },
  ],
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBar({ activeTab, setActiveTab, canRunSim }) {
  const tabs = [
    { id: 'setup',       label: 'Scenario Setup',      step: '01' },
    { id: 'competitors', label: 'Competitor Profiles',  step: '02' },
    { id: 'simulate',    label: 'Run Simulation',       step: '03', requiresReady: true },
  ]

  return (
    <div className="flex border-b border-gray-800">
      {tabs.map(tab => {
        const disabled = tab.requiresReady && !canRunSim
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            disabled={disabled}
            onClick={() => !disabled && setActiveTab(tab.id)}
            className={[
              'relative flex items-center gap-2.5 px-6 py-4 text-sm font-medium transition-colors border-b-2',
              isActive
                ? 'border-sky-400 text-white bg-gray-900/50'
                : 'border-transparent text-gray-400',
              disabled
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:text-gray-200 hover:bg-gray-900/30 cursor-pointer',
            ].join(' ')}
          >
            <span className={[
              'text-xs font-bold font-mono w-6 h-6 rounded flex items-center justify-center shrink-0',
              isActive ? 'bg-sky-400 text-gray-900' : 'bg-gray-800 text-gray-500',
            ].join(' ')}>
              {tab.step}
            </span>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-200">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

function ScenarioSetupTab({ yourCompany, setYourCompany, onLoadDemo, onLoadRealScenario, onLoadCPGScenario }) {
  function update(key, value) {
    setYourCompany(prev => ({ ...prev, [key]: value }))
  }

  const inputCls = 'w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors'
  const selectCls = `${inputCls} cursor-pointer`

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Your Company &amp; Strategic Move</h2>
          <p className="text-sm text-gray-400 mt-0.5">Define the competitive trigger you want to simulate.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onLoadRealScenario}
            title="TMT: T-Mobile Uncarrier vs AT&T, Verizon, Sprint (March 2013). Known outcome: T-Mobile gained 22M subscribers."
            className="px-4 py-2 text-sm font-medium text-emerald-400 border border-emerald-800 rounded-lg hover:bg-emerald-950 transition-colors"
          >
            Load TMT Scenario
          </button>
          <button
            onClick={onLoadCPGScenario}
            title="CPG: Coca-Cola pricing discipline vs PepsiCo & Keurig Dr Pepper (Feb 2023). Known outcome: Coke held share, PepsiCo had 9 consecutive quarters of volume decline."
            className="px-4 py-2 text-sm font-medium text-emerald-400 border border-emerald-800 rounded-lg hover:bg-emerald-950 transition-colors"
          >
            Load CPG Scenario
          </button>
          <button
            onClick={onLoadDemo}
            className="px-4 py-2 text-sm font-medium text-sky-400 border border-sky-800 rounded-lg hover:bg-sky-950 transition-colors"
          >
            Load Demo
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Company Name" hint="Your company's name as it will appear in the simulation.">
          <input
            type="text"
            value={yourCompany.name}
            onChange={e => update('name', e.target.value)}
            placeholder="e.g. TelcoX"
            className={inputCls}
          />
        </Field>

        <Field
          label="Strategic Move"
          hint="The competitive action you are announcing. Be specific — this is the trigger the competitors will react to."
        >
          <input
            type="text"
            value={yourCompany.strategicMove}
            onChange={e => update('strategicMove', e.target.value)}
            placeholder="e.g. 10% price cut on core unlimited plan"
            className={inputCls}
          />
        </Field>

        <Field
          label="Context (optional)"
          hint="Additional background that helps the simulation understand your rationale."
        >
          <textarea
            value={yourCompany.context}
            onChange={e => update('context', e.target.value)}
            placeholder="e.g. Attempting to gain market share in urban markets ahead of Q3 budget season"
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>

      {/* Market Context section */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-4 rounded-full" style={{ background: '#0ea5e9' }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4a7fa5' }}>Market Context <span className="normal-case font-normal text-gray-600">(optional — helps agents reason more accurately)</span></h3>
        </div>
        <div className="space-y-4 mt-3">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Industry">
              <select
                value={yourCompany.industry}
                onChange={e => update('industry', e.target.value)}
                className={selectCls}
                style={{ background: '#111827' }}
              >
                <option value="">Select industry...</option>
                {INDUSTRY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Your company's market role">
              <select
                value={yourCompany.companyType}
                onChange={e => update('companyType', e.target.value)}
                className={selectCls}
                style={{ background: '#111827' }}
              >
                <option value="">Select role...</option>
                {COMPETITOR_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {yourCompany.industry === 'other' && (
            <Field label="Describe your industry">
              <input
                type="text"
                value={yourCompany.industryOther}
                onChange={e => update('industryOther', e.target.value)}
                placeholder="e.g. B2B fintech infrastructure"
                className={inputCls}
              />
            </Field>
          )}

          <Field label="Market geography" hint="Where the competitive battle is playing out.">
            <input
              type="text"
              value={yourCompany.marketGeography}
              onChange={e => update('marketGeography', e.target.value)}
              placeholder="e.g. North America, EMEA, Southeast Asia"
              className={inputCls}
            />
          </Field>

          <Field
            label="Market overview"
            hint="Brief description of market dynamics, growth rate, or key trends the agents should know about."
          >
            <textarea
              value={yourCompany.marketOverview}
              onChange={e => update('marketOverview', e.target.value)}
              placeholder="e.g. Mature market with ~2% growth, high churn, mid-market consolidation driven by low-cost challengers"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>
      </div>

      {/* ── Your Financial Profile ─────────────────────────────────────── */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: '#111827', border: '1px solid #1f2937' }}>
        <div>
          <p className="text-sm font-semibold text-white">Your Financial Profile</p>
          <p className="text-xs text-gray-500 mt-0.5">Used to anchor financial estimates and assess your capacity to execute and sustain the move.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Revenue Growth Rate (%)" hint="YoY revenue growth at time of this move.">
            <input type="number" step="0.1" value={yourCompany.revenueGrowthRate}
              onChange={e => update('revenueGrowthRate', parseFloat(e.target.value) || 0)}
              className={inputCls} placeholder="e.g. 11" />
          </Field>
          <Field label="EBITDA Margin (%)">
            <input type="number" step="0.1" value={yourCompany.ebitdaMargin}
              onChange={e => update('ebitdaMargin', parseFloat(e.target.value) || 0)}
              className={inputCls} placeholder="e.g. 32" />
          </Field>
          <Field label="Debt-to-EBITDA (x)">
            <input type="number" step="0.1" value={yourCompany.debtToEbitda}
              onChange={e => update('debtToEbitda', parseFloat(e.target.value) || 0)}
              className={inputCls} placeholder="e.g. 2.5" />
          </Field>
          <Field label="R&D Spend (% of revenue)" hint="Optional — leave 0 if not applicable.">
            <input type="number" step="0.1" value={yourCompany.rdSpendPct}
              onChange={e => update('rdSpendPct', parseFloat(e.target.value) || 0)}
              className={inputCls} placeholder="e.g. 4" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Cash Position">
            <div className="flex rounded-lg overflow-hidden border border-gray-700">
              {['weak','moderate','strong'].map(v => (
                <button key={v} onClick={() => update('cashPosition', v)}
                  className="flex-1 py-2 text-xs font-semibold capitalize transition-colors"
                  style={{ background: yourCompany.cashPosition === v ? '#1e3a5f' : '#111827', color: yourCompany.cashPosition === v ? '#7dd3fc' : '#6b7280' }}>
                  {v}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Market Share Trend">
            <div className="flex rounded-lg overflow-hidden border border-gray-700">
              {['losing','stable','gaining'].map(v => (
                <button key={v} onClick={() => update('marketShareTrend', v)}
                  className="flex-1 py-2 text-xs font-semibold capitalize transition-colors"
                  style={{ background: yourCompany.marketShareTrend === v ? '#1e3a5f' : '#111827', color: yourCompany.marketShareTrend === v ? '#7dd3fc' : '#6b7280' }}>
                  {v}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Headcount Trend">
            <div className="flex rounded-lg overflow-hidden border border-gray-700">
              {['shrinking','flat','growing'].map(v => (
                <button key={v} onClick={() => update('headcountTrend', v)}
                  className="flex-1 py-2 text-xs font-semibold capitalize transition-colors"
                  style={{ background: yourCompany.headcountTrend === v ? '#1e3a5f' : '#111827', color: yourCompany.headcountTrend === v ? '#7dd3fc' : '#6b7280' }}>
                  {v}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="CEO Priority Statement" hint="Verbatim or paraphrased strategic mandate from leadership.">
          <textarea value={yourCompany.ceoPriorityStatement}
            onChange={e => update('ceoPriorityStatement', e.target.value)}
            placeholder="e.g. We will compete on brand strength and pricing discipline — not promotional discounting."
            rows={2} className={`${inputCls} resize-none`} />
        </Field>
      </div>

      {yourCompany.name && yourCompany.strategicMove && (
        <div className="p-4 bg-emerald-950 border border-emerald-800 rounded-lg">
          <p className="text-sm text-emerald-300">
            <span className="font-semibold">{yourCompany.name}</span> is announcing:{' '}
            <span className="italic text-emerald-200">{yourCompany.strategicMove}</span>
          </p>
          <p className="text-xs text-emerald-500 mt-1">
            Ready — proceed to Competitor Profiles.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Simulate tab ─────────────────────────────────────────────────────────────

const STEPS = [
  { delay: 0,     label: 'Building competitor profiles...' },
  { delay: 2000,  label: 'Round 1 — independent reactions...' },
  { delay: 6000,  label: 'Round 2 — adjusting for market dynamics...' },
  { delay: 12000, label: 'Synthesizing strategic recommendation...' },
]

function LoadingPanel() {
  const [reached, setReached] = useState(0)
  const timers = useRef([])

  useEffect(() => {
    STEPS.forEach((step, i) => {
      const t = setTimeout(() => setReached(i), step.delay)
      timers.current.push(t)
    })
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div className="py-10 space-y-4">
      <p className="text-sm font-medium text-gray-500 mb-8 uppercase tracking-wider text-xs">Simulation running — 20–40 seconds</p>
      {STEPS.map((step, i) => {
        const done = i < reached
        const active = i === reached
        return (
          <div key={i} className="flex items-center gap-4">
            <div className={[
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all',
              done   ? 'bg-emerald-500 text-white' :
              active ? 'bg-sky-500 text-white animate-pulse' :
                       'bg-gray-800 text-gray-600',
            ].join(' ')}>
              {done ? '✓' : i + 1}
            </div>
            <span className={[
              'text-sm transition-colors',
              done   ? 'text-emerald-400 font-medium' :
              active ? 'text-sky-300 font-medium' :
                       'text-gray-600',
            ].join(' ')}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SimulateTab({ isLoading, error, simulationResult, onRun, onRerun, onBack, yourCompany, competitors }) {
  const filledCompetitors = competitors.filter(c => c.name.trim())

  const hasRun = useRef(false)
  useEffect(() => {
    if (!hasRun.current && !isLoading && !simulationResult && !error) {
      hasRun.current = true
      onRun()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Simulation Results</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {yourCompany.name} · {filledCompetitors.length} competitor{filledCompetitors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-3 py-2 text-sm text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
          >
            ← Edit Scenario
          </button>
          {simulationResult && !isLoading && (
            <button
              onClick={onRerun}
              className="px-3 py-2 text-sm font-medium text-sky-400 border border-sky-800 rounded-lg hover:bg-sky-950 transition-colors"
            >
              Re-run
            </button>
          )}
        </div>
      </div>

      {isLoading && <LoadingPanel />}

      {error && !isLoading && (
        <div className="p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-sm font-semibold text-red-300">Simulation failed</p>
          <p className="text-sm text-red-400 mt-1 font-mono">{error}</p>
          <button
            onClick={onRerun}
            className="mt-3 px-3 py-1.5 text-sm font-medium text-red-400 border border-red-800 rounded-lg hover:bg-red-900 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {simulationResult && !isLoading && (
        <SimulationResults
          result={simulationResult}
          yourCompany={yourCompany}
          rawCompetitors={competitors}
        />
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('setup')
  const [activeCompetitor, setActiveCompetitor] = useState(0)
  const [yourCompany, setYourCompany] = useState({ name: '', strategicMove: '', context: '', industry: '', industryOther: '', companyType: '', marketGeography: '', marketOverview: '', revenueGrowthRate: 0, ebitdaMargin: 0, cashPosition: 'moderate', debtToEbitda: 0, rdSpendPct: 0, marketShareTrend: 'stable', headcountTrend: 'flat', ceoPriorityStatement: '', lastThreePriceMoves: [] })
  const [competitors, setCompetitors] = useState([
    defaultCompetitor(),
    defaultCompetitor(),
    defaultCompetitor(),
  ])
  const [simulationResult, setSimulationResult] = useState(() => {
    try {
      const saved = sessionStorage.getItem('competitorSim_lastResult')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const canRunSim = Boolean(yourCompany.name.trim() && yourCompany.strategicMove.trim())

  function persistResult(data) {
    try { sessionStorage.setItem('competitorSim_lastResult', JSON.stringify(data)) } catch { /* quota exceeded */ }
    setSimulationResult(data)
  }

  async function runSimulation() {
    setSimulationResult(null)
    sessionStorage.removeItem('competitorSim_lastResult')
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yourCompany, competitors }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
      persistResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function loadDemo() {
    const scenario = DEMO_SCENARIOS[Math.floor(Math.random() * DEMO_SCENARIOS.length)]
    setYourCompany(scenario.yourCompany)
    setCompetitors(scenario.competitors)
    setSimulationResult(null)
    sessionStorage.removeItem('competitorSim_lastResult')
    setError(null)
    setActiveCompetitor(0)
    setActiveTab('competitors')
  }

  function loadRealScenario() {
    setYourCompany(TMOBILE_UNCARRIER_SCENARIO.yourCompany)
    setCompetitors(TMOBILE_UNCARRIER_SCENARIO.competitors)
    setSimulationResult(null)
    sessionStorage.removeItem('competitorSim_lastResult')
    setError(null)
    setActiveCompetitor(0)
    setActiveTab('competitors')
  }

  function loadCPGScenario() {
    setYourCompany(COCACOLA_PEPSI_SCENARIO.yourCompany)
    setCompetitors(COCACOLA_PEPSI_SCENARIO.competitors)
    setSimulationResult(null)
    sessionStorage.removeItem('competitorSim_lastResult')
    setError(null)
    setActiveCompetitor(0)
    setActiveTab('competitors')
  }

  const inputCls = 'w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors'

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Header */}
      <header style={{ background: '#0b1426', borderBottom: '1px solid #1e3a5f' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: 'white' }}>
              CS
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">CompetitorSim</h1>
              <p className="text-xs" style={{ color: '#4a7fa5' }}>Strategic Intelligence Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-500">AI Engine Active</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1f2937' }}>
          <TabBar activeTab={activeTab} setActiveTab={setActiveTab} canRunSim={canRunSim} />

          <div className="p-6">
            {activeTab === 'setup' && (
              <ScenarioSetupTab
                yourCompany={yourCompany}
                setYourCompany={setYourCompany}
                onLoadDemo={loadDemo}
                onLoadRealScenario={loadRealScenario}
                onLoadCPGScenario={loadCPGScenario}
              />
            )}

            {activeTab === 'competitors' && (
              <div>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">Competitor Profiles</h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Fill in data for each competitor. Scores update in real time.
                    </p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('simulate') }}
                    disabled={!canRunSim}
                    className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: canRunSim ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : undefined, color: canRunSim ? 'white' : undefined, border: !canRunSim ? '1px solid #374151' : undefined }}
                  >
                    Run Simulation →
                  </button>
                </div>

                {/* Competitor sub-tabs */}
                <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid #1f2937' }}>
                  {competitors.map((c, i) => {
                    const label = c.name.trim() || `Competitor ${String.fromCharCode(65 + i)}`
                    const isActive = activeCompetitor === i
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveCompetitor(i)}
                        className={[
                          'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                          isActive
                            ? 'border-sky-400 text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-300',
                        ].join(' ')}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                <CompetitorProfileForm
                  competitor={competitors[activeCompetitor]}
                  index={activeCompetitor}
                  onChange={(idx, updated) =>
                    setCompetitors(prev => prev.map((c, j) => j === idx ? updated : c))
                  }
                />
              </div>
            )}

            {activeTab === 'simulate' && (
              <SimulateTab
                isLoading={isLoading}
                error={error}
                simulationResult={simulationResult}
                onRun={runSimulation}
                onRerun={() => { setSimulationResult(null); setError(null); runSimulation() }}
                onBack={() => setActiveTab('setup')}
                yourCompany={yourCompany}
                competitors={competitors}
              />
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          Powered by Anthropic Claude · Multi-agent competitive simulation
        </p>
      </main>
    </div>
  )
}
