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
    <div className="flex flex-wrap gap-3 animate-in slide-in-from-bottom duration-500">
      <Badge
        variant="secondary"
        className="gap-2 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 px-4 py-2 text-sm font-medium"
      >
        <FileText className="h-4 w-4" />
        <span>
          {originalWordCount.toLocaleString()} →{' '}
          {summaryWordCount.toLocaleString()} words
        </span>
      </Badge>
      <Badge
        variant="secondary"
        className="gap-2 bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 px-4 py-2 text-sm font-medium"
      >
        <TrendingDown className="h-4 w-4" />
        <span>{compressionRatio}% compressed</span>
      </Badge>
      <Badge
        variant="secondary"
        className="gap-2 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 px-4 py-2 text-sm font-medium"
      >
        <Clock className="h-4 w-4" />
        <span>{formatReadingTime(readingTime)} read</span>
      </Badge>
    </div>
  );
}
