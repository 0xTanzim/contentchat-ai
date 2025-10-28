/**
 * Unit tests for app store
 * @file src/sidepanel/stores/appStore.test.ts
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { PageContent } from '../../types/chrome-ai';
import { useAppStore } from './appStore';

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentPage: null,
      isLoading: false,
      error: null,
      aiAvailable: false,
      activeView: 'summary',
    });
  });

  it('should have initial state', () => {
    const state = useAppStore.getState();

    expect(state.currentPage).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.aiAvailable).toBe(false);
    expect(state.activeView).toBe('summary');
  });

  describe('setCurrentPage', () => {
    it('should set current page', () => {
      const mockPage: PageContent = {
        title: 'Test Page',
        url: 'https://example.com',
        content: 'Test content',
        language: 'en',
      };

      useAppStore.getState().setCurrentPage(mockPage);

      expect(useAppStore.getState().currentPage).toEqual(mockPage);
    });

    it('should clear current page with null', () => {
      const mockPage: PageContent = {
        title: 'Test',
        url: 'https://example.com',
        content: 'Content',
        language: 'en',
      };

      useAppStore.getState().setCurrentPage(mockPage);
      useAppStore.getState().setCurrentPage(null);

      expect(useAppStore.getState().currentPage).toBeNull();
    });
  });

  describe('setIsLoading', () => {
    it('should set loading state to true', () => {
      useAppStore.getState().setIsLoading(true);
      expect(useAppStore.getState().isLoading).toBe(true);
    });

    it('should set loading state to false', () => {
      useAppStore.getState().setIsLoading(true);
      useAppStore.getState().setIsLoading(false);
      expect(useAppStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Something went wrong';

      useAppStore.getState().setError(errorMessage);

      expect(useAppStore.getState().error).toBe(errorMessage);
    });

    it('should clear error with null', () => {
      useAppStore.getState().setError('Error');
      useAppStore.getState().setError(null);

      expect(useAppStore.getState().error).toBeNull();
    });
  });

  describe('setAiAvailable', () => {
    it('should set AI availability to true', () => {
      useAppStore.getState().setAiAvailable(true);
      expect(useAppStore.getState().aiAvailable).toBe(true);
    });

    it('should set AI availability to false', () => {
      useAppStore.getState().setAiAvailable(true);
      useAppStore.getState().setAiAvailable(false);
      expect(useAppStore.getState().aiAvailable).toBe(false);
    });
  });

  describe('setActiveView', () => {
    it('should change active view to chat', () => {
      useAppStore.getState().setActiveView('chat');
      expect(useAppStore.getState().activeView).toBe('chat');
    });

    it('should change active view to translate', () => {
      useAppStore.getState().setActiveView('translate');
      expect(useAppStore.getState().activeView).toBe('translate');
    });

    it('should change active view to library', () => {
      useAppStore.getState().setActiveView('library');
      expect(useAppStore.getState().activeView).toBe('library');
    });

    it('should switch between views', () => {
      useAppStore.getState().setActiveView('chat');
      expect(useAppStore.getState().activeView).toBe('chat');

      useAppStore.getState().setActiveView('summary');
      expect(useAppStore.getState().activeView).toBe('summary');
    });
  });
});
