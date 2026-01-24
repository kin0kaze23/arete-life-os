# Spec Pack — Aura Life OS (Steps 2–10)

## Step 2 — Premium Dark Design System

- **Principles:** Neural density, domain sovereignty, progressive disclosure, local‑first terminal aesthetic.
- **Tokens**
  - Colors: bg‑void `#02040a`, bg‑deep `#08090c`, bg‑elevated `#0d1117`, border‑subtle `rgba(255,255,255,0.08)`
  - Brand: indigo `#6366f1`, emerald `#10b981`, amber `#f59e0b`, rose `#f43f5e`, cyan `#06b6d4`
  - Typography: Inter (sans), JetBrains Mono (mono), tracking‑tighter for headers
  - Radius: item 1rem, card 2rem, panel 3rem
  - Elevation: glass blur with subtle shadow
- **Component rules**
  - Bento Card: icon + domain header, bg‑elevated, 1px border, hover border 20%
  - Neural Chip: rounded‑xl, low‑opacity brand fill
  - Integrity Badge: mono % confidence, color scales rose→emerald
  - Global Drawer: right, 40% width, heavy blur
  - Vitality Sparkline: minimal 1px stroke, glow via CSS filter
  - Memory Log Item: vertical timeline marker, payload sub‑card
  - Diff Row: legacy vs proposed with commit
- **Motion:** cubic‑bezier(0.4,0,0.2,1); staggered ingress; 4s pulse
- **Accessibility:** 4.5:1 contrast, 2px indigo ring focus, aria‑live for thinking/sync, labeled icons.

## Step 3 — Entity Model + Events

- **Entities**
  - UserProfile (sectioned: identify/personal/health/finances/relationship/spiritual + privacySettings)
  - Source (id, data, mimeType, name, ownerId)
  - MemoryItem (id, timestamp, content, sourceId, ownerId, extractionConfidence)
  - Claim (id, sourceId, fact, type FACT|INFERENCE, confidence 0–100, status PROPOSED|COMMITTED|CONFLICT|ARCHIVED, ownerId)
  - Recommendation (rationale, steps, estimatedTime, inputs, DoD, risks, status ACTIVE|DISMISSED|APPLIED, needsReview, missingFields)
  - DailyTask (why, estimate_min, energy, due_at, best_window, links)
  - RuleOfLife (season, weeklyRhythm, nonNegotiables, taskPreferences)
- **Relationships**
  - Source → MemoryItem → Claim lineage
  - Claims + UserProfile → Recommendation
  - Recommendation → DailyTask
  - AuditLogEntry links to all mutations
- **Lifecycle**
  - Claim: PROPOSED → COMMITTED / ARCHIVED; CONFLICT blocks
  - Task: ACTIVE → COMPLETED / DISMISSED
  - Recommendation: DRAFT (needsReview) → ACTIVE → APPLIED
- **Events**
  - INGEST_SIGNAL, APPROVE_FACTS, REJECT_FACTS, APPLY_PROFILE_UPDATE, RESOLVE_CONFLICT, ARM_STRATEGY, PLAN_MISSION, COMPLETE_TASK, MERGE_DUPLICATES, IMPORT_EXPORT, PURGE_KERNEL
- **Audit rules**
  - Append‑only, performerId, sourceId on profile updates, Unix ms timestamps.

## Step 4 — Log Bar UX Spec

- **Intents**: INGEST_MEMORY, MUTATE_PROFILE, TUNE_LOOP, EXECUTE_MISSION, ORACLE_QUERY, SYSTEM_ACTION
- **Log Item Model**: id, intent, payload, intelligence, confidence, state
- **States**: draft / processing / success / needs‑review / failed
- **Actions**: CRUD, plan, summarize, attach/link, export/import
- **Needs‑Review**: missingFields mini‑form, A/B diff for conflicts, owner attribution chips
- **Reactivity**: commits update dashboard instantly; all transitions logged
- **Empty/Loading/Error**: rotating hints, neural pulse, offline buffer, retry flow
- **Compatibility**: LogBar becomes stateful intent router; VerificationSheet logic merged into Log Items.

## Step 5 — Family Memory Vault UX

