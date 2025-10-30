/**
 * Summary Service
 * Pure business logic for AI summary generation
 * No React dependencies - testable and reusable
 */

import { summarizeLargeContent, summarizeStreaming } from '@/lib/chrome-ai';
import { createLogger } from '@/lib/logger';
import { generateSummaryStats } from '@/lib/summary-utils';
import type {
  ErrorType,
  ISummaryService,
  StreamingResult,
  SummaryOptions,
} from '@/types/summary.types';

const logger = createLogger('SummaryService');

/**
 * Detail level instructions mapping
 */
const DETAIL_INSTRUCTIONS: Record<string, string> = {
  brief: 'Provide 3-5 concise key points. Be brief and to the point.',
  standard: 'Provide 5-8 clear key points with adequate detail.',
  detailed: 'Provide 8-12 detailed key points with explanations and context.',
  comprehensive:
    'Provide a comprehensive analysis with 12 or more points. Include all important details, explanations, and relevant context.',
};

/**
 * Content validation constants
 * Note: NO hard limits! Chrome recommends "summary of summaries" for large content
 * Reference: https://developer.chrome.com/docs/ai/scale-summarization
 */
const MIN_CONTENT_LENGTH = 100; // characters
const MIN_WORD_COUNT = 20; // words

/**
 * Threshold for using recursive "summary of summaries" approach
 * If content > LARGE_CONTENT_THRESHOLD, use recursive chunking instead of simple truncation
 * Chrome successfully tested 110,030 characters (IRC RFC) with this technique
 */
const LARGE_CONTENT_THRESHOLD = 10000; // ~2500 words, beyond this use recursive approach

/**
 * Summary Service Implementation
 */
class SummaryService implements ISummaryService {
  /**
   * Validate content before generation
   */
  validateContent(content: string): {
    valid: boolean;
    error?: string;
    errorType?: ErrorType;
  } {
    // Check minimum content length
    const trimmedContent = content.trim();
    if (trimmedContent.length < MIN_CONTENT_LENGTH) {
      return {
        valid: false,
        error: `Content is too short to summarize (minimum ${MIN_CONTENT_LENGTH} characters). Found ${trimmedContent.length} characters.`,
        errorType: 'CONTENT_TOO_SHORT',
      };
    }

    // Check word count
    const wordCount = trimmedContent.split(/\s+/).length;
    if (wordCount < MIN_WORD_COUNT) {
      return {
        valid: false,
        error: `Page contains insufficient text. Found only ${wordCount} words. Need at least ${MIN_WORD_COUNT} words.`,
        errorType: 'INSUFFICIENT_TEXT',
      };
    }

    return { valid: true };
  }

  /**
   * Truncate long content intelligently (DEPRECATED)
   * Only used for small content that doesn't need recursive summarization
   * For large content, use generateSummaryLarge() instead
   */
  truncateContent(
    content: string,
    maxLength: number = 10000
  ): { content: string; wasTruncated: boolean } {
    // For backward compatibility only - prefer recursive approach for large content
    if (content.length <= maxLength) {
      return { content, wasTruncated: false };
    }

    let truncated = content.substring(0, maxLength);
    const wasTruncated = true;

    // Try to cut at paragraph boundary
    const lastParagraph = truncated.lastIndexOf('\n\n');

    if (lastParagraph > truncated.length * 0.8) {
      // If we found a paragraph break in the last 20%, use it
      truncated = truncated.substring(0, lastParagraph);
    } else {
      // Otherwise, try to cut at sentence boundary
      const lastSentence = Math.max(
        truncated.lastIndexOf('. '),
        truncated.lastIndexOf('! '),
        truncated.lastIndexOf('? ')
      );

      if (lastSentence > truncated.length * 0.8) {
        truncated = truncated.substring(0, lastSentence + 1);
      }
    }

    return {
      content: truncated,
      wasTruncated,
    };
  }

  /**
   * Build AI context from options
   */
  buildContext(options: SummaryOptions): string {
    const detailLevel = options.detailLevel || 'standard';
    const detailContext =
      DETAIL_INSTRUCTIONS[detailLevel] || DETAIL_INSTRUCTIONS.standard;

    // Combine user context with detail instructions
    return options.context
      ? `${detailContext} ${options.context}`
      : detailContext;
  }

