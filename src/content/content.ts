// Content Script for ContentChat AI
// Extracts page content and communicates with background/sidepanel

import { createLogger } from '@/lib/logger';
import './writing-assistant';

const logger = createLogger('ContentScript');

logger.info('Content script loaded on', window.location.href);

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
    const contentElement =
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

    logger.debug('Extracted page content', {
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
    logger.error('Failed to extract content:', error);
    throw error;
  }
}

// Listen for messages from sidepanel/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  logger.debug('Received message:', message.type);

  // Handle PING message for content script detection
  if (message.type === 'PING') {
    sendResponse({ status: 'ok' });
    return true;
  }

  if (message.type === 'GET_PAGE_CONTENT') {
    try {
      const pageData = extractPageContent();
      sendResponse(pageData);
      logger.debug('Sent page content response');
    } catch (error) {
      logger.error('Error extracting content:', error);
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
  logger.info('Content script ready');
} catch (error) {
  // Extension context may be invalidated, ignore
  logger.warn('Could not send ready message:', error);
}
