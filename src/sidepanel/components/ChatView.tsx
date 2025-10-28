/**
 * Chat View Component
 * Chat interface for asking questions about the page
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { promptWithContext } from '@/lib/chrome-ai';
import { Loader2, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { useChatStore } from '../stores/chatStore';

export function ChatView() {
  const { currentPage, setError } = useAppStore();
  const { getMessages, addMessage, clearConversation } = useChatStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = currentPage?.url ? getMessages(currentPage.url) : [];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSendMessage() {
    if (!input.trim() || !currentPage || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    addMessage(currentPage.url, {
      role: 'user',
      content: userMessage,
    });

    try {
      setIsLoading(true);
      setError(null);

      // Get AI response
      const response = await promptWithContext(
        userMessage,
        currentPage.content
      );

      // Add assistant message
      addMessage(currentPage.url, {
        role: 'assistant',
        content: response,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to get response'
      );

      // Add error message
      addMessage(currentPage.url, {
        role: 'assistant',
        content:
          'Sorry, I encountered an error processing your request. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function handleClearChat() {
    if (currentPage?.url) {
      clearConversation(currentPage.url);
    }
  }

  if (!currentPage) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="p-6 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Content Available</h3>
          <p className="text-sm text-muted-foreground">
            Navigate to a webpage to start chatting
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Chat with Page</h2>
          <p className="text-sm text-muted-foreground">
            Ask questions about the content
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearChat}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Start a Conversation</h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              Ask questions about the page content and get AI-powered answers
            </p>
            <div className="flex flex-col gap-2 text-left">
              <p className="text-xs text-muted-foreground">Try asking:</p>
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => setInput('What are the main points?')}
              >
                "What are the main points?"
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() =>
                  setInput('Can you explain this in simple terms?')
                }
              >
                "Can you explain this in simple terms?"
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <Card
                  className={`max-w-[85%] p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </p>
                  <p className="mt-1 text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="max-w-[85%] bg-muted p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
