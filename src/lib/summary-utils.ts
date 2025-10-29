/**
 * Summary Utility Functions
 * Calculate stats, format text, etc.
 */

export interface SummaryStats {
  originalWordCount: number;
  summaryWordCount: number;
  compressionRatio: number;
  readingTime: number;
  generatedAt: number;
}

/**
 * Calculate word count from text
 */
export function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Calculate reading time in seconds (average 200 words/min)
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.ceil((wordCount / 200) * 60);
}

/**
 * Format reading time for display
 */
export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(
  originalWords: number,
  summaryWords: number
): number {
  if (originalWords === 0) return 0;
  return Math.round(((originalWords - summaryWords) / originalWords) * 100);
}

/**
 * Generate summary stats
 */
export function generateSummaryStats(
  originalText: string,
  summaryText: string
): SummaryStats {
  const originalWordCount = calculateWordCount(originalText);
  const summaryWordCount = calculateWordCount(summaryText);
  const compressionRatio = calculateCompressionRatio(
    originalWordCount,
    summaryWordCount
  );
  const readingTime = calculateReadingTime(summaryWordCount);

  return {
    originalWordCount,
    summaryWordCount,
    compressionRatio,
    readingTime,
    generatedAt: Date.now(),
  };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format summary type label
 */
export function formatSummaryTypeLabel(type: string, length: string): string {
  const typeLabels: Record<string, string> = {
    'key-points': 'Key Points',
    tldr: 'TL;DR',
    teaser: 'Teaser',
    headline: 'Headline',
  };

  const lengthDescriptions: Record<string, Record<string, string>> = {
    'key-points': {
      short: '(3 bullets)',
      medium: '(5 bullets)',
      long: '(7 bullets)',
    },
    tldr: {
      short: '(1 sentence)',
      medium: '(3 sentences)',
      long: '(5 sentences)',
    },
    teaser: {
      short: '(1 sentence)',
      medium: '(3 sentences)',
      long: '(5 sentences)',
    },
    headline: {
      short: '(12 words)',
      medium: '(17 words)',
      long: '(22 words)',
    },
  };

  const label = typeLabels[type] || type;
  const desc = lengthDescriptions[type]?.[length] || '';

  return `${label} ${desc}`.trim();
}
