/**
 * Logger Usage Examples
 * This file demonstrates how to use the new logger system
 */

import { createLogger } from '@/lib/logger';

// ============================================================================
// EXAMPLE 1: Service Logger
// ============================================================================

// Create logger for service (do this once at top of file)
const serviceLogger = createLogger('ChatService');

export class ExampleService {
  async initialize() {
    // ✅ Debug level - detailed information
    serviceLogger.debug('🤖 Initializing service...', {
      timestamp: Date.now(),
      config: { temperature: 0.7 },
    });

    try {
      // ... do initialization

      // ✅ Info level - general information
      serviceLogger.info('✅ Service initialized successfully');
    } catch (error) {
      // ✅ Error level - errors
      serviceLogger.error('❌ Failed to initialize', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async generateResponse(prompt: string) {
    serviceLogger.debug('🚀 Starting generation...', {
      promptLength: prompt.length,
    });

    // ⚠️ Warning level - non-critical issues
    if (prompt.length > 10000) {
      serviceLogger.warn('⚠️ Prompt exceeds recommended length', {
        length: prompt.length,
        recommended: 10000,
      });
    }

    // ... generate response
  }
}

// ============================================================================
// EXAMPLE 2: Hook Logger
// ============================================================================

const hookLogger = createLogger('useChatSession');

export function useChatSession() {
  const sendMessage = async (content: string) => {
    // ✅ Trace level - very detailed (rarely used)
    hookLogger.trace('📝 Message validation starting...', { content });

    hookLogger.debug('💬 Sending message...', {
      contentLength: content.length,
    });

    try {
      // ... send message
      hookLogger.info('✅ Message sent successfully');
    } catch (error) {
      // ✅ Fatal level - critical errors
      if (error instanceof Error && error.message.includes('API_KEY')) {
        hookLogger.fatal('💀 Critical: API key missing!', { error });
      } else {
        hookLogger.error('❌ Failed to send message', { error });
      }
    }
  };

  return { sendMessage };
}

// ============================================================================
// EXAMPLE 3: Component Logger
// ============================================================================

const componentLogger = createLogger('ChatView');

export function ExampleComponent() {
  // ✅ Log component lifecycle
  componentLogger.debug('🎨 Component mounted');

  const handleClick = () => {
    componentLogger.info('🖱️ Button clicked', {
      timestamp: Date.now(),
    });
  };

  // ✅ Log user interactions
  const handleSubmit = async () => {
    componentLogger.debug('📤 Submitting form...');

    try {
      // ... submit
      componentLogger.info('✅ Form submitted successfully');
    } catch (error) {
      componentLogger.error('❌ Form submission failed', { error });
    }
  };

  return null; // Component JSX
}

// ============================================================================
// MIGRATION EXAMPLES
// ============================================================================

// ❌ OLD WAY (Don't use)
export function oldWayExample() {
  const error = new Error('Something went wrong');
  console.log('[DEBUG] 🤖 ChatService: Initializing...');
  console.log('[DEBUG] ✅ ChatService: Initialized');
  console.error('[DEBUG] ❌ ChatService: Error:', error);
}

// ✅ NEW WAY (Use this)
const logger = createLogger('ChatService');
export function newWayExample() {
  const error = new Error('Something went wrong');
  logger.debug('🤖 Initializing...');
  logger.info('✅ Initialized');
  logger.error('❌ Error:', { error });
}

// ============================================================================
// LOG LEVELS GUIDE
// ============================================================================

const guideLogger = createLogger('Guide');

export function logLevelsGuide() {
  // 🔍 TRACE - Very detailed, rarely used
  guideLogger.trace('Variable x =', { x: 42 });

  // 🐛 DEBUG - Debug information (most common in dev)
  guideLogger.debug('Starting process...', { step: 1 });

  // ℹ️ INFO - General information (important events)
  guideLogger.info('Process completed successfully');

  // ⚠️ WARN - Warning, non-critical issue
  guideLogger.warn('Using deprecated API', { api: 'v1' });

  // ❌ ERROR - Error, something went wrong
  guideLogger.error('Failed to fetch data', { error: 'timeout' });

  // 💀 FATAL - Critical error, app cannot continue
  guideLogger.fatal('Database connection lost!');
}

// ============================================================================
// ENVIRONMENT CONTROL
// ============================================================================

/*
  Development (.env.development):
  VITE_LOG_LEVEL=debug    ← Shows: trace, debug, info, warn, error, fatal
  VITE_DEBUG=true

  Production (.env.production):
  VITE_LOG_LEVEL=warn     ← Shows: warn, error, fatal only
  VITE_DEBUG=false

  Custom (command line):
  VITE_LOG_LEVEL=error npm run dev  ← Shows: error, fatal only
*/

// ============================================================================
// OUTPUT EXAMPLES
// ============================================================================

/*
  Development Console Output:
  ─────────────────────────────────────────
  12:34:56 🐛 [ChatService] 🤖 Initializing service... {"timestamp":1234567890,"config":{"temperature":0.7}}
  12:34:57 ℹ️ [ChatService] ✅ Service initialized successfully
  12:35:00 ⚠️ [ChatService] ⚠️ Prompt exceeds recommended length {"length":15000,"recommended":10000}
  12:35:05 ❌ [ChatService] ❌ Failed to send message {"error":"Network timeout"}

  Production Console Output (VITE_LOG_LEVEL=warn):
  ─────────────────────────────────────────
  12:35:00 ⚠️ [ChatService] ⚠️ Prompt exceeds recommended length {"length":15000,"recommended":10000}
  12:35:05 ❌ [ChatService] ❌ Failed to send message {"error":"Network timeout"}

  (debug and info logs are suppressed in production)
*/

export default {};
