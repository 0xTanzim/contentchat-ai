# Chat Feature Refactoring Plan 🚀

## Overview

Transform the basic chat into a production-grade conversational AI interface with streaming, dual modes, and exceptional UX.

## Current Issues ❌

1. **No Streaming** - Response appears all at once (poor UX)
2. **No Animation** - No character-by-character typing effect
3. **No Stop Button** - Can't abort long responses
4. **Single Mode Only** - Hardcoded to page content only
5. **Basic UI** - No markdown rendering, code highlighting
6. **Poor Error Handling** - Generic error messages
7. **No Message Actions** - Can't copy, regenerate, or edit
8. **No Conversation Management** - Basic message list
9. **Limited UX** - No psychology-driven features
10. **Not Scalable** - Monolithic component (200+ lines)

## New Features ✅

### Must Have (MVP)

1. ✅ **Character-by-Character Streaming** - Like ChatGPT
2. ✅ **Stop Generation Button** - User control during generation
3. ✅ **Dual Modes:**
   - **Page Context Mode** - Q&A about current page content
   - **Personal Mode** - General AI chat (no page context)
4. ✅ **Markdown Rendering** - Rich text formatting
5. ✅ **Code Syntax Highlighting** - Beautiful code blocks
6. ✅ **Auto-Scroll** - Smooth scroll to new messages
7. ✅ **Auto-Resize Input** - Grows with content
8. ✅ **Message Timestamps** - Trust & transparency
9. ✅ **Clear Conversation** - Start fresh anytime
10. ✅ **Comprehensive Error Handling** - All edge cases

### Should Have (Enhanced UX)

11. ✅ **Copy Message** - One-click copy any message
12. ✅ **Regenerate Response** - Try again if answer is bad
13. ✅ **Message Actions Menu** - Hover to reveal actions
14. ✅ **Keyboard Shortcuts:**
    - Enter = Send
    - Shift+Enter = New line
    - Ctrl+K = Clear conversation
15. ✅ **Empty State** - Helpful suggestions
16. ✅ **Conversation Persistence** - Never lose chat history
17. ✅ **Rate Limit Warnings** - Proactive error prevention
18. ✅ **Character Count** - For long messages
19. ✅ **Mode Indicator** - Show which mode is active
20. ✅ **Smooth Animations** - Professional polish

### Could Have (Nice to Have - Future)

21. Edit sent messages
22. Delete individual messages
23. Search in conversation
24. Export conversation (MD/JSON)
25. Voice input
26. Conversation branching
27. Message reactions
28. Conversation titles (auto-generated)
29. Multiple conversations sidebar
30. Conversation sharing

## Architecture

### Type Layer (`types/chat.types.ts`)

```typescript
// Message status for UI states
type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

// Chat modes
type ChatMode = 'page-context' | 'personal';

// Enhanced message structure
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  status: MessageStatus;
  error?: string;
  mode: ChatMode;
  pageUrl?: string; // If page-context mode
  pageTitle?: string;
  model?: string;
  tokens?: { prompt: number; completion: number };
}

// Conversation container
interface Conversation {
  id: string;
  mode: ChatMode;
  url?: string; // Page URL if page-context mode
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  settings?: ChatSettings;
}

// User preferences
interface ChatSettings {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  streamSpeed?: 'fast' | 'medium' | 'slow';
}
```

### Service Layer

#### `chatService.ts` - AI Logic

```typescript
class ChatService {
  // Generate response with streaming
  async generateResponseStreaming(
    messages: Message[],
    mode: ChatMode,
    pageContent?: string
  ): Promise<StreamingResult>;

  // Stop active generation
  async stopGeneration(reader, model): Promise<void>;

  // Build context from conversation history
  buildContext(messages: Message[], pageContent?: string): string;

  // Validate message before sending
  validateMessage(content: string): ValidationResult;

  // Estimate tokens
  estimateTokens(text: string): number;
}
```

#### `conversationService.ts` - Message Management

```typescript
class ConversationService {
  // Format message for display
  formatMessage(message: Message): FormattedMessage;

  // Generate conversation title from first messages
  generateTitle(messages: Message[]): string;

  // Calculate conversation stats
  getConversationStats(conversation: Conversation): Stats;

  // Prune old messages to fit context window
  pruneMessages(messages: Message[], maxTokens: number): Message[];
}
```

### Hooks Layer

#### `useChatSession.ts` - Session Management

