/**
 * ChatInput Component
 * Auto-resizing textarea with send button
 */

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ChatInputProps } from '@/types/chat.types';
import { Send, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ChatInput({
  onSend,
  onStop,
  isGenerating = false,
  disabled = false,
  placeholder = 'Ask anything...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  // Handle submit
  const handleSubmit = () => {
    if (!value.trim() || isGenerating || disabled) return;

    onSend(value.trim());
    setValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift = Send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    // Escape = Clear
    if (e.key === 'Escape') {
      setValue('');
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex gap-2 items-end">
        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-11 max-h-[200px] resize-none bg-background"
          rows={1}
        />

        {/* Send/Stop Button */}
        {isGenerating ? (
          <Button
            onClick={onStop}
            variant="destructive"
            size="icon"
            className="shrink-0 h-12 w-12 shadow-xl shadow-red-500/50 dark:shadow-red-500/30 animate-pulse bg-linear-to-br from-red-600 to-red-500 dark:from-red-500 dark:to-red-400 hover:from-red-700 hover:to-red-600 border-2 border-red-400 dark:border-red-300 scale-110"
            title="Stop generating (Click to stop)"
          >
            <Square className="h-5 w-5 fill-current animate-pulse" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            size="icon"
            className="shrink-0 h-11 w-11 shadow-sm hover:shadow-md transition-all hover:scale-105"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hint / Status */}
      {isGenerating ? (
        <div className="mt-2 flex items-center gap-2 text-xs font-medium">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse" />
            <span className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse delay-75" />
            <span className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse delay-150" />
          </div>
          <span className="text-red-600 dark:text-red-400 animate-pulse">
            AI is thinking... Click ⬛ to stop
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 bg-muted dark:bg-muted/60 rounded text-xs font-mono border border-border">
            Enter
          </kbd>
          <span>to send,</span>
          <kbd className="px-1.5 py-0.5 bg-muted dark:bg-muted/60 rounded text-xs font-mono border border-border">
            Shift+Enter
          </kbd>
          <span>for new line</span>
        </p>
      )}
    </div>
  );
}
