/**
 * Chat Types
 * Type definitions for the chat feature
 * Ensures type safety across services, hooks, and components
 */

/**
 * Chat mode - determines context and behavior
 */
export type ChatMode = 'page-context' | 'personal';

/**
 * Message status for UI states
 */
export type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

/**
 * Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Stream speed for character animation
 */
export type StreamSpeed = 'fast' | 'medium' | 'slow';

/**
 * Chat message structure
 */
export interface Message {
  /** Unique message ID */
  id: string;
  /** Message role */
  role: MessageRole;
  /** Message content (markdown supported) */
  content: string;
  /** Creation timestamp */
  timestamp: number;
  /** Current message status */
  status: MessageStatus;
  /** Error message if status is 'error' */
  error?: string;
  /** Chat mode when message was sent */
  mode: ChatMode;
  /** Page URL if page-context mode */
  pageUrl?: string;
  /** Page title if page-context mode */
  pageTitle?: string;
  /** Model used for generation */
  model?: string;
  /** Token usage */
  tokens?: {
    prompt: number;
    completion: number;
  };
}

/**
 * Conversation container
 */
export interface Conversation {
  /** Unique conversation ID */
  id: string;
  /** Chat mode */
  mode: ChatMode;
  /** Page URL if page-context mode, 'personal' if personal mode */
  url: string;
  /** Conversation title (auto-generated or user-set) */
  title: string;
  /** All messages in conversation */
  messages: Message[];
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Optional user settings */
  settings?: ChatSettings;
}

/**
 * User preferences for chat
 */
export interface ChatSettings {
  /** Temperature for AI generation (0-1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** System prompt override */
  systemPrompt?: string;
  /** Stream animation speed */
  streamSpeed?: StreamSpeed;
}

/**
 * Streaming result from AI API
 */
export interface ChatStreamingResult {
  /** ReadableStream for chunks */
  stream: ReadableStream<string>;
  /** Reader for abortion */
  reader: ReadableStreamDefaultReader<string>;
  /** Language model instance for cleanup */
  model: any;
}

/**
 * Message validation result
 */
export interface MessageValidation {
  /** Is message valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Sanitized content if valid */
  sanitizedContent?: string;
}

/**
 * Conversation statistics
 */
export interface ConversationStats {
  /** Total message count */
  messageCount: number;
  /** User message count */
  userMessageCount: number;
  /** Assistant message count */
  assistantMessageCount: number;
  /** Total tokens used */
  totalTokens: number;
  /** Average response time (ms) */
  avgResponseTime: number;
  /** Conversation duration (ms) */
  duration: number;
}

/**
 * Service Layer Interfaces
 */

/**
 * Chat Service API
 */
export interface IChatService {
  /**
   * Generate AI response with streaming
   */
  generateResponseStreaming(
    messages: Message[],
    mode: ChatMode,
    pageContent?: string
  ): Promise<ChatStreamingResult>;

  /**
   * Stop active generation
   */
  stopGeneration(
    reader: ReadableStreamDefaultReader<string> | null,
    model: any
  ): Promise<void>;

  /**
   * Build context from conversation history
   */
  buildContext(messages: Message[], pageContent?: string): string;

  /**
   * Validate message before sending
   */
  validateMessage(content: string): MessageValidation;

  /**
   * Estimate token count
   */
  estimateTokens(text: string): number;
}

/**
 * Conversation Service API
 */
export interface IConversationService {
  /**
   * Generate conversation title from messages
   */
  generateTitle(messages: Message[]): string;

  /**
   * Calculate conversation statistics
   */
  getConversationStats(conversation: Conversation): ConversationStats;

  /**
   * Prune old messages to fit context window
   */
  pruneMessages(messages: Message[], maxTokens: number): Message[];

  /**
   * Format message content for display
   */
  formatMessageContent(content: string): string;

  /**
   * Export conversation as markdown
   */
  exportConversation(conversation: Conversation): string;
}

/**
 * Hook Return Types
 */

/**
 * useChatSession hook return type
 */
export interface UseChatSessionReturn {
  /** Current conversation */
  conversation: Conversation | null;
  /** Send a message */
  sendMessage: (content: string) => Promise<void>;
  /** Stop active generation */
  stopGeneration: () => void;
  /** Regenerate last assistant response */
  regenerateLastResponse: () => Promise<void>;
  /** Clear entire conversation */
  clearConversation: () => void;
  /** Is currently streaming */
  isStreaming: boolean;
  /** Is loading (preparing) */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Current streaming message (partial) */
  streamingMessage: Message | null;
}

/**
 * useMessageStreaming hook return type
 */
export interface UseMessageStreamingReturn {
  /** Animated display text */
  displayText: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Is animation complete */
  isComplete: boolean;
}

/**
 * useScrollToBottom hook return type
 */
export interface UseScrollToBottomReturn {
  /** Ref to attach to scrollable container */
  scrollRef: React.RefObject<HTMLDivElement>;
  /** Scroll to bottom programmatically */
  scrollToBottom: () => void;
  /** Is user at bottom of scroll */
  isAtBottom: boolean;
}

/**
 * Component Props Types
 */

/**
 * ChatMessage component props
 */
export interface ChatMessageProps {
  /** Message to display */
  message: Message;
  /** Is this message currently streaming */
  isStreaming?: boolean;
  /** Streaming text if message is streaming */
  streamingText?: string;
  /** Show actions menu */
  showActions?: boolean;
  /** On copy message */
  onCopy?: (content: string) => void;
  /** On regenerate message */
  onRegenerate?: () => void;
}

/**
 * ChatInput component props
 */
export interface ChatInputProps {
  /** On send message (with content) */
  onSend: (content: string) => void;
  /** On stop generation */
  onStop: () => void;
  /** Is currently generating */
  isGenerating?: boolean;
  /** Is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * ChatHeader component props
 */
export interface ChatHeaderProps {
  /** Current mode */
  mode: ChatMode;
  /** On mode change */
  onModeChange: (mode: ChatMode) => void;
  /** Current page info (if page-context mode) */
  pageInfo?: {
    title: string;
    url: string;
  };
  /** Has messages */
  hasMessages: boolean;
  /** On clear conversation */
  onClear: () => void;
}

/**
 * EmptyState component props
 */
export interface EmptyStateProps {
  /** Current mode */
  mode: ChatMode;
  /** On suggestion click */
  onSuggestionClick: (suggestion: string) => void;
}

/**
 * MessageActions component props
 */
export interface MessageActionsProps {
  /** Message to act on */
  message: Message;
  /** On copy */
  onCopy: () => void;
  /** On regenerate */
  onRegenerate?: () => void;
  /** Show regenerate button */
  showRegenerate?: boolean;
}
