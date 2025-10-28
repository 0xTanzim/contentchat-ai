/**
 * Summary Types
 * Centralized type definitions for the summary feature
 * Ensures type safety across services, hooks, and components
 */

import type {
  Summary,
  SummaryOptions,
  SummaryStats,
} from '@/sidepanel/stores/summaryStore';

// Re-export store types for convenience
export type {
  DetailLevel,
  SummaryFormat,
  SummaryLength,
  SummaryType,
} from '@/sidepanel/stores/summaryStore';
export type { Summary, SummaryOptions, SummaryStats };

/**
 * Page content structure from Chrome extension
 */
export interface PageContent {
  title: string;
  url: string;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Streaming result from AI API
 */
export interface StreamingResult {
  stream: AsyncGenerator<string, void, unknown>;
  reader: ReadableStreamDefaultReader<string>;
  summarizer: any; // Chrome AI Summarizer type
}

/**
 * Summary generation result
 */
export interface SummaryResult {
  content: string;
  stats: SummaryStats;
  error?: never;
}

/**
 * Summary generation error
 */
export interface SummaryError {
  error: string;
  type: ErrorType;
  content?: never;
  stats?: never;
}

/**
 * Error types for categorized handling
 */
export type ErrorType =
  | 'CONTENT_TOO_SHORT'
  | 'INSUFFICIENT_TEXT'
  | 'CONCURRENT_GENERATION'
  | 'AI_NOT_AVAILABLE'
  | 'RATE_LIMIT'
  | 'MODEL_DOWNLOADING'
  | 'NETWORK_ERROR'
  | 'EMPTY_RESULT'
  | 'USER_STOPPED'
  | 'GENERIC_ERROR';

/**
 * Unified result type (success or error)
 */
export type GenerationResult = SummaryResult | SummaryError;

/**
 * Chrome runtime message types
 */
export interface ChromeMessage {
  type: 'CONTENT_SCRIPT_READY' | 'CONTENT_UPDATED' | string;
  url?: string;
  data?: unknown;
}

/**
 * Service layer contracts
 */

/**
 * Summary Service API
 */
export interface ISummaryService {
  /**
   * Generate summary with streaming
   * @param content - Text content to summarize
   * @param options - Summary configuration
   * @param context - Additional context for AI
   * @returns Streaming result with reader and summarizer for abortion
   */
  generateSummaryStreaming(
    content: string,
    options: SummaryOptions,
    context?: string
  ): Promise<StreamingResult>;

  /**
   * Stop active generation
   * @param reader - Active stream reader
   * @param summarizer - Active summarizer instance
   */
  stopGeneration(
    reader: ReadableStreamDefaultReader<string> | null,
    summarizer: any
  ): Promise<void>;

  /**
   * Build AI context from detail level
   * @param options - Summary options with detail level
   * @returns Context string for AI
   */
  buildContext(options: SummaryOptions): string;

  /**
   * Validate content before generation
   * @param content - Text to validate
   * @returns Validation result
   */
  validateContent(content: string): {
    valid: boolean;
    error?: string;
    errorType?: ErrorType;
  };

  /**
   * Truncate long content
   * @param content - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated text and flag
   */
  truncateContent(
    content: string,
    maxLength?: number
  ): { content: string; wasTruncated: boolean };
}

/**
 * Chrome Extension Service API
 */
export interface IChromeExtensionService {
  /**
   * Get current page content
   * @returns Page content or null if unavailable
   */
  getCurrentPageContent(): Promise<PageContent>;

  /**
   * Listen to tab updates
   * @param callback - Called when tab updates
   * @returns Cleanup function
   */
  listenToTabUpdates(
    callback: Parameters<typeof chrome.tabs.onUpdated.addListener>[0]
  ): () => void;

  /**
   * Listen to tab activation
   * @param callback - Called when tab activated
   * @returns Cleanup function
   */
  listenToTabActivation(
    callback: (activeInfo: { tabId: number; windowId: number }) => void
  ): () => void;

  /**
   * Listen to runtime messages
   * @param callback - Called on message
   * @returns Cleanup function
   */
  listenToMessages(
    callback: (
      message: ChromeMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => void
  ): () => void;

  /**
   * Open URL in new tab
   * @param url - URL to open
   */
  openTab(url: string): Promise<void>;
}

/**
 * History Service API
 */
export interface IHistoryService {
  /**
   * Save summary to history
   * @param url - Page URL
   * @param summary - Summary to save
   */
  saveHistory(url: string, summary: Summary): void;

  /**
   * Get all history
   * @returns All summaries sorted by timestamp
   */
  getAllHistory(): Summary[];

  /**
   * Get recent history
   * @param limit - Maximum number of items
   * @returns Recent summaries
   */
  getRecentHistory(limit?: number): Summary[];

  /**
   * Cleanup old history
   * @param maxAgeDays - Maximum age in days
   */
  cleanupOldHistory(maxAgeDays?: number): void;

  /**
   * Delete specific history item
   * @param url - Page URL
   * @param timestamp - Summary timestamp
   */
  deleteHistoryItem(url: string, timestamp: number): void;
}

/**
 * Hook return types
 */

/**
 * useSummarizer hook return type
 */
export interface UseSummarizerReturn {
  /** Generate summary for current page */
  generate: () => Promise<void>;
  /** Stop active generation */
  stop: () => void;
  /** Is currently streaming */
  isStreaming: boolean;
  /** Is loading (preparing) */
  isLoading: boolean;
  /** Current streaming text */
  streamingText: string;
  /** Final result after completion */
  finalResult: string;
  /** Error message if failed */
  error: string | null;
  /** Generation statistics */
  stats: SummaryStats | null;
}

/**
 * useTypewriter hook return type
 */
export interface UseTypewriterReturn {
  /** Animated display text */
  displayText: string;
}

/**
 * useChromeExtension hook return type
 */
export interface UseChromeExtensionReturn {
  /** Current page content */
  currentPage: PageContent | null;
  /** Is loading page content */
  isLoading: boolean;
  /** Error loading page */
  error: string | null;
  /** Reload current page content */
  reload: () => Promise<void>;
}
