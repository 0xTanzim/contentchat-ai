/**
 * Writer API Wrapper
 * Generate new content based on prompts and context
 * Reference: https://developer.chrome.com/docs/ai/writer-api
 */

import { createLogger } from '@/lib/logger';
import type { AIAvailability, Writer, WriterOptions } from '@/types/chrome-ai';

const logger = createLogger('Writer');

/**
 * Check Writer API availability
 * Per official docs: Use 'Writer' in self (global scope)
 */
export async function checkWriterAvailability(): Promise<AIAvailability> {
  try {
    if (!('Writer' in self)) {
      logger.warn('Writer API not available in this browser');
      return 'no';
    }

    const availability = await (self as any).Writer.availability();
    logger.debug('Writer availability:', availability);
    return availability;
  } catch (error) {
    logger.error('Failed to check Writer availability:', error);
    return 'no';
  }
}

/**
 * Create a Writer instance
 * Per official docs: Writer.create() with options
 */
export async function createWriter(options?: WriterOptions): Promise<Writer> {
  const availability = await checkWriterAvailability();

  if (availability === 'no' || availability === 'unavailable') {
    throw new Error(
      'Writer API not available. Please:\n' +
        '1. Update to Chrome 137+\n' +
        '2. Enable chrome://flags/#writer-api-for-gemini-nano\n' +
        '3. Restart Chrome'
    );
  }

  // Require user activation if model needs download
  if (availability === 'after-download') {
    if (!navigator.userActivation?.isActive) {
      throw new Error('User activation required to download AI model');
    }
  }

  try {
    // Per official docs: https://developer.chrome.com/docs/ai/writer-api
    // Writer.create() accepts: tone, format, length, sharedContext, expectedInputLanguages, expectedContextLanguages, outputLanguage
    const writerOptions: any = {
      tone: options?.tone || 'neutral', // 'formal' | 'neutral' | 'casual'
      format: options?.format || 'markdown', // 'plain-text' | 'markdown' (default: markdown)
      length: options?.length || 'short', // 'short' | 'medium' | 'long' (default: short)
      expectedInputLanguages: options?.expectedInputLanguages || ['en'],
      expectedContextLanguages: options?.expectedContextLanguages || ['en'],
      outputLanguage: options?.outputLanguage || 'en',
      sharedContext: options?.sharedContext,
      signal: options?.signal,
      monitor:
        options?.monitor ||
        ((m: any) => {
          m.addEventListener('downloadprogress', (e: any) => {
            logger.info(
              `Writer model: Downloaded ${(e.loaded * 100).toFixed(1)}%`
            );
          });
        }),
    };

    const writer = await (self as any).Writer.create(writerOptions);
    logger.debug('Writer created successfully');
    return writer;
  } catch (error) {
    logger.error('Failed to create Writer:', error);
    throw new Error(
      'Failed to initialize Writer. Please check Chrome AI settings and try again.'
    );
  }
}

/**
 * Write text (non-streaming)
 * Returns complete output when generation is finished
 */
export async function writeText(
  prompt: string,
  options?: {
    context?: string;
    tone?: 'formal' | 'neutral' | 'casual';
    length?: 'short' | 'medium' | 'long';
    format?: 'plain-text' | 'markdown';
    sharedContext?: string;
  }
): Promise<string> {
  const writer = await createWriter({
    tone: options?.tone,
    format: options?.format,
    length: options?.length,
    sharedContext: options?.sharedContext,
  });

  try {
    const result = await writer.write(prompt, {
      context: options?.context,
    });
    return result;
  } finally {
    writer.destroy();
  }
}

/**
 * Write text with streaming (real-time output)
 * Returns async generator that yields chunks as they're generated
 */
export async function* writeTextStreaming(
  prompt: string,
  options?: {
    context?: string;
    tone?: 'formal' | 'neutral' | 'casual';
    length?: 'short' | 'medium' | 'long';
    format?: 'plain-text' | 'markdown';
    sharedContext?: string;
    signal?: AbortSignal;
  }
): AsyncGenerator<string, void, unknown> {
  const writer = await createWriter({
    tone: options?.tone,
    format: options?.format,
    length: options?.length,
    sharedContext: options?.sharedContext,
    signal: options?.signal,
  });

  try {
    const stream = writer.writeStreaming(prompt, {
      context: options?.context,
    });

    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  } finally {
    writer.destroy();
  }
}
