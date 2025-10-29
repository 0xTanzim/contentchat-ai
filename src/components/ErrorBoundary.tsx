/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly fallback UI
 * Prevents entire app from crashing due to component errors
 */

import { createLogger } from '@/lib/logger';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

const logger = createLogger('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * Wraps components that might throw errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    logger.error('React Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    // Reload the extension
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
          <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-lg dark:border-red-800 dark:bg-gray-800">
            {/* Error Icon */}
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h2 className="mb-2 text-center text-xl font-bold text-gray-900 dark:text-gray-100">
              Something went wrong
            </h2>

            {/* Error Message */}
            <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
              {error?.message ||
                'An unexpected error occurred. Please try again.'}
            </p>

            {/* Error Details (only in development) */}
            {import.meta.env.DEV && errorInfo && (
              <details className="mb-4 rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
                <summary className="cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
                  Technical Details (Dev Only)
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto text-xs text-gray-600 dark:text-gray-400">
                  {error?.stack}
                </pre>
                <pre className="mt-2 max-h-32 overflow-auto text-xs text-gray-600 dark:text-gray-400">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Extension
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Suspense Fallback Component
 * Shows loading state for lazy-loaded components
 */
export function SuspenseFallback(): ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500" />

        {/* Loading Text */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading component...
        </p>
      </div>
    </div>
  );
}
