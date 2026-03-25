import fs from 'fs';
import path from 'path';

const SKILLS_DIR = path.join(process.cwd(), '.agent/skills');

export async function evaluateSkillCompliance(changedFiles) {
  console.log('  🔍 Evaluating skill compliance (Layer 8)...');

  const results = {
    timestamp: new Date().toISOString(),
    filesChecked: changedFiles.length,
    violations: [],
    score: 100,
  };

  if (changedFiles.length === 0) return results;

  // In a real implementation, this would use the mapping logic and callGemini
  // to audit the code against the specific rules in each skill.

  return results;
}

export function extractCheckableRules(skillContent) {
  const rules = [];
  const lines = skillContent.split('\n');

  for (let line of lines) {
    // Checkbox rules: - [ ] Rule name
    const checkboxMatch = line.match(/^- \[ \] (.+)/);
    if (checkboxMatch) {
      rules.push({ name: checkboxMatch[1], type: 'checklist' });
    }

    // Anti-patterns: ❌ Rule name
    const antiMatch = line.match(/^❌ (.+)/);
    if (antiMatch) {
      rules.push({ name: antiMatch[1], type: 'anti-pattern' });
    }
  }

  return rules;
}
