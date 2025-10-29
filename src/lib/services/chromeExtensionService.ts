/**
 * Chrome Extension Service
 * Handles all Chrome extension API interactions
 * No React dependencies - pure Chrome API logic
 */

import { createLogger } from '@/lib/logger';
import { getCurrentPageContent } from '@/lib/page-content';
import type {
  ChromeMessage,
  IChromeExtensionService,
  PageContent,
} from '@/types/summary.types';

const logger = createLogger('ChromeExtensionService');

/**
 * Chrome Extension Service Implementation
 */
class ChromeExtensionService implements IChromeExtensionService {
  /**
   * Get current page content from content script
   */
  async getCurrentPageContent(): Promise<PageContent> {
    try {
      logger.debug('Loading page content');
      const content = await getCurrentPageContent();

      logger.debug('Content loaded', {
        title: content.title,
        url: content.url,
        contentLength: content.content.length,
      });

      return content;
    } catch (error) {
      logger.error('Failed to load content:', error);

      const errorMsg =
        error instanceof Error ? error.message : 'Failed to load page content';

      // Handle content script not ready
      if (errorMsg.includes('Could not establish connection')) {
        throw new Error(
          'Content script not ready. The page may still be loading. Please wait a moment and try again.'
        );
      }

      throw error;
    }
  }

  /**
   * Listen to tab updates (URL changes, page loads)
   */
  listenToTabUpdates(
    callback: Parameters<typeof chrome.tabs.onUpdated.addListener>[0]
  ): () => void {
    logger.debug('Listening to tab updates');

    chrome.tabs.onUpdated.addListener(callback);

    // Return cleanup function
    return () => {
      logger.debug('Stopped listening to tab updates');
      chrome.tabs.onUpdated.removeListener(callback);
    };
  }

  /**
   * Listen to tab activation (tab switching)
   */
  listenToTabActivation(
    callback: (activeInfo: { tabId: number; windowId: number }) => void
  ): () => void {
    logger.debug('Listening to tab activation');

    chrome.tabs.onActivated.addListener(callback);

    // Return cleanup function
    return () => {
      logger.debug('Stopped listening to tab activation');
      chrome.tabs.onActivated.removeListener(callback);
    };
  }

  /**
   * Listen to runtime messages (from content scripts)
   */
  listenToMessages(
    callback: (
      message: ChromeMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => void
  ): () => void {
    logger.debug('Listening to runtime messages');

    chrome.runtime.onMessage.addListener(callback);

    // Return cleanup function
    return () => {
      logger.debug('Stopped listening to messages');
      chrome.runtime.onMessage.removeListener(callback);
    };
  }

  /**
   * Open URL in new tab
   */
  async openTab(url: string): Promise<void> {
    try {
      logger.debug('Opening tab:', url);
      await chrome.tabs.create({ url });
      logger.debug('Tab opened successfully');
    } catch (error) {
      logger.error('Failed to open tab:', error);
      throw new Error('Failed to open tab');
    }
  }
}

// Export singleton instance
export const chromeExtensionService = new ChromeExtensionService();

// Export class for testing
export { ChromeExtensionService };
