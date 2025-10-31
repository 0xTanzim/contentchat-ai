/**
 * Chat Store (Refactored)
 * Enhanced conversation management with dual modes
 * Supports page-context and personal chat modes
 */

import { chatDB } from '@/lib/db/chatDB';
import { createLogger } from '@/lib/logger';
import type {
  ChatMode,
  ChatSettings,
  Conversation,
  Message,
  MessageStatus,
} from '@/types/chat.types';
import { create } from 'zustand';

const logger = createLogger('ChatStore');

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
  startNewChat: (mode: ChatMode, url?: string, pageTitle?: string) => string; // ✅ NEW
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

  // IndexedDB sync
  syncToIndexedDB: (conversationId: string) => Promise<void>;
  loadFromIndexedDB: () => Promise<void>;
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
export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: {},
  activeConversationId: null,
  settings: {
    streamSpeed: 'medium',
    temperature: 0.7,
    maxTokens: 2000,
  },

  // Create new conversation
  createConversation: (mode, url, pageTitle) => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversationUrl = mode === 'personal' ? 'personal' : url || 'unknown';

    const conversation: Conversation = {
      id,
      mode,
      url: conversationUrl,
      title: mode === 'personal' ? 'Personal Chat' : pageTitle || 'New Chat',
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

    // ✅ Sync to IndexedDB
    chatDB.saveConversation(conversation).catch((error) => {
      logger.error('Failed to sync conversation to IndexedDB:', error);
    });

    return id;
  },

  // ✅ NEW: Start fresh chat conversation
  startNewChat: (mode, url, pageTitle) => {
    const id = get().createConversation(mode, url, pageTitle);
    set({ activeConversationId: id });
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

      const updatedConversation = {
        ...conversation,
        ...updates,
        updatedAt: Date.now(),
      };

      // ✅ Sync to IndexedDB
      chatDB.saveConversation(updatedConversation).catch((error) => {
        logger.error('Failed to sync conversation update to IndexedDB:', error);
      });

      return {
        conversations: {
          ...state.conversations,
          [id]: updatedConversation,
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
          state.activeConversationId === id ? null : state.activeConversationId,
      };
    });

    // ✅ Delete from IndexedDB
    chatDB.deleteConversation(id).catch((error) => {
      logger.error('Failed to delete conversation from IndexedDB:', error);
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

      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, newMessage],
        updatedAt: Date.now(),
      };

      // ✅ Sync to IndexedDB
      chatDB.saveConversation(updatedConversation).catch((error) => {
        logger.error('Failed to sync message to IndexedDB:', error);
      });

      return {
        conversations: {
          ...state.conversations,
          [conversationId]: updatedConversation,
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

      const updatedConversation = {
        ...conversation,
        messages,
        updatedAt: Date.now(),
      };

      // ✅ Sync to IndexedDB
      chatDB.saveConversation(updatedConversation).catch((error) => {
        logger.error('Failed to sync message update to IndexedDB:', error);
      });

      return {
        conversations: {
          ...state.conversations,
          [conversationId]: updatedConversation,
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
    // ✅ FIX: Use Object.values directly instead of getAllConversations()
    if (mode === 'personal') {
      const existing = Object.values(state.conversations).find(
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

  // ✅ Sync specific conversation to IndexedDB
  syncToIndexedDB: async (conversationId: string) => {
    const conversation = get().conversations[conversationId];
    if (conversation) {
      try {
        await chatDB.saveConversation(conversation);
        logger.debug('✅ Synced conversation to IndexedDB:', conversationId);
      } catch (error) {
        logger.error('❌ Failed to sync to IndexedDB:', error);
      }
    }
  },

  // ✅ Load all conversations from IndexedDB on startup
  loadFromIndexedDB: async () => {
    try {
      const conversations = await chatDB.getAllConversations();
      const conversationsRecord: Record<string, Conversation> = {};

      // ✅ Type guard: Only load valid Conversation objects
      conversations.forEach((conv) => {
        // Validate it's a Conversation (has messages array, not content string)
        if (
          conv &&
          typeof conv === 'object' &&
          'id' in conv &&
          'mode' in conv &&
          'messages' in conv &&
          Array.isArray(conv.messages) &&
          !('content' in conv) // Summaries have content, conversations don't
        ) {
          conversationsRecord[conv.id] = conv;
        } else {
          logger.warn('⚠️ Skipped invalid conversation object:', {
            id: conv?.id,
            hasMessages: 'messages' in conv,
            isArray: Array.isArray(conv?.messages),
          });
        }
      });

      set({ conversations: conversationsRecord });
      logger.info('✅ Loaded conversations from IndexedDB:', {
        count: Object.keys(conversationsRecord).length,
        total: conversations.length,
      });
    } catch (error) {
      logger.error('❌ Failed to load from IndexedDB:', error);
    }
  },
}));
