# AI Prompt Flow & Interaction Map

> Last updated: 2026-01-27 | Version: 3.2.0

This document maps how AI prompts flow through the system, what data they receive, and what they produce. Use this to audit AI behavior, improve prompt quality, and understand the full intelligence pipeline.

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                                  │
│                                                                      │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐  │
│  │   LogBar     │───→│ geminiService.ts │───→│ fetch('/api/gemini')│  │
│  │ (user input) │    │ (client wrapper) │    │                    │  │
│  └─────────────┘    └──────────────────┘    └────────┬───────────┘  │
│                                                       │              │
│  ┌─────────────┐    ┌──────────────────┐             │              │
│  │   useAura   │───→│  buildMemoryCtx  │             │              │
│  │ (state hook) │   │  fillTemplate    │             │              │
│  └─────────────┘    └──────────────────┘             │              │
│                                                       │              │
└───────────────────────────────────────────────────────┼──────────────┘
                                                        │
                                              ┌─────────┴──────────┐
                                              │  /api/gemini.ts    │
                                              │  (Vercel function) │
                                              └─────────┬──────────┘
                                                        │
                                           ┌────────────┴────────────┐
                                           │                         │
                                    ┌──────┴──────┐          ┌──────┴──────┐
                                    │ Gemini API  │          │ OpenAI API  │
                                    │ (primary)   │          │ (fallback)  │
                                    └─────────────┘          └─────────────┘
```

---

## Prompt Registry

The system uses 3 configurable prompts stored in `ai/geminiService.ts`:

| ID                | Name                   | Purpose                                    | Template Source             |
| ----------------- | ---------------------- | ------------------------------------------ | --------------------------- |
| `internalization` | Neural Internalization | Extracts structured facts from user input  | `LOG_BAR_INGEST_PROMPT`     |
| `oracle`          | Areté Oracle           | Personal advisor Q&A with search grounding | Simple template             |
| `deepPlanning`    | Executive Operations   | Hyper-personalized recommendations         | `HYPER_PERSONALIZED_PROMPT` |

Users can customize all three via **Settings → Prompt Management** (`PromptManagementView.tsx`).

---

## Prompt 1: LOG_BAR_INGEST_PROMPT (Intake Router)

### Role

Converts raw user input (text + file metadata) into structured JSON for the knowledge graph. This is the "ears" of the system.

### When Triggered

- Every time user submits text/files via `LogBar`
- Action: `processInput`
- Model: **Gemini Flash** (fast, structured extraction)

### Input Context

```
Template Variables:
  {{profile}}       → JSON.stringify(activeProfile)
  {{history}}       → JSON.stringify(buildMemoryContext(memory, categories, 30))
  {{family}}        → JSON.stringify(familyMembers)
  {{input}}         → User's raw text input
  {{fileMeta}}      → JSON.stringify([{ name, mimeType, size }])
```

### Prompt Behavior Rules

1. **No hallucination** — if uncertain, create a `needs_review` item with clarifying questions
2. **Classify intent** from 12 types: `memory | event | habit | health | finance | relationship | spiritual | profile_update | config_update | task_request | query | unknown`
3. **Future dates** → create `event` item
4. **Routines** ("daily", "weekly") → create `habit` item
5. **Profile changes implied** → emit `proposedUpdates[]` with reasoning
6. **Assign confidence** (0-1) to every item and fact

### Output Schema

```json
{
  "intent": "memory|event|habit|...|unknown",
  "items": [
    {
      "id": "string",
      "type": "memory|event|task|habit|profile_update|...|needs_review",
      "intent": "string",
      "domain": "Health|Finance|Relationships|Spiritual|Work|Personal|General",
      "ownerId": "user_id|FAMILY_SHARED",
      "horizon": "now|soon|always|unknown",
      "title": "short title",
      "content": "raw or cleaned content",
      "confidence": 0.0,
      "tags": ["string"],
      "fields": { "date": "YYYY-MM-DD", "amount": 123, "location": "string", "people": ["string"] },
      "sourceId": "source_id_if_file",
      "dedupeKey": "string"
    }
  ],
  "facts": [
    {
      "fact": "string",
      "category": "Health|Finance|...",
      "confidence": 0.0,
      "ownerId": "user_id",
      "eventDate": "YYYY-MM-DD",
      "sourceType": "text|pdf|image"
    }
  ],
  "proposedUpdates": [
    {
      "section": "string",
      "field": "string",
      "oldValue": "string",
      "newValue": "string",
      "reasoning": "string",
      "confidence": 0.0,
      "targetUserId": "user_id"
    }
  ],
  "missingData": ["string"],
  "needsReview": { "reason": "string", "questions": ["string"] },
  "confidence": 0.0,
  "notes": "string"
}
```

### Post-Processing Flow

```
AI Output → JSON.parse()
  → If facts[] or proposedUpdates[]:
      → Show VerificationSheet (user approval required)
      → User approves → commitClaims(sourceId, facts, updates)
  → If needsReview:
      → Show clarification dialog
  → appendMemoryItems(items)
  → Files stored encrypted in IndexedDB
