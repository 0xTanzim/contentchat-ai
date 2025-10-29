/**
 * Writing Store
 * Manages proofreader and rewriter history and preferences
 */

import type {
  ProofreaderHistoryItem,
  RewriterHistoryItem,
  WritingPreferences,
  WritingState,
} from '@/types/writing.types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES: WritingPreferences = {
  autoProofread: false,
  defaultRewritePreset: 'formal',
  showExplanations: true,
  highlightErrors: true,
};

/**
 * Writing store implementation
 */
export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => ({
      // Initial state
      proofreaderHistory: [],
      rewriterHistory: [],
      preferences: DEFAULT_PREFERENCES,

      // Actions
      addProofreaderHistory: (
        item: Omit<ProofreaderHistoryItem, 'id' | 'timestamp'>
      ) => {
        const newItem: ProofreaderHistoryItem = {
          ...item,
          id: `proofread_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          proofreaderHistory: [newItem, ...state.proofreaderHistory].slice(
            0,
            100
          ), // Keep last 100
        }));
      },

      addRewriterHistory: (
        item: Omit<RewriterHistoryItem, 'id' | 'timestamp'>
      ) => {
        const newItem: RewriterHistoryItem = {
          ...item,
          id: `rewrite_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          rewriterHistory: [newItem, ...state.rewriterHistory].slice(0, 100), // Keep last 100
        }));
      },

      clearHistory: (type: 'proofreader' | 'rewriter' | 'all') => {
        set(() => {
          if (type === 'all') {
            return {
              proofreaderHistory: [],
              rewriterHistory: [],
            };
          }
          if (type === 'proofreader') {
            return { proofreaderHistory: [] };
          }
          return { rewriterHistory: [] };
        });
      },

      updatePreferences: (updates: Partial<WritingPreferences>) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...updates,
          },
        }));
      },

      // Queries
      getRecentProofreading: (limit = 10) => {
        return get().proofreaderHistory.slice(0, limit);
      },

      getRecentRewrites: (limit = 10) => {
        return get().rewriterHistory.slice(0, limit);
      },
    }),
    {
      name: 'contentchat-writing',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        proofreaderHistory: state.proofreaderHistory,
        rewriterHistory: state.rewriterHistory,
        preferences: state.preferences,
      }),
    }
  )
);
