/**
 * Summary Store - Manages page summarization state
 * Handles different summary types, options, caching, and stats
 */

import { createLogger } from '@/lib/logger';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const logger = createLogger('SummaryStore');

export type SummaryType = 'key-points' | 'tldr' | 'teaser' | 'headline';
export type SummaryLength = 'short' | 'medium' | 'long';
export type SummaryFormat = 'markdown' | 'plain-text';
export type DetailLevel = 'brief' | 'standard' | 'detailed' | 'comprehensive';

export interface SummaryOptions {
  type: SummaryType;
  length: SummaryLength;
  format: SummaryFormat;
  detailLevel?: DetailLevel;
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
  timestamp: number; // When summary was created
  pageTitle: string; // Page title for history display
  pageUrl: string; // Full URL for navigation
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

  // History management
  getAllHistory: () => Summary[];
  getRecentHistory: (limit?: number) => Summary[];
  cleanupOldHistory: (maxAgeDays?: number) => void;
  deleteHistoryItem: (url: string, timestamp: number) => void;
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
        detailLevel: 'standard',
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

      // Get all summaries across all URLs (for history view)
      getAllHistory: () => {
        const state = get();
        const allSummaries: Summary[] = [];

        Object.values(state.summaries).forEach((urlSummaries) => {
          Object.values(urlSummaries).forEach((summary) => {
            allSummaries.push(summary);
          });
        });

        // Sort by timestamp (newest first)
        return allSummaries.sort((a, b) => b.timestamp - a.timestamp);
      },

      // Get recent history with optional limit
      getRecentHistory: (limit = 50) => {
        const state = get();
        return state.getAllHistory().slice(0, limit);
      },

      // Auto-cleanup old history (default: 30 days)
      cleanupOldHistory: (maxAgeDays = 30) => {
        const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // Convert days to ms
        const cutoffTime = Date.now() - maxAge;

        set((state) => {
          const cleanedSummaries: Record<string, Record<string, Summary>> = {};

          Object.entries(state.summaries).forEach(([url, urlSummaries]) => {
            const validSummaries: Record<string, Summary> = {};

            Object.entries(urlSummaries).forEach(([hash, summary]) => {
              // Keep summaries newer than cutoff
              if (summary.timestamp > cutoffTime) {
                validSummaries[hash] = summary;
              }
            });

            // Only keep URL if it has valid summaries
            if (Object.keys(validSummaries).length > 0) {
              cleanedSummaries[url] = validSummaries;
            }
          });

          logger.info(`🧹 Cleaned up history older than ${maxAgeDays} days`);
          return { summaries: cleanedSummaries };
        });
      },

      // Delete specific history item
      deleteHistoryItem: (url, timestamp) => {
        set((state) => {
          const urlSummaries = state.summaries[url];
          if (!urlSummaries) return state;

          const updatedUrlSummaries: Record<string, Summary> = {};

          Object.entries(urlSummaries).forEach(([hash, summary]) => {
            if (summary.timestamp !== timestamp) {
              updatedUrlSummaries[hash] = summary;
            }
          });

          // If no summaries left for URL, remove URL entry
          if (Object.keys(updatedUrlSummaries).length === 0) {
            const { [url]: _, ...rest } = state.summaries;
            return { summaries: rest };
          }

          return {
            summaries: {
              ...state.summaries,
              [url]: updatedUrlSummaries,
            },
          };
        });
      },
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
