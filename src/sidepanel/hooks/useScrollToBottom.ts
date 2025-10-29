/**
 * useScrollToBottom Hook
 * Auto-scrolls container to bottom when new content appears
 * Smooth scroll behavior with configurable options
 */

import type { UseScrollToBottomReturn } from '@/types/chat.types';
import { useEffect, useRef } from 'react';

/**
 * Auto-scroll to bottom hook
 */
export function useScrollToBottom<T extends HTMLElement = HTMLDivElement>(
  dependencies: any[],
  options: {
    smooth?: boolean;
    enabled?: boolean;
  } = {}
): UseScrollToBottomReturn {
  // ✅ Remove generic - type is not generic
  const { smooth = true, enabled = true } = options;

  const containerRef = useRef<T>(null);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  /**
   * Scroll to bottom
   */
  const scrollToBottom = (force: boolean = false) => {
    if (!enabled && !force) return;
    if (!containerRef.current) return;

    const container = containerRef.current;
    const shouldScroll = force || !isUserScrollingRef.current;

    if (shouldScroll) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  /**
   * Detect user scrolling
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      // User scrolled up
      if (scrollTop < lastScrollTopRef.current && !isAtBottom) {
        isUserScrollingRef.current = true;
      }

      // User scrolled to bottom
      if (isAtBottom) {
        isUserScrollingRef.current = false;
      }

      lastScrollTopRef.current = scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /**
   * Auto-scroll when dependencies change
   */
  useEffect(() => {
    if (enabled) {
      scrollToBottom();
    }
  }, dependencies);

  return {
    containerRef,
    scrollToBottom,
  };
}