```

---

## Prompt 2: HYPER_PERSONALIZED_PROMPT (Chief of Staff)

### Role

Generates hyper-personalized, executable recommendations grounded in the user's full life context. This is the "brain" of the system.

### When Triggered

- After data commits via `debouncedRefreshAura()` (1s debounce)
- Action: `generateDeepTasks`
- Model: **Gemini Pro** (deep reasoning)

### Input Context

```
Template Variables:
  {{profile}}         → JSON.stringify(profile)
  {{history}}         → JSON.stringify(buildMemoryContext(memory, categories, 30))
  {{family}}          → JSON.stringify(familyMembers)
  {{financeMetrics}}  → JSON.stringify(computeFinanceMetrics(profile))
  {{missingData}}     → JSON.stringify(missingFields)
  {{currentDate}}     → new Date().toISOString()
```

### Prompt Behavior Rules

1. **DATA-GROUNDED RATIONALE** — Every recommendation MUST reference a specific fact from memory or profile field
2. **VALUE ALIGNMENT** — Check tasks against user's `spiritual.coreValues`. Flag "Moral Friction" if contradicted
3. **TACTICAL PRECISION** — Provide an "Operating Manual" for every task
4. **DEFINITION OF DONE** — Specify exactly what "completed" looks like
5. **FINANCE NUMBERS** — Include daily/weekly budgets and savings rate when `financeMetrics` present
6. **HEALTH SAFETY** — Non-diagnostic guidance only; suggest clinician follow-up for concerning symptoms
7. **MISSING DATA** — List up to 3 items that would improve confidence

### Output Schema

```json
{
  "recommendations": [
    {
      "category": "Health|Finance|Relationships|Spiritual|Work|Personal|General",
      "title": "Tactical Headline",
      "description": "Concise summary",
      "impactScore": 1-10,
      "rationale": "Why this matters, referencing specific data",
      "steps": ["Step 1", "Step 2"],
      "estimatedTime": "15m",
      "inputs": ["Thing needed"],
      "definitionOfDone": "Clear completion criteria",
      "risks": ["Risk 1"],
      "needsReview": false,
      "evidenceLinks": {
        "claims": ["claim_id"],
        "sources": ["source_id"]
      }
    }
  ],
  "missingData": ["item"],
  "notes": "Any caveats"
}
```

### Validation

Output is validated against `RecommendationSchema` (Zod):

- `title`: min 3 characters
- `description`: min 5 characters
- `impactScore`: 1-10
- `rationale`: min 5 characters
- `steps[]`, `inputs[]`, `risks[]`: arrays of strings (default `[]`)

Invalid items are silently dropped.

---

## Prompt 3: Oracle (Areté Oracle)

### Role

Personal advisor that answers questions with conversational context and Google Search grounding.

### When Triggered

- User sends a message in the **Chat** tab
- Action: `askAura`
- Model: **Gemini Pro** with Google Search grounding enabled

### Input Context

```
Template: "Areté Oracle. Context: {{profile}}, History: {{history}}. Query: {{input}}"

Variables:
  {{profile}} → JSON.stringify(profile)
  {{history}} → JSON.stringify(chatHistory)
  {{input}}   → User's question
