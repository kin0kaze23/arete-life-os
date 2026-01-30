# Areté Life OS — AI Model Strategy & Cost Optimization Plan

## Problem Statement

The app currently hardcodes Gemini Pro/Flash as primary and OpenAI as fallback. Switching models requires code changes in `api/gemini.ts`. The architecture needs to be **plug-and-play** — add an API key, pick a model name, deploy — and use the **most cost-effective model** for each task **without sacrificing relevancy or capability**.

---

## Part 1: Current Architecture Audit

### Current AI Actions (9 total)

| Action                       | Current Model  | Purpose                                 | Token Est. | Calls/Session |
| ---------------------------- | -------------- | --------------------------------------- | ---------- | ------------- |
| `processInput`               | Pro            | Log intake — structured JSON extraction | ~8K        | 5-10          |
| `generateTasks`              | Flash          | Daily task generation                   | ~12K       | 3-5           |
| `generateInsights`           | Pro            | Proactive insight detection             | ~20K       | 3-5           |
| `generateBlindSpots`         | Pro            | Risk/gap identification                 | ~20K       | 3-5           |
| `generateDeepTasks`          | Pro            | Hyper-personalized recommendations      | ~25K       | 3-5           |
| `generateDailyPlan`          | Pro            | Full daily schedule synthesis           | ~30K       | 1-2           |
| `askAura`                    | Research (Pro) | Oracle query with search grounding      | ~5K        | 2-5           |
| `generateEventPrepPlan`      | Flash/Pro      | Event preparation plan                  | ~6K        | 0-3           |
| `generateDeepInitialization` | Pro            | Onboarding deep analysis (one-time)     | ~40K       | 1             |

**Note**: "Calls/Session" reflects current behavior. Target cadence is daily/ondemand as outlined in Step 1.5.

### Current Cost Structure (Gemini 3 Pro Preview)

Assuming ~20 sessions/month, ~50 AI calls/session:

```
Pro calls:  ~800/month × ~25K avg tokens = 20M input + 5M output
Flash calls: ~200/month × ~10K avg tokens = 2M input + 1M output

Gemini 3 Pro:   20M × $2.00 + 5M × $12.00 = $40 + $60 = $100/month
Gemini 3 Flash:  2M × $0.30 + 1M × $2.50  = $0.60 + $2.50 = ~$3/month
OpenAI fallback: ~$5/month (rare usage)

TOTAL: ~$108/month
```

### Clarification: "Session" vs "Log"

- **1 log = 1 `processInput` call** (log ingestion only).
- A **session** in this plan should mean a **daily cycle** of aggregated AI actions (insights, daily plan, deep tasks), not a single log.
- With **9–10 logs/day**, the system should **avoid re-running heavy tasks per log** and instead run them on a **daily cadence** or **on demand**.

### Usage Assumptions (User-Specific)

- Logging events include meals, emotions, learning/development, and social interactions.
- Typical frequency: **9–10 logs/day**.
- Cost modeling and scheduling should reflect **per-log ingestion + daily aggregation**.

### Current Architecture Gaps

1. **Model selection is hardcoded** in `api/gemini.ts` — each action explicitly picks `getModel('pro')` or `getModel('flash')`
2. **Only 2 providers** supported (Gemini + OpenAI fallback)
3. **No per-action model config** — can't assign different models to different actions
4. **Provider switching requires code changes** — different API formats (Gemini SDK vs OpenAI SDK)
5. **No cost tracking** — no visibility into per-action spend

---

## Part 2: AI Model Landscape (January 2026)

### Commercial Models (API Key + Monthly Billing)

**Note**: Pricing and model names change frequently. Verify current prices and exact model IDs in provider docs before finalizing configuration.

| Provider      | Model                 | Input/1M | Output/1M | Context | Best For                          |
| ------------- | --------------------- | -------- | --------- | ------- | --------------------------------- |
| **Google**    | Gemini 2.5 Flash-Lite | $0.10    | $0.40     | 1M      | Classification, simple extraction |
| **Google**    | Gemini 2.5 Flash      | $0.15    | $0.60     | 1M      | Balanced quality/cost             |
| **Google**    | Gemini 2.5 Pro        | $1.25    | $10.00    | 1M      | Deep reasoning                    |
| **OpenAI**    | GPT-4o Mini           | $0.15    | $0.60     | 128K    | Budget workhorse                  |
| **OpenAI**    | GPT-4.1               | $2.00    | $8.00     | 1M      | Large context tasks               |
| **OpenAI**    | GPT-5                 | $1.25    | $10.00    | 400K    | Flagship quality                  |
| **Anthropic** | Haiku 4.5             | $1.00    | $5.00     | 200K    | Fast structured extraction        |
| **Anthropic** | Sonnet 4.5            | $3.00    | $15.00    | 1M      | Best instruction following        |
| **Mistral**   | Mistral Medium 3      | $0.40    | $2.00     | 131K    | Native JSON mode, great value     |
| **Mistral**   | Mistral Nemo          | $0.02    | $0.04     | 131K    | Ultra-cheap simple tasks          |
| **DeepSeek**  | V3.1                  | $0.15    | $0.75     | 128K    | Cheapest general-purpose          |
| **DeepSeek**  | R1                    | $0.70    | $2.40     | 128K    | Reasoning at 1/20th of O1         |

