/**
 * Chat View Component (Refactored)
 * Clean container using hooks and new components
 */

import { createLogger } from '@/lib/logger';
import { useChatSession } from '@/sidepanel/hooks/useChatSession';
import { useScrollToBottom } from '@/sidepanel/hooks/useScrollToBottom';
import { useChatStore } from '@/sidepanel/stores/chatStore';
import type { ChatMode } from '@/types/chat.types';
import type { PageContent } from '@/types/summary.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatHeader } from './chat/ChatHeader';
import { ChatInput } from './chat/ChatInput';
import { ChatMessage } from './chat/ChatMessage';
import { EmptyState } from './chat/EmptyState';

// Create logger for this component
const logger = createLogger('ChatView');

interface ChatViewProps {
  currentPage: PageContent | null;
  selectedTextContext?: string | null;
  onContextUsed?: () => void;
}

export function ChatView({
  currentPage,
  selectedTextContext,
  onContextUsed,
}: ChatViewProps) {
  const [mode, setMode] = useState<ChatMode>('page-context');

  // Get store actions
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId
  );
  const setActiveConversation = useChatStore(
    (state) => state.setActiveConversation
  );
  const conversations = useChatStore((state) => state.conversations);

  // Chat session
  const {
    conversation,
    sendMessage,
    stopGeneration,
    regenerateLastResponse,
    clearConversation,
    isStreaming,
    error,
    streamingMessage,
  } = useChatSession(
    mode,
    currentPage?.url,
    currentPage?.title,
    currentPage?.content
  );

  // ✅ FIX: Use active conversation ONLY if it matches current mode
  // This prevents showing wrong conversation when switching modes
  const displayConversation = useMemo(() => {
    if (activeConversationId && conversations[activeConversationId]) {
      const activeConv = conversations[activeConversationId];
      // Only use active conversation if mode matches
      if (activeConv.mode === mode) {
        return activeConv;
      }
    }
    return conversation;
  }, [activeConversationId, conversations, conversation, mode]);

  // ✅ FIX: Clear active conversation when mode changes
  useEffect(() => {
    // When mode changes, clear active conversation so it uses the right one
    if (activeConversationId && conversations[activeConversationId]) {
      const activeConv = conversations[activeConversationId];
      if (activeConv.mode !== mode) {
        logger.debug('🔄 Mode changed, clearing active conversation');
        setActiveConversation(null);
      }
    }
  }, [mode, activeConversationId, conversations, setActiveConversation]);

  // ✅ Handle selected text context from "Ask AI About This"
  useEffect(() => {
    if (selectedTextContext) {
      logger.info('📝 Selected text context received', {
        length: selectedTextContext.length,
        preview: selectedTextContext.substring(0, 100),
      });

      // Send the selected text as initial message
      const prompt = `I have selected this text:\n\n"${selectedTextContext}"\n\nCan you help me understand it?`;
      sendMessage(prompt);

      // Clear context after using
      if (onContextUsed) {
        onContextUsed();
      }
    }
  }, [selectedTextContext, sendMessage, onContextUsed]); // Include sendMessage in deps

  // Auto-scroll
  const { scrollRef } = useScrollToBottom(
    [conversation?.messages.length, streamingMessage],
    { smooth: true, enabled: true }
  );

  // ✅ Memoize copy handler (React 19 optimization)
  const handleCopy = useCallback((content: string) => {
    logger.info('📋 Copied:', { preview: content.substring(0, 50) });
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Handle mode change
  const handleModeChange = (newMode: ChatMode) => {
    logger.info('🔄 Mode changing', { from: mode, to: newMode });
    // Clear active conversation when switching modes
    setActiveConversation(null);
    setMode(newMode);
  };

  const messages = displayConversation?.messages || [];
  const hasMessages = messages.length > 0;

  // ✅ Debug: Log messages and streaming state
  logger.debug('📺 ChatView: Rendering state', {
    messagesCount: messages.length,
    hasStreamingMessage: !!streamingMessage,
    isStreaming,
    mode,
    activeConversationId,
    displayConversationId: displayConversation?.id,
    displayConversationMode: displayConversation?.mode,
    streamingContent: streamingMessage?.content?.substring(0, 50),
    lastMessageContent: messages[messages.length - 1]?.content?.substring(
      0,
      50
    ),
  });

  // ✅ Memoize pageInfo object (React 19 optimization)
  const pageInfo = useMemo(
    () =>
      currentPage
        ? { title: currentPage.title, url: currentPage.url }
        : undefined,
    [currentPage]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <ChatHeader
        mode={mode}
        onModeChange={handleModeChange}
        hasMessages={hasMessages}
        onClear={clearConversation}
        pageInfo={pageInfo}
      />

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {!hasMessages ? (
          <EmptyState mode={mode} onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              // ✅ Compute onRegenerate once per message (React 19 optimization)
              const isLastAssistantMessage =
                message.role === 'assistant' && index === messages.length - 1;

              // ✅ FIX: Skip rendering last assistant message if we're streaming
              // The streamingMessage component will show it instead
              if (
                isLastAssistantMessage &&
                isStreaming &&
                message.status === 'streaming'
              ) {
                logger.debug(
                  '🚫 ChatView: Skipping last assistant message (streaming)'
                );
                return null;
              }

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onCopy={handleCopy}
                  onRegenerate={
                    isLastAssistantMessage && !isStreaming
                      ? regenerateLastResponse
                      : undefined
                  }
                />
              );
            })}

            {/* Streaming Message - Only shown during active streaming */}
            {streamingMessage && isStreaming && (
              <ChatMessage
                message={streamingMessage}
                isStreaming={true}
                streamingText={streamingMessage.content}
              />
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopGeneration}
        isGenerating={isStreaming}
        placeholder={
          mode === 'page-context'
            ? 'Ask about this page...'
            : 'Ask me anything...'
        }
      />
    </div>
  );
}
