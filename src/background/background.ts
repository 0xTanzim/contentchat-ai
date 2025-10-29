// Background Service Worker for ContentChat AI
// Handles extension lifecycle and messaging

console.log('ContentChat AI: Background service worker started');

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

    // Ask AI
    chrome.contextMenus.create({
      id: 'ask-ai',
      parentId: 'contentchat-ai',
      title: '💬 Ask AI About This',
      contexts: ['selection'],
    });

    console.log('✅ Context menus created');
  });
}

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ContentChat AI: Extension installed');

    // Set default side panel behavior
    chrome.sidePanel
      .setPanelBehavior({
        openPanelOnActionClick: true,
      })
      .catch((error) => {
        console.error('Failed to set panel behavior:', error);
      });
  }

  // Create context menus on install/update
  createContextMenus();
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);

  if (!tab?.id) return;

  // Get selected text
  const selectedText = info.selectionText || '';

  // Send message to content script based on menu item
  switch (info.menuItemId) {
    case 'fix-grammar':
      chrome.tabs.sendMessage(tab.id, {
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

        chrome.tabs.sendMessage(tab.id, {
          type: 'REWRITE_TEXT',
          text: selectedText,
          preset,
          isEditable: info.editable,
        });
      }
      break;

    case 'ask-ai':
      // Open side panel and send selected text
      chrome.sidePanel.open({ tabId: tab.id });
      // Wait a bit for panel to open, then send message
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'ASK_ABOUT_SELECTION',
          text: selectedText,
        });
      }, 500);
      break;
  }
});

// Message handling
chrome.runtime.onMessage.addListener((message) => {
  console.log('Background received message:', message);

  // Handle different message types
  if (message.type === 'GET_PAGE_CONTENT') {
    // Message will be handled by content script
    return true;
  }

  return true; // Keep channel open for async responses
});

// Extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);

  // Open side panel for the current tab
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Keep service worker alive
self.addEventListener('fetch', () => {
  // This keeps the service worker active
});
