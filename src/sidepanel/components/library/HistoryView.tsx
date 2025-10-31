/**
 * History View Component
 * Displays all generated summaries with metadata
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from '@/lib/date-utils';
import { summaryDB } from '@/lib/db/summaryDB';
import { copyToClipboard, formatSummaryTypeLabel } from '@/lib/summary-utils';
import {
  Calendar,
  Clock,
  Copy,
  Database,
  ExternalLink,
  Eye,
  FileText,
  History as HistoryIcon,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import type { Summary } from '../../stores/summaryStore';
import { useSummaryStore } from '../../stores/summaryStore';
import { SummaryStats } from '../SummaryStats';

export function HistoryView() {
  const { getAllHistory, deleteHistoryItem } = useSummaryStore();
  const history = getAllHistory();
  const [viewingSummary, setViewingSummary] = useState<Summary | null>(null);
  const [dbStats, setDbStats] = useState<{
    total: number;
    totalSize: number;
  } | null>(null);

  // Load database stats on mount
  useEffect(() => {
    summaryDB.getStats().then((stats) => {
      setDbStats({
        total: stats.total,
        totalSize: stats.totalSize,
      });
    });
  }, [history.length]); // Refresh when history changes

  // Group by date
  const groupedHistory = history.reduce((acc, summary) => {
    const date = new Date(summary.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(summary);
    return acc;
  }, {} as Record<string, typeof history>);

  const handleDelete = (url: string, timestamp: number) => {
    deleteHistoryItem(url, timestamp);
    toast.success('Summary deleted', {
      description: 'Removed from library',
    });
  };

  const handleOpenUrl = (url: string) => {
    chrome.tabs.create({ url });
    toast.info('Opening page in new tab');
  };

  const handleViewSummary = (summary: Summary) => {
    setViewingSummary(summary);
  };

  const handleCloseSummary = () => {
    setViewingSummary(null);
  };

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success('Copied to clipboard!');
    } else {
      toast.error('Failed to copy');
    }
  };

  if (history.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md space-y-6 border-dashed border-2">
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 blur-3xl opacity-20 animate-pulse" />
            <div className="relative bg-muted rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <HistoryIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No Summaries Yet</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your generated summaries will appear here. Get started by creating
              your first summary!
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">💡 Tips</p>
            <ul className="text-xs text-muted-foreground space-y-1 text-left">
              <li>• Summaries are automatically saved</li>
              <li>• History is kept for 30 days</li>
              <li>• View or delete anytime</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Navigate to any webpage and use the Summary tab to create your first
            summary
          </p>
        </Card>
      </div>
    );
  }

  // If viewing a summary, show full-screen viewer
  if (viewingSummary) {
    return (
      <div className="flex h-full flex-col">
        {/* Viewer Header */}
        <div className="border-b border-border bg-linear-to-r from-background to-muted/20 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Badge variant="outline" className="mb-2">
                {formatSummaryTypeLabel(
                  viewingSummary.options.type,
                  viewingSummary.options.length
                )}
              </Badge>
              <h2 className="text-xl font-bold truncate mb-1.5">
                {viewingSummary.pageTitle}
              </h2>
              <a
                href={viewingSummary.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary truncate inline-block max-w-full transition-colors"
              >
                {viewingSummary.pageUrl}
              </a>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseSummary}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Stats */}
            <SummaryStats stats={viewingSummary.stats} />

            {/* Content */}
            <Card className="p-6">
              {viewingSummary.options.format === 'markdown' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {viewingSummary.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {viewingSummary.content}
                </div>
              )}
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                onClick={() => handleCopy(viewingSummary.content)}
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Summary
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenUrl(viewingSummary.pageUrl)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-linear-to-r from-background to-muted/20 p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Summary Library</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {history.length}{' '}
                {history.length === 1 ? 'summary' : 'summaries'} saved ·
                Auto-cleanup after 30 days
              </p>
            </div>
            <Badge
              variant="secondary"
              className="text-sm px-3 py-1.5 font-semibold"
            >
              <HistoryIcon className="mr-1.5 h-3.5 w-3.5" />
              {history.length}
            </Badge>
          </div>

          {/* Quick Stats */}
          {history.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>
                  {Object.keys(groupedHistory).length}{' '}
                  {Object.keys(groupedHistory).length === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>
                  {history
                    .reduce((sum, s) => sum + s.stats.summaryWordCount, 0)
                    .toLocaleString()}{' '}
                  words total
                </span>
              </div>
              {dbStats && (
                <>
                  <div className="h-3 w-px bg-border" />
                  <div
                    className="flex items-center gap-1"
                    title="IndexedDB storage"
                  >
                    <Database className="h-3 w-3" />
                    <span>
                      {(dbStats.totalSize / 1024).toFixed(1)} KB stored
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {Object.entries(groupedHistory).map(([date, summaries]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/80 backdrop-blur py-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {date}
                </h3>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                {summaries.map((summary) => (
                  <Card
                    key={summary.timestamp}
                    className="group p-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/30 hover:border-l-primary cursor-pointer"
                  >
                    <div className="space-y-3">
                      {/* Title & Type */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                            {summary.pageTitle}
                          </h4>
                          <a
                            href={summary.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary truncate inline-block max-w-full mt-1 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {summary.pageUrl}
                          </a>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 font-medium"
                        >
                          {formatSummaryTypeLabel(
                            summary.options.type,
                            summary.options.length
                          )}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{summary.stats.summaryWordCount} words</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          <span>
                            {summary.stats.compressionRatio}% compressed
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(summary.timestamp)}</span>
                        </div>
                      </div>

                      {/* Preview */}
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {summary.content.substring(0, 180)}...
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleViewSummary(summary)}
                          className="flex-1"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View Summary
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenUrl(summary.pageUrl)}
                          title="Open page in new tab"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(summary.pageUrl, summary.timestamp)
                          }
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete from library"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
