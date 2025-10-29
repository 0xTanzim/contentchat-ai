/**
 * Chat View Component (Refactored)
 * Clean container using hooks and new components
 */

import { useChatSession } from '@/sidepanel/hooks/useChatSession';
import { useScrollToBottom } from '@/sidepanel/hooks/useScrollToBottom';
import type { ChatMode } from '@/types/chat.types';
import type { PageContent } from '@/types/summary.types';
import { useCallback, useMemo, useState } from 'react';
import { ChatHeader } from './chat/ChatHeader';
import { ChatInput } from './chat/ChatInput';
import { ChatMessage } from './chat/ChatMessage';
import { EmptyState } from './chat/EmptyState';

interface ChatViewProps {
  currentPage: PageContent | null;
}

export function ChatView({ currentPage }: ChatViewProps) {
  const [mode, setMode] = useState<ChatMode>('page-context');

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

  // Auto-scroll
  const { scrollRef } = useScrollToBottom(
    [conversation?.messages.length, streamingMessage],
    { smooth: true, enabled: true }
  );

  // ✅ Memoize copy handler (React 19 optimization)
  const handleCopy = useCallback((content: string) => {
    console.log('📋 Copied:', content.substring(0, 50));
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Handle mode change
  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
  };

  const messages = conversation?.messages || [];
  const hasMessages = messages.length > 0;

  // ✅ Debug: Log messages and streaming state
  console.log('[DEBUG] 📺 ChatView: Rendering state:', {
    messagesCount: messages.length,
    hasStreamingMessage: !!streamingMessage,
    isStreaming,
    streamingContent: streamingMessage?.content?.substring(0, 50),
    lastMessageContent: messages[messages.length - 1]?.content?.substring(0, 50),
  });

  // ✅ Memoize pageInfo object (React 19 optimization)
  const pageInfo = useMemo(
    () =>
      currentPage
        ? { title: currentPage.title, url: currentPage.url }
        : undefined,
    [currentPage?.title, currentPage?.url]
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
              if (isLastAssistantMessage && isStreaming && message.status === 'streaming') {
                console.log('[DEBUG] 🚫 ChatView: Skipping last assistant message (streaming)');
                return null;
              }

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onCopy={handleCopy}
                  onRegenerate={
                    isLastAssistantMessage && !isStreaming ? regenerateLastResponse : undefined
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
