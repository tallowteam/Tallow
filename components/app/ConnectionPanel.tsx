'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDeviceStore } from '@/lib/stores';

interface ConnectionPanelProps {
  connectionCode?: string;
  onConnect?: (code: string) => void;
  onGenerateCode?: () => void;
  className?: string;
}

export function ConnectionPanel({
  connectionCode,
  onConnect,
  onGenerateCode,
  className = ''
}: ConnectionPanelProps) {
  const [inputCode, setInputCode] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const { connection } = useDeviceStore();
  const isConnecting = connection.status === 'connecting';
  const isConnected = connection.status === 'connected';

  const handleCopyCode = useCallback(async () => {
    if (!connectionCode) return;

    try {
      await navigator.clipboard.writeText(connectionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, [connectionCode]);

  const handleConnect = useCallback(() => {
    if (inputCode.trim() && onConnect) {
      onConnect(inputCode.trim());
      setInputCode('');
    }
  }, [inputCode, onConnect]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputCode.trim()) {
      handleConnect();
    }
  }, [inputCode, handleConnect]);

  const formatCode = (code: string): string => {
    // Format code as groups of 4 characters
    return code.match(/.{1,4}/g)?.join('-') || code;
  };

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [copied]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection code display */}
      {connectionCode && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/70">Your connection code</h3>

          <div className="relative">
            <div className="
              p-6 rounded-lg border border-white/20 bg-gradient-to-br from-white/5 to-white/10
              backdrop-blur-sm hover:border-white/30 transition-all duration-300
              group
            ">
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-3xl font-mono font-bold text-white tracking-wider">
                    {formatCode(connectionCode)}
                  </p>
                </div>

                {/* Copy button */}
                <button
                  onClick={handleCopyCode}
                  className="
                    flex-shrink-0 p-3 rounded-md
                    bg-white/10 hover:bg-white/20
                    border border-white/20 hover:border-white/40
                    transition-all duration-200
                    group/btn
                  "
                  type="button"
                  aria-label="Copy connection code"
                >
                  {copied ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/60 group-hover/btn:text-white transition-colors"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Copy confirmation */}
              {copied && (
                <div className="mt-2 text-xs text-white/50 animate-in fade-in slide-in-from-top-1 duration-200">
                  Copied to clipboard!
                </div>
              )}
            </div>
          </div>

          {/* QR code toggle */}
          <button
            onClick={() => setShowQR(!showQR)}
            className="
              w-full p-3 rounded-md text-sm
              bg-white/5 hover:bg-white/10
              border border-white/10 hover:border-white/20
              text-white/70 hover:text-white
              transition-all duration-200
            "
            type="button"
          >
            {showQR ? 'Hide QR code' : 'Show QR code'}
          </button>

          {/* QR code placeholder */}
          {showQR && (
            <div className="p-8 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm">
              <div className="w-48 h-48 mx-auto bg-white/10 rounded-lg flex items-center justify-center">
                <p className="text-xs text-white/40 text-center px-4">
                  QR code generation<br />coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      {connectionCode && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-xs text-white/40 bg-black">or</span>
          </div>
        </div>
      )}

      {/* Enter code section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/70">Enter a code to connect</h3>

        <div className="flex gap-2">
          <div className="flex-1">
            <input
              ref={codeInputRef}
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="XXXX-XXXX-XXXX"
              disabled={isConnecting || isConnected}
              className="
                w-full px-4 py-3 rounded-md
                bg-white/5 border border-white/20
                text-white placeholder-white/30
                focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                font-mono text-lg
              "
              maxLength={14}
            />
          </div>

          <button
            onClick={handleConnect}
            disabled={!inputCode.trim() || isConnecting || isConnected}
            className="
              px-6 py-3 rounded-md font-medium
              bg-white text-black
              hover:bg-white/90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              flex-shrink-0
            "
            type="button"
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Connecting...
              </span>
            ) : isConnected ? (
              'Connected'
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </div>

      {/* Generate new code button */}
      {onGenerateCode && (
        <button
          onClick={onGenerateCode}
          className="
            w-full p-3 rounded-md text-sm
            bg-white/5 hover:bg-white/10
            border border-white/10 hover:border-white/20
            text-white/70 hover:text-white
            transition-all duration-200
          "
          type="button"
        >
          Generate new code
        </button>
      )}
    </div>
  );
}
