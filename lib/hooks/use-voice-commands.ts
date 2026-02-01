/**
 * React hook for Web Speech API voice commands
 * Privacy-conscious with user control and visual feedback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { announce } from '@/lib/utils/accessibility';
import { error } from '@/lib/utils/secure-logger';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
}

interface UseVoiceCommandsOptions {
  enabled?: boolean;
  language?: string;
  continuous?: boolean;
  onListeningChange?: (isListening: boolean) => void;
  onError?: (error: string) => void;
}

export function useVoiceCommands(
  commands: VoiceCommand[],
  options: UseVoiceCommandsOptions = {}
) {
  const {
    enabled = false,
    language = 'en-US',
    continuous = false,
    onListeningChange,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognitionAPI();
    }
  }, []);

  // Process recognized speech
  const processCommand = useCallback(
    (text: string) => {
      const normalizedText = text.toLowerCase().trim();
      setTranscript(normalizedText);

      // Clear transcript after 3 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setTranscript('');
      }, 3000);

      // Check for matching commands
      for (const cmd of commands) {
        const commandVariants = cmd.command.split('|').map(c => c.trim().toLowerCase());
        if (commandVariants.some(variant => normalizedText.includes(variant))) {
          announce(`Executing: ${cmd.description}`, 'polite');
          cmd.action();
          return;
        }
      }

      // No matching command
      announce('Command not recognized. Say "help" for available commands.', 'polite');
    },
    [commands]
  );

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || permissionDenied) {
      return;
    }

    try {
      const recognition = recognitionRef.current;

      recognition.continuous = continuous;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        onListeningChange?.(true);
        announce('Voice commands active. Listening...', 'polite');
      };

      recognition.onend = () => {
        setIsListening(false);
        onListeningChange?.(false);
        if (continuous && enabled) {
          // Auto-restart if continuous mode
          try {
            recognition.start();
          } catch (err) {
            error('Failed to restart recognition:', err);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        error('Speech recognition error:', event.error);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setPermissionDenied(true);
          announce('Microphone permission denied. Please enable in browser settings.', 'assertive');
          onError?.('Permission denied');
        } else if (event.error === 'no-speech') {
          announce('No speech detected. Please try again.', 'polite');
        } else if (event.error === 'network') {
          announce('Network error. Voice commands unavailable.', 'assertive');
          onError?.('Network error');
        } else {
          onError?.(event.error);
        }

        setIsListening(false);
        onListeningChange?.(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        const lastResult = results[results.length - 1];

        if (lastResult && lastResult.isFinal) {
          const alternative = lastResult[0];
          if (alternative) {
            const text = alternative.transcript;
            processCommand(text);
          }
        }
      };

      recognition.start();
    } catch (err) {
      error('Failed to start recognition:', err);
      setIsListening(false);
      onListeningChange?.(false);
      onError?.('Failed to start');
    }
  }, [isSupported, continuous, language, enabled, permissionDenied, processCommand, onListeningChange, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      onListeningChange?.(false);
      announce('Voice commands deactivated', 'polite');
    }
  }, [isListening, onListeningChange]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled && !isListening) {
      startListening();
    } else if (!enabled && isListening) {
      stopListening();
    }
  }, [enabled]); // Intentionally excluding isListening to avoid loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  return {
    isSupported,
    isListening,
    permissionDenied,
    transcript,
    startListening,
    stopListening,
    toggleListening,
  };
}
