/**
 * Summary Store - Manages page summarization state
 * Handles different summary types and caching
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SummaryType = 'key-points' | 'tl;dr' | 'teaser' | 'headline';

export interface Summary {
  type: SummaryType;
  content: string;
  url: string;
  createdAt: number;
}

interface SummaryState {
  // Current summaries (by URL and type)
  summaries: Record<string, Record<SummaryType, string>>;

  // Active summary type
  activeSummaryType: SummaryType;
  setActiveSummaryType: (type: SummaryType) => void;

  // Add summary
  addSummary: (url: string, type: SummaryType, content: string) => void;

  // Get summary
  getSummary: (url: string, type: SummaryType) => string | undefined;

  // Check if summary exists
  hasSummary: (url: string, type: SummaryType) => boolean;

  // Clear summaries for URL
  clearSummaries: (url: string) => void;

  // Clear all
  clearAll: () => void;
}

export const useSummaryStore = create<SummaryState>()(
  persist(
    (set, get) => ({
      summaries: {},
      activeSummaryType: 'key-points',

      setActiveSummaryType: (type) => set({ activeSummaryType: type }),

      addSummary: (url, type, content) =>
        set((state) => ({
          summaries: {
            ...state.summaries,
            [url]: {
              ...state.summaries[url],
              [type]: content,
            },
          },
        })),

      getSummary: (url, type) => {
        const state = get();
        return state.summaries[url]?.[type];
      },

      hasSummary: (url, type) => {
        const state = get();
        return !!state.summaries[url]?.[type];
      },

      clearSummaries: (url) =>
        set((state) => {
          const { [url]: _, ...rest } = state.summaries;
          return { summaries: rest };
        }),

      clearAll: () => set({ summaries: {} }),
    }),
    {
      name: 'contentchat-summaries',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ summaries: state.summaries }),
    }
  )
);