- **Flow**: Log Bar upload → Source → MemoryItem → Claims → Domain routing → Family attribution → Commit
- **Claim Card**: domain icon, owner badge, fact/inference, confidence, source link, timestamp, actions (resolve/dedupe/pin/purge)
- **Dedup/Versioning**: >90% semantic match → MERGE_DUPLICATES; contradictory facts → CONFLICT; numeric metrics versioned by time
- **Source‑of‑truth**: Profile fields link to supporting claim IDs; deletion shows impact
- **Search/Timeline**: natural language search, domain+owner filters, time playback
- **Privacy**: domain visibility per privacySettings; FAMILY_SHARED visible to admins
- **States**: analyzing, empty vault, sync error
- **Compatibility**: MemoryVaultView + ConflictModal + useAura additions.

## Step 6 — Recommendations UX

- **Card**: BentoCard with summary/expanded SOP
- **Status**: DRAFT/ACTIVE/APPLIED colored rail
- **Needs‑Review**: inline mini‑form from missingFields; finalize to ACTIVE
- **SOP**: steps + DoD + inputs + time + risks + task preview
- **Evidence**: rationale + claim/source chips
- **States**: loading, empty, error
- **Compatibility**: RecommendationsWidget + ReviewCard + ARM_STRATEGY in useAura.

## Step 7 — Plan My Day (Time‑blocked)

- **Inputs**: RuleOfLife, TimelineEvents (72h), recent memory trends, finance constraints, dailyCap
- **Rules**: impact‑weighted; intensity scales buffers; domain balance; needsReview calibrated first
- **Layout**: time‑blocked timeline, energy‑aligned slots, 15m transitions, 30m calibration gaps
- **Explainability**: rationale cites memory/profile; confidence flags <70%
- **Edge cases**: dailyCap overflow → triage modal; missing data → review card; rule violation → auto‑archive
- **Compatibility**: generateDailyPlan JSON w/ start/end; Dashboard “Daily Mission” timeline.

## Step 8 — Dashboard Customization

- **Edit Mode**: grid overlay, widget handles, library drawer
- **Widget registry**: VITALITY, RADAR, HORIZON, INSIGHTS, GOALS, MISSION (pinned)
- **Guardrails**: 12‑col grid; min 2x2; collision rules; vertical extend
- **Persistence**: `aura_layout_[user]_[breakpoint]`; included in export
- **Reset/Undo**: snapshot on edit, snackbar undo, restore defaults
- **States**: skeleton grid, corrupted layout fallback, empty canvas
- **Compatibility**: layout state in useAura; DashboardView renders via registry.

## Step 9 — Onboarding/Profile UX

- **Required fields**: Identity (name, DOB, location, origin), Personal (status, job role, company), Health (height/weight/sleep/wake/activity freq), Finance (income/liabilities/fixed/variable), Relationship (living arrangement/social energy), Spiritual (worldview/practice pulse)
- **Optional**: ethnicity, interests, activities, conditions, meds, assets, commitments, social goals, values
- **Inputs**: selects/chips + “Other” inline text; ChipInput for free‑text
- **Edit anytime**: mirrored in Vault; updates live
- **Privacy**: domain visibility toggles; consent for mic/cam only on use
- **Completion logic**: profile completion ring + “skip for later” messaging
- **Compatibility**: OnboardingView + VaultView + SharedUI updates.

## Step 10 — Edge Cases + Ship Checklist

- **Edge cases**: large files, empty inputs, contradictory claims, storage quota, zero profile data, role switching, outdated import schema, modal dismissal, mobile widget overflow
- **Loading/error/empty**: CLS‑safe skeletons, 15s Gemini timeout, vault empty prompt, mission progress bar
- **Security/Privacy UX**: obfuscate sensitive fields; local/cloud indicator; non‑admin access restrictions; auto‑lock
- **Accessibility**: focus management, aria labels, contrast, keyboard traps
- **Must‑Pass Scenarios** (AC‑01 to AC‑05)
  - export/import round‑trip
  - privacy hides finance in family view
  - Plan My Day respects blocked times
  - Log Bar routes “my wife” vs “I”
  - conflict halts auto‑save until resolved

## Open decisions to confirm before coding

- Storage strategy: IndexedDB + WebCrypto vs localStorage (current repo uses localStorage).
- Claim evidence linking: how to store evidence span refs for PDFs.
- Layout library: custom grid vs third‑party (react‑grid‑layout).
- AI routing: server proxy vs client key (production requires proxy).
