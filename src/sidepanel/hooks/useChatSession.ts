/**
 * useChatSession Hook
 * Manages chat session with AI streaming
 * Handles sending messages, receiving streaming responses, and stop functionality
 */

import { chatService } from '@/sidepanel/services/chatService';
import { conversationService } from '@/sidepanel/services/conversationService';
import { useChatStore } from '@/sidepanel/stores/chatStore';
import type { ChatMode, UseChatSessionReturn } from '@/types/chat.types';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Chat session hook
 */
export function useChatSession(
  mode: ChatMode,
  currentUrl?: string,
  pageTitle?: string,
  pageContent?: string
): UseChatSessionReturn {
  // ✅ Destructure store methods individually for stable references
  const {
    getOrCreateConversation,
    getConversation,
    addMessage,
    updateMessage,
    deleteMessage,
    clearConversation: clearConversationStore,
    updateConversation,
    settings,
  } = useChatStore();

  // Get or create conversation
  const conversation = getOrCreateConversation(mode, currentUrl, pageTitle);

  // Local state
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const modelRef = useRef<any>(null);

  /**
   * Send message and get streaming response
   */
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setError(null);
        setIsGenerating(true);
        setStreamingText('');

        // Validate message
        const validation = chatService.validateMessage(content);
        if (!validation.valid) {
          setError(validation.error || 'Invalid message');
          setIsGenerating(false);
          return;
        }

        const conversationId = conversation.id;

        console.log('[DEBUG] 💬 useChatSession: Sending message...', {
          content: validation.sanitizedContent?.substring(0, 50),
          mode,
          conversationId,
        });

        // Add user message
        addMessage(conversationId, {
          role: 'user',
          content: validation.sanitizedContent || content,
          status: 'sent',
          mode,
          pageUrl: currentUrl,
          pageTitle,
        });

        // Add assistant message placeholder
        const assistantMessageId = addMessage(conversationId, {
          role: 'assistant',
          content: '',
          status: 'streaming',
          mode,
          pageUrl: currentUrl,
          pageTitle,
        });

        console.log(
          '[DEBUG] 📨 useChatSession: Messages added, assistant ID:',
          assistantMessageId
        );

        // Get conversation messages
        const messages = getConversation(conversationId)?.messages || [];
        console.log(
          '[DEBUG] 📜 useChatSession: Total messages in conversation:',
          messages.length
        );

        // Generate response with streaming
        console.log(
          '[DEBUG] 🎬 useChatSession: Calling chatService.generateResponseStreaming...'
        );
        const result = await chatService.generateResponseStreaming(
          messages,
          mode,
          pageContent,
          settings
        );

        console.log(
          '[DEBUG] 🎉 useChatSession: Got streaming result from service'
        );

        // Store refs for stop functionality
        readerRef.current = result.reader;
        modelRef.current = result.model;

        console.log('[DEBUG] 💾 useChatSession: Stored reader and model refs');

        // ✅ FIX: Use the reader already created in chatService
        // DON'T call result.stream.getReader() again - that locks the stream twice!
        const reader = result.reader;
        console.log(
          '[DEBUG] 🔓 useChatSession: Using existing reader from service'
        );

        // Read stream
        let fullText = '';
        let chunkCount = 0;
        console.log('[DEBUG] 🌊 useChatSession: Starting to read stream...');

        try {
          while (true) {
            const { done, value } = await reader.read();
            chunkCount++;

            console.log(`[DEBUG] 📖 useChatSession: Chunk #${chunkCount}:`, {
              done,
              valueLength: value?.length || 0,
              valuePreview: value
                ? value.substring(0, 50) + '...'
                : 'null/undefined',
              fullTextLengthBefore: fullText.length,
            });

            if (done) {
              console.log(
                '[DEBUG] ✅ useChatSession: Stream reading completed',
                {
                  totalChunks: chunkCount,
                  finalTextLength: fullText.length,
                  finalTextPreview: fullText.substring(0, 100) + '...',
                }
              );
              break;
            }

            // Handle undefined or null values
            if (value === undefined || value === null) {
              console.warn(
                '[DEBUG] ⚠️ useChatSession: Received undefined/null chunk, skipping...'
              );
              continue;
            }

            // ✅ FIX: Chrome's promptStreaming returns INCREMENTAL chunks, not full text
            // We need to ACCUMULATE the text ourselves!
            fullText += value; // Append each chunk to build the full text

            console.log(
              `[DEBUG] ✨ useChatSession: Accumulated text length: ${
                fullText.length
              }, preview: "${fullText.substring(fullText.length - 20)}"`
            );

            setStreamingText(fullText);

            // Update message in real-time
            updateMessage(conversationId, assistantMessageId, {
              content: fullText,
              status: 'streaming',
            });
          }
        } catch (streamError: any) {
          console.error(
            '[DEBUG] ❌ useChatSession: Error reading stream:',
            streamError
          );

          // If we have partial text, use it
          if (fullText) {
            console.log(
              '[DEBUG] 💾 useChatSession: Using partial text from stream error:',
              fullText.length
            );
          } else {
            throw streamError; // Re-throw if no text received
          }
        }

        // Finalize message
        console.log('[DEBUG] ✨ useChatSession: Finalizing message...', {
          fullTextLength: fullText.length,
          fullTextPreview: fullText.substring(0, 100) + '...',
        });

        // Safety check: If fullText is empty, something went wrong
        if (!fullText || fullText.trim().length === 0) {
          console.error(
            '[DEBUG] ⚠️ useChatSession: fullText is empty! Stream may not have completed properly'
          );
          throw new Error('No response generated from AI model');
        }

        updateMessage(conversationId, assistantMessageId, {
          content: fullText,
          status: 'sent',
        });

        console.log(
          '[DEBUG] ✅ useChatSession: Message finalized successfully'
        );

        // Update conversation title if first exchange
        if (messages.length === 0) {
          console.log(
            '[DEBUG] 🏷️ useChatSession: First exchange, generating title...'
          );
          const updatedConv = getConversation(conversationId);
          if (updatedConv) {
            const title = conversationService.generateTitle(
              updatedConv.messages
            );
            console.log('[DEBUG] 📝 useChatSession: Generated title:', title);
            updateConversation(conversationId, { title });
          }
        }

        console.log('[DEBUG] 🎊 useChatSession: Message sent successfully!');
        setIsGenerating(false);
        setStreamingText('');
      } catch (err: any) {
        console.error('[DEBUG] ❌ useChatSession: Error in sendMessage:', err);
        console.error('Failed to send message:', err);

        const conversationId = conversation.id;
        const errorMessage = err.message || 'Failed to generate response';
        setError(errorMessage);
        setIsGenerating(false);
        setStreamingText('');

        // Mark last assistant message as error
        const messages = getConversation(conversationId)?.messages || [];
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          console.log(
            '[DEBUG] ⚠️ useChatSession: Marking message as error:',
            lastMessage.id
          );
          updateMessage(conversationId, lastMessage.id, {
            status: 'error',
            error: errorMessage,
          });
        }
      }
    },
    [
      conversation.id,
      mode,
      currentUrl,
      pageTitle,
      pageContent,
      addMessage,
      getConversation,
      updateMessage,
      updateConversation,
      settings,
    ]
  );

  /**
   * Stop ongoing generation
   */
  const stopGeneration = useCallback(() => {
    const conversationId = conversation.id;
    const currentStreamingText = streamingText;

    chatService
      .stopGeneration(readerRef.current, modelRef.current)
      .then(() => {
        // Mark as stopped
        const messages = getConversation(conversationId)?.messages || [];
        const lastMessage = messages[messages.length - 1];
        if (
          lastMessage &&
          lastMessage.role === 'assistant' &&
          lastMessage.status === 'streaming'
        ) {
          updateMessage(conversationId, lastMessage.id, {
            status: 'sent',
            content: currentStreamingText || 'Generation stopped by user.',
          });
        }

        setIsGenerating(false);
        setStreamingText('');
        readerRef.current = null;
        modelRef.current = null;
      })
      .catch((err) => {
        console.error('Error stopping generation:', err);
      });
  }, [conversation.id, streamingText, getConversation, updateMessage]);

  /**
   * Regenerate last response
   */
  const regenerateResponse = useCallback(async () => {
    const conversationId = conversation.id;
    const messages = getConversation(conversationId)?.messages || [];

    // Find last user message
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (!lastUserMessage) {
      setError('No message to regenerate');
      return;
    }

    // Delete last assistant message if exists
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      deleteMessage(conversationId, lastMessage.id);
    }

    // Resend last user message
    await sendMessage(lastUserMessage.content);
  }, [conversation.id, sendMessage, getConversation, deleteMessage]);

  /**
   * Clear conversation
   */
  const clearConversation = useCallback(() => {
    const conversationId = conversation.id;
    clearConversationStore(conversationId);
    setError(null);
    setStreamingText('');
  }, [conversation.id, clearConversationStore]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (readerRef.current || modelRef.current) {
        chatService.stopGeneration(readerRef.current, modelRef.current);
      }
    };
  }, []);

  return {
    conversation,
    sendMessage,
    stopGeneration,
    regenerateLastResponse: regenerateResponse,
    clearConversation,
    isStreaming: isGenerating,
    isLoading: false, // Not implementing preloading yet
    error,
    streamingMessage:
      isGenerating && streamingText
        ? {
            id: 'streaming',
            role: 'assistant',
            content: streamingText,
            timestamp: Date.now(),
            status: 'streaming',
            mode,
            pageUrl: currentUrl,
            pageTitle,
          }
        : null,
  };
}
