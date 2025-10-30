// Content Script for ContentChat AI
// Extracts page content and communicates with background/sidepanel

import { createLogger } from '@/lib/logger';
import './writing-assistant';

const logger = createLogger('ContentScript');

logger.info('Content script loaded on', window.location.href);

/**
 * Extract text content from the current page
 * Enhanced extraction with better selector priority
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

    // Try multiple extraction strategies in order of priority
    let content = '';

    // Strategy 1: Try article tag (best for news/blog posts)
    const article = document.querySelector('article');
    if (article) {
      content = extractFromElement(article);
    }

    // Strategy 2: Try main tag
    if (!content || content.split(/\s+/).length < 50) {
      const main = document.querySelector('main');
      if (main) {
        content = extractFromElement(main);
      }
    }

    // Strategy 3: Try common content containers
    if (!content || content.split(/\s+/).length < 50) {
      const selectors = [
        '[role="main"]',
        '.content',
        '.main-content',
        '#content',
        '#main-content',
        '.post-content',
        '.article-content',
        '.entry-content',
        '[class*="content"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const extracted = extractFromElement(element as HTMLElement);
          if (extracted.split(/\s+/).length > content.split(/\s+/).length) {
            content = extracted;
          }
        }
      }
    }

    // Strategy 4: Fall back to body (filter noise)
    if (!content || content.split(/\s+/).length < 50) {
      content = extractFromElement(document.body);
    }

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
      wordCount: content.split(/\s+/).length,
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

/**
 * Extract and clean text from an HTML element
 */
function extractFromElement(element: HTMLElement): string {
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
    'form',
    'button',
    '.ad',
    '.ads',
    '.advertisement',
    '.social-share',
    '.comments',
    '.related-posts',
    '.newsletter',
    '[class*="cookie"]',
    '[class*="banner"]',
    '[class*="popup"]',
    '[class*="modal"]',
  ];

  const clone = element.cloneNode(true) as HTMLElement;
  unwantedSelectors.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Get text content and clean it
  let text = clone.innerText || clone.textContent || '';

  // Clean up whitespace
  text = text
    .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    .replace(/\t+/g, ' ') // Replace tabs with space
    .replace(/ {2,}/g, ' ') // Replace multiple spaces
    .trim();

  return text;
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
