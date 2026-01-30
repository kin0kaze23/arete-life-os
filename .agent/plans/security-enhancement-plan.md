# Areté Life OS — Security Enhancement Plan

## Problem Statement

All user data lives in localStorage/IndexedDB — clearing browser data means **total data loss**. There are no user accounts, no cloud backup, and several CSP/input validation gaps. This plan hardens the app for multi-user production use while preserving zero-knowledge architecture.

---

## Phase 1: Immediate Hardening (No New Infrastructure)

### 1.1 CSP Tightening — Remove `unsafe-inline` / `unsafe-eval`

**File**: `vercel.json` (line 28)

XSS is the most dangerous attack for a client-side encrypted app — it can access the decrypted CryptoKey in memory.

- Remove `'unsafe-eval'` from `script-src` entirely
- Replace `'unsafe-inline'` with a **nonce-based strategy** via Vercel Edge Middleware
- Evaluate moving Tailwind from CDN to build-time PostCSS (eliminates `unsafe-eval` need)
- New file: `middleware.ts` — generates per-request nonce, injects into CSP header

### 1.2 Input Sanitization for AI Calls

**Files**: `api/gemini.ts`, new `api/sanitize.ts`

User input goes directly to AI APIs without filtering — prompt injection risk.

- Create `api/sanitize.ts` with `sanitizeUserInput()`, `sanitizeProfile()`, `validatePayloadSize()`
- Strip control characters, HTML/script tags, known injection patterns
- Add Zod schemas for ALL incoming request payloads (not just AI outputs)
- Add max prompt length check (50,000 chars)

### 1.3 Passphrase Strength Improvements

**File**: `vault/VaultLockView.tsx` (lines 40-54)

Current checker only tests length/case/digits/symbols — no dictionary or pattern checks.

- Add top-10K common passwords blocklist
- Add pattern detection (keyboard walks, repeated chars, sequences)
- Increase minimum length from 8 → 12 for new vaults
- Show specific weakness feedback to user

### 1.4 Brute Force Hardening

**Files**: `vault/VaultLockView.tsx`, `data/cryptoVault.ts`

Lockout state is in `sessionStorage` — resets when browser closes.

- Move lockout state to `localStorage`
- Add exponential backoff: 15min → 1hr → 4hr
- Increase PBKDF2 iterations from 100K → 200K for new vaults (backward-compatible via `VaultMeta.iterations`)

### 1.5 API Key Redaction

**File**: `api/gemini.ts` (lines 718-721)

- Add patterns for OpenAI (`sk-`), Anthropic (`sk-ant-`), generic long tokens
- Add email address redaction for privacy

### 1.6 Dev Proxy Security

**File**: `vite.config.ts`

- Bind dev server to `127.0.0.1` instead of `0.0.0.0` (currently exposes to all network interfaces)
- Add 1MB body size limit to proxy
- Add Origin/Referer localhost check

### 1.7 CORS + Body Size Limits

**File**: `api/gemini.ts`

- Add explicit `Access-Control-Allow-Origin` restricted to app domain
- Handle OPTIONS preflight
- Reject requests with `content-length` > 2MB

---

## Phase 2: Encrypted Cloud Backup (Solve Data Loss)

### Architecture

Zero-knowledge cloud backup using **Vercel Blob Storage**. Server stores ONLY encrypted blobs — never plaintext.

**Identity without accounts**: Derive a `vaultId` from the passphrase using a SEPARATE salt/key derivation:

```
vaultId = SHA-256(PBKDF2(passphrase, identity_salt, 50000))
```

This is NOT the encryption key — different salt, different purpose. Server cannot derive the encryption key from `vaultId`.

### New Files

| File                    | Purpose                          |
| ----------------------- | -------------------------------- |
| `data/vaultIdentity.ts` | Derive vault ID from passphrase  |
| `data/backupService.ts` | Client-side backup/restore logic |
| `api/backup.ts`         | Vercel serverless backup CRUD    |

### Backup Flow

1. On vault save → debounce backup trigger (max every 5 minutes)
2. Client sends already-encrypted blob to `POST /api/backup` with `vaultId` + `checksum`
3. Server stores in Vercel Blob Storage, keyed by `vaultId`
4. Keep last 5 versions per vault for rollback

### Restore Flow

1. User opens app with no local vault → enters passphrase
2. Client derives `vaultId` → calls `GET /api/backup?vaultId=xxx`
3. Server returns encrypted blob → client imports via existing `importVault()`
4. Client unlocks normally with passphrase

### Modified Files

- `data/cryptoVault.ts` — Add `deriveVaultId()` with separate salt
- `core/useAura.ts` — Add `autoBackup()` and `restoreFromCloud()` methods
- `vault/VaultLockView.tsx` — Add "Restore from backup" option

### Security Controls

- Rate limits: 5 writes/hour/IP, 20 reads/hour/IP
- Storage cap: 50MB per vault
- Version history: last 5 backups with timestamps

---

## Phase 3: Multi-User Foundation

### Account Model

**Passphrase-derived identity** + optional email for recovery.

