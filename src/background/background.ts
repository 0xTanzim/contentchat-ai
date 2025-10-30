// Background Service Worker for ContentChat AI
// Handles extension lifecycle and messaging

import { createLogger } from '@/lib/logger';

const logger = createLogger('Background');

logger.info('Background service worker started');

/**
 * Create context menus for writing assistance
 */
function createContextMenus() {
  // Remove existing menus first
  chrome.contextMenus.removeAll(() => {
    // Parent menu
    chrome.contextMenus.create({
      id: 'contentchat-ai',
      title: 'ContentChat AI',
      contexts: ['selection', 'editable'],
    });

    // Proofreader submenu
    chrome.contextMenus.create({
      id: 'fix-grammar',
      parentId: 'contentchat-ai',
      title: '✏️ Fix Grammar & Spelling',
      contexts: ['selection', 'editable'],
    });

    // Rewriter submenu parent
    chrome.contextMenus.create({
      id: 'rewrite-menu',
      parentId: 'contentchat-ai',
      title: '✨ Rewrite',
      contexts: ['selection', 'editable'],
    });

    // Rewriter options
    chrome.contextMenus.create({
      id: 'rewrite-formal',
      parentId: 'rewrite-menu',
      title: 'More Formal',
      contexts: ['selection', 'editable'],
    });

    chrome.contextMenus.create({
      id: 'rewrite-casual',
      parentId: 'rewrite-menu',
      title: 'More Casual',
      contexts: ['selection', 'editable'],
    });

    chrome.contextMenus.create({
      id: 'rewrite-shorter',
      parentId: 'rewrite-menu',
      title: 'Make Shorter',
      contexts: ['selection', 'editable'],
    });

    chrome.contextMenus.create({
      id: 'rewrite-longer',
      parentId: 'rewrite-menu',
      title: 'Make Longer',
      contexts: ['selection', 'editable'],
    });

    // Separator
    chrome.contextMenus.create({
      id: 'separator-1',
      parentId: 'contentchat-ai',
      type: 'separator',
      contexts: ['selection', 'editable'],
    });

    // Writer - Generate Content
    chrome.contextMenus.create({
      id: 'generate-content',
      parentId: 'contentchat-ai',
      title: '✨ Generate Content from This',
      contexts: ['selection'],
    });

    // Ask AI
    chrome.contextMenus.create({
      id: 'ask-ai',
      parentId: 'contentchat-ai',
      title: '💬 Ask AI About This',
      contexts: ['selection'],
    });

    logger.debug('Context menus created');
  });
}

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    logger.info('Extension installed');

    // Set default side panel behavior
    chrome.sidePanel
      .setPanelBehavior({
        openPanelOnActionClick: true,
      })
      .catch((error) => {
        logger.error('Failed to set panel behavior:', error);
      });
  }

  // Create context menus on install/update
  createContextMenus();
});

/**
 * Inject content script into a tab if not already injected
 * This handles the edge case where user tries to use extension before reloading tab
 */
async function ensureContentScriptInjected(tabId: number): Promise<boolean> {
  try {
    // Try to ping the content script first
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    logger.debug('Content script already injected in tab:', tabId);
    return true;
  } catch (error) {
    // Content script not injected, inject it now
    logger.info('Content script not found, injecting into tab:', tabId);

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/content.js'],
      });

      logger.info('✅ Content script injected successfully');

      // Wait a bit for script to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      return true;
    } catch (injectError) {
      logger.error('❌ Failed to inject content script:', injectError);

      // Show notification to user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon/128.png',
        title: 'ContentChat AI',
        message: 'Please reload this page to use this feature.',
        priority: 2,
      });

      return false;
    }
  }
}

/**
 * Send message to content script with automatic injection fallback
 */
async function sendMessageToTab(tabId: number, message: any): Promise<void> {
  try {
    // First, ensure content script is injected
    const isInjected = await ensureContentScriptInjected(tabId);

    if (!isInjected) {
      logger.warn('Cannot send message - content script injection failed');
      return;
    }

    // Now send the actual message
    await chrome.tabs.sendMessage(tabId, message);
    logger.debug('✅ Message sent successfully:', message.type);
  } catch (error) {
    logger.error('❌ Failed to send message to tab:', error);

    // Show user-friendly notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon/128.png',
      title: 'ContentChat AI',
      message:
        'Unable to process request. Please reload the page and try again.',
      priority: 2,
    });
  }
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  logger.debug('Context menu clicked:', info.menuItemId);

  if (!tab?.id) return;

  // Get selected text
  const selectedText = info.selectionText || '';

  // Send message to content script based on menu item
  switch (info.menuItemId) {
    case 'fix-grammar':
      await sendMessageToTab(tab.id, {
        type: 'PROOFREAD_TEXT',
        text: selectedText,
        isEditable: info.editable,
      });
      break;

    case 'rewrite-formal':
    case 'rewrite-casual':
    case 'rewrite-shorter':
    case 'rewrite-longer':
      {
        const presetMap: Record<string, string> = {
          'rewrite-formal': 'formal',
          'rewrite-casual': 'casual',
          'rewrite-shorter': 'shorter',
          'rewrite-longer': 'longer',
        };
        const preset = presetMap[info.menuItemId];

        await sendMessageToTab(tab.id, {
          type: 'REWRITE_TEXT',
          text: selectedText,
          preset,
          isEditable: info.editable,
        });
      }
      break;

    case 'generate-content':
      // Open side panel and switch to Writer tab
      await chrome.sidePanel.open({ tabId: tab.id });

      // Wait for panel to open, then send message to switch to writer
      setTimeout(async () => {
        try {
          await chrome.runtime.sendMessage({
            type: 'GENERATE_FROM_SELECTION',
            text: selectedText,
          });
        } catch (error) {
          logger.error('Failed to send GENERATE_FROM_SELECTION:', error);
        }
      }, 500);
      break;

    case 'ask-ai':
      // Open side panel first
      await chrome.sidePanel.open({ tabId: tab.id });

      // Wait a bit for panel to open, then send message
      setTimeout(async () => {
        try {
          await chrome.runtime.sendMessage({
            type: 'ASK_ABOUT_SELECTION',
            text: selectedText,
          });
        } catch (error) {
          logger.error('Failed to send ASK_ABOUT_SELECTION:', error);
        }
      }, 500);
      break;
  }
});

// Message handling
chrome.runtime.onMessage.addListener((message) => {
  logger.debug('Background received message:', message);

  // Handle different message types
  if (message.type === 'GET_PAGE_CONTENT') {
    // Message will be handled by content script
    return true;
  }

  if (message.type === 'CONTENT_SCRIPT_READY') {
    // Content script loaded successfully - acknowledge it
    logger.info('Content script ready on:', message.url);
    return true;
  }

  if (message.type === 'ASK_ABOUT_SELECTION') {
    // Selection message from context menu - will be handled by sidepanel
    logger.debug(
      'Ask about selection message:',
      message.text?.substring(0, 50)
    );
    return true;
  }

  return true; // Keep channel open for async responses
});

// Extension icon click
chrome.action.onClicked.addListener((tab) => {
  logger.debug('Extension icon clicked on tab:', tab.id);

  // Open side panel for the current tab
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});
