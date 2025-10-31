/**
 * YouTube Transcript Service - HTML Scraping Method (Chrome Extension Compatible)
 * Based on: https://github.com/danielxceron/youtube-transcript
 *
 * This method extracts captions directly from YouTube page HTML
 * Works in Chrome extensions without CORS issues
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('YouTubeTranscript');

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36';

/**
 * Transcript segment from YouTube
 */
export interface TranscriptSegment {
  text: string; // The text content
  duration: number; // Duration in seconds
  offset: number; // Start time in seconds (timestamp)
  lang?: string; // Language code
}

/**
 * Processed transcript with metadata
 */
export interface VideoTranscript {
  videoId: string;
  segments: TranscriptSegment[];
  fullText: string;
  language: string;
  wordCount: number;
  duration: number; // Total duration in seconds
}

/**
 * Decode HTML entities in transcript text
 */
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Fetch transcript using HTML scraping (Chrome Extension Safe)
 * This method avoids CORS issues by not using InnerTube API
 */
async function fetchTranscriptWithHtmlScraping(
  videoId: string,
  language = 'en'
): Promise<VideoTranscript> {
  logger.info(`🎯 STEP 1/3: Fetching YouTube page HTML...`);

  const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
  logger.debug(`URL: ${videoPageUrl}`);

  const videoPageResponse = await fetch(videoPageUrl, {
    headers: {
      'Accept-Language': language,
    },
  });

  if (!videoPageResponse.ok) {
    throw new Error(`Failed to fetch video page: ${videoPageResponse.status}`);
  }

  const html = await videoPageResponse.text();
  logger.info(`✅ Page HTML fetched: ${html.length} characters`);

  // Extract caption data from HTML
  logger.info(`🔍 STEP 2/3: Extracting caption tracks from HTML...`);

  const splittedHTML = html.split('"captions":');

  if (splittedHTML.length <= 1) {
    // Check for specific error conditions
    if (html.includes('class="g-recaptcha"')) {
      throw new Error('YouTube is rate limiting. Please try again later.');
    }
    if (!html.includes('"playabilityStatus":')) {
      throw new Error('Video is unavailable or private.');
    }
    throw new Error('Captions are disabled for this video.');
  }

  let captions;
  try {
    const captionsJson = splittedHTML[1]
      .split(',"videoDetails')[0]
      .replace('\n', '');
    logger.debug(`Captions JSON preview: ${captionsJson.substring(0, 200)}...`);
    captions = JSON.parse(captionsJson);
  } catch (e) {
    logger.error(`Failed to parse captions JSON: ${e}`);
    throw new Error('Failed to parse caption data from page.');
  }

  const captionTracks =
    captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (
    !captionTracks ||
    !Array.isArray(captionTracks) ||
    captionTracks.length === 0
  ) {
    throw new Error('No captions available for this video.');
  }

  logger.info(`✅ Found ${captionTracks.length} caption tracks`);
  logger.debug(
    `Available languages: ${captionTracks
      .map((t: any) => t.languageCode)
      .join(', ')}`
  );

  // Find caption track for requested language
  let track = captionTracks.find((t: any) => t.languageCode === language);

  if (!track) {
    logger.warn(
      `⚠️ No track for "${language}", using first available: ${captionTracks[0].languageCode}`
    );
    track = captionTracks[0];
  }

  let transcriptURL = track.baseUrl;
  const selectedLang = track.languageCode;

  logger.info(`✅ Selected track: ${selectedLang}`);
  logger.info(`📋 ORIGINAL URL: ${transcriptURL}`);

  // CRITICAL FIX: Remove fmt parameter to get XML instead of JSON3
  // Reference: https://crawlee.dev/blog/scrape-youtube-python
  // "Remove the fmt parameter to get data in convenient XML format instead of complex JSON3"
  if (transcriptURL.includes('fmt=')) {
    const url = new URL(transcriptURL);
    url.searchParams.delete('fmt');
    transcriptURL = url.toString();
    logger.info(`🔧 MODIFIED URL (removed fmt): ${transcriptURL}`);
  } else {
    logger.warn(`⚠️ No fmt parameter found in URL`);
  }

  // Fetch transcript XML
  logger.info(`📥 STEP 3/3: Fetching transcript XML...`);
  logger.info(`🌐 Final URL: ${transcriptURL}`);

  const transcriptResponse = await fetch(transcriptURL, {
    headers: {
      'Accept-Language': language,
    },
  });

  logger.info(
    `📊 Response status: ${transcriptResponse.status} ${transcriptResponse.statusText}`
  );
  logger.info(
    `📊 Content-Type: ${transcriptResponse.headers.get('content-type')}`
  );

  if (!transcriptResponse.ok) {
    throw new Error(`Failed to fetch transcript: ${transcriptResponse.status}`);
  }

  const xml = await transcriptResponse.text();
  logger.info(`✅ Transcript XML fetched: ${xml.length} characters`);

  if (xml.length === 0) {
    logger.error(`❌ RESPONSE IS EMPTY! This is the root cause.`);
    logger.error(`URL that returned empty: ${transcriptURL}`);
    throw new Error(
      'Transcript response is empty - YouTube may have changed their API'
    );
  }

  logger.debug(`XML preview: ${xml.substring(0, 300)}...`);

  // Parse XML using DOMParser
  logger.info(`🔄 Parsing XML transcript...`);

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    logger.error('XML parsing error:', parserError.textContent);
    throw new Error('Failed to parse transcript XML');
  }

  const textElements = xmlDoc.querySelectorAll('text');

  if (textElements.length === 0) {
    throw new Error('No transcript segments found in XML');
  }

  logger.info(`✅ Found ${textElements.length} transcript segments`);

  // Convert XML elements to TranscriptSegment objects
  const segments: TranscriptSegment[] = Array.from(textElements).map(
    (element, index) => {
      const text = decodeHtmlEntities(element.textContent || '');
      const offset = parseFloat(element.getAttribute('start') || '0');
      const duration = parseFloat(element.getAttribute('dur') || '0');

      if (index < 3) {
        logger.debug(
          `Segment ${index}: "${text.substring(0, 50)}..." (${offset.toFixed(
            2
          )}s, ${duration.toFixed(2)}s)`
        );
      }

      return {
        text,
        offset,
        duration,
        lang: selectedLang,
      };
    }
  );

  // Calculate metadata
  const fullText = segments.map((s) => s.text).join(' ');
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  const totalDuration =
    segments.length > 0
      ? segments[segments.length - 1].offset +
        segments[segments.length - 1].duration
      : 0;

  logger.info(`✅✅✅ SUCCESS!`);
  logger.info(`  Segments: ${segments.length}`);
  logger.info(`  Words: ${wordCount}`);
  logger.info(`  Duration: ${totalDuration.toFixed(1)}s`);
  logger.info(`  Language: ${selectedLang}`);

  return {
    videoId,
    segments,
    fullText,
    language: selectedLang,
    wordCount,
    duration: totalDuration,
  };
}

