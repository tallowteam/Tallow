'use client';

/**
 * @fileoverview Custom hook for managing P2P session state and connection codes
 * @module hooks/use-p2p-session
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { generateWordPhrase, generateShortCode, formatCode, detectCodeType } from '@/lib/transfer/word-phrase-codes';
import { generateUUID } from '@/lib/utils/uuid';

/**
 * Code format types
 */
export type CodeFormat = 'short' | 'words';

/**
 * P2P session state interface
 */
export interface P2PSessionState {
  /** Unique session ID */
  sessionId: string;
  /** Connection code for pairing */
  connectionCode: string;
  /** Format of connection code */
  codeFormat: CodeFormat;
  /** Whether session is active */
  isActive: boolean;
  /** Peer connection code (when joining) */
  peerCode: string | null;
  /** Session start time */
  startTime: Date | null;
  /** Session end time */
  endTime: Date | null;
  /** Session metadata */
  metadata: Record<string, any>;
}

/**
 * Options for P2P session hook
 */
export interface UseP2PSessionOptions {
  /** Default code format */
  defaultCodeFormat?: CodeFormat;
  /** Auto-generate code on mount */
  autoGenerate?: boolean;
  /** Session timeout in milliseconds */
  sessionTimeout?: number;
  /** Callback when session starts */
  onSessionStart?: (sessionId: string) => void;
  /** Callback when session ends */
  onSessionEnd?: (sessionId: string) => void;
  /** Callback when code is generated */
  onCodeGenerated?: (code: string) => void;
}

/**
 * Custom hook for managing P2P session state and connection codes
 *
 * Handles generation of connection codes (short codes or word phrases),
 * session lifecycle, and peer pairing.
 *
 * @param {UseP2PSessionOptions} options - Configuration options
 * @returns Session state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   connectionCode,
 *   codeFormat,
 *   setCodeFormat,
 *   regenerateCode,
 *   startSession,
 *   endSession
 * } = useP2PSession({
 *   defaultCodeFormat: 'words',
 *   autoGenerate: true
 * });
 * ```
 */
