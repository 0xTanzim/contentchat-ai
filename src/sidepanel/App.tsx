import { Button } from '@/components/ui/button';
import { isAIAvailable } from '@/lib/chrome-ai';
import { FileText, Languages, Library, MessageCircle } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';
import { ChatView } from './components/ChatView';
import { ErrorBanner } from './components/ErrorBanner';
import { HistoryView } from './components/library';
import { SummaryView } from './components/summary';
import { useChromeExtension } from './hooks/useChromeExtension';
import { useAppStore } from './stores/appStore';

function App() {
  const { activeView, setActiveView, aiAvailable, setAiAvailable } =
    useAppStore();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const views = [
    { id: 'summary' as const, label: 'Summary', icon: FileText },
    { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
    { id: 'translate' as const, label: 'Translate', icon: Languages },
    { id: 'library' as const, label: 'Library', icon: Library },
  ];

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen w-full flex-col bg-background">
        {/* Header */}
        <header className="shrink-0 border-b border-border p-4">
          <h1 className="text-xl font-bold text-foreground">ContentChat AI</h1>
          <p className="text-sm text-muted-foreground">
            Privacy-first AI reading assistant
          </p>
          {!aiAvailable && (
            <p className="mt-2 text-xs text-destructive">
              ⚠️ Chrome Built-in AI not available. Please use Chrome 128+ with
              AI enabled.
            </p>
          )}
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
                  disabled={view.id === 'translate'}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {view.label}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {activeView === 'summary' && (
            <SummaryView
              currentPage={currentPage}
              isPageLoading={pageLoading}
              pageError={pageError}
              onReload={reload}
            />
          )}
          {activeView === 'chat' && <ChatView currentPage={currentPage} />}
          {activeView === 'translate' && (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <Languages className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  Translation feature will be available soon
                </p>
              </div>
            </div>
          )}
          {activeView === 'library' && <HistoryView />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
