import {
  checkRewriterAvailability,
  createRewriter,
} from '@/lib/chrome-ai/rewriter';
import { createLogger } from '@/lib/logger';
import type { Rewriter, RewriterOptions } from '@/types/chrome-ai';
import type { RewritePreset } from '@/types/writing.types';

const logger = createLogger('RewriterService');

/**
 * Map presets to rewriter options
 */
const PRESET_OPTIONS: Record<RewritePreset, RewriterOptions> = {
  formal: {
    tone: 'more-formal',
    format: 'plain-text',
    length: 'as-is',
  },
  casual: {
    tone: 'more-casual',
    format: 'plain-text',
    length: 'as-is',
  },
  shorter: {
    tone: 'as-is',
    format: 'plain-text',
    length: 'shorter',
  },
  longer: {
    tone: 'as-is',
    format: 'plain-text',
    length: 'longer',
  },
  custom: {
    tone: 'as-is',
    format: 'plain-text',
    length: 'as-is',
  },
};

/**
 * Service interface
 */
export interface IRewriterService {
  rewrite(
    text: string,
    preset: RewritePreset,
    context?: string
  ): Promise<string>;
  rewriteCustom(
    text: string,
    options: RewriterOptions,
    context?: string
  ): Promise<string>;
  checkAvailability(): Promise<'readily' | 'after-download' | 'no'>;
  destroy(preset?: RewritePreset): void;
}

/**
 * Rewriter Service
 * Manages multiple rewriter instances (one per preset)
 */
class RewriterService implements IRewriterService {
  private rewriters = new Map<string, Rewriter>();
  private initializing = new Set<string>();

  /**
   * Get cache key
   */
  private getCacheKey(options: RewriterOptions): string {
    return `${options.tone}-${options.format}-${options.length}`;
  }

  /**
   * Initialize rewriter for preset (with caching)
   */
  private async initializeForPreset(preset: RewritePreset): Promise<Rewriter> {
    const options = PRESET_OPTIONS[preset];
    const key = this.getCacheKey(options);

    // Return cached if exists
    if (this.rewriters.has(key)) {
      return this.rewriters.get(key)!;
    }

    // Wait if already initializing
    if (this.initializing.has(key)) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.initializeForPreset(preset);
    }

    this.initializing.add(key);
    try {
      logger.debug(`🔧 Initializing rewriter for preset: ${preset}`);
      const rewriter = await createRewriter(options);
      if (!rewriter) {
        throw new Error('Failed to create rewriter');
      }
      this.rewriters.set(key, rewriter);
      logger.info(`✅ Rewriter initialized for: ${preset}`);
      return rewriter;
    } catch (error) {
      logger.error(`❌ Failed to initialize rewriter for ${preset}:`, error);
      throw error;
    } finally {
      this.initializing.delete(key);
    }
  }

  /**
   * Rewrite text with preset
   */
  async rewrite(
    text: string,
    preset: RewritePreset,
    context?: string
  ): Promise<string> {
    const rewriter = await this.initializeForPreset(preset);

    try {
      logger.debug(`📝 Rewriting with preset: ${preset}`, {
        length: text.length,
      });
      const result = await rewriter.rewrite(text, { context });
      logger.info(`✅ Rewrite complete (${preset})`);
      return result;
    } catch (error) {
      logger.error(`❌ Rewrite failed (${preset}):`, error);
      throw error;
    }
  }

  /**
   * Rewrite with custom options
   */
  async rewriteCustom(
    text: string,
    options: RewriterOptions,
    context?: string
  ): Promise<string> {
    const key = this.getCacheKey(options);

    // Check cache
    let rewriter = this.rewriters.get(key);

    // Create if not cached
    if (!rewriter) {
      logger.debug('🔧 Creating rewriter with custom options');
      const newRewriter = await createRewriter(options);
      if (!newRewriter) throw new Error('Failed to create rewriter');
      rewriter = newRewriter;
      this.rewriters.set(key, rewriter);
    }

    try {
      const result = await rewriter.rewrite(text, { context });
      logger.info('✅ Custom rewrite complete');
      return result;
    } catch (error) {
      logger.error('❌ Custom rewrite failed:', error);
      throw error;
    }
  }

  /**
   * Check availability
   */
  async checkAvailability(): Promise<'readily' | 'after-download' | 'no'> {
    return await checkRewriterAvailability();
  }

  /**
   * Cleanup
   */
  destroy(preset?: RewritePreset): void {
    if (preset) {
      const options = PRESET_OPTIONS[preset];
      const key = this.getCacheKey(options);
      const rewriter = this.rewriters.get(key);
      if (rewriter) {
        rewriter.destroy();
        this.rewriters.delete(key);
        logger.info(`🗑️ Rewriter destroyed: ${preset}`);
      }
    } else {
      // Destroy all
      this.rewriters.forEach((rewriter) => rewriter.destroy());
      this.rewriters.clear();
      logger.info('🗑️ All rewriters destroyed');
    }
  }
}

// Export singleton instance
export const rewriterService = new RewriterService();
