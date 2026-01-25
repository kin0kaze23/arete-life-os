# Dashboard Spec: Do + Watch with Horizon Layers

## Layout (above the fold)

1. Do (Today) card

- Top 3 priorities
- Each item: title + 1-line why + effort/time + "Start"
- Expand shows full execution template

2. Watch (Today) card

- Top 3 watch-outs
- Each item: title + why + impact + next prevention step

Primary CTA: Plan My Day

## Horizon switcher (filters both Do & Watch)

- Now (Today)
- Soon (7–14 days)
- Always (ongoing routines + guardrails)

## Domain panels (below fold)

For each domain: Personal/Identity, Health, Finance, Relationship, Spiritual

- show top 1–2 recommendations with View all
- show status chip: OK / Attention / At Risk
- clicking opens recommendation detail

## Always layer content (evergreen)

### Always-Do

- habits + recurring routines (streak/next due)
- shown as compact chips/cards

### Always-Watch

- baseline guardrails (health/finance/relationship/spiritual)
- only surfaces prominently when drifting

## Limits (anti-overwhelm)

- Max 3 Do + max 3 Watch shown at once on the main surface
- If more exist: "+N more" + View all
- Plan My Day caps total planned tasks to realistic limit (default 5–8)

## States

- loading: skeleton cards
- empty: helpful “get started” CTA
- needs-review: badge count + quick resolve flow
- error: retry + fallback instructions

## Acceptance criteria

- User can answer within 10 seconds:
  - what to do today + why + how
  - what to watch + why + next prevention action
- Switching horizon changes both Do and Watch consistently
- Completing/logging tasks updates dashboard immediately
