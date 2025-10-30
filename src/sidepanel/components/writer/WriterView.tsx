/**
 * WriterView Component
 * Main Writer tab - Generate new content from prompts
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useWriter } from '@/sidepanel/hooks';
import type { WriterFormat, WriterLength, WriterTone } from '@/types/chrome-ai';
import { Copy, Loader2, Sparkles, StopCircle, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface WriterViewProps {
  initialPrompt?: string | null;
  onPromptUsed?: () => void;
}

export function WriterView({ initialPrompt, onPromptUsed }: WriterViewProps) {
  // Initialize prompt with initialPrompt if provided
  const [prompt, setPrompt] = useState(() =>
    initialPrompt ? `Generate content based on: "${initialPrompt}"` : ''
  );
  const [context, setContext] = useState('');
  const [tone, setTone] = useState<WriterTone>('neutral');
  const [length, setLength] = useState<WriterLength>('medium');
  const [format, setFormat] = useState<WriterFormat>('plain-text');
  const [copied, setCopied] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  const { generate, cancel, isGenerating, output, error, clear } = useWriter({
    tone,
    format,
    length,
  });

  // Notify parent when initial prompt is used
  useEffect(() => {
    if (initialPrompt) {
      onPromptUsed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-scroll to output when it updates
  useEffect(() => {
    if (output && outputRef.current) {
      outputRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [output]);

  const handleGenerate = async () => {
    await generate(prompt, context || undefined);
  };

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setPrompt('');
    setContext('');
    clear();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-foreground">
                AI Writer
              </h2>
              <Badge variant="outline" className="text-xs">
                Beta
              </Badge>
            </div>
          </div>

          {/* Input Section */}
          <Card className="p-4 transition-all">
            <div className="space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  What do you want to write? *
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Write an email requesting a meeting tomorrow at 3 PM"
                  className="min-h-[100px] resize-none bg-background text-foreground transition-all"
                  disabled={isGenerating}
                />
              </div>

              {/* Context Input (Optional) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Additional Context (Optional)
                </label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Example: This is for my manager. I'm requesting to discuss the Q4 project timeline."
                  className="min-h-[80px] resize-none bg-background text-foreground transition-all"
                  disabled={isGenerating}
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Tone */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Tone
                  </label>
                  <div className="flex gap-2">
                    {(['formal', 'neutral', 'casual'] as WriterTone[]).map(
                      (t) => (
                        <Button
                          key={t}
                          size="sm"
                          variant={tone === t ? 'default' : 'outline'}
                          onClick={() => setTone(t)}
                          disabled={isGenerating}
                          className={cn(
                            'flex-1 capitalize transition-all',
                            tone === t &&
                              'ring-2 ring-primary/20 shadow-lg font-semibold'
                          )}
                        >
                          {t}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* Length */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Length
                  </label>
                  <div className="flex gap-2">
                    {(['short', 'medium', 'long'] as WriterLength[]).map(
                      (l) => (
                        <Button
                          key={l}
                          size="sm"
                          variant={length === l ? 'default' : 'outline'}
                          onClick={() => setLength(l)}
                          disabled={isGenerating}
                          className={cn(
                            'flex-1 capitalize transition-all',
                            length === l &&
                              'ring-2 ring-primary/20 shadow-lg font-semibold'
                          )}
                        >
                          {l}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Format
                  </label>
                  <div className="flex gap-2">
                    {(['plain-text', 'markdown'] as WriterFormat[]).map((f) => (
                      <Button
                        key={f}
                        size="sm"
                        variant={format === f ? 'default' : 'outline'}
                        onClick={() => setFormat(f)}
                        disabled={isGenerating}
                        className={cn(
                          'flex-1 text-xs transition-all',
                          format === f &&
                            'ring-2 ring-primary/20 shadow-lg font-semibold'
                        )}
                      >
                        {f === 'plain-text' ? 'Plain' : 'Markdown'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="flex-1 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <Button
                    onClick={cancel}
                    variant="outline"
                    className="transition-all"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-destructive bg-destructive/10 p-4 transition-all">
              <p className="text-sm text-destructive">{error}</p>
            </Card>
          )}

          {/* Output Section */}
          {output && (
            <Card ref={outputRef} className="p-4 transition-all">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-foreground">
                  Generated Content
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="transition-all"
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClear}
                    className="transition-all"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Clear
                  </Button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto rounded-md border border-border bg-muted/50 p-4 transition-all">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                  {output}
                </pre>
              </div>
            </Card>
          )}

          {/* Tips */}
          {!output && !error && (
            <Card className="bg-blue-50 p-4 transition-all dark:bg-blue-950/20">
              <h4 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                💡 Tips
              </h4>
              <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                <li>• Be specific about what you want to write</li>
                <li>• Add context to help the AI understand your needs</li>
                <li>• Choose the right tone for your audience</li>
                <li>• Experiment with different lengths and formats</li>
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
