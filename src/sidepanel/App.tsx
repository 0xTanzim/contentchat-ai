function App() {
  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="border-b border-border p-4">
        <h1 className="text-xl font-bold text-foreground">ContentChat AI</h1>
        <p className="text-sm text-muted-foreground">
          Privacy-first AI reading assistant
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-10 w-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold">
              Welcome to ContentChat AI
            </h2>
            <p className="text-sm text-muted-foreground">
              Navigate to any webpage to get started
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
