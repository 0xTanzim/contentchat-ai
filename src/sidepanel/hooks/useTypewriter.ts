/**
 * useTypewriter Hook
 * Provides smooth typewriter animation effect
 * Self-contained and reusable
 */

import type { UseTypewriterReturn } from '@/types/summary.types';
import { useEffect, useRef, useState } from 'react';

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
  const currentLengthRef = useRef(0); // ✅ Use ref to avoid dependency cycle

  useEffect(() => {
    // If not streaming, show full text immediately
    if (!enabled) {
      setDisplayText(targetText);
      currentLengthRef.current = targetText.length;
      return;
    }

    const currentLength = currentLengthRef.current;
    const targetLength = targetText.length;

    // Reset if target text changed
    if (targetLength < currentLength) {
      currentLengthRef.current = 0;
      setDisplayText('');
      return;
    }

    // Already at target length
    if (currentLength >= targetLength) {
      setDisplayText(targetText);
      return;
    }

    // Calculate chars to add
    const charsToAdd = Math.min(charsPerTick, targetLength - currentLength);

    // Animate
    const timer = setTimeout(() => {
      const newLength = currentLength + charsToAdd;
      currentLengthRef.current = newLength;
      setDisplayText(targetText.substring(0, newLength));
    }, tickDelay);

    return () => clearTimeout(timer);
  }, [targetText, enabled, charsPerTick, tickDelay]); // ✅ displayText removed!

  return { displayText };
}
