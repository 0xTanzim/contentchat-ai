/**
 * History View Component
 * Displays all generated summaries with metadata
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from '@/lib/date-utils';
import { formatSummaryTypeLabel } from '@/lib/summary-utils';
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  History as HistoryIcon,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useSummaryStore } from '../../stores/summaryStore';

export function HistoryView() {
  const { getAllHistory, deleteHistoryItem } = useSummaryStore();
  const history = getAllHistory();

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
  };

  const handleOpenUrl = (url: string) => {
    chrome.tabs.create({ url });
  };

  if (history.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-md space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 blur-3xl opacity-20 animate-pulse" />
            <HistoryIcon className="relative mx-auto h-16 w-16 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No History Yet</h3>
          <p className="text-sm text-muted-foreground">
            Generate your first summary to see it here!
          </p>
          <p className="text-xs text-muted-foreground">
            💡 Summaries are kept for 30 days, then auto-deleted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-linear-to-r from-background to-muted/20 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Summary History</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {history.length} summaries · Auto-cleanup after 30 days
            </p>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <HistoryIcon className="mr-1 h-3 w-3" />
            {history.length}
          </Badge>
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
                    className="p-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary"
                  >
                    <div className="space-y-3">
                      {/* Title & Type */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base truncate mb-1">
                            {summary.pageTitle}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {summary.pageUrl}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {formatSummaryTypeLabel(summary.options.type, summary.options.length)}
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
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {summary.content.substring(0, 150)}...
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenUrl(summary.pageUrl)}
                          className="flex-1"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Open Page
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(summary.pageUrl, summary.timestamp)
                          }
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
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
