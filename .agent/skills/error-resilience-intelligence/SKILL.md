---
name: error-resilience-intelligence
description: Error boundaries, retry logic, and graceful degradation patterns. Use when handling failures or implementing fault tolerance.
---

# Error Resilience Intelligence Skill

Use this skill when implementing error handling, retry logic, or designing fault-tolerant systems.

## 1. Exponential Backoff for Retries

**Pattern**:

```typescript
async function fetchWithRetry(
  fn: () => Promise<Response>,
  maxRetries: number = 3
): Promise<Response> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fn();

      // Only retry on transient errors
      if (response.ok || response.status < 500) {
        return response;
      }
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }

    // Exponential backoff: 500ms, 1s, 2s
    const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
    await new Promise((resolve) => setTimeout(resolve, delay));
    attempt++;
  }

  throw new Error('Max retries exceeded');
}
```

## Retriable vs Non-Retriable Errors

**Retriable** (temporary failures):

- `500` Internal Server Error
- `502` Bad Gateway
- `503` Service Unavailable
- `504` Gateway Timeout
- `429` Too Many Requests (with backoff)
- Network timeouts, connection reset

**Non-Retriable** (permanent failures):

- `400` Bad Request (invalid input)
- `401` Unauthorized (missing auth)
- `403` Forbidden (no permission)
- `404` Not Found (resource doesn't exist)
- `422` Unprocessable Entity (validation error)

**Decision Logic**:

```typescript
function isRetriable(status: number): boolean {
  return status === 429 || status >= 500;
}
```

## 3. React Error Boundaries

**Route-Level Error Boundary** (`app/dashboard/error.tsx`):

```typescript
'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**Global Error Boundary** (`app/global-error.tsx`):

```typescript
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h1>Application Error</h1>
        <p>We're sorry, something went terribly wrong.</p>
        <button onClick={() => window.location.href = '/'}>
          Go Home
        </button>
      </body>
    </html>
  );
}
```

## 4. Fallback Chains

**AI API Fallback**:

```typescript
async function generateWithFallback(prompt: string) {
  // Try primary model
  try {
    return await callGeminiPro(prompt);
  } catch (error) {
    console.warn('Gemini Pro failed, trying Flash');
  }

  // Try faster model
  try {
    return await callGeminiFlash(prompt);
  } catch (error) {
    console.warn('Gemini Flash failed, using cached response');
  }

  // Return cached or default
  return getCachedResponse(prompt) ?? getDefaultResponse();
}
```

## 5. User-Facing Error Messages

**Principles**:

- **Be Specific**: "Failed to save event" > "An error occurred"
- **Be Actionable**: "Check your internet connection and try again"
- **Be Empathetic**: "We're sorry, this feature is temporarily unavailable"

**Examples**:

```typescript
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  RATE_LIMIT: 'You're doing that too quickly. Please wait a moment.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AI_TIMEOUT: 'The AI is taking longer than expected. Try a shorter input.',
  UNKNOWN: 'Something unexpected happened. Please try again.',
};
```

## 6. Silent Failure Detection

**Monitoring Pattern**:

```typescript
export function trackError(context: string, error: Error, metadata?: Record<string, any>) {
  console.error(`[${context}]:`, error, metadata);

  // Send to monitoring service (optional)
  if (process.env.NODE_ENV === 'production') {
    // sendToSentry(error, { context, ...metadata });
  }
}

// Usage
try {
  await processEvent(data);
} catch (error) {
  trackError('EVENT_PROCESSING', error, { eventId: data.id });
  throw error; // Re-throw if user-facing
}
```

## 7. Graceful Degradation

**Feature Flagging**:

```typescript
export async function getAIInsights(log: string) {
  if (!isFeatureEnabled('ai-insights')) {
    return { insights: 'AI insights temporarily unavailable' };
  }

  try {
    return await callGemini(log);
  } catch (error) {
    trackError('AI_INSIGHTS', error);
    // Degrade gracefully
    return { insights: 'Unable to generate insights right now' };
  }
}
```

## 8. Circuit Breaker Pattern

**Concept**: Stop calling a failing service after repeated failures

**Implementation**:

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: number;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    if (this.failureCount >= this.threshold) {
      const now = Date.now();
      if (this.lastFailureTime && now - this.lastFailureTime < this.timeout) {
        return true; // Circuit is open
      }
      // Timeout passed, reset
      this.failureCount = 0;
    }
    return false;
  }

  private onSuccess() {
    this.failureCount = 0;
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }
}

// Usage
const geminiCircuit = new CircuitBreaker();

export async function callGemini(prompt: string) {
  return geminiCircuit.execute(() => fetch('/api/gemini', { body: prompt }));
}
```
