/**
 * Chrome Built-in AI API Wrapper
 * Implements official Chrome Built-in AI APIs
 * Reference: https://developer.chrome.com/docs/ai/built-in-apis
 */

import type {
  LanguageModel,
  LanguageModelCreateOptions,
  Summarizer,
  SummarizerOptions,
} from '@/types/chrome-ai';
import { createLogger } from './logger';

const logger = createLogger('ChromeAI');

// Export new AI wrappers
export * from './chrome-ai/proofreader';
export * from './chrome-ai/rewriter';
export * from './chrome-ai/writer';

/**
 * Check if Chrome Built-in AI is available
 * According to official docs, check for global constructors
 */
export function isAIAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for any of the Built-in AI APIs (Chrome 138+)
  return (
    'LanguageModel' in self ||
    'Summarizer' in self ||
    'Translator' in self ||
    'LanguageDetector' in self
  );
}

/**
 * Check if a specific AI capability is available
 * Uses official Chrome Built-in AI API availability() method
 */
export async function checkCapability(
  api: 'summarizer' | 'languageModel' | 'translator' | 'languageDetector'
): Promise<'readily' | 'after-download' | 'no'> {
  try {
    // Map API names to global constructors
    const apiMap: Record<string, any> = {
      languageModel:
        typeof LanguageModel !== 'undefined' ? LanguageModel : null,
      summarizer: typeof Summarizer !== 'undefined' ? Summarizer : null,
      translator: typeof Translator !== 'undefined' ? Translator : null,
      languageDetector:
        typeof LanguageDetector !== 'undefined' ? LanguageDetector : null,
    };

    const constructor = apiMap[api];
    if (!constructor || !constructor.availability) {
      return 'no';
    }

    // Call availability() - returns 'available', 'after-download', or 'unavailable'
    const status = await constructor.availability();

    // Map to our return type
    if (status === 'available') return 'readily';
    if (status === 'after-download') return 'after-download';
    return 'no';
  } catch (error) {
    logger.error(`Failed to check ${api} capability:`, error);
    return 'no';
  }
}

/**
 * Create a Summarizer instance using official API
 * Reference: https://developer.chrome.com/docs/ai/summarizer-api
 */
export async function createSummarizer(
  options?: SummarizerOptions
): Promise<Summarizer | null> {
  // Feature detection
  if (!('Summarizer' in self)) {
    throw new Error(
      'Summarizer API not available. Please use Chrome 138+ with AI enabled.'
    );
  }

  try {
    // Check availability
    const availability = await (self as any).Summarizer.availability();

    if (availability === 'no' || availability === 'unavailable') {
      throw new Error('Summarizer not supported on this device');
    }

    // Require user activation if model needs download
    if (availability === 'after-download' || availability === 'downloadable') {
      if (!navigator.userActivation?.isActive) {
        throw new Error('User activation required to download AI model');
      }
    }

    // Create summarizer with proper language parameters
    // Per official docs: https://developer.chrome.com/docs/ai/summarizer-api
    // Must specify expectedInputLanguages and outputLanguage
    const summarizer = await (self as any).Summarizer.create({
      expectedInputLanguages: ['en', 'ja', 'es'], // Supported input languages
      outputLanguage: 'en', // Required output language specification
      monitor(m: any) {
        m.addEventListener('downloadprogress', (e: any) => {
          logger.info(
            `Summarizer model: Downloaded ${(e.loaded * 100).toFixed(1)}%`
          );
        });
      },
      ...options,
    });

    logger.debug('Summarizer created successfully');
    return summarizer;
  } catch (error) {
    logger.error('Failed to create summarizer:', error);
    throw new Error(
      'Failed to initialize AI summarizer. Please check Chrome AI settings at chrome://flags/#optimization-guide-on-device-model and try again.'
    );
  }
}

/**
 * Summarize text with error handling (batch mode)
 */
export async function summarizeText(
  text: string,
  options?: SummarizerOptions,
  context?: string
): Promise<string> {
  const summarizer = await createSummarizer(options);

  if (!summarizer) {
    throw new Error('Failed to create summarizer');
  }

  try {
    // Truncate if too long (50k characters limit)
    const truncatedText = text.length > 50000 ? text.substring(0, 50000) : text;

    // Use context if provided
    const summary = context
      ? await summarizer.summarize(truncatedText, { context })
      : await summarizer.summarize(truncatedText);

    return summary;
  } finally {
    summarizer.destroy();
  }
}

/**
 * Summarize text with streaming (real-time updates)
 * Returns an object with the async generator, reader, and summarizer for proper cleanup
 * Reference: https://developer.chrome.com/docs/ai/summarizer-api#stream_summarization
 */
