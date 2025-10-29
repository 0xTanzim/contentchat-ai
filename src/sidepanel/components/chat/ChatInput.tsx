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
    <div className="border-t border-gray-200 p-4">
      <div className="flex gap-2 items-end">
        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] max-h-[200px] resize-none"
          rows={1}
        />

        {/* Send/Stop Button */}
        {isGenerating ? (
          <Button
            onClick={onStop}
            variant="destructive"
            size="icon"
            className="flex-shrink-0"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-500 mt-2">
        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> to
        send, <kbd className="px-1 py-0.5 bg-gray-100 rounded">Shift+Enter</kbd>{' '}
        for new line
      </p>
    </div>
  );
}
