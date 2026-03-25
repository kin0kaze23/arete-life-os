# Development Modes Reference

Your complete guide to the 3 development modes.

---

## Quick Decision

| What Are You Doing?          | Mode       | Trigger            |
| ---------------------------- | ---------- | ------------------ |
| Fix a bug, answer question   | **Mode 1** | Just ask           |
| Build a feature (3-10 tasks) | **Mode 2** | "Implement [plan]" |
| Bulk work (20+ tasks)        | **Mode 3** | `npm run auto`     |

---

## Mode 1: Manual

**Autonomy**: 20% (you guide everything)  
**Quality Tier**: FAST (per change)  
**API Key**: ❌ Not needed

### How to Use

Just talk to the agent:

```
"Fix the bug in X"
"Add a logout button"
"Explain how vault encryption works"
```

### What Happens

1. Agent reads relevant files
2. Makes the change
3. Runs FAST check (build + lint)
4. Shows you results

### Optional Quality Upgrade

```
"Fix X and run standard check"   → STANDARD tier
"Fix X and run full quality"     → FULL tier
```

---

## Mode 2: Native Automation

**Autonomy**: 85% (agent leads, you review)  
**Quality Tier**: STANDARD (at checkpoints)  
**API Key**: ❌ Not needed

### How to Use

Reference a plan file:

```
"Implement product-strategy.md"
"Implement Phase 1 from product-strategy.md"
```

### Checkpoint Frequency

| Say This                   | Checkpoint Every  |
| -------------------------- | ----------------- |
| "Implement [plan]"         | 3 tasks (default) |
| "Implement [plan] fast"    | 5 tasks           |
| "Implement [plan] careful" | 1-2 tasks         |

### What Happens at Checkpoints

1. Agent runs STANDARD quality tier
2. Takes screenshots if UI
3. Shows you summary report
4. Waits for approval

### Auto-Fix Behavior

- Build errors → Agent tries 3x
- Lint errors → Agent fixes automatically
- Quality warnings → Agent notes and continues

---

## Mode 3: Script Automation

**Autonomy**: 95% (full autopilot)  
**Quality Tier**: FULL (at end)  
**API Key**: ✅ Required

### Setup (One Time)

Create `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
```

### How to Use

In terminal:

```bash
npm run auto                           # Standard speed
npm run auto -- .agent/plans/my-plan.md # Specific plan
```

### Speed Options

| Command                | Checkpoint Every  |
| ---------------------- | ----------------- |
| `npm run auto:careful` | 3 tasks           |
| `npm run auto`         | 5 tasks (default) |
| `npm run auto:fast`    | 10 tasks          |

### What Happens

1. Digests plan into tasks
2. Implements each task
3. Auto-fixes errors
4. Pauses at checkpoints (press Enter)
5. Runs FULL quality at end

---

## Comparison Table

| Feature          | Mode 1          | Mode 2      | Mode 3     |
| ---------------- | --------------- | ----------- | ---------- |
| **Speed**        | Slowest         | Moderate    | Fastest    |
| **Control**      | Maximum         | Checkpoints | Final only |
| **Quality Tier** | FAST            | STANDARD    | FULL       |
| **API Key**      | ❌              | ❌          | ✅         |
| **Cost**         | Free            | Free        | ~$0.50-2   |
| **Best For**     | Fixes, learning | Features    | Bulk work  |

---

## Switching Modes

You can switch mid-work:

**Mode 1 → Mode 2:**

```
"Actually, implement the rest of this plan with checkpoints"
```

**Mode 2 → Mode 1:**

```
"Pause here, let me review manually"
```

**Any → Mode 3:**

```bash
# In terminal
npm run auto -- .agent/plans/remaining-tasks.md
```

---

## Tool Strategy

Modes are independent of which AI tool you use. See [DEVELOPMENT_SETUP.md](../core/DEVELOPMENT_SETUP.md) for the full tool strategy:

| Tool                           | Best Modes     | Notes                                                        |
| ------------------------------ | -------------- | ------------------------------------------------------------ |
| **Anti-Gravity (Gemini 3)**    | Mode 1, Mode 2 | Primary dev tool. Reads .agent/ natively.                    |
| **Cursor + Codex (GPT 5.2)**   | Mode 1         | Secondary. Good for quick inline edits.                      |
| **Cursor + Claude (Opus 4.5)** | Mode 1, Mode 2 | Reserve. Best for planning and hard debugging.               |
| **Mode 3 Script**              | Mode 3 only    | Runs in terminal via Groq. See [MODE3.md](../core/MODE3.md). |

---

## See Also

- [QUALITY.md](./QUALITY.md) - Quality tier details
- [CHECKLISTS.md](./CHECKLISTS.md) - Pre-push, session workflows
- [DEVELOPMENT_SETUP.md](../core/DEVELOPMENT_SETUP.md) - Tool roles and sync protocol
- [MODE3.md](../core/MODE3.md) - Mode 3 architecture deep-dive
