/**
 * Summary Database (IndexedDB)
 * Persistent storage for all summaries
 * Replaces localStorage for better performance and larger capacity
 * Auto-cleanup: 30 days retention
 */

import type { Summary, SummaryOptions } from '@/types/summary.types';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { createLogger } from '../logger';

const logger = createLogger('SummaryDB');

// Database configuration
const DB_NAME = 'contentchat-summaries-v2';
const DB_VERSION = 1;
const STORE_NAME = 'summaries';

// Retention period (30 days)
const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Database schema
 */
interface SummaryDB extends DBSchema {
  summaries: {
    key: string; // Composite: `${url}:${optionsHash}`
    value: Summary & {
      id: string;
      optionsHash: string;
    };
    indexes: {
      'by-url': string;
      'by-timestamp': number;
      'by-type': string;
    };
  };
}

/**
 * Generate unique hash for summary options
 */
function generateOptionsHash(options: SummaryOptions): string {
  return `${options.type}-${options.length}-${options.format}${
    options.context ? '-ctx' : ''
  }${options.outputLanguage ? `-${options.outputLanguage}` : ''}`;
}

/**
 * Summary Database Service
 */
class SummaryDatabase {
  private db: IDBPDatabase<SummaryDB> | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize database
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        logger.info('🗄️ Initializing summary database...');

