/**
 * Chat Service
 * Handles AI generation using Chrome Built-in AI Language Model API
 * Supports streaming responses with character-by-character delivery
 */

import { createLogger } from '@/lib/logger';
import type {
  ChatMode,
  ChatSettings,
  ChatStreamingResult,
  IChatService,
  Message,
} from '@/types/chat.types';
import type { LanguageModel } from '@/types/chrome-ai';

// Create logger for this service
const logger = createLogger('ChatService');

/**
 * System prompts for different modes
 */
const SYSTEM_PROMPTS = {
  'page-context': `You are a helpful AI assistant that answers questions about web page content.
You have access to the current page's content and can provide insights, summaries, and explanations.
Be concise, accurate, and helpful. If you're unsure about something, say so.`,

  personal: `You are a helpful AI assistant for general conversation.
You can answer questions, provide explanations, help with tasks, and engage in friendly discussion.
Be helpful, accurate, and conversational.`,
} as const;

/**
 * Chat Service Implementation
 */
class ChatService implements IChatService {
  private languageModel: LanguageModel | null = null;
  private abortController: AbortController | null = null;

  /**
   * Initialize language model
   */
  private async initializeModel(settings: ChatSettings): Promise<void> {
    try {
      logger.debug('🤖 Initializing language model...', { settings });

      // Check for LanguageModel in both global and window.ai namespaces
      const LanguageModelAPI =
        typeof LanguageModel !== 'undefined'
          ? LanguageModel
          : typeof window !== 'undefined' && window.ai?.languageModel;

      if (!LanguageModelAPI) {
        const errorMsg =
          'Chrome Built-in AI not available. Please:\n' +
          '1. Update to Chrome 140+ Canary\n' +
          '2. Enable chrome://flags/#prompt-api-for-gemini-nano\n' +
          '3. Enable chrome://flags/#optimization-guide-on-device-model\n' +
          '4. Restart Chrome';
        logger.error('❌ LanguageModel API not found', {
          hasGlobal: typeof LanguageModel !== 'undefined',
          hasWindowAI: typeof window !== 'undefined' && !!window.ai,
          hasLanguageModel:
            typeof window !== 'undefined' && !!window.ai?.languageModel,
        });
        throw new Error(errorMsg);
      }

      // Define create options BEFORE checking availability
      // This ensures we have consistent configuration
      // Per official docs: https://developer.chrome.com/docs/ai/prompt-api
      // Must specify both expectedInputs and expectedOutputs with languages
      const createOptions = {
        expectedInputs: [{ type: 'text', languages: ['en', 'ja', 'es'] }], // Support multiple input languages
        expectedOutputs: [{ type: 'text', languages: ['en'] }], // ✅ Required to avoid warning - Output in English
        temperature: settings.temperature || 0.7,
        topK: 40, // Default topK value
      };

      // Check availability (NOTE: availability() doesn't accept options in current API)
      const availability = await LanguageModelAPI.availability();
      logger.debug('📊 Model availability:', { availability });

      if (availability === 'unavailable') {
        throw new Error('Language Model not available on this device');
      }

      if (availability === 'after-download') {
        throw new Error(
          'Language Model needs to be downloaded. Please wait and try again in a few minutes...'
        );
      }

      // Create model with the defined options
      // Per official docs: Must specify expectedOutputs with languages to avoid warnings
      // Reference: https://developer.chrome.com/docs/ai/prompt-api
      this.languageModel = await LanguageModelAPI.create(createOptions);

      logger.info('✅ Language model initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize language model:', {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      });
      throw error;
    }
  }

