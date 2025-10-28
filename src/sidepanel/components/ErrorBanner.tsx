/**
 * Error Banner Component
 * Displays error messages with dismiss action
 */

import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export function ErrorBanner() {
  const { error, clearError } = useAppStore();

  if (!error) return null;

  return (
    <div className="border-b border-destructive/20 bg-destructive/10 p-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <p className="flex-1 text-sm text-destructive">{error}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={clearError}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
