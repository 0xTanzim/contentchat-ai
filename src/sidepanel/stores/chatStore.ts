/**
 * Chat Store (Refactored)
 * Enhanced conversation management with dual modes
 * Supports page-context and personal chat modes
 */

import type {
  ChatMode,
  ChatSettings,
  Conversation,
  Message,
  MessageStatus,
} from '@/types/chat.types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Legacy message format (for migration)
 */
interface LegacyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Chat store state
 */
interface ChatState {
  /** All conversations indexed by ID */
  conversations: Record<string, Conversation>;

  /** Active conversation ID */
  activeConversationId: string | null;

  /** User chat settings */
  settings: ChatSettings;

  // Conversation Management
  createConversation: (
    mode: ChatMode,
    url?: string,
    pageTitle?: string
  ) => string;
  getConversation: (id: string) => Conversation | undefined;
  getAllConversations: () => Conversation[];
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;

  // Message Management
  addMessage: (
    conversationId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ) => string;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  setMessageStatus: (
    conversationId: string,
    messageId: string,
    status: MessageStatus
  ) => void;
  clearConversation: (conversationId: string) => void;

  // Queries
  getConversationsByMode: (mode: ChatMode) => Conversation[];
  getConversationByUrl: (url: string) => Conversation | undefined;
  getOrCreateConversation: (
    mode: ChatMode,
    url?: string,
    pageTitle?: string
  ) => Conversation;

  // Settings
  updateSettings: (settings: Partial<ChatSettings>) => void;

  // Utility
  clearAll: () => void;
}

/**
 * Migrate legacy conversations to new format
 */
function migrateLegacyConversations(
  legacyConversations: Record<string, LegacyMessage[]>
): Record<string, Conversation> {
  const newConversations: Record<string, Conversation> = {};

  Object.entries(legacyConversations).forEach(([url, messages]) => {
    const conversationId = `conv_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Convert legacy messages to new format
    const newMessages: Message[] = messages.map((msg) => ({
      ...msg,
      status: 'sent' as MessageStatus,
      mode: 'page-context' as ChatMode,
      pageUrl: url,
      pageTitle: url, // Will be updated when page loads
    }));

    // Create conversation
    newConversations[conversationId] = {
      id: conversationId,
      mode: 'page-context',
      url,
      title: generateTitleFromMessages(newMessages),
      messages: newMessages,
      createdAt: newMessages[0]?.timestamp || Date.now(),
      updatedAt: newMessages[newMessages.length - 1]?.timestamp || Date.now(),
    };
  });

  return newConversations;
}

/**
 * Generate title from first few messages
 */
function generateTitleFromMessages(messages: Message[]): string {
  if (messages.length === 0) return 'New Conversation';

  const firstUserMessage = messages.find((m) => m.role === 'user');
  if (!firstUserMessage) return 'New Conversation';

  // Use first 50 characters of first user message
  const title = firstUserMessage.content.substring(0, 50);
  return title.length < firstUserMessage.content.length ? `${title}...` : title;
}

/**
 * Create chat store
 */
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},
      activeConversationId: null,
      settings: {
        streamSpeed: 'medium',
        temperature: 0.7,
        maxTokens: 2000,
      },

      // Create new conversation
      createConversation: (mode, url, pageTitle) => {
        const id = `conv_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const conversationUrl =
          mode === 'personal' ? 'personal' : url || 'unknown';

        const conversation: Conversation = {
          id,
          mode,
          url: conversationUrl,
          title:
            mode === 'personal' ? 'Personal Chat' : pageTitle || 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          settings: get().settings,
        };

        set((state) => ({
          conversations: {
            ...state.conversations,
            [id]: conversation,
          },
        }));

        return id;
      },

      // Get conversation by ID
      getConversation: (id) => {
        return get().conversations[id];
      },

      // Get all conversations
      getAllConversations: () => {
        return Object.values(get().conversations).sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
      },

      // Update conversation
      updateConversation: (id, updates) => {
        set((state) => {
          const conversation = state.conversations[id];
          if (!conversation) return state;

          return {
            conversations: {
              ...state.conversations,
              [id]: {
                ...conversation,
                ...updates,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      // Delete conversation
      deleteConversation: (id) => {
        set((state) => {
          const { [id]: deleted, ...rest } = state.conversations;
          return {
            conversations: rest,
            activeConversationId:
              state.activeConversationId === id
                ? null
                : state.activeConversationId,
          };
        });
      },

      // Set active conversation
      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      // Add message to conversation
      addMessage: (conversationId, message) => {
        const messageId = `msg_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        set((state) => {
          const conversation = state.conversations[conversationId];
          if (!conversation) return state;

          const newMessage: Message = {
            ...message,
            id: messageId,
            timestamp: Date.now(),
          };

          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conversation,
                messages: [...conversation.messages, newMessage],
                updatedAt: Date.now(),
              },
            },
          };
        });

        return messageId;
      },

      // Update message
      updateMessage: (conversationId, messageId, updates) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (!conversation) return state;

          const messages = conversation.messages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );

          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conversation,
                messages,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      // Delete message
      deleteMessage: (conversationId, messageId) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (!conversation) return state;

          const messages = conversation.messages.filter(
            (msg) => msg.id !== messageId
          );

          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conversation,
                messages,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      // Set message status
      setMessageStatus: (conversationId, messageId, status) => {
        get().updateMessage(conversationId, messageId, { status });
      },

      // Clear all messages in conversation
      clearConversation: (conversationId) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (!conversation) return state;

          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conversation,
                messages: [],
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      // Get conversations by mode
      getConversationsByMode: (mode) => {
        return get()
          .getAllConversations()
          .filter((conv) => conv.mode === mode);
      },

      // Get conversation by URL (for page-context mode)
      getConversationByUrl: (url) => {
        return get()
          .getAllConversations()
          .find((conv) => conv.url === url);
      },

      // Get or create conversation
      getOrCreateConversation: (mode, url, pageTitle) => {
        const state = get();

        // For page-context mode, find existing conversation by URL
        if (mode === 'page-context' && url) {
          const existing = state.getConversationByUrl(url);
          if (existing) return existing;
        }

        // For personal mode, find or create the personal conversation
        if (mode === 'personal') {
          const existing = state
            .getAllConversations()
            .find(
              (conv) => conv.mode === 'personal' && conv.url === 'personal'
            );
          if (existing) return existing;
        }

        // Create new conversation
        const id = state.createConversation(mode, url, pageTitle);
        return state.getConversation(id)!;
      },

      // Update settings
      updateSettings: (settings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings,
          },
        }));
      },

      // Clear all
      clearAll: () => {
        set({
          conversations: {},
          activeConversationId: null,
        });
      },
    }),
    {
      name: 'contentchat-chat-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        settings: state.settings,
      }),
      // Migration from v1 to v2
      migrate: (persistedState: any, version: number) => {
        // Check if this is legacy format
        if (
          persistedState.conversations &&
          !persistedState.conversations[
            Object.keys(persistedState.conversations)[0]
          ]?.id
        ) {
          console.log('🔄 Migrating chat store from v1 to v2...');
          return {
            ...persistedState,
            conversations: migrateLegacyConversations(
              persistedState.conversations
            ),
            activeConversationId: null,
            settings: {
              streamSpeed: 'medium',
              temperature: 0.7,
              maxTokens: 2000,
            },
          };
        }
        return persistedState;
      },
      version: 2,
    }
  )
);
