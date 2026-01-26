# Troubleshooting Guide

Common issues and solutions discovered during development. Reference this before debugging to avoid repeating past mistakes.

---

## Vercel Deployment Issues

### Issue: UI Broken / CSS Not Loading on Vercel

**Symptoms:**

- App renders but looks completely unstyled
- Dark background might show, but no Tailwind classes applied
- Forms and text visible but no styling

**Root Cause:**
Content Security Policy (CSP) in `vercel.json` blocking external resources.

**Solution:**
Ensure `connect-src` in CSP includes all required external services:

```
connect-src 'self' https://cdn.tailwindcss.com https://esm.sh https://generativelanguage.googleapis.com;
```

**Why:** The Tailwind Play CDN needs to make network requests for runtime CSS compilation. A restrictive `connect-src 'self'` blocks these requests silently.

---

### Issue: Vercel Not Auto-Deploying After Push

**Symptoms:**

- Push succeeds to GitHub
- GitHub Actions CI passes
- No new deployment appears in Vercel dashboard

**Possible Causes:**

1. **"Require Verified Commits" enabled in Vercel**
   - Location: Vercel → Settings → Git
   - Fix: Disable this toggle unless you use GPG-signed commits

2. **Git author email not linked to GitHub account**
   - Error: "No GitHub account was found matching the commit author email"
   - Fix: Use GitHub's noreply email format:
     ```bash
     git config user.email "YOUR_ID+USERNAME@users.noreply.github.com"
     ```
   - Find your ID: `gh api user --jq '.id, .login'`

3. **GitHub-Vercel webhook not connected**
   - Check: GitHub repo → Settings → Webhooks (should have Vercel webhook)
   - Fix: Reconnect repo in Vercel → Settings → Git → Disconnect then reconnect

**Quick Recovery:**
If auto-deploy is broken, manually redeploy from Vercel dashboard while fixing the root cause.

---

### Issue: Vercel Check Failing on GitHub

**Symptoms:**

- GitHub shows red X next to commit
- Message: "No GitHub account was found matching the commit author email"

**Solution:**
Configure git to use your GitHub noreply email:

```bash
# Get your GitHub user ID
gh api user --jq '.id, .login'

# Set your email (replace with your values)
git config user.email "ID+USERNAME@users.noreply.github.com"

# Verify
git config user.email
```

---

### Issue: Gemini Model Not Found (404)

**Symptoms:**

- `/api/gemini` returns 500
- Vercel logs show `models/... is not found for API version v1beta`

**Root Cause:**
Model ID configured in prod is unavailable for the project or API version.

**Solution:**
Set these env vars in Vercel (Production + Preview if needed):

```
GEMINI_MODEL_PRO=gemini-3-pro-preview
GEMINI_MODEL_FLASH=gemini-3-flash-preview
```

If you override defaults, ensure the model exists in the Gemini API list for your project.

---

### Issue: Gemini JSON Shape Mismatch

**Symptoms:**

- Vercel logs show `plan.map is not a function`

**Root Cause:**
Model returned non-array JSON for the daily plan.

**Solution:**
Server now accepts `[]` or `{ tasks: [...] }`. If it recurs, check prompt for strict array requirement.

## CSP (Content Security Policy) Reference

This project uses external CDNs. The CSP must allow:

| Resource         | CSP Directive               | Domain                                                      |
| ---------------- | --------------------------- | ----------------------------------------------------------- |
| Tailwind CSS     | `script-src`, `connect-src` | `https://cdn.tailwindcss.com`                               |
| React/ES Modules | `script-src`, `connect-src` | `https://esm.sh`                                            |
| Google Fonts     | `style-src`, `font-src`     | `https://fonts.googleapis.com`, `https://fonts.gstatic.com` |
| Gemini AI API    | `connect-src`               | `https://generativelanguage.googleapis.com`                 |

**Current working CSP in `vercel.json`:**

```
default-src 'self';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
img-src 'self' data: blob: https:;
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.tailwindcss.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
connect-src 'self' https://cdn.tailwindcss.com https://esm.sh https://generativelanguage.googleapis.com;
media-src 'self' blob:;
object-src 'none';
```

---

## Git Configuration

### Recommended Setup for This Project

```bash
# Use GitHub noreply email (prevents Vercel author verification issues)
git config user.email "YOUR_ID+USERNAME@users.noreply.github.com"

# Verify configuration
git config user.email
git config user.name
```

---

## Git Commit Fails with `index.lock` Permission Error

**Symptoms:**

- `git commit` fails with: `Unable to create '.git/index.lock': Operation not permitted`

**Possible Causes:**

