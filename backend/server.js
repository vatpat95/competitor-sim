import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { runSimulation } from './agents.js';
import { buildCompetitorProfile } from './profileBuilder.js';

const app = express();
app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
app.use(express.json());

// ── GET /api/health ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── POST /api/simulate ───────────────────────────────────────────────────────
app.post('/api/simulate', async (req, res) => {
  try {
    const { yourCompany, competitors } = req.body;

    if (!yourCompany?.name || !yourCompany?.strategicMove) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const enrichedProfiles = competitors.map(buildCompetitorProfile);

    const result = await runSimulation({ yourCompany, competitors: enrichedProfiles });

    res.json(result);
  } catch (err) {
    console.error('[server] /api/simulate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(3001, () => {
  console.log('CompetitorSim backend running on port 3001');
});
