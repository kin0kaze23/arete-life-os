import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { minimatch } from 'minimatch';
import { callGemini } from './ai-client.js';

const SKILL_MAPPING_PATH = path.join(process.cwd(), 'scripts/devops/skill-mapping.json');
const SKILLS_DIR = path.join(process.cwd(), '.agent/skills');

// Critical files that must not be overwritten with stubs
const PROTECTED_FILES = [
  'dashboard/DashboardView.tsx',
  'dashboard/index.ts',
  'data/index.ts',
  'data/types.ts',
  'core/useAura.ts',
  'app/App.tsx',
  'index.tsx',
];

const MIN_LINES_FOR_PROTECTED = 10;
const MAX_SELF_CORRECTION_ATTEMPTS = 2;

// ─── Dynamic Context Extraction ─────────────────────────────────────────────

/**
 * Extracts TypeScript interfaces/types relevant to the task files.
 * Reads data/types.ts and extracts interface definitions that the task might need.
 */
function extractRelevantTypes() {
  const typesPath = path.join(process.cwd(), 'data/types.ts');
  try {
    const typesContent = fs.readFileSync(typesPath, 'utf-8');

    // Always include core types used across dashboard components
    const coreTypes = [
      'Category',
      'MemoryItem',
      'MemoryEntry',
      'DailyTask',
      'TimelineEvent',
      'BlindSpot',
      'Recommendation',
      'Goal',
      'ProactiveInsight',
      'Claim',
      'UserProfile',
      'AlwaysChip',
      'FinanceMetrics',
      'Source',
      'PillarStatus',
    ];

    const extracted = [];

    // Extract enums
    const enumRegex = /export enum (\w+)\s*\{[^}]+\}/g;
    let match;
    while ((match = enumRegex.exec(typesContent)) !== null) {
      if (coreTypes.includes(match[1])) {
        extracted.push(match[0]);
      }
    }

    // Extract interfaces
    const interfaceRegex = /export interface (\w+)\s*\{/g;
    while ((match = interfaceRegex.exec(typesContent)) !== null) {
      if (coreTypes.includes(match[1])) {
        // Find the closing brace — handle nested braces
        const startIdx = match.index;
        let depth = 0;
        let endIdx = startIdx;
        for (let i = typesContent.indexOf('{', startIdx); i < typesContent.length; i++) {
          if (typesContent[i] === '{') depth++;
          if (typesContent[i] === '}') depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
        extracted.push(typesContent.substring(startIdx, endIdx));
      }
    }

    // Extract type aliases
    const typeAliasRegex = /export type (\w+)\s*=[^;]+;/g;
    while ((match = typeAliasRegex.exec(typesContent)) !== null) {
      if (coreTypes.includes(match[1])) {
        extracted.push(match[0]);
      }
    }

    if (extracted.length > 0) {
      return `### ACTUAL TYPE DEFINITIONS (from data/types.ts — use ONLY these exact field names):\n\`\`\`typescript\n${extracted.join('\n\n')}\n\`\`\``;
    }
  } catch (err) {
    console.warn('  ⚠️  Could not read types.ts:', err.message);
  }

  return '';
}

/**
 * Extracts codebase conventions from existing files.
 */
function extractCodebaseConventions() {
  const conventions = [];

  // Check import style from a known good file
  const focusListPath = path.join(process.cwd(), 'dashboard/FocusList.tsx');
  try {
    const content = fs.readFileSync(focusListPath, 'utf-8');
    const firstLines = content.split('\n').slice(0, 20).join('\n');
    conventions.push(
      `### Import pattern (from FocusList.tsx):\n\`\`\`typescript\n${firstLines}\n\`\`\``
    );
  } catch {
    /* skip */
  }

  // Check barrel export pattern
  const indexPath = path.join(process.cwd(), 'dashboard/index.ts');
  try {
    const content = fs.readFileSync(indexPath, 'utf-8');
    conventions.push(
      `### Barrel export pattern (dashboard/index.ts):\n\`\`\`typescript\n${content}\n\`\`\``
    );
  } catch {
    /* skip */
  }

  return conventions.length > 0
    ? `CODEBASE CONVENTIONS (follow these patterns exactly):\n${conventions.join('\n\n')}`
    : '';
}

// ─── HARD RULES ─────────────────────────────────────────────────────────────

function loadHardRules() {
  const agentPath = path.join(process.cwd(), '.agent/core/AGENT.md');
  try {
    const content = fs.readFileSync(agentPath, 'utf-8');
    const hardRulesMatch = content.match(/## HARD RULES[\s\S]*?(?=\n## |$)/);
    if (hardRulesMatch) return hardRulesMatch[0];
  } catch {
    /* fallback below */
  }

  return `## HARD RULES
1. DATA LAYER FIRST: Verify useAura() property exists before referencing it.
2. INTEGRATION VERIFICATION: Wire component into parent + barrel export in the same task.
3. TYPECHECK IS THE GATE: npm run typecheck must pass. Vite build does NOT catch TS errors.
4. NO ORPHANED COMPONENTS: Trace App.tsx -> parent -> your component.
5. NO PHANTOM TYPES: Only import types that exist in data/types.ts.
6. NO MOCK DATA: Use real data or empty state, never hardcoded placeholders.
7. USE EXISTING DATA: Map to existing useAura properties before inventing new ones.
8. NAMED EXPORTS ONLY: Use "export const ComponentName" not "export default".`;
}

// ─── File Reading ───────────────────────────────────────────────────────────

function readExistingFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

// ─── Main Implementation ────────────────────────────────────────────────────

/**
 * Implements a task using AI code generation with self-correction.
 */
export async function implementTask(task, context) {
  console.log(`\n  🎯 Implementing: ${task.title}`);

  // 1. Load all context
  const relevantSkills = getRelevantSkillsForFiles(task.files);
  const skillContents = loadSkills(relevantSkills);
  const hardRules = loadHardRules();
  const typeDefinitions = extractRelevantTypes();
  const conventions = extractCodebaseConventions();

  console.log(`  📚 Skills: ${relevantSkills.join(', ') || 'General'}`);
  console.log(`  📋 Types injected: ${typeDefinitions ? 'yes' : 'no'}`);

  // 2. Read existing files
  const existingFiles = {};
  for (const file of task.files) {
    const content = readExistingFile(file);
    if (content) existingFiles[file] = content;
  }

  const existingFilesContext =
    Object.entries(existingFiles).length > 0
      ? Object.entries(existingFiles)
          .map(
            ([f, c]) =>
              `### EXISTING FILE: ${f} (${c.split('\n').length} lines)\n\`\`\`typescript\n${c}\n\`\`\``
          )
          .join('\n\n')
      : 'No existing files — these will be new files.';

  // 3. Build the initial prompt
  const basePrompt = buildPrompt({
    hardRules,
    skillContents,
    typeDefinitions,
    conventions,
    task,
    existingFilesContext,
    context,
  });

  // 4. Generate code with self-correction loop
  let lastErrors = null;
  let attempt = 0;

  while (attempt <= MAX_SELF_CORRECTION_ATTEMPTS) {
    attempt++;
    const isRetry = attempt > 1;

    let prompt = basePrompt;
    if (isRetry && lastErrors) {
      prompt += `\n\n⚠️ SELF-CORRECTION ATTEMPT ${attempt}/${MAX_SELF_CORRECTION_ATTEMPTS + 1}:
Your previous output had TypeScript errors. Fix them:

\`\`\`
${lastErrors}
\`\`\`

Common fixes:
- If "has no exported member 'X'": check the ACTUAL TYPE DEFINITIONS above for correct type names
- If "Property 'X' does not exist on type 'Y'": check the interface definition above for Y's actual fields
- If "not assignable to type 'ReactNode'": you're rendering an object directly — render its string property instead
- If using "export default": change to "export const ComponentName: React.FC<Props> = ..."
- Ensure all "content" fields are non-null strings of valid TypeScript code (no markdown fences)
`;
      console.log(`  🔄 Self-correction attempt ${attempt}...`);
    }

    // Call AI
    console.log(`  🧠 AI is ${isRetry ? 're-' : ''}writing code...`);
    let result;
    try {
      result = await callGemini({
        prompt,
        json: true,
        skipCascade: true,
        model: process.env.GROQ_MODEL_ESCALATE || 'llama-3.3-70b-versatile',
        temperature: isRetry ? 0.1 : 0.2, // Lower temp on retry for more deterministic output
      });
    } catch (err) {
      console.error(`  ❌ AI call failed: ${err.message}`);
      return { changes: [], typecheckPassed: true, skipped: true };
    }

    // Validate response
    if (!result || !result.changes || !Array.isArray(result.changes)) {
      console.error('  ❌ AI returned invalid response (no changes array)');
      if (attempt <= MAX_SELF_CORRECTION_ATTEMPTS) {
        lastErrors =
          'AI returned invalid JSON response without a "changes" array. Return valid JSON with the schema specified.';
        continue;
      }
      return { changes: [], typecheckPassed: true, skipped: true };
    }

    const validChanges = validateChanges(result.changes, existingFiles);

    if (validChanges.length === 0) {
      console.warn('  ⚠️  All changes were rejected by validation.');
      if (attempt <= MAX_SELF_CORRECTION_ATTEMPTS) {
        lastErrors =
          'All file changes were rejected: null content or stub overwrites of existing files. Ensure every "content" field is a non-null string with the FULL file content.';
        continue;
      }
      return { changes: [], typecheckPassed: true, skipped: true };
    }

    // Apply changes
    applyChanges(validChanges);

    // Typecheck
    console.log('  📋 Running post-task typecheck...');
    const { passed, errors } = runTypecheckWithErrors();

    if (passed) {
      console.log('  ✅ Post-task typecheck: PASS');
      result.typecheckPassed = true;
      result.attempts = attempt;
      return result;
    }

    // Typecheck failed
    console.error(`  ❌ Typecheck failed (attempt ${attempt}/${MAX_SELF_CORRECTION_ATTEMPTS + 1})`);

    // Rollback before retry or final failure
    rollbackChanges(validChanges, existingFiles);

    if (attempt <= MAX_SELF_CORRECTION_ATTEMPTS) {
      lastErrors = errors;
      console.log('  🔄 Will retry with error context...');
    } else {
      console.error('  ❌ All self-correction attempts exhausted. Task failed.');
      result.typecheckPassed = false;
      result.rolledBack = true;
      result.attempts = attempt;
      return result;
    }
  }
}

// ─── Prompt Builder ─────────────────────────────────────────────────────────

function buildPrompt({
  hardRules,
  skillContents,
  typeDefinitions,
  conventions,
  task,
  existingFilesContext,
  context,
}) {
  return `You are a senior developer for Glance OS (React 19 + TypeScript + Vite + Tailwind).
Your output MUST be pure JSON — no markdown fences, no explanation text, just the JSON object.

${hardRules}

${typeDefinitions}

${conventions}

SKILLS TO FOLLOW:
${skillContents}

TASK:
${task.description}

FILES TO MODIFY/CREATE:
${task.files.join('\n')}

EXISTING FILE CONTENTS — preserve the full structure. Only add/modify what's needed:
${existingFilesContext}

CONTEXT:
${JSON.stringify(context, null, 2)}

ACCEPTANCE CRITERIA:
${task.acceptanceCriteria.join('\n')}

CRITICAL CONSTRAINTS:
- File paths have NO "src/" prefix. Files are at repo root: dashboard/*.tsx, data/types.ts
- NAMED EXPORTS ONLY: "export const ComponentName: React.FC<Props> = ..." — NEVER "export default"
- Only use the EXACT type names and field names shown in the TYPE DEFINITIONS above
- Do NOT invent types like "Insights", "ConcernItem", "Risk", "Strength", "LifeDimension"
- BlindSpot fields: id, ownerId, createdAt, signal, why, confidence, severity, actions
- ProactiveInsight fields: id, title, description, type, category, feedback
- Recommendation fields: id, ownerId, category, title, description, impactScore, rationale, steps, estimatedTime, inputs, definitionOfDone, risks, status, userFeedback, needsReview
- Goal fields: id, ownerId, title, targetDate, category, progress, status, createdAt
- Use Tailwind dark glassmorphism theme (bg-slate-900/*, border-white/5, text-slate-*)
- For modify type: include the COMPLETE file content with changes integrated, not snippets

OUTPUT FORMAT — return ONLY this JSON object (no markdown, no backticks wrapping it):
{
    "changes": [
        { "file": "path/to/file.tsx", "content": "Full file content as string", "type": "create" | "modify" }
    ],
    "skillsFollowed": ["skill-name"],
    "rationale": "Brief explanation",
    "parentUpdates": ["parent files updated for wiring"]
}`;
}

// ─── Typecheck ──────────────────────────────────────────────────────────────

/**
 * Runs typecheck and returns pass/fail with error details for self-correction.
 */
function runTypecheckWithErrors() {
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe', timeout: 120000 });
    return { passed: true, errors: '' };
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorLines = output
      .split('\n')
      .filter((l) => l.includes('error TS'))
      .slice(0, 15);
    errorLines.forEach((l) => console.error(`     ${l}`));
    return { passed: false, errors: errorLines.join('\n') };
  }
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateChanges(changes, existingFiles) {
  const valid = [];

  for (const change of changes) {
    if (!change.file || !change.content || typeof change.content !== 'string') {
      console.warn(`  ⚠️  Rejected: ${change.file || 'unknown'} — null/empty content`);
      continue;
    }

    // Strip markdown fences if the model wrapped the content
    if (change.content.startsWith('```')) {
      change.content = change.content
        .replace(/^```(?:typescript|tsx|ts)?\n?/, '')
        .replace(/\n?```\s*$/, '');
    }

    // Reject stub overwrites of protected files
    if (PROTECTED_FILES.includes(change.file) && existingFiles[change.file]) {
      const existingLines = existingFiles[change.file].split('\n').length;
      const newLines = change.content.split('\n').length;

      if (newLines < existingLines * 0.5 && existingLines > MIN_LINES_FOR_PROTECTED) {
        console.warn(
          `  ⚠️  Rejected: ${change.file} — new content (${newLines} lines) is <50% of existing (${existingLines} lines). Stub overwrite.`
        );
        continue;
      }
    }

    // Auto-fix export default → named export
    if (change.content.includes('export default') && change.file.endsWith('.tsx')) {
      console.warn(`  ⚠️  Auto-fixing "export default" in ${change.file}`);
      const componentMatch = change.file.match(/([A-Z][a-zA-Z]+)\./);
      if (componentMatch) {
        const name = componentMatch[1];
        change.content = change.content
          .replace(
            new RegExp(`export default function ${name}`),
            `export const ${name}: React.FC = function ${name}`
          )
          .replace(new RegExp(`^export default ${name};?\\s*$`, 'm'), '');
        // Also handle: const X = ...; export default X;
        if (change.content.includes('export default')) {
          change.content = change.content.replace(/export default\s+/, 'export ');
        }
      }
    }

    valid.push(change);
  }

  return valid;
}

// ─── Apply / Rollback ───────────────────────────────────────────────────────

function applyChanges(changes) {
  for (const change of changes) {
    const fullPath = path.join(process.cwd(), change.file);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`  💾 Saving: ${change.file} (${change.content.split('\n').length} lines)`);
    fs.writeFileSync(fullPath, change.content);
  }
}

function rollbackChanges(changes, existingFiles) {
  for (const change of changes) {
    const fullPath = path.join(process.cwd(), change.file);
    if (existingFiles[change.file]) {
      console.log(`  ↩️  Restoring: ${change.file}`);
      fs.writeFileSync(fullPath, existingFiles[change.file]);
    } else if (change.type === 'create') {
      console.log(`  🗑️  Removing: ${change.file}`);
      try {
        fs.unlinkSync(fullPath);
      } catch {
        /* ok */
      }
    }
  }
  console.log('  ✅ Rollback complete.');
}

// ─── Skill Loading ──────────────────────────────────────────────────────────

function getRelevantSkillsForFiles(files) {
  if (!fs.existsSync(SKILL_MAPPING_PATH)) return [];

  const { mappings } = JSON.parse(fs.readFileSync(SKILL_MAPPING_PATH, 'utf-8'));
  const skills = new Set();

  for (const file of files) {
    for (const [pattern, skillList] of Object.entries(mappings)) {
      if (minimatch(file, pattern)) {
        skillList.forEach((s) => skills.add(s));
      }
    }
  }

  return Array.from(skills);
}

function loadSkills(skillNames) {
  if (skillNames.length === 0) return 'Follow general coding best practices.';

  return skillNames
    .map((skillName) => {
      const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
      try {
        return `### SKILL: ${skillName}\n${fs.readFileSync(skillPath, 'utf-8')}`;
      } catch (e) {
        return '';
      }
    })
    .join('\n\n');
}
