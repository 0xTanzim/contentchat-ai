/**
 * useSummarizer Hook
 * Main hook for AI summary generation with streaming
 * Handles all generation logic, state management, and abortion
 */

import { createLogger } from '@/lib/logger';
import { historyService } from '@/lib/services/historyService';
import { summaryService } from '@/lib/services/summaryService';
import type {
  PageContent,
  SummaryOptions,
  SummaryStats,
  UseSummarizerReturn,
} from '@/types/summary.types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Create logger for this hook
const logger = createLogger('useSummarizer');

/**
 * Hook for AI summary generation
 * @param currentPage - Current page content
 * @param options - Summary options
 * @returns Generation API, state, and results
 */
export function useSummarizer(
  currentPage: PageContent | null,
  options: SummaryOptions
): UseSummarizerReturn {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [finalResult, setFinalResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [shouldStop, setShouldStop] = useState(false);

  // Refs for stream abortion
  const activeReaderRef = useRef<ReadableStreamDefaultReader<string> | null>(
    null
  );
  const activeSummarizerRef = useRef<any | null>(null);
  const shouldStopRef = useRef(false); // ✅ Ref for shouldStop to avoid recreating generate

  /**
   * Clear all state
   */
  const clearState = useCallback(() => {
    setStreamingText('');
    setFinalResult('');
    setError(null);
    setStats(null);
    setIsStreaming(false);
    setIsLoading(false);
    setShouldStop(false);
  }, []);

  /**
   * Clear state when page URL changes
   */
  useEffect(() => {
    clearState();
  }, [currentPage?.url, clearState]);

  /**
   * Stop generation
   */
  const stop = useCallback(async () => {
    if (!isStreaming) return;

    logger.info('⏹️ Stopping generation');
    shouldStopRef.current = true; // ✅ Use ref
    setShouldStop(true);

    try {
      await summaryService.stopGeneration(
        activeReaderRef.current,
        activeSummarizerRef.current
      );

      activeReaderRef.current = null;
      activeSummarizerRef.current = null;

      setIsStreaming(false);
      setIsLoading(false);

      toast.info('Generation stopped', {
        description: 'LLM generation aborted successfully',
      });
    } catch (err) {
      logger.error('❌ Failed to stop', { error: err });
    }
  }, [isStreaming]);

  /**
   * Generate summary
   */
  const generate = useCallback(async () => {
    if (!currentPage) {
      setError('No page content available');
      toast.error('No page content available');
      return;
    }

    // Prevent concurrent generation
    if (isStreaming || isLoading) {
      toast.info('Already generating summary...');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStreamingText('');
      setFinalResult('');
      setIsStreaming(true);
      shouldStopRef.current = false; // ✅ Reset ref
      setShouldStop(false);

      console.log('🚀 useSummarizer: Starting generation');

      // Validate content first
      const validation = summaryService.validateContent(currentPage.content);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Check if truncation needed
      const { content, wasTruncated } = summaryService.truncateContent(
        currentPage.content
      );
      if (wasTruncated) {
        toast.warning('Long content detected', {
          description: 'Truncated to 50,000 characters for processing.',
          duration: 4000,
        });
      }

      // Build context
      const context = summaryService.buildContext(options);

      // Get streaming result
      const { stream, reader, summarizer } =
        await summaryService.generateSummaryStreaming(
          content,
          options,
          context
        );

      // Store refs for abortion
      activeReaderRef.current = reader;
      activeSummarizerRef.current = summarizer;

      logger.debug('📡 Stream created, reading chunks');

      // Small delay to ensure UI renders Stop button
      await new Promise((resolve) => setTimeout(resolve, 100));

      let fullText = '';
      let chunkCount = 0;

      // Read stream
      for await (const chunk of stream) {
        // Check if user stopped
        if (shouldStopRef.current) {
          // ✅ Use ref for immediate check
          console.log('⏹️ useSummarizer: Breaking loop - user stopped');
          break;
        }

        chunkCount++;

        // Accumulate text
        if (chunkCount === 1) {
          fullText = chunk;
        } else {
          // Handle both delta and complete modes
          fullText = chunk.startsWith(fullText) ? chunk : fullText + chunk;
        }

        setStreamingText(fullText);

        // Small delay to make Stop button visible
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      logger.debug('🏁 Streaming complete', {
        chunks: chunkCount,
        textLength: fullText.length,
      });

      // Validate result
      if (!fullText || fullText.trim().length === 0) {
        throw new Error(
          `No summary generated. Received ${chunkCount} chunks but text is empty. Please try again.`
        );
      }

      // Generate stats
      const summaryStats = summaryService.generateStats(
        currentPage.content,
        fullText
      );
      setStats(summaryStats);

      // Save to history
      historyService.saveHistory(currentPage.url, {
        content: fullText,
        options,
        stats: summaryStats,
        timestamp: Date.now(),
        pageTitle: currentPage.title,
        pageUrl: currentPage.url,
      });

      setFinalResult(fullText);
      setIsStreaming(false);

      toast.success('Summary generated!', {
        description: `${summaryStats.summaryWordCount} words · ${summaryStats.compressionRatio}% compressed`,
      });
    } catch (err) {
      logger.error('❌ Generation failed', { error: err });
      setIsStreaming(false);

      // Don't show error if user stopped
      if (shouldStop) {
        logger.info('Generation stopped by user, not an error');
        return;
      }

      const errorMsg =
        err instanceof Error ? err.message : 'Failed to generate summary';
      setError(errorMsg);

      // Handle specific error types
      if (
        errorMsg.includes('not available') ||
        errorMsg.includes('not supported')
      ) {
        toast.error('AI not available', {
          description: 'Update Chrome to version 140+ and enable AI flags',
          duration: 5000,
        });
      } else if (
        errorMsg.includes('quota') ||
        errorMsg.includes('rate limit')
      ) {
        toast.error('Rate limit exceeded', {
          description: 'Please wait 60 seconds before trying again',
          duration: 6000,
          action: {
            label: 'Retry',
            onClick: () => {
              setTimeout(() => generate(), 60000);
            },
          },
        });
      } else if (errorMsg.includes('download') || errorMsg.includes('model')) {
        toast.info('Downloading AI model...', {
          description: 'First-time setup. Please wait 2-5 minutes.',
          duration: 10000,
        });
      } else if (
        errorMsg.includes('network') ||
        errorMsg.includes('connection')
      ) {
        toast.error('Network error', {
          description: 'Check your connection and retry',
          action: {
            label: 'Retry',
            onClick: generate,
          },
        });
      } else {
        toast.error('Generation failed', {
          description: errorMsg,
          action: {
            label: 'Retry',
            onClick: generate,
          },
        });
      }
    } finally {
      setIsLoading(false);

      // Clean up refs
      if (activeReaderRef.current) {
        try {
          activeReaderRef.current.releaseLock();
        } catch (err) {
          logger.warn('Reader already released', { error: err });
        }
        activeReaderRef.current = null;
      }

      if (activeSummarizerRef.current) {
        try {
          activeSummarizerRef.current.destroy();
        } catch (err) {
          logger.warn('Summarizer already destroyed', { error: err });
        }
        activeSummarizerRef.current = null;
      }
    }
  }, [currentPage, options, isStreaming, isLoading]); // ✅ shouldStop removed!

  return {
    generate,
    stop,
    isStreaming,
    isLoading,
    streamingText,
    finalResult,
    error,
    stats,
  };
}
