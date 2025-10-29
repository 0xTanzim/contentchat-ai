/**
 * EmptyState Component
 * Mode-specific suggestions and welcome message
 */

import { Button } from '@/components/ui/button';
import type { EmptyStateProps } from '@/types/chat.types';
import { Globe, MessageSquare, Sparkles } from 'lucide-react';
import { memo } from 'react';

const PAGE_SUGGESTIONS = [
  'Summarize this page',
  'What are the key points?',
  'Explain this in simple terms',
  'Find important information',
];

const PERSONAL_SUGGESTIONS = [
  'Help me write an email',
  'Explain a concept to me',
  'Give me ideas for...',
  'Answer a question',
];

export const EmptyState = memo(function EmptyState({
  mode,
  onSuggestionClick,
}: EmptyStateProps) {
  const suggestions =
    mode === 'page-context' ? PAGE_SUGGESTIONS : PERSONAL_SUGGESTIONS;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        {mode === 'page-context' ? (
          <Globe className="h-8 w-8 text-primary" />
        ) : (
          <MessageSquare className="h-8 w-8 text-primary" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {mode === 'page-context'
          ? 'Ask about this page'
          : 'Start a conversation'}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {mode === 'page-context'
          ? 'I can help you understand and analyze the content of this page using AI.'
          : 'Ask me anything! I can help with writing, explanations, ideas, and more.'}
      </p>

      {/* Suggestions */}
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Sparkles className="h-3 w-3" />
          <span>Try asking:</span>
        </div>

        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            onClick={() => onSuggestionClick?.(suggestion)}
            className="justify-start text-left h-auto py-3 px-4 hover:bg-primary/10 hover:border-primary/50"
          >
            <span className="text-sm">{suggestion}</span>
          </Button>
        ))}
      </div>

      {/* Feature Note */}
      <div className="mt-8 text-xs text-muted-foreground flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        <span>Powered by Chrome Built-in AI (Gemini Nano)</span>
      </div>
    </div>
  );
});
