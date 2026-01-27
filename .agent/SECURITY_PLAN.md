# Areté Life OS - Security & Authentication Plan

## Executive Summary

This document evaluates the current security architecture and provides a roadmap for adding authentication and secure cross-device data access while maintaining zero-knowledge encryption principles.

---

## Part 1: Current Security Architecture

### How Data is Stored Now

| Storage Layer    | Technology   | Contents                              | Encryption Status |
| ---------------- | ------------ | ------------------------------------- | ----------------- |
| **Vault**        | localStorage | User profile, memory, goals, settings | ✅ AES-256-GCM    |
| **Vault Meta**   | localStorage | Salt, iteration count                 | ❌ Plaintext      |
| **File Store**   | IndexedDB    | Uploaded files, images, documents     | ❌ Plaintext      |
| **Session Keys** | Memory only  | Derived CryptoKey for current session | N/A (transient)   |

### Encryption Details

**File: `data/cryptoVault.ts`**

```
Algorithm:      AES-256-GCM (authenticated encryption)
Key Derivation: PBKDF2-SHA256
Iterations:     100,000
Salt:           16 bytes (random, stored in meta)
IV:             12 bytes (random per encryption)
```

**Security Strengths:**

1. Industry-standard AES-256-GCM provides confidentiality + integrity
2. PBKDF2 with 100K iterations provides brute-force resistance
3. Random salt prevents rainbow table attacks
4. Zero-knowledge: server never sees decrypted data

**Security Gaps Identified:**

| Gap                      | Risk Level | Description                                                         |
| ------------------------ | ---------- | ------------------------------------------------------------------- |
| **Unencrypted files**    | HIGH       | IndexedDB files stored in plaintext                                 |
| **No auth layer**        | MEDIUM     | Anyone with device access can attempt unlimited unlock tries        |
| **No rate limiting**     | MEDIUM     | Brute force attacks possible on passphrase                          |
| **No session timeout**   | LOW        | Unlocked vault stays open indefinitely                              |
| **Local-only storage**   | N/A        | Not a gap, but limits cross-device use                              |
| **No backup encryption** | MEDIUM     | Export function exposes encrypted blob (still passphrase-protected) |

---

## Part 2: Authentication Options

### Option A: OAuth + End-to-End Encryption (Recommended)

**Architecture:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client App    │────▶│   Auth Server   │────▶│   Cloud Vault   │
│                 │     │  (Supabase/     │     │   (Encrypted    │
│  - Local vault  │◀────│   Firebase)     │◀────│    blobs)       │
│  - E2E encrypt  │     │  - OAuth/Magic  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**How it works:**

1. User authenticates via OAuth (Google, Apple) or magic link
2. Authentication grants access to encrypted cloud vault
3. Passphrase still required to decrypt data locally
4. Server only stores encrypted blobs - zero knowledge maintained

**Pros:**

- True cross-device access
- Zero-knowledge preserved
- Industry-standard OAuth
- Easy for users (social login)

**Cons:**

- Requires backend infrastructure
- Ongoing hosting costs
- More complex implementation

### Option B: Device-Linked Magic Links

**Architecture:**

```
┌─────────────────┐     ┌─────────────────┐
│   Device A      │────▶│   Email Server  │
│   (Primary)     │     │   (Resend.com)  │
│                 │     └─────────────────┘
│                 │              │
│                 │◀─────────────┘
│   Vault synced  │     Magic link sent
│   locally       │     to verified email
└─────────────────┘
         │
         │ Sync via encrypted
         │ file transfer
         ▼
┌─────────────────┐
│   Device B      │
│   (Secondary)   │
└─────────────────┘
```

**How it works:**

1. User registers email address
2. When accessing from new device, magic link sent to email
3. Link allows encrypted vault download
4. Passphrase still required to decrypt

**Pros:**

- No OAuth dependency
- Simpler implementation
- Email as identity

**Cons:**

- Less secure than OAuth
- Email delivery issues
- Manual sync process

### Option C: Passphrase-Only with Cloud Backup

**Architecture:**

```
┌─────────────────┐     ┌─────────────────┐
│   Local App     │────▶│   Cloud Storage │
│                 │     │   (S3/R2)       │
│  Passphrase     │     │                 │
│  unlocks +      │◀────│   Encrypted     │
│  decrypts       │     │   vault blobs   │
└─────────────────┘     └─────────────────┘
```

**How it works:**

1. Passphrase serves as both auth and encryption key
2. User-chosen vault ID (derived from passphrase hash)
3. Cloud stores encrypted blobs addressable by vault ID

