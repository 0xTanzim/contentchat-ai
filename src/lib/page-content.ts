/**
 * Page Content Extraction Utilities
 * Handles communication with content script to get page data
 */

export interface PageContent {
  title: string;
  url: string;
  content: string;
  language: string;
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's a permission error
      if (lastError.message.includes('Cannot access')) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Get current page content from content script with retry logic
 */
export async function getCurrentPageContent(): Promise<PageContent> {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.id) {
      throw new Error('No active tab found');
    }

    if (!tab.url) {
      throw new Error('Cannot access tab URL');
    }

    // Check if we can access this page
    const restrictedProtocols = [
      'chrome:',
      'chrome-extension:',
      'edge:',
      'about:',
      'data:',
      'file:',
    ];

    if (restrictedProtocols.some((protocol) => tab.url!.startsWith(protocol))) {
      throw new Error(
        `Cannot access ${
          tab.url!.split(':')[0]
        }: pages. Please navigate to a regular website.`
      );
    }

    // Try to send message with retries
    const response = await retryWithBackoff(
      async () => {
        try {
          return await chrome.tabs.sendMessage(tab.id!, {
            type: 'GET_PAGE_CONTENT',
          });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);

          // Content script not ready
          if (errorMsg.includes('Could not establish connection')) {
            throw new Error('Content script not ready. Retrying...');
          }

          // Tab closed or navigated away
          if (errorMsg.includes('No tab with id')) {
            throw new Error('Tab no longer exists');
          }

          throw error;
        }
      },
      3,
      200
    ); // 3 retries, starting at 200ms

    return response as PageContent;
  } catch (error) {
    console.error('Failed to get page content:', error);

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Provide user-friendly error messages
    if (errorMsg.includes('Cannot access')) {
      throw new Error(errorMsg);
    }

    if (errorMsg.includes('Content script not ready')) {
      throw new Error(
        'Page is still loading. Please wait a moment and try again.'
      );
    }

    throw new Error(
      'Failed to extract page content. Please refresh the page and try again.'
    );
  }
}

/**
 * Check if we can access the current page
 */
export async function canAccessCurrentPage(): Promise<boolean> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.url) {
      return false;
    }

    // Can't access chrome:// pages, chrome-extension://, etc.
    const restrictedProtocols = [
      'chrome:',
      'chrome-extension:',
      'edge:',
      'about:',
    ];
    return !restrictedProtocols.some((protocol) =>
      tab.url!.startsWith(protocol)
    );
  } catch {
    return false;
  }
}
