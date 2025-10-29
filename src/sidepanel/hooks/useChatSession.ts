/**
 * useChatSession Hook (Refactored with Advanced Design Patterns)
 * 🎨 Design Pattern: Hook Composition + Facade Pattern
 *
 * This refactored version uses multiple advanced React patterns:
 * 1. Factory Pattern - useConversationManager
 * 2. Command Pattern - useStreamingMessage
 * 3. Hook Composition - Combining specialized hooks
 * 4. Facade Pattern - Simple unified API
 * 5. Single Responsibility - Each hook does ONE thing
 *
 * BENEFITS:
 * - No infinite render loops (side effects isolated)
 * - Easier testing (each hook tests independently)
 * - Better code reuse (hooks can be used separately)
 * - Clearer separation of concerns
 * - More maintainable and scalable
 */

import { createLogger } from '@/lib/logger';
import { conversationService } from '@/sidepanel/services/conversationService';
import { useChatStore } from '@/sidepanel/stores/chatStore';
import type { ChatMode, UseChatSessionReturn } from '@/types/chat.types';
import { useCallback, useMemo } from 'react';
import { useConversationManager } from './useConversationManager';
import { useStreamingMessage } from './useStreamingMessage';

const logger = createLogger('useChatSession');

/**
 * 🎨 Facade Pattern: Unified Chat Session Interface
 *
 * Composes multiple specialized hooks into a simple, clean API.
 * Components only need to call this hook - no need to understand
 * the complex internals of conversation management or streaming.
 */
export function useChatSession(
  mode: ChatMode,
  currentUrl?: string,
  pageTitle?: string,
  pageContent?: string
): UseChatSessionReturn {
  // Store actions (only what we need)
  const { deleteMessage, clearConversation, updateConversation } =
    useChatStore();

  // 🎨 PATTERN 1: Factory Pattern for Conversation Lifecycle
  // Handles: Finding existing conversations, creating new ones, managing IDs
  const { conversationId, conversation, isReady } = useConversationManager(
    mode,
    currentUrl,
    pageTitle
  );

  // 🎨 PATTERN 2: Command Pattern for Streaming Operations
  // Handles: AI streaming, message sending, stop generation, state machine
  const {
    isGenerating,
    streamingText,
    error,
    sendMessage: executeSendCommand,
    stopGeneration: executeStopCommand,
  } = useStreamingMessage(conversationId);

  // 🎨 PATTERN 3: Facade - Simplified public API
  /**
   * Facade: Send message (hides complexity)
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!isReady || !conversationId) {
        logger.warn('⚠️ Cannot send: Conversation not ready');
        return;
      }
      await executeSendCommand(content, mode, pageContent);
    },
    [isReady, conversationId, executeSendCommand, mode, pageContent]
  );

  /**
   * Facade: Stop generation (hides cleanup complexity)
   */
  const stopGeneration = useCallback(async () => {
    await executeStopCommand();
  }, [executeStopCommand]);

  /**
   * Delete message from conversation
   */
  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      if (!conversationId) return;
      deleteMessage(conversationId, messageId);
    },
    [conversationId, deleteMessage]
  );

  /**
   * Clear all messages in conversation
   */
  const clearMessages = useCallback(() => {
    if (!conversationId) return;
    clearConversation(conversationId);
  }, [conversationId, clearConversation]);

  /**
   * Regenerate last AI response
   */
  const regenerateResponse = useCallback(async () => {
    if (!conversation || !conversationId) return;

    const messages = conversation.messages || [];
    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === 'user');

    if (!lastUserMessage) {
      logger.warn('No user message to regenerate from');
      return;
    }

    // Remove last assistant message if exists
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === 'assistant');
    if (lastAssistantMessage) {
      handleDeleteMessage(lastAssistantMessage.id);
    }

    // Resend user message
    await sendMessage(lastUserMessage.content);
  }, [conversation, conversationId, handleDeleteMessage, sendMessage]);

  /**
   * Export conversation as markdown
   */
  const exportConversation = useCallback(() => {
    if (!conversation) return '';
    return conversationService.exportConversation(conversation);
  }, [conversation]);

  /**
   * Update conversation metadata
   */
  const updateMetadata = useCallback(
    (updates: { title?: string; isFavorite?: boolean }) => {
      if (!conversationId) return;
      updateConversation(conversationId, updates);
    },
    [conversationId, updateConversation]
  );

  /**
   * Derive messages from conversation (memoized)
   */
  const messages = useMemo(
    () => conversation?.messages || [],
    [conversation?.messages]
  );

  /**
   * Create streaming message object for display
   */
  const streamingMessage = useMemo(() => {
    if (!isGenerating || !streamingText) return null;
    return {
      id: 'streaming-temp',
      role: 'assistant' as const,
      content: streamingText,
      timestamp: 0, // Temporary streaming message, timestamp not critical
      status: 'streaming' as const,
      mode,
    };
  }, [isGenerating, streamingText, mode]);

  // 🎨 Return Facade Interface (Clean, Simple API)
  return {
    // Core state - matching UseChatSessionReturn interface
    conversation: conversation || null,
    isStreaming: isGenerating,
    isLoading: !isReady,
    error,
    streamingMessage,

    // Primary operations
    sendMessage,
    stopGeneration,
    regenerateLastResponse: regenerateResponse,
    clearConversation: clearMessages,
  };
}
