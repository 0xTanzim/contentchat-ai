/**
 * useMessageStreaming Hook
 * Provides character-by-character typewriter effect for AI responses
 * Configurable speed for smooth animation
 */

import type {
  StreamSpeed,
  UseMessageStreamingReturn,
} from '@/types/chat.types';
import { useEffect, useRef, useState } from 'react';

/**
 * Character delay based on stream speed (ms)
 */
const SPEED_DELAYS: Record<StreamSpeed, number> = {
  fast: 10,
  medium: 20,
  slow: 40,
};

/**
 * Message streaming hook for typewriter effect
 */
export function useMessageStreaming(
  fullText: string,
  speed: StreamSpeed = 'medium',
  enabled: boolean = true
): UseMessageStreamingReturn {
  // Lazy initialization based on enabled state
  const [displayedText, setDisplayedText] = useState(() =>
    enabled ? '' : fullText
  );
  const [isStreaming, setIsStreaming] = useState(false);

  const currentIndexRef = useRef(enabled ? 0 : fullText.length);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // If not streaming, show full text immediately
    if (!enabled) {
      // Use queueMicrotask to defer state update
      queueMicrotask(() => {
        setDisplayedText(fullText);
        setIsStreaming(false);
        currentIndexRef.current = fullText.length;
      });
      return;
    }

    // Reset if fullText is shorter (new text)
    if (fullText.length < currentIndexRef.current) {
      currentIndexRef.current = 0;
      queueMicrotask(() => setDisplayedText(''));
    }

    // If text is complete, stop
    if (currentIndexRef.current >= fullText.length) {
      if (isStreaming) {
        queueMicrotask(() => setIsStreaming(false));
      }
      return;
    }

    // Start streaming
    if (!isStreaming) {
      queueMicrotask(() => setIsStreaming(true));
    }

    const delay = SPEED_DELAYS[speed];

    timerRef.current = setInterval(() => {
      const currentIndex = currentIndexRef.current;

      if (currentIndex >= fullText.length) {
        setIsStreaming(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      // Add next character
      setDisplayedText(fullText.substring(0, currentIndex + 1));
      currentIndexRef.current++;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullText, speed, enabled, isStreaming]);

  return {
    displayText: displayedText,
    progress:
      fullText.length > 0 ? (displayedText.length / fullText.length) * 100 : 0,
    isComplete: !isStreaming && displayedText.length === fullText.length,
  };
}
