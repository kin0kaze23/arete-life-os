# Security Guide

Your data privacy and security are paramount. This guide explains how Areté Life OS protects your information.

---

## How Your Data is Protected

### Encryption at Rest

All your data is encrypted using:

| Component          | Standard                               |
| ------------------ | -------------------------------------- |
| **Algorithm**      | AES-256-GCM (military-grade)           |
| **Key Derivation** | PBKDF2 with 100,000 iterations         |
| **Salt**           | 16 random bytes (unique to your vault) |

**What this means:**

- Your data is scrambled into unreadable ciphertext
- Only your passphrase can decrypt it
- Even if someone copies your browser storage, they can't read it

### Zero-Knowledge Architecture

We never have access to:

- Your passphrase (never transmitted)
- Your encryption key (derived locally)
- Your decrypted data (processed in your browser)

**The only data that leaves your browser:**

- Encrypted exports (still requires your passphrase)
- AI requests to Google Gemini (for mentor features)

---

## Session Security

### Auto-Lock

Your vault automatically locks after **15 minutes of inactivity**.

**Activity is detected via:**

- Mouse movement
- Keyboard input
- Touch events
- Scrolling

### Key Management

| Event              | What Happens                                    |
| ------------------ | ----------------------------------------------- |
| Vault unlock       | Key derived from passphrase, held in memory     |
| Normal use         | Key remains in memory for encryption/decryption |
| Inactivity timeout | Key wiped from memory, vault locks              |
| Page refresh       | Key lost, must re-unlock                        |
| Browser close      | Key lost, must re-unlock                        |

**Your encryption key is never:**

- Written to disk
- Sent over network
- Stored in localStorage

---

## Passphrase Best Practices

### Choosing a Strong Passphrase

**Requirements:**

- Minimum 8 characters
- Mix of character types (the app shows strength meter)

**Recommendations:**

```
Good:     MySecure2026!Life
Better:   correct-horse-battery-staple
Best:     Three-Random-Words-Plus-Number-42!
```

**Avoid:**

- Dictionary words alone
- Personal info (birthday, name)
- Common patterns (123456, password)
- Reusing passwords from other sites

### Storing Your Passphrase

**Options (pick one):**

1. **Password Manager** (recommended)
   - 1Password, Bitwarden, etc.
   - Store as a secure note

2. **Physical Backup**
   - Write on paper
   - Store in safe/lockbox
   - Keep separate from device

3. **Memory Only** (risky)
   - Only if you're confident you won't forget
   - Remember: no recovery option exists

---

## Data Persistence

### Where Your Data Lives

| Location                | Encrypted? | Persistence                |
| ----------------------- | ---------- | -------------------------- |
| Browser localStorage    | Yes        | Until browser data cleared |
| Exported backup file    | Yes        | Until you delete the file  |
| Memory (while unlocked) | No         | Until vault locks          |

### Data Loss Scenarios

| Scenario           | Outcome                | Prevention                  |
| ------------------ | ---------------------- | --------------------------- |
| Clear browser data | **DATA LOST**          | Export backups regularly    |
| Forget passphrase  | **DATA UNRECOVERABLE** | Store passphrase securely   |
| Browser crash      | Data safe              | Vault just locks            |
| Computer theft     | Data safe (encrypted)  | Thief can't decrypt         |
| Switch devices     | Data not synced        | Import backup on new device |

---

## Backup Strategy

### Why Backups Matter

Your data exists only in your browser. If you:

- Clear browser data
- Switch browsers/computers
- Reinstall your OS

...you'll lose everything without a backup.

### How to Backup

1. Open **Settings**
2. Click **Export Vault**
3. Save the `.json` file

### Backup Schedule

| Frequency                | When                                    |
| ------------------------ | --------------------------------------- |
| **Weekly**               | Sunday evening, part of weekly review   |
| **After major updates**  | New goals, life events, profile changes |
| **Before risky actions** | Browser cleanup, OS updates             |

### Storing Backups

**Recommended:**

- Encrypted cloud storage (iCloud, Google Drive with encryption)
- Password manager's secure notes
- Encrypted USB drive

**The backup file is encrypted** with your vault passphrase, so it's safe to store in cloud storage.

---

## AI & Privacy

### What Data Goes to Gemini

When you use AI features, the following is sent to Google's Gemini API:

- Your profile data
- Recent memory items
- Goals and timeline events

### Security Measures

- **HTTPS**: All transmissions encrypted in transit
- **API Key**: Server-side only, never exposed to browser
- **Rate Limiting**: 30 requests/minute to prevent abuse

### Privacy Considerations

Google's Gemini processes your data according to their privacy policy. If you're concerned:

- Use the app without AI features (still works as encrypted vault)
- Be mindful of what you log (omit ultra-sensitive info)
- Review Google's AI privacy policies

---

## Security FAQ

**Q: Can developers see my data?**

No. All encryption happens in your browser. We never receive your passphrase or decrypted data.

**Q: What if I forget my passphrase?**

Your data cannot be recovered. There's no "forgot password" because we don't store your passphrase. This is a security feature, not a bug.

**Q: Is my backup file safe to store in cloud storage?**

Yes. The backup is encrypted with your passphrase. Without the passphrase, it's unreadable.

**Q: Can someone with my backup file and passphrase access my data?**

Yes. Treat your backup file + passphrase like a bank vault key. Don't share either.

**Q: What happens if the Areté website goes offline?**

Your encrypted data remains in your browser. You can still access it locally. Export a backup to ensure long-term access.

**Q: Is the encryption really secure?**

AES-256-GCM is used by governments and banks worldwide. With a strong passphrase, your data is effectively unbreakable with current technology.

---

## Security Checklist

### Initial Setup

- [ ] Chose a strong, unique passphrase
- [ ] Stored passphrase in password manager or secure location
- [ ] Completed initial backup export

### Ongoing

- [ ] Export backup weekly
- [ ] Store backups in multiple locations
- [ ] Never share passphrase
- [ ] Log out (lock vault) when done

### Red Flags

If you notice any of these, investigate immediately:

- [ ] Vault unlocks without entering passphrase
- [ ] Data appears that you didn't enter
- [ ] Settings changed without your action

---

## Incident Response

### If Your Device is Stolen

1. Your data is encrypted, thief can't access it
2. Change passwords on any synced accounts
3. Restore from backup on new device

### If You Suspect a Breach

1. Export your data immediately
2. Create a new vault with a new passphrase
3. Import your data into the new vault
4. Clear the old vault

### If You Accidentally Shared Your Passphrase

1. Export your data
2. Clear the current vault
3. Create new vault with new passphrase
4. Import your data
