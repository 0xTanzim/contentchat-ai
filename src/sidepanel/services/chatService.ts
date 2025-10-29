/**
 * Chat Service
 * Handles AI generation using Chrome Built-in AI Language Model API
 * Supports streaming responses with character-by-character delivery
 */

import type {
  ChatMode,
  ChatSettings,
  ChatStreamingResult,
  IChatService,
  Message,
} from '@/types/chat.types';
import type { LanguageModel } from '@/types/chrome-ai';

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
      console.log(
        '[DEBUG] 🤖 ChatService: Initializing language model...',
        settings
      );

      if (!self.LanguageModel) {
        throw new Error(
          'Chrome Built-in AI not available. Update to Chrome 138+'
        );
      }

      // Check availability
      const availability = await LanguageModel.availability();
      console.log('[DEBUG] 📊 ChatService: Model availability:', availability);

      if (availability === 'unavailable') {
        throw new Error('Language Model not available on this device');
      }

      if (availability === 'after-download') {
        throw new Error(
          'Language Model needs to be downloaded. Please wait...'
        );
      }

      // Create model with settings and output language (required for Chrome AI)
      this.languageModel = await LanguageModel.create({
        temperature: settings.temperature || 0.7,
        topK: 40, // Default topK value
        expectedOutputs: [{ type: 'text', languages: ['en'] }], // ✅ Specify English output
      });

      console.log(
        '[DEBUG] ✅ ChatService: Language model initialized successfully'
      );
    } catch (error) {
      console.error(
        '[DEBUG] ❌ ChatService: Failed to initialize language model:',
        error
      );
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
      console.log('[DEBUG] 🚀 ChatService: Starting streaming generation...', {
        messageCount: messages.length,
        mode,
        hasPageContent: !!pageContent,
      });

      // Initialize model if needed
      if (!this.languageModel) {
        console.log(
          '[DEBUG] 🔄 ChatService: Model not initialized, creating new session...'
        );
        await this.initializeModel(
          settings || {
            streamSpeed: 'medium',
            temperature: 0.7,
            maxTokens: 2000,
          }
        );
      }

      if (!this.languageModel) {
        throw new Error('Language model not initialized');
      }

      // Build context
      const context = this.buildContext(messages, mode, pageContent);
      console.log(
        '[DEBUG] 📝 ChatService: Context built, length:',
        context.length
      );

      // Create abort controller
      this.abortController = new AbortController();
      console.log('[DEBUG] 🛑 ChatService: Abort controller created');

      // Create stream from language model
      console.log('[DEBUG] 🌊 ChatService: Calling promptStreaming...');
      const stream = this.languageModel.promptStreaming(context, {
        signal: this.abortController.signal,
      });

      console.log(
        '[DEBUG] 📡 ChatService: Stream created, locked:',
        stream.locked
      );

      // ✅ Check if stream is locked before getting reader
      if (stream.locked) {
        console.error('[DEBUG] ❌ ChatService: Stream is already locked!');
        throw new Error('Stream is already locked. Cannot create reader.');
      }

      console.log('[DEBUG] 🔓 ChatService: Getting reader from stream...');
      const reader = stream.getReader();
      console.log(
        '[DEBUG] ✅ ChatService: Reader created successfully, stream now locked:',
        stream.locked
      );

      return {
        stream,
        reader,
        model: this.languageModel,
      };
    } catch (error: any) {
      console.error(
        '[DEBUG] ❌ ChatService: Error in generateResponseStreaming:',
        error
      );

      if (error.name === 'AbortError') {
        throw new Error('Generation stopped by user');
      }

      console.error('Failed to generate response:', error);
      throw new Error(error.message || 'Failed to generate response');
    }
  }

  /**
   * Stop ongoing generation
   */
  async stopGeneration(
    reader: ReadableStreamDefaultReader<string> | null,
    _model: any
  ): Promise<void> {
    try {
      // Cancel reader if provided
      if (reader) {
        await reader.cancel();
      }

      // Abort controller
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    } catch (error) {
      console.error('Error stopping generation:', error);
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
        console.error('Failed to cleanup language model:', error);
      }
      this.languageModel = null;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