export function useP2PSession(options: UseP2PSessionOptions = {}) {
  const {
    defaultCodeFormat = 'short',
    autoGenerate = false,
    sessionTimeout,
    onSessionStart,
    onSessionEnd,
    onCodeGenerated
  } = options;

  // State
  const [state, setState] = useState<P2PSessionState>({
    sessionId: generateUUID(),
    connectionCode: '',
    codeFormat: defaultCodeFormat,
    isActive: false,
    peerCode: null,
    startTime: null,
    endTime: null,
    metadata: {}
  });

  // Refs for callbacks
  const onSessionStartRef = useRef(onSessionStart);
  const onSessionEndRef = useRef(onSessionEnd);
  const onCodeGeneratedRef = useRef(onCodeGenerated);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onSessionStartRef.current = onSessionStart;
    onSessionEndRef.current = onSessionEnd;
    onCodeGeneratedRef.current = onCodeGenerated;
  }, [onSessionStart, onSessionEnd, onCodeGenerated]);

  /**
   * Generate a new connection code based on format
   *
   * @param {CodeFormat} format - Format to use for code generation
   * @returns {string} Generated connection code
   */
  const generateCode = useCallback((format: CodeFormat = state.codeFormat): string => {
    let code: string;

    if (format === 'words') {
      code = generateWordPhrase();
    } else {
      code = generateShortCode();
    }

    setState(prev => ({
      ...prev,
      connectionCode: code,
      codeFormat: format
    }));

    onCodeGeneratedRef.current?.(code);
    return code;
  }, [state.codeFormat]);

  /**
   * Set the code format and regenerate code
   *
   * @param {CodeFormat} format - New code format
   */
  const setCodeFormat = useCallback((format: CodeFormat) => {
    generateCode(format);
  }, [generateCode]);

  /**
   * Regenerate connection code with current format
   *
   * @returns {string} New connection code
   */
  const regenerateCode = useCallback((): string => {
    return generateCode(state.codeFormat);
  }, [generateCode, state.codeFormat]);

  /**
   * Format a connection code for display
   *
   * @param {string} code - Code to format
   * @returns {string} Formatted code
   */
  const formatConnectionCode = useCallback((code: string): string => {
    return formatCode(code);
  }, []);

  /**
   * Detect the type of a connection code
   *
   * @param {string} code - Code to analyze
   * @returns {CodeFormat} Detected code format
   */
  const detectFormat = useCallback((code: string): CodeFormat => {
    const type = detectCodeType(code);
    return type === 'word-phrase' ? 'words' : 'short';
  }, []);

  /**
   * Set peer connection code
   *
   * @param {string} code - Peer's connection code
   */
  const setPeerCode = useCallback((code: string) => {
    setState(prev => ({ ...prev, peerCode: code }));
  }, []);

  /**
   * Start a new session
   *
   * @param {Record<string, any>} metadata - Optional session metadata
   */
  const startSession = useCallback((metadata: Record<string, any> = {}) => {
    const newSessionId = generateUUID();
    const startTime = new Date();

    setState(prev => ({
      ...prev,
      sessionId: newSessionId,
      isActive: true,
      startTime,
      endTime: null,
      metadata
    }));

    onSessionStartRef.current?.(newSessionId);

    // Set timeout if specified
    if (sessionTimeout) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        endSession();
      }, sessionTimeout);
    }
  }, [sessionTimeout]);

  /**
   * End the current session
   */
  const endSession = useCallback(() => {
    const endTime = new Date();

    setState(prev => ({
      ...prev,
      isActive: false,
      endTime,
      peerCode: null
    }));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    onSessionEndRef.current?.(state.sessionId);
  }, [state.sessionId]);

  /**
   * Reset session and generate new code
   */
  const resetSession = useCallback(() => {
    endSession();
    const newSessionId = generateUUID();
    const newCode = generateCode(state.codeFormat);

    setState(prev => ({
      sessionId: newSessionId,
      connectionCode: newCode,
      codeFormat: prev.codeFormat,
      isActive: false,
      peerCode: null,
      startTime: null,
      endTime: null,
      metadata: {}
    }));
  }, [endSession, generateCode, state.codeFormat]);

  /**
   * Update session metadata
   *
   * @param {Record<string, any>} metadata - Metadata to merge
   */
  const updateMetadata = useCallback((metadata: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...metadata }
    }));
  }, []);

  /**
   * Get session duration in milliseconds
   *
   * @returns {number | null} Duration in ms or null if not started
   */
  const getSessionDuration = useCallback((): number | null => {
    if (!state.startTime) {return null;}

    const endTime = state.endTime || new Date();
    return endTime.getTime() - state.startTime.getTime();
  }, [state.startTime, state.endTime]);

  /**
   * Check if session is expired
   *
   * @returns {boolean} True if session has expired
   */
  const isSessionExpired = useCallback((): boolean => {
    if (!sessionTimeout || !state.startTime) {return false;}

    const elapsed = Date.now() - state.startTime.getTime();
    return elapsed > sessionTimeout;
  }, [sessionTimeout, state.startTime]);

  // Initialize on mount
  useEffect(() => {
    if (autoGenerate && !state.connectionCode) {
      generateCode();
    }
  }, [autoGenerate, generateCode, state.connectionCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    sessionId: state.sessionId,
    connectionCode: state.connectionCode,
    codeFormat: state.codeFormat,
    isActive: state.isActive,
    peerCode: state.peerCode,
    startTime: state.startTime,
    endTime: state.endTime,
    metadata: state.metadata,

    // Actions
    generateCode,
    setCodeFormat,
    regenerateCode,
    formatConnectionCode,
    detectFormat,
    setPeerCode,
    startSession,
    endSession,
    resetSession,
    updateMetadata,

    // Utilities
    getSessionDuration,
    isSessionExpired
  };
}

/**
 * Default export
 */
export default useP2PSession;
