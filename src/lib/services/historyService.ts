/**
 * History Service
 * Manages summary history using Zustand store
 * Provides clean API for history operations
 */

import { useSummaryStore } from '@/sidepanel/stores/summaryStore';
import type { IHistoryService, Summary } from '@/types/summary.types';

/**
 * History Service Implementation
 */
class HistoryService implements IHistoryService {
  /**
   * Save summary to history
   */
  saveHistory(url: string, summary: Summary): void {
    console.log('💾 History Service: Saving summary', {
      url,
      timestamp: summary.timestamp,
      type: summary.options.type,
    });

    const { addSummary } = useSummaryStore.getState();
    addSummary(url, summary);

    console.log('✅ History Service: Summary saved');
  }

  /**
   * Get all history
   */
  getAllHistory(): Summary[] {
    console.log('📚 History Service: Getting all history');
    const { getAllHistory } = useSummaryStore.getState();
    const history = getAllHistory();

    console.log(`✅ History Service: Retrieved ${history.length} summaries`);
    return history;
  }

  /**
   * Get recent history
   */
  getRecentHistory(limit: number = 50): Summary[] {
    console.log(`📚 History Service: Getting recent history (limit: ${limit})`);
    const { getRecentHistory } = useSummaryStore.getState();
    const history = getRecentHistory(limit);

    console.log(`✅ History Service: Retrieved ${history.length} summaries`);
    return history;
  }

  /**
   * Cleanup old history
   */
  cleanupOldHistory(maxAgeDays: number = 30): void {
    console.log(
      `🧹 History Service: Cleaning up history older than ${maxAgeDays} days`
    );
    const { cleanupOldHistory } = useSummaryStore.getState();
    cleanupOldHistory(maxAgeDays);

    console.log('✅ History Service: Cleanup complete');
  }

  /**
   * Delete specific history item
   */
  deleteHistoryItem(url: string, timestamp: number): void {
    console.log('🗑️ History Service: Deleting history item', {
      url,
      timestamp,
    });
    const { deleteHistoryItem } = useSummaryStore.getState();
    deleteHistoryItem(url, timestamp);

    console.log('✅ History Service: Item deleted');
  }
}

// Export singleton instance
export const historyService = new HistoryService();

// Export class for testing
export { HistoryService };
