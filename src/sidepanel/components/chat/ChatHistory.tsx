/**
 * ChatHistory Component
 * Shows past conversations with load and delete functionality
 */

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useChatStore } from '@/sidepanel/stores/chatStore';
import { History, MessageSquare, Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const ChatHistory = memo(function ChatHistory() {
  const [open, setOpen] = useState(false);

  // ✅ FIX: Use useShallow to prevent infinite re-renders
  // Only re-render when conversations object actually changes
  const conversationsRecord = useChatStore(
    useShallow((state) => state.conversations)
  );

  const setActiveConversation = useChatStore(
    (state) => state.setActiveConversation
  );
  const deleteConversation = useChatStore(
    (state) => state.deleteConversation
  );

  // ✅ Memoize the sorted conversations array
  const conversations = useMemo(() => {
    return Object.values(conversationsRecord).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }, [conversationsRecord]);

  const handleLoadConversation = useCallback(
    (id: string) => {
      setActiveConversation(id);
      setOpen(false);
    },
    [setActiveConversation]
  );

  const handleDeleteConversation = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('Delete this conversation? This cannot be undone.')) {
        deleteConversation(id);
      }
    },
    [deleteConversation]
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
          <History className="h-4 w-4" />
          History
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Past Conversations</SheetTitle>
        </SheetHeader>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No past conversations yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="group flex items-start gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => handleLoadConversation(conv.id)}
                  className="flex-1 text-left cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="font-medium text-sm line-clamp-2 mb-1">
                    {conv.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(conv.updatedAt)}</span>
                    <span>•</span>
                    <span>{conv.messages.length} messages</span>
                  </div>
                  {conv.mode === 'page-context' && conv.url !== 'unknown' && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {conv.url}
                    </div>
                  )}
                </button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8 cursor-pointer"
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});
