// Content Script for ContentChat AI
// Extracts page content and communicates with background/sidepanel

console.log(
  '✅ ContentChat AI: Content script loaded on',
  window.location.href
);

/**
 * Extract text content from the current page
 */
function extractPageContent(): {
  title: string;
  url: string;
  content: string;
  language: string;
} {
  try {
    // Get page title
    const title = document.title || 'Untitled';

    // Get page URL
    const url = window.location.href;

    // Extract main content (prioritize article, main, or body)
    let contentElement =
      document.querySelector('article') ||
      document.querySelector('main') ||
      document.body;

    // Remove unwanted elements
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'iframe',
      'noscript',
      'aside',
      '.ad',
      '.advertisement',
    ];

    const clone = contentElement.cloneNode(true) as HTMLElement;
    unwantedSelectors.forEach((selector) => {
      clone.querySelectorAll(selector).forEach((el) => el.remove());
    });

    // Get text content
    let content = clone.innerText.trim();

    // Limit content size (max 100KB to prevent issues)
    if (content.length > 100000) {
      content = content.substring(0, 100000) + '\n\n[Content truncated...]';
    }

    // Try to detect language from html lang attribute
    const language = document.documentElement.lang || 'en';

    console.log('✅ ContentChat AI: Extracted page content', {
      title,
      url,
      contentLength: content.length,
      language,
    });

    return {
      title,
      url,
      content,
      language,
    };
  } catch (error) {
    console.error('❌ ContentChat AI: Failed to extract content', error);
    throw error;
  }
}

// Listen for messages from sidepanel/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('📨 ContentChat AI: Received message', message.type);

  if (message.type === 'GET_PAGE_CONTENT') {
    try {
      const pageData = extractPageContent();
      sendResponse(pageData);
      console.log('✅ ContentChat AI: Sent page content response');
    } catch (error) {
      console.error('❌ ContentChat AI: Error extracting content', error);
      sendResponse({
        error:
          error instanceof Error ? error.message : 'Failed to extract content',
      });
    }
  }

  return true; // Keep channel open for async response
});

// Notify that content script is ready
try {
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_READY',
    url: window.location.href,
  });
  console.log('✅ ContentChat AI: Notified ready');
} catch (error) {
  // Extension context may be invalidated, ignore
  console.warn('⚠️ ContentChat AI: Could not send ready message', error);
}
