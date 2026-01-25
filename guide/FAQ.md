# Frequently Asked Questions

---

## Getting Started

### What is Areté Life OS?

Areté Life OS is a personal life management app that combines:

- **Encrypted Vault**: Secure storage for personal data
- **AI Mentor**: Personalized guidance powered by Google Gemini
- **Life Dashboard**: Track goals, memories, and insights

The name "Areté" comes from the Greek concept of excellence and reaching your highest potential.

### Is my data stored in the cloud?

No. All data is stored locally in your browser's localStorage, encrypted with your passphrase. The only cloud interaction is with Google's Gemini API for AI features.

### Can I use this on multiple devices?

Not automatically. Your data lives in one browser. To use on another device:

1. Export your vault (Settings → Export)
2. Transfer the file to the new device
3. Import on the new device
4. Unlock with your passphrase

### What browsers are supported?

Modern browsers with Web Crypto API support:

- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 12+

---

## Account & Security

### I forgot my passphrase. Can you reset it?

**No.** We don't store your passphrase anywhere. If you forget it, your data cannot be recovered. This is a fundamental security feature - it means no one (including us) can access your data.

### How secure is the encryption?

Very secure. We use:

- **AES-256-GCM**: Same encryption standard used by governments
- **PBKDF2**: 100,000 iterations for key derivation
- **Random salt/IV**: Unique for each vault/save operation

### Can I change my passphrase?

Currently, there's no built-in passphrase change. To change it:

1. Export your vault
2. Clear the vault (Settings → Clear Vault)
3. Create a new vault with new passphrase
4. Import your backup

### Why does the app lock after 15 minutes?

Security. When locked, your encryption key is wiped from memory, protecting your data if you step away from your device.

---

## Features

### What is the "Rule of Life"?

A personal operating system that helps the AI understand your:

- Current life season and intensity
- Core values and roles
- Weekly rhythm and schedule
- Non-negotiables (sleep, rest, etc.)
- Task preferences and capacity

### What are "Claims"?

When you log memories, the AI extracts facts called "claims." These are proposed updates to your profile that you can:

- **Approve**: Add to your profile
- **Reject**: Discard the suggestion
- **Edit**: Modify before approving

### How does "Plan My Day" work?

The AI analyzes:

- Your Rule of Life settings
- Current goals and deadlines
- Recent memories and context
- Timeline events

...and generates a prioritized task list optimized for your capacity and values.

### What are "Blind Spots"?

Areas the AI detects you might be neglecting, based on:

- Imbalanced attention across life domains
- Unaddressed goals or concerns
- Patterns in your memories

---

## Data & Privacy

### What data is sent to Google Gemini?

When you use AI features:

- Your profile data
- Recent memory items
- Goals and timeline context

This is necessary for personalized AI responses.

### Can I use the app without AI features?

Yes. The core vault functionality works without AI. You just won't get:

- Automatic fact extraction
- Personalized recommendations
- Plan My Day feature
- Insights and blind spots

### How do I delete all my data?

Settings → Clear Vault

**Warning**: This permanently deletes all data. Export a backup first if you want to preserve it.

### Is my data backed up automatically?

No. You must manually export backups. We recommend weekly exports.

---

## Troubleshooting

### The app looks unstyled / broken

This usually means CSS failed to load. Try:

1. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear browser cache
3. Check internet connection (CSS loads from CDN)

### AI features aren't working

Possible causes:

- No internet connection
- Gemini API temporarily unavailable
- Rate limit exceeded (30 requests/minute)

Try again in a few minutes.

### My vault won't unlock

- Check passphrase carefully (case-sensitive)
- Ensure Caps Lock is off
- Try typing slowly

If you've truly forgotten your passphrase, data cannot be recovered.

### Data seems to have disappeared

Possible causes:

1. **Vault locked**: Just unlock with your passphrase
2. **Different browser**: Data is browser-specific
3. **Browser data cleared**: Data is lost without backup
4. **Incognito/Private mode**: Data doesn't persist

### Export/Import isn't working

- Ensure the file is a valid `.json` vault export
- Check that you're using the correct passphrase
- Try a different browser if issues persist

---

## Mobile & Cross-Platform

### Is there a mobile app?

Not currently. Areté Life OS is a web app that works in mobile browsers. Save it to your home screen for app-like access:

**iOS Safari:**

1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"

**Android Chrome:**

1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen"

### Does data sync across devices?

No automatic sync. To transfer data:

1. Export vault on source device
2. Transfer file (email, cloud storage, etc.)
3. Import on destination device

---

## Future & Updates

### Is there a roadmap?

Current priorities:

- Stability and reliability
- Security hardening
- User experience improvements

Potential future features:

- Cross-device sync (encrypted)
- Biometric unlock
- Voice input
- Calendar integration

### How do I report bugs or request features?

Open an issue on GitHub or reach out through the project's communication channels.

### Will my data work with future updates?

Yes. Data migrations are handled automatically. Your encrypted vault format is versioned for compatibility.

---

## Philosophy

### Why "Areté"?

Areté (ἀρετή) is an ancient Greek concept meaning:

- Excellence
- Virtue
- Reaching your highest potential

The app is designed to help you achieve your personal areté through intentional reflection and AI-assisted guidance.

### Why local-first encryption?

We believe:

- Your personal data belongs to you
- Privacy should be the default
- You shouldn't have to trust us with your secrets

Local encryption means even we can't access your data.
