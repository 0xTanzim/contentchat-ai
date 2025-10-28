# Testing Guide 🧪

**ContentChat AI Extension Testing Suite**

---

## 📦 Testing Stack

### **Unit & Integration Tests**

- **Vitest 4.0** - Fast Vite-native test framework
- **@testing-library/react** - User-centric component testing
- **@testing-library/user-event** - Realistic user interactions
- **happy-dom** - Lightweight DOM implementation
- **@testing-library/jest-dom** - Custom matchers for DOM assertions

### **End-to-End Tests**

- **Playwright 1.56** - Cross-browser E2E testing
- **Chromium** - Chrome Extension testing with persistent context

---

## 🚀 Quick Start

### **1. Install Playwright Browsers**

```bash
pnpm run playwright:install
```

### **2. Run Unit Tests**

```bash
# Run all unit tests once
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run with UI dashboard
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### **3. Run E2E Tests**

```bash
# Run E2E tests (requires built extension)
pnpm run build
pnpm test:e2e

# Run with Playwright UI (interactive)
pnpm test:e2e:ui

# Run in debug mode (step through tests)
pnpm test:e2e:debug
```

### **4. Run All Tests**

```bash
pnpm test:all
```

---

## 📁 Test Structure

```
src/
├── lib/
│   ├── chrome-ai.ts
│   ├── chrome-ai.test.ts          ✅ Unit tests for AI wrapper
│   ├── page-content.ts
│   └── page-content.test.ts       ✅ Unit tests for content extraction
│
├── sidepanel/
│   └── stores/
│       ├── appStore.ts
│       ├── appStore.test.ts        ✅ Unit tests for app state
│       ├── summaryStore.ts
│       ├── summaryStore.test.ts    ✅ Unit tests for summary cache
│       ├── chatStore.ts
│       └── chatStore.test.ts       🚧 TODO
│
├── __tests__/
│   ├── setup.ts                    ✅ Global test setup & mocks
│   └── mocks/
│       └── chrome-ai.mock.ts       ✅ Chrome AI mock helpers
│
tests/
└── e2e/
    └── extension.spec.ts           ✅ E2E tests for extension
```

---

## 🧪 Test Coverage

### **Lib Layer Tests**

#### **chrome-ai.ts** ✅ COMPLETE

- ✅ `isAIAvailable()` - Check AI availability
- ✅ `checkCapability()` - Capability detection
- ✅ `summarizeText()` - Text summarization
  - Success case
  - Long text truncation (50k limit)
  - AI unavailable error
  - Quota exceeded error
  - Resource cleanup on error
- ✅ `promptWithContext()` - Q&A with context
  - Success case
  - Context inclusion in prompt
  - AI unavailable error
  - Resource cleanup on error
- ✅ `translateText()` - Translation
  - Success case
  - AI unavailable error
- ✅ `detectLanguage()` - Language detection
  - Success case
  - AI unavailable error

#### **page-content.ts** ✅ COMPLETE

- ✅ `getCurrentPageContent()` - Extract page content
  - Success case
  - Chrome API calls
  - No active tab handling
  - Error handling
- ✅ `canAccessCurrentPage()` - Check page accessibility
  - Accessible pages (http/https)
  - Protected pages (chrome://, chrome-extension://, edge://)
  - No tabs handling

---

### **Store Tests**

#### **appStore.ts** ✅ COMPLETE

- ✅ Initial state verification
- ✅ `setCurrentPage()` - Set/clear current page
- ✅ `setIsLoading()` - Toggle loading state
- ✅ `setError()` - Set/clear error messages
- ✅ `setAiAvailable()` - Set AI availability
- ✅ `setActiveView()` - Switch between views

#### **summaryStore.ts** ✅ COMPLETE

- ✅ Initial state verification
- ✅ `addSummary()` - Add summaries
  - Single summary
  - Multiple types per URL
  - Overwrite existing
  - Multiple URLs
- ✅ `getSummary()` - Retrieve summaries
  - Non-existent URL
  - Non-existent type
- ✅ `hasSummary()` - Check summary existence
- ✅ `clearSummaries()` - Clear summaries for URL
- ✅ `setActiveSummaryType()` - Change active type
- ✅ Persistence to localStorage

#### **chatStore.ts** 🚧 TODO

- ⏳ Initial state
- ⏳ `addMessage()` - Add messages
- ⏳ `getMessages()` - Retrieve messages
- ⏳ `clearConversation()` - Clear chat
- ⏳ Persistence to localStorage

---

### **Component Tests** 🚧 TODO

#### **SummaryView.tsx** 🚧 PLANNED

- ⏳ Render summary types tabs
- ⏳ Switch between summary types
- ⏳ Generate summary on click
- ⏳ Display cached summary
- ⏳ Loading state
- ⏳ Error handling

#### **ChatView.tsx** 🚧 PLANNED

- ⏳ Render chat interface
- ⏳ Send message
- ⏳ Display message history
- ⏳ Clear conversation
- ⏳ Keyboard shortcuts (Enter to send)
- ⏳ Loading state

#### **ErrorBanner.tsx** 🚧 PLANNED

- ⏳ Render error message
- ⏳ Dismiss error
- ⏳ Hide when no error

---

### **E2E Tests**

#### **extension.spec.ts** ✅ COMPLETE

- ✅ Load extension successfully
- ✅ Open side panel
- ✅ Display navigation tabs
- ✅ Switch between views
- ✅ Show AI unavailable warning
- ✅ Display summary options
- ✅ Display chat input
- ✅ Show coming soon for incomplete features
- 🔒 Generate summary (requires Chrome AI) - SKIPPED
- 🔒 Handle chat conversation (requires Chrome AI) - SKIPPED

**Note:** Tests marked with 🔒 require Chrome Built-in AI APIs (Chrome 128+) and are skipped by default.

---

## 🔧 Configuration Files

### **vitest.config.ts**

```typescript
- Environment: happy-dom
- Setup: src/__tests__/setup.ts
- Coverage: 80% threshold (lines/functions/branches/statements)
- Includes: src/**/*.{test,spec}.{ts,tsx}
- Excludes: dist, node_modules, e2e tests
```

### **playwright.config.ts**

```typescript
- Test directory: tests/e2e
- Browser: Chromium (for Chrome Extension support)
- Workers: 1 (serial execution)
- Retries: 2 on CI, 0 locally
- Reporters: HTML, JSON, List
```

---

## 🎭 Mocking Strategy

### **Chrome APIs** (src/**tests**/setup.ts)

All Chrome Extension APIs are mocked globally:

- `chrome.runtime` - Extension runtime
- `chrome.tabs` - Tab management
- `chrome.storage` - Storage APIs
- `chrome.sidePanel` - Side panel APIs

### **Chrome AI APIs** (src/**tests**/mocks/chrome-ai.mock.ts)

Helper functions for different AI scenarios:

- `mockAIAvailable()` - Mock AI as ready
- `mockAIUnavailable()` - Mock AI as not available
- `mockAIRequiresDownload()` - Mock AI needing download
- `mockAIQuotaExceeded()` - Mock quota errors
- `mockPageContent()` - Mock successful page content extraction
- `mockProtectedPage()` - Mock protected page (chrome://)

### **localStorage**

Mocked with in-memory storage that resets between tests.

---

## 📊 Coverage Reports

### **Generate Coverage**

```bash
pnpm test:coverage
```

### **View HTML Report**

```bash
open coverage/index.html
```

### **Current Coverage Targets**

- ✅ Lines: 80%
- ✅ Functions: 80%
- ✅ Branches: 80%
- ✅ Statements: 80%

---

## 🐛 Debugging Tests

### **Vitest UI (Unit Tests)**

```bash
pnpm test:ui
```

Opens interactive UI at `http://localhost:51204/__vitest__/`