### Open-Source Models via Hosted APIs

| Model                   | Provider | Input/1M | Output/1M | Best For            |
| ----------------------- | -------- | -------- | --------- | ------------------- |
| **Llama 4 Maverick**    | Groq     | $0.50    | $0.77     | Deep analysis       |
| **Llama 4 Scout**       | Groq     | $0.11    | $0.34     | Structured JSON     |
| **Llama 3.1 8B**        | Groq     | $0.05    | $0.08     | Fast classification |
| **DeepSeek R1 Distill** | Groq     | $0.03    | $0.99     | Budget reasoning    |

### All Providers: API Key + Pay-As-You-Go Billing

Every provider above uses **API key authentication** and **monthly pay-as-you-go billing** — no pre-paid credits needed:

| Provider      | Signup                | Billing         | OpenAI-Compatible API? |
| ------------- | --------------------- | --------------- | ---------------------- |
| Google Gemini | ai.google.dev         | Monthly invoice | No (Google SDK)        |
| OpenAI        | platform.openai.com   | Monthly invoice | Yes (standard)         |
| Anthropic     | console.anthropic.com | Monthly invoice | No (Anthropic SDK)     |
| Mistral       | console.mistral.ai    | Monthly invoice | **Yes**                |
| DeepSeek      | platform.deepseek.com | Monthly invoice | **Yes**                |
| Groq          | console.groq.com      | Monthly invoice | **Yes**                |
| Together AI   | api.together.xyz      | Monthly invoice | **Yes**                |
| Fireworks     | fireworks.ai          | Monthly invoice | **Yes**                |

---

## Part 2.5: Prompt Flow Evaluation (Current vs Optimized)

**Source**: `docs/AI_PROMPT_FLOW.md`

### Current Prompt Flows (Cost Drivers)

1. **Per-log ingestion** (`processInput`) sends full profile + 20 memory items + family + file meta on every log.
2. **Debounced refresh** runs **4 heavy generators** on each log (`generateTasks`, `generateInsights`, `generateBlindSpots`, `generateDeepTasks`).
3. **Search grounding** is enabled for `generateInsights` even when no external info is needed.
4. **Daily plan** is generated independently even though it overlaps with tasks + recommendations.

### Optimization Opportunities (No Quality Loss)

- **Bundle overlapping generators**: merge tasks + insights + blindspots into a single daily "Intelligence Batch".
- **Gate heavy prompts by cadence**: run once/day or on meaningful change, not per log.
- **Reduce context payload**:
  - Replace full profile JSON with a **compact profile summary**.
  - Reduce ingestion memory items from **20 → 8–10** for `processInput`.
  - Use **daily digest** summaries for batch prompts instead of raw history.
- **Search gating**: enable grounding only when user explicitly asks factual/current info.
- **Split planning**: daily plan should consume the batch output, not full history.

### Non-AI Tasks (Deterministic, Accuracy-Safe)

These can be done **without AI** or with a simple rules engine, with AI only as a fallback on low confidence:

- **Intent pre-classification** (rules/regex): detect obvious finance logs (currency + amount), meals (food keywords), schedule cues ("tomorrow", dates), relationship/social cues ("met with").
- **Structured parsing**: extract amounts, splits, dates, times, and locations with deterministic parsers.
- **Deduplication**: generate `dedupeKey` from normalized text + timestamp + location.
- **Priority scoring**: compute basic importance from user-defined weights (e.g., Spiritual > Finance) before AI.
- **Memory selection**: use existing `buildMemoryContext` scoring without AI.

**Fallback rule**: if deterministic confidence < threshold (e.g., 0.7), run the AI intake on Pro once.

### Proposed Prompt Flow (Bundled + Gated)

**Per log (10–15/day):**

- Non‑AI preprocessing: parse amounts/dates/locations and classify obvious intents
- `processInput` → **Flash-Lite** (JSON extraction)
- If JSON fails Zod: **retry on Pro once**

**Daily (1/day):**

- `dailyIntelligenceBatch` (new) → **Pro**
  - Outputs: `tasks[]`, `insights[]`, `blindSpots[]`, `missingData[]`
  - Inputs: compact profile summary + daily digest + verified facts + feedback
- `dailyPlan` → **Flash** (fallback to Pro)
  - Inputs: batch outputs + schedule constraints + goals

**On demand:**

- `generateDeepTasks` → **Pro** (weekly or when major change detected)
- `askAura` → **Pro + Search** (user query)
- `generateEventPrepPlan` → **Flash** (upgrade to Pro + Search if needed)

