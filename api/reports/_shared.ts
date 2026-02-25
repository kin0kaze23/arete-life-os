import type { VercelRequest, VercelResponse } from '@vercel/node';
import { modelRouter } from '../_modelRouter';

export const runReport = async (
  req: VercelRequest,
  res: VercelResponse,
  action: string,
  basePrompt: string
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    const prompt = `${basePrompt}\n\nINPUT:\n${JSON.stringify(payload)}`;
    const report = await modelRouter.generateJSON(action, prompt);
    return res.status(200).json(report);
  } catch (error: any) {
    console.error(`[reports:${action}]`, error?.message || error);
    return res.status(500).json({ error: error?.message || 'Failed to generate report' });
  }
};
