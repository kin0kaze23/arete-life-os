import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  HEALTH_REPORT_PROMPT,
  FINANCIAL_REPORT_PROMPT,
  FAITH_REPORT_PROMPT,
  HABITS_REPORT_PROMPT,
} from '../../ai/prompts.js';
import { runReport } from './_shared.js';

const REPORT_CONFIG: Record<string, { action: string; prompt: string }> = {
  health: { action: 'reportHealth', prompt: HEALTH_REPORT_PROMPT },
  financial: { action: 'reportFinancial', prompt: FINANCIAL_REPORT_PROMPT },
  faith: { action: 'reportFaith', prompt: FAITH_REPORT_PROMPT },
  habits: { action: 'reportHabits', prompt: HABITS_REPORT_PROMPT },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const type = req.query.type as string;
  const config = REPORT_CONFIG[type];
  if (!config) {
    return res.status(404).json({ error: `Unknown report type: ${type}` });
  }
  return runReport(req, res, config.action, config.prompt);
}
