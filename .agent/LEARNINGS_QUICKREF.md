# Learnings Quickref

Updated: 2026-01-30

- [2026-01-30] **Cost guardrails must be net-new only** to avoid false positives on refactors.
- [2026-01-30] **Approvals should be centralized** in a regex allowlist for cost-neutral AI call refactors.
- [2026-01-30] **UI smoke tests are more stable** when they target `data-testid` anchors instead of text content.
- [2026-01-30] **Code-splitting across major views** removes build chunk warnings and reduces load risk.
- [2026-01-30] **Single wrapper scripts** reduce cognitive overhead and ensure consistent safety checks.
- [2026-01-29] **Batching + cadence** cuts cost without losing quality when outputs are structured and validated.
- [2026-01-29] **Deterministic parsing** is safe when confidence‑gated and combined with AI fallback.
- [2026-01-29] **Feature-flagged routing** lets us prepare for multi‑provider without destabilizing core loops.
- [2026-01-29] **Vault persistence is a latency multiplier**: redundant saves materially slow perceived responsiveness.
- [2026-01-29] **Adaptive routing preserves quality** when paired with schema validation and Pro fallback.
- [2026-01-29] **Prompt size control** reduces tail latency without sacrificing core context.
- [2026-01-28] Silent failures are debugging nightmares
- [2026-01-28] Log both message AND stack trace
- [2026-01-28] Return error details in response for client visibility
- [2026-01-28] `vite.config.ts` changes require full restart
- [2026-01-28] `pkill -f "vite" && npm run dev` is safer than manual Ctrl+C
- [2026-01-28] Old server sessions can show stale behavior
- [2026-01-28] 80-line inline functions → hard to debug
- [2026-01-28] Extracted modules with logging → easy to trace
- [2026-01-28] Each module can be tested independently