This reduces per-log Pro calls to zero and collapses **3 heavy daily generators into 1**.

### Quality Guardrails (No Relevancy Loss)

- **Schema validation** on all JSON outputs (Zod); invalid outputs re‑run on Pro once.
- **Deterministic parsing** only used when confidence ≥ 0.7; otherwise AI intake runs.
- **Daily batch uses verified facts + feedback first** to keep recommendations grounded.
- **Search grounding** only when explicitly needed (user query or event prep).

## Part 3: Recommended Model Assignments

### Strategy: Match Model Capability to Task Complexity

**Note**: Model IDs below are illustrative; verify exact model names and pricing before deployment.

| Action                       | Complexity                   | Recommended Primary     | Recommended Budget | Cost Reduction |
| ---------------------------- | ---------------------------- | ----------------------- | ------------------ | -------------- |
| `processInput`               | Medium (JSON extraction)     | Gemini 2.5 Flash        | Mistral Medium 3   | -70%           |
| `generateTasks`              | Low-Medium (list generation) | Gemini 2.5 Flash-Lite   | DeepSeek V3.1      | -85%           |
| `generateInsights`           | High (pattern detection)     | Gemini 2.5 Pro          | DeepSeek R1        | -44%           |
| `generateBlindSpots`         | High (risk analysis)         | Gemini 2.5 Pro          | DeepSeek R1        | -44%           |
| `generateDeepTasks`          | High (personalized recs)     | Gemini 2.5 Pro          | Sonnet 4.5         | 0% (quality)   |
| `generateDailyPlan`          | High (synthesis)             | Gemini 2.5 Pro          | DeepSeek R1        | -44%           |
| `askAura`                    | Medium (search + answer)     | Gemini 2.5 Pro (search) | GPT-4.1            | varies         |
| `generateEventPrepPlan`      | Low-Medium                   | Gemini 2.5 Flash        | Mistral Medium 3   | -70%           |
| `generateDeepInitialization` | Very High (one-time)         | Gemini 2.5 Pro          | Sonnet 4.5         | 0% (quality)   |

### Final Recommended Model Lineup (Optimized Prompt Flow)

**Consolidated actions**: `generateTasks` + `generateInsights` + `generateBlindSpots` → **`dailyIntelligenceBatch`**

| Action                       | Cadence            | Primary Model                                              | Rationale                                       |
| ---------------------------- | ------------------ | ---------------------------------------------------------- | ----------------------------------------------- |
| `processInput`               | Per log            | **Gemini 2.5 Flash‑Lite** (fallback to Pro on schema fail) | Cheapest structured extraction with guardrail   |
| `dailyIntelligenceBatch`     | 1/day              | **Gemini 2.5 Pro**                                         | Highest‑quality reasoning for combined insights |
| `dailyPlan`                  | 1/day              | **Gemini 2.5 Flash** (fallback to Pro)                     | Planning from already‑structured outputs        |
| `generateDeepTasks`          | Weekly / on demand | **Gemini 2.5 Pro**                                         | Quality‑critical recommendations                |
| `askAura`                    | On demand          | **Gemini 2.5 Pro + Search**                                | Factual + grounded advice                       |
| `generateEventPrepPlan`      | On demand          | **Gemini 2.5 Flash** (upgrade to Pro + Search if needed)   | Fast + cost‑effective                           |
| `generateDeepInitialization` | One‑time           | **Gemini 2.5 Pro**                                         | First‑impression quality matters                |

### Optimized Cost Estimate (Corrected)

**Important**: costs must account for **both input and output tokens**, and (if applicable) **search grounding**. The original estimate used input-only pricing and is therefore too low.

Use this formula per action:

```
cost = (input_tokens × input_price) + (output_tokens × output_price)
```

Recommended operating assumptions given 9–10 logs/day:

- `processInput`: **per log**
- `generateTasks`: **1/day** (or on demand)
- `generateInsights`: **1/day**
- `generateBlindSpots`: **1/day**
- `generateDailyPlan`: **1/day**
- `generateDeepTasks`: **on demand**
- `askAura`: **on demand**
- `generateEventPrepPlan`: **on demand**
- `generateDeepInitialization`: **one-time**

This keeps costs proportional to meaningful change rather than to log volume, preserving relevance while controlling spend.

### Cost Estimate for 10–15 Logs/Day (Gemini 2.5 Pricing)

**Assumptions (for estimation only):**

- Per-log `processInput`: **8K input + 0.8K output tokens**
- Daily actions (1/day):
  - `generateTasks`: 12K in / 1.5K out
  - `generateInsights`: 20K in / 2.5K out
  - `generateBlindSpots`: 20K in / 2.5K out
  - `generateDailyPlan`: 30K in / 3.5K out
- 30 days/month
- Gemini 2.5 pricing (input/output per 1M tokens)

**Pricing used in the calculations:**

