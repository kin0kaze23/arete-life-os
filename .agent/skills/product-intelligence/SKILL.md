---
name: product-intelligence
description: Strategic planning and feature specification. Ensures consistency between requirements (PRDs), design systems, and technical implementation.
---

# Product Intelligence Skill

Use this skill when drafting PRDs, creating implementation plans, or evaluating feature requests for strategic alignment.

## 1. Requirement Analysis (PRD Review)

When following a PRD, ensure:

- **Core Value Prop**: The feature directly supports the user's "Why" (e.g., Season of Faith, Productivity).
- **Edge Case Coverage**: Potential pitfalls (offline mode, data loss, invalid input) are identified.
- **Success Metrics**: How do we measure if this feature is "Done" and successful?

## 2. Implementation Strategy

- **Agentic Workflow**: Break down complex features into component-level tasks.
- **Dependency Map**: Identify shared hooks (`useAura`), services (`geminiService`), and DB schemas before coding.
- **State management**: Decide if state should be local, context-based, or persistent (IndexedDB).

## 3. Consistency Gatekeeping

- **Naming Conventions**: Labels and variable names must match the PRD terminology.
- **Design Alignment**: UI must follow the established symbols/colors in `DESIGN_SYSTEM_DARK.md`.
- **Logic Sync**: AI prompts in `ai/prompts.ts` must align with the intended feature behavior.

## 4. Verification Methodology

- **Critical Path Testing**: Identify the 3 most important user steps and test them first.
- **Negative Testing**: Purposefully try to break the feature to ensure robust error handling.
- **System Integration**: Verify how the new feature affects the overall "Daily Intelligence" loop.

## 5. User Journey Sentiment Analysis

When evaluating a feature, map the **emotional arc** of the user's experience:

- **Entry Point**: Is the user excited, frustrated, or confused?
- **First Interaction**: Does the UI reduce or amplify cognitive load?
- **Success State**: What does "done" feel like? (Satisfying, empowering, relieved)
- **Failure State**: How do we help the user recover gracefully?

## 6. Strategic Alignment Logic

For every feature request, validate against strategic pillars:

- **Alignment with "Why"**: Does this help the Season of Faith or Productivity?
- **Zero-Knowledge Integrity**: Does this preserve the local-first, encrypted architecture?
- **User Agency**: Does this give the user more control or automate thoughtfully?
- **Simplicity over Complexity**: Can we achieve 80% of the value with 20% of the code?
