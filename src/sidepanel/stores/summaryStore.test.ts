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
      activeSummaryType: 'key-points',
    });
  });

  it('should have initial state', () => {
    const state = useSummaryStore.getState();

    expect(state.summaries).toEqual({});
    expect(state.activeSummaryType).toBe('key-points');
  });

  describe('addSummary', () => {
    it('should add a summary for a URL', () => {
      const url = 'https://example.com';
      const summary = 'This is a summary';

      useSummaryStore.getState().addSummary(url, 'key-points', summary);

      const stored = useSummaryStore.getState().getSummary(url, 'key-points');
      expect(stored).toBe(summary);
    });

    it('should store multiple summary types for same URL', () => {
      const url = 'https://example.com';

      useSummaryStore.getState().addSummary(url, 'key-points', 'Summary 1');
      useSummaryStore.getState().addSummary(url, 'tl;dr', 'Summary 2');
      useSummaryStore.getState().addSummary(url, 'teaser', 'Summary 3');

      expect(useSummaryStore.getState().getSummary(url, 'key-points')).toBe(
        'Summary 1'
      );
      expect(useSummaryStore.getState().getSummary(url, 'tl;dr')).toBe(
        'Summary 2'
      );
      expect(useSummaryStore.getState().getSummary(url, 'teaser')).toBe(
        'Summary 3'
      );
    });

    it('should overwrite existing summary', () => {
      const url = 'https://example.com';

      useSummaryStore.getState().addSummary(url, 'key-points', 'First');
      useSummaryStore.getState().addSummary(url, 'key-points', 'Second');

      expect(useSummaryStore.getState().getSummary(url, 'key-points')).toBe(
        'Second'
      );
    });

    it('should store summaries for different URLs', () => {
      useSummaryStore
        .getState()
        .addSummary('https://site1.com', 'key-points', 'Summary A');
      useSummaryStore
        .getState()
        .addSummary('https://site2.com', 'key-points', 'Summary B');

      expect(
        useSummaryStore.getState().getSummary('https://site1.com', 'key-points')
      ).toBe('Summary A');
      expect(
        useSummaryStore.getState().getSummary('https://site2.com', 'key-points')
      ).toBe('Summary B');
    });
  });

  describe('getSummary', () => {
    it('should return undefined for non-existent URL', () => {
      const result = useSummaryStore
        .getState()
        .getSummary('https://fake.com', 'key-points');
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent summary type', () => {
      useSummaryStore
        .getState()
        .addSummary('https://example.com', 'key-points', 'Summary');
      const result = useSummaryStore
        .getState()
        .getSummary('https://example.com', 'tl;dr');
      expect(result).toBeUndefined();
    });
  });

  describe('hasSummary', () => {
    it('should return false for non-existent summary', () => {
      const result = useSummaryStore
        .getState()
        .hasSummary('https://fake.com', 'key-points');
      expect(result).toBe(false);
    });

    it('should return true for existing summary', () => {
      useSummaryStore
        .getState()
        .addSummary('https://example.com', 'key-points', 'Summary');
      const result = useSummaryStore
        .getState()
        .hasSummary('https://example.com', 'key-points');
      expect(result).toBe(true);
    });
  });

  describe('clearSummaries', () => {
    it('should clear summaries for specific URL', () => {
      useSummaryStore
        .getState()
        .addSummary('https://site1.com', 'key-points', 'Summary 1');
      useSummaryStore
        .getState()
        .addSummary('https://site2.com', 'tl;dr', 'Summary 2');

      useSummaryStore.getState().clearSummaries('https://site1.com');

      expect(
        useSummaryStore.getState().getSummary('https://site1.com', 'key-points')
      ).toBeUndefined();
      expect(
        useSummaryStore.getState().getSummary('https://site2.com', 'tl;dr')
      ).toBe('Summary 2');
    });
  });

  describe('setActiveSummaryType', () => {
    it('should change active summary type', () => {
      useSummaryStore.getState().setActiveSummaryType('tl;dr');
      expect(useSummaryStore.getState().activeSummaryType).toBe('tl;dr');
    });

    it('should switch between types', () => {
      useSummaryStore.getState().setActiveSummaryType('teaser');
      expect(useSummaryStore.getState().activeSummaryType).toBe('teaser');

      useSummaryStore.getState().setActiveSummaryType('headline');
      expect(useSummaryStore.getState().activeSummaryType).toBe('headline');
    });
  });

  describe('persistence', () => {
    it('should persist summaries to localStorage', () => {
      useSummaryStore
        .getState()
        .addSummary('https://example.com', 'key-points', 'Persisted');

      // Check localStorage
      const stored = localStorage.getItem('contentchat-summaries');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.summaries['https://example.com']['key-points']).toBe(
        'Persisted'
      );
    });
  });
});