- Gemini 2.5 Pro: **$1.25 input / $10 output per 1M tokens**
- Gemini 2.5 Flash‑Lite: **$0.10 input / $0.40 output per 1M tokens**
- Search grounding: **$35 per 1K prompts** after the free quota

**Note**: Pricing above assumes **prompts <= 200K tokens**; higher‑context prompts cost more. Keep contexts compact to stay in the lower tier.

**Source**: Gemini API pricing page (Jan 2026).

**Monthly estimate (using Gemini 2.5 Pro for daily actions):**

- **Daily actions cost**: ~$0.2025/day → **~$6.08/month**

**ProcessInput (per log):**

- **If `processInput` uses Flash‑Lite**: ~$0.00112/log → **~$0.34–$0.50/month**
- **If `processInput` still uses Pro**: ~$0.018/log → **~$5.40–$8.10/month**

**Total estimate (excluding on‑demand calls):**

- **Optimized (Flash‑Lite for `processInput`)**: **~$6.41–$6.58/month**
- **Quick‑win only (Pro for `processInput`)**: **~$11.48–$14.18/month**

**On‑demand add‑ons (per call, Gemini 2.5 Pro):**

- `generateDeepTasks`: **~$0.06/call**
- `askAura`: **~$0.02/call** + **search grounding** cost (after free quota)
- `generateEventPrepPlan`: **~$0.02/call**
- `generateDeepInitialization`: **~$0.10** (one‑time)

If your prompts are shorter than these assumptions (likely for short log examples), the real cost will be **lower**.

### Cost Estimate (Optimized Prompt Flow)

**Assumptions for optimized flow:**

- `processInput` (Flash‑Lite): **4K in / 0.6K out** per log (compact profile + fewer memories)
- `dailyIntelligenceBatch` (Pro): **25K in / 6K out** per day
- `dailyPlan` (Flash): **10K in / 3K out** per day (fallback to Pro only on failure)
- `generateDeepTasks`: **weekly** (4/month) at **25K in / 3K out** on Pro
- 30 days/month

**Estimated monthly cost (excluding on‑demand askAura/event prep):**

- `processInput` (10–15 logs/day): **~$0.19–$0.29**
- `dailyIntelligenceBatch`: **~$2.74**
- `dailyPlan` (Flash): **~$0.32**
- `generateDeepTasks` (weekly): **~$0.25**

**Total optimized**: **~$3.50–$3.60/month**

This is the **lowest-cost configuration** that preserves reasoning quality by keeping Pro where it matters, while eliminating redundant Pro calls per log.

**If deterministic parsing handles a portion of simple logs** (and skips AI intake for those), the `processInput` cost drops further without sacrificing quality because AI remains the fallback for any low-confidence cases.

---

## Part 4: Architecture — Plug-and-Play Model Router

### 4.1 New Abstraction: `ModelRouter`

Create a **provider-agnostic routing layer** that maps each AI action to a configurable model.

**New file: `api/modelRouter.ts`**

```typescript
type ProviderType = 'gemini' | 'openai' | 'anthropic' | 'mistral' | 'deepseek' | 'groq';

type ModelConfig = {
  provider: ProviderType;
  model: string;
  apiKeyEnvVar: string; // e.g., 'GEMINI_API_KEY'
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
  supportsSearch?: boolean;
  supportsFileUpload?: boolean;
};

type ActionModelMap = Record<
  string,
  {
    primary: ModelConfig;
    fallback?: ModelConfig;
    fallback2?: ModelConfig;
  }
>;
```

### 4.2 Environment-Driven Configuration

All model assignments configured via environment variables — change models without code changes:

```env
# === Provider API Keys ===
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MISTRAL_API_KEY=...
DEEPSEEK_API_KEY=sk-...
GROQ_API_KEY=gsk_...

# === Per-Action Model Assignment ===
# Format: PROVIDER:MODEL_NAME
AI_MODEL_PROCESS_INPUT=gemini:gemini-2.5-flash
AI_MODEL_GENERATE_TASKS=gemini:gemini-2.5-flash-lite
AI_MODEL_GENERATE_INSIGHTS=gemini:gemini-2.5-pro
AI_MODEL_GENERATE_BLIND_SPOTS=gemini:gemini-2.5-pro
AI_MODEL_GENERATE_DEEP_TASKS=gemini:gemini-2.5-pro
AI_MODEL_GENERATE_DAILY_PLAN=gemini:gemini-2.5-pro
AI_MODEL_ASK_AURA=gemini:gemini-2.5-pro
AI_MODEL_GENERATE_EVENT_PREP=gemini:gemini-2.5-flash
AI_MODEL_GENERATE_DEEP_INIT=gemini:gemini-2.5-pro

# === Fallback Chain ===
AI_FALLBACK_PROVIDER=openai
AI_FALLBACK_MODEL=gpt-4o-mini

# === Global Defaults ===
AI_DEFAULT_PROVIDER=gemini
AI_DEFAULT_MODEL=gemini-2.5-flash
AI_DEFAULT_TEMPERATURE=0.7
AI_MAX_RETRIES=1
```

