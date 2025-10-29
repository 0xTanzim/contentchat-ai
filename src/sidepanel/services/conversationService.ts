/**
 * Conversation Service
 * Handles conversation-level operations (title generation, formatting, stats)
 */

import type {
  Conversation,
  IConversationService,
  Message,
} from '@/types/chat.types';

import { createLogger } from '@/lib/logger';

// Create logger for this service
const logger = createLogger('ConversationService');

/**
 * Conversation Service Implementation
 */
class ConversationService implements IConversationService {
  /**
   * Generate conversation title from messages
   * Uses first user message or AI summary
   */
  generateTitle(messages: Message[]): string {
    if (messages.length === 0) {
      return 'New Conversation';
    }

    // Find first user message
    const firstUserMessage = messages.find((m) => m.role === 'user');

    if (!firstUserMessage) {
      return 'New Conversation';
    }

    // Use first 60 characters of first user message
    const content = firstUserMessage.content.trim();
    const title = content.substring(0, 60);

    // Add ellipsis if truncated
    if (title.length < content.length) {
      return `${title}...`;
    }

    return title;
  }

  /**
   * Get conversation statistics
   */
  getConversationStats(
    conversation: Conversation
  ): import('@/types/chat.types').ConversationStats {
    const messages = conversation.messages;

    const userMessages = messages.filter((m) => m.role === 'user').length;
    const assistantMessages = messages.filter(
      (m) => m.role === 'assistant'
    ).length;

    const totalTokens = messages.reduce((sum, msg) => {
      const tokens = msg.tokens;
      if (!tokens) return sum;
      return sum + (tokens.prompt || 0) + (tokens.completion || 0);
    }, 0);

    const duration = conversation.updatedAt - conversation.createdAt;
    const avgResponseTime =
      assistantMessages > 0 ? duration / assistantMessages : 0;

    return {
      messageCount: messages.length,
      userMessageCount: userMessages,
      assistantMessageCount: assistantMessages,
      totalTokens,
      avgResponseTime,
      duration,
    };
  }

  /**
   * Prune old messages to stay within token limit
   * Keeps system messages and recent messages
   */
  pruneMessages(messages: Message[], maxTokens: number): Message[] {
    // Keep system messages
    const systemMessages = messages.filter((m) => m.role === 'system');

    // Calculate tokens for each message (estimate: ~4 chars per token)
    const messagesWithTokens = messages
      .filter((m) => m.role !== 'system')
      .map((msg) => ({
        message: msg,
        estimatedTokens: Math.ceil(msg.content.length / 4),
      }));

    // Keep messages from newest until we hit token limit
    const kept: Message[] = [];
    let totalTokens = 0;

    for (let i = messagesWithTokens.length - 1; i >= 0; i--) {
      const { message, estimatedTokens } = messagesWithTokens[i];

      if (totalTokens + estimatedTokens > maxTokens) {
        break;
      }

      kept.unshift(message);
      totalTokens += estimatedTokens;
    }

    // Combine system messages + kept messages
    return [...systemMessages, ...kept];
  }

  /**
   * Format message content for display
   * Handles markdown, code blocks, links
   */
  formatMessageContent(content: string): string {
    // Basic sanitization
    let formatted = content.trim();

    // Preserve code blocks
    formatted = formatted.replace(
      /```(\w+)?\n([\s\S]+?)```/g,
      (_match, lang, code) => {
        return `\`\`\`${lang || ''}\n${code.trim()}\n\`\`\``;
      }
    );

    // Preserve inline code
    formatted = formatted.replace(/`([^`]+)`/g, '`$1`');

    // Format lists
    formatted = formatted.replace(/^\s*[-*]\s+/gm, '• ');
    formatted = formatted.replace(/^\s*\d+\.\s+/gm, (match) => match);

    return formatted;
  }

  /**
   * Export conversation to markdown
   */
  exportToMarkdown(conversation: Conversation): string {
    const lines: string[] = [];

    // Header
    lines.push(`# ${conversation.title}`);
    lines.push('');
    lines.push(`**Mode:** ${conversation.mode}`);
    lines.push(`**URL:** ${conversation.url}`);
    lines.push(
      `**Created:** ${new Date(conversation.createdAt).toLocaleString()}`
    );
    lines.push('');
    lines.push('---');
    lines.push('');

    // Messages
    conversation.messages.forEach((msg, index) => {
      if (msg.role === 'system') return;

      const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();

      lines.push(`## ${role} (${timestamp})`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');

      if (index < conversation.messages.length - 1) {
        lines.push('---');
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  /**
   * Export conversation to JSON
   */
  exportToJSON(conversation: Conversation): string {
    return JSON.stringify(conversation, null, 2);
  }

  /**
   * Search messages in conversation
   */
  searchMessages(conversation: Conversation, query: string): Message[] {
    const lowerQuery = query.toLowerCase();

    return conversation.messages.filter((msg) =>
      msg.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get message by ID
   */
  getMessageById(
    conversation: Conversation,
    messageId: string
  ): Message | undefined {
    return conversation.messages.find((m) => m.id === messageId);
  }

  /**
   * Get messages after specific message
   */
  getMessagesAfter(conversation: Conversation, messageId: string): Message[] {
    const index = conversation.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return [];

    return conversation.messages.slice(index + 1);
  }

  /**
   * Get messages before specific message
   */
  getMessagesBefore(conversation: Conversation, messageId: string): Message[] {
    const index = conversation.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return [];

    return conversation.messages.slice(0, index);
  }

  /**
   * Validate conversation data
   */
  validateConversation(conversation: Conversation): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!conversation.id) {
      errors.push('Missing conversation ID');
    }

    if (!conversation.mode) {
      errors.push('Missing conversation mode');
    }

    if (!conversation.url) {
      errors.push('Missing conversation URL');
    }

    if (!conversation.title) {
      errors.push('Missing conversation title');
    }

    if (!Array.isArray(conversation.messages)) {
      errors.push('Invalid messages array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export conversation as markdown
   */
  exportConversation(conversation: Conversation): string {
    const { title, messages, createdAt, mode } = conversation;
    const date = new Date(createdAt).toLocaleString();

    let markdown = `# ${title}\n\n`;
    markdown += `**Created:** ${date}  \n`;
    markdown += `**Mode:** ${mode}  \n\n`;
    markdown += `---\n\n`;

    for (const message of messages) {
      const role = message.role === 'user' ? '👤 You' : '🤖 AI';
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      markdown += `### ${role} (${timestamp})\n\n`;
      markdown += `${message.content}\n\n`;
    }

    return markdown;
  }
}

// Export singleton instance
export const conversationService = new ConversationService();
