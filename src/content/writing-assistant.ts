/**
 * Content Script Enhancement for Writing Assistance
 * Handles text selection, proofreading, rewriting, and popup injection
 */

import { proofreadText } from '@/lib/chrome-ai/proofreader';
import { rewriteText } from '@/lib/chrome-ai/rewriter';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ContentScript:Writing');

// Store current selection info INCLUDING THE RANGE
let currentSelection: {
  text: string;
  range: Range | null;
  element: HTMLElement | null;
  // Save range coordinates for later restoration
  rangeInfo: {
    startContainer: Node;
    startOffset: number;
    endContainer: Node;
    endOffset: number;
  } | null;
} | null = null;

/**
 * Get current text selection
 */
function getSelection(): typeof currentSelection {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();

  if (!text) return null;

  // Get the element containing the selection
  const element = range.commonAncestorContainer.parentElement;

  // CRITICAL: Save the exact range coordinates for later!
  const rangeInfo = {
    startContainer: range.startContainer,
    startOffset: range.startOffset,
    endContainer: range.endContainer,
    endOffset: range.endOffset,
  };

  return { text, range, element, rangeInfo };
}

/**
 * Check if element is editable
 */
function isEditableElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  return (
    element.isContentEditable ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'INPUT'
  );
}

/**
 * Replace text using stored range information
 */
