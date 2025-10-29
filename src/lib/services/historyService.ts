/**
 * History Service
 * Manages summary history using Zustand store
 * Provides clean API for history operations
 */

import { createLogger } from '@/lib/logger';
import { useSummaryStore } from '@/sidepanel/stores/summaryStore';
import type { IHistoryService, Summary } from '@/types/summary.types';

const logger = createLogger('HistoryService');

/**
 * History Service Implementation
 */
class HistoryService implements IHistoryService {
  /**
   * Save summary to history
   */
  saveHistory(url: string, summary: Summary): void {
    logger.debug('Saving summary', {
      url,
      timestamp: summary.timestamp,
      type: summary.options.type,
    });

    const { addSummary } = useSummaryStore.getState();
    addSummary(url, summary);

    logger.debug('Summary saved');
  }

  /**
   * Get all history
   */
  getAllHistory(): Summary[] {
    logger.debug('Getting all history');
    const { getAllHistory } = useSummaryStore.getState();
    const history = getAllHistory();

    logger.debug(`Retrieved ${history.length} summaries`);
    return history;
  }

  /**
   * Get recent history
   */
  getRecentHistory(limit: number = 50): Summary[] {
    logger.debug(`Getting recent history (limit: ${limit})`);
    const { getRecentHistory } = useSummaryStore.getState();
    const history = getRecentHistory(limit);

    logger.debug(`Retrieved ${history.length} summaries`);
    return history;
  }

  /**
   * Cleanup old history
   */
  cleanupOldHistory(maxAgeDays: number = 30): void {
    logger.debug(`Cleaning up history older than ${maxAgeDays} days`);
    const { cleanupOldHistory } = useSummaryStore.getState();
    cleanupOldHistory(maxAgeDays);

    logger.debug('Cleanup complete');
  }

  /**
   * Delete specific history item
   */
  deleteHistoryItem(url: string, timestamp: number): void {
    logger.debug('Deleting history item', {
      url,
      timestamp,
    });
    const { deleteHistoryItem } = useSummaryStore.getState();
    deleteHistoryItem(url, timestamp);

    logger.debug('Item deleted');
  }
}

// Export singleton instance
export const historyService = new HistoryService();

// Export class for testing
export { HistoryService };
