/**
 * Summary Options Panel Component
 * Collapsible panel for length, format, and context options
 */

import { Button } from '@/components/ui/button';
import type {
  DetailLevel,
  SummaryFormat,
  SummaryLength,
} from '../../stores/summaryStore';

const CONTEXTS = [
  { value: '', label: 'General audience' },
  {
    value:
      'This content is intended for technical professionals and developers.',
    label: 'Technical',
  },
  {
    value:
      'This content is intended for business executives and decision-makers.',
    label: 'Executive',
  },
  {
    value: 'This content is intended for students and learners.',
    label: 'Educational',
  },
];

interface SummaryOptionsProps {
  length: SummaryLength;
  format: SummaryFormat;
  detailLevel?: DetailLevel;
  context: string;
  onLengthChange: (length: SummaryLength) => void;
  onFormatChange: (format: SummaryFormat) => void;
  onDetailLevelChange: (detailLevel: DetailLevel) => void;
  onContextChange: (context: string) => void;
}

export function SummaryOptions({
  length,
  format,
  detailLevel = 'standard',
  context,
  onLengthChange,
  onFormatChange,
  onDetailLevelChange,
  onContextChange,
}: SummaryOptionsProps) {
  return (
    <div className="border-b border-border bg-gradient-to-b from-muted/50 to-background p-4 space-y-4 animate-in slide-in-from-top duration-300">
      {/* Detail Level - NEW! */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Detail Level (Dynamic Length)
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-1">
          {(
            ['brief', 'standard', 'detailed', 'comprehensive'] as DetailLevel[]
          ).map((level) => {
            const isActive = detailLevel === level;
            const labels = {
              brief: '3-5 points',
              standard: '5-8 points',
              detailed: '8-12 points',
              comprehensive: '12+ points',
            };
            return (
              <Button
                key={level}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDetailLevelChange(level)}
                className={`
                  text-xs capitalize transition-all duration-200 flex flex-col items-center py-3
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md'
                      : 'hover:border-primary/50'
                  }
                `}
              >
                <span className="font-semibold">{level}</span>
                <span className="text-[10px] opacity-80">{labels[level]}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Length
          </label>
          <div className="flex gap-1.5">
            {(['short', 'medium', 'long'] as SummaryLength[]).map((len) => {
              const isActive = length === len;
              return (
                <Button
                  key={len}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onLengthChange(len)}
                  className={`
                    flex-1 text-xs capitalize transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                        : 'hover:border-primary/50'
                    }
                  `}
                >
                  {len}
                </Button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Format
          </label>
          <div className="flex gap-1.5">
            {(['markdown', 'plain-text'] as SummaryFormat[]).map((fmt) => {
              const isActive = format === fmt;
              return (
                <Button
                  key={fmt}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFormatChange(fmt)}
                  className={`
                    flex-1 text-xs capitalize transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                        : 'hover:border-primary/50'
                    }
                  `}
                >
                  {fmt === 'plain-text' ? 'Plain' : fmt}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Audience Context
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {CONTEXTS.map((ctx) => {
            const isActive = context === ctx.value;
            return (
              <Button
                key={ctx.label}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onContextChange(ctx.value)}
                className={`
                  text-xs transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                      : 'hover:border-primary/50'
                  }
                `}
              >
                {ctx.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