export async function summarizeStreaming(
  text: string,
  options?: SummarizerOptions,
  context?: string
): Promise<{
  stream: AsyncGenerator<string, void, unknown>;
  reader: ReadableStreamDefaultReader<string>;
  summarizer: Summarizer;
}> {
  logger.debug('Creating summarizer for streaming');
  const summarizer = await createSummarizer(options);

  if (!summarizer) {
    throw new Error('Failed to create summarizer');
  }

  // Truncate if too long - Chrome API limit is ~4-6k words or ~20-30k chars
  // Being conservative with 20k to avoid quota errors
  const MAX_SAFE_LENGTH = 20000;
  const truncatedText =
    text.length > MAX_SAFE_LENGTH ? text.substring(0, MAX_SAFE_LENGTH) : text;

  if (text.length > MAX_SAFE_LENGTH) {
    logger.warn(
      `Text truncated from ${text.length} to ${MAX_SAFE_LENGTH} characters`
    );
  }

  logger.debug('Text length:', truncatedText.length);

  // Get ReadableStream from API
  logger.debug('Calling summarizeStreaming API');
  const readableStream = context
    ? summarizer.summarizeStreaming(truncatedText, { context })
    : summarizer.summarizeStreaming(truncatedText);

  logger.debug('Stream obtained');

  // Get reader
  const reader = readableStream.getReader();
  logger.debug('Reader created');

  // Create async generator
  async function* generateChunks(): AsyncGenerator<string, void, unknown> {
    let readCount = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        readCount++;
        logger.debug(`Read chunk ${readCount}:`, {
          done,
          valueLength: value?.length,
        });

        if (done) {
          logger.debug(`Stream complete after ${readCount} reads`);
          break;
        }

        if (value) {
          logger.debug(`Yielding chunk: ${value.length} chars`);
          yield value;
        } else {
          logger.warn('Empty value received');
        }
      }
    } catch (error) {
      logger.error('Stream reading error:', error);
      throw error;
    }
  }

  return {
    stream: generateChunks(),
    reader,
    summarizer,
  };
}

/**
 * Recursive "Summary of Summaries" for large content
 * Based on: https://developer.chrome.com/docs/ai/scale-summarization
 *
 * Strategy:
 * 1. Check inputQuota to determine optimal chunk size
 * 2. Split content into chunks with overlap (preserves context)
 * 3. Summarize each chunk independently
 * 4. Concatenate summaries
 * 5. If concatenated summaries are still too large, repeat recursively
 *
 * Successfully tested with 110,030 character IRC RFC document in Chrome demo
 */