### 4.3 Unified Provider Interface

**New file: `api/providers/types.ts`**

```typescript
interface AIProvider {
  name: ProviderType;
  generateJSON<T>(prompt: string, schema?: ZodSchema<T>, options?: GenerateOptions): Promise<T>;
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateWithSearch?(
    prompt: string,
    options?: GenerateOptions
  ): Promise<{ text: string; sources: Source[] }>;
  supportsFileUpload: boolean;
  supportsSearch: boolean;
}

interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  files?: FileAttachment[];
  tools?: ToolDefinition[];
}
```

### 4.4 Provider Implementations

**New files:**

| File                                 | Provider                          | API Format                     |
| ------------------------------------ | --------------------------------- | ------------------------------ |
| `api/providers/gemini.ts`            | Google Gemini                     | Google AI SDK                  |
| `api/providers/openai.ts`            | OpenAI                            | OpenAI SDK                     |
| `api/providers/anthropic.ts`         | Anthropic                         | Anthropic SDK                  |
| `api/providers/openai-compatible.ts` | Mistral, DeepSeek, Groq, Together | OpenAI SDK with custom baseURL |

The **OpenAI-compatible** provider covers 4+ providers with one implementation:

```typescript
// api/providers/openai-compatible.ts
const PROVIDER_ENDPOINTS: Record<string, string> = {
  mistral: 'https://api.mistral.ai/v1',
  deepseek: 'https://api.deepseek.com',
  groq: 'https://api.groq.com/openai/v1',
  together: 'https://api.together.xyz/v1',
  fireworks: 'https://api.fireworks.ai/inference/v1',
};
```

### 4.5 Model Router Flow

```
Action Request
    │
    ▼
ModelRouter.resolve(action)
    │
    ├─ Parse AI_MODEL_{ACTION} env var → "provider:model"
    │
    ├─ Get provider API key from {PROVIDER}_API_KEY env var
    │
    ├─ Instantiate correct AIProvider
    │
    ▼
AIProvider.generateJSON(prompt, schema, options)
    │
    ├─ Success → Return validated result
    │
    ├─ Failure → Try fallback (AI_FALLBACK_PROVIDER:AI_FALLBACK_MODEL)
    │
    ├─ Fallback failure → Return safe default ([] or {})
    │
    ▼
Response with latency + provider metadata
```

---

## Part 5: Implementation Plan

### Phase 0: Prompt Flow Optimization (Fast ROI)

**Goal**: cut redundant calls without changing provider architecture.

| Task | File                      | Description                                                                                       |
| ---- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| 0.1  | `core/useAura.ts`         | Gate heavy generators by daily cadence (remove per-log Pro calls)                                 |
| 0.2  | `ai/prompts.ts`           | Add compact profile summary + daily digest builder                                                |
| 0.3  | `api/gemini.ts`           | Add `dailyIntelligenceBatch` prompt (tasks + insights + blindspots)                               |
| 0.4  | `api/gemini.ts`           | Switch `processInput` to Flash‑Lite with Pro fallback on schema failure                           |
| 0.5  | `docs/AI_PROMPT_FLOW.md`  | Update flow diagram + new batch prompt documentation                                              |
| 0.6  | `core/logParser.ts` (new) | Deterministic parser for amounts/dates/locations + intent hints                                   |
| 0.7  | `api/gemini.ts`           | Skip AI intake for high‑confidence deterministic parses; fallback to AI if confidence < threshold |

### Phase 1: Provider Abstraction Layer

**Goal**: Create the unified provider interface without changing any behavior.

| Task | File                                 | Description                                                      |
| ---- | ------------------------------------ | ---------------------------------------------------------------- |
| 1.1  | `api/providers/types.ts`             | Define `AIProvider` interface, `GenerateOptions`, `ProviderType` |
| 1.2  | `api/providers/gemini.ts`            | Extract current Gemini logic into provider class                 |
| 1.3  | `api/providers/openai.ts`            | Extract current OpenAI fallback into provider class              |
| 1.4  | `api/providers/openai-compatible.ts` | Generic OpenAI-compatible provider (Mistral, DeepSeek, Groq)     |
| 1.5  | `api/providers/anthropic.ts`         | Anthropic Claude provider                                        |
| 1.6  | `api/providers/index.ts`             | Factory: `getProvider(type, apiKey, model)`                      |
| 1.7  | `api/modelRouter.ts`                 | Route actions to providers based on env config                   |

### Phase 2: Refactor `api/gemini.ts` to Use Router

**Goal**: Replace hardcoded model selection with ModelRouter.

