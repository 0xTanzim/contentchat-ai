/**
 * Vitest Global Setup
 * Mocks for Chrome APIs and Window APIs
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ============================================
// Chrome API Mocks
// ============================================

const chromeMock = {
  runtime: {
    id: 'test-extension-id',
    lastError: null,
    sendMessage: vi.fn((message, callback) => {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
  },

  tabs: {
    query: vi.fn(() =>
      Promise.resolve([
        {
          id: 1,
          active: true,
          url: 'https://example.com',
          title: 'Example Page',
        },
      ])
    ),
    sendMessage: vi.fn(() => Promise.resolve({ success: true })),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },

  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
    sync: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
  },

  sidePanel: {
    setPanelBehavior: vi.fn(() => Promise.resolve()),
    setOptions: vi.fn(() => Promise.resolve()),
    open: vi.fn(() => Promise.resolve()),
  },
};

// @ts-expect-error - Mocking global chrome
global.chrome = chromeMock;

// ============================================
// Chrome AI API Mocks
// ============================================

interface MockAICapabilities {
  available: 'readily' | 'after-download' | 'no';
}

interface MockSummarizer {
  summarize: (text: string) => Promise<string>;
  destroy: () => void;
}

interface MockLanguageModel {
  prompt: (text: string) => Promise<string>;
  destroy: () => void;
}

const mockSummarizer: MockSummarizer = {
  summarize: vi.fn(async (text: string) => {
    return `Summary of: ${text.substring(0, 50)}...`;
  }),
  destroy: vi.fn(),
};

const mockLanguageModel: MockLanguageModel = {
  prompt: vi.fn(async (text: string) => {
    return `AI response to: ${text.substring(0, 30)}...`;
  }),
  destroy: vi.fn(),
};

const windowAIMock = {
  summarizer: {
    capabilities: vi.fn(
      async (): Promise<MockAICapabilities> => ({
        available: 'readily',
      })
    ),
    create: vi.fn(async () => mockSummarizer),
  },

  languageModel: {
    capabilities: vi.fn(
      async (): Promise<MockAICapabilities> => ({
        available: 'readily',
      })
    ),
    create: vi.fn(async () => mockLanguageModel),
  },
};

// @ts-expect-error - Mocking global window.ai
global.window.ai = windowAIMock;

// ============================================
// LocalStorage Mock
// ============================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ============================================
// Console Mock (suppress noise in tests)
// ============================================

global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};

// ============================================
// Reset mocks before each test
// ============================================

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
