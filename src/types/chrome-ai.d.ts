/**
 * Chrome Built-in AI Type Definitions
 * Based on Chrome's Prompt API, Summarizer API, Translator API, Language Detector API
 */

// Window interface with AI capabilities
declare global {
  interface Window {
    ai?: {
      languageModel?: LanguageModelFactory;
      summarizer?: SummarizerFactory;
      translator?: TranslatorFactory;
      languageDetector?: LanguageDetectorFactory;
    };
  }
}

// Language Model (Prompt API)
interface LanguageModelFactory {
  create(options?: LanguageModelOptions): Promise<LanguageModel>;
  capabilities(): Promise<LanguageModelCapabilities>;
}

interface LanguageModelOptions {
  temperature?: number;
  topK?: number;
}

interface LanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
}

interface LanguageModel {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

// Summarizer API
interface SummarizerFactory {
  create(options?: SummarizerOptions): Promise<Summarizer>;
  capabilities(): Promise<SummarizerCapabilities>;
}

interface SummarizerOptions {
  type?: 'key-points' | 'tl;dr' | 'teaser' | 'headline';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
  sharedContext?: string;
}

interface SummarizerCapabilities {
  available: 'readily' | 'after-download' | 'no';
  supportsType(type: string): boolean;
  supportsFormat(format: string): boolean;
  supportsLength(length: string): boolean;
}

interface Summarizer {
  summarize(input: string, options?: { context?: string }): Promise<string>;
  summarizeStreaming(
    input: string,
    options?: { context?: string }
  ): ReadableStream<string>;
  destroy(): void;
}

// Translator API
interface TranslatorFactory {
  create(options: TranslatorOptions): Promise<Translator>;
  capabilities(): Promise<TranslatorCapabilities>;
}

interface TranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslatorCapabilities {
  available: 'readily' | 'after-download' | 'no';
  supportsLanguagePair(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<'readily' | 'after-download' | 'no'>;
}

interface Translator {
  translate(input: string): Promise<string>;
  destroy(): void;
}

// Language Detector API
interface LanguageDetectorFactory {
  create(): Promise<LanguageDetector>;
  capabilities(): Promise<LanguageDetectorCapabilities>;
}

interface LanguageDetectorCapabilities {
  available: 'readily' | 'after-download' | 'no';
  supportsLanguage(language: string): boolean;
}

interface LanguageDetector {
  detect(input: string): Promise<LanguageDetectionResult[]>;
  destroy(): void;
}

interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
}

export type {
  LanguageDetectionResult,
  LanguageDetector,
  LanguageDetectorCapabilities,
  LanguageDetectorFactory,
  LanguageModel,
  LanguageModelCapabilities,
  LanguageModelFactory,
  LanguageModelOptions,
  Summarizer,
  SummarizerCapabilities,
  SummarizerFactory,
  SummarizerOptions,
  Translator,
  TranslatorCapabilities,
  TranslatorFactory,
  TranslatorOptions,
};