```typescript
type ServerVault = {
  vaultId: string; // SHA-256 of PBKDF2(passphrase, identity_salt)
  encryptedBlob: Uint8Array; // AES-256-GCM encrypted vault
  email?: string; // SHA-256 hashed, for recovery lookup only
  createdAt: number;
  updatedAt: number;
};
```

No passwords stored server-side. The passphrase IS the identity.

### Multi-Device Sync

- Each vault save increments a `version` counter inside the encrypted vault
- Sync protocol: compare versions → newer wins, conflict → prompt user
- New files: `api/sync.ts`, `data/syncService.ts`, `vault/SyncStatusIndicator.tsx`

### Modified Files

- `core/useAura.ts` — Sync on unlock, periodic sync while active
- `data/cryptoVault.ts` — Add version counter to vault metadata
- `vault/VaultLockView.tsx` — Sync indicator, conflict resolution UI

---

## Phase 4: Advanced Security

### 4.1 Subresource Integrity (SRI)

Add `integrity` + `crossorigin` attributes to all CDN resources in `index.html`. Generate hashes at build time.

### 4.2 Key Rotation

- "Change Passphrase" function: decrypt → new salt → new key → re-encrypt vault + all IndexedDB files
- Migrate cloud backup to new `vaultId`
- Prompt rotation every 90 days

### 4.3 Enhanced Audit Logging

Extend existing `AuditLogEntry` to capture: unlock attempts, exports, imports, passphrase changes, sync events. Add dedicated "Security" view in dashboard.

### 4.4 Anomaly Detection

Client-side monitoring: unusual unlock times, rapid lock/unlock cycles, multiple failed attempts. Surface warnings in dashboard.

---

## Implementation Order

| #   | Item                            | Phase | Effort   | Security Impact |
| --- | ------------------------------- | ----- | -------- | --------------- |
| 1   | Dev proxy bind to localhost     | 1.6   | 5 min    | Medium          |
| 2   | API key redaction               | 1.5   | 15 min   | Low-Med         |
| 3   | Request body size limits + CORS | 1.7   | 1 hr     | Low-Med         |
| 4   | Brute force hardening           | 1.4   | 1 hr     | Medium          |
| 5   | Passphrase strength             | 1.3   | 2 hrs    | Medium          |
| 6   | Input sanitization              | 1.2   | 3 hrs    | Medium          |
| 7   | CSP tightening                  | 1.1   | 4-8 hrs  | **High**        |
| 8   | Encrypted cloud backup          | 2     | 2-3 days | **High**        |
| 9   | Multi-user sync                 | 3     | 3-5 days | **High**        |
| 10  | SRI for CDN deps                | 4.1   | 1 hr     | Medium          |
| 11  | Enhanced audit logging          | 4.3   | 2 hrs    | Low-Med         |
| 12  | Key rotation                    | 4.2   | 4 hrs    | Medium          |
| 13  | Anomaly detection               | 4.4   | 1 day    | Low             |

---

## New Files Summary

| File                            | Purpose                               | Phase |
| ------------------------------- | ------------------------------------- | ----- |
| `middleware.ts`                 | Vercel Edge Middleware for CSP nonces | 1.1   |
| `api/sanitize.ts`               | Input sanitization + validation       | 1.2   |
| `data/vaultIdentity.ts`         | Derive vault ID from passphrase       | 2     |
| `api/backup.ts`                 | Cloud backup CRUD endpoint            | 2     |
| `data/backupService.ts`         | Client backup/restore logic           | 2     |
| `api/sync.ts`                   | Multi-device sync endpoint            | 3     |
| `data/syncService.ts`           | Client sync logic                     | 3     |
| `vault/SyncStatusIndicator.tsx` | Sync status UI                        | 3     |
| `core/securityMonitor.ts`       | Anomaly detection                     | 4.4   |

## Critical Files Modified

| File                      | Changes                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `vercel.json`             | CSP nonce strategy, remove unsafe-inline/eval              |
| `api/gemini.ts`           | Input sanitization, CORS, body limits, redaction           |
| `data/cryptoVault.ts`     | PBKDF2 200K, vault identity, version counter, key rotation |
| `vault/VaultLockView.tsx` | Passphrase strength, brute force, restore UI               |
| `vite.config.ts`          | Localhost binding, body size limit                         |
| `core/useAura.ts`         | Auto backup, sync hooks, audit events                      |

---

## Verification Steps

1. **Phase 1**: Run `npm run doctor` after each change. Test CSP with Chrome DevTools → Console (no CSP violations). Test passphrase with "Password1!" (should be rejected). Test body limits with oversized payloads.
2. **Phase 2**: Clear browser data → restore from cloud → verify all data intact. Export vault → clear → import → verify. Test backup rate limits.
3. **Phase 3**: Open app in two browsers with same passphrase → verify sync. Create conflict → verify resolution UI.
4. **Phase 4**: Verify SRI hashes match CDN resources. Change passphrase → verify re-encryption. Check audit log entries.

---

## Security Guarantees Maintained

All phases preserve:

- **AES-256-GCM encryption at rest** — server never sees plaintext
- **Zero-knowledge architecture** — passphrase never leaves browser
- **No plaintext on disk** — all data encrypted before write
- **Auto-lock on inactivity** — 15-minute timeout unchanged
