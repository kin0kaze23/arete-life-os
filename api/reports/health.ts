import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HEALTH_REPORT_PROMPT } from '../../ai/prompts';
import { runReport } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return runReport(req, res, 'reportHealth', HEALTH_REPORT_PROMPT);
}
