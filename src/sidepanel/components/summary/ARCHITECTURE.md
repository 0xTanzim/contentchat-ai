# Summary Feature Architecture

## Overview

Production-grade implementation of the Summary feature using enterprise design patterns and React best practices.

## Architecture Layers

### 1. Type Layer (`src/types/summary.types.ts`)

**Purpose**: Centralized type definitions for type safety

**Key Types**:

- `PageContent` - Chrome extension page data
- `StreamingResult` - AI streaming response
- `SummaryResult` - Generation success
- `SummaryError` - Generation failure with categorized errors
- Service interfaces: `ISummaryService`, `IChromeExtensionService`, `IHistoryService`
- Hook return types: `UseSummarizerReturn`, `UseChromeExtensionReturn`, `UseTypewriterReturn`

### 2. Service Layer (`src/lib/services/`)

**Purpose**: Business logic without React dependencies

#### `summaryService.ts`

- `validateContent(content)` - Pre-generation validation
- `truncateContent(content, maxLength)` - Smart content truncation
- `buildContext(options)` - Dynamic AI context generation
- `generateSummaryStreaming(content, options, context)` - Streaming generation
- `stopGeneration(reader, summarizer)` - Resource cleanup
- `generateStats(original, summary)` - Statistics calculation

#### `chromeExtensionService.ts`

- `getCurrentPageContent()` - Load page from content script
- `listenToTabUpdates(callback)` - Tab URL changes and page loads
- `listenToTabActivation(callback)` - Tab switching
- `listenToMessages(callback)` - Runtime messages
- `openTab(url)` - Open new tab

#### `historyService.ts`

- `saveHistory(url, summary)` - Save to Zustand store
- `getAllHistory()` - Get all summaries
- `getRecentHistory(limit)` - Get recent summaries
- `cleanupOldHistory(maxAgeDays)` - Auto-cleanup (default: 30 days)
- `deleteHistoryItem(url, timestamp)` - Delete specific item

### 3. Hooks Layer (`src/sidepanel/hooks/`)

**Purpose**: React integration of services

#### `useSummarizer(currentPage, options)`

Returns: `{ generate, stop, isStreaming, isLoading, streamingText, finalResult, error, stats }`

**Features**:

- Complete generation lifecycle
- Streaming with chunk accumulation
- Proper abortion via reader.cancel()
- Categorized error handling
- Auto-saves to history
- Clears state on URL change

#### `useChromeExtension()`

Returns: `{ currentPage, isLoading, error, reload }`

**Features**:

- Listens to content script ready
- Detects tab updates
- Detects tab activation
- Detects URL changes with notifications
- Auto-reloads on page changes

#### `useTypewriter(targetText, enabled, charsPerTick?, tickDelay?)`

Returns: `{ displayText }`

**Features**:

- Smooth animation effect
- Configurable speed
- No external dependencies

### 4. Component Layer (`src/sidepanel/components/summary/`)

**Purpose**: UI orchestration

#### `SummaryView.tsx` (Main Container)

**State**:

- 1 useState: `showOptions` (UI toggle)
- 3 custom hooks: `useChromeExtension`, `useSummarizer`, `useTypewriter`

**Responsibilities**:

- Render UI structure
- Handle user interactions
- Display loading/error states
- Compose sub-components

#### Presentational Components (Unchanged)

- `SummaryContent.tsx` - Display summary text
- `SummaryActions.tsx` - Copy, Save, Share, Regenerate buttons
- `SummaryOptions.tsx` - Length, Format, Context inputs
- `SummaryStats.tsx` - Word count, compression ratio
- `SummaryTypeSelector.tsx` - Key Points, TLDR, etc.

## Data Flow

```
User Action
    ↓
Component (SummaryView)
    ↓
Custom Hook (useSummarizer)
    ↓
Service (summaryService)
    ↓
Chrome AI API
    ↓
Streaming Response
    ↓
Service (processes chunks)
    ↓
Hook (updates state)
    ↓
Component (renders UI)
```

## State Management

### Global State (Zustand)

- `summaryStore` - Summaries, options, history
- Persisted in localStorage
- Accessed via `useSummaryStore()`

### Local State (Component)

- `showOptions` - Options panel visibility
- All other state in custom hooks

### Refs (Hooks)

- `activeReaderRef` - Stream reader for abortion
- `activeSummarizerRef` - Summarizer instance for cleanup

## Error Handling

### Service Layer

- Throws typed errors with meaningful messages
- No UI concerns (no toasts, no React state)
- Example: `throw new Error('AI features not available')`

### Hook Layer

- Catches service errors
- Sets error state: `{ error: 'User-friendly message' }`
- Shows toast notifications
- Provides retry actions

### Component Layer

- Displays errors from hooks
- Renders error UI
- Handles retry button clicks

## Testing Strategy

### Unit Tests (Services)

