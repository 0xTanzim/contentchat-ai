/**
 * useProofreader Hook
 * Hook for AI proofreading with error detection
 */

import { createLogger } from '@/lib/logger';
import { proofreaderService } from '@/lib/services/proofreaderService';
import type { ProofreadResult } from '@/types/chrome-ai';
import type { UseProofreaderReturn } from '@/types/writing.types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('useProofreader');

/**
 * Hook for AI proofreading
 * @returns Proofreading API, state, and results
 */
export function useProofreader(): UseProofreaderReturn {
  // State
  const [isProofreading, setIsProofreading] = useState(false);
  const [result, setResult] = useState<ProofreadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear all state
   */
  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setIsProofreading(false);
  }, []);

  /**
   * Proofread text
   */
  const proofread = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) {
        setError('No text to proofread');
        toast.error('No text to proofread');
        return;
      }

      // Prevent concurrent proofreading
      if (isProofreading) {
        toast.info('Already proofreading...');
        return;
      }

      try {
        setIsProofreading(true);
        setError(null);
        setResult(null);

        logger.info('📝 Starting proofreading', { length: text.length });

        // Check availability first
        const availability = await proofreaderService.checkAvailability();

        if (availability === 'no') {
          throw new Error(
            'Proofreader not available. Please use Chrome 141+ with origin trial token.'
          );
        }

        if (availability === 'after-download') {
          toast.info('Downloading proofreader model...', {
            description: 'This may take a moment',
          });
        }

        // Proofread text
        const proofreadResult = await proofreaderService.proofread(text);

        setResult(proofreadResult);

        // Show success message
        const correctionCount = proofreadResult.corrections.length;
        if (correctionCount > 0) {
          toast.success(
            `Found ${correctionCount} correction${
              correctionCount > 1 ? 's' : ''
            }`,
            {
              description: 'Review and apply corrections',
            }
          );
        } else {
          toast.success('No corrections needed', {
            description: 'Your text looks great!',
          });
        }

        logger.info('✅ Proofreading complete', {
          corrections: correctionCount,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Proofreading failed';
        logger.error('❌ Proofreading failed', { error: err });
        setError(errorMessage);
        toast.error('Proofreading failed', {
          description: errorMessage,
        });
      } finally {
        setIsProofreading(false);
      }
    },
    [isProofreading]
  );

  return {
    proofread,
    isProofreading,
    result,
    error,
    clear,
  };
}