```

### Output

```json
{
  "text": "Natural language response",
  "sources": [{ "title": "Source name", "uri": "https://..." }]
}
```

The Oracle uses Google Search grounding to provide factual, up-to-date answers alongside personalized advice.

---

## Additional AI Actions

These use inline prompts constructed in `api/gemini.ts` (not from the 3 configurable templates):

### generateTasks

- **Purpose**: Generate daily tasks from memory + profile
- **Model**: Gemini Pro
- **Input**: history, profile, promptConfig, familyMembers, financeMetrics, missingData
- **Output**: `DailyTask[]`
- **Validation**: `TaskSchema` (Zod)

### generateInsights

- **Purpose**: Detect proactive insights from patterns
- **Model**: Gemini Pro
- **Input**: history, profile, promptConfig, context
- **Output**: `ProactiveInsight[]`

### generateBlindSpots

- **Purpose**: Find blind spots the user may be missing
- **Model**: Gemini Pro
- **Input**: history, profile, promptConfig, context
- **Output**: `BlindSpot[]`

### generateDailyPlan

- **Purpose**: Create prioritized daily plan
- **Model**: Gemini Pro
- **Input**: profile, timeline, goals, blindSpots, ruleOfLife, promptConfig
- **Output**: `DailyTask[]` (ordered by priority)

### generateDeepInitialization

- **Purpose**: Generate personalized content after onboarding
- **Model**: Gemini Pro
- **Input**: profile, ruleOfLife
- **Output**: `DeepInitializationResult` containing:
  - `doItems: DailyTask[]`
  - `watchItems: BlindSpot[]`
  - `alwaysDo: AlwaysChip[]`
  - `alwaysWatch: AlwaysChip[]`
  - `domainRecommendations: Record<string, Recommendation[]>`
  - `personalizedGreeting: string`

### generateEventPrepPlan

- **Purpose**: AI preparation recommendations for upcoming events
- **Model**: Gemini Pro
- **Input**: event, profile, history
- **Output**: `Recommendation` with prep steps

---

## Memory Context Selection

The `buildMemoryContext()` function in `ai/prompts.ts` selects the most relevant memories to include in prompts:

```
Scoring algorithm (per memory item):
  +100  if created today (within 24h)
  +50   if category matches the prompt's target categories
  +0-100 recency score (decays over 7 days)

Selection:
  Sort by score descending → take top 30 items
```

This ensures prompts receive:

1. **Today's signals** (highest priority)
2. **Domain-relevant** memories
3. **Recent** memories (7-day decay)

Max 30 items prevents token overflow.

---

## Domain-Specific Prompt Modifiers

Defined in `DOMAIN_PROMPTS` (`ai/prompts.ts`):

| Domain        | Directive                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Health        | Focus on sleep quality, activity, condition management. Never diagnose; suggest clinician follow-up. |
| Finance       | Focus on budget adherence, savings rate, spending patterns. Use FINANCE_METRICS numbers.             |
| Relationships | Focus on connection frequency, social energy management, goal alignment.                             |
| Spiritual     | Focus on practice consistency, value alignment, meaning. Respect user worldview.                     |
| Personal      | Focus on career development, skill building, interests, role alignment.                              |

These are appended to the base prompt when generating domain-specific recommendations.

---

## Dual-Model Strategy

```
┌─────────────────┐     ┌─────────────────┐
│  Gemini Flash   │     │  Gemini Pro     │
│  (Fast model)   │     │  (Deep model)   │
├─────────────────┤     ├─────────────────┤
│ processInput    │     │ generateDeep*   │
│ (intake router) │     │ generateTasks   │
│                 │     │ generateInsights│
│                 │     │ blindSpots      │
│                 │     │ dailyPlan       │
│                 │     │ askAura         │
│                 │     │ eventPrepPlan   │
│                 │     │ deepInit        │
└─────────────────┘     └─────────────────┘
         │                       │
         │     If either fails   │
         │          ↓            │
         │  ┌──────────────┐    │
         └─→│ OpenAI API   │←───┘
             │ (fallback)   │
             │ gpt-5.1      │
             └──────────────┘
```

### Model Selection Logic (api/gemini.ts)

```typescript
const getModel = (kind: 'pro' | 'flash') => {
  // 'pro'   → env.GEMINI_MODEL_PRO   || 'gemini-3-pro-preview'
  // 'flash' → env.GEMINI_MODEL_FLASH || 'gemini-3-flash-preview'
};
```

### Fallback Logic

1. Try Gemini (primary model)
2. If Gemini fails → try OpenAI (`gpt-5.1` with configurable reasoning effort)
3. If both fail → return fallback value (empty arrays, error messages)
4. Client always receives a valid response (never crashes)

---

## End-to-End Flow: User Logs "Had a great run today, 5km in 25 minutes"

```
1. USER INPUT
   LogBar → "Had a great run today, 5km in 25 minutes"

