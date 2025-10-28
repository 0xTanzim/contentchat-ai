/**
 * Summary Stats Component
 * Display word count, compression ratio, reading time
 */

import { Badge } from '@/components/ui/badge';
import { formatReadingTime } from '@/lib/summary-utils';
import { Clock, FileText, TrendingDown } from 'lucide-react';

interface SummaryStatsProps {
  originalWordCount: number;
  summaryWordCount: number;
  compressionRatio: number;
  readingTime: number;
}

export function SummaryStats({
  originalWordCount,
  summaryWordCount,
  compressionRatio,
  readingTime,
}: SummaryStatsProps) {
  return (
    <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom duration-500">
      <Badge
        variant="secondary"
        className="gap-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
      >
        <FileText className="h-3 w-3" />
        <span className="text-xs font-medium">
          {originalWordCount.toLocaleString()} →{' '}
          {summaryWordCount.toLocaleString()} words
        </span>
      </Badge>
      <Badge
        variant="secondary"
        className="gap-1.5 bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20"
      >
        <TrendingDown className="h-3 w-3" />
        <span className="text-xs font-medium">
          {compressionRatio}% compressed
        </span>
      </Badge>
      <Badge
        variant="secondary"
        className="gap-1.5 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
      >
        <Clock className="h-3 w-3" />
        <span className="text-xs font-medium">
          {formatReadingTime(readingTime)} read
        </span>
      </Badge>
    </div>
  );
}
