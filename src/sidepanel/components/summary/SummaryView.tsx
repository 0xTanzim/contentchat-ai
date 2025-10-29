/**
 * Summary View Component (Refactored)
 * Production-grade implementation with clean separation of concerns
 * Uses custom hooks for business logic, keeps component focused on UI
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { copyToClipboard } from '@/lib/summary-utils';
import type { PageContent } from '@/types/summary.types';
import { FileText, Loader2, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useSummarizer, useTypewriter } from '../../hooks';
import { useSummaryStore } from '../../stores/summaryStore';
import { SummaryActions } from './SummaryActions';
import { SummaryContent } from './SummaryContent';
import { SummaryOptions } from './SummaryOptions';
import { SummaryStats } from './SummaryStats';
import { SummaryTypeSelector } from './SummaryTypeSelector';

interface SummaryViewProps {
  currentPage: PageContent | null;
  isPageLoading: boolean;
  pageError: string | null;
  onReload: () => Promise<void>;
}

/**
 * Main Summary View Component
 * Orchestrates UI using custom hooks for all business logic
 */
export function SummaryView({
  currentPage,
  isPageLoading: pageLoading,
  pageError,
  onReload: reload,
}: SummaryViewProps) {
  // Theme
  const { theme, setTheme } = useTheme();

  // Global state (Zustand)
  const { activeOptions, setActiveOptions, getSummary } = useSummaryStore();

  // Local UI state (minimal)
  const [showOptions, setShowOptions] = useState(false);

  // Custom hooks (business logic) - currentPage now comes from props

  const {
    generate,
    stop,
    isStreaming,
    isLoading: summaryLoading,
    streamingText,
    finalResult,
    error: summaryError,
    stats: currentStats,
  } = useSummarizer(currentPage, activeOptions);

  const { displayText: animatedText } = useTypewriter(
    streamingText,
    isStreaming
  );

  // Derived state
  const cachedSummary = currentPage?.url
    ? getSummary(currentPage.url, activeOptions)
    : undefined;
  const displayText = isStreaming
    ? animatedText
    : finalResult || cachedSummary?.content;
  const displayStats = currentStats || cachedSummary?.stats;
  const errorMessage = summaryError || pageError;

  // ✅ Event handlers with useCallback for stable references (React 19 optimization)
  const handleCopy = useCallback(async (text: string) => {
    if (!text || text.trim().length === 0) {
      toast.error('Nothing to copy');
      return;
    }

    const success = await copyToClipboard(text);
    if (success) {
      toast.success('Copied to clipboard!', {
        description: `${text.split(' ').length} words copied`,
      });
    } else {
      toast.error('Failed to copy');
    }
  }, []);

  const handleSave = useCallback(() => {
    toast.success('Saved to library!');
    // Library save is automatic via history service
  }, []);

  const handleShare = useCallback(
    async (text: string) => {
      if (navigator.share) {
        try {
          await navigator.share({ text });
          toast.success('Shared successfully!');
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            toast.error('Failed to share');
          }
        }
      } else {
        await handleCopy(text);
      }
    },
    [handleCopy]
  );

  const handleRetry = useCallback(() => {
    generate();
  }, [generate]);

  // Loading state
  if (pageLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No content state
  if (!currentPage) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="p-6 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Content Available</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Navigate to a webpage to get started
          </p>
          <Button onClick={reload}>Retry</Button>
        </Card>
      </div>
    );
  }

  // Main UI
  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex h-full flex-col">
        {/* Page Info Header */}
        <div className="border-b border-border bg-linear-to-r from-background to-muted/20 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="mb-1.5 truncate text-xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text leading-tight">
                {currentPage.title}
              </h2>
              <p className="truncate text-sm text-muted-foreground font-medium">
                {currentPage.url}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="shrink-0 h-10 w-10"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-blue-500" />
              )}
            </Button>
          </div>
        </div>

        {/* Summary Type Selector */}
        <SummaryTypeSelector
          activeType={activeOptions.type}
          onTypeChange={(type) => setActiveOptions({ type })}
          showOptions={showOptions}
          onToggleOptions={() => setShowOptions(!showOptions)}
          disabled={summaryLoading}
        />

        {/* Options Panel */}
        {showOptions && (
          <SummaryOptions
            length={activeOptions.length}
            format={activeOptions.format}
            context={activeOptions.context || ''}
            detailLevel={activeOptions.detailLevel}
            onLengthChange={(length) => setActiveOptions({ length })}
            onFormatChange={(format) => setActiveOptions({ format })}
            onContextChange={(context) => setActiveOptions({ context })}
            onDetailLevelChange={(detailLevel) =>
              setActiveOptions({ detailLevel })
            }
          />
        )}

        {/* Summary Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            <SummaryContent
              isLoading={summaryLoading}
              isStreaming={isStreaming}
              errorMessage={errorMessage || ''}
              streamingText={animatedText}
              displayText={displayText}
              activeType={activeOptions.type}
              activeLength={activeOptions.length}
              onGenerate={generate}
              onStop={stop}
              onRetry={handleRetry}
            />

            {displayText && !isStreaming && !summaryLoading && (
              <>
                {displayStats && (
                  <SummaryStats
                    originalWordCount={displayStats.originalWordCount}
                    summaryWordCount={displayStats.summaryWordCount}
                    compressionRatio={displayStats.compressionRatio}
                    readingTime={displayStats.readingTime}
                  />
                )}
                <SummaryActions
                  text={displayText}
                  onCopy={handleCopy}
                  onSave={handleSave}
                  onShare={handleShare}
                  onRegenerate={generate}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