```typescript
describe('SummaryService', () => {
  it('validates content length', () => {
    const result = summaryService.validateContent('short');
    expect(result.valid).toBe(false);
  });
});
```

### Integration Tests (Hooks)

```typescript
describe('useSummarizer', () => {
  it('generates summary', async () => {
    const { result } = renderHook(() => useSummarizer(mockPage, mockOptions));
    await act(() => result.current.generate());
    expect(result.current.finalResult).not.toBe('');
  });
});
```

### E2E Tests (Components)

```typescript
describe('SummaryView', () => {
  it('shows summary after generation', async () => {
    render(<SummaryView />);
    fireEvent.click(screen.getByText('Generate'));
    await waitFor(() =>
      expect(screen.getByText(/Summary/)).toBeInTheDocument()
    );
  });
});
```

## Performance Optimizations

1. **Memoization**: `useCallback` for event handlers
2. **State Batching**: Single setState calls where possible
3. **Ref Usage**: Avoid re-renders for internal state
4. **Cleanup**: All listeners removed on unmount
5. **Lazy Loading**: Components loaded on demand

## Edge Cases Handled

1. ✅ Content too short (<100 chars)
2. ✅ Insufficient text (<20 words)
3. ✅ Concurrent generation prevention
4. ✅ Very long content (>50k chars)
5. ✅ AI not available
6. ✅ Rate limiting / Quota exceeded
7. ✅ Model downloading
8. ✅ Network errors
9. ✅ Empty result validation
10. ✅ User stopped generation

## File Structure

```
src/
├── types/
│   └── summary.types.ts           # Type definitions
├── lib/
│   └── services/
│       ├── summaryService.ts      # AI logic
│       ├── chromeExtensionService.ts  # Chrome APIs
│       └── historyService.ts      # History management
├── sidepanel/
│   ├── hooks/
│   │   ├── index.ts               # Barrel exports
│   │   ├── useSummarizer.ts       # AI generation hook
│   │   ├── useChromeExtension.ts  # Chrome integration
│   │   └── useTypewriter.ts       # Animation effect
│   ├── components/
│   │   └── summary/
│   │       ├── SummaryView.tsx    # Main container ✨
│   │       ├── SummaryContent.tsx # Presentational
│   │       ├── SummaryActions.tsx # Presentational
│   │       ├── SummaryOptions.tsx # Presentational
│   │       ├── SummaryStats.tsx   # Presentational
│   │       └── SummaryTypeSelector.tsx  # Presentational
│   └── stores/
│       └── summaryStore.ts        # Zustand store
```

## Usage Example

```typescript
// In any component
import { useSummarizer, useChromeExtension } from '@/sidepanel/hooks';

function MyComponent() {
  const { currentPage } = useChromeExtension();
  const { generate, stop, isStreaming, finalResult, error } = useSummarizer(
    currentPage,
    { type: 'key-points', length: 'medium', format: 'markdown' }
  );

  return (
    <div>
      <button onClick={generate} disabled={isStreaming}>
        Generate
      </button>
      {isStreaming && <button onClick={stop}>Stop</button>}
      {error && <p>{error}</p>}
      {finalResult && <div>{finalResult}</div>}
    </div>
  );
}
```

## Benefits

1. ✅ **Testable** - Each layer independently testable
2. ✅ **Maintainable** - Clear separation of concerns
3. ✅ **Reusable** - Hooks work in any component
4. ✅ **Type-Safe** - 100% TypeScript coverage
5. ✅ **Scalable** - Easy to add features
6. ✅ **Debuggable** - Clear stack traces
7. ✅ **Documented** - Self-documenting code

## Migration Guide

### From Old Architecture

```typescript
// OLD: 747 lines, 10 useState, 5 useEffect
function SummaryView() {
  const [localLoading, setLocalLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  // ... 8 more useState

  useEffect(() => { /* typewriter */ }, [...]);
  useEffect(() => { /* load page */ }, []);
  // ... 3 more useEffect

  async function generateSummary() {
    // 300+ lines of logic
  }

  // ... 5 more functions

  return (/* 200 lines of JSX */);
}
```

### To New Architecture

```typescript
// NEW: 219 lines, 1 useState, 0 useEffect
function SummaryView() {
  const [showOptions, setShowOptions] = useState(false);

  // Business logic in hooks
  const { currentPage, isLoading, reload } = useChromeExtension();
  const { generate, stop, isStreaming, streamingText, finalResult, error, stats } = useSummarizer(currentPage, activeOptions);
  const { displayText } = useTypewriter(streamingText, isStreaming);

  // Simple event handlers
  const handleCopy = (text: string) => copyToClipboard(text).then(/* ... */);

  return (/* 100 lines of JSX */);
}
```

## Resources

- [React Hooks Best Practices](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**Last Updated**: October 28, 2025
**Status**: Production Ready ✅
**Maintainer**: ContentChat AI Team
