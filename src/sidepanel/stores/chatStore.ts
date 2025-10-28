/**
 * Chat Store - Manages chat messages and conversation state
 * Handles message history per page URL
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  // Messages by URL
  conversations: Record<string, Message[]>;

  // Current conversation URL
  currentUrl: string | null;
  setCurrentUrl: (url: string | null) => void;

  // Get messages for current URL
  getMessages: (url: string) => Message[];

  // Add message
  addMessage: (url: string, message: Omit<Message, 'id' | 'timestamp'>) => void;

  // Clear conversation
  clearConversation: (url: string) => void;

  // Clear all
  clearAll: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},
      currentUrl: null,

      setCurrentUrl: (url) => set({ currentUrl: url }),

      getMessages: (url) => {
        const state = get();
        return state.conversations[url] || [];
      },

      addMessage: (url, message) =>
        set((state) => {
          const existingMessages = state.conversations[url] || [];
          const newMessage: Message = {
            ...message,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
          };

          return {
            conversations: {
              ...state.conversations,
              [url]: [...existingMessages, newMessage],
            },
          };
        }),

      clearConversation: (url) =>
        set((state) => {
          const { [url]: _, ...rest } = state.conversations;
          return { conversations: rest };
        }),

      clearAll: () => set({ conversations: {} }),
    }),
    {
      name: 'contentchat-conversations',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);
