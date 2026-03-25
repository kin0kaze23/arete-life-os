import { execSync } from 'child_process';
import { evaluateSkillCompliance } from './skill-compliance-evaluator.js';

export async function runFinalEvaluation(breakdown) {
  console.log('\n🔍 Running final evaluation...\n');

  const evaluation = {
    timestamp: new Date().toISOString(),
    quality: await runQualityChecks(),
    architecture: await runArchitectureDriftCheck(),
    cost: await runCostAnalysis(),
    skills: await extractNewSkills(),
    skillCompliance: await evaluateSkillCompliance(await getChangedFiles()),
  };

  // HARD GATE: If quality checks fail, mark evaluation as failed
  const qf = evaluation.quality;
  evaluation.passed = qf.typecheck && qf.build && qf.lint;

  if (!evaluation.passed) {
    console.error('\n❌ QUALITY GATE FAILED — fix errors before shipping.');
    if (!qf.typecheck) console.error('   ❌ TypeScript errors detected');
    if (!qf.build) console.error('   ❌ Build failed');
    if (!qf.lint) console.error('   ❌ Lint errors detected');
  } else {
    console.log('\n✅ All quality checks passed.');
  }

  return evaluation;
}

/**
 * Runs REAL quality checks via npm scripts.
 * This is the HARD GATE — no mocks, no stubs.
 */
async function runQualityChecks() {
  const results = { typecheck: false, build: false, lint: false, tests: true };

  // 1. TypeScript strict check (CRITICAL — Vite build does NOT catch type errors)
  console.log('  📋 Running typecheck...');
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe', timeout: 120000 });
    results.typecheck = true;
    console.log('  ✅ Typecheck: PASS');
  } catch (error) {
    results.typecheck = false;
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    console.error('  ❌ Typecheck: FAIL');
    // Show first 20 lines of errors
    const lines = output.split('\n').slice(0, 20);
    lines.forEach((l) => console.error(`     ${l}`));
  }

  // 2. Lint check
  console.log('  📋 Running lint...');
  try {
    execSync('npm run lint', { cwd: process.cwd(), stdio: 'pipe', timeout: 120000 });
    results.lint = true;
    console.log('  ✅ Lint: PASS');
  } catch (error) {
    results.lint = false;
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    console.error('  ❌ Lint: FAIL');
    const lines = output.split('\n').slice(0, 20);
    lines.forEach((l) => console.error(`     ${l}`));
  }

  // 3. Production build
  console.log('  📋 Running build...');
  try {
    execSync('npm run build', { cwd: process.cwd(), stdio: 'pipe', timeout: 180000 });
    results.build = true;
    console.log('  ✅ Build: PASS');
  } catch (error) {
    results.build = false;
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    console.error('  ❌ Build: FAIL');
    const lines = output.split('\n').slice(0, 20);
    lines.forEach((l) => console.error(`     ${l}`));
  }

  return results;
}

/**
 * Run architecture drift check script if available.
 */
async function runArchitectureDriftCheck() {
  try {
    execSync('bash scripts/architecture-drift-check.sh --strict', {
      cwd: process.cwd(),
      stdio: 'pipe',
      timeout: 60000,
    });
    return { passed: true, drifts: [] };
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    console.warn('  ⚠️  Architecture drift check had issues:', output.substring(0, 200));
    return { passed: false, drifts: [output.substring(0, 500)] };
  }
}

/**
 * Cost analysis from session usage (best-effort).
 */
async function runCostAnalysis() {
  // Mode3 tracks cost in ai-client.js sessionCost — but it's in-process.
  // We report what we can; the report generator will pull session summary.
  return { note: 'See session summary in report for actual cost data' };
}

async function extractNewSkills() {
  return [];
}

/**
 * Gets list of changed files from git for compliance checking.
 */
async function getChangedFiles() {
  try {
    const output = execSync(
      'git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only',
      {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 10000,
      }
    );
    return output.toString().trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}