```typescript
function useChatSession(mode: ChatMode, pageUrl?: string) {
  return {
    conversation: Conversation | null
    sendMessage: (content: string) => Promise<void>
    stopGeneration: () => void
    regenerateLastResponse: () => Promise<void>
    clearConversation: () => void
    isStreaming: boolean
    isLoading: boolean
    error: string | null
  }
}
```

#### `useMessageStreaming.ts` - Character Animation

```typescript
function useMessageStreaming(
  targetText: string,
  enabled: boolean,
  speed: 'fast' | 'medium' | 'slow'
) {
  return {
    displayText: string
    progress: number // 0-100
    isComplete: boolean
  }
}
```

#### `useScrollToBottom.ts` - Auto-Scroll

```typescript
function useScrollToBottom(dependency: any[], enabled: boolean) {
  return {
    scrollRef: RefObject<HTMLDivElement>
    scrollToBottom: () => void
    isAtBottom: boolean
  }
}
```

### Component Layer

#### `ChatView.tsx` - Container (~150 lines)

- Orchestrates all sub-components
- Manages mode switching
- Handles keyboard shortcuts
- Minimal state, delegates to hooks

#### `ChatHeader.tsx` - Header with Mode Switcher

- Mode toggle (Page Context / Personal)
- Current page indicator
- Clear conversation button
- Settings menu (future)

#### `ChatMessage.tsx` - Message Display

- Markdown rendering with react-markdown
- Code syntax highlighting with rehype-highlight
- Message metadata (timestamp, mode, status)
- Hover actions menu
- Loading/streaming states

#### `ChatInput.tsx` - Input Area

- Auto-resize textarea
- Character count indicator
- Send button with loading state
- Keyboard shortcuts support
- Disabled states

#### `MessageActions.tsx` - Action Buttons

- Copy message button
- Regenerate button (last assistant message only)
- Edit button (future)
- Delete button (future)

#### `EmptyState.tsx` - Empty Conversation

- Welcome message
- Mode-specific suggestions
- Quick action buttons
- Getting started tips

## Store Enhancements

### Current Store (Simple)

```typescript
{
  conversations: Record<string, Message[]>;
}
```

### New Store (Enhanced)

```typescript
{
  // All conversations
  conversations: Record<string, Conversation>

  // Active conversation ID
  activeConversationId: string | null

  // User settings
  settings: ChatSettings

  // Methods
  createConversation(mode, url?)
  getConversation(id)
  getAllConversations()
  updateConversation(id, updates)
  deleteConversation(id)
  addMessage(conversationId, message)
  updateMessage(conversationId, messageId, updates)
  deleteMessage(conversationId, messageId)
  setMessageStatus(conversationId, messageId, status)
  clearConversation(conversationId)
  clearAll()

  // Queries
  getConversationsByMode(mode)
  getConversationsByPage(url)
  searchConversations(query)
}
```

## Edge Cases Handled

### Content Validation

- ✅ Empty message submission blocked
- ✅ Very long messages truncated (10k chars)
- ✅ Special characters sanitized
- ✅ Code blocks preserved
- ✅ URLs detected and linkified

### AI Generation

- ✅ Model not available → Clear error + guidance
- ✅ Model downloading → Progress indicator
- ✅ Rate limiting → Wait timer + retry button
- ✅ Network errors → Retry with backoff
- ✅ Empty response → Error message + regenerate
- ✅ Streaming interrupted → Partial save + retry
- ✅ Very slow responses → Timeout warning

### Conversation Management

- ✅ No page content in personal mode → Works fine
- ✅ Page changed mid-conversation → Warning + option to continue
- ✅ Conversation history too long → Auto-prune oldest messages
- ✅ Delete conversation → Confirmation dialog
- ✅ Switch between pages → Load correct conversation
- ✅ Multiple tabs → Sync via localStorage events

### UX Edge Cases

- ✅ Send while AI responding → Queued until complete
- ✅ Navigate away mid-generation → Auto-abort
- ✅ Scroll position → Maintain unless at bottom
- ✅ Input auto-resize → Max 300px height
- ✅ Focus management → Auto-focus after send
- ✅ Keyboard shortcuts → All major actions covered

### Storage & Performance

- ✅ localStorage quota → Prune old conversations
- ✅ Corrupted data → Migration + recovery
- ✅ Too many messages → Virtualized list (future)
- ✅ Long messages → Lazy markdown rendering
- ✅ Memory leaks → Proper cleanup in hooks
- ✅ Re-render optimization → useMemo/useCallback

## UX Psychology Principles

### Trust & Transparency

