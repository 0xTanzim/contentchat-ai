/**
 * Chrome Built-in AI API Wrapper
 * Implements official Chrome Built-in AI APIs
 * Reference: https://developer.chrome.com/docs/ai/built-in-apis
 */

import type {
  LanguageDetector,
  LanguageModel,
  LanguageModelCreateOptions,
  Summarizer,
  SummarizerOptions,
  Translator,
  TranslatorOptions,
} from '@/types/chrome-ai';

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
    console.error(`Failed to check ${api} capability:`, error);
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

    // Create summarizer with download progress monitor
    const summarizer = await (self as any).Summarizer.create({
      monitor(m: any) {
        m.addEventListener('downloadprogress', (e: any) => {
          console.log(
            `Summarizer model: Downloaded ${(e.loaded * 100).toFixed(1)}%`
          );
        });
      },
      ...options,
    });

    return summarizer;
  } catch (error) {
    console.error('Failed to create summarizer:', error);
    throw error;
  }
}

/**
 * Summarize text with error handling
 */
export async function summarizeText(
  text: string,
  options?: SummarizerOptions
): Promise<string> {
  const summarizer = await createSummarizer(options);

  if (!summarizer) {
    throw new Error('Failed to create summarizer');
  }

  try {
    // Truncate if too long (50k characters limit)
    const truncatedText = text.length > 50000 ? text.substring(0, 50000) : text;
    const summary = await summarizer.summarize(truncatedText);
    return summary;
  } finally {
    summarizer.destroy();
  }
}

/**
 * Create a Language Model instance (Prompt API)
 * Reference: https://developer.chrome.com/docs/ai/prompt-api
 */
export async function createLanguageModel(
  options?: LanguageModelOptions
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
    const sessionOptions: any = {
      monitor(m: any) {
        m.addEventListener('downloadprogress', (e: any) => {
          console.log(
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
    console.error('Failed to create language model:', error);
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

/**
 * Create a Translator instance using official API
 * Reference: https://developer.chrome.com/docs/ai/translator-api
 */
export async function createTranslator(
  options: TranslatorOptions
): Promise<Translator | null> {
  // Feature detection
  if (!('Translator' in self)) {
    throw new Error(
      'Translator API not available. Please use Chrome 138+ with AI enabled.'
    );
  }

  try {
    // Check availability
    const availability = await (self as any).Translator.availability();

    if (availability === 'no' || availability === 'unavailable') {
      throw new Error('Translator not supported on this device');
    }

    // Require user activation if model needs download
    if (availability === 'after-download' || availability === 'downloadable') {
      if (!navigator.userActivation?.isActive) {
        throw new Error('User activation required to download AI model');
      }
    }

    const translator = await (self as any).Translator.create(options);
    return translator;
  } catch (error) {
    console.error('Failed to create translator:', error);
    throw error;
  }
}

/**
 * Translate text between languages
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const translator = await createTranslator({
    sourceLanguage,
    targetLanguage,
  });

  if (!translator) {
    throw new Error('Failed to create translator');
  }

  try {
    const translated = await translator.translate(text);
    return translated;
  } finally {
    translator.destroy();
  }
}

/**
 * Create a Language Detector instance using official API
 * Reference: https://developer.chrome.com/docs/ai/language-detection
 */
export async function createLanguageDetector(): Promise<LanguageDetector | null> {
  // Feature detection
  if (!('LanguageDetector' in self)) {
    throw new Error(
      'LanguageDetector API not available. Please use Chrome 138+ with AI enabled.'
    );
  }

  try {
    // Check availability
    const availability = await (self as any).LanguageDetector.availability();

    if (availability === 'no' || availability === 'unavailable') {
      throw new Error('Language Detector not supported on this device');
    }

    // Require user activation if model needs download
    if (availability === 'after-download' || availability === 'downloadable') {
      if (!navigator.userActivation?.isActive) {
        throw new Error('User activation required to download AI model');
      }
    }

    const detector = await (self as any).LanguageDetector.create();
    return detector;
  } catch (error) {
    console.error('Failed to create language detector:', error);
    throw error;
  }
}

/**
 * Detect language of text
 */
export async function detectLanguage(text: string): Promise<{
  language: string;
  confidence: number;
}> {
  const detector = await createLanguageDetector();

  if (!detector) {
    throw new Error('Failed to create language detector');
  }

  try {
    const results = await detector.detect(text);

    if (results.length === 0) {
      return { language: 'en', confidence: 0 };
    }

    return {
      language: results[0].detectedLanguage,
      confidence: results[0].confidence,
    };
  } finally {
    detector.destroy();
  }
}
