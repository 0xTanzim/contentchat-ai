/**
 * Unit tests for page content utilities
 * @file src/lib/page-content.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockPageContent,
  mockProtectedPage,
} from '../__tests__/mocks/chrome-ai.mock';
import { canAccessCurrentPage, getCurrentPageContent } from './page-content';

describe('page-content utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentPageContent', () => {
    it('should successfully get page content', async () => {
      mockPageContent();

      // Mock tabs.sendMessage properly
      chrome.tabs.sendMessage = vi.fn(() =>
        Promise.resolve({
          title: 'Test Article',
          url: 'https://example.com/article',
          content: 'This is test article content for testing purposes.',
          language: 'en',
        })
      );

      const result = await getCurrentPageContent();

      expect(result).toBeTruthy();
      expect(result?.title).toBe('Test Article');
      expect(result?.url).toBe('https://example.com/article');
      expect(result?.content).toBeTruthy();
      expect(result?.language).toBe('en');
    });

    it('should call chrome.tabs.query with correct params', async () => {
      mockPageContent();
      chrome.tabs.sendMessage = vi.fn(() => Promise.resolve({}));

      await getCurrentPageContent();

      expect(chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
    });

    it('should send message to content script', async () => {
      mockPageContent();
      chrome.tabs.sendMessage = vi.fn(() => Promise.resolve({}));

      await getCurrentPageContent();

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'GET_PAGE_CONTENT',
      });
    });

    it('should throw error when no active tab', async () => {
      chrome.tabs.query = vi.fn(() => Promise.resolve([]));

      await expect(getCurrentPageContent()).rejects.toThrow();
    });

    it('should throw error on failure', async () => {
      chrome.tabs.query = vi.fn(() => Promise.reject(new Error('Test error')));

      await expect(getCurrentPageContent()).rejects.toThrow(
        'Failed to extract page content'
      );
    });
  });

  describe('canAccessCurrentPage', () => {
    it('should return true for accessible pages', async () => {
      mockPageContent();

      const result = await canAccessCurrentPage();

      expect(result).toBe(true);
    });

    it('should return false for chrome:// pages', async () => {
      mockProtectedPage();

      const result = await canAccessCurrentPage();

      expect(result).toBe(false);
    });

    it('should return false for chrome-extension:// pages', async () => {
      chrome.tabs.query = vi.fn(() =>
        Promise.resolve([
          {
            id: 123,
            active: true,
            url: 'chrome-extension://abc123/page.html',
            title: 'Extension Page',
          },
        ])
      );

      const result = await canAccessCurrentPage();

      expect(result).toBe(false);
    });

    it('should return false for edge:// pages', async () => {
      chrome.tabs.query = vi.fn(() =>
        Promise.resolve([
          {
            id: 123,
            active: true,
            url: 'edge://settings',
            title: 'Settings',
          },
        ])
      );

      const result = await canAccessCurrentPage();

      expect(result).toBe(false);
    });

    it('should return false when no tabs', async () => {
      chrome.tabs.query = vi.fn(() => Promise.resolve([]));

      const result = await canAccessCurrentPage();

      expect(result).toBe(false);
    });
  });
});
