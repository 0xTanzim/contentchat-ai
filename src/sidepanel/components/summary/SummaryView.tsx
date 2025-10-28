/**
 * Main Summary View Component
 * Orchestrates all summary sub-components
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { summarizeStreaming } from '@/lib/chrome-ai';
import { getCurrentPageContent } from '@/lib/page-content';
import { copyToClipboard, generateSummaryStats } from '@/lib/summary-utils';
import { FileText, Loader2, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useAppStore } from '../../stores/appStore';
import { useSummaryStore } from '../../stores/summaryStore';
import { SummaryActions } from './SummaryActions';
import { SummaryContent } from './SummaryContent';
import { SummaryOptions } from './SummaryOptions';
import { SummaryStats } from './SummaryStats';
import { SummaryTypeSelector } from './SummaryTypeSelector';

export function SummaryView() {
  const { theme, setTheme } = useTheme();
  const { currentPage, setCurrentPage, isLoading, setIsLoading, setError } =
    useAppStore();
  const { activeOptions, setActiveOptions, getSummary, addSummary } =
    useSummaryStore();

  const [localLoading, setLocalLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [finalResult, setFinalResult] = useState<string>('');
  const [typewriterText, setTypewriterText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentSummary = currentPage?.url
    ? getSummary(currentPage.url, activeOptions)
    : undefined;

  // Typewriter effect for smooth streaming display
  useEffect(() => {
    if (!isStreaming || !streamingText) {
      setTypewriterText(streamingText);
      return;
    }

    const targetText = streamingText;
    const currentLength = typewriterText.length;
    const targetLength = targetText.length;

    if (currentLength >= targetLength) {
      setTypewriterText(targetText);
      return;
    }

    const charsToAdd = Math.min(3, targetLength - currentLength);
    const timer = setTimeout(() => {
      setTypewriterText(targetText.substring(0, currentLength + charsToAdd));
    }, 10);

    return () => clearTimeout(timer);
  }, [streamingText, isStreaming, typewriterText]);

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

  async function generateSummary() {
    if (!currentPage) {
      setError('No page content available');
      toast.error('No page content available');
      return;
    }

    if (currentPage.content.trim().length < 100) {
      setErrorMessage(
        'Content is too short to summarize (minimum 100 characters)'
      );
      toast.error('Content too short to summarize');
      return;
    }

    if (isStreaming || localLoading) {
      toast.info('Already generating summary...');
      return;
    }

    try {
      setLocalLoading(true);
      setError(null);
      setErrorMessage('');
      setStreamingText('');
      setFinalResult('');
      setIsStreaming(true);
      setTypewriterText('');

      let fullText = '';
      let chunkCount = 0;

      console.log('🚀 Starting streaming summarization...');
      console.log('📄 Content length:', currentPage.content.length);
      console.log('⚙️ Options:', activeOptions);

      const stream = summarizeStreaming(
        currentPage.content,
        {
          type: activeOptions.type,
          format: activeOptions.format,
          length: activeOptions.length,
          sharedContext: activeOptions.context,
        },
        activeOptions.context
      );

      console.log('📡 Stream created, starting to read chunks...');

      for await (const chunk of stream) {
        chunkCount++;
        console.log(`📦 Chunk ${chunkCount}:`, {
          type: typeof chunk,
          length: chunk?.length,
          preview:
            chunk?.substring(0, 100) + (chunk?.length > 100 ? '...' : ''),
          isEmpty: !chunk || chunk.trim().length === 0,
        });

        // Try both accumulation methods to see which works
        if (chunkCount === 1) {
          fullText = chunk; // First chunk
        } else {
          // Check if this is a delta or complete text
          if (chunk?.startsWith(fullText)) {
            // Complete text (includes previous)
            fullText = chunk;
            console.log('✅ Using COMPLETE text mode');
          } else {
            // Delta (just new part)
            fullText += chunk;
            console.log('✅ Using DELTA accumulation mode');
          }
        }

        setStreamingText(fullText);
      }

      console.log('🏁 Streaming complete!');
      console.log('📊 Total chunks received:', chunkCount);
      console.log('📝 Final text length:', fullText?.length);
      console.log('📄 Final text preview:', fullText?.substring(0, 200));

      if (!fullText || fullText.trim().length === 0) {
        console.error('❌ ERROR: Empty summary!');
        console.error('Chunks received:', chunkCount);
        console.error('Final fullText:', fullText);
        throw new Error(
          `No summary generated. Received ${chunkCount} chunks but text is empty. Please try again.`
        );
      }

      console.log('✅ Summary validated successfully!');

      const stats = generateSummaryStats(currentPage.content, fullText);
      addSummary(currentPage.url, {
        content: fullText,
        options: activeOptions,
        stats,
      });

      setFinalResult(fullText);
      setIsStreaming(false);
      toast.success('Summary generated!', {
        description: `${stats.summaryWordCount} words · ${stats.compressionRatio}% compressed`,
      });
    } catch (error) {
      console.error('Summary generation error:', error);
      setIsStreaming(false);

      const errorMsg =
        error instanceof Error ? error.message : 'Failed to generate summary';

      if (
        errorMsg.includes('not available') ||
        errorMsg.includes('not supported')
      ) {
        setErrorMessage(
          'AI features not available. Please update Chrome to version 140+ and enable AI.'
        );
        toast.error('AI not available', {
          description: 'Update Chrome to enable AI features',
        });
      } else if (
        errorMsg.includes('quota') ||
        errorMsg.includes('rate limit')
      ) {
        setErrorMessage(
          'API quota exceeded. Please wait a moment and try again.'
        );
        toast.error('Too many requests', {
          description: 'Please wait a moment before trying again',
        });
      } else if (errorMsg.includes('download') || errorMsg.includes('model')) {
        setErrorMessage(
          'AI model is downloading. This may take a few minutes on first use.'
        );
        toast.info('Downloading AI model...', {
          description: 'Please wait while the model downloads',
        });
      } else {
        setErrorMessage(errorMsg);
        toast.error('Generation failed', {
          description: errorMsg,
        });
      }

      setError(errorMsg);
    } finally {
      setLocalLoading(false);
    }
  }

  async function handleCopy(text: string) {
    if (!text || text.trim().length === 0) {
      toast.error('Nothing to copy');
      return;
    }

    const success = await copyToClipboard(text);
    if (success) {
      toast.success('Copied to clipboard!', {
        description: `${text.split(' ').length} words copied`,
      });
    } else {
      toast.error('Failed to copy');
    }
  }

  function handleSave() {
    toast.success('Saved to library!');
    // TODO: Implement library save
  }

  async function handleShare(text: string) {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        toast.success('Shared successfully!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      await handleCopy(text);
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

  const displayText = isStreaming
    ? typewriterText
    : finalResult || currentSummary?.content;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex h-full flex-col">
        {/* Page Info Header */}
        <div className="border-b border-border bg-gradient-to-r from-background to-muted/20 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="mb-1 truncate text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {currentPage.title}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {currentPage.url}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="shrink-0"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-blue-500" />
              )}
            </Button>
          </div>
        </div>

        {/* Summary Type Selector */}
        <SummaryTypeSelector
          activeType={activeOptions.type}
          onTypeChange={(type) => setActiveOptions({ type })}
          showOptions={showOptions}
          onToggleOptions={() => setShowOptions(!showOptions)}
          disabled={localLoading}
        />

        {/* Options Panel */}
        {showOptions && (
          <SummaryOptions
            length={activeOptions.length}
            format={activeOptions.format}
            context={activeOptions.context || ''}
            onLengthChange={(length) => setActiveOptions({ length })}
            onFormatChange={(format) => setActiveOptions({ format })}
            onContextChange={(context) => setActiveOptions({ context })}
          />
        )}

        {/* Summary Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <SummaryContent
              isLoading={localLoading}
              isStreaming={isStreaming}
              errorMessage={errorMessage}
              streamingText={typewriterText}
              displayText={displayText}
              activeType={activeOptions.type}
              activeLength={activeOptions.length}
              onGenerate={generateSummary}
              onRetry={() => {
                setErrorMessage('');
                generateSummary();
              }}
            />

            {displayText && !isStreaming && !localLoading && (
              <>
                {currentSummary?.stats && (
                  <SummaryStats
                    originalWordCount={currentSummary.stats.originalWordCount}
                    summaryWordCount={currentSummary.stats.summaryWordCount}
                    compressionRatio={currentSummary.stats.compressionRatio}
                    readingTime={currentSummary.stats.readingTime}
                  />
                )}
                <SummaryActions
                  text={displayText}
                  onCopy={handleCopy}
                  onSave={handleSave}
                  onShare={handleShare}
                  onRegenerate={generateSummary}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