**Pros:**

- Simplest architecture
- No account management
- True zero-knowledge

**Cons:**

- Passphrase = single point of failure
- No account recovery possible
- Collision risk on vault IDs

---

## Part 3: Recommended Architecture

### Hybrid Approach: OAuth + Zero-Knowledge Vault

**Why this approach:**

- Separates authentication (who you are) from encryption (what you know)
- Allows account recovery without compromising encryption
- Enables team/family sharing in future
- Industry best practice for secure apps

### Technical Implementation

#### Phase 1: Authentication Layer

**Technology Stack:**

- Supabase Auth (or Firebase Auth, Auth0)
- PostgreSQL for user metadata
- Edge functions for API

**Database Schema:**

```sql
-- Users table (managed by Supabase Auth)
-- Automatically created: id, email, created_at, etc.

-- Vault references (we only store encrypted blobs)
CREATE TABLE vault_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  vault_id TEXT UNIQUE NOT NULL,        -- Hash of user_id + device
  encrypted_vault TEXT NOT NULL,         -- AES-256-GCM encrypted blob
  encrypted_meta TEXT NOT NULL,          -- Salt, iterations (also encrypted)
  last_sync TIMESTAMPTZ DEFAULT now(),
  version INTEGER DEFAULT 1
);

-- File references
CREATE TABLE file_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  file_key TEXT NOT NULL,
  encrypted_blob BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Flow Diagram:**

```
┌────────────────────────────────────────────────────────────────┐
│                        USER FLOW                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. SIGN UP / SIGN IN                                          │
│     └─▶ OAuth (Google/Apple) OR Magic Link                     │
│         └─▶ Returns: JWT token + user_id                       │
│                                                                │
│  2. VAULT SETUP (first time)                                   │
│     └─▶ User enters passphrase                                 │
│         └─▶ Derive encryption key (PBKDF2)                     │
│             └─▶ Create encrypted vault locally                 │
│                 └─▶ Upload encrypted blob to cloud             │
│                                                                │
│  3. VAULT UNLOCK (returning user)                              │
│     └─▶ Authenticate with OAuth/Magic Link                     │
│         └─▶ Download encrypted vault from cloud                │
│             └─▶ User enters passphrase                         │
│                 └─▶ Decrypt locally                            │
│                                                                │
│  4. SYNC (on changes)                                          │
│     └─▶ Re-encrypt vault with same key                         │
│         └─▶ Upload encrypted blob with version                 │
│             └─▶ Conflict resolution: highest version wins      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### Phase 2: Encrypt File Store

**New `data/encryptedFileStore.ts`:**

```typescript
// Encrypt files before storing in IndexedDB/cloud
const encryptFile = async (key: CryptoKey, file: Blob): Promise<Blob> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await file.arrayBuffer();
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  // Prepend IV to encrypted data
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), 12);
  return new Blob([combined]);
};

const decryptFile = async (key: CryptoKey, blob: Blob): Promise<Blob> => {
  const data = await blob.arrayBuffer();
  const iv = new Uint8Array(data.slice(0, 12));
  const encrypted = data.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new Blob([decrypted]);
};
```

#### Phase 3: Security Hardening

**1. Rate Limiting on Unlock:**

```typescript
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

let failedAttempts = 0;
let lockoutUntil = 0;

const attemptUnlock = async (passphrase: string) => {
  if (Date.now() < lockoutUntil) {
    throw new Error(
      `Too many attempts. Try again in ${Math.ceil((lockoutUntil - Date.now()) / 1000)}s`
    );
  }

  try {
    const result = await unlockVault(passphrase);
    failedAttempts = 0;
    return result;
  } catch {
    failedAttempts++;
    if (failedAttempts >= LOCKOUT_THRESHOLD) {
      lockoutUntil = Date.now() + LOCKOUT_DURATION;
    }
    throw new Error('Invalid passphrase');
  }
};
```

**2. Session Timeout:**

```typescript
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let lastActivity = Date.now();

const checkSession = () => {
  if (Date.now() - lastActivity > SESSION_TIMEOUT) {
    lockVault();
    return false;
  }
  return true;
};

// Call on every user interaction
const updateActivity = () => {
  lastActivity = Date.now();
};
```

**3. Secure Key Storage:**

```typescript
// Store encryption key in SessionStorage (cleared on tab close)
// Never persist CryptoKey to localStorage
const storeSessionKey = (key: CryptoKey) => {
  // Key exists only in memory - reference stored
  sessionVaultKey = key;
};
```

---

