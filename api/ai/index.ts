// Consolidated AI API - all AI endpoints in one function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateInsights } from '../insightEngine.js';
import { detectPatterns } from '../patternDetection.js';
import { getBenchmark } from '../benchmarks.js';
import { processInput } from '../aiActions/processInput.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;
  
  try {
    switch (action) {
      case 'insights':
        return await handleInsights(req, res);
      case 'patterns':
        return await handlePatterns(req, res);
      case 'benchmark':
        return await handleBenchmark(req, res);
      case 'process':
        return await handleProcess(req, res);
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal error' });
  }
}

async function handleInsights(req: VercelRequest, res: VercelResponse) {
  const { memory, profile } = req.body;
  const insights = await generateInsights(memory, profile);
  return res.json({ insights });
}

async function handlePatterns(req: VercelRequest, res: VercelResponse) {
  const { memory } = req.body;
  const patterns = await detectPatterns(memory);
  return res.json({ patterns });
}

async function handleBenchmark(req: VercelRequest, res: VercelResponse) {
  const { dimension, age, role } = req.query;
  const benchmark = await getBenchmark(dimension as string, Number(age), role as string);
  return res.json({ benchmark });
}

async function handleProcess(req: VercelRequest, res: VercelResponse) {
  const { input, userId } = req.body;
  const result = await processInput(input, userId);
  return res.json({ result });
}
