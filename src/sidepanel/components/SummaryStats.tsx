/**
 * Summary Stats Component
 * Displays analytics: word count, compression ratio, reading time
 */

import { Badge } from '@/components/ui/badge';
import type { SummaryStats as StatsType } from '@/lib/summary-utils';
import { formatReadingTime } from '@/lib/summary-utils';
import { Clock, FileText, TrendingDown } from 'lucide-react';

interface SummaryStatsProps {
  stats: StatsType;
  className?: string;
}

export function SummaryStats({ stats, className = '' }: SummaryStatsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Badge variant="secondary" className="gap-1">
        <FileText className="h-3 w-3" />
        <span className="text-xs">
          {stats.originalWordCount.toLocaleString()} words →{' '}
          {stats.summaryWordCount.toLocaleString()} words
        </span>
      </Badge>

      <Badge variant="secondary" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        <span className="text-xs">{stats.compressionRatio}% compressed</span>
      </Badge>

      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        <span className="text-xs">
          {formatReadingTime(stats.readingTime)} read
        </span>
      </Badge>
    </div>
  );
}
