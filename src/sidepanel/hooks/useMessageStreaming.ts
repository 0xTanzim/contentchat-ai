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
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const currentIndexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  /**
   * Start or reset streaming
   */
  useEffect(() => {
    if (!enabled) {
      setDisplayedText(fullText);
      setIsStreaming(false);
      currentIndexRef.current = fullText.length;
      return;
    }

    // Reset if fullText is shorter (new text)
    if (fullText.length < currentIndexRef.current) {
      currentIndexRef.current = 0;
      setDisplayedText('');
    }

    // If text is complete, stop
    if (currentIndexRef.current >= fullText.length) {
      setIsStreaming(false);
      return;
    }

    // Start streaming
    setIsStreaming(true);

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
  }, [fullText, speed, enabled]); // ✅ displayedText.length removed!

  // Note: skipToEnd function removed as it's not used in the interface

  return {
    displayText: displayedText,
    progress:
      fullText.length > 0 ? (displayedText.length / fullText.length) * 100 : 0,
    isComplete: !isStreaming && displayedText.length === fullText.length,
  };
}
