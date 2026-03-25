---
name: api-design-intelligence
description: Next.js API routes design, error responses, and Server Actions patterns. Use when creating or modifying API endpoints.
---

# API Design Intelligence Skill

Use this skill when designing API routes, Server Actions, or standardizing API responses.

## 1. Consistent Response Structure

**Standard Format**:

```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'User-friendly error message',
    details: { field: 'email', issue: 'Invalid format' } // Optional
  }
}
```

**Implementation**:

```typescript
// lib/api-response.ts
export function apiSuccess<T>(data: T) {
  return Response.json({ success: true, data });
}

export function apiError(code: string, message: string, status: number = 400) {
  return Response.json({ success: false, error: { code, message } }, { status });
}
```

## 2. HTTP Status Code Selection

| Status | Use Case              | Example                            |
| :----- | :-------------------- | :--------------------------------- |
| `200`  | Success               | Data retrieved or updated          |
| `201`  | Created               | New resource created               |
| `400`  | Bad Request           | Invalid input, validation failure  |
| `401`  | Unauthorized          | Missing or invalid auth token      |
| `403`  | Forbidden             | Authenticated but lacks permission |
| `404`  | Not Found             | Resource doesn't exist             |
| `405`  | Method Not Allowed    | Wrong HTTP method (GET vs POST)    |
| `429`  | Too Many Requests     | Rate limit exceeded                |
| `500`  | Internal Server Error | Unexpected server failure          |

## 3. Input Validation

**Pattern** (fail fast):

```typescript
// app/api/events/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // Validate early
  if (!body.title || body.title.length < 3) {
    return apiError('INVALID_TITLE', 'Title must be at least 3 characters', 400);
  }

  if (!body.date || isNaN(Date.parse(body.date))) {
    return apiError('INVALID_DATE', 'Date must be a valid ISO string', 400);
  }

  // Proceed with business logic
  const event = await createEvent(body);
  return apiSuccess(event);
}
```

**Use Zod for Complex Validation**:

```typescript
import { z } from 'zod';

const EventSchema = z.object({
  title: z.string().min(3),
  date: z.string().datetime(),
  questId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = EventSchema.safeParse(body);

  if (!result.success) {
    return apiError('VALIDATION_ERROR', result.error.message, 400);
  }

  const event = await createEvent(result.data);
  return apiSuccess(event);
}
```

## 4. Server Actions vs API Routes

**Use Server Actions when**:

- Mutating data from a form submission
- The action is triggered by user interaction (button click)
- You want to avoid creating an extra API endpoint

**Use API Routes when**:

- External clients need to access the endpoint
- You need fine-grained control over HTTP methods and headers
- The endpoint is called from client-side `fetch()` outside of forms

**Example Server Action**:

```typescript
// app/actions/create-event.ts
'use server';

export async function createEvent(formData: FormData) {
  const title = formData.get('title') as string;

  if (!title) {
    return { success: false, error: 'Title is required' };
  }

  const event = await db.events.create({ title });
  revalidatePath('/dashboard');

  return { success: true, data: event };
}
```

## 5. Rate Limiting

**Pattern** (using Upstash or in-memory):

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429);
  }

  // Proceed with request
}
```

## 6. API Versioning

**URL Versioning** (recommended for breaking changes):

```
/api/v1/events
/api/v2/events
```

**Header Versioning** (for same endpoint, different behavior):

```typescript
export async function GET(request: Request) {
  const version = request.headers.get('api-version') ?? 'v1';

  if (version === 'v2') {
    // New behavior
    return apiSuccess(await getEventsV2());
  }

  // Legacy behavior
  return apiSuccess(await getEventsV1());
}
```

## 7. Error Handling Patterns

**Wrap in try/catch**:

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await processEvent(body);
    return apiSuccess(event);
  } catch (error) {
    console.error('[API Error]:', error);

    // Don't leak internal errors
    return apiError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500);
  }
}
```

**Log but Don't Expose**:

- Log full error details server-side
- Return generic message to client
- Include error ID for support debugging