function replaceTextAtRange(
  rangeInfo: {
    startContainer: Node;
    startOffset: number;
    endContainer: Node;
    endOffset: number;
  },
  newText: string
): boolean {
  try {
    logger.info('Replacing text at range:', {
      start: rangeInfo.startOffset,
      end: rangeInfo.endOffset,
      newLength: newText.length,
    });

    // Recreate the range from saved coordinates
    const range = document.createRange();
    range.setStart(rangeInfo.startContainer, rangeInfo.startOffset);
    range.setEnd(rangeInfo.endContainer, rangeInfo.endOffset);

    // Delete the old content
    range.deleteContents();

    // Insert new text node at the position
    const textNode = document.createTextNode(newText);
    range.insertNode(textNode);

    // Place cursor after inserted text
    range.setStartAfter(textNode);
    range.collapse(true);

    // Update selection to show cursor position
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Trigger input event for contentEditable/textarea
    const element = rangeInfo.startContainer.parentElement;
    if (element) {
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    logger.info('✅ Text replaced at exact range position');
    return true;
  } catch (error) {
    logger.error('Failed to replace text at range:', error);
    return false;
  }
}

/**
 * Calculate popup position to keep it visible
 */
function calculatePopupPosition(rect: DOMRect): {
  top?: string;
  left: string;
  bottom?: string;
} {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const popupMaxHeight = 400; // Approximate max height
  const popupWidth = 400;
  const margin = 20;

  const top = rect.bottom + 10;
  let left = rect.left;
  const position: { top?: string; left: string; bottom?: string } = {
    top: '0px',
    left: '0px',
  };

  // Check if popup would overflow bottom of viewport
  if (top + popupMaxHeight > viewportHeight - margin) {
    // Position above selection instead
    position.bottom = `${viewportHeight - rect.top + 10}px`;
    delete position.top;
  } else {
    position.top = `${top}px`;
  }

  // Check if popup would overflow right side
  if (left + popupWidth > viewportWidth - margin) {
    left = viewportWidth - popupWidth - margin;
  }

  // Check if popup would overflow left side
  if (left < margin) {
    left = margin;
  }

  position.left = `${left}px`;

  return position;
}

/**
 * Show popup at selection position
 */
function showPopup(
  type: 'proofreader' | 'rewriter',
  data: any,
  isEditable: boolean,
  savedSelection: typeof currentSelection
) {
  // DEBUG: Log what we received
  logger.info('📍 showPopup called with savedSelection:', {
    hasSelection: !!savedSelection,
    hasRangeInfo: !!savedSelection?.rangeInfo,
    text: savedSelection?.text,
    rangeInfo: savedSelection?.rangeInfo
      ? {
          startOffset: savedSelection.rangeInfo.startOffset,
          endOffset: savedSelection.rangeInfo.endOffset,
          startContainer: savedSelection.rangeInfo.startContainer.nodeName,
          endContainer: savedSelection.rangeInfo.endContainer.nodeName,
        }
      : null,
  });

  // Remove existing popup
  const existingPopup = document.getElementById('contentchat-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Get selection position
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Calculate optimal position
  const position = calculatePopupPosition(rect);

  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'contentchat-popup';

  // Build position CSS
  const positionCSS = position.bottom
    ? `bottom: ${position.bottom}; left: ${position.left};`
    : `top: ${position.top}; left: ${position.left};`;

  popup.style.cssText = `
    position: fixed;
    ${positionCSS}
    z-index: 999999;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    padding: 16px;
    max-width: 400px;
    max-height: 400px;
    overflow-y: auto;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  `;

  if (type === 'proofreader') {
    const corrections = data.corrections || [];

    // Helper function to escape HTML
    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    popup.innerHTML = `
      <div style="margin-bottom: 12px;">
        <strong style="color: #1e40af;">Grammar Check Results</strong>
      </div>
      ${
        corrections.length === 0
          ? '<div style="color: #059669;">✓ No corrections needed!</div>'
          : `
        <div style="margin-bottom: 8px; color: #6b7280;">
          Found ${corrections.length} correction${
              corrections.length > 1 ? 's' : ''
            }
        </div>
        <div style="margin-bottom: 12px; max-height: 200px; overflow-y: auto;">
          ${corrections
            .slice(0, 5)
            .map(
              (c: any) => `
            <div style="margin-bottom: 8px; padding: 8px; background: #f3f4f6; border-radius: 4px;">
              <div style="margin-bottom: 4px;">
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">${escapeHtml(
                  c.correctionType || 'grammar'
                )}</span>
              </div>
              <div style="color: #dc2626; text-decoration: line-through; margin-bottom: 4px;">${escapeHtml(
                c.originalText || 'N/A'
              )}</div>
              <div style="color: #059669; font-weight: 500;">→ ${escapeHtml(
                c.correctedText || 'N/A'
              )}</div>
              ${
                c.explanation
                  ? `<div style="font-size: 12px; color: #6b7280; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">${escapeHtml(
                      c.explanation
                    )}</div>`
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>
      `
      }
      ${
        isEditable && corrections.length > 0
          ? `
        <div style="display: flex; gap: 8px;">
          <button id="contentchat-apply" style="
            flex: 1;
            padding: 8px 16px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          ">Apply All</button>
          <button id="contentchat-cancel" style="
            padding: 8px 16px;
            background: #f3f4f6;
            color: #374151;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          ">Cancel</button>
        </div>
      `
          : `
        <button id="contentchat-close" style="
          width: 100%;
          padding: 8px 16px;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        ">Close</button>
      `
      }
    `;

    // Add event listeners
    if (isEditable && corrections.length > 0) {
      popup
        .querySelector('#contentchat-apply')
        ?.addEventListener('click', () => {
          logger.info('🔘 Apply All clicked! Checking savedSelection:', {
            hasSelection: !!savedSelection,
            hasRangeInfo: !!savedSelection?.rangeInfo,
            hasCorrected: !!data.corrected,
            correctedText: data.corrected?.substring(0, 50),
          });

          if (savedSelection?.rangeInfo && data.corrected) {
            const success = replaceTextAtRange(
              savedSelection.rangeInfo,
              data.corrected
            );

            if (success) {
              logger.info('✅ Applied all corrections successfully');
            } else {
              logger.error('❌ Failed to apply corrections');
            }
          } else {
            logger.error('❌ No saved range information available', {
              savedSelection,
              hasRangeInfo: savedSelection?.rangeInfo,
              dataCorrected: data.corrected,
            });
          }
          popup.remove();
        });

      popup
        .querySelector('#contentchat-cancel')
        ?.addEventListener('click', () => {
          popup.remove();
        });
    } else {
      popup
        .querySelector('#contentchat-close')
        ?.addEventListener('click', () => {
          popup.remove();
        });
    }
  } else if (type === 'rewriter') {
    popup.innerHTML = `
      <div style="margin-bottom: 12px;">
        <strong style="color: #7c3aed; font-size: 15px;">Rewritten Text (${
          data.preset
        })</strong>
      </div>
      <div style="margin-bottom: 12px; padding: 12px; background: #faf5ff; border-radius: 6px; max-height: 200px; overflow-y: auto; color: #1f2937; line-height: 1.6;">
        ${data.rewrittenText}
      </div>
      ${
        isEditable
          ? `
        <div style="display: flex; gap: 8px;">
          <button id="contentchat-apply" style="
            flex: 1;
            padding: 8px 16px;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          ">Replace</button>
          <button id="contentchat-cancel" style="
            padding: 8px 16px;
            background: #f3f4f6;
            color: #374151;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          ">Cancel</button>
        </div>
      `
          : `
        <button id="contentchat-close" style="
          width: 100%;
          padding: 8px 16px;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        ">Close</button>
      `
      }
    `;

    // Add event listeners
    if (isEditable) {
      popup
        .querySelector('#contentchat-apply')
        ?.addEventListener('click', () => {
          if (savedSelection?.rangeInfo && data.rewrittenText) {
            const success = replaceTextAtRange(
              savedSelection.rangeInfo,
              data.rewrittenText
            );

            if (success) {
              logger.info('✅ Applied rewrite successfully');
            } else {
              logger.error('❌ Failed to apply rewrite');
            }
          } else {
            logger.error('❌ No saved range information available');
          }
          popup.remove();
        });

      popup
        .querySelector('#contentchat-cancel')
        ?.addEventListener('click', () => {
          popup.remove();
        });
    } else {
      popup
        .querySelector('#contentchat-close')
        ?.addEventListener('click', () => {
          popup.remove();
        });
    }
  }

  document.body.appendChild(popup);

  // Close on click outside
  setTimeout(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!popup.contains(e.target as Node)) {
        popup.remove();
        document.removeEventListener('click', handleClickOutside);
      }
    };
    document.addEventListener('click', handleClickOutside);
  }, 100);
}

/**
 * Handle proofreading request
 */
async function handleProofread(text: string, isEditable: boolean) {
  try {
    logger.info('Proofreading selected text', { textLength: text.length });

    // Show loading indicator
    const loadingPopup = document.createElement('div');
    loadingPopup.id = 'contentchat-loading';
    loadingPopup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 999999;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      padding: 20px 30px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    `;
    loadingPopup.textContent = '✏️ Checking grammar...';
    document.body.appendChild(loadingPopup);

    const result = await proofreadText(text);

    logger.info('Proofread result received:', {
      corrected: result.corrected?.substring(0, 50),
      correctionsCount: result.corrections?.length,
      corrections: result.corrections,
      fullResult: result, // Log the FULL result to see all fields
    });

    logger.info('🎯 About to call showPopup with currentSelection:', {
      hasCurrentSelection: !!currentSelection,
      hasRangeInfo: !!currentSelection?.rangeInfo,
      currentSelectionText: currentSelection?.text,
    });

    loadingPopup.remove();

    // Transform corrections to include original text extracted from indices
    const transformedCorrections =
      result.corrections?.map((c: any) => ({
        originalText: text.substring(c.startIndex, c.endIndex),
        correctedText: c.correction,
        correctionType: c.correctionType || 'grammar',
        explanation: c.explanation,
        startIndex: c.startIndex,
        endIndex: c.endIndex,
      })) || [];

    // IMPORTANT: If API doesn't return 'corrected', build it ourselves
    let correctedText = result.corrected;
    if (!correctedText && result.corrections && result.corrections.length > 0) {
      // Apply all corrections to build the corrected text
      correctedText = text;
      // Sort corrections by startIndex in reverse order to apply from end to start
      const sortedCorrections = [...result.corrections].sort(
        (a: any, b: any) => b.startIndex - a.startIndex
      );
      for (const c of sortedCorrections) {
        const rawCorrection = c as any;
        correctedText =
          correctedText.substring(0, rawCorrection.startIndex) +
          rawCorrection.correction +
          correctedText.substring(rawCorrection.endIndex);
      }
      logger.info('✅ Built corrected text from corrections:', correctedText);
    }

    showPopup(
      'proofreader',
      {
        originalText: text,
        corrected: correctedText,
        corrections: transformedCorrections,
      },
      isEditable,
      currentSelection
    );

    logger.info('✅ Called showPopup with data:', {
      hasCorrected: !!correctedText,
      correctedValue: correctedText,
      correctionsCount: transformedCorrections.length,
    });
  } catch (error) {
    logger.error('Proofreading failed:', error);
    document.getElementById('contentchat-loading')?.remove();

    // Show error popup
    const errorPopup = document.createElement('div');
    errorPopup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 999999;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 400px;
    `;

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    errorPopup.innerHTML = `
      <div style="color: #dc2626; font-weight: 600; margin-bottom: 8px;">❌ Proofreading Failed</div>
      <div style="color: #374151; margin-bottom: 12px;">${errorMessage}</div>
      <button id="close-error" style="
        width: 100%;
        padding: 8px;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      ">Close</button>
    `;

    document.body.appendChild(errorPopup);
    errorPopup.querySelector('#close-error')?.addEventListener('click', () => {
      errorPopup.remove();
    });

    setTimeout(() => errorPopup.remove(), 5000);
  }
}

/**
 * Handle rewriting request
 */
async function handleRewrite(
  text: string,
  preset: string,
  isEditable: boolean
) {
  try {
    logger.info(`Rewriting text with preset: ${preset}`, {
      textLength: text.length,
    });

    // Show loading indicator
    const loadingPopup = document.createElement('div');
    loadingPopup.id = 'contentchat-loading';
    loadingPopup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 999999;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      padding: 20px 30px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    `;
    loadingPopup.textContent = '✨ Rewriting...';
    document.body.appendChild(loadingPopup);

    const presetOptions: Record<string, any> = {
      formal: { tone: 'more-formal', format: 'plain-text', length: 'as-is' },
      casual: { tone: 'more-casual', format: 'plain-text', length: 'as-is' },
      shorter: { tone: 'as-is', format: 'plain-text', length: 'shorter' },
      longer: { tone: 'as-is', format: 'plain-text', length: 'longer' },
    };

    const rewrittenText = await rewriteText(text, presetOptions[preset]);

    logger.info('Rewrite result received:', {
      preset,
      originalLength: text.length,
      rewrittenLength: rewrittenText?.length,
    });

    loadingPopup.remove();

    showPopup(
      'rewriter',
      {
        originalText: text,
        rewrittenText,
        preset,
      },
      isEditable,
      currentSelection
    );
  } catch (error) {
    logger.error('Rewriting failed:', error);
    document.getElementById('contentchat-loading')?.remove();

    // Show error popup
    const errorPopup = document.createElement('div');
    errorPopup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 999999;
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 400px;
    `;

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    errorPopup.innerHTML = `
      <div style="color: #ea580c; font-weight: 600; margin-bottom: 8px;">❌ Rewriting Failed</div>
      <div style="color: #374151; margin-bottom: 12px;">${errorMessage}</div>
      <button id="close-error" style="
        width: 100%;
        padding: 8px;
        background: #f59e0b;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      ">Close</button>
    `;

    document.body.appendChild(errorPopup);
    errorPopup.querySelector('#close-error')?.addEventListener('click', () => {
      errorPopup.remove();
    });

    setTimeout(() => errorPopup.remove(), 5000);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  logger.debug('Received message:', message.type);

  if (message.type === 'PROOFREAD_TEXT') {
    currentSelection = getSelection();
    const text = message.text || currentSelection?.text || '';
    const isEditable =
      message.isEditable ||
      isEditableElement(currentSelection?.element || null);

    if (text) {
      queueMicrotask(() => {
        handleProofread(text, isEditable);
      });
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'REWRITE_TEXT') {
    currentSelection = getSelection();
    const text = message.text || currentSelection?.text || '';
    const isEditable =
      message.isEditable ||
      isEditableElement(currentSelection?.element || null);

    if (text) {
      queueMicrotask(() => {
        handleRewrite(text, message.preset, isEditable);
      });
    }
    sendResponse({ success: true });
    return true;
  }

  return false;
});

logger.info('Writing assistance content script loaded');
