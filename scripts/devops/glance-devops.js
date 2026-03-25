import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { digestPlan } from './plan-digester.js';
import { implementTask } from './task-executor.js';
import { runFinalEvaluation } from './quality-evaluator.js';
import { getSessionSummary } from './ai-client.js';

async function main() {
  const args = process.argv.slice(2);
  const isManual = args.includes('--manual');
  const isDigestOnly = args.includes('--digest');
  const planPath = args.find((a) => !a.startsWith('--')) || '.agent/plans/product-strategy.md';
  const checkpointArg = args.find((a) => a.startsWith('--checkpoint'));
  const checkpointCount = checkpointArg ? parseInt(checkpointArg.split('=')[1]) || 5 : 0;
  const startFromArg = args.find((a) => a.startsWith('--start-from'));
  const startFrom = startFromArg ? parseInt(startFromArg.split('=')[1]) || 0 : 0;

  console.log(`\n🚀 Starting Glance DevOps [Plan: ${planPath}]`);

  if (!fs.existsSync(planPath)) {
    console.error(`❌ Error: Plan file not found: ${planPath}`);
    process.exit(1);
  }

  // 1. Digest Phase (or load existing breakdown if resuming)
  let breakdown;
  const planName = path.basename(planPath, '.md');
  const existingBreakdownPath = path.join(
    process.cwd(),
    '.agent/tasks',
    planName,
    'task-breakdown.json'
  );

  if (startFrom > 0 && fs.existsSync(existingBreakdownPath)) {
    console.log('\n--- Resuming from existing breakdown ---');
    breakdown = JSON.parse(fs.readFileSync(existingBreakdownPath, 'utf-8'));
  } else {
    console.log('\n--- PHASE 1: Plan Digestion ---');
    breakdown = await digestPlan(planPath);
  }

  if (isDigestOnly) {
    console.log('\n✅ Digestion complete. Stopping as requested (--digest).');
    return;
  }

  // 2. Implementation Phase
  console.log('\n--- PHASE 2: Implementation Loop ---');
  let completedTasks = 0;
  let consecutiveFailures = 0;
  let totalTaskIndex = 0;

  for (const phase of breakdown.phases) {
    console.log(`\n📦 Starting Phase: ${phase.name}`);

    for (const task of phase.tasks) {
      totalTaskIndex++;

      // Skip tasks before start-from index
      if (totalTaskIndex <= startFrom) {
        console.log(`  ⏭️  Skipping task ${totalTaskIndex} (resuming from ${startFrom + 1})`);
        completedTasks++;
        continue;
      }

      console.log(`\n[Task ${totalTaskIndex}] Processing: ${task.title}`);

      if (isManual) {
        console.log('  📋 Manual mode — proceeding with implementation.');
      }

      try {
        const result = await implementTask(task, { planName: breakdown.planName });
        completedTasks++;

        // Track typecheck failures from task-executor
        if (result.typecheckPassed === false) {
          consecutiveFailures++;
          console.warn(
            `  ⚠️  Task completed but typecheck failed. Consecutive failures: ${consecutiveFailures}`
          );

          // Stop after 3 consecutive typecheck failures to prevent cascading errors
          if (consecutiveFailures >= 3) {
            console.error('\n🛑 Too many consecutive typecheck failures (3+). Stopping.');
            console.error('Fix the TypeScript errors before continuing:');
            console.error(`  npm run auto -- ${planPath} --start-from=${totalTaskIndex}`);
            break;
          }
        } else {
          consecutiveFailures = 0; // Reset on success
        }

        // Checkpoint logic
        if (checkpointCount > 0 && completedTasks % checkpointCount === 0) {
          console.log(`\n⏸️  Checkpoint Reached (${completedTasks} tasks). Stopping for review.`);
          console.log(`To continue: npm run auto -- ${planPath} --start-from=${totalTaskIndex}`);
          return;
        }
      } catch (error) {
        console.error(`\n❌ Error implementing task ${task.id}:`, error.message);
        consecutiveFailures++;
        if (consecutiveFailures >= 3) {
          console.error('\n🛑 Too many consecutive failures. Stopping.');
          break;
        }
        console.log('Skipping to next task...');
      }
    }

    if (consecutiveFailures >= 3) break;
  }

  // 3. Evaluation Phase — runs REAL quality checks (typecheck, lint, build)
  console.log('\n--- PHASE 3: Final Evaluation ---');
  const evaluation = await runFinalEvaluation(breakdown);

  // 4. Reporting
  const totalTasks = breakdown.phases.reduce((acc, p) => acc + p.tasks.length, 0);
  const sessionSummary = getSessionSummary();
  const changedFiles = getChangedFiles();

  const reportPath = path.join(process.cwd(), '.agent/reports', `${breakdown.planName}-report.md`);
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportContent = `# DevOps Automation Report: ${breakdown.planName}
**Generated**: ${new Date().toLocaleString()}

## Summary
- **Total tasks**: ${totalTasks}
- **Completed**: ${completedTasks}
- **Status**: ${evaluation.passed ? '✅ ALL QUALITY GATES PASSED' : '❌ QUALITY GATE FAILED'}

## Quality Metrics
- **Typecheck**: ${evaluation.quality.typecheck ? '✅ Pass' : '❌ FAIL'}
- **Lint**: ${evaluation.quality.lint ? '✅ Pass' : '❌ FAIL'}
- **Build**: ${evaluation.quality.build ? '✅ Pass' : '❌ FAIL'}
- **Architecture Drift**: ${evaluation.architecture.passed ? '✅ Clean' : '⚠️ Drift detected'}
- **Skill Compliance**: ${evaluation.skillCompliance.score}/100

## Cost
- **Session cost**: ${sessionSummary.costFormatted}
- **Models used**: ${JSON.stringify(sessionSummary.modelUsage)}

## Changed Files
${changedFiles.map((f) => `- ${f}`).join('\n') || 'No files tracked via git diff'}

---
*Glance OS DevOps Automation*
`;

  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n${evaluation.passed ? '✅' : '❌'} DevOps Loop Complete!`);
  console.log(`📝 Report generated at: ${reportPath}`);
  console.log(`💰 Total cost: ${sessionSummary.costFormatted}`);

  if (!evaluation.passed) {
    process.exit(1);
  }
}

function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only', {
      cwd: process.cwd(),
      stdio: 'pipe',
      timeout: 10000,
    });
    return output.toString().trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

main().catch((err) => {
  console.error('\n💥 Fatal Error in DevOps Loop:', err);
  process.exit(1);
});
