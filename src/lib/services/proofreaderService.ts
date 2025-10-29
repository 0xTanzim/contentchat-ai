import {
  checkProofreaderAvailability,
  createProofreader,
} from '@/lib/chrome-ai/proofreader';
import { createLogger } from '@/lib/logger';
import type { Proofreader, ProofreadResult } from '@/types/chrome-ai';

const logger = createLogger('ProofreaderService');

/**
 * Service interface
 */
export interface IProofreaderService {
  proofread(text: string): Promise<ProofreadResult>;
  checkAvailability(): Promise<'readily' | 'after-download' | 'no'>;
  destroy(): void;
}

/**
 * Proofreader Service
 * Manages proofreader instance with caching
 */
class ProofreaderService implements IProofreaderService {
  private proofreader: Proofreader | null = null;
  private isInitializing = false;

  /**
   * Initialize proofreader (with caching)
   */
  private async initialize(): Promise<void> {
    if (this.proofreader || this.isInitializing) return;

    this.isInitializing = true;
    try {
      logger.debug('🔧 Initializing proofreader...');
      this.proofreader = await createProofreader();
      logger.info('✅ Proofreader initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize proofreader:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Proofread text
   */
  async proofread(text: string): Promise<ProofreadResult> {
    if (!this.proofreader) {
      await this.initialize();
    }

    if (!this.proofreader) {
      throw new Error('Proofreader not available');
    }

    try {
      logger.debug('📝 Proofreading text:', { length: text.length });
      const result = await this.proofreader.proofread(text);
      logger.info('✅ Proofread complete:', {
        corrections: result.corrections.length,
      });
      return result;
    } catch (error) {
      logger.error('❌ Proofread failed:', error);
      throw error;
    }
  }

  /**
   * Check availability
   */
  async checkAvailability(): Promise<'readily' | 'after-download' | 'no'> {
    return await checkProofreaderAvailability();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.proofreader) {
      this.proofreader.destroy();
      this.proofreader = null;
      logger.info('🗑️ Proofreader destroyed');
    }
  }
}

// Export singleton instance
export const proofreaderService = new ProofreaderService();
