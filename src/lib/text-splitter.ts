/**
 * Recursive Text Splitter
 * Based on LangChain.js RecursiveCharacterTextSplitter
 * Splits text intelligently at paragraph/sentence boundaries
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('TextSplitter');

export interface TextSplitterOptions {
  /** Maximum number of characters per chunk */
  chunkSize?: number;
  /** Number of overlapping characters between chunks for context preservation */
  chunkOverlap?: number;
  /** Separators to try (in order of priority) */
  separators?: string[];
}

/**
 * Default separators in order of preference:
 * 1. Double newline (paragraph breaks)
 * 2. Single newline
 * 3. Space (word boundary)
 * 4. Empty string (character split as last resort)
 */
const DEFAULT_SEPARATORS = ['\n\n', '\n', ' ', ''];

/**
 * Recursive Text Splitter
 * Intelligently splits text while preserving context and avoiding mid-sentence/word cuts
 */
export class RecursiveTextSplitter {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly separators: string[];

  constructor(options: TextSplitterOptions = {}) {
    this.chunkSize = options.chunkSize ?? 3000; // ~750 tokens (4 chars per token average)
    this.chunkOverlap = options.chunkOverlap ?? 200; // Preserve context between chunks
    this.separators = options.separators ?? DEFAULT_SEPARATORS;

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('chunkOverlap must be less than chunkSize');
    }

    logger.info(
      `Initialized TextSplitter: chunkSize=${this.chunkSize}, chunkOverlap=${this.chunkOverlap}`
    );
  }

  /**
   * Split text into chunks using recursive approach
   */
  splitText(text: string): string[] {
    if (!text || text.length === 0) {
      return [];
    }

    if (text.length <= this.chunkSize) {
      return [text];
    }

    logger.info(`Splitting text of ${text.length} characters`);
    const chunks = this._recursiveSplit(text, this.separators);
    logger.info(`Created ${chunks.length} chunks`);

    return chunks;
  }

  /**
   * Recursively split text using different separators
   */
  private _recursiveSplit(text: string, separators: string[]): string[] {
    // Base case: no separators left, force split by character
    if (separators.length === 0) {
      return this._splitBySize(text);
    }

    const [separator, ...remainingSeparators] = separators;
    const splits = text.split(separator);

    const chunks: string[] = [];
    let currentChunk = '';

    for (let i = 0; i < splits.length; i++) {
      const piece = splits[i];

      // Re-add separator (except for last piece and empty separator)
      const textToAdd =
        separator && i < splits.length - 1 ? piece + separator : piece;

      // If adding this piece would exceed chunk size
      if (currentChunk.length + textToAdd.length > this.chunkSize) {
        if (currentChunk.length > 0) {
          // Save current chunk
          chunks.push(currentChunk.trim());

          // Add overlap from end of previous chunk
          const overlapStart = Math.max(
            0,
            currentChunk.length - this.chunkOverlap
          );
          currentChunk = currentChunk.slice(overlapStart);
        }

        // If single piece is too large, split it recursively with next separator
        if (textToAdd.length > this.chunkSize) {
          const recursiveSplits = this._recursiveSplit(
            textToAdd,
            remainingSeparators
          );
          chunks.push(...recursiveSplits.slice(0, -1)); // Add all but last
          currentChunk += recursiveSplits[recursiveSplits.length - 1] || ''; // Keep last for continuation
        } else {
          currentChunk += textToAdd;
        }
      } else {
        currentChunk += textToAdd;
      }
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }

  /**
   * Force split by character size (last resort)
   */
  private _splitBySize(text: string): string[] {
    const chunks: string[] = [];
    let i = 0;

    while (i < text.length) {
      const end = Math.min(i + this.chunkSize, text.length);
      chunks.push(text.slice(i, end));
      i += this.chunkSize - this.chunkOverlap;
    }

    return chunks;
  }

  /**
   * Get approximate token count (4 chars per token average)
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get word count
   */
  static countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}
