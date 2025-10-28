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
 * Get current page content from content script
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

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_PAGE_CONTENT',
    });

    return response as PageContent;
  } catch (error) {
    console.error('Failed to get page content:', error);
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
