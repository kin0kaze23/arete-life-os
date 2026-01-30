# Learnings Quickref

Updated: 2026-01-30

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
- [2026-01-28] Arrow functions: `const fn = () => {}` — not hoisted
- [2026-01-28] Function declarations: `function fn() {}` — hoisted
- [2026-01-28] For utilities called during initialization, use `function`
- [2026-01-28] Hard refresh (`Cmd+Shift+R`) is not enough if server is stale
- [2026-01-28] Clear localStorage if vault state is corrupted
