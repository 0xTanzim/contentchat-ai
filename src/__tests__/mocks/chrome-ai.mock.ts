/**
 * Chrome AI API Mock Helpers
 * Reusable mock configurations for different test scenarios
 * Updated for Chrome 138+ global API pattern
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi } from 'vitest';

/**
 * Mock Chrome AI as available (Chrome 138+ pattern)
 */
export function mockAIAvailable() {
  const mockSummarizer = {
    summarize: vi.fn(async (text: string) => `Summary: ${text.slice(0, 50)}`),
    destroy: vi.fn(),
  };

  const mockLanguageModel = {
    prompt: vi.fn(async (text: string) => `Response: ${text.slice(0, 30)}`),
    destroy: vi.fn(),
  };

  const mockTranslator = {
    translate: vi.fn(async (text: string) => `Translated: ${text}`),
    destroy: vi.fn(),
  };

  const mockLanguageDetector = {
    detect: vi.fn(async () => [{ detectedLanguage: 'en', confidence: 0.95 }]),
    destroy: vi.fn(),
  };

  // Mock global constructors (Chrome 138+ pattern)
  (globalThis as any).Summarizer = {
    availability: vi.fn(async () => 'available'),
    create: vi.fn(async () => mockSummarizer),
  };

  (globalThis as any).LanguageModel = {
    availability: vi.fn(async () => 'available'),
    create: vi.fn(async () => mockLanguageModel),
    params: vi.fn(async () => ({
      defaultTopK: 3,
      maxTopK: 128,
      defaultTemperature: 1,
      maxTemperature: 2,
    })),
  };

  (globalThis as any).Translator = {
    availability: vi.fn(async () => 'available'),
    create: vi.fn(async () => mockTranslator),
  };

  (globalThis as any).LanguageDetector = {
    availability: vi.fn(async () => 'available'),
    create: vi.fn(async () => mockLanguageDetector),
  };

  return {
    mockSummarizer,
    mockLanguageModel,
    mockTranslator,
    mockLanguageDetector,
  };
}

/**
 * Mock Chrome AI as unavailable
 */
export function mockAIUnavailable() {
  // Remove all global AI constructors
  delete (globalThis as any).Summarizer;
  delete (globalThis as any).LanguageModel;
  delete (globalThis as any).Translator;
  delete (globalThis as any).LanguageDetector;
}

/**
 * Mock Chrome AI as requiring download
 */
export function mockAIRequiresDownload() {
  const mockSummarizer = {
    summarize: vi.fn(async (text: string) => `Summary: ${text.slice(0, 50)}`),
    destroy: vi.fn(),
  };

  const mockLanguageModel = {
    prompt: vi.fn(async (text: string) => `Response: ${text.slice(0, 30)}`),
    destroy: vi.fn(),
  };

  // Mock user activation
  (navigator as any).userActivation = {
    isActive: true,
  };

  // Mock global constructors with 'after-download' status
  (globalThis as any).Summarizer = {
    availability: vi.fn(async () => 'after-download'),
    create: vi.fn(async () => mockSummarizer),
  };

  (globalThis as any).LanguageModel = {
    availability: vi.fn(async () => 'after-download'),
    create: vi.fn(async () => mockLanguageModel),
  };

  return {
    mockSummarizer,
    mockLanguageModel,
  };
}

/**
 * Mock Chrome AI with quota exceeded error
 */
export function mockAIQuotaExceeded() {
  const mockSummarizer = {
    summarize: vi.fn(async () => {
      throw new Error('quota exceeded');
    }),
    destroy: vi.fn(),
  };

  (globalThis as any).Summarizer = {
    availability: vi.fn(async () => 'available'),
    create: vi.fn(async () => mockSummarizer),
  };

  return { mockSummarizer };
}

/**
 * Mock successful page content extraction
 */
export function mockPageContent() {
  chrome.tabs.query = vi.fn(() =>
    Promise.resolve([
      {
        id: 123,
        active: true,
        url: 'https://example.com/article',
        title: 'Test Article',
      },
    ])
  );

  chrome.runtime.sendMessage = vi.fn(() =>
    Promise.resolve({
      title: 'Test Article',
      url: 'https://example.com/article',
      content: 'This is test article content for testing purposes.',
      language: 'en',
    })
  );
}

/**
 * Mock page content extraction failure (protected page)
 */
export function mockProtectedPage() {
  chrome.tabs.query = vi.fn(() =>
    Promise.resolve([
      {
        id: 123,
        active: true,
        url: 'chrome://extensions/',
        title: 'Extensions',
      },
    ])
  );
}
