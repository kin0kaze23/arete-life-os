/**
 * Process Input AI Action
 *
 * Handles the log bar input processing with AI.
 * Routes through the model router for provider-agnostic execution.
 */

import type { MemoryEntry, PromptConfig, UserProfile } from '../../data/types';
import { LOG_BAR_INGEST_PROMPT, buildMemoryContext, buildCompactProfile } from '../../ai/prompts';
import { fillTemplate } from '../_aiConfig';
import { modelRouter } from '../_modelRouter';

export interface ProcessInputParams {
  input: string;
  history: MemoryEntry[];
  activeProfile: UserProfile;
  files?: { data: string; mimeType: string }[];
  promptConfig?: PromptConfig;
  familyMembers?: UserProfile[];
  fileMeta?: { name?: string; mimeType: string; size?: number }[];
  currentDate?: string;
}

export interface ProcessInputResult {
  items?: any[];
  facts?: any[];
  proposedUpdates?: any[];
  [key: string]: any;
}

/**
 * Build the prompt for log bar processing
 */
const buildPrompt = (params: ProcessInputParams): string => {
  const { input, history, activeProfile, promptConfig, familyMembers = [], fileMeta = [] } = params;

  // Defensive: ensure relationships is an array (legacy vaults may not have this)
  const relationships = Array.isArray(activeProfile.relationships)
    ? activeProfile.relationships
    : [];

  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify?.name || 'User',
    role: m.role,
    relationToActive: relationships.find((r) => r.relatedToUserId === m.id)?.type || 'Self',
  }));

  const template =
    promptConfig?.template && promptConfig.template.includes('"items"')
      ? promptConfig.template
      : LOG_BAR_INGEST_PROMPT;

  const compactProfile = buildCompactProfile(activeProfile);

  return fillTemplate(template, {
    profile: JSON.stringify(compactProfile),
    family: JSON.stringify(memberContext),
    history: JSON.stringify(buildMemoryContext(history, [], 10)),
    input,
    fileMeta: JSON.stringify(fileMeta || []),
    currentDate: params.currentDate || new Date().toISOString(),
  });
};

/**
 * Process user input through AI via the model router
 */
export async function processInput(params: ProcessInputParams): Promise<ProcessInputResult> {
  const { input, files } = params;

  if (!input || typeof input !== 'string') {
    console.warn('[processInput] Invalid input, returning empty result');
    return {};
  }

  const prompt = buildPrompt(params);

  return await modelRouter.generateJSON('processInput', prompt, undefined, {
    files,
  });
}