  /**
   * Generate summary with streaming
   * For large content (>10k chars), automatically uses recursive "summary of summaries"
   */
  async generateSummaryStreaming(
    content: string,
    options: SummaryOptions,
    context?: string
  ): Promise<StreamingResult> {
    // Validate content
    const validation = this.validateContent(content);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // For large content, use recursive approach instead of truncation
    // Chrome's official docs recommend "summary of summaries" for large text
    // Reference: https://developer.chrome.com/docs/ai/scale-summarization
    if (content.length > LARGE_CONTENT_THRESHOLD) {
      logger.info(
        `Large content detected (${content.length} chars), using recursive summarization`
      );

      // Convert to non-streaming by using recursive approach
      // TODO: Implement streaming for recursive summarization
      const aiContext = context || this.buildContext(options);

      try {
        const summary = await summarizeLargeContent(
          content,
          options,
          aiContext,
          (current, total, stage) => {
            logger.debug(
              `Recursive summarization progress: ${current}/${total} - ${stage}`
            );
          }
        );

        // Create a mock streaming result that immediately returns the full summary
        const mockStream: ReadableStream<string> = new ReadableStream({
          start(controller) {
            controller.enqueue(summary);
            controller.close();
          },
        });

        const reader = mockStream.getReader();

        async function* generateChunks(): AsyncGenerator<
          string,
          void,
          unknown
        > {
          const { value } = await reader.read();
          if (value) yield value;
        }

        // Return mock streaming result - summarizer will be destroyed by the caller
        return {
          stream: generateChunks(),
          reader,
          summarizer: null as any, // Will be cleaned up properly
        };
      } catch (error) {
        logger.error('Recursive summarization failed:', error);
        throw error;
      }
    }

    // For small content, use simple truncation and streaming
    const { content: processedContent, wasTruncated } =
      this.truncateContent(content);

    if (wasTruncated) {
      logger.warn(
        `Content truncated from ${content.length} to 10000 characters`
      );
    }

    // Build context
    const aiContext = context || this.buildContext(options);

    logger.debug('Starting generation', {
      contentLength: processedContent.length,
      options,
      wasTruncated,
    });

    // Call Chrome AI API
    try {
      const result = await summarizeStreaming(
        processedContent,
        options,
        aiContext
      );

      logger.debug('Stream created successfully');

      return result;
    } catch (error) {
      logger.error('Generation failed:', error);

      // Transform Chrome AI errors to user-friendly messages
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Input too large - this is the most common error
      if (
        errorMessage.includes('too large') ||
        errorMessage.includes('QuotaExceededError') ||
        errorMessage.includes('input is too large')
      ) {
        throw new Error(
          `Content exceeds Chrome AI limits (max ~3,500 words).\n\n✨ Solutions:\n• Reload the page and try again\n• Select a specific section of text instead\n• Try a shorter article\n• Use "Ask AI About This" on selected text`
        );
      }

      if (
        errorMessage.includes('not available') ||
        errorMessage.includes('not supported')
      ) {
        throw new Error(
          'AI features not available. Please update Chrome to version 140+ and enable AI features in chrome://flags'
        );
      }

      if (
        errorMessage.includes('quota') ||
        errorMessage.includes('rate limit')
      ) {
        throw new Error(
          'API quota exceeded. The AI model has a usage limit. Please wait 60 seconds and try again.'
        );
      }

      if (errorMessage.includes('download') || errorMessage.includes('model')) {
        throw new Error(
          'AI model is downloading. This may take 2-5 minutes on first use. Please wait...'
        );
      }

      if (
        errorMessage.includes('network') ||
        errorMessage.includes('timeout')
      ) {
        throw new Error(
          'Network error. Please check your connection and try again.'
        );
      }

      throw error;
    }
  }

  /**
   * Stop active generation
   */
  async stopGeneration(
    reader: ReadableStreamDefaultReader<string> | null,
    summarizer: any
  ): Promise<void> {
    logger.info('⏹️ Summary Service: Stopping generation');

    // Cancel the reader
    if (reader) {
      try {
        await reader.cancel('User stopped generation');
        logger.info('✅ Reader canceled successfully');
      } catch (error) {
        logger.error('❌ Failed to cancel reader:', {
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                }
              : error,
        });
      }
    }

    // Destroy the summarizer
    if (summarizer) {
      try {
        summarizer.destroy();
        logger.info('✅ Summarizer destroyed successfully');
      } catch (error) {
        logger.error('❌ Failed to destroy summarizer:', {
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                }
              : error,
        });
      }
    }

    logger.info('✅ Stop generation complete - ready for new summary');
  }

  /**
   * Generate summary statistics
   */
  generateStats(originalContent: string, summaryContent: string) {
    return generateSummaryStats(originalContent, summaryContent);
  }
}

// Export singleton instance
export const summaryService = new SummaryService();

// Export class for testing
export { SummaryService };
