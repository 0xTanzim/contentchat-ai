/**
 * useChromeExtension Hook
 * Manages Chrome extension interactions (page content, tab updates, messages)
 * Encapsulates all Chrome API logic
 */

import { chromeExtensionService } from '@/lib/services/chromeExtensionService';
import type {
  PageContent,
  UseChromeExtensionReturn,
} from '@/types/summary.types';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook for Chrome extension interactions
 * @returns Page content, loading state, error, and reload function
 */
export function useChromeExtension(): UseChromeExtensionReturn {
  const [currentPage, setCurrentPage] = useState<PageContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousUrl, setPreviousUrl] = useState<string | null>(null);

  /**
   * Load current page content
   */
  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const content = await chromeExtensionService.getCurrentPageContent();
      setCurrentPage(content);

      console.log('✅ useChromeExtension: Page content loaded', {
        title: content.title,
        url: content.url,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load page content';
      console.error('❌ useChromeExtension: Failed to load content', errorMsg);

      setError(errorMsg);

      // Show toast only if not initial load
      if (currentPage) {
        toast.error('Failed to load page', {
          description: errorMsg,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  /**
   * Initial load on mount
   */
  useEffect(() => {
    reload();
  }, []);

  /**
   * Listen to content script ready messages
   */
  useEffect(() => {
    const cleanup = chromeExtensionService.listenToMessages(
      (message, _sender, _sendResponse) => {
        if (message.type === 'CONTENT_SCRIPT_READY' && message.url) {
          console.log(
            '📨 useChromeExtension: Content script ready for:',
            message.url
          );

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
          console.log('🔄 useChromeExtension: Tab loaded completely:', tab.url);

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
        console.log('🔄 useChromeExtension: Tab activated:', activeInfo.tabId);

        // Reload content when switching tabs
        setTimeout(() => {
          reload();
        }, 100);
      }
    );

    return cleanup;
  }, [reload]);

  /**
   * Detect URL changes and notify
   */
  useEffect(() => {
    if (!currentPage?.url) return;

    // If URL changed, notify user
    if (previousUrl && previousUrl !== currentPage.url) {
      console.log('🔄 useChromeExtension: URL changed', {
        from: previousUrl,
        to: currentPage.url,
      });

      toast.info('Page changed. Generate a new summary.', {
        duration: 3000,
      });
    }

    // Update tracked URL
    setPreviousUrl(currentPage.url);
  }, [currentPage?.url, previousUrl]);

  return {
    currentPage,
    isLoading,
    error,
    reload,
  };
}