        this.db = await openDB<SummaryDB>(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Create summaries store
            const store = db.createObjectStore(STORE_NAME, {
              keyPath: 'id',
            });

            // Create indexes for efficient queries
            store.createIndex('by-url', 'pageUrl');
            store.createIndex('by-timestamp', 'timestamp');
            store.createIndex('by-type', 'options.type');

            logger.info('✅ Database schema created');
          },
        });

        logger.info('✅ Summary database initialized');

        // Auto-cleanup on startup
        await this.cleanupOld();
      } catch (error) {
        logger.error('❌ Failed to initialize database:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Save summary
   */
  async saveSummary(url: string, summary: Summary): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const optionsHash = generateOptionsHash(summary.options);
      const id = `${url}:${optionsHash}`;

      await this.db.put(STORE_NAME, {
        ...summary,
        id,
        optionsHash,
      });

      logger.debug('💾 Summary saved:', { id, url });
    } catch (error) {
      logger.error('❌ Failed to save summary:', error);
      throw error;
    }
  }

  /**
   * Get summary by URL and options
   */
  async getSummary(
    url: string,
    options: SummaryOptions
  ): Promise<Summary | undefined> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const optionsHash = generateOptionsHash(options);
      const id = `${url}:${optionsHash}`;

      const result = await this.db.get(STORE_NAME, id);
      return result;
    } catch (error) {
      logger.error('❌ Failed to get summary:', error);
      return undefined;
    }
  }

  /**
   * Get all summaries for a URL
   */
  async getSummariesForUrl(url: string): Promise<Summary[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const summaries = await this.db.getAllFromIndex(
        STORE_NAME,
        'by-url',
        url
      );
      return summaries;
    } catch (error) {
      logger.error('❌ Failed to get summaries for URL:', error);
      return [];
    }
  }

  /**
   * Get all summaries (for history view)
   */
  async getAllSummaries(): Promise<Summary[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const summaries = await this.db.getAll(STORE_NAME);

      // Sort by timestamp (newest first)
      summaries.sort((a, b) => b.timestamp - a.timestamp);

      logger.debug('📚 Retrieved all summaries:', { count: summaries.length });
      return summaries;
    } catch (error) {
      logger.error('❌ Failed to get all summaries:', error);
      return [];
    }
  }

  /**
   * Get recent summaries
   */
  async getRecentSummaries(limit: number = 50): Promise<Summary[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const summaries = await this.getAllSummaries();
      return summaries.slice(0, limit);
    } catch (error) {
      logger.error('❌ Failed to get recent summaries:', error);
      return [];
    }
  }

  /**
   * Delete summary
   */
  async deleteSummary(url: string, timestamp: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Find summary by URL and timestamp
      const summaries = await this.getSummariesForUrl(url);
      const toDelete = summaries.find((s) => s.timestamp === timestamp);

      if (toDelete && 'id' in toDelete) {
        await this.db.delete(STORE_NAME, (toDelete as any).id);
        logger.info('🗑️ Summary deleted:', { url, timestamp });
      }
    } catch (error) {
      logger.error('❌ Failed to delete summary:', error);
      throw error;
    }
  }

  /**
   * Delete all summaries for URL
   */
  async deleteSummariesForUrl(url: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const summaries = await this.getSummariesForUrl(url);
      const tx = this.db.transaction(STORE_NAME, 'readwrite');

      await Promise.all([
        ...summaries.map((s) =>
          'id' in s ? tx.store.delete((s as any).id) : Promise.resolve()
        ),
        tx.done,
      ]);

      logger.info('🗑️ All summaries deleted for URL:', { url });
    } catch (error) {
      logger.error('❌ Failed to delete summaries for URL:', error);
      throw error;
    }
  }

  /**
   * Cleanup old summaries (older than RETENTION_DAYS)
   */
  async cleanupOld(): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const cutoffTime = Date.now() - RETENTION_MS;
      const allSummaries = await this.getAllSummaries();

      const oldSummaries = allSummaries.filter(
        (summary) => summary.timestamp < cutoffTime
      );

      if (oldSummaries.length === 0) {
        logger.debug('✅ No old summaries to cleanup');
        return 0;
      }

      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      await Promise.all([
        ...oldSummaries.map((s) =>
          'id' in s ? tx.store.delete((s as any).id) : Promise.resolve()
        ),
        tx.done,
      ]);

      logger.info('🧹 Cleaned up old summaries:', {
        count: oldSummaries.length,
        retentionDays: RETENTION_DAYS,
      });

      return oldSummaries.length;
    } catch (error) {
      logger.error('❌ Failed to cleanup old summaries:', error);
      return 0;
    }
  }

  /**
   * Clear all summaries
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.clear(STORE_NAME);
      logger.info('🗑️ All summaries cleared');
    } catch (error) {
      logger.error('❌ Failed to clear all summaries:', error);
      throw error;
    }
  }

  /**
   * Get database stats
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    oldestDate: number | null;
    newestDate: number | null;
    totalSize: number;
  }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const summaries = await this.getAllSummaries();

      const byType: Record<string, number> = {};
      let oldestDate: number | null = null;
      let newestDate: number | null = null;
      let totalSize = 0;

      summaries.forEach((summary) => {
        // Count by type
        const type = summary.options.type;
        byType[type] = (byType[type] || 0) + 1;

        // Track dates
        if (!oldestDate || summary.timestamp < oldestDate) {
          oldestDate = summary.timestamp;
        }
        if (!newestDate || summary.timestamp > newestDate) {
          newestDate = summary.timestamp;
        }

        // Estimate size (rough calculation)
        totalSize += summary.content.length * 2; // UTF-16 = 2 bytes/char
      });

      return {
        total: summaries.length,
        byType,
        oldestDate,
        newestDate,
        totalSize,
      };
    } catch (error) {
      logger.error('❌ Failed to get stats:', error);
      return {
        total: 0,
        byType: {},
        oldestDate: null,
        newestDate: null,
        totalSize: 0,
      };
    }
  }

  /**
   * Migrate from localStorage to IndexedDB
   */
  async migrateFromLocalStorage(): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      logger.info('🔄 Starting migration from localStorage...');

      // Get data from localStorage
      const localStorageKey = 'contentchat-summaries';
      const data = localStorage.getItem(localStorageKey);

      if (!data) {
        logger.info('✅ No localStorage data to migrate');
        return 0;
      }

      const parsed = JSON.parse(data);
      const summaries = parsed.state?.summaries || parsed.summaries || {};

      let migratedCount = 0;

      // Migrate each URL's summaries
      for (const [url, urlSummaries] of Object.entries(summaries)) {
        if (typeof urlSummaries === 'object' && urlSummaries !== null) {
          for (const summary of Object.values(urlSummaries)) {
            if (
              summary &&
              typeof summary === 'object' &&
              'content' in summary
            ) {
              await this.saveSummary(url, summary as Summary);
              migratedCount++;
            }
          }
        }
      }

      logger.info('✅ Migration complete:', { migratedCount });

      // Clear old localStorage data after successful migration
      if (migratedCount > 0) {
        logger.info('🗑️ Clearing old localStorage data...');
        localStorage.removeItem(localStorageKey);
      }

      return migratedCount;
    } catch (error) {
      logger.error('❌ Migration failed:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const summaryDB = new SummaryDatabase();
