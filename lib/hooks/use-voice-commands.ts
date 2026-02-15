'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface VoiceCommandsWindow {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

export interface UseVoiceCommandsOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  commands?: Record<string, () => void>;
}

export interface UseVoiceCommandsReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceCommands(
  options: UseVoiceCommandsOptions = {}
): UseVoiceCommandsReturn {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = false,
    commands = {},
  } = options;

  const recognitionCtor = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const speechWindow = window as unknown as VoiceCommandsWindow;
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  }, []);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionCtor) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = new recognitionCtor();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event) => {
      const lastIndex = event.results.length - 1;
      const result = event.results[lastIndex];
      const alternative = result?.[0];

      if (!alternative) {
        return;
      }

      const nextTranscript = alternative.transcript.trim();
      setTranscript(nextTranscript);
      setConfidence(alternative.confidence ?? 0);
      setError(null);

      const normalized = nextTranscript.toLowerCase();
      for (const [phrase, handler] of Object.entries(commands)) {
        if (normalized.includes(phrase.toLowerCase())) {
          handler();
        }
      }
    };

    recognition.onerror = (evt) => {
      setError(evt.error ?? 'speech-recognition-error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setError(null);
    setIsListening(true);
    recognition.start();
  }, [recognitionCtor, language, continuous, interimResults, commands]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isSupported: recognitionCtor !== null,
    isListening,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
