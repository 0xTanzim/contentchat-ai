/**
 * useRewriter Hook
 * Hook for AI text rewriting with tone/length adjustments
 */

import { createLogger } from '@/lib/logger';
import { rewriterService } from '@/lib/services/rewriterService';
import type { RewriteRequest, UseRewriterReturn } from '@/types/writing.types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('useRewriter');

/**
 * Hook for AI rewriting
 * @returns Rewriting API, state, and results
 */
export function useRewriter(): UseRewriterReturn {
  // State
  const [isRewriting, setIsRewriting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear all state
   */
  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setIsRewriting(false);
  }, []);

  /**
   * Get preset label for display
   */
  const getPresetLabel = (preset: RewriteRequest['preset']): string => {
    const labels: Record<RewriteRequest['preset'], string> = {
      formal: 'More Formal',
      casual: 'More Casual',
      shorter: 'Shorter',
      longer: 'Longer',
      custom: 'Custom',
    };
    return labels[preset];
  };

  /**
   * Rewrite text
   */
  const rewrite = useCallback(
    async (request: RewriteRequest) => {
      const { text, preset, customOptions, context } = request;

      if (!text || text.trim().length === 0) {
        setError('No text to rewrite');
        toast.error('No text to rewrite');
        return;
      }

      // Prevent concurrent rewriting
      if (isRewriting) {
        toast.info('Already rewriting...');
        return;
      }

      try {
        setIsRewriting(true);
        setError(null);
        setResult(null);

        logger.info('📝 Starting rewriting', {
          preset,
          length: text.length,
        });

        // Check availability first
        const availability = await rewriterService.checkAvailability();

        if (availability === 'no') {
          throw new Error(
            'Rewriter not available. Please use Chrome 137+ with origin trial token.'
          );
        }

        if (availability === 'after-download') {
          toast.info('Downloading rewriter model...', {
            description: 'This may take a moment',
          });
        }

        // Rewrite text
        let rewrittenText: string;

        if (preset === 'custom' && customOptions) {
          // Use custom options
          rewrittenText = await rewriterService.rewriteCustom(
            text,
            {
              tone: customOptions.tone || 'as-is',
              length: customOptions.length || 'as-is',
              format: customOptions.format || 'plain-text',
            },
            context
          );
        } else {
          // Use preset
          rewrittenText = await rewriterService.rewrite(text, preset, context);
        }

        setResult(rewrittenText);

        // Show success message
        const presetLabel = getPresetLabel(preset);
        toast.success(`Rewritten (${presetLabel})`, {
          description: 'Review and apply changes',
        });

        logger.info('✅ Rewriting complete', {
          preset,
          originalLength: text.length,
          rewrittenLength: rewrittenText.length,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Rewriting failed';
        logger.error('❌ Rewriting failed', { error: err });
        setError(errorMessage);
        toast.error('Rewriting failed', {
          description: errorMessage,
        });
      } finally {
        setIsRewriting(false);
      }
    },
    [isRewriting]
  );

  return {
    rewrite,
    isRewriting,
    result,
    error,
    clear,
  };
}