| Task | File              | Description                                                           |
| ---- | ----------------- | --------------------------------------------------------------------- |
| 2.1  | `api/gemini.ts`   | Replace `callGeminiWithLatency()` calls with `modelRouter.generate()` |
| 2.2  | `api/gemini.ts`   | Remove hardcoded `getModel('pro')`/`getModel('flash')` per action     |
| 2.3  | `api/gemini.ts`   | Remove inline OpenAI fallback code (now handled by router)            |
| 2.4  | `api/aiConfig.ts` | Update to read per-action model config from env                       |
| 2.5  | `.env.example`    | Add all new env vars with recommended defaults                        |

### Phase 3: Add New Providers

**Goal**: Wire up Mistral, DeepSeek, Groq as available options.

| Task | File                                 | Description                                       |
| ---- | ------------------------------------ | ------------------------------------------------- |
| 3.1  | `vercel.json`                        | Add new provider API domains to CSP `connect-src` |
| 3.2  | `api/providers/openai-compatible.ts` | Test with Mistral, DeepSeek, Groq endpoints       |
| 3.3  | `api/providers/anthropic.ts`         | Test with Claude Haiku/Sonnet                     |
| 3.4  | `.env.example`                       | Document all provider API keys and model names    |

### Phase 4: Cost Monitoring

**Goal**: Track per-action cost so users can optimize.

| Task | File                     | Description                                                             |
| ---- | ------------------------ | ----------------------------------------------------------------------- |
| 4.1  | `api/providers/types.ts` | Add `UsageMetrics { inputTokens, outputTokens, provider, model, cost }` |
| 4.2  | `api/modelRouter.ts`     | Track and log token usage per call                                      |
| 4.3  | `api/gemini.ts`          | Return usage metadata in API responses                                  |
| 4.4  | `core/useAura.ts`        | Accumulate session cost in state (optional display)                     |

### Phase 5: Optimize Model Assignments

**Goal**: Switch to cost-effective models based on benchmarks.

| Task | Description                                                     |
| ---- | --------------------------------------------------------------- |
| 5.1  | Upgrade from Gemini 3 Preview to Gemini 2.5 GA models           |
| 5.2  | Switch `generateTasks` to Flash-Lite (or Mistral Nemo)          |
| 5.3  | Test DeepSeek V3.1 as budget fallback instead of OpenAI         |
| 5.4  | Benchmark Mistral Medium 3 for `processInput` (JSON extraction) |
| 5.5  | Document quality/cost tradeoffs per action in plan              |

---

## Part 6: Recommended Model Configurations

### Configuration A: Maximum Savings (Gemini-Only)

Simplest path — just update model names in env vars. No new providers needed.

```env
GEMINI_API_KEY=AIza...
AI_MODEL_PROCESS_INPUT=gemini:gemini-2.5-flash
AI_MODEL_GENERATE_TASKS=gemini:gemini-2.5-flash-lite
AI_MODEL_GENERATE_INSIGHTS=gemini:gemini-2.5-pro
AI_MODEL_GENERATE_BLIND_SPOTS=gemini:gemini-2.5-pro
AI_MODEL_GENERATE_DEEP_TASKS=gemini:gemini-2.5-pro
AI_MODEL_GENERATE_DAILY_PLAN=gemini:gemini-2.5-pro
AI_MODEL_ASK_AURA=gemini:gemini-2.5-pro
AI_MODEL_GENERATE_EVENT_PREP=gemini:gemini-2.5-flash-lite
AI_MODEL_GENERATE_DEEP_INIT=gemini:gemini-2.5-pro
AI_FALLBACK_PROVIDER=openai
AI_FALLBACK_MODEL=gpt-4o-mini
```

**Estimated cost**: depends on output length and trigger cadence; use the corrected formula above.

### Configuration B: Best Value (Multi-Provider)

Mix providers for optimal price/quality per task.

```env
GEMINI_API_KEY=AIza...
DEEPSEEK_API_KEY=sk-...
MISTRAL_API_KEY=...

AI_MODEL_PROCESS_INPUT=mistral:mistral-medium-3       # Native JSON, $0.40/1M
AI_MODEL_GENERATE_TASKS=gemini:gemini-2.5-flash-lite  # Simple list, $0.10/1M
AI_MODEL_GENERATE_INSIGHTS=deepseek:deepseek-reasoner # Reasoning (verify model id)
AI_MODEL_GENERATE_BLIND_SPOTS=deepseek:deepseek-reasoner # Reasoning (verify model id)
AI_MODEL_GENERATE_DEEP_TASKS=gemini:gemini-2.5-pro    # Quality matters, $1.25/1M
AI_MODEL_GENERATE_DAILY_PLAN=gemini:gemini-2.5-pro    # Quality matters, $1.25/1M
AI_MODEL_ASK_AURA=gemini:gemini-2.5-pro               # Needs search, $1.25/1M
AI_MODEL_GENERATE_EVENT_PREP=mistral:mistral-medium-3  # JSON extraction, $0.40/1M
AI_MODEL_GENERATE_DEEP_INIT=gemini:gemini-2.5-pro     # One-time quality, $1.25/1M
AI_FALLBACK_PROVIDER=deepseek
AI_FALLBACK_MODEL=deepseek-chat
```

