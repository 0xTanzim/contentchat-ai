/**
 * MessageActions Component
 * Copy and regenerate actions for assistant messages
 */

import { Button } from '@/components/ui/button';
import type { MessageActionsProps } from '@/types/chat.types';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function MessageActions({
  message,
  onCopy,
  onRegenerate,
  showRegenerate = true,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      onCopy?.();

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
      {/* Copy Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="gap-1.5 h-7 text-xs"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            Copy
          </>
        )}
      </Button>

      {/* Regenerate Button */}
      {showRegenerate && onRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="gap-1.5 h-7 text-xs"
        >
          <RefreshCw className="h-3 w-3" />
          Regenerate
        </Button>
      )}
    </div>
  );
}
