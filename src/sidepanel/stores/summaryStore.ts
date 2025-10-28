/**
 * Summary Store - Manages page summarization state
 * Handles different summary types, options, caching, and stats
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SummaryType = 'key-points' | 'tldr' | 'teaser' | 'headline';
export type SummaryLength = 'short' | 'medium' | 'long';
export type SummaryFormat = 'markdown' | 'plain-text';

export interface SummaryOptions {
  type: SummaryType;
  length: SummaryLength;
  format: SummaryFormat;
  context?: string;
  outputLanguage?: string;
}

export interface SummaryStats {
  originalWordCount: number;
  summaryWordCount: number;
  compressionRatio: number;
  readingTime: number; // in seconds
  generatedAt: number;
}

export interface Summary {
  content: string;
  options: SummaryOptions;
  stats: SummaryStats;
}

interface SummaryState {
  // Current summaries (by URL and options hash)
  summaries: Record<string, Record<string, Summary>>;

  // Active summary options
  activeOptions: SummaryOptions;
  setActiveOptions: (options: Partial<SummaryOptions>) => void;

  // Add summary with stats
  addSummary: (url: string, summary: Summary) => void;

  // Get summary by options
  getSummary: (url: string, options: SummaryOptions) => Summary | undefined;

  // Check if summary exists
  hasSummary: (url: string, options: SummaryOptions) => boolean;

  // Get all summaries for URL
  getAllSummaries: (url: string) => Summary[];

  // Clear summaries for URL
  clearSummaries: (url: string) => void;

  // Clear all
  clearAll: () => void;

  // Generate options hash
  getOptionsHash: (options: SummaryOptions) => string;
}

// Helper to generate unique hash for options
function generateOptionsHash(options: SummaryOptions): string {
  return `${options.type}-${options.length}-${options.format}${
    options.context ? '-ctx' : ''
  }${options.outputLanguage ? `-${options.outputLanguage}` : ''}`;
}

export const useSummaryStore = create<SummaryState>()(
  persist(
    (set, get) => ({
      summaries: {},
      activeOptions: {
        type: 'key-points',
        length: 'medium',
        format: 'markdown',
      },

      setActiveOptions: (options) =>
        set((state) => ({
          activeOptions: { ...state.activeOptions, ...options },
        })),

      addSummary: (url, summary) =>
        set((state) => {
          const hash = generateOptionsHash(summary.options);
          return {
            summaries: {
              ...state.summaries,
              [url]: {
                ...state.summaries[url],
                [hash]: summary,
              },
            },
          };
        }),

      getSummary: (url, options) => {
        const state = get();
        const hash = generateOptionsHash(options);
        return state.summaries[url]?.[hash];
      },

      hasSummary: (url, options) => {
        const state = get();
        const hash = generateOptionsHash(options);
        return !!state.summaries[url]?.[hash];
      },

      getAllSummaries: (url) => {
        const state = get();
        return Object.values(state.summaries[url] || {});
      },

      clearSummaries: (url) =>
        set((state) => {
          const { [url]: _, ...rest } = state.summaries;
          return { summaries: rest };
        }),

      clearAll: () => set({ summaries: {} }),

      getOptionsHash: (options) => generateOptionsHash(options),
    }),
    {
      name: 'contentchat-summaries',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        summaries: state.summaries,
        activeOptions: state.activeOptions,
      }),
    }
  )
);
