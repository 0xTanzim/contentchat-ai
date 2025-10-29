/**
 * useStreamingMessage Hook
 * 🎨 Design Pattern: Command Pattern + State Machine
 *
 * Encapsulates streaming message operations as commands:
 * - Command Pattern: sendMessage, stopGeneration as command objects
 * - State Machine: Manages streaming states (idle, generating, error)
 * - Single Responsibility: Only handles AI streaming logic
 */

import { createLogger } from '@/lib/logger';
import { chatService } from '@/sidepanel/services/chatService';
import { useChatStore } from '@/sidepanel/stores/chatStore';
import { useCallback, useRef, useState } from 'react';

const logger = createLogger('useStreamingMessage');

/**
 * State Machine States
 */
type StreamingState = 'idle' | 'generating' | 'error' | 'stopped';

/**
 * Custom hook for AI streaming message operations
 * Implements Command Pattern for message operations
 */
export function useStreamingMessage(conversationId: string | null) {
  // Store actions
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const settings = useChatStore((state) => state.settings);

  // State Machine
  const [state, setState] = useState<StreamingState>('idle');
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Command execution context (refs for cleanup)
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const modelRef = useRef<any>(null);
  const shouldStopRef = useRef(false);

  /**
   * 🎨 Command Pattern: Send Message Command
   * Encapsulates the entire send message operation
   */
  const sendMessage = useCallback(
    async (
      content: string,
      mode: 'page-context' | 'personal',
      pageContent?: string
    ) => {
      // Guard: Conversation must exist
      if (!conversationId) {
        logger.warn('⚠️ Cannot send message: No conversation ID');
        setError('Conversation not ready');
        setState('error');
        return;
      }

      try {
        // State transition: idle → generating
        setState('generating');
        setError(null);
        setStreamingText('');
        shouldStopRef.current = false;

        // Validate message
        const validation = chatService.validateMessage(content);
        if (!validation.valid) {
          setError(validation.error || 'Invalid message');
          setState('error');
          return;
        }

        logger.debug(
          '📤 Sending message:',
          validation.sanitizedContent?.substring(0, 50)
        );

        // Add user message
        const userMessageId = addMessage(conversationId, {
          role: 'user',
          content: validation.sanitizedContent || content,
          status: 'sent',
          mode,
        });

        // Prepare AI message placeholder
        const aiMessageId = addMessage(conversationId, {
          role: 'assistant',
          content: '',
          status: 'streaming',
          mode,
        });

        // Get conversation history
        const conversation =
          useChatStore.getState().conversations[conversationId];
        const messages = conversation?.messages || [];

        // Execute streaming command with proper chatService API
        logger.debug('🎬 Starting generateResponseStreaming...');
        const result = await chatService.generateResponseStreaming(
          messages,
          mode,
          pageContent,
          settings
        );

        // Store refs for stop functionality
        readerRef.current = result.reader;
        modelRef.current = result.model;

        const reader = result.reader;
        let fullResponse = '';

        // Stream processing loop
        logger.debug('🌊 Reading stream...');
        while (true) {
          if (shouldStopRef.current) {
            logger.debug('⏹️ Stopping stream by user request');
            await reader.cancel();
            setState('stopped');
            break;
          }

          const { done, value } = await reader.read();
          if (done) {
            logger.debug('✅ Stream complete');
            break;
          }

          // Handle null/undefined chunks
          if (!value) continue;

          fullResponse += value;
          setStreamingText(fullResponse);

          // Update message incrementally
          updateMessage(conversationId, aiMessageId, {
            content: fullResponse,
            status: 'streaming',
          });

          // Small delay for responsiveness
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // Mark as complete
        updateMessage(conversationId, aiMessageId, {
          content: fullResponse,
          status: 'completed',
        });

        // Command complete: generating → idle
        setState('idle');
        setStreamingText('');
      } catch (err) {
        // Command failed: any → error
        logger.error('❌ Error sending message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setState('error');
      } finally {
        // Cleanup
        readerRef.current = null;
        modelRef.current = null;
        shouldStopRef.current = false;
      }
    },
    [conversationId, addMessage, updateMessage, settings]
  );

  /**
   * 🎨 Command Pattern: Stop Generation Command
   * Encapsulates the stop operation
   */
  const stopGeneration = useCallback(async () => {
    logger.debug('🛑 Stop generation requested');
    shouldStopRef.current = true;

    // Cancel reader
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (err) {
        logger.warn('Failed to cancel reader:', err);
      }
    }

    // Destroy model
    if (modelRef.current?.destroy) {
      try {
        modelRef.current.destroy();
      } catch (err) {
        logger.warn('Failed to destroy model:', err);
      }
    }

    setState('idle');
  }, []);

  return {
    // State
    isGenerating: state === 'generating',
    streamingText,
    error,
    state,

    // Commands
    sendMessage,
    stopGeneration,
  };
}