### **Playwright UI (E2E Tests)**

```bash
pnpm test:e2e:ui
```

Opens interactive Playwright UI with time-travel debugging

### **Debug Mode**

```bash
pnpm test:e2e:debug
```

Runs tests with Playwright Inspector for step-by-step debugging

### **VS Code Debugging**

Add breakpoints and use VS Code's "JavaScript Debug Terminal"

---

## 📝 Writing New Tests

### **Unit Test Template**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from './myModule';

describe('myModule', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### **Component Test Template**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle clicks', async () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    await fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### **E2E Test Template**

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('https://example.com');
  await page.click('button');
  await expect(page.locator('.result')).toBeVisible();
});
```

---

## ✅ CI/CD Integration

### **GitHub Actions Example**

```yaml
- name: Install dependencies
  run: pnpm install

- name: Run unit tests
  run: pnpm test

- name: Run E2E tests
  run: |
    pnpm run build
    pnpm test:e2e

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

---

## 🎯 Testing Best Practices

### **DO:**

- ✅ Write tests for critical business logic
- ✅ Test user-facing behavior, not implementation details
- ✅ Use descriptive test names
- ✅ Keep tests isolated and independent
- ✅ Mock external dependencies (Chrome APIs, AI APIs)
- ✅ Test error cases and edge cases
- ✅ Clean up after tests (reset stores, clear mocks)

### **DON'T:**

- ❌ Test implementation details
- ❌ Share state between tests
- ❌ Write tests that depend on execution order
- ❌ Mock too much (prefer integration over unit when possible)
- ❌ Ignore flaky tests
- ❌ Skip tests without good reason

---

## 📈 Next Steps

### **Immediate (Today)**

1. ✅ Run initial test suite: `pnpm test`
2. ✅ Verify all tests pass
3. 🚧 Add chatStore tests
4. 🚧 Add component tests for SummaryView
5. 🚧 Add component tests for ChatView

### **Short-term (This Week)**

1. Increase coverage to 90%+
2. Add integration tests
3. Add performance benchmarks
4. Set up CI/CD pipeline

### **Long-term**

1. Add visual regression tests
2. Add accessibility tests (a11y)
3. Add performance monitoring
4. Add mutation testing

---

## 🆘 Troubleshooting

### **Tests failing with "Cannot find module"**

- Run `pnpm install` to ensure all dependencies are installed
- Check `tsconfig.json` path aliases match `vitest.config.ts`

### **E2E tests not finding extension**

- Ensure extension is built: `pnpm run build`
- Check `dist/` folder exists
- Verify manifest.json is in `dist/`

### **Chrome AI tests always failing**

- Chrome Built-in AI requires Chrome 128+ or experimental flags
- Tests with real AI are skipped by default (marked with `test.skip`)
- Use mocks for unit tests instead

### **Coverage not generating**

- Install coverage provider: `pnpm add -D @vitest/coverage-v8`
- Check `vitest.config.ts` has coverage configuration

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Chrome Extension Testing](https://playwright.dev/docs/chrome-extensions)

---

**Let's build with confidence! 🚀**
