/**
 * useChromeExtension Hook
 * Manages Chrome extension interactions (page content, tab updates, messages)
 * Encapsulates all Chrome API logic
 */

import { createLogger } from '@/lib/logger';
import { chromeExtensionService } from '@/lib/services/chromeExtensionService';
import type {
  PageContent,
  UseChromeExtensionReturn,
} from '@/types/summary.types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Create logger for this hook
const logger = createLogger('useChromeExtension');

/**
 * Hook for Chrome extension interactions
 * @returns Page content, loading state, error, and reload function
 */
export function useChromeExtension(): UseChromeExtensionReturn {
  const [currentPage, setCurrentPage] = useState<PageContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousUrlRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  /**
   * Load current page content
   */
  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const content = await chromeExtensionService.getCurrentPageContent();

      // Check if URL changed
      const urlChanged =
        previousUrlRef.current && previousUrlRef.current !== content.url;

      setCurrentPage(content);

      logger.debug('Page content loaded', {
        title: content.title,
        url: content.url,
      });

      // Show toast if URL changed
      if (urlChanged) {
        toast.info('Page changed. Generate a new summary.', {
          duration: 3000,
        });
      }

      // Update previous URL
      previousUrlRef.current = content.url;
      isInitialLoadRef.current = false;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load page content';

      // Only log errors that aren't expected (restricted pages are normal)
      if (!errorMsg.includes('Cannot access')) {
        logger.warn('Failed to load content:', errorMsg);
      }

      setError(errorMsg);

      // Show toast only if not initial load
      if (!isInitialLoadRef.current) {
        toast.error('Failed to load page', {
          description: errorMsg,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initial load on mount
   */
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  /**
   * Listen to content script ready messages
   */
  useEffect(() => {
    const cleanup = chromeExtensionService.listenToMessages(
      (message, _sender, _sendResponse) => {
        if (message.type === 'CONTENT_SCRIPT_READY' && message.url) {
          logger.debug('Content script ready for:', message.url);

          // Small delay to ensure content script is fully initialized
          setTimeout(() => {
            reload();
          }, 100);
        }
      }
    );

    return cleanup;
  }, [reload]);

  /**
   * Listen to tab updates (page loads)
   */
  useEffect(() => {
    const cleanup = chromeExtensionService.listenToTabUpdates(
      (_tabId, changeInfo, tab) => {
        // Only react to complete status on active tab
        if (changeInfo.status === 'complete' && tab.active) {
          logger.debug('Tab loaded completely:', tab.url);

          // Wait for content script to initialize
          setTimeout(() => {
            reload();
          }, 200);
        }
      }
    );

    return cleanup;
  }, [reload]);

  /**
   * Listen to tab activation (switching tabs)
   */
  useEffect(() => {
    const cleanup = chromeExtensionService.listenToTabActivation(
      (activeInfo) => {
        logger.debug('Tab activated:', activeInfo.tabId);

        // Reload content when switching tabs
        setTimeout(() => {
          reload();
        }, 100);
      }
    );

    return cleanup;
  }, [reload]);

  return {
    currentPage,
    isLoading,
    error,
    reload,
  };
}
