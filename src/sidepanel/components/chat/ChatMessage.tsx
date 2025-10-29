/**
 * ChatMessage Component
 * Displays user and assistant messages with markdown support
 */

import { Card } from '@/components/ui/card';
import { createLogger } from '@/lib/logger';
import { MessageActions } from '@/sidepanel/components/chat/MessageActions';
import type { ChatMessageProps } from '@/types/chat.types';
import 'highlight.js/styles/github-dark.css';
import { AlertCircle, Bot, User } from 'lucide-react';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

// Create logger for this component
const logger = createLogger('ChatMessage');

export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming = false,
  streamingText,
  showActions = true,
  onCopy,
  onRegenerate,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const content = isStreaming
    ? streamingText || message.content
    : message.content;

  // ✅ Debug: Log what's being rendered
  logger.debug('💬 Rendering message:', {
    messageId: message.id,
    role: message.role,
    isStreaming,
    isError,
    contentLength: content?.length || 0,
    contentPreview: content?.substring(0, 50) || 'EMPTY',
    streamingTextLength: streamingText?.length || 0,
    messageContentLength: message.content?.length || 0,
  });

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}

      {/* Message Card */}
      <Card
        className={`max-w-[80%] px-4 py-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : isError
            ? 'bg-destructive/10 border-destructive/50'
            : 'bg-muted/50'
        }`}
      >
        {/* Error Icon */}
        {isError && (
          <div className="flex items-center gap-2 mb-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
        )}

        {/* Content */}
        <div
          className={`prose prose-sm max-w-none ${
            isUser ? 'prose-invert' : ''
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="mt-2 flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
          </div>
        )}

        {/* Error Message */}
        {isError && message.error && (
          <p className="mt-2 text-sm text-destructive">{message.error}</p>
        )}

        {/* Actions */}
        {!isUser && !isStreaming && showActions && onCopy && (
          <MessageActions
            message={message}
            onCopy={() => onCopy(content)}
            onRegenerate={onRegenerate}
          />
        )}
      </Card>

      {/* User Avatar */}
      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-5 w-5 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
});