1. **Show Status** - User always knows what's happening
2. **Timestamps** - Build trust with visible history
3. **Error Honesty** - Clear, helpful error messages
4. **Progress Indicators** - Never leave user wondering

### Control & Autonomy

1. **Stop Button** - User can abort anytime
2. **Regenerate** - Don't like answer? Try again
3. **Clear History** - User owns their data
4. **Mode Switching** - Choose how to use the tool

### Feedback & Confirmation

1. **Typing Animation** - Shows AI is "thinking"
2. **Smooth Scrolling** - Guides attention
3. **Hover States** - Discoverable actions
4. **Toasts** - Confirm important actions

### Reduce Friction

1. **Auto-Resize Input** - No manual resizing
2. **Auto-Scroll** - Always see new messages
3. **Keyboard Shortcuts** - Power users rejoice
4. **Smart Suggestions** - Help users get started

### Delight & Polish

1. **Smooth Animations** - Professional feel
2. **Code Highlighting** - Beautiful code blocks
3. **Markdown Formatting** - Rich text support
4. **Empty States** - Helpful, not intimidating

## Implementation Order

### Phase 1: Foundation (Day 1)

1. ✅ Create `types/chat.types.ts`
2. ✅ Refactor `chatStore.ts` with enhanced structure
3. ✅ Add migration logic for old conversations
4. ✅ Test store methods

### Phase 2: Services (Day 1-2)

1. ✅ Create `chatService.ts` - AI streaming
2. ✅ Create `conversationService.ts` - Message utils
3. ✅ Test both services independently
4. ✅ Add error handling

### Phase 3: Hooks (Day 2)

1. ✅ Create `useChatSession.ts`
2. ✅ Create `useMessageStreaming.ts`
3. ✅ Create `useScrollToBottom.ts`
4. ✅ Test hooks with mock data

### Phase 4: Components (Day 2-3)

1. ✅ Refactor `ChatView.tsx` (container)
2. ✅ Create `ChatHeader.tsx` (mode switcher)
3. ✅ Create `ChatMessage.tsx` (message display)
4. ✅ Create `ChatInput.tsx` (input area)
5. ✅ Create `MessageActions.tsx` (actions)
6. ✅ Create `EmptyState.tsx` (empty state)

### Phase 5: Polish (Day 3)

1. ✅ Add keyboard shortcuts
2. ✅ Add animations
3. ✅ Add error boundaries
4. ✅ Add loading skeletons
5. ✅ Test all edge cases
6. ✅ Performance optimization

### Phase 6: Testing & Documentation (Day 3)

1. ✅ Manual testing all features
2. ✅ Test all edge cases
3. ✅ Update documentation
4. ✅ Create migration guide
5. ✅ Final build & deployment

## Library Decisions

### ✅ Use (Already In Project)

- react-markdown - Markdown rendering
- remark-gfm - GitHub Flavored Markdown
- lucide-react - Icons
- zustand - State management
- sonner - Toast notifications
- shadcn/ui - UI components

### ✅ Add (New Dependencies)

- rehype-highlight - Code syntax highlighting
- highlight.js - Syntax themes

### ❌ Don't Use (Not Needed)

- Vercel AI SDK - Server-side only
- react-textarea-autosize - Can do with CSS
- Chat UI kits - Too opinionated
- External chat libraries - Not compatible with Chrome AI

## Success Metrics

### Before Refactoring

- Lines: 200 (monolithic)
- Features: 3/20
- Edge Cases: 2/30
- UX Score: 4/10
- Testability: 3/10
- Maintainability: 4/10

### After Refactoring (Target)

- Lines: ~150 (container)
- Features: 20/20 ✅
- Edge Cases: 30/30 ✅
- UX Score: 9/10 ✅
- Testability: 9/10 ✅
- Maintainability: 9/10 ✅

## Benefits

1. ✅ **ChatGPT-Quality UX** - Professional chat interface
2. ✅ **Dual Modes** - Page context + Personal chat
3. ✅ **Streaming** - Character-by-character like real chat
4. ✅ **User Control** - Stop, regenerate, clear anytime
5. ✅ **Error Resilient** - Handles all edge cases gracefully
6. ✅ **Performant** - Optimized rendering
7. ✅ **Maintainable** - Clean architecture
8. ✅ **Testable** - Each layer independently testable
9. ✅ **Scalable** - Easy to add features
10. ✅ **Delightful** - Psychology-driven UX

---

**Ready to implement! Let's build a world-class chat experience! 🚀**
