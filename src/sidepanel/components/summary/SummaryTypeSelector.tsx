/**
 * Summary Type Selector Component
 * Beautiful gradient buttons for selecting summary types
 */

import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import type { SummaryType } from '../../stores/summaryStore';

const SUMMARY_TYPES: {
  value: SummaryType;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    value: 'key-points',
    label: 'Key Points',
    icon: '🎯',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    value: 'tldr',
    label: 'TL;DR',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    value: 'teaser',
    label: 'Teaser',
    icon: '📝',
    color: 'from-purple-500 to-pink-500',
  },
  {
    value: 'headline',
    label: 'Headline',
    icon: '📰',
    color: 'from-green-500 to-emerald-500',
  },
];

interface SummaryTypeSelectorProps {
  activeType: SummaryType;
  onTypeChange: (type: SummaryType) => void;
  showOptions: boolean;
  onToggleOptions: () => void;
  disabled?: boolean;
}

export function SummaryTypeSelector({
  activeType,
  onTypeChange,
  showOptions,
  onToggleOptions,
  disabled = false,
}: SummaryTypeSelectorProps) {
  return (
    <div className="border-b border-border bg-muted/30">
      <div className="flex gap-2 overflow-x-auto p-2">
        {SUMMARY_TYPES.map((type) => {
          const isActive = activeType === type.value;
          return (
            <Button
              key={type.value}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTypeChange(type.value)}
              disabled={disabled}
              className={`
                whitespace-nowrap transition-all duration-200 relative overflow-hidden
                ${
                  isActive
                    ? `bg-linear-to-r ${type.color} text-white shadow-lg scale-105 font-semibold`
                    : 'hover:bg-muted hover:scale-102'
                }
              `}
            >
              <span className="mr-1.5 text-base">{type.icon}</span>
              {type.label}
              {isActive && (
                <span className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
            </Button>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleOptions}
          className="ml-auto transition-transform hover:rotate-90 duration-300"
          title="Toggle options"
        >
          <Settings
            className={`h-4 w-4 ${showOptions ? 'text-primary' : ''}`}
          />
        </Button>
      </div>
    </div>
  );
}

export { SUMMARY_TYPES };
