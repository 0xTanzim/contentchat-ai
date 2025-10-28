/**
 * Unit tests for Chrome AI wrapper library
 * @file src/lib/chrome-ai.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockAIAvailable,
  mockAIQuotaExceeded,
  mockAIRequiresDownload,
  mockAIUnavailable,
} from '../__tests__/mocks/chrome-ai.mock';
import {
  checkCapability,
  detectLanguage,
  isAIAvailable,
  promptWithContext,
  summarizeText,
  translateText,
} from './chrome-ai';

describe('chrome-ai library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAIAvailable', () => {
    it('should return true when Summarizer or LanguageModel exists', () => {
      mockAIAvailable();
      expect(isAIAvailable()).toBe(true);
    });

    it('should return false when Chrome AI APIs do not exist', () => {
      mockAIUnavailable();
      expect(isAIAvailable()).toBe(false);
    });
  });

  describe('checkCapability', () => {
    it('should return "readily" when API is available', async () => {
      mockAIAvailable();
      const result = await checkCapability('summarizer');
      expect(result).toBe('readily');
    });

    it('should return "after-download" when download is needed', async () => {
      mockAIRequiresDownload();
      const result = await checkCapability('summarizer');
      expect(result).toBe('after-download');
    });

    it('should return "no" when API does not exist', async () => {
      mockAIUnavailable();
      const result = await checkCapability('summarizer');
      expect(result).toBe('no');
    });
  });

  describe('summarizeText', () => {
    it('should successfully summarize text', async () => {
      const { mockSummarizer } = mockAIAvailable();
      const text = 'This is a long article that needs to be summarized.';

      const result = await summarizeText(text, 'key-points');

      expect(result).toBeTruthy();
      expect(mockSummarizer.summarize).toHaveBeenCalledWith(text);
      expect(mockSummarizer.destroy).toHaveBeenCalled();
    });

    it('should truncate text longer than 50000 characters', async () => {
      const { mockSummarizer } = mockAIAvailable();
      const longText = 'a'.repeat(60000);

      await summarizeText(longText);

      const callArg = mockSummarizer.summarize.mock.calls[0][0];
      expect(callArg.length).toBeLessThanOrEqual(50000);
    });

    it('should throw error when AI is unavailable', async () => {
      mockAIUnavailable();

      await expect(summarizeText('test')).rejects.toThrow(
        'Summarizer API not available. Please use Chrome 138+ with AI enabled.'
      );
    });

    it('should handle quota exceeded error', async () => {
      mockAIQuotaExceeded();

      await expect(summarizeText('test')).rejects.toThrow();
    });

    it('should cleanup summarizer on error', async () => {
      const { mockSummarizer } = mockAIAvailable();
      mockSummarizer.summarize.mockRejectedValueOnce(new Error('Test error'));

      await expect(summarizeText('test')).rejects.toThrow();
      expect(mockSummarizer.destroy).toHaveBeenCalled();
    });
  });

  describe('promptWithContext', () => {
    it('should successfully prompt with context', async () => {
      const { mockLanguageModel } = mockAIAvailable();
      const context = 'Article about AI';
      const question = 'What is this about?';

      const result = await promptWithContext(context, question);

      expect(result).toBeTruthy();
      expect(mockLanguageModel.prompt).toHaveBeenCalled();
      expect(mockLanguageModel.destroy).toHaveBeenCalled();
    });

    it('should include context in prompt', async () => {
      const { mockLanguageModel } = mockAIAvailable();
      const context = 'Article content here';
      const question = 'Summarize this';

      await promptWithContext(context, question);

      const promptArg = mockLanguageModel.prompt.mock.calls[0][0];
      expect(promptArg).toContain(context);
      expect(promptArg).toContain(question);
    });

    it('should throw error when language model is unavailable', async () => {
      mockAIUnavailable();

      await expect(promptWithContext('context', 'question')).rejects.toThrow(
        'LanguageModel API not available. Please use Chrome 138+ with AI enabled.'
      );
    });

    it('should cleanup language model on error', async () => {
      const { mockLanguageModel } = mockAIAvailable();
      mockLanguageModel.prompt.mockRejectedValueOnce(new Error('Test error'));

      await expect(promptWithContext('ctx', 'q')).rejects.toThrow();
      expect(mockLanguageModel.destroy).toHaveBeenCalled();
    });
  });

  describe('translateText', () => {
    it('should successfully translate text', async () => {
      mockAIAvailable();
      const text = 'Hello world';

      const result = await translateText(text, 'en', 'es');

      expect(result).toBeTruthy();
      expect(result).toContain('Translated');
    });

    it('should throw error when translator is unavailable', async () => {
      mockAIUnavailable();

      await expect(translateText('test', 'en', 'es')).rejects.toThrow(
        'Translator API not available. Please use Chrome 138+ with AI enabled.'
      );
    });
  });

  describe('detectLanguage', () => {
    it('should successfully detect language', async () => {
      mockAIAvailable();
      const text = 'This is English text';

      const result = await detectLanguage(text);

      expect(result).toBeTruthy();
      // Result could be array or object depending on API
      expect(typeof result).toBe('object');
    });

    it('should throw error when language detector is unavailable', async () => {
      mockAIUnavailable();

      await expect(detectLanguage('test')).rejects.toThrow(
        'LanguageDetector API not available. Please use Chrome 138+ with AI enabled.'
      );
    });
  });
});