**Estimated cost**: depends on output length and trigger cadence; use the corrected formula above.

### Configuration C: Ultra-Budget (Open Source via Groq)

For cost-sensitive or high-volume usage.

```env
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...

AI_MODEL_PROCESS_INPUT=groq:llama-4-scout             # JSON extraction, $0.11/1M
AI_MODEL_GENERATE_TASKS=groq:llama-3.1-8b-instant     # Fast lists, $0.05/1M
AI_MODEL_GENERATE_INSIGHTS=groq:llama-4-maverick       # Analysis, $0.50/1M
AI_MODEL_GENERATE_BLIND_SPOTS=groq:llama-4-maverick    # Analysis, $0.50/1M
AI_MODEL_GENERATE_DEEP_TASKS=gemini:gemini-2.5-pro    # Quality for recs, $1.25/1M
AI_MODEL_GENERATE_DAILY_PLAN=groq:llama-4-maverick     # Good enough, $0.50/1M
AI_MODEL_ASK_AURA=gemini:gemini-2.5-pro               # Needs Google Search
AI_MODEL_GENERATE_EVENT_PREP=groq:llama-4-scout        # JSON, $0.11/1M
AI_MODEL_GENERATE_DEEP_INIT=gemini:gemini-2.5-pro     # One-time quality
AI_FALLBACK_PROVIDER=groq
AI_FALLBACK_MODEL=llama-4-scout
```

**Estimated cost**: depends on output length and trigger cadence; use the corrected formula above.

---

## Part 7: Files Modified/Created

### New Files

| File                                 | Purpose                                 | Phase |
| ------------------------------------ | --------------------------------------- | ----- |
| `api/providers/types.ts`             | AIProvider interface + types            | 1     |
| `api/providers/gemini.ts`            | Gemini provider implementation          | 1     |
| `api/providers/openai.ts`            | OpenAI provider implementation          | 1     |
| `api/providers/openai-compatible.ts` | Mistral/DeepSeek/Groq/Together provider | 1     |
| `api/providers/anthropic.ts`         | Anthropic Claude provider               | 1     |
| `api/providers/index.ts`             | Provider factory                        | 1     |
| `api/modelRouter.ts`                 | Action-to-model routing                 | 1     |

### Modified Files

| File              | Changes                                       | Phase |
| ----------------- | --------------------------------------------- | ----- |
| `api/gemini.ts`   | Replace hardcoded model calls with router     | 2     |
| `api/aiConfig.ts` | Read per-action model config from env         | 2     |
| `.env.example`    | Add all provider API keys + model assignments | 2     |
| `vercel.json`     | Add provider domains to CSP connect-src       | 3     |
| `core/useAura.ts` | Optional: accumulate session cost metrics     | 4     |

### CSP Updates Required (vercel.json)

```
connect-src: ...
  https://api.mistral.ai
  https://api.deepseek.com
  https://api.groq.com
  https://api.together.xyz
  https://api.fireworks.ai
  https://api.anthropic.com
```

---

## Part 8: Prompt Compatibility

### Current Prompts Are Provider-Agnostic

The existing prompt templates (`LOG_BAR_INGEST_PROMPT`, `HYPER_PERSONALIZED_PROMPT`, `DAILY_PLAN_PROMPT`) use `{{variable}}` placeholders and plain English instructions. These work across all providers without modification.

### JSON Output Handling Per Provider

| Provider  | JSON Mode                                  | Strategy                                      |
| --------- | ------------------------------------------ | --------------------------------------------- |
| Gemini    | `responseMimeType: 'application/json'`     | Native JSON response                          |
| OpenAI    | `response_format: { type: 'json_object' }` | Native JSON mode                              |
| Anthropic | No native JSON mode                        | Add "Return valid JSON only" to prompt suffix |
| Mistral   | `response_format: { type: 'json_object' }` | Native (OpenAI-compatible)                    |
| DeepSeek  | `response_format: { type: 'json_object' }` | Native (OpenAI-compatible)                    |
| Groq      | `response_format: { type: 'json_object' }` | Native (OpenAI-compatible)                    |

The `AIProvider.generateJSON()` method handles this per-provider — callers don't need to know.

### Search Grounding

Only Gemini supports Google Search grounding natively. For `askAura`:

- If primary is Gemini → use search tool
- If primary is non-Gemini → skip search, return `sources: []`
- Document this limitation in config comments

### File Upload

Only Gemini and OpenAI support file attachments. For `processInput`:

- If primary supports files → attach base64 files
- If primary doesn't → extract text content, pass as string in prompt
- The `AIProvider.supportsFileUpload` flag controls this

---

## Part 9: Migration Path

### Step 1: Quick Win — Update Gemini Model Names (5 min)

Just change env vars on Vercel. No code changes. Immediate 90% cost reduction.

