// Content Script for ContentChat AI
// Extracts page content and communicates with background/sidepanel

console.log('ContentChat AI: Content script loaded');

/**
 * Extract text content from the current page
 */
function extractPageContent(): {
  title: string;
  url: string;
  content: string;
  language: string;
} {
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
  ];

  const clone = contentElement.cloneNode(true) as HTMLElement;
  unwantedSelectors.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Get text content
  const content = clone.innerText.trim();

  // Try to detect language from html lang attribute
  const language = document.documentElement.lang || 'en';

  return {
    title,
    url,
    content,
    language,
  };
}

// Listen for messages from sidepanel/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_CONTENT') {
    const pageData = extractPageContent();
    sendResponse(pageData);
  }

  return true; // Keep channel open
});

// Notify that content script is ready
chrome.runtime.sendMessage({
  type: 'CONTENT_SCRIPT_READY',
  url: window.location.href,
});