## Part 4: Multi-User Security Best Practices

### For Public Deployment

| Category           | Requirement                  | Implementation                    |
| ------------------ | ---------------------------- | --------------------------------- |
| **Authentication** | Strong identity verification | OAuth 2.0 + PKCE flow             |
| **Authorization**  | Row-level security           | Supabase RLS policies             |
| **Encryption**     | Zero-knowledge encryption    | Client-side AES-256-GCM           |
| **Transport**      | Encrypted in transit         | HTTPS + TLS 1.3                   |
| **Key Management** | User-controlled keys         | PBKDF2 derivation from passphrase |
| **Data Isolation** | User data never mixes        | user_id foreign keys + RLS        |
| **Audit Trail**    | Track access and changes     | Supabase audit logs               |
| **Compliance**     | GDPR/CCPA ready              | Data export, deletion APIs        |

### Row-Level Security (Supabase)

```sql
-- Only allow users to access their own vault
ALTER TABLE vault_refs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own vault"
  ON vault_refs
  FOR ALL
  USING (auth.uid() = user_id);

-- Same for files
ALTER TABLE file_refs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own files"
  ON file_refs
  FOR ALL
  USING (auth.uid() = user_id);
```

### Key Security Principles

1. **Never store passphrase** - Only derived key in session memory
2. **Never log decrypted data** - All logging uses encrypted/hashed values
3. **Fail secure** - On error, lock vault immediately
4. **Minimal trust** - Server stores only encrypted blobs
5. **Defense in depth** - Auth + encryption + RLS layers

---

## Part 5: Implementation Roadmap

### Phase 1: Security Hardening (No Backend) - 1-2 weeks

```
[ ] Encrypt IndexedDB files before storage
[ ] Add rate limiting to unlock attempts
[ ] Add session timeout with auto-lock
[ ] Add unlock attempt logging
[ ] Update VaultLockView with lockout UI
```

### Phase 2: Authentication Setup - 2-3 weeks

```
[ ] Set up Supabase project
[ ] Configure OAuth providers (Google, Apple)
[ ] Create database schema with RLS
[ ] Build auth UI (sign in, sign up, magic link)
[ ] Implement JWT token handling
```

### Phase 3: Cloud Sync - 2-3 weeks

```
[ ] Create sync service for vault upload/download
[ ] Implement conflict resolution (version-based)
[ ] Add offline support with sync queue
[ ] Build sync status UI indicator
[ ] Test cross-device sync scenarios
```

### Phase 4: Polish & Compliance - 1-2 weeks

```
[ ] Add data export feature (GDPR)
[ ] Add account deletion feature
[ ] Security audit and penetration testing
[ ] Documentation for users
[ ] Privacy policy update
```

---

## Part 6: Quick Wins (Immediate Implementation)

These can be implemented now without backend changes:

### 1. Encrypt File Store

**Modify `data/fileStore.ts`:**

- Accept encryption key parameter
- Encrypt blobs before IndexedDB write
- Decrypt on read

### 2. Rate Limiting

**Add to `vault/VaultLockView.tsx`:**

- Track failed attempts in sessionStorage
- Show lockout timer after 5 failures
- Exponential backoff

### 3. Auto-Lock

**Add to `core/useAura.ts`:**

- Track last activity timestamp
- Check timeout on each interaction
- Lock vault after 30 min inactivity

### 4. Vault Export Enhancement

**Modify export to include:**

- Encrypted vault blob
- Encrypted files from IndexedDB
- Import validates and decrypts all

---

## Conclusion

The current encryption foundation is solid. The main gaps are:

1. **Unencrypted file storage** - Fix immediately
2. **No authentication layer** - Add OAuth for cross-device access
3. **No rate limiting** - Add to prevent brute force

**Recommended approach:** Start with Phase 1 security hardening (no backend required), then evaluate Supabase for authentication + sync in Phase 2.

**Cost estimate for Supabase:**

- Free tier: 500MB storage, 50K monthly users
- Pro tier: $25/month for production features

---

## Files to Modify

| File                      | Changes                                   |
| ------------------------- | ----------------------------------------- |
| `data/cryptoVault.ts`     | Add rate limiting, export encryption keys |
| `data/fileStore.ts`       | Encrypt blobs before storage              |
| `vault/VaultLockView.tsx` | Lockout UI, attempt counter               |
| `core/useAura.ts`         | Session timeout, auto-lock                |
| **New** `auth/`           | Auth service, OAuth flow, sync service    |
| **New** `api/sync.ts`     | Cloud sync endpoints                      |
