/**
 * Summary Actions Component
 * Copy, Save, Share, Regenerate buttons
 */

import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Save, Share2 } from 'lucide-react';

interface SummaryActionsProps {
  text: string;
  onCopy: (text: string) => void;
  onSave: () => void;
  onShare: (text: string) => void;
  onRegenerate: () => void;
}

export function SummaryActions({
  text,
  onCopy,
  onSave,
  onShare,
  onRegenerate,
}: SummaryActionsProps) {
  return (
    <div className="flex gap-3 animate-in slide-in-from-bottom duration-700">
      <Button
        size="default"
        variant="outline"
        onClick={() => onCopy(text)}
        className="flex-1 hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 font-medium"
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy
      </Button>
      <Button
        size="default"
        variant="outline"
        onClick={onSave}
        className="flex-1 hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 font-medium"
      >
        <Save className="mr-2 h-4 w-4" />
        Save
      </Button>
      <Button
        size="default"
        variant="outline"
        onClick={() => onShare(text)}
        className="flex-1 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 font-medium"
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
      <Button
        size="default"
        variant="outline"
        onClick={onRegenerate}
        title="Regenerate"
        className="hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200 hover:rotate-180 font-medium"
      >
        <RefreshCw className="h-4 w-4 transition-transform duration-300" />
      </Button>
    </div>
  );
}
