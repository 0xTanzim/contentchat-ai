/**
 * Production-Ready Logger
 * Uses pino for high-performance logging with environment-based control
 *
 * Features:
 * - Auto-disabled in production (can be controlled via env var)
 * - Different log levels (trace, debug, info, warn, error, fatal)
 * - Pretty formatting in development
 * - Browser-compatible
 * - Zero overhead when disabled
 */

import pino from 'pino';

// Environment detection
const isDevelopment = import.meta.env.MODE === 'development';

// Log level configuration
const LOG_LEVEL =
  import.meta.env.VITE_LOG_LEVEL || (isDevelopment ? 'debug' : 'warn');

/**
 * Format log for browser console
 */
function formatBrowserLog(
  level: string,
  context: string,
  msg: string,
  obj?: any
): string {
  const emoji = getEmojiForLevel(level);
  const timestamp = new Date().toLocaleTimeString();
  const contextStr = context ? `[${context}]` : '';

  // Handle Error objects and objects containing errors
  let objStr = '';
  if (obj) {
    if (obj instanceof Error) {
      // Direct Error object
      objStr = ` ${JSON.stringify({
        name: obj.name,
        message: obj.message,
        stack: obj.stack,
      })}`;
    } else if (obj.error instanceof Error) {
      // Object with error property
      objStr = ` ${JSON.stringify({
        error: {
          name: obj.error.name,
          message: obj.error.message,
          stack: obj.error.stack,
        },
        ...Object.fromEntries(
          Object.entries(obj).filter(([key]) => key !== 'error')
        ),
      })}`;
    } else {
      // Regular object
      objStr = ` ${JSON.stringify(obj)}`;
    }
  }

  return `${timestamp} ${emoji} ${contextStr} ${msg}${objStr}`;
}

/**
 * Get emoji for log level
 */
function getEmojiForLevel(level: string): string {
  switch (level) {
    case 'trace':
      return '🔍';
    case 'debug':
      return '🐛';
    case 'info':
      return 'ℹ️';
    case 'warn':
      return '⚠️';
    case 'error':
      return '❌';
    case 'fatal':
      return '💀';
    default:
      return '📝';
  }
}

/**
 * Check if logging is enabled for level
 */
function isLevelEnabled(level: string): boolean {
  const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  const configLevel = LOG_LEVEL.toLowerCase();
  const levelIndex = levels.indexOf(level);
  const configIndex = levels.indexOf(configLevel);
  return levelIndex >= configIndex;
}

/**
 * Browser logger implementation
 */
class BrowserLogger {
  private context: string;

  constructor(context: string = '') {
    this.context = context;
  }

  trace(msg: string, obj?: any): void {
    // Only log traces in development
    if (isDevelopment && isLevelEnabled('trace')) {
      console.trace(formatBrowserLog('trace', this.context, msg, obj));
    }
  }

  debug(msg: string, obj?: any): void {
    // Only log debug in development
    if (isDevelopment && isLevelEnabled('debug')) {
      console.debug(formatBrowserLog('debug', this.context, msg, obj));
    }
  }

  info(msg: string, obj?: any): void {
    // Only log info in development
    if (isDevelopment && isLevelEnabled('info')) {
      console.info(formatBrowserLog('info', this.context, msg, obj));
    }
  }

  warn(msg: string, obj?: any): void {
    // Only log warnings in development to avoid chrome://extensions errors
    if (isDevelopment && isLevelEnabled('warn')) {
      console.warn(formatBrowserLog('warn', this.context, msg, obj));
    }
  }

  error(msg: string, obj?: any): void {
    // Only log errors in development to avoid chrome://extensions errors
    if (isDevelopment && isLevelEnabled('error')) {
      console.error(formatBrowserLog('error', this.context, msg, obj));
    }
  }

  fatal(msg: string, obj?: any): void {
    // Only log fatal errors in development to avoid chrome://extensions errors
    if (isDevelopment && isLevelEnabled('fatal')) {
      console.error(formatBrowserLog('fatal', this.context, msg, obj));
    }
  }

  child(bindings: { context?: string }): BrowserLogger {
    return new BrowserLogger(bindings.context || this.context);
  }
}

/**
 * Create logger instance
 * In browser, use our custom logger; in Node.js, use pino
 */
const logger =
  typeof window !== 'undefined'
    ? new BrowserLogger()
    : pino({
        level: LOG_LEVEL,
        ...(isDevelopment && {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
        }),
      });

/**
 * Create child logger with context
 */
export function createLogger(context: string): BrowserLogger {
  if (typeof window !== 'undefined') {
    return new BrowserLogger(context);
  }
  // @ts-expect-error - pino types don't match perfectly
  return logger.child({ context });
}

/**
 * Main logger instance
 */
export { logger };

/**
 * Typed logger interface for better DX
 */
export interface Logger {
  trace: (msg: string, obj?: any) => void;
  debug: (msg: string, obj?: any) => void;
  info: (msg: string, obj?: any) => void;
  warn: (msg: string, obj?: any) => void;
  error: (msg: string, obj?: any) => void;
  fatal: (msg: string, obj?: any) => void;
  child: (bindings: { context?: string }) => Logger;
}

// Export default instance
export default logger;
