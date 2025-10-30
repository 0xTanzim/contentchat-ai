/**
 * useWriter Hook
 * React hook for Writer API - Generate new content from prompts
 */

import { writeTextStreaming } from '@/lib/chrome-ai/writer';
import type { WriterFormat, WriterLength, WriterTone } from '@/types/chrome-ai';
import { useCallback, useRef, useState } from 'react';

interface UseWriterOptions {
  tone?: WriterTone;
  format?: WriterFormat;
  length?: WriterLength;
  sharedContext?: string;
}

interface UseWriterReturn {
  generate: (prompt: string, context?: string) => Promise<void>;
  cancel: () => void;
  isGenerating: boolean;
  output: string;
  error: string | null;
  clear: () => void;
}

export function useWriter(options?: UseWriterOptions): UseWriterReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (prompt: string, context?: string) => {
      if (!prompt.trim()) {
        setError('Please enter a prompt');
        return;
      }

      setIsGenerating(true);
      setError(null);
      setOutput('');

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        const stream = writeTextStreaming(prompt, {
          context,
          tone: options?.tone,
          format: options?.format,
          length: options?.length,
          sharedContext: options?.sharedContext,
          signal: abortControllerRef.current.signal,
        });

        // Stream chunks as they arrive
        for await (const chunk of stream) {
          setOutput((prev) => prev + chunk);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setError('Generation cancelled');
        } else {
          setError(err.message || 'Failed to generate content');
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [options?.tone, options?.format, options?.length, options?.sharedContext]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  }, []);

  const clear = useCallback(() => {
    setOutput('');
    setError(null);
  }, []);

  return {
    generate,
    cancel,
    isGenerating,
    output,
    error,
    clear,
  };
}
