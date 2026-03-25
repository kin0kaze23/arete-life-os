# Areté Life OS — Security Enhancement Plan (Revised)

## Goal

Harden the app for sensitive personal data while preserving usability, accessibility, and zero‑knowledge guarantees.

---

## Guiding Principles

- **Zero‑knowledge remains non‑negotiable** (server never sees plaintext).
- **Secure by default, usable by design** (no heavy friction for legitimate users).
- **Defense in depth** (CSP + input controls + rate limits + monitoring).
- **Minimize false positives** (avoid over‑sanitizing user content).

---

## Status (2026-01-30)

- **Phase 1**: Done (CSP report-only added, input schemas + payload limits, expanded redaction, dev proxy bound + size checks).
- **Phase 2**: Done (Tailwind migrated to build pipeline; script CSP tightened; report-only endpoint added).
- **Phase 3**: Done (passphrase strength guidance + blocklist, localStorage backoff lockouts).
- **Phase 4**: Done (Vercel Blob backups + recovery code flow + rate limits + retention).
- **Phase 5**: Deferred (multi-device sync not in scope for MVP).
- **Phase 6**: Partial (audit log UI added; key rotation still deferred).

---

## Phase 0: Baseline & Threat Model (No code risk)

### 0.1 Threat Model Snapshot

- **Primary risks**: XSS, prompt injection, local data loss, accidental sharing.
- **Secondary risks**: brute‑force attempts, data exposure via logs, backup misuse.

### 0.2 Security UX Commitments

- Keep onboarding and unlock flow fast.
- Allow strong passphrases (not necessarily long) if entropy is high.
- Avoid lockouts that trap legitimate users.

---

## Phase 1: Immediate Hardening (Low risk, high impact)

### 1.1 CSP in Report‑Only Mode

**Current**: `vercel.json` uses `unsafe-inline` and `unsafe-eval`.

**Plan**:

1. Add **CSP Report‑Only** header first.
2. Collect violations for 1–2 weeks.
3. Fix violations before enforcing.

**Outcome**: Safe CSP rollout without breaking UX.

### 1.2 Input Safety for AI Calls (Minimal Sanitization)

**Goal**: reduce prompt injection without mutating user intent.

- Add `validatePayloadSize()` (max prompt size).
- Strip only **control characters** and **null bytes**.
- Add **Zod request schemas** for inbound API payloads.
- Keep user text unaltered to preserve recommendation quality.

### 1.3 API Key & PII Redaction

- Extend redaction for OpenAI, Anthropic, Gemini tokens, and common secret patterns.
- Add email‑like pattern masking in server logs.

### 1.4 Dev Proxy & Request Limits

- Bind dev server to `127.0.0.1` (already aligned in Playwright config).
- Add request body size limits (e.g., 2MB) server‑side.

---

## Phase 2: CSP Tightening + Tailwind Migration

### 2.1 Remove `unsafe-eval` and `unsafe-inline`

**Prerequisite**: migrate Tailwind CDN → build‑time PostCSS.

- Replace `https://cdn.tailwindcss.com` with local build pipeline.
- Remove `unsafe-inline` and `unsafe-eval` after verifying no CSP violations.
- If needed, add **nonce‑based** scripts via middleware only for controlled inline blocks.

**Verification**: CSP violations = 0 in DevTools.

---

## Phase 3: Passphrase & Brute‑Force Protection (Usable by default)

### 3.1 Passphrase Strength Policy

- Use **entropy scoring** instead of strict length rules.
- Recommended: 10+ chars or 4+ word passphrase.
- Block only top‑10K known passwords.

### 3.2 Brute‑Force Mitigation

- Store lockout state in `localStorage` (not session‑only).
- Use **progressive backoff** (e.g., 30s → 2m → 10m) with reset after success.
- Avoid multi‑hour lockouts to preserve usability.

---

## Phase 4: Encrypted Backup (Opt‑In)

**Goal**: prevent catastrophic data loss without breaking zero‑knowledge.

### Design

- **Client encrypts** vault (unchanged)
- **Server stores only encrypted blobs**
- **Backup is opt‑in** with clear UX warnings
- **Storage target**: Vercel Blob (MVP)

### Identity Model (Safer than passphrase hash)

- Use a **user‑generated Recovery Code** + passphrase to derive `vaultId`.
- Recovery code: **32 hex characters** (displayed once, user confirms saved).
- `vaultId = PBKDF2((passphrase + ":" + recovery_code), "arete-backup-v1", 50k)`

This avoids online guessing from passphrase‑only identity while keeping self‑custody.

### Controls

- Rate limits: **3 backups/day** and **10 restore attempts/day** per recovery identity.
- Storage cap per backup: **10 MB**.
- Retention: **90 days**.
- Keep **last 10 versions** + latest pointer.

---

## Phase 5: Multi‑Device Sync (Optional, High Complexity)

Only implement if multi‑device is a near‑term product goal.

- Sync is **opt‑in** and transparent to user.
- Conflicts resolved with explicit UI prompt.
- Sync indicator + version history required.

---

## Phase 6: Advanced Security Enhancements

### 6.1 SRI (if CDN remains)

- Add integrity + crossorigin attributes to external resources.

### 6.2 Key Rotation (User‑Initiated)

- “Change Passphrase” flow re‑encrypts vault and files.
- Do not force rotation; provide optional reminders.

### 6.3 Security Audit Trail (Low Friction)

- Log unlock attempts, export/import, passphrase changes.
- Surface in a “Security” panel for power users only.

---

## Implementation Order (Revised)

| #   | Item                            | Phase | Priority | Notes                |
| --- | ------------------------------- | ----- | -------- | -------------------- |
| 1   | CSP Report‑Only header          | 1.1   | High     | Safe rollout         |
| 2   | Request size limits + schemas   | 1.2   | High     | Low usability impact |
| 3   | API key redaction               | 1.3   | High     | Low risk             |
| 4   | Dev proxy bind + body limits    | 1.4   | Medium   | Dev only             |
| 5   | Tailwind build migration        | 2.1   | High     | Enables CSP tighten  |
| 6   | CSP enforcement                 | 2.1   | High     | After migration      |
| 7   | Passphrase strength + blocklist | 3.1   | Medium   | Avoid hard lockouts  |
| 8   | Brute‑force backoff             | 3.2   | Medium   | Keep humane timeouts |
| 9   | Encrypted backup (opt‑in)       | 4     | High     | Usability + safety   |
| 10  | Multi‑device sync               | 5     | Optional | High complexity      |
| 11  | Key rotation                    | 6.2   | Optional | User‑initiated       |
| 12  | Audit trail                     | 6.3   | Optional | Low friction         |

---

## Verification Steps

- **CSP**: No violations in DevTools when enforced.
- **Input safety**: oversized payloads rejected gracefully.
- **Passphrase**: “Password1!” rejected, strong passphrase accepted.
- **Backup**: opt‑in flow works; restore returns encrypted blob.
- **Sync**: conflicts resolved with explicit UI prompt.

---

## Security Guarantees Maintained

- AES‑256‑GCM encryption at rest
- Zero‑knowledge architecture
- No plaintext stored server‑side
- Auto‑lock on inactivity

---

## Usability & Accessibility Notes

- Avoid hard lockouts that block legitimate users.
- Provide clear guidance for secure passphrases.
- Minimize modal spam or warning fatigue.
- All security warnings must be readable by screen readers.
