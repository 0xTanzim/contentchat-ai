/**
 * Summary Action Bar Component
 * Copy, Save, Share, Regenerate actions with toast notifications
 */

import { Copy, RefreshCw, Save, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { copyToClipboard } from '../../lib/summary-utils';

interface SummaryActionBarProps {
  content: string;
  onRegenerate?: () => void;
  onSave?: () => void;
  className?: string;
}

export function SummaryActionBar({
  content,
  onRegenerate,
  onSave,
  className = '',
}: SummaryActionBarProps) {
  const handleCopy = async () => {
    const success = await copyToClipboard(content);
    if (success) {
      toast.success('Copied to clipboard!');
    } else {
      toast.error('Failed to copy');
    }
  };

  const handleSave = () => {
    onSave?.();
    toast.success('Saved to library!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: content });
        toast.success('Shared successfully!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      await handleCopy();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopy}
        className="flex-1"
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={handleSave}
        className="flex-1"
      >
        <Save className="mr-2 h-4 w-4" />
        Save
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={handleShare}
        className="flex-1"
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>

      {onRegenerate && (
        <Button size="sm" variant="outline" onClick={onRegenerate}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
