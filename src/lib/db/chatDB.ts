/**
 * Chat Database (IndexedDB)
 * Persistent storage for chat conversations
 * Stores last 30 days of conversations
 */

import type { Conversation } from '@/types/chat.types';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { createLogger } from '../logger';

const logger = createLogger('ChatDB');

// Database name and version
const DB_NAME = 'contentchat-conversations';
const DB_VERSION = 1;
const STORE_NAME = 'conversations';

// Retention period (30 days)
const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Database schema
 */
interface ChatDB extends DBSchema {
  conversations: {
    key: string; // conversation ID
    value: Conversation;
    indexes: {
      'by-mode': string; // mode
      'by-url': string; // url
      'by-updated': number; // updatedAt
      'by-created': number; // createdAt
    };
  };
}

/**
 * Chat Database Service
 */
class ChatDatabase {
  private db: IDBPDatabase<ChatDB> | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize database
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        logger.info('🗄️ Initializing chat database...');

        this.db = await openDB<ChatDB>(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Create conversations store
            const store = db.createObjectStore(STORE_NAME, {
              keyPath: 'id',
            });

            // Create indexes
            store.createIndex('by-mode', 'mode');
            store.createIndex('by-url', 'url');
            store.createIndex('by-updated', 'updatedAt');
            store.createIndex('by-created', 'createdAt');

            logger.info('✅ Database schema created');
          },
        });

        logger.info('✅ Chat database initialized');

        // Cleanup old conversations on startup
        await this.cleanupOld();
      } catch (error) {
        logger.error('❌ Failed to initialize database:', {
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : error,
        });
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Save conversation
   */
  async saveConversation(conversation: Conversation): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.put(STORE_NAME, conversation);
      logger.debug('💾 Conversation saved:', { id: conversation.id });
    } catch (error) {
      logger.error('❌ Failed to save conversation:', { error });
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(id: string): Promise<Conversation | undefined> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const conversation = await this.db.get(STORE_NAME, id);
      logger.debug('📖 Conversation retrieved:', { id, found: !!conversation });
      return conversation;
    } catch (error) {
      logger.error('❌ Failed to get conversation:', { error });
      throw error;
    }
  }

  /**
   * Get all conversations
   */
  async getAllConversations(): Promise<Conversation[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const conversations = await this.db.getAll(STORE_NAME);
      logger.debug('📚 Retrieved all conversations:', {
        count: conversations.length,
      });

      // Sort by updatedAt (newest first)
      return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      logger.error('❌ Failed to get all conversations:', { error });
      throw error;
    }
  }

  /**
   * Get conversations by mode
   */
  async getConversationsByMode(mode: string): Promise<Conversation[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const conversations = await this.db.getAllFromIndex(
        STORE_NAME,
        'by-mode',
        mode
      );
      logger.debug('📚 Retrieved conversations by mode:', {
        mode,
        count: conversations.length,
      });

      // Sort by updatedAt (newest first)
      return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      logger.error('❌ Failed to get conversations by mode:', { error });
      throw error;
    }
  }

  /**
   * Get recent conversations
   */
  async getRecentConversations(limit: number = 50): Promise<Conversation[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const conversations = await this.getAllConversations();
      const recent = conversations.slice(0, limit);

      logger.debug('📚 Retrieved recent conversations:', {
        limit,
        count: recent.length,
      });
      return recent;
    } catch (error) {
      logger.error('❌ Failed to get recent conversations:', { error });
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.delete(STORE_NAME, id);
      logger.info('🗑️ Conversation deleted:', { id });
    } catch (error) {
      logger.error('❌ Failed to delete conversation:', { error });
      throw error;
    }
  }

  /**
   * Delete multiple conversations
   */
  async deleteConversations(ids: string[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);

      logger.info('🗑️ Multiple conversations deleted:', { count: ids.length });
    } catch (error) {
      logger.error('❌ Failed to delete conversations:', { error });
      throw error;
    }
  }

  /**
   * Cleanup old conversations (older than RETENTION_DAYS)
   */
  async cleanupOld(): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const cutoffTime = Date.now() - RETENTION_MS;
      const conversations = await this.getAllConversations();

      const oldConversations = conversations.filter(
        (conv) => conv.updatedAt < cutoffTime
      );

      if (oldConversations.length === 0) {
        logger.debug('✅ No old conversations to cleanup');
        return 0;
      }

      await this.deleteConversations(oldConversations.map((c) => c.id));

      logger.info('🧹 Cleaned up old conversations:', {
        count: oldConversations.length,
        retentionDays: RETENTION_DAYS,
      });

      return oldConversations.length;
    } catch (error) {
      logger.error('❌ Failed to cleanup old conversations:', { error });
      throw error;
    }
  }

  /**
   * Clear all conversations
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.clear(STORE_NAME);
      logger.info('🗑️ All conversations cleared');
    } catch (error) {
      logger.error('❌ Failed to clear all conversations:', { error });
      throw error;
    }
  }

  /**
   * Get database stats
   */
  async getStats(): Promise<{
    total: number;
    byMode: Record<string, number>;
    oldestDate: number | null;
    newestDate: number | null;
  }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const conversations = await this.getAllConversations();

      const byMode: Record<string, number> = {};
      let oldestDate: number | null = null;
      let newestDate: number | null = null;

      conversations.forEach((conv) => {
        byMode[conv.mode] = (byMode[conv.mode] || 0) + 1;

        if (!oldestDate || conv.createdAt < oldestDate) {
          oldestDate = conv.createdAt;
        }
        if (!newestDate || conv.updatedAt > newestDate) {
          newestDate = conv.updatedAt;
        }
      });

      return {
        total: conversations.length,
        byMode,
        oldestDate,
        newestDate,
      };
    } catch (error) {
      logger.error('❌ Failed to get stats:', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const chatDB = new ChatDatabase();
