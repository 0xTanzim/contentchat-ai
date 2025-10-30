/**
 * Chrome Built-in AI Type Definitions
 * Based on official Chrome docs: https://developer.chrome.com/docs/ai/built-in-apis
 */

// Global AI constructors (Chrome 138+)
declare global {
  const LanguageModel: LanguageModelConstructor;
  const Summarizer: SummarizerConstructor;
  const Translator: TranslatorConstructor;
  const LanguageDetector: LanguageDetectorConstructor;
  const Proofreader: ProofreaderConstructor;
  const Rewriter: RewriterConstructor;

  interface Window {
    LanguageModel?: LanguageModelConstructor;
    Summarizer?: SummarizerConstructor;
    Translator?: TranslatorConstructor;
    LanguageDetector?: LanguageDetectorConstructor;
    // Newer window.ai namespace (Chrome 140+)
    ai?: {
      languageModel?: LanguageModelConstructor;
      summarizer?: SummarizerConstructor;
      translator?: TranslatorConstructor;
      languageDetector?: LanguageDetectorConstructor;
      proofreader?: ProofreaderConstructor;
      rewriter?: RewriterConstructor;
    };
  }
}

// Global constructors for Chrome Built-in AI APIs
interface LanguageModelConstructor {
  availability(): Promise<'available' | 'after-download' | 'unavailable'>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModel>;
  params(): Promise<{
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
    maxTemperature: number;
  }>;
}

interface LanguageModelCreateOptions {
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
  monitor?: (monitor: DownloadMonitor) => void;
  expectedInputs?: Array<{ type: string; languages: string[] }>;
  expectedOutputs?: Array<{ type: string; languages: string[] }>;
  initialPrompts?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

interface DownloadMonitor extends EventTarget {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: DownloadProgressEvent) => void
  ): void;
}

interface DownloadProgressEvent extends Event {
  loaded: number;
  total: number;
}

// Language Model (Prompt API) - Chrome 138+
interface LanguageModel {
  prompt(input: string, options?: PromptOptions): Promise<string>;
  promptStreaming(
    input: string,
    options?: PromptOptions
  ): ReadableStream<string>;
  append(
    prompts: Array<{
      role: 'user' | 'assistant';
      content: string | Array<{ type: string; value: any }>;
    }>
  ): Promise<void>;
  clone(options?: { signal?: AbortSignal }): Promise<LanguageModel>;
  destroy(): void;
  readonly inputUsage: number;
  readonly inputQuota: number;
}

interface PromptOptions {
  signal?: AbortSignal;
  responseConstraint?: any; // JSON Schema for structured output
  omitResponseConstraintInput?: boolean;
}

// Summarizer API - Chrome 138+
interface SummarizerConstructor {
  availability(): Promise<'available' | 'after-download' | 'unavailable'>;
  create(options?: SummarizerOptions): Promise<Summarizer>;
}

interface TranslatorConstructor {
  availability(): Promise<'available' | 'after-download' | 'unavailable'>;
  create(options: TranslatorOptions): Promise<Translator>;
}

interface LanguageDetectorConstructor {
  availability(): Promise<'available' | 'after-download' | 'unavailable'>;
  create(): Promise<LanguageDetector>;
}

// Proofreader API - Chrome 141+
interface ProofreaderConstructor {
  availability(): Promise<'available' | 'after-download' | 'unavailable'>;
  create(options?: ProofreaderOptions): Promise<Proofreader>;
}

interface ProofreaderOptions {
  expectedInputLanguages?: string[];
  signal?: AbortSignal;
  monitor?: (monitor: DownloadMonitor) => void;
}

interface Proofreader {
  proofread(text: string): Promise<ProofreadResult>;
  destroy(): void;
}

interface SummarizerOptions {
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
  sharedContext?: string;
  signal?: AbortSignal;
  monitor?: (monitor: DownloadMonitor) => void;
  expectedInputLanguages?: string[];
  outputLanguage?: string;
  expectedContextLanguages?: string[];
}

interface Summarizer {
  summarize(input: string, options?: { context?: string }): Promise<string>;
  summarizeStreaming(
    input: string,
    options?: { context?: string }
  ): ReadableStream<string>;
  destroy(): void;
}

// Translator API - Chrome 138+
interface TranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
  signal?: AbortSignal;
  monitor?: (monitor: DownloadMonitor) => void;
}

interface Translator {
  translate(input: string): Promise<string>;
  destroy(): void;
}

// Language Detector API - Chrome 138+

interface LanguageDetector {
  detect(input: string): Promise<LanguageDetectionResult[]>;
  destroy(): void;
}

interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
}

export type {
  DownloadMonitor,
  DownloadProgressEvent,
  LanguageDetectionResult,
  LanguageDetector,
  LanguageDetectorConstructor,
  LanguageModel,
  LanguageModelConstructor,
  LanguageModelCreateOptions,
  PromptOptions,
  ProofreadResult,
  Proofreader,
  ProofreaderConstructor,
  ProofreaderCorrection,
  ProofreaderOptions,
  RewriteFormat,
  RewriteLength,
  RewriteTone,
  Rewriter,
  RewriterConstructor,
  RewriterOptions,
  Summarizer,
  SummarizerConstructor,
  SummarizerOptions,
  Translator,
  TranslatorConstructor,
  TranslatorOptions,
};
interface ProofreadResult {
  corrected: string;
  corrections: ProofreaderCorrection[];
}

interface ProofreaderCorrection {
  startIndex: number;
  endIndex: number;
  correctionType: 'grammar' | 'spelling' | 'punctuation';
  originalText: string;
  correctedText: string;
  explanation?: string;
}

// Rewriter API - Chrome 137+
interface RewriterConstructor {
  availability(): Promise<'available' | 'after-download' | 'unavailable'>;
  create(options?: RewriterOptions): Promise<Rewriter>;
}

export type RewriteTone = 'more-formal' | 'more-casual' | 'as-is';
export type RewriteFormat = 'as-is' | 'markdown' | 'plain-text';
export type RewriteLength = 'shorter' | 'as-is' | 'longer';

interface RewriterOptions {
  tone?: RewriteTone;
  format?: RewriteFormat;
  length?: RewriteLength;
  sharedContext?: string;
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  signal?: AbortSignal;
  monitor?: (monitor: DownloadMonitor) => void;
}

interface Rewriter {
  rewrite(text: string, options?: { context?: string }): Promise<string>;
  rewriteStreaming(
    text: string,
    options?: { context?: string }
  ): ReadableStream<string>;
  destroy(): void;
}

export type {
  DownloadMonitor,
  DownloadProgressEvent,
  LanguageDetectionResult,
  LanguageDetector,
  LanguageDetectorConstructor,
  LanguageModel,
  LanguageModelConstructor,
  LanguageModelCreateOptions,
  PromptOptions,
  Summarizer,
  SummarizerConstructor,
  SummarizerOptions,
  Translator,
  TranslatorConstructor,
  TranslatorOptions,
};
