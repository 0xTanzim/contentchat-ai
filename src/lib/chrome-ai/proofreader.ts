import { createLogger } from '@/lib/logger';
import type {
  Proofreader,
  ProofreaderOptions,
  ProofreadResult,
} from '@/types/chrome-ai';

const logger = createLogger('ChromeAI:Proofreader');

/**
 * Check Proofreader API availability
 */
export async function checkProofreaderAvailability(): Promise<
  'readily' | 'after-download' | 'no'
> {
  try {
    if (!('Proofreader' in self)) {
      logger.warn('❌ Proofreader API not available');
      return 'no';
    }

    const availability = await (self as any).Proofreader.availability();

    if (availability === 'available' || availability === 'readily') {
      return 'readily';
    }
    if (availability === 'after-download') {
      return 'after-download';
    }

    return 'no';
  } catch (error) {
    logger.error('Failed to check Proofreader availability:', error);
    return 'no';
  }
}

/**
 * Create a Proofreader instance
 * Reference: https://developer.chrome.com/docs/ai/proofreader-api
 */
export async function createProofreader(
  options?: ProofreaderOptions
): Promise<Proofreader | null> {
  try {
    // Feature detection
    if (!('Proofreader' in self)) {
      throw new Error(
        'Proofreader API not available. Please use Chrome 141+ with origin trial token.'
      );
    }

    // Check availability
    const availability = await (self as any).Proofreader.availability();
    logger.debug('Proofreader availability:', availability);

    if (availability === 'unavailable' || availability === 'no') {
      throw new Error('Proofreader not supported on this device');
    }

    // Require user activation if model needs download
    if (availability === 'after-download') {
      if (!navigator.userActivation?.isActive) {
        throw new Error(
          'User activation required to download proofreader model'
        );
      }
    }

    // Create proofreader with download progress monitor
    const proofreader = await (self as any).Proofreader.create({
      monitor(m: any) {
        m.addEventListener('downloadprogress', (e: any) => {
          logger.info(
            `Proofreader model: Downloaded ${(e.loaded * 100).toFixed(1)}%`
          );
        });
      },
      ...options,
    });

    logger.info('✅ Proofreader created successfully');
    return proofreader;
  } catch (error) {
    logger.error('Failed to create proofreader:', error);
    throw error;
  }
}

/**
 * Proofread text with error handling (batch mode)
 */
export async function proofreadText(
  text: string,
  options?: ProofreaderOptions
): Promise<ProofreadResult> {
  const proofreader = await createProofreader(options);

  if (!proofreader) {
    throw new Error('Failed to create proofreader');
  }

  try {
    const result = await proofreader.proofread(text);
    logger.debug('Proofread result:', {
      correctionsCount: result.corrections.length,
      hasChanges: result.corrected !== text,
    });
    return result;
  } finally {
    proofreader.destroy();
  }
}
