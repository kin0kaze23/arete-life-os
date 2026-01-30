---
description: Checklist when adding a new AI generator function
---

## AI Generator Checklist

1. [ ] Category-filtered `buildMemoryContext()` with appropriate limit
2. [ ] `buildFeedbackContext()` for `{{feedback}}`
3. [ ] Committed claims for `{{verifiedFacts}}`
4. [ ] `currentDate` for temporal reasoning
5. [ ] Finance metrics and missing data for completeness
6. [ ] Schema validation (Zod) for output
7. [ ] Model fallback (Flash → Pro or Pro → OpenAI)
8. [ ] Update `docs/AI_PROMPT_FLOW.md`
9. [ ] Run `npm run doctor`
