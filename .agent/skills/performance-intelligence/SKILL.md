---
name: performance-intelligence
description: Performance optimization and Core Web Vitals enforcement for Next.js apps. Use when optimizing bundle size, rendering speed, or addressing performance bottlenecks.
---

# Performance Intelligence Skill

Use this skill when working on performance optimization, bundle analysis, or addressing Core Web Vitals issues.

## 1. Server vs Client Component Decision Matrix

**Default to Server Components** unless the component needs:

- Browser-only APIs (`window`, `localStorage`)
- React hooks (`useState`, `useEffect`, `useContext`)
- Event handlers (`onClick`, `onChange`)
- Client-side interactivity

**Benefits of Server Components**:

- Zero JavaScript sent to client
- Direct database/API access (no extra roundtrip)
- Faster initial page load

## 2. Bundle Size Optimization

### Critical Actions

- [ ] **Remove Unused Dependencies**: Run `npm ls` and audit for unused packages
- [ ] **Use Lighter Alternatives**: Prefer `date-fns` over `moment`, `zustand` over `redux`
- [ ] **Dynamic Imports**: Code-split heavy components:
  ```tsx
  const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
    ssr: false,
    loading: () => <Skeleton />,
  });
  ```
- [ ] **Barrel Export Caution**: Avoid importing from barrel files that export many modules

### Bundle Analysis

Run `npm run build` and check:

- First Load JS: Should be < 200KB for critical pages
- Total Bundle Size: Aim for < 1MB for the entire app

## 3. Image Optimization

**Always use `next/image`** for all images:

```tsx
<Image
  src="/hero.jpg"
  alt="Descriptive text"
  width={800}
  height={600}
  priority={isAboveTheFold} // true for LCP images
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**Checklist**:

- [ ] `priority` prop for above-the-fold images
- [ ] `width` and `height` to prevent layout shift
- [ ] `sizes` prop for responsive images
- [ ] WebP/AVIF format (automatic with `next/image`)

## 4. IndexedDB Query Performance

**Patterns**:

- Use **indexes** for frequent queries (define in `onupgradeneeded`)
- Batch reads/writes in a single transaction
- Avoid reading entire object stores; use cursors with filters
- Cache frequently accessed data in memory (e.g., React Context)

**Example**:

```typescript
// Bad: Reading all events
const allEvents = await db.getAll('events');
const filtered = allEvents.filter((e) => e.date > today);

// Good: Use index
const filtered = await db.getAllFromIndex('events', 'by-date', IDBKeyRange.lowerBound(today));
```

## 5. AI API Latency Budgets

**Thresholds** (for Gemini/OpenAI):

- **Streaming Response**: First token < 500ms
- **Full Response**: < 5 seconds for typical requests
- **Timeout**: 15 seconds max

**Strategies**:

- **Caching**: Cache AI responses for identical inputs (use hash of prompt)
- **Fallback Chain**: Primary model → Faster model → Cached response
- **Progressive Rendering**: Stream UI updates as tokens arrive

## 6. Core Web Vitals Enforcement

**Target Metrics** (production):

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

**How to Measure**:

- Use Chrome DevTools Lighthouse
- Check Next.js analytics (`/_analytics` if enabled)
- Monitor real-user metrics with Vercel Analytics

**Common Fixes**:

- **LCP**: Optimize hero images, use `priority`, preload critical fonts
- **FID**: Reduce JavaScript execution time, defer non-critical scripts
- **CLS**: Reserve space for images/ads, avoid inserting content above existing content
