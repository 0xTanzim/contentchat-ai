/**
 * ChatHeader Component
 * Mode switcher and conversation controls
 */

import { Button } from '@/components/ui/button';
import type { ChatHeaderProps } from '@/types/chat.types';
import { Globe, MessageSquare, Trash2 } from 'lucide-react';
import { memo } from 'react';

export const ChatHeader = memo(function ChatHeader({
  mode,
  onModeChange,
  onClear,
  hasMessages,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2">
        <Button
          variant={mode === 'page-context' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('page-context')}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          Page Context
        </Button>
        <Button
          variant={mode === 'personal' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('personal')}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Personal
        </Button>
      </div>

      {/* Clear Button */}
      {hasMessages && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
});
