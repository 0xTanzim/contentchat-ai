/**
 * Summary View Component
 * Displays page summaries in different formats
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { summarizeText } from '@/lib/chrome-ai';
import { getCurrentPageContent } from '@/lib/page-content';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { useSummaryStore, type SummaryType } from '../stores/summaryStore';

const SUMMARY_TYPES: { value: SummaryType; label: string; icon: string }[] = [
  { value: 'key-points', label: 'Key Points', icon: '🎯' },
  { value: 'tl;dr', label: 'TL;DR', icon: '⚡' },
  { value: 'teaser', label: 'Teaser', icon: '📝' },
  { value: 'headline', label: 'Headline', icon: '📰' },
];

export function SummaryView() {
  const { currentPage, setCurrentPage, isLoading, setIsLoading, setError } =
    useAppStore();
  const {
    activeSummaryType,
    setActiveSummaryType,
    getSummary,
    addSummary,
    hasSummary,
  } = useSummaryStore();
  const [localLoading, setLocalLoading] = useState(false);

  const currentSummary = currentPage?.url
    ? getSummary(currentPage.url, activeSummaryType)
    : undefined;

  // Load page content on mount
  useEffect(() => {
    loadPageContent();
  }, []);

  async function loadPageContent() {
    try {
      setIsLoading(true);
      const content = await getCurrentPageContent();
      setCurrentPage(content);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to load page content'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function generateSummary(type: SummaryType) {
    if (!currentPage) {
      setError('No page content available');
      return;
    }

    try {
      setLocalLoading(true);
      setError(null);

      const summary = await summarizeText(currentPage.content, {
        type: type,
        format: 'markdown',
        length: 'medium',
      });

      addSummary(currentPage.url, type, summary);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to generate summary'
      );
    } finally {
      setLocalLoading(false);
    }
  }

  async function handleSummaryTypeChange(type: SummaryType) {
    setActiveSummaryType(type);

    // Auto-generate if doesn't exist
    if (currentPage && !hasSummary(currentPage.url, type)) {
      await generateSummary(type);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="p-6 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Content Available</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Navigate to a webpage to get started
          </p>
          <Button onClick={loadPageContent}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page Info */}
      <div className="border-b border-border p-4">
        <h2 className="mb-1 truncate text-lg font-semibold">
          {currentPage.title}
        </h2>
        <p className="truncate text-sm text-muted-foreground">
          {currentPage.url}
        </p>
      </div>

      {/* Summary Type Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-2 overflow-x-auto p-2">
          {SUMMARY_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={activeSummaryType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSummaryTypeChange(type.value)}
              disabled={localLoading}
              className="whitespace-nowrap"
            >
              <span className="mr-1">{type.icon}</span>
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {localLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Generating summary...
              </p>
            </div>
          </div>
        ) : currentSummary ? (
          <Card className="p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap">{currentSummary}</div>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Generate Summary</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Click to generate a{' '}
              {SUMMARY_TYPES.find(
                (t) => t.value === activeSummaryType
              )?.label.toLowerCase()}
            </p>
            <Button onClick={() => generateSummary(activeSummaryType)}>
              Generate{' '}
              {SUMMARY_TYPES.find((t) => t.value === activeSummaryType)?.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
