/**
 * ChatHeader Component
 * Mode switcher and conversation controls
 */

import { Button } from '@/components/ui/button';
import { useChatStore } from '@/sidepanel/stores/chatStore';
import type { ChatHeaderProps } from '@/types/chat.types';
import { Globe, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { ChatHistory } from './ChatHistory';

export const ChatHeader = memo(function ChatHeader({
  mode,
  onModeChange,
  onClear,
  hasMessages,
  pageInfo,
}: ChatHeaderProps) {
  const startNewChat = useChatStore((state) => state.startNewChat);

  const handleNewChat = () => {
    const url =
      mode === 'page-context' ? pageInfo?.url || 'unknown' : undefined;
    const title =
      mode === 'page-context' ? pageInfo?.title || 'New Chat' : 'Personal Chat';
    startNewChat(mode, url, title);
  };

  return (
    <div className="border-b border-border bg-background">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1 bg-muted/50 dark:bg-muted/30 rounded-lg p-1 border border-border/50">
          <Button
            variant={mode === 'page-context' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('page-context')}
            className={`gap-2 transition-all duration-300 relative cursor-pointer ${
              mode === 'page-context'
                ? 'bg-linear-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 text-white shadow-lg shadow-blue-500/50 scale-105 font-semibold'
                : 'hover:bg-muted dark:hover:bg-muted/60 text-muted-foreground hover:text-foreground hover:scale-105'
            }`}
          >
            <Globe
              className={`h-4 w-4 ${
                mode === 'page-context' ? 'animate-pulse' : ''
              }`}
            />
            Page Context
            {mode === 'page-context' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 dark:bg-green-300 rounded-full animate-pulse" />
            )}
          </Button>
          <Button
            variant={mode === 'personal' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('personal')}
            className={`gap-2 transition-all duration-300 relative cursor-pointer ${
              mode === 'personal'
                ? 'bg-linear-to-r from-purple-600 to-purple-500 dark:from-purple-500 dark:to-purple-400 text-white shadow-lg shadow-purple-500/50 scale-105 font-semibold'
                : 'hover:bg-muted dark:hover:bg-muted/60 text-muted-foreground hover:text-foreground hover:scale-105'
            }`}
          >
            <MessageSquare
              className={`h-4 w-4 ${
                mode === 'personal' ? 'animate-pulse' : ''
              }`}
            />
            Personal
            {mode === 'personal' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 dark:bg-green-300 rounded-full animate-pulse" />
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="gap-2 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>

          <ChatHistory />

          {hasMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Page Context Indicator */}
      {mode === 'page-context' && pageInfo && (
        <div className="px-4 pb-3 pt-1">
          <div
            className="flex items-center gap-2 text-xs
      text-blue-700 dark:text-blue-200
      bg-blue-50/80 dark:bg-blue-950/40
      border border-blue-300 dark:border-blue-800
      rounded-md px-3 py-2 shadow-sm
    "
          >
            <Globe className="h-3 w-3 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="font-semibold">Chatting about:</span>
            <span className="truncate font-medium">{pageInfo.title}</span>
          </div>
        </div>
      )}
    </div>
  );
});
