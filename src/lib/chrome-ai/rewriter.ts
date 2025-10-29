import { createLogger } from '@/lib/logger';
import type { Rewriter, RewriterOptions } from '@/types/chrome-ai';

const logger = createLogger('ChromeAI:Rewriter');

/**
 * Check Rewriter API availability
 */
export async function checkRewriterAvailability(): Promise<
  'readily' | 'after-download' | 'no'
> {
  try {
    if (!('Rewriter' in self)) {
      logger.warn('❌ Rewriter API not available');
      return 'no';
    }

    const availability = await (self as any).Rewriter.availability();

    if (availability === 'available' || availability === 'readily') {
      return 'readily';
    }
    if (availability === 'after-download') {
      return 'after-download';
    }

    return 'no';
  } catch (error) {
    logger.error('Failed to check Rewriter availability:', error);
    return 'no';
  }
}

/**
 * Create a Rewriter instance
 * Reference: https://developer.chrome.com/docs/ai/rewriter-api
 */
export async function createRewriter(
  options?: RewriterOptions
): Promise<Rewriter | null> {
  try {
    // Feature detection
    if (!('Rewriter' in self)) {
      throw new Error(
        'Rewriter API not available. Please use Chrome 137+ with origin trial token.'
      );
    }

    // Check availability
    const availability = await (self as any).Rewriter.availability();
    logger.debug('Rewriter availability:', availability);

    if (availability === 'unavailable' || availability === 'no') {
      throw new Error('Rewriter not supported on this device');
    }

    // Require user activation if model needs download
    if (availability === 'after-download') {
      if (!navigator.userActivation?.isActive) {
        throw new Error('User activation required to download rewriter model');
      }
    }

    // Create rewriter with download progress monitor
    const rewriter = await (self as any).Rewriter.create({
      tone: options?.tone || 'as-is',
      format: options?.format || 'plain-text',
      length: options?.length || 'as-is',
      monitor(m: any) {
        m.addEventListener('downloadprogress', (e: any) => {
          logger.info(
            `Rewriter model: Downloaded ${(e.loaded * 100).toFixed(1)}%`
          );
        });
      },
      ...options,
    });

    logger.info('✅ Rewriter created successfully');
    return rewriter;
  } catch (error) {
    logger.error('Failed to create rewriter:', error);
    throw error;
  }
}

/**
 * Rewrite text with error handling (batch mode)
 */
export async function rewriteText(
  text: string,
  options?: RewriterOptions & { context?: string }
): Promise<string> {
  const { context, ...rewriterOptions } = options || {};
  const rewriter = await createRewriter(rewriterOptions);

  if (!rewriter) {
    throw new Error('Failed to create rewriter');
  }

  try {
    const result = await rewriter.rewrite(text, { context });
    logger.debug('Rewrite result:', {
      originalLength: text.length,
      rewrittenLength: result.length,
    });
    return result;
  } finally {
    rewriter.destroy();
  }
}

/**
 * Rewrite text with streaming
 */
export async function* rewriteTextStreaming(
  text: string,
  options?: RewriterOptions & { context?: string }
): AsyncGenerator<string, void, undefined> {
  const { context, ...rewriterOptions } = options || {};
  const rewriter = await createRewriter(rewriterOptions);

  if (!rewriter) {
    throw new Error('Failed to create rewriter');
  }

  try {
    const stream = rewriter.rewriteStreaming(text, { context });
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    rewriter.destroy();
  }
}
