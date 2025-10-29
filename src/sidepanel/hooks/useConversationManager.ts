/**
 * useConversationManager Hook
 * 🎨 Design Pattern: Factory Pattern + Lazy Initialization
 *
 * Manages conversation lifecycle with clean separation of concerns:
 * - Factory: Creates conversations through a stable factory function
 * - Lazy Init: Uses lazy state initialization to avoid render-phase side effects
 * - Single Responsibility: Only handles conversation lookup/creation
 */

import { createLogger } from '@/lib/logger';
import { useChatStore } from '@/sidepanel/stores/chatStore';
import type { ChatMode } from '@/types/chat.types';
import { useCallback, useEffect, useRef, useState } from 'react';

const logger = createLogger('useConversationManager');

/**
 * Custom hook for managing conversation lifecycle
 * Implements Factory Pattern for conversation creation
 */
export function useConversationManager(
  mode: ChatMode,
  currentUrl?: string,
  pageTitle?: string
) {
  // Store selectors - only subscribe to what we need
  const getOrCreateConversation = useChatStore(
    (state) => state.getOrCreateConversation
  );
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId
  );
  const conversations = useChatStore((state) => state.conversations);

  // Track initialization to prevent duplicate creation
  const isInitialized = useRef(false);

  /**
   * 🎨 Factory Pattern: Conversation Factory Function
   * Stable factory that creates conversations without triggering re-renders
   */
  const conversationFactory = useCallback(() => {
    logger.debug('🏭 Factory: Creating/finding conversation', {
      mode,
      currentUrl,
    });

    // 1. Check if active conversation matches mode
    if (activeConversationId && conversations[activeConversationId]) {
      const activeConv = conversations[activeConversationId];
      if (activeConv.mode === mode) {
        logger.debug('✅ Using active conversation:', activeConversationId);
        return activeConversationId;
      }
    }

    // 2. For page-context, find by URL
    if (mode === 'page-context' && currentUrl) {
      const existing = Object.values(conversations).find(
        (conv) => conv.mode === 'page-context' && conv.url === currentUrl
      );
      if (existing) {
        logger.debug(
          '✅ Found existing page-context conversation:',
          existing.id
        );
        return existing.id;
      }
    }

    // 3. For personal mode, find existing
    if (mode === 'personal') {
      const existing = Object.values(conversations).find(
        (conv) => conv.mode === 'personal' && conv.url === 'personal'
      );
      if (existing) {
        logger.debug('✅ Found existing personal conversation:', existing.id);
        return existing.id;
      }
    }

    // 4. Create new conversation
    logger.debug('🆕 Creating new conversation');
    const newConv = getOrCreateConversation(mode, currentUrl, pageTitle);
    return newConv.id;
  }, [
    mode,
    currentUrl,
    pageTitle,
    activeConversationId,
    conversations,
    getOrCreateConversation,
  ]);

  /**
   * 🎨 Lazy Initialization Pattern
   * Initialize conversation ID lazily on first render
   * This ensures creation happens once, outside the render phase
   */
  const [conversationId, setConversationId] = useState<string | null>(() => {
    // Check if conversation exists WITHOUT creating it
    if (
      activeConversationId &&
      conversations[activeConversationId]?.mode === mode
    ) {
      isInitialized.current = true;
      return activeConversationId;
    }

    // For page-context, check existing
    if (mode === 'page-context' && currentUrl) {
      const existing = Object.values(conversations).find(
        (conv) => conv.mode === 'page-context' && conv.url === currentUrl
      );
      if (existing) {
        isInitialized.current = true;
        return existing.id;
      }
    }

    // For personal, check existing
    if (mode === 'personal') {
      const existing = Object.values(conversations).find(
        (conv) => conv.mode === 'personal' && conv.url === 'personal'
      );
      if (existing) {
        isInitialized.current = true;
        return existing.id;
      }
    }

    // Will create in useEffect
    return null;
  });

  /**
   * 🎨 Effect Pattern: Initialize conversation after mount
   * Only runs if lazy initialization didn't find existing conversation
   */
  useEffect(() => {
    if (!isInitialized.current && !conversationId) {
      logger.debug('🎬 Initializing conversation...');
      const id = conversationFactory();
      setConversationId(id);
      isInitialized.current = true;
    }
    // Only run on mount or when conversationId becomes null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  /**
   * 🎨 Observer Pattern: Watch for activeConversationId changes (New Chat button)
   * Switch to the active conversation when store updates
   */
  useEffect(() => {
    if (activeConversationId && activeConversationId !== conversationId) {
      const activeConv = conversations[activeConversationId];
      if (activeConv && activeConv.mode === mode) {
        logger.debug(
          '🔄 Switching to active conversation:',
          activeConversationId
        );
        setConversationId(activeConversationId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  /**
   * 🎨 Observer Pattern: Watch for mode/URL changes
   * Switch conversation when context changes (but don't recreate)
   */
  useEffect(() => {
    if (isInitialized.current && conversationId) {
      // Check if we need to switch to a different conversation
      const currentConv = conversations[conversationId];

      // If current conversation doesn't match mode/url, find the right one
      if (
        !currentConv ||
        (mode === 'page-context' && currentConv.url !== currentUrl) ||
        (mode === 'personal' && currentConv.mode !== 'personal') ||
        currentConv.mode !== mode
      ) {
        logger.debug('📝 Context changed, finding appropriate conversation');

        // Find existing conversation for new context
        let targetId: string | null = null;

        if (mode === 'page-context' && currentUrl) {
          const existing = Object.values(conversations).find(
            (conv) => conv.mode === 'page-context' && conv.url === currentUrl
          );
          targetId = existing?.id || null;
        } else if (mode === 'personal') {
          const existing = Object.values(conversations).find(
            (conv) => conv.mode === 'personal'
          );
          targetId = existing?.id || null;
        }

        // If found different conversation, switch to it
        if (targetId && targetId !== conversationId) {
          setConversationId(targetId);
        } else if (!targetId) {
          // Need to create new conversation
          const newId = getOrCreateConversation(mode, currentUrl, pageTitle);
          setConversationId(newId.id);
        }
      }
    }
    // Only watch mode and currentUrl changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currentUrl]);

  // Get live conversation object
  const conversation = conversationId
    ? conversations[conversationId]
    : undefined;

  return {
    conversationId,
    conversation,
    isReady: !!conversationId,
  };
}