  /**
   * Generate response with streaming
   */
  async generateResponseStreaming(
    messages: Message[],
    mode: ChatMode,
    pageContent?: string,
    settings?: ChatSettings
  ): Promise<ChatStreamingResult> {
    try {
      logger.debug('🚀 ChatService: Starting streaming generation...', {
        messageCount: messages.length,
        mode,
        hasPageContent: !!pageContent,
      });

      // Initialize model if needed
      if (!this.languageModel) {
        logger.info(
          '🔄 ChatService: Model not initialized, creating new session...'
        );
        await this.initializeModel(
          settings || {
            streamSpeed: 'medium',
            temperature: 0.7,
            maxTokens: 2000,
          }
        );
        logger.info('✅ ChatService: New session ready');
      }

      if (!this.languageModel) {
        throw new Error('Language model not initialized');
      }

      // Build context
      const context = this.buildContext(messages, mode, pageContent);
      logger.debug('📝 ChatService: Context built, length:', context.length);

      // Create abort controller
      this.abortController = new AbortController();
      logger.debug('🛑 Abort controller created');

      // Create stream from language model
      logger.debug('🌊 Calling promptStreaming...', {
        contextLength: context.length,
        modelExists: !!this.languageModel,
        hasSignal: !!this.abortController.signal,
      });

      const stream = this.languageModel.promptStreaming(context, {
        signal: this.abortController.signal,
      });

      logger.debug('📡 ChatService: Stream created, locked:', stream.locked);

      // ✅ Check if stream is locked before getting reader
      if (stream.locked) {
        logger.error('❌ ChatService: Stream is already locked!');
        throw new Error('Stream is already locked. Cannot create reader.');
      }

      logger.debug('🔓 Getting reader from stream...');
      const reader = stream.getReader();
      logger.info('✅ Reader created successfully', {
        streamLocked: stream.locked,
      });

      return {
        stream,
        reader,
        model: this.languageModel,
      };
    } catch (error: any) {
      logger.error('❌ ChatService: Error in generateResponseStreaming:', {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
        modelInitialized: !!this.languageModel,
        hasAbortController: !!this.abortController,
      });

      if (error.name === 'AbortError') {
        throw new Error('Generation stopped by user');
      }

      const errorMessage =
        error.message || error.toString() || 'Failed to generate response';
      logger.error('Failed to generate response:', {
        message: errorMessage,
        errorType: error.name || typeof error,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Stop ongoing generation
   */
  async stopGeneration(
    reader: ReadableStreamDefaultReader<string> | null,
    model: any
  ): Promise<void> {
    logger.debug('🛑 ChatService: Stopping generation...');

    try {
      // Cancel reader if provided
      if (reader) {
        logger.debug('📖 Canceling reader...');
        await reader.cancel('User stopped generation');
        logger.debug('✅ ChatService: Reader canceled');
      }

      // Destroy model instance (but don't destroy the service's model)
      if (model && model !== this.languageModel) {
        logger.debug('🗑️ Destroying model instance...');

        try {
          model.destroy();
          logger.debug('✅ ChatService: Model destroyed');
        } catch (error) {
          logger.error('⚠️ ChatService: Failed to destroy model:', error);
        }
      }

      // ✅ FIX: Clear the language model reference to force reinitialization
      // This prevents "model execution session has been destroyed" error
      if (this.languageModel) {
        logger.debug(
          '🔄 Clearing language model reference for reinitialization...'
        );
        try {
          this.languageModel.destroy();
        } catch (error) {
          logger.warn('⚠️ Error destroying language model:', error);
        }
        this.languageModel = null;
        logger.debug('✅ Language model cleared');
      }

      // Abort controller
      if (this.abortController) {
        logger.debug('🚫 ChatService: Aborting controller...');
        this.abortController.abort();
        this.abortController = null;
        logger.debug('✅ ChatService: Controller aborted');
      }

      logger.info(
        '✅ ChatService: Stop generation complete - ready for new message'
      );
    } catch (error) {
      logger.error('❌ ChatService: Error stopping generation:', {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      });
    }
  }

  /**
   * Build context for AI model
   */
  buildContext(
    messages: Message[],
    mode: ChatMode,
    pageContent?: string
  ): string {
    const systemPrompt = SYSTEM_PROMPTS[mode];

    // Build conversation history
    const conversationHistory = messages
      .filter((msg) => msg.role !== 'system')
      .map(
        (msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      )
      .join('\n\n');

    // Build context parts
    const parts: string[] = [systemPrompt];

    // Add page content for page-context mode
    if (mode === 'page-context' && pageContent) {
      parts.push(
        `\n\nPage Content:\n${this.truncateContent(pageContent, 4000)}`
      );
    }

    // Add conversation history
    if (conversationHistory) {
      parts.push(`\n\nConversation History:\n${conversationHistory}`);
    }

    return parts.join('\n');
  }

  /**
   * Validate message before sending
   */
  validateMessage(
    content: string
  ): import('@/types/chat.types').MessageValidation {
    // Check empty
    if (!content.trim()) {
      return { valid: false, error: 'Message cannot be empty' };
    }

    // Check length
    if (content.length > 10000) {
      return {
        valid: false,
        error: 'Message too long (max 10,000 characters)',
      };
    }

    const sanitized = content.trim();
    return { valid: true, sanitizedContent: sanitized };
  }

  /**
   * Estimate token count (rough approximation: ~4 chars per token)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate content to max length
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Try to truncate at paragraph boundary
    const truncated = content.substring(0, maxLength);
    const lastParagraph = truncated.lastIndexOf('\n\n');

    if (lastParagraph > maxLength * 0.8) {
      return (
        truncated.substring(0, lastParagraph) + '\n\n[Content truncated...]'
      );
    }

    return truncated + '\n\n[Content truncated...]';
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stopGeneration(null, null);

    if (this.languageModel) {
      try {
        await this.languageModel.destroy();
      } catch (error) {
        logger.error('Failed to cleanup language model:', error);
      }
      this.languageModel = null;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