- Another git process is running and holding the lock
- Filesystem permissions or sandbox restrictions on `.git/`

**Fix:**

1. Check for a stale lock:
   ```bash
   ls -la .git/index.lock
   ```
2. If it exists and no other git process is running, remove it:
   ```bash
   rm .git/index.lock
   ```
3. Re-run the commit from your terminal (outside any restricted sandbox).

---

## Debugging Checklist

When something breaks on Vercel:

1. **Check browser DevTools Console** for CSP errors or blocked requests
2. **Check Vercel deployment logs** for build errors
3. **Check GitHub Actions** for CI failures
4. **Verify CSP allows** all external resources the app needs
5. **Check git author email** matches a GitHub account
6. **Try hard refresh** (Cmd+Shift+R) to clear cached assets

---

## Architecture Notes

This project uses a CDN-based architecture:

- **Tailwind CSS**: Loaded from CDN, compiled at runtime (not bundled)
- **React**: Loaded from esm.sh via import maps (not bundled)
- **Implications**: Requires proper CSP configuration; relies on external service availability

Consider migrating to bundled Tailwind/React for better production reliability (optional future improvement).

---

## Security Architecture

### Encryption Overview

Your data is protected with industry-standard encryption:

| Component          | Implementation                                         |
| ------------------ | ------------------------------------------------------ |
| Algorithm          | AES-256-GCM (authenticated encryption)                 |
| Key Derivation     | PBKDF2 with SHA-256, 100,000 iterations                |
| Salt               | 16 random bytes (unique per vault)                     |
| Initialization Vec | 12 random bytes (unique per save)                      |
| Storage            | Browser localStorage (encrypted)                       |
| Key Storage        | Memory only (never persisted, cleared on lock/refresh) |

**What this means:**

- Your passphrase is never stored anywhere
- The encryption key exists only while the vault is unlocked
- Each save operation uses a fresh random IV
- Data cannot be decrypted without your passphrase

### Data Persistence

| Scenario                | Data Status                       |
| ----------------------- | --------------------------------- |
| Browser refresh         | Data persists, vault locks        |
| Close tab/browser       | Data persists, vault locks        |
| Clear browser data      | **DATA LOST** - export backup!    |
| Switch browsers/devices | Data does NOT sync                |
| Forget passphrase       | **DATA UNRECOVERABLE**            |
| Use export backup       | Can restore on any browser/device |

### Session Security

- **Auto-lock**: Vault locks after 15 minutes of inactivity
- **Activity detection**: Mouse, keyboard, touch, scroll
- **No "remember me"**: Passphrase required each session
- **Key cleared**: Encryption key wiped on lock

### Passphrase Requirements (New Vaults)

- Minimum 8 characters
- Strength meter requires "Fair" or better
- Recommendations:
  - Mix uppercase + lowercase
  - Include numbers
  - Include symbols (!@#$%^&\*)
  - Use a passphrase (multiple words)

### Data Backup Best Practices

1. **Export regularly**: Settings → Export Vault
2. **Store backup securely**: Encrypted cloud storage or password manager
3. **Test restore**: Try importing on another browser
4. **After major updates**: Always export after adding significant data

### API Security (Gemini AI)

- API key stored in environment variables (server-side only)
- Never exposed to browser/frontend code
- All AI requests routed through `/api/gemini` endpoint
- Rate limited (30 requests/minute per IP)

**Privacy note**: Data sent to Gemini AI for processing includes your profile and memory items. This is transmitted securely via HTTPS to Google's servers.

---

## Data Loss Prevention

### Backup Export

```
Settings → Export Vault → Download JSON file
```

This creates an **encrypted** backup containing:

- All profile data
- Memories and claims
- Goals and tasks
- Settings and layouts

**Note:** The exported file is encrypted with your vault passphrase. You'll need the same passphrase to import it.

### Recovery After Accidental Clear

If you cleared browser data:

1. Check if you have an exported backup file
2. Go to the lock screen
3. Use Import function
4. Enter your original passphrase

If no backup exists: **Data cannot be recovered**

---

## Security FAQ

**Q: Is my passphrase sent anywhere?**
A: No. It's used locally to derive the encryption key, then discarded.

**Q: Can Anthropic/developers see my data?**
A: No. All encryption happens in your browser. We never have access to your passphrase or data.

**Q: What if I forget my passphrase?**
A: Data cannot be recovered. There's no "forgot password" because we don't store your passphrase.

**Q: Is the Gemini API secure?**
A: The API key is server-side only. Your data is sent to Google over HTTPS for AI processing.

**Q: Should I use the same passphrase as my other accounts?**
A: No. Use a unique passphrase. Consider a passphrase like "correct-horse-battery-staple".
