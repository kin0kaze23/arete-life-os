---
name: security-intelligence
description: Evaluates application security based on OWASP Top 10 and project-specific security standards. Use when reviewing code for vulnerabilities or sensitive data handling.
---

# Security Evaluation Skill (OWASP)

> **Standards**: OWASP Top 10 2021, OWASP ASVS Level 2

---

## OWASP Top 10 2021 Checklist

### A01: Broken Access Control

**Risk**: Users can access data/functions they shouldn't

**Checks**:

- [ ] Principle of least privilege enforced
- [ ] No client-side access control only
- [ ] CORS configuration secure
- [ ] No directory listing enabled
- [ ] Rate limiting on sensitive endpoints

**How to Test**:

```bash
# Check for exposed endpoints
curl -X GET http://localhost:5173/api/admin
# Should return 403 if not admin

# Test CORS
curl -H "Origin: http://evil.com" http://localhost:5173/api/data
# Should reject unknown origins
```

---

### A02: Cryptographic Failures

**Risk**: Sensitive data exposed due to weak encryption

**Checks**:

- [ ] AES-256-GCM for data at rest
- [ ] TLS 1.2+ for data in transit
- [ ] No weak algorithms (MD5, SHA1)
- [ ] Key derivation with PBKDF2 (100K+ iterations)
- [ ] No API keys in client code

**How to Test**:

```javascript
// Verify encryption algorithm
const algorithm = vault.encryptionAlgorithm;
console.assert(algorithm === 'AES-256-GCM');

// Check key derivation
const iterations = vault.pbkdf2Iterations;
console.assert(iterations >= 100000);
```

---

### A03: Injection

**Risk**: Malicious code execution via untrusted input

**Checks**:

- [ ] Input validation on all user input
- [ ] XSS prevention (sanitize HTML)
- [ ] No eval() or Function() with user input
- [ ] Parameterized queries (if using SQL)
- [ ] Content Security Policy (CSP) headers

**How to Test**:

```javascript
// Test XSS prevention
const userInput = '<script>alert("XSS")</script>';
const sanitized = sanitizeInput(userInput);
console.assert(!sanitized.includes('<script>'));

// Verify CSP header
curl -I https://your-app.com | grep Content-Security-Policy
```

---

### A04: Insecure Design

**Risk**: Missing or ineffective security controls

**Checks**:

- [ ] Threat model documented
- [ ] Secure design patterns used
- [ ] Defense in depth implemented
- [ ] Secure defaults (deny by default)
- [ ] Business logic flaws prevented

---

### A05: Security Misconfiguration

**Risk**: Unnecessary features enabled, default credentials

**Checks**:

- [ ] No default credentials
- [ ] Error messages don't expose stack traces
- [ ] Unnecessary features disabled
- [ ] Security headers configured
- [ ] Dependencies up to date

**Security Headers**:

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
```

---

### A06: Vulnerable and Outdated Components

**Risk**: Using components with known vulnerabilities

**Checks**:

- [ ] npm audit shows no high/critical issues
- [ ] Dependencies up to date
- [ ] No abandoned packages
- [ ] CVE database checked

**How to Test**:

```bash
npm audit
npm outdated
```

---

### A07: Identification and Authentication Failures

**Risk**: Weak authentication mechanisms

**Checks**:

- [ ] Password requirements enforced (min 8 chars)
- [ ] Account lockout after failed attempts
- [ ] Session timeout configured (15 min inactivity)
- [ ] Secure session management
- [ ] No credential stuffing vulnerabilities

**Glance OS Specific**:

- [ ] Vault auto-locks after 15 min
- [ ] Rate limiting on unlock (5 attempts / 15 min lockout)
- [ ] No session tokens (local-only encryption)

---

### A08: Software and Data Integrity Failures

**Risk**: Insecure CI/CD, supply chain attacks

**Checks**:

- [ ] Code signing for releases
- [ ] Supply chain security (npm)
- [ ] Integrity checks for external resources
- [ ] Subresource Integrity (SRI) for CDN resources

---

### A09: Security Logging and Monitoring Failures

**Risk**: Breaches not detected

**Checks**:

- [ ] Audit log for all mutations
- [ ] No sensitive data in logs
- [ ] Failed login attempts logged
- [ ] Monitoring and alerting configured

**Glance OS Specific**:

```typescript
// Audit log example
interface AuditLog {
  timestamp: number;
  action: ActionType; // CREATE_GOAL, DELETE_EVENT, etc.
  entityType: string;
  entityId: string;
}
```

---

### A10: Server-Side Request Forgery (SSRF)

**Risk**: Server makes requests to internal resources

**Checks**:

- [ ] URL validation and whitelisting
- [ ] Network segmentation
- [ ] No user-controlled URLs in server requests

---

## OWASP ASVS Level 2 (Standard)

### Authentication

- V2.1.1: Password length ≥ 8 characters
- V2.1.4: Account enumeration prevention
- V2.2.1: Anti-automation controls

### Session Management

- V3.2.1: Session tokens ≥ 64 bits entropy
- V3.3.1: Logout invalidates session

### Access Control

- V4.1.1: Principle of least privilege
- V4.2.1: Deny by default

### Cryptography

- V6.2.1: Industry-proven algorithms only
- V6.2.2: No weak algorithms
- V6.2.5: Random number generation secure

---

## Security Audit Workflow

### 1. Automated Scans

```bash
# Dependency vulnerabilities
npm audit

# Find secrets in code
git secrets --scan

# Static analysis
eslint --ext .ts,.tsx .
```

### 2. Manual Review

- Review authentication flows
- Check authorization logic
- Verify encryption implementation
- Test error handling

### 3. Penetration Testing

- XSS attempts
- CSRF attacks
- Injection attacks
- Access control bypasses

### 4. Report Findings

Document all vulnerabilities with:

- Severity (Critical/High/Medium/Low)
- Description
- Steps to reproduce
- Remediation advice

---

## Security Score Calculation

```javascript
function calculateSecurityScore(audit) {
  let score = 100;

  // Deduct for each OWASP Top 10 finding
  audit.owaspTop10.forEach((finding) => {
    if (finding.severity === 'critical') score -= 20;
    if (finding.severity === 'high') score -= 10;
    if (finding.severity === 'medium') score -= 5;
  });

  // Deduct for dependency vulnerabilities
  if (audit.npmAudit.critical > 0) score -= 20;
  if (audit.npmAudit.high > 0) score -= 10;

  // Deduct for missing security headers
  audit.securityHeaders.forEach((header) => {
    if (!header.present) score -= 5;
  });

  return Math.max(0, score);
}
```

**Target**: ≥ 90 for production deployment

---

## Glance OS Specific Checks

### Zero-Knowledge Architecture

- [ ] Server never receives decrypted vault data
- [ ] All encryption happens client-side
- [ ] Non-extractable CryptoKeys
- [ ] No vault data in API requests

### Local-First Security

- [ ] No backend authentication (local only)
- [ ] Encrypted localStorage
- [ ] Encrypted IndexedDB
- [ ] No cloud sync (Phase 2)

### Auto-Lock

- [ ] Vault locks after 15 min inactivity
- [ ] Rate limiting on unlock attempts
- [ ] Failed attempts logged

---

**Keywords**: OWASP, Security Audit, Penetration Testing, Vulnerability Scanning
