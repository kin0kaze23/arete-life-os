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

## CSP (Content Security Policy) Reference

This project uses external CDNs. The CSP must allow:

| Resource | CSP Directive | Domain |
|----------|--------------|--------|
| Tailwind CSS | `script-src`, `connect-src` | `https://cdn.tailwindcss.com` |
| React/ES Modules | `script-src`, `connect-src` | `https://esm.sh` |
| Google Fonts | `style-src`, `font-src` | `https://fonts.googleapis.com`, `https://fonts.gstatic.com` |
| Gemini AI API | `connect-src` | `https://generativelanguage.googleapis.com` |

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
