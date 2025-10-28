/**
 * App Store - Global application state
 * Manages loading states, errors, and current page info
 */

import type { PageContent } from '@/lib/page-content';
import { create } from 'zustand';

interface AppState {
  // Current page
  currentPage: PageContent | null;
  setCurrentPage: (page: PageContent | null) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;

  // AI availability
  aiAvailable: boolean;
  setAiAvailable: (available: boolean) => void;

  // Active view
  activeView: 'summary' | 'chat' | 'translate' | 'library';
  setActiveView: (view: 'summary' | 'chat' | 'translate' | 'library') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Current page
  currentPage: null,
  setCurrentPage: (page) => set({ currentPage: page }),

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Error handling
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // AI availability
  aiAvailable: false,
  setAiAvailable: (available) => set({ aiAvailable: available }),

  // Active view
  activeView: 'summary',
  setActiveView: (view) => set({ activeView: view }),
}));
