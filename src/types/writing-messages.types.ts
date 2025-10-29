/**
 * Writing Assistant Message Types
 */

export interface ProofreadRequest {
  type: 'PROOFREAD_TEXT';
  text: string;
  isEditable: boolean;
}

export interface RewriteRequest {
  type: 'REWRITE_TEXT';
  text: string;
  preset: 'formal' | 'casual' | 'shorter' | 'longer';
  isEditable: boolean;
}

export interface ProofreadResponse {
  type: 'PROOFREAD_RESULT';
  originalText: string;
  correctedText: string;
  corrections: Array<{
    startIndex: number;
    endIndex: number;
    correctionType: string;
    originalText: string;
    correctedText: string;
    explanation?: string;
  }>;
}

export interface RewriteResponse {
  type: 'REWRITE_RESULT';
  originalText: string;
  rewrittenText: string;
  preset: string;
}

export interface ShowPopupMessage {
  type: 'SHOW_POPUP';
  popupType: 'proofreader' | 'rewriter';
  data: ProofreadResponse | RewriteResponse;
  position: { x: number; y: number };
  isEditable: boolean;
}

export type WritingMessage =
  | ProofreadRequest
  | RewriteRequest
  | ProofreadResponse
  | RewriteResponse
  | ShowPopupMessage;
