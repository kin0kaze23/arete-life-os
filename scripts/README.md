# Scripts Directory

Quality checking, automation, and utility scripts for the project.

## 🎯 Master Script

**[quality.sh](./quality.sh)** - Unified quality checking with 3 tiers

```bash
./scripts/quality.sh --fast      # 5s - Build + Lint
./scripts/quality.sh --standard  # 30s - + Security, Cost
./scripts/quality.sh --full      # 2min - + A11y, Perf, Arch
```

**npm aliases**:

```bash
npm run check          # FAST
npm run check:standard # STANDARD
npm run check:full     # FULL
```

---

## 📦 Quality Scripts (Integrated)

These run automatically via `quality.sh` but can also run standalone:

| Script                                                       | Purpose               | Usage                                   |
| ------------------------------------------------------------ | --------------------- | --------------------------------------- |
| [accessibility-check.sh](./accessibility-check.sh)           | WCAG 2.1 AA testing   | `./scripts/accessibility-check.sh`      |
| [architecture-drift-check.sh](./architecture-drift-check.sh) | Doc sync verification | `./scripts/architecture-drift-check.sh` |
| [cost-guardrail.sh](./cost-guardrail.sh)                     | AI cost control       | `./scripts/cost-guardrail.sh`           |
| [latency-baseline.sh](./latency-baseline.sh)                 | Performance baseline  | `./scripts/latency-baseline.sh --check` |
| [ui-change-check.sh](./ui-change-check.sh)                   | UI vs core guard      | `./scripts/ui-change-check.sh`          |

---

## 🔧 Utility Scripts

| Script                                         | Purpose                  |
| ---------------------------------------------- | ------------------------ |
| [doctor.sh](./doctor.sh)                       | Health check             |
| [run-ui-safe.sh](./run-ui-safe.sh)             | Safe UI testing          |
| [run-ui-smoke.sh](./run-ui-smoke.sh)           | Smoke tests              |
| [update-status.sh](./update-status.sh)         | Update CURRENT_STATUS.md |
| [setup-hooks.sh](./setup-hooks.sh)             | Git hooks setup          |
| [sync-main.sh](./sync-main.sh)                 | Sync with main branch    |
| [archive-learnings.sh](./archive-learnings.sh) | Archive old learnings    |
| [propose-skill.sh](./propose-skill.sh)         | Generate new skill       |

---

## 🤖 DevOps Scripts (Mode 3)

Located in `scripts/devops/`:

| Script                                                | Purpose           |
| ----------------------------------------------------- | ----------------- |
| [glance-devops.js](./devops/glance-devops.js)         | Main orchestrator |
| [ai-client.js](./devops/ai-client.js)                 | Gemini API client |
| [plan-digester.js](./devops/plan-digester.js)         | Plan → Tasks      |
| [task-executor.js](./devops/task-executor.js)         | Task → Code       |
| [quality-evaluator.js](./devops/quality-evaluator.js) | Final evaluation  |

**Usage**:

```bash
npm run auto              # Full automation
npm run auto:fast         # Less frequent checkpoints
npm run auto:careful      # More frequent checkpoints
npm run devops:digest --  # Preview tasks only
```

---

## 📊 Script Tier Matrix

| Tier         | Scripts Run                                                 |
| ------------ | ----------------------------------------------------------- |
| **FAST**     | lint, build                                                 |
| **STANDARD** | + npm audit, ui-change-check, cost-guardrail                |
| **FULL**     | + accessibility-check, architecture-drift, latency-baseline |

---

## 🔐 Security Note

**Never commit**:

- `.env.local` (contains API keys)
- Local metrics/baselines (generated)

**Always review**:

- Scripts before running with `--force`
- AI cost changes flagged by `cost-guardrail.sh`

---

## 📝 Creating New Scripts

1. Create script in `scripts/`
2. Make executable: `chmod +x scripts/my-script.sh`
3. Add to appropriate quality tier if needed
4. Document in this README
5. Add npm alias if commonly used

## ✅ Script Maintenance

- Keep scripts idempotent (safe to run multiple times)
- Add help text: `./script.sh --help`
- Use exit codes: 0 = success, >0 = failure
- Color output for readability
- Log to stderr for errors