```
GEMINI_MODEL_PRO=gemini-2.5-pro         # Was: gemini-3-pro-preview
GEMINI_MODEL_FLASH=gemini-2.5-flash     # Was: gemini-3-flash-preview
```

### Step 1.5: Quick Win — Adjust Trigger Cadence (same day)

**Goal**: avoid re-running heavy models for each log (9–10 logs/day).

Suggested cadence:

- `processInput`: per log
- `generateTasks`: 1/day
- `generateInsights`: 1/day
- `generateBlindSpots`: 1/day
- `generateDailyPlan`: 1/day
- `generateDeepTasks`: on demand
- `askAura`: on demand
- `generateEventPrepPlan`: on demand

This preserves relevance while preventing cost spikes from high-frequency logging.

### Step 1.6: Quick Win — Cheap‑First + Accuracy Guardrail (1 day)

**Goal**: move the **per‑log** action to a cheaper model **without quality loss**.

- Route `processInput` to **Gemini 2.5 Flash‑Lite** (or Flash) for JSON extraction.
- If JSON fails Zod validation, **retry once on Pro**.
- This change can be implemented **without the full ModelRouter** by adding a small per‑action override in `api/gemini.ts` (fastest path).

Expected impact: major savings because `processInput` is the only action that scales with log volume.

### Step 1.7: Quick Win — Daily Intelligence Batch (1–2 days)

**Goal**: reduce 3 heavy Pro calls to 1 per day.

- Create a new `dailyIntelligenceBatch` prompt that returns **tasks + insights + blindspots** in one schema.
- Run it **once per day**, not per log.
- Use its outputs as the **sole inputs** for `generateDailyPlan` (smaller context).

### Priority Plan (Fastest → Full Optimization)

1. **Immediate (same day)**
   - Update Gemini model names to 2.5 GA models (Step 1).
   - Enforce daily cadence for heavy actions (Step 1.5).
2. **Short‑term (1–2 days)**
   - Switch `processInput` to Flash‑Lite with Pro fallback (Step 1.6).
   - Add lightweight token/latency logging per action (no UI yet).
3. **Mid‑term (week 1)**
   - Implement ModelRouter (Phase 1–2).
   - Add per‑action env config and fallback chain.
4. **Later (week 2+)**
   - Add multi‑provider support (Phase 3).
   - A/B test quality vs cost, then lock in best assignments.

### Step 2: Build Provider Abstraction (Phase 1-2)

Refactor `api/gemini.ts` to use the ModelRouter. This is the biggest change.

### Step 3: Add Providers and Test (Phase 3)

Add Mistral, DeepSeek, Groq. Test each action with each provider. Document quality results.

### Step 4: Optimize and Monitor (Phase 4-5)

Enable cost tracking. Run A/B comparisons. Settle on optimal configuration.

---

## Part 10: Verification Steps

1. **No behavior change**: After Phase 1-2, run `npm run doctor`. All existing functionality must work identically with default Gemini config.
2. **Provider switching**: Change `AI_MODEL_GENERATE_TASKS` to a budget OpenAI model in `.env.local` (verify model ID) → verify tasks still generate correctly.
3. **Fallback**: Set primary to invalid model → verify fallback fires and returns results.
4. **JSON validation**: All Zod schemas must pass regardless of provider.
5. **Search grounding**: `askAura` with Gemini must still return sources. With non-Gemini, must return empty sources gracefully.
6. **File upload**: `processInput` with attachments must work with Gemini. With non-Gemini, must degrade gracefully.
7. **Cost tracking**: After Phase 4, verify token usage logged per action in server console.

---

## Part 11: Risk Assessment

| Risk                                    | Impact | Mitigation                                                    |
| --------------------------------------- | ------ | ------------------------------------------------------------- |
| Non-Gemini models produce worse JSON    | Medium | Zod validation catches bad output; fallback fires             |
| Provider API outage                     | Medium | Fallback chain (primary → fallback → safe default)            |
| Different prompt behavior per model     | Medium | Test each action with each target model before deploying      |
| Groq/DeepSeek rate limits               | Low    | Lower rate limits than Gemini; add per-provider rate tracking |
| Search grounding only works with Gemini | Low    | Document limitation; `askAura` gracefully degrades            |
| Anthropic SDK different from OpenAI     | Low    | Separate provider implementation handles differences          |

---

## Summary

| Metric              | Current     | After Quick Win                           | After Full Optimization                              |
| ------------------- | ----------- | ----------------------------------------- | ---------------------------------------------------- |
| Monthly cost        | ~$108       | ~<$15 (cadence + output length dependent) | **~$3.5–$3.6** (optimized flow, excluding on‑demand) |
| Providers supported | 2           | 2                                         | 6+                                                   |
| Model switching     | Code change | Env var change                            | Env var change                                       |
| Per-action config   | No          | Yes                                       | Yes                                                  |
| Cost visibility     | None        | Server logs                               | Dashboard metric                                     |
| Fallback depth      | 2 levels    | 3 levels                                  | 3 levels                                             |