export async function summarizeLargeContent(
  text: string,
  options?: SummarizerOptions,
  context?: string,
  onProgress?: (current: number, total: number, stage: string) => void
): Promise<string> {
  const { RecursiveTextSplitter } = await import('./text-splitter');

  logger.info(`Starting recursive summarization for ${text.length} characters`);

  // Create summarizer to check inputQuota
  const summarizer = await createSummarizer({
    ...options,
    type: 'tldr', // Use tldr for intermediate summaries
    format: 'plain-text',
    length: 'long', // Keep as much context as possible
  });

  if (!summarizer) {
    throw new Error('Failed to create summarizer');
  }

  // Ensure summarizer is not null for the rest of the function
  const activeSummarizer: Summarizer = summarizer;

  try {
    // Check inputQuota if available (Chrome 140+)
    let chunkSize = 3000; // Default: ~750 tokens

    if (
      'inputQuota' in activeSummarizer &&
      typeof activeSummarizer.inputQuota === 'number'
    ) {
      // inputQuota is in tokens, convert to characters (4 chars per token)
      const quotaChars = activeSummarizer.inputQuota * 4;
      chunkSize = Math.min(quotaChars * 0.8, 10000); // Use 80% of quota, max 10k chars
      logger.info(
        `Using inputQuota: ${activeSummarizer.inputQuota} tokens = ${quotaChars} chars, chunkSize=${chunkSize}`
      );
    } else {
      logger.info(
        `inputQuota not available, using default chunkSize=${chunkSize}`
      );
    }

    // Initialize text splitter
    const splitter = new RecursiveTextSplitter({
      chunkSize: Math.floor(chunkSize),
      chunkOverlap: 200, // Preserve context between chunks
    });

    // Recursive summarization function
    async function recursiveSummarize(
      content: string,
      depth: number = 0
    ): Promise<string> {
      const maxDepth = 5; // Prevent infinite recursion

      if (depth >= maxDepth) {
        logger.warn(
          `Max recursion depth ${maxDepth} reached, returning truncated content`
        );
        return content.substring(0, chunkSize);
      }

      // If content is small enough, summarize directly
      if (content.length <= chunkSize) {
        logger.info(
          `Content fits in single chunk (${content.length} chars), summarizing directly`
        );
        const summary = await activeSummarizer.summarize(
          content,
          context ? { context } : undefined
        );
        return summary;
      }

      // Split into chunks
      const chunks = splitter.splitText(content);
      logger.info(
        `Depth ${depth}: Split ${content.length} chars into ${chunks.length} chunks`
      );

      if (onProgress) {
        onProgress(
          0,
          chunks.length,
          `Summarizing ${chunks.length} chunks (level ${depth + 1})`
        );
      }

      // Summarize each chunk
      const summaries: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        logger.debug(
          `Summarizing chunk ${i + 1}/${chunks.length} (${
            chunks[i].length
          } chars)`
        );

        if (onProgress) {
          onProgress(
            i + 1,
            chunks.length,
            `Processing chunk ${i + 1}/${chunks.length}`
          );
        }

        const summary = await activeSummarizer.summarize(
          chunks[i],
          context ? { context } : undefined
        );
        summaries.push(summary);
      }

      // Concatenate summaries with separators
      const concatenated = summaries.join('\n\n');
      logger.info(
        `Concatenated ${summaries.length} summaries: ${concatenated.length} chars`
      );

      // If concatenated is still too large, recurse
      if (concatenated.length > chunkSize) {
        logger.info(
          `Concatenated summaries too large (${concatenated.length} chars), recursing...`
        );
        return recursiveSummarize(concatenated, depth + 1);
      }

      // Final summary of summaries
      if (summaries.length > 1) {
        logger.info('Creating final summary of summaries');
        if (onProgress) {
          onProgress(chunks.length, chunks.length, 'Creating final summary');
        }

        const finalSummary = await activeSummarizer.summarize(
          concatenated,
          context ? { context } : undefined
        );
        return finalSummary;
      }

      // Single summary, return as is
      return concatenated;
    }

    // Start recursive summarization
    const result = await recursiveSummarize(text, 0);
    logger.info(`Recursive summarization complete: ${result.length} chars`);
    return result;
  } finally {
    activeSummarizer.destroy();
  }
}

/**
 * Create a Language Model instance (Prompt API)
 * Reference: https://developer.chrome.com/docs/ai/prompt-api
 */
export async function createLanguageModel(
  options?: LanguageModelCreateOptions
): Promise<LanguageModel | null> {
  // Feature detection
  if (!('LanguageModel' in self)) {
    throw new Error(
      'LanguageModel API not available. Please use Chrome 138+ with AI enabled.'
    );
  }

  try {
    // Check availability
    const availability = await (self as any).LanguageModel.availability();

    if (availability === 'no' || availability === 'unavailable') {
      throw new Error('Language Model not supported on this device');
    }

    // Require user activation if model needs download
    if (availability === 'after-download' || availability === 'downloadable') {
      if (!navigator.userActivation?.isActive) {
        throw new Error('User activation required to download AI model');
      }
    }

    // Create language model with proper options format
    // Per official docs: https://developer.chrome.com/docs/ai/prompt-api
    // Must specify expectedInputs and expectedOutputs with languages
    const sessionOptions: any = {
      expectedInputs: [{ type: 'text', languages: ['en', 'ja', 'es'] }], // Support multiple input languages
      expectedOutputs: [{ type: 'text', languages: ['en'] }], // Output in English
      monitor(m: any) {
        m.addEventListener('downloadprogress', (e: any) => {
          logger.info(
            `Language model: Downloaded ${(e.loaded * 100).toFixed(1)}%`
          );
        });
      },
    };

    // Add expected inputs/outputs for multimodal API
    if (options?.temperature || options?.topK) {
      sessionOptions.temperature = options.temperature;
      sessionOptions.topK = options.topK;
    }

    const model = await (self as any).LanguageModel.create(sessionOptions);
    return model;
  } catch (error) {
    logger.error('Failed to create language model:', error);
    throw error;
  }
}

/**
 * Prompt the language model with context
 */
export async function promptWithContext(
  prompt: string,
  context: string,
  options?: LanguageModelCreateOptions
): Promise<string> {
  const model = await createLanguageModel(options);

  if (!model) {
    throw new Error('Failed to create language model');
  }

  try {
    const fullPrompt = `Context:\n${context}\n\nQuestion: ${prompt}\n\nAnswer based on the context above:`;
    const response = await model.prompt(fullPrompt);
    return response;
  } finally {
    model.destroy();
  }
}
