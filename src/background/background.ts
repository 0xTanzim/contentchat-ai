// Background Service Worker for ContentChat AI
// Handles extension lifecycle and messaging

console.log('ContentChat AI: Background service worker started');

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