/**
 * Main function: Fetch YouTube video transcript
 * Uses HTML scraping method - Chrome Extension Safe!
 * @param videoId - YouTube video ID (11 characters)
 * @param language - Preferred language code (default: 'en')
 */
export async function fetchVideoTranscript(
  videoId: string,
  language = 'en'
): Promise<VideoTranscript> {
  logger.info(`\n🎯 ========== START TRANSCRIPT FETCH ==========`);
  logger.info(`Video ID: ${videoId}`);
  logger.info(`Language: ${language}`);
  logger.info(`Method: HTML Scraping (Chrome Extension Safe)`);
  logger.info(`==============================================\n`);

  // Validate video ID
  if (!videoId || videoId.length !== 11) {
    logger.error(`❌ Invalid video ID: "${videoId}" (expected 11 characters)`);
    throw new Error('Invalid video ID. Must be 11 characters.');
  }

  try {
    const transcript = await fetchTranscriptWithHtmlScraping(videoId, language);

    logger.info(`\n✅ ========== TRANSCRIPT FETCH COMPLETE ==========`);
    logger.info(`Video: ${videoId}`);
    logger.info(`Segments: ${transcript.segments.length}`);
    logger.info(`Duration: ${transcript.duration.toFixed(1)}s`);
    logger.info(`==================================================\n`);

    return transcript;
  } catch (error) {
    logger.error(`\n❌ ========== TRANSCRIPT FETCH FAILED ==========`);
    logger.error(`Video: ${videoId}`);
    logger.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
    logger.error(`Stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    logger.error(`=================================================\n`);

    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch transcript. Please try again.');
  }
}

/**
 * Format transcript with timestamps
 * Returns nicely formatted text with [MM:SS] timestamps
 */
export function formatTranscriptWithTimestamps(
  segments: TranscriptSegment[]
): string {
  return segments
    .map((segment) => {
      const timestamp = formatTimestamp(segment.offset);
      return `[${timestamp}] ${segment.text}`;
    })
    .join('\n');
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extract key moments from transcript
 * Finds segments that likely represent topic changes or important points
 */
export function extractKeyMoments(
  segments: TranscriptSegment[],
  count: number = 5
): Array<{ timestamp: string; text: string; offset: number }> {
  if (segments.length === 0) return [];

  // Take segments at regular intervals
  const interval = Math.floor(segments.length / (count + 1));
  const keyMoments: Array<{ timestamp: string; text: string; offset: number }> =
    [];

  for (let i = 1; i <= count; i++) {
    const index = Math.min(i * interval, segments.length - 1);
    const segment = segments[index];

    keyMoments.push({
      timestamp: formatTimestamp(segment.offset),
      text: segment.text,
      offset: segment.offset,
    });
  }

  return keyMoments;
}

/**
 * Helper function to test transcript fetching
 * For debugging purposes
 */
export async function testTranscriptFetch(videoId: string): Promise<void> {
  try {
    const transcript = await fetchVideoTranscript(videoId);
    console.log('✅ SUCCESS!');
    console.log(`Segments: ${transcript.segments.length}`);
    console.log(`Duration: ${transcript.duration}s`);
    console.log(`Word count: ${transcript.wordCount}`);
    console.log(`First segment: "${transcript.segments[0]?.text}"`);
  } catch (error) {
    console.error('❌ FAILED:', error);
  }
}