2. INTENT CLASSIFICATION (LogRouter.ts)
   classifyIntent() → MEMORY
   resolveTargetUser() → activeUserId

3. API CALL (geminiService.ts → api/gemini.ts)
   POST /api/gemini
   action: "processInput"
   payload: { input, history(30 items), activeProfile, promptConfig }

4. AI PROCESSING (Gemini Flash + LOG_BAR_INGEST_PROMPT)
   Returns:
   {
     "intent": "health",
     "items": [{
       "type": "health_record",
       "domain": "Health",
       "title": "5km run in 25 minutes",
       "content": "Had a great run today, 5km in 25 minutes",
       "confidence": 0.95,
       "fields": { "distance": "5km", "time": "25min" }
     }],
     "facts": [{
       "fact": "Completed 5km run in 25 minutes",
       "category": "Health",
       "confidence": 0.95,
       "sourceType": "text"
     }],
     "proposedUpdates": [{
       "section": "health",
       "field": "activities",
       "newValue": "running (5km)",
       "reasoning": "User reported running activity",
       "confidence": 0.8
     }],
     "confidence": 0.95
   }

5. USER VERIFICATION (VerificationSheet.tsx)
   → User reviews extracted facts
   → Approves profile update (activities → "running (5km)")
   → Clicks "Commit"

6. STATE UPDATE (useAura.ts)
   commitClaims() → Creates Claim (status: COMMITTED, confidence: 95)
   appendMemoryItems() → Adds MemoryItem (category: Health)
   updateProfile() → Updates profile.health.activities

7. AI RE-ANALYSIS (debouncedRefreshAura, 1s delay)
   generateDeepTasks() → New recommendation:
     "Increase weekly running distance to 15km"
     rationale: "You completed 5km today. Progressive overload suggests..."
   generateBlindSpots() → New blind spot:
     "Running without documented stretching routine"
     severity: "medium"

8. DASHBOARD UPDATE (reactive)
   → New task appears in DoWatchSection
   → Health pillar coverage score increases
   → New blind spot appears in radar
```

---

## Prompt Customization

Users can modify any of the 3 prompts via **Settings → Prompt Management**:

```typescript
interface PromptConfig {
  id: string; // 'internalization' | 'oracle' | 'deepPlanning'
  name: string; // Display name
  purpose: string; // Description
  template: string; // Current template (user-editable)
  defaultTemplate: string; // Original template (for reset)
}
```

### Template Variables Available

| Variable             | Content                  | Available In          |
| -------------------- | ------------------------ | --------------------- |
| `{{profile}}`        | Full user profile JSON   | All prompts           |
| `{{history}}`        | Selected memory items    | All prompts           |
| `{{family}}`         | Family member profiles   | Ingest, Deep Planning |
| `{{input}}`          | User's raw text          | Ingest, Oracle        |
| `{{fileMeta}}`       | Attached file metadata   | Ingest                |
| `{{financeMetrics}}` | Computed finance metrics | Deep Planning         |
| `{{missingData}}`    | Fields with low coverage | Deep Planning         |
| `{{currentDate}}`    | ISO date string          | Deep Planning         |

---

## Audit & Improvement Points

### What to Audit

1. **Grounding quality**: Are recommendations actually citing profile/memory data?
2. **Hallucination rate**: How often does the AI invent facts not in the input?
3. **Confidence calibration**: Does 0.9 confidence actually mean 90% correct?
4. **Value alignment**: Are Moral Friction flags triggering appropriately?
5. **Missing data detection**: Is the AI identifying the right gaps?
6. **Domain prompt effectiveness**: Are domain modifiers improving output quality?

### Potential Improvements

1. **Structured output mode**: Use Gemini's structured output feature instead of raw JSON parsing
2. **Few-shot examples**: Add example inputs/outputs to each prompt
3. **Chain-of-thought**: Add reasoning steps before final output
4. **Prompt versioning**: Track which prompt version generated each output
5. **A/B testing**: Compare prompt variants on same input
6. **Token budgeting**: Monitor and optimize context window usage
7. **Feedback loop**: Use keep/remove signals to fine-tune recommendations
8. **Retrieval-Augmented Generation (RAG)**: Replace `buildMemoryContext()` with embedding-based retrieval for better context selection
