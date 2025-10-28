/**
 * useTypewriter Hook
 * Provides smooth typewriter animation effect
 * Self-contained and reusable
 */

import type { UseTypewriterReturn } from '@/types/summary.types';
import { useEffect, useState } from 'react';

/**
 * Hook for typewriter animation effect
 * @param targetText - Text to animate towards
 * @param enabled - Whether animation is active
 * @param charsPerTick - Characters to add per animation tick (default: 3)
 * @param tickDelay - Delay between ticks in ms (default: 10)
 * @returns Animated display text
 */
export function useTypewriter(
  targetText: string,
  enabled: boolean,
  charsPerTick: number = 3,
  tickDelay: number = 10
): UseTypewriterReturn {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    // If not streaming, show full text immediately
    if (!enabled) {
      setDisplayText(targetText);
      return;
    }

    const currentLength = displayText.length;
    const targetLength = targetText.length;

    // Already at target length
    if (currentLength >= targetLength) {
      setDisplayText(targetText);
      return;
    }

    // Calculate chars to add
    const charsToAdd = Math.min(charsPerTick, targetLength - currentLength);

    // Animate
    const timer = setTimeout(() => {
      setDisplayText(targetText.substring(0, currentLength + charsToAdd));
    }, tickDelay);

    return () => clearTimeout(timer);
  }, [targetText, enabled, displayText, charsPerTick, tickDelay]);

  return { displayText };
}
