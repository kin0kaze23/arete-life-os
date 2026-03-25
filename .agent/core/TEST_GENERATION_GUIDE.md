# Test Generation Guidelines

This guide helps you (and the AI agent) generate consistent, high-quality tests for Areté Life OS.

## Testing Philosophy

Follow the Testing Pyramid:

- **Unit Tests** (70%): Test individual functions/components
- **Integration Tests** (20%): Test component interactions
- **E2E Tests** (10%): Test complete user flows

## File Naming Convention

```
src/
  component/
    Component.tsx
    Component.test.tsx        # Unit tests
    Component.integration.tsx # Integration tests

e2e/
  user-flow.spec.ts          # E2E tests
```

## Unit Test Template (React Component)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const onClickMock = vi.fn();
    render(<ComponentName onClick={onClickMock} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('updates state correctly', () => {
    render(<ComponentName />);
    // Test state changes
  });
});
```

## Unit Test Template (Utility Function)

```typescript
import { describe, it, expect } from 'vitest';
import { functionName } from './module';

describe('functionName', () => {
  it('returns expected output for valid input', () => {
    const result = functionName('input');
    expect(result).toBe('expected');
  });

  it('handles edge cases', () => {
    expect(functionName('')).toBe('default');
    expect(functionName(null)).toBe('default');
  });

  it('throws error for invalid input', () => {
    expect(() => functionName(undefined)).toThrow();
  });
});
```

## Integration Test Template

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuraProvider } from '../core/useAura';
import { ComponentWithContext } from './ComponentWithContext';

describe('ComponentWithContext Integration', () => {
  it('integrates with useAura correctly', async () => {
    render(
      <AuraProvider>
        <ComponentWithContext />
      </AuraProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Loaded Data')).toBeInTheDocument();
    });
  });
});
```

## E2E Test Template (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Flow: Feature Name', () => {
  test('user can complete primary action', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for app to load
    await expect(page.locator('[data-testid="app-loaded"]')).toBeVisible();

    // Perform action
    await page.click('[data-testid="action-button"]');

    // Verify result
    await expect(page.locator('[data-testid="result"]')).toHaveText('Success');
  });

  test('handles error gracefully', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Trigger error condition
    await page.click('[data-testid="error-trigger"]');

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

## What to Test

### Required Coverage

- ✅ **Critical Paths**: Authentication, data persistence, core loops
- ✅ **Error Handling**: Network failures, validation errors
- ✅ **Edge Cases**: Empty states, boundary conditions
- ✅ **Accessibility**: Keyboard navigation, ARIA labels

### Optional Coverage

- ⚠️ **UI Styling**: Only test functional CSS (visibility, layout)
- ⚠️ **Third-party Libraries**: Assume they work unless custom wrapper

## AI Agent Test Generation

When implementing a new component, the agent should:

1. **Identify Test Scope**
   - What is the component's purpose?
   - What are the critical behaviors?
   - What are the edge cases?

2. **Generate Test File**
   - Create `ComponentName.test.tsx`
   - Follow template above
   - Cover all public methods/props

3. **Run Tests**
   - `npm test ComponentName.test.tsx`
   - Ensure all tests pass
   - Achieve >80% coverage for the file

4. **Report**
   - "Generated 5 tests for ComponentName"
   - "Coverage: 85%"
   - "All tests passing ✅"

## Running Tests

```bash
# All tests
npm test

# Specific file
npm test ComponentName.test.tsx

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how
2. **Use data-testid**: For stable selectors: `<div data-testid="user-profile">`
3. **Mock External Dependencies**: Don't hit real APIs in tests
4. **Keep Tests Fast**: Unit tests should run in <100ms each
5. **One Assertion Per Test**: Clear, focused tests

## Example: Generated Test for LifeBalanceStrip

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LifeBalanceStrip } from './LifeBalanceStrip';
import { AuraProvider } from '../../core/useAura';

describe('LifeBalanceStrip', () => {
  it('renders all 5 life dimensions', () => {
    render(
      <AuraProvider>
        <LifeBalanceStrip />
      </AuraProvider>
    );

    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Relations')).toBeInTheDocument();
    expect(screen.getByText('Spiritual')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('displays scores with correct styling', () => {
    render(
      <AuraProvider>
        <LifeBalanceStrip />
      </AuraProvider>
    );

    const healthScore = screen.getByText('84');
    expect(healthScore).toHaveClass('text-white');
  });

  it('shows trend indicators', () => {
    render(
      <AuraProvider>
        <LifeBalanceStrip />
      </AuraProvider>
    );

    const trendBadges = screen.getAllByText(/[+-]\d+%|0%/);
    expect(trendBadges.length).toBeGreaterThan(0);
  });
});
```

## Integration with Native Automation

When agent implements a task:

1. Create component
2. Generate test file (using this guide)
3. Run tests
4. Report coverage at checkpoint

This ensures quality and prevents regressions.
