/**
 * Unit tests for summary store
 * @file src/sidepanel/stores/summaryStore.test.ts
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useSummaryStore } from './summaryStore';

describe('summaryStore', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset store
    useSummaryStore.setState({
      summaries: {},
      activeOptions: {
        type: 'key-points',
        length: 'medium',
        format: 'markdown',
        detailLevel: 'standard',
      },
    });
  });

  it('should have initial state', () => {
    const state = useSummaryStore.getState();

    expect(state.summaries).toEqual({});
    expect(state.activeOptions.type).toBe('key-points');
    expect(state.activeOptions.length).toBe('medium');
    expect(state.activeOptions.format).toBe('markdown');
  });

  describe('addSummary', () => {
    it('should add a summary for a URL', () => {
      const url = 'https://example.com';
      const summary = {
        content: 'This is a summary',
        options: {
          type: 'key-points' as const,
          length: 'medium' as const,
          format: 'markdown' as const,
        },
        stats: {
          originalWordCount: 100,
          summaryWordCount: 20,
          compressionRatio: 0.2,
          readingTime: 60,
          generatedAt: Date.now(),
        },
        timestamp: Date.now(),
        pageTitle: 'Example',
        pageUrl: url,
      };

      useSummaryStore.getState().addSummary(url, summary);

      const stored = useSummaryStore
        .getState()
        .getSummary(url, summary.options);
      expect(stored?.content).toBe('This is a summary');
    });

    it('should store multiple summary types for same URL', () => {
      const url = 'https://example.com';
      const baseStats = {
        originalWordCount: 100,
        summaryWordCount: 20,
        compressionRatio: 0.2,
        readingTime: 60,
        generatedAt: Date.now(),
      };

      const summary1 = {
        content: 'Summary 1',
        options: {
          type: 'key-points' as const,
          length: 'medium' as const,
          format: 'markdown' as const,
        },
        stats: baseStats,
        timestamp: Date.now(),
        pageTitle: 'Example',
        pageUrl: url,
      };
      const summary2 = {
        content: 'Summary 2',
        options: {
          type: 'tldr' as const,
          length: 'short' as const,
          format: 'markdown' as const,
        },
        stats: baseStats,
        timestamp: Date.now(),
        pageTitle: 'Example',
        pageUrl: url,
      };
      const summary3 = {
        content: 'Summary 3',
        options: {
          type: 'teaser' as const,
          length: 'medium' as const,
          format: 'markdown' as const,
        },
        stats: baseStats,
        timestamp: Date.now(),
        pageTitle: 'Example',
        pageUrl: url,
      };

      useSummaryStore.getState().addSummary(url, summary1);
      useSummaryStore.getState().addSummary(url, summary2);
      useSummaryStore.getState().addSummary(url, summary3);

      expect(
        useSummaryStore.getState().getSummary(url, summary1.options)?.content
      ).toBe('Summary 1');
      expect(
        useSummaryStore.getState().getSummary(url, summary2.options)?.content
      ).toBe('Summary 2');
      expect(
        useSummaryStore.getState().getSummary(url, summary3.options)?.content
      ).toBe('Summary 3');
    });

    it('should overwrite existing summary', () => {
      const url = 'https://example.com';
      const options = {
        type: 'key-points' as const,
        length: 'medium' as const,
        format: 'markdown' as const,
      };
      const baseStats = {
        originalWordCount: 100,
        summaryWordCount: 20,
        compressionRatio: 0.2,
        readingTime: 60,
        generatedAt: Date.now(),
      };

      const summary1 = {
        content: 'First',
        options,
        stats: baseStats,
        timestamp: Date.now(),
        pageTitle: 'Example',
        pageUrl: url,
      };
      const summary2 = {
        content: 'Second',
        options,
        stats: baseStats,
        timestamp: Date.now() + 1000,
        pageTitle: 'Example',
        pageUrl: url,
      };

      useSummaryStore.getState().addSummary(url, summary1);
      useSummaryStore.getState().addSummary(url, summary2);

      expect(useSummaryStore.getState().getSummary(url, options)?.content).toBe(
        'Second'
      );
    });

    it('should store summaries for different URLs', () => {
      const baseStats = {
        originalWordCount: 100,
        summaryWordCount: 20,
        compressionRatio: 0.2,
        readingTime: 60,
        generatedAt: Date.now(),
      };
      const options = {
        type: 'key-points' as const,
        length: 'medium' as const,
        format: 'markdown' as const,
      };

      const summary1 = {
        content: 'Summary A',
        options,
        stats: baseStats,
        timestamp: Date.now(),
        pageTitle: 'Site 1',
        pageUrl: 'https://site1.com',
      };
      const summary2 = {
        content: 'Summary B',
        options,
        stats: baseStats,
        timestamp: Date.now(),
        pageTitle: 'Site 2',
        pageUrl: 'https://site2.com',
      };

      useSummaryStore.getState().addSummary('https://site1.com', summary1);
      useSummaryStore.getState().addSummary('https://site2.com', summary2);

      expect(
        useSummaryStore.getState().getSummary('https://site1.com', options)
          ?.content
      ).toBe('Summary A');
      expect(
        useSummaryStore.getState().getSummary('https://site2.com', options)
          ?.content
      ).toBe('Summary B');
    });
  });

  describe('getSummary', () => {
    it('should return undefined for non-existent URL', () => {
      const options = {
        type: 'key-points' as const,
        length: 'medium' as const,
        format: 'markdown' as const,
      };
      const result = useSummaryStore
        .getState()
        .getSummary('https://fake.com', options);
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent summary type', () => {
      const url = 'https://example.com';
      const options1 = {
        type: 'key-points' as const,
        length: 'medium' as const,
        format: 'markdown' as const,
      };
      const options2 = {
        type: 'tldr' as const,
        length: 'short' as const,
        format: 'markdown' as const,
      };
      const summary = {
        content: 'Summary',
        options: options1,
        stats: {
          originalWordCount: 100,
          summaryWordCount: 20,
          compressionRatio: 0.2,
          readingTime: 60,
          generatedAt: Date.now(),
        },
        timestamp: Date.now(),
        pageTitle: 'Example',
        pageUrl: url,
      };

      useSummaryStore.getState().addSummary(url, summary);
      const result = useSummaryStore.getState().getSummary(url, options2);
      expect(result).toBeUndefined();
    });
  });

  describe('hasSummary', () => {
    it('should return false for non-existent summary', () => {
      const options = {
        type: 'key-points' as const,
        length: 'medium' as const,
        format: 'markdown' as const,
      };
      const result = useSummaryStore
        .getState()
        .hasSummary('https://fake.com', options);
      expect(result).toBe(false);
    });

    it('should return true for existing summary', () => {
      const url = 'https://example.com';
      const options = {
        type: 'key-points' as const,
        length: 'medium' as const,
        format: 'markdown' as const,
      };
      const summary = {
        content: 'Summary',
        options,
        stats: {
          originalWordCount: 100,
          summaryWordCount: 20,
          compressionRatio: 0.2,
          readingTime: 60,
          generatedAt: Date.now(),
        },
        timestamp: Date.now(),
        pageTitle: 'Example',
        pageUrl: url,
      };

      useSummaryStore.getState().addSummary(url, summary);
      const result = useSummaryStore.getState().hasSummary(url, options);
      expect(result).toBe(true);
    });
  });

  describe('clearSummaries', () => {
    it('should clear summaries for specific URL', () => {
      const options1 = {
        type: 'key-points' as const,
        length: 'medium' as const,
        format: 'markdown' as const,
      };
      const options2 = {
        type: 'tldr' as const,
        length: 'short' as const,
        format: 'markdown' as const,
      };
      const baseStats = {
        originalWordCount: 100,
        summaryWordCount: 20,
        compressionRatio: 0.2,
        readingTime: 60,
        generatedAt: Date.now(),
      };

      const summary1 = {
        content: 'Summary 1',
        options: options1,
        stats: baseStats,
        timestamp: Date.now(),
        pageTitle: 'Site 1',
        pageUrl: 'https://site1.com',
      };
      const summary2 = {
        content: 'Summary 2',
        options: options2,
        stats: baseStats,
        timestamp: Date.now(),
        pageTitle: 'Site 2',
        pageUrl: 'https://site2.com',
      };

      useSummaryStore.getState().addSummary('https://site1.com', summary1);
      useSummaryStore.getState().addSummary('https://site2.com', summary2);

      useSummaryStore.getState().clearSummaries('https://site1.com');

      expect(
        useSummaryStore.getState().getSummary('https://site1.com', options1)
      ).toBeUndefined();
      expect(
        useSummaryStore.getState().getSummary('https://site2.com', options2)
          ?.content
      ).toBe('Summary 2');
    });
  });

  describe('setActiveOptions', () => {
    it('should change active summary type', () => {
      useSummaryStore.getState().setActiveOptions({ type: 'tldr' });
      expect(useSummaryStore.getState().activeOptions.type).toBe('tldr');
    });

    it('should switch between types', () => {
      useSummaryStore.getState().setActiveOptions({ type: 'teaser' });
      expect(useSummaryStore.getState().activeOptions.type).toBe('teaser');

      useSummaryStore.getState().setActiveOptions({ type: 'headline' });
      expect(useSummaryStore.getState().activeOptions.type).toBe('headline');
    });

    it('should update length option', () => {
      useSummaryStore.getState().setActiveOptions({ length: 'long' });
      expect(useSummaryStore.getState().activeOptions.length).toBe('long');
    });

    it('should update format option', () => {
      useSummaryStore.getState().setActiveOptions({ format: 'plain-text' });
      expect(useSummaryStore.getState().activeOptions.format).toBe(
        'plain-text'
      );
    });
  });

  describe('persistence', () => {
    it('should persist summaries to localStorage', () => {
      const url = 'https://example.com';
      const summary = {
        content: 'Persisted',
        options: {
          type: 'key-points' as const,
          length: 'medium' as const,
          format: 'markdown' as const,
        },
        stats: {
          originalWordCount: 100,
          summaryWordCount: 20,
          compressionRatio: 0.2,
          readingTime: 60,
          generatedAt: Date.now(),
        },
        timestamp: Date.now(),
        pageTitle: 'Example',
        pageUrl: url,
      };

      useSummaryStore.getState().addSummary(url, summary);

      // Check localStorage
      const stored = localStorage.getItem('contentchat-summaries');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      const hash = useSummaryStore.getState().getOptionsHash(summary.options);
      expect(parsed.state.summaries[url][hash].content).toBe('Persisted');
    });
  });
});
