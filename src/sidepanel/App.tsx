import { SuspenseFallback } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { isAIAvailable } from '@/lib/chrome-ai';
import { chatDB } from '@/lib/db/chatDB';
import { summaryDB } from '@/lib/db/summaryDB';
import { createLogger } from '@/lib/logger';
import { FileText, Library, MessageCircle, Sparkles } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ChatView } from './components/ChatView';
import { ErrorBanner } from './components/ErrorBanner';
import { ThemeToggle } from './components/ThemeToggle';
import { useChromeExtension } from './hooks/useChromeExtension';
import { useAppStore } from './stores/appStore';
import { useChatStore } from './stores/chatStore';
import { useSummaryStore } from './stores/summaryStore';

const logger = createLogger('App');

// ✅ Only lazy load views that don't need to preserve state
const SummaryView = lazy(() =>
  import('./components/summary').then((m) => ({ default: m.SummaryView }))
);
const HistoryView = lazy(() =>
  import('./components/library').then((m) => ({ default: m.HistoryView }))
);
const WriterView = lazy(() =>
  import('./components/writer/WriterView').then((m) => ({
    default: m.WriterView,
  }))
);

function App() {
  const { activeView, setActiveView, aiAvailable, setAiAvailable } =
    useAppStore();

  // ✅ State for selected text context (from "Ask AI About This")
  const [selectedTextContext, setSelectedTextContext] = useState<string | null>(
    null
  );

  // ✅ State for writer prompt (from "Generate Content from This")
  const [writerPromptFromSelection, setWriterPromptFromSelection] = useState<
    string | null
  >(null);

  // ✅ Move useChromeExtension to App level to prevent remounting on tab changes
  const {
    currentPage,
    isLoading: pageLoading,
    error: pageError,
    reload,
  } = useChromeExtension();

  useEffect(() => {
    // Check AI availability on mount
    const available = isAIAvailable();
    setAiAvailable(available);

    // 🔄 Load conversations from IndexedDB
    useChatStore.getState().loadFromIndexedDB();

    // 🔄 Load summaries from IndexedDB
    useSummaryStore.getState().loadFromIndexedDB();

    // 🔄 Migrate from localStorage to IndexedDB (one-time)
    summaryDB
      .migrateFromLocalStorage()
      .then((migratedCount) => {
        if (migratedCount > 0) {
          logger.info(`✅ Migrated ${migratedCount} summaries to IndexedDB`);
        }
      })
      .catch((error) => {
        logger.error('Migration failed:', error);
      });

    // 🧹 Cleanup old summaries on startup (30 days retention)
    // First cleanup localStorage (will be phased out)
    try {
      const { cleanupOldHistory } = useSummaryStore.getState();
      cleanupOldHistory(30);
      logger.info('🧹 Cleaned up localStorage summaries older than 30 days');
    } catch (error) {
      logger.error('Failed to cleanup localStorage summaries:', error);
    }

    // Then cleanup IndexedDB (summaries)
    summaryDB
      .cleanupOld()
      .then((deletedCount) => {
        if (deletedCount > 0) {
          logger.info(
            `🧹 Cleaned up ${deletedCount} old summaries from IndexedDB`
          );
        }
      })
      .catch((error) => {
        logger.error('Failed to cleanup IndexedDB summaries:', error);
      });

    // 🧹 Cleanup old chat conversations from IndexedDB (30 days retention)
    chatDB
      .cleanupOld()
      .then((deletedCount) => {
        if (deletedCount > 0) {
          logger.info(
            `🧹 Cleaned up ${deletedCount} old conversations from IndexedDB`
          );
        }
      })
      .catch((error) => {
        logger.error('Failed to cleanup IndexedDB conversations:', error);
      });

    // ✅ Listen for "Ask AI About This" messages from background
    const handleMessage = (
      message: { type: string; text?: string },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      logger.info('📬 Message received:', message);

      if (message.type === 'ASK_ABOUT_SELECTION') {
        logger.info('🎯 Ask AI About This triggered', {
          textLength: message.text?.length,
        });

        // Switch to chat view
        setActiveView('chat');

        // Set selected text as context
        if (message.text) {
          setSelectedTextContext(message.text);
          logger.info('✅ Context set, switching to chat');
        }

        sendResponse({ success: true });
      }

      if (message.type === 'GENERATE_FROM_SELECTION') {
        logger.info('✨ Generate Content triggered', {
          textLength: message.text?.length,
        });

        // Switch to writer view
        setActiveView('writer');

        // Set selected text as prompt
        if (message.text) {
          setWriterPromptFromSelection(message.text);
          logger.info('✅ Prompt set, switching to writer');
        }

        sendResponse({ success: true });
      }

      return true; // Keep channel open for async
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // Cleanup
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const views = [
    { id: 'summary' as const, label: 'Summary', icon: FileText },
    { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
    { id: 'writer' as const, label: 'Writer', icon: Sparkles },
    { id: 'library' as const, label: 'Library', icon: Library },
  ];

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen w-full flex-col bg-background">
        {/* Header */}
        <header className="shrink-0 border-b border-border p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">
                ContentChat AI
              </h1>
              <p className="text-sm text-muted-foreground">
                Privacy-first AI reading assistant
              </p>
              {!aiAvailable && (
                <p className="mt-2 text-xs text-destructive">
                  ⚠️ Chrome Built-in AI not available. Please use Chrome 128+
                  with AI enabled.
                </p>
              )}
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Error Banner */}
        <ErrorBanner />

        {/* Navigation */}
        <nav className="shrink-0 border-b border-border bg-muted/50">
          <div className="flex">
            {views.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;

              return (
                <Button
                  key={view.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className="flex-1 rounded-none"
                  onClick={() => setActiveView(view.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {view.label}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Main Content - ChatView always mounted to preserve state */}
        <main className="flex-1 overflow-hidden">
          {/* ChatView - Always mounted, toggled with CSS */}
          <div
            style={{
              display: activeView === 'chat' ? 'flex' : 'none',
              height: '100%',
              flexDirection: 'column',
            }}
          >
            <ChatView
              currentPage={currentPage}
              selectedTextContext={selectedTextContext}
              onContextUsed={() => setSelectedTextContext(null)}
            />
          </div>

          {/* Other views with lazy loading */}
          <Suspense fallback={<SuspenseFallback />}>
            {activeView === 'summary' && (
              <SummaryView
                currentPage={currentPage}
                isPageLoading={pageLoading}
                pageError={pageError}
                onReload={reload}
              />
            )}

            {activeView === 'writer' && (
              <WriterView
                initialPrompt={writerPromptFromSelection}
                onPromptUsed={() => setWriterPromptFromSelection(null)}
              />
            )}

            {activeView === 'library' && <HistoryView />}
          </Suspense>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
