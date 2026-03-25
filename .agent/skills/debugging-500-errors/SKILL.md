---
name: debugging-500-errors
description: Specialized skill for debugging server-side 500 errors, stack traces, and API failures. Use when troubleshooting backend crashes or silent failures.
---

# Debugging 500 Errors in Vite Dev Server

This skill provides a systematic approach to debugging 500 Internal Server Errors in the Vite development environment.

## Problem Pattern

User reports:

- 500 errors in browser console
- Features not working (e.g., events not appearing)
- Generic error messages with no details
- Intermittent failures

## Root Cause Categories

1. **Hidden server errors** — Dev proxy catches but doesn't log errors
2. **Stale server session** — Changes not picked up without restart
3. **Corrupted vault state** — Browser localStorage issues
4. **Large monolithic functions** — Hard to isolate failure points
5. **Missing error boundaries** — Single failure kills entire request

## Debugging Protocol

### Step 1: Check Server Logs FIRST

**Before touching any code**, check the terminal where `npm run dev` is running:

```bash
# Look for these patterns:
[DEV PROXY ERROR] ...
[processInput] Gemini failed: ...
[moduleName] ...
```

**If logs are empty or generic:**

- The dev proxy is swallowing errors
- Proceed to Step 2

### Step 2: Enhance Dev Proxy Logging

Edit `vite.config.ts` to add detailed error logging:

```typescript
// In the dev proxy middleware
catch (err: any) {
  console.error('[DEV PROXY ERROR]', err?.message || err);
  console.error('[DEV PROXY STACK]', err?.stack);
  res.statusCode = 500;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    error: 'Request failed',
    details: err?.message,
    action: parsed.action  // Include action for context
  }));
}
```

**Critical:** Restart dev server after this change:

```bash
pkill -f "vite" && npm run dev
```

### Step 3: Reproduce and Read Logs

1. **Reproduce the error** in the browser
2. **Immediately check terminal** for new logs
3. **Read the stack trace** to identify the failing module/line

Example good log output:

```
[DEV PROXY] Action: processInput
[processInput] Calling Gemini with model: gemini-3-pro-preview
[DEV PROXY ERROR] Cannot read property 'map' of undefined
[DEV PROXY STACK] at processInput (api/aiActions/processInput.ts:120:15)
```

### Step 4: Isolate the Failure

Based on the stack trace, identify which module is failing:

**If error is in a large file (>500 lines):**

- Extract the failing function into a separate module
- Add granular logging at each step
- Use separate try/catch blocks for different operations

**Example refactoring:**

```typescript
// Before: 80-line inline function
const processInput = async (...) => {
  try {
    // 80 lines of mixed logic
  } catch (err) {
    throw err;
  }
};

// After: Extracted module with logging
export async function processInput(params: ProcessInputParams) {
  console.log('[processInput] Starting with input:', params.input);

  try {
    const prompt = buildPrompt(params);
    console.log('[processInput] Prompt built');

    const result = await callGemini(prompt);
    console.log('[processInput] Success, items:', result.items?.length);
    return result;
  } catch (geminiError) {
    console.error('[processInput] Gemini failed:', geminiError);

    try {
      console.log('[processInput] Falling back to OpenAI');
      return await callOpenAI(prompt);
    } catch (openAIError) {
      console.error('[processInput] OpenAI fallback failed:', openAIError);
      throw openAIError;
    }
  }
}
```

### Step 5: Test with Fresh State

**Browser state can be corrupted.** Test with a clean slate:

1. **Open DevTools** → Application → Local Storage
2. **Clear all** localStorage entries
3. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
4. **Create new vault** and test again

**If it works with fresh vault:**

- Issue is session-specific
- User's vault may have corrupted data
- Add validation/migration logic

**If it still fails:**

- Issue is in the code
- Proceed to Step 6

### Step 6: Use Browser Automation for Reproducibility

Manual testing can be unreliable. Use the browser subagent:

```typescript
browser_subagent({
  task: `
    1. Navigate to http://localhost:3000
    2. Create vault with passphrase "test123"
    3. Skip all onboarding
    4. Type in log bar: "tennis tomorrow at 10 PM"
    5. Press Enter
    6. Wait 5 seconds
    7. Check if event appears in Upcoming Events
    8. Capture console logs
  `,
});
```

This provides:

- Fresh vault every time
- Reproducible test case
- Console logs captured
- Screenshots of failure state

## Prevention Checklist

After fixing the issue, ensure these are in place:

### Dev Environment

- [ ] All API proxies log errors with stack traces
- [ ] Error responses include `details` field
- [ ] Action name logged for each request
- [ ] Success cases logged too (not just failures)

### Code Organization

- [ ] No single file exceeds 500 lines
- [ ] AI actions in separate modules (`api/aiActions/`)
- [ ] Each module has `[moduleName]` prefixed logs
- [ ] Type-safe interfaces exported

### Error Handling

- [ ] Granular try/catch blocks (not one giant try/catch)
- [ ] Separate error boundaries for primary/fallback services
- [ ] Validation at function entry points
- [ ] Meaningful error messages (not just "failed")

### Testing

- [ ] Test with fresh vault after major changes
- [ ] Browser automation for critical flows
- [ ] Check server logs, not just browser console
- [ ] Document the fix in `.agent/LEARNINGS.md`

## Common Pitfalls

### ❌ Don't Do This

```typescript
// Silent error swallowing
catch (err) {
  res.end(JSON.stringify({ error: 'Failed' }));
}

// Giant monolithic function
const processInput = async (...) => {
  // 200 lines of mixed logic
  // No logging
  // One try/catch for everything
};

// Testing against stale server
// (making changes but not restarting)
```

### ✅ Do This Instead

```typescript
// Detailed error logging
catch (err: any) {
  console.error('[DEV PROXY ERROR]', err?.message);
  console.error('[DEV PROXY STACK]', err?.stack);
  res.end(JSON.stringify({
    error: 'Failed',
    details: err?.message
  }));
}

// Modular function with logging
export async function processInput(params: ProcessInputParams) {
  console.log('[processInput] Starting');
  try {
    // Clear, focused logic
    console.log('[processInput] Success');
  } catch (err) {
    console.error('[processInput] Failed:', err);
    throw err;
  }
}

// Always restart after config changes
pkill -f "vite" && npm run dev
```

## Quick Reference

| Symptom               | Likely Cause                | Fix                                   |
| --------------------- | --------------------------- | ------------------------------------- |
| Generic 500, no logs  | Dev proxy swallowing errors | Add error logging to `vite.config.ts` |
| Works in fresh vault  | Corrupted session state     | Clear localStorage, test again        |
| Intermittent failures | Stale server session        | Restart dev server                    |
| Can't isolate failure | Monolithic function         | Extract to module with logging        |
| No stack trace        | Missing error logging       | Add `console.error` with stack        |

## Success Criteria

You've successfully debugged when:

1. ✅ Server logs show the exact error message and stack trace
2. ✅ You can reproduce the error consistently
3. ✅ You've isolated the failing module/function
4. ✅ Browser automation test passes
5. ✅ Fresh vault test passes
6. ✅ Fix documented in `.agent/LEARNINGS.md`
