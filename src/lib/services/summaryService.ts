/**
 * Summary Service
 * Pure business logic for AI summary generation
 * No React dependencies - testable and reusable
 */

import { summarizeStreaming } from '@/lib/chrome-ai';
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
 */
const MIN_CONTENT_LENGTH = 100; // characters
const MIN_WORD_COUNT = 20; // words
const MAX_CONTENT_LENGTH = 50000; // characters

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
   * Truncate long content
   */
  truncateContent(
    content: string,
    maxLength: number = MAX_CONTENT_LENGTH
  ): { content: string; wasTruncated: boolean } {
    if (content.length <= maxLength) {
      return { content, wasTruncated: false };
    }

    return {
      content: content.substring(0, maxLength),
      wasTruncated: true,
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

    // Truncate if needed
    const { content: processedContent, wasTruncated } =
      this.truncateContent(content);

    if (wasTruncated) {
      console.warn(
        `⚠️ Content truncated from ${content.length} to ${MAX_CONTENT_LENGTH} characters`
      );
    }

    // Build context
    const aiContext = context || this.buildContext(options);

    console.log('🚀 Summary Service: Starting generation', {
      contentLength: processedContent.length,
      options,
      context: aiContext,
      wasTruncated,
    });

    // Call Chrome AI API
    try {
      const result = await summarizeStreaming(
        processedContent,
        options,
        aiContext
      );

      console.log('✅ Summary Service: Stream created successfully');

      return result;
    } catch (error) {
      console.error('❌ Summary Service: Generation failed', error);

      // Transform Chrome AI errors to user-friendly messages
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

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
