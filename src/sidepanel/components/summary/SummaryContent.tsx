/**
 * Summary Content Component
 * Loading, streaming, result, empty state display
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatSummaryTypeLabel } from '@/lib/summary-utils';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SummaryLength, SummaryType } from '../../stores/summaryStore';

interface SummaryContentProps {
  // State
  isLoading: boolean;
  isStreaming: boolean;
  errorMessage: string;
  streamingText: string;
  displayText: string | undefined;

  // Config
  activeType: SummaryType;
  activeLength: SummaryLength;

  // Actions
  onGenerate: () => void;
  onRetry: () => void;
}

export function SummaryContent({
  isLoading,
  isStreaming,
  errorMessage,
  streamingText,
  displayText,
  activeType,
  activeLength,
  onGenerate,
  onRetry,
}: SummaryContentProps) {
  // Error Alert
  if (errorMessage && !isStreaming) {
    return (
      <Alert
        variant="destructive"
        className="mb-4 animate-in slide-in-from-top"
      >
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="ml-2 shrink-0"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Loading Skeleton
  if (isLoading && !isStreaming && !displayText) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md space-y-4">
          <div className="relative">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <div className="absolute inset-0 blur-xl opacity-50">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Generating summary...
            </p>
            <p className="text-xs text-muted-foreground">
              This won't take long
            </p>
          </div>
          {/* Loading skeleton */}
          <div className="space-y-2 pt-4">
            <div className="h-3 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
            <div className="h-3 bg-muted rounded animate-pulse w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  // Streaming State
  if (isStreaming) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-lg">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/10">
            <div className="relative">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="absolute inset-0 blur-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
            <span className="text-sm font-semibold text-primary animate-pulse">
              Streaming summary...
            </span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {streamingText.length} chars
            </Badge>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {streamingText || 'Starting...'}
            </ReactMarkdown>
            <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1 align-middle" />
          </div>
        </Card>
      </div>
    );
  }

  // Display Result
  if (displayText) {
    return (
      <Card className="p-4 shadow-md hover:shadow-lg transition-shadow duration-300 border-muted">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayText}
          </ReactMarkdown>
        </div>
      </Card>
    );
  }

  // Empty State
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-in fade-in-50 zoom-in-95 duration-700">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-3xl opacity-20 animate-pulse" />
        <Sparkles className="relative h-16 w-16 text-primary animate-bounce" />
      </div>
      <h3 className="mb-2 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
        Generate Summary
      </h3>
      <p className="mb-6 text-center text-sm text-muted-foreground max-w-sm leading-relaxed">
        Create a{' '}
        <span className="font-semibold text-foreground">
          {formatSummaryTypeLabel(activeType, activeLength).toLowerCase()}
        </span>{' '}
        using AI-powered summarization
      </p>
      <Button
        onClick={onGenerate}
        size="lg"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
        Generate Summary
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        Powered by Chrome Built-in AI • Privacy-first
      </p>
    </div>
  );
}
