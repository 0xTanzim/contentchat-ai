/**
 * Writing Assistance Types
 * For Proofreader and Rewriter features
 */

import type { ProofreaderCorrection, ProofreadResult } from './chrome-ai.d';

/**
 * Proofreader types
 */
export interface ProofreaderHistoryItem {
  id: string;
  originalText: string;
  correctedText: string;
  corrections: ProofreaderCorrection[];
  timestamp: number;
  url?: string;
  applied: boolean;
}

export interface UseProofreaderReturn {
  proofread: (text: string) => Promise<void>;
  isProofreading: boolean;
  result: ProofreadResult | null;
  error: string | null;
  clear: () => void;
}

/**
 * Rewriter types
 */
export type RewritePreset =
  | 'formal'
  | 'casual'
  | 'shorter'
  | 'longer'
  | 'custom';

export interface RewriteRequest {
  text: string;
  preset: RewritePreset;
  customOptions?: {
    tone?: 'more-formal' | 'more-casual' | 'as-is';
    length?: 'shorter' | 'as-is' | 'longer';
    format?: 'as-is' | 'markdown' | 'plain-text';
  };
  context?: string;
}

export interface RewriterHistoryItem {
  id: string;
  originalText: string;
  rewrittenText: string;
  preset: RewritePreset;
  timestamp: number;
  url?: string;
  applied: boolean;
}

export interface UseRewriterReturn {
  rewrite: (request: RewriteRequest) => Promise<void>;
  isRewriting: boolean;
  result: string | null;
  error: string | null;
  clear: () => void;
}

/**
 * Context menu types
 */
export interface SelectionContext {
  text: string;
  elementId?: string;
  isEditable: boolean;
  rect: DOMRect;
}

/**
 * Writing Store types
 */
export interface WritingPreferences {
  autoProofread: boolean;
  defaultRewritePreset: RewritePreset;
  showExplanations: boolean;
  highlightErrors: boolean;
}

export interface WritingState {
  // History
  proofreaderHistory: ProofreaderHistoryItem[];
  rewriterHistory: RewriterHistoryItem[];

  // Preferences
  preferences: WritingPreferences;

  // Actions
  addProofreaderHistory: (
    item: Omit<ProofreaderHistoryItem, 'id' | 'timestamp'>
  ) => void;
  addRewriterHistory: (
    item: Omit<RewriterHistoryItem, 'id' | 'timestamp'>
  ) => void;
  clearHistory: (type: 'proofreader' | 'rewriter' | 'all') => void;
  updatePreferences: (updates: Partial<WritingPreferences>) => void;

  // Queries
  getRecentProofreading: (limit?: number) => ProofreaderHistoryItem[];
  getRecentRewrites: (limit?: number) => RewriterHistoryItem[];
}
