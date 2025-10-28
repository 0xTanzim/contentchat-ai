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
import { useEffect, useRef, useState } from 'react';
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
  const [currentStats, setCurrentStats] = useState<any>(null); // Persist stats across type changes
  const [previousUrl, setPreviousUrl] = useState<string | null>(null); // Track URL changes
  const [shouldStop, setShouldStop] = useState(false); // Track stop request

  // Refs to track active stream for abortion
  const activeReaderRef = useRef<ReadableStreamDefaultReader<string> | null>(
    null
  );
  const activeSummarizerRef = useRef<any | null>(null);

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

    // Auto-cleanup old history (30 days retention)
    const cleanup = useSummaryStore.getState().cleanupOldHistory;
    cleanup(30);
  }, []);

  // Listen to Chrome runtime messages for content script ready
  useEffect(() => {
    const handleRuntimeMessage = (
      message: { type: string; url?: string },
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: any) => void
    ) => {
      // Content script sends CONTENT_SCRIPT_READY when it's loaded
      if (message.type === 'CONTENT_SCRIPT_READY' && message.url) {
        console.log('📨 Content script ready for:', message.url);

        // Small delay to ensure content script is fully initialized
        setTimeout(() => {
          loadPageContent();
        }, 100);
      }
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
  }, []);

  // Listen to tab updates to detect URL changes in real-time
  useEffect(() => {
    const handleTabUpdate = (
      _tabId: number,
      changeInfo: { url?: string; status?: string },
      tab: chrome.tabs.Tab
    ) => {
      // Only react to complete status on the active tab
      // Don't use changeInfo.url as it fires too early
      if (changeInfo.status === 'complete' && tab.active) {
        console.log('🔄 Tab loaded completely:', tab.url);

        // Wait a bit for content script to initialize
        setTimeout(() => {
          loadPageContent();
        }, 200);
      }
    };

    // Listen to tab activation (switching tabs)
    const handleTabActivated = (activeInfo: {
      tabId: number;
      windowId: number;
    }) => {
      console.log('🔄 Tab activated:', activeInfo.tabId);

      // Reload content when switching to a different tab
      setTimeout(() => {
        loadPageContent();
      }, 100);
    };

    // Add listeners
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivated);

    // Cleanup listeners on unmount
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, []);

  // Detect URL changes and clear old summary
  useEffect(() => {
    if (!currentPage?.url) return;

    // If URL changed, clear old summary and show notification
    if (previousUrl && previousUrl !== currentPage.url) {
      console.log('🔄 URL changed in UI:', {
        from: previousUrl,
        to: currentPage.url,
      });

      // Clear old summary state
      setFinalResult('');
      setStreamingText('');
      setTypewriterText('');
      setCurrentStats(null);
      setErrorMessage('');
      setIsStreaming(false);

      toast.info('Page changed. Generate a new summary.', {
        duration: 3000,
      });
    }

    // Update tracked URL
    setPreviousUrl(currentPage.url);
  }, [currentPage?.url]);

  async function loadPageContent() {
    try {
      setIsLoading(true);
      setError(null);

      const content = await getCurrentPageContent();
      setCurrentPage(content);

      console.log('✅ Page content loaded:', {
        title: content.title,
        url: content.url,
        contentLength: content.content.length,
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to load page content';

      console.error('❌ Failed to load page content:', errorMsg);

      // If content script not ready, show helpful message
      if (errorMsg.includes('Could not establish connection')) {
        setError(
          'Content script not ready. The page may still be loading. Please wait a moment.'
        );

        // Don't show toast on initial load, only on manual retry
        if (currentPage) {
          toast.warning('Page still loading...', {
            description: 'Please wait for the page to fully load',
          });
        }
      } else {
        setError(errorMsg);

        if (currentPage) {
          toast.error('Failed to load page', {
            description: errorMsg,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  function stopGeneration() {
    if (!isStreaming) return;

    console.log('⏹️ User stopped generation');
    setShouldStop(true);

    // Abort the stream at the reader level
    if (activeReaderRef.current) {
      console.log('🛑 Canceling reader to abort LLM generation...');
      activeReaderRef.current.cancel('User stopped generation').catch((err) => {
        console.error('Error canceling reader:', err);
      });
      activeReaderRef.current = null;
    }

    // Destroy the summarizer to free resources
    if (activeSummarizerRef.current) {
      console.log('🗑️ Destroying summarizer to free resources...');
      try {
        activeSummarizerRef.current.destroy();
      } catch (err) {
        console.error('Error destroying summarizer:', err);
      }
      activeSummarizerRef.current = null;
    }

    setIsStreaming(false);
    setLocalLoading(false);

    toast.info('Generation stopped', {
      description: 'LLM generation aborted successfully',
    });
  }

  async function generateSummary() {
    if (!currentPage) {
      setError('No page content available');
      toast.error('No page content available');
      return;
    }

    // Edge Case 1: Content too short
    if (currentPage.content.trim().length < 100) {
      setErrorMessage(
        'Content is too short to summarize (minimum 100 characters)'
      );
      toast.error('Content too short to summarize', {
        description: `Found ${
          currentPage.content.trim().length
        } characters. Need at least 100.`,
      });
      return;
    }

    // Edge Case 2: No meaningful text (e.g., images only)
    const wordCount = currentPage.content.trim().split(/\s+/).length;
    if (wordCount < 20) {
      setErrorMessage(
        'Page contains insufficient text. It may be image-heavy or have limited content.'
      );
      toast.error('Insufficient text content', {
        description: `Found only ${wordCount} words. Need at least 20 words.`,
      });
      return;
    }

    // Edge Case 3: Prevent concurrent generation
    if (isStreaming || localLoading) {
      toast.info('Already generating summary...');
      return;
    }

    // Edge Case 4: Very long content - truncate with notice
    let contentToSummarize = currentPage.content;
    const maxLength = 50000;
    let wasTruncated = false;

    if (contentToSummarize.length > maxLength) {
      contentToSummarize = contentToSummarize.substring(0, maxLength);
      wasTruncated = true;
      toast.warning('Long content detected', {
        description: `Truncated to ${maxLength.toLocaleString()} characters for processing.`,
        duration: 4000,
      });
    }

    try {
      setLocalLoading(true);
      setError(null);
      setErrorMessage('');
      setStreamingText('');
      setFinalResult('');
      setIsStreaming(true);
      setTypewriterText('');
      setShouldStop(false); // Reset stop flag

      let fullText = '';
      let chunkCount = 0;

      console.log('🚀 Starting streaming summarization...');
      console.log('📄 Content length:', contentToSummarize.length);
      if (wasTruncated) {
        console.log(
          '⚠️ Content was truncated from',
          currentPage.content.length
        );
      }
      console.log('⚙️ Options:', activeOptions);

      // Build dynamic instructions based on detail level
      const detailInstructions = {
        brief: 'Provide 3-5 concise key points. Be brief and to the point.',
        standard: 'Provide 5-8 clear key points with adequate detail.',
        detailed:
          'Provide 8-12 detailed key points with explanations and context.',
        comprehensive:
          'Provide a comprehensive analysis with 12 or more points. Include all important details, explanations, and relevant context.',
      };

      const detailLevel = activeOptions.detailLevel || 'standard';
      const detailContext = detailInstructions[detailLevel];

      // Combine user context with detail instructions
      const combinedContext = activeOptions.context
        ? `${detailContext} ${activeOptions.context}`
        : detailContext;

      console.log('🎯 Detail Level:', detailLevel);
      console.log('📋 Combined Context:', combinedContext);

      // Get stream, reader, and summarizer from API
      const { stream, reader, summarizer } = await summarizeStreaming(
        contentToSummarize,
        {
          type: activeOptions.type,
          format: activeOptions.format,
          length: activeOptions.length,
          sharedContext: combinedContext,
        },
        combinedContext
      );

      // Store refs for potential abortion
      activeReaderRef.current = reader;
      activeSummarizerRef.current = summarizer;

      console.log('📡 Stream created, starting to read chunks...');
      console.log(
        '✅ isStreaming set to TRUE - Stop button should be visible now'
      );

      // Small delay to ensure UI renders Stop button before first chunk
      await new Promise((resolve) => setTimeout(resolve, 100));

      for await (const chunk of stream) {
        // Check if user stopped generation
        if (shouldStop) {
          console.log('⏹️ Breaking loop - user stopped');
          break;
        }

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

        // Add small delay between chunks to make Stop button visible
        // Remove this in production if streaming needs to be faster
        await new Promise((resolve) => setTimeout(resolve, 50));
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
      setCurrentStats(stats); // Persist stats for display

      // Save with timestamp and metadata for history
      addSummary(currentPage.url, {
        content: fullText,
        options: activeOptions,
        stats,
        timestamp: Date.now(),
        pageTitle: currentPage.title,
        pageUrl: currentPage.url,
      });

      setFinalResult(fullText);
      setIsStreaming(false);
      toast.success('Summary generated!', {
        description: `${stats.summaryWordCount} words · ${stats.compressionRatio}% compressed`,
      });
    } catch (error) {
      console.error('Summary generation error:', error);
      setIsStreaming(false);

      // If user manually stopped, don't show error
      if (shouldStop) {
        console.log('Generation stopped by user, not an error');
        return;
      }

      const errorMsg =
        error instanceof Error ? error.message : 'Failed to generate summary';

      // Edge Case 5: AI not available
      if (
        errorMsg.includes('not available') ||
        errorMsg.includes('not supported')
      ) {
        setErrorMessage(
          'AI features not available. Please update Chrome to version 140+ and enable AI features in chrome://flags'
        );
        toast.error('AI not available', {
          description: 'Update Chrome to version 140+ and enable AI flags',
          duration: 5000,
        });
      }
      // Edge Case 6: Rate limiting / Quota exceeded
      else if (
        errorMsg.includes('quota') ||
        errorMsg.includes('rate limit') ||
        errorMsg.includes('too many requests')
      ) {
        setErrorMessage(
          'API quota exceeded. The AI model has a usage limit. Please wait 60 seconds and try again.'
        );
        toast.error('Rate limit exceeded', {
          description: 'Please wait 60 seconds before trying again',
          duration: 6000,
          action: {
            label: 'Retry',
            onClick: () => {
              setTimeout(() => {
                generateSummary();
              }, 60000); // Retry after 60 seconds
            },
          },
        });
      }
      // Edge Case 7: Model downloading
      else if (errorMsg.includes('download') || errorMsg.includes('model')) {
        setErrorMessage(
          'AI model is downloading. This may take 2-5 minutes on first use. Please wait...'
        );
        toast.info('Downloading AI model...', {
          description: 'First-time setup. Please wait 2-5 minutes.',
          duration: 10000,
        });
      }
      // Edge Case 8: Network errors
      else if (
        errorMsg.includes('network') ||
        errorMsg.includes('connection') ||
        errorMsg.includes('timeout')
      ) {
        setErrorMessage(
          'Network error. Please check your connection and try again.'
        );
        toast.error('Network error', {
          description: 'Check your connection and retry',
          action: {
            label: 'Retry',
            onClick: () => generateSummary(),
          },
        });
      }
      // Edge Case 9: Empty result
      else if (errorMsg.includes('empty') || errorMsg.includes('no summary')) {
        setErrorMessage(
          'Failed to generate summary. The content may not be suitable for summarization.'
        );
        toast.error('Generation failed', {
          description: 'Content may not be suitable for summarization',
          action: {
            label: 'Retry',
            onClick: () => generateSummary(),
          },
        });
      }
      // Edge Case 10: Generic error with retry
      else {
        setErrorMessage(errorMsg);
        toast.error('Generation failed', {
          description: errorMsg,
          action: {
            label: 'Retry',
            onClick: () => generateSummary(),
          },
        });
      }

      setError(errorMsg);
    } finally {
      setLocalLoading(false);

      // Clean up refs
      if (activeReaderRef.current) {
        try {
          activeReaderRef.current.releaseLock();
        } catch (err) {
          console.warn('Reader already released:', err);
        }
        activeReaderRef.current = null;
      }

      if (activeSummarizerRef.current) {
        try {
          activeSummarizerRef.current.destroy();
        } catch (err) {
          console.warn('Summarizer already destroyed:', err);
        }
        activeSummarizerRef.current = null;
      }
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
        <div className="border-b border-border bg-gradient-to-r from-background to-muted/20 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="mb-1.5 truncate text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text leading-tight">
                {currentPage.title}
              </h2>
              <p className="truncate text-sm text-muted-foreground font-medium">
                {currentPage.url}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="shrink-0 h-10 w-10"
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
            detailLevel={activeOptions.detailLevel}
            onLengthChange={(length) => setActiveOptions({ length })}
            onFormatChange={(format) => setActiveOptions({ format })}
            onContextChange={(context) => setActiveOptions({ context })}
            onDetailLevelChange={(detailLevel) =>
              setActiveOptions({ detailLevel })
            }
          />
        )}

        {/* Summary Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            <SummaryContent
              isLoading={localLoading}
              isStreaming={isStreaming}
              errorMessage={errorMessage}
              streamingText={typewriterText}
              displayText={displayText}
              activeType={activeOptions.type}
              activeLength={activeOptions.length}
              onGenerate={generateSummary}
              onStop={stopGeneration}
              onRetry={() => {
                setErrorMessage('');
                generateSummary();
              }}
            />

            {displayText && !isStreaming && !localLoading && (
              <>
                {(currentStats || currentSummary?.stats) && (
                  <SummaryStats
                    originalWordCount={
                      (currentStats || currentSummary?.stats).originalWordCount
                    }
                    summaryWordCount={
                      (currentStats || currentSummary?.stats).summaryWordCount
                    }
                    compressionRatio={
                      (currentStats || currentSummary?.stats).compressionRatio
                    }
                    readingTime={
                      (currentStats || currentSummary?.stats).readingTime
                    }
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
