/**
 * Voice Commands Component
 * Provides voice control interface with visual feedback and privacy controls
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mic,
  MicOff,
  Volume2,
  HelpCircle,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { useVoiceCommands, VoiceCommand } from '@/lib/hooks/use-voice-commands';
import { toast } from 'sonner';

interface VoiceCommandsProps {
  onSendFile?: () => void;
  onReceiveFile?: () => void;
  onConnectDevice?: (deviceName?: string) => void;
  onShowSettings?: () => void;
  onShowHelp?: () => void;
}

export function VoiceCommands({
  onSendFile,
  onReceiveFile,
  onConnectDevice,
  onShowSettings,
  onShowHelp: _onShowHelp,
}: VoiceCommandsProps) {
  const [enabled, setEnabled] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const storedEnabled = localStorage.getItem('tallow_voice_commands_enabled');
    const storedFeedback = localStorage.getItem('tallow_voice_feedback_enabled');

    if (storedEnabled !== null) {
      setEnabled(storedEnabled === 'true');
    }
    if (storedFeedback !== null) {
      setVoiceFeedback(storedFeedback === 'true');
    }
  }, []);

  // Text-to-speech for voice feedback
  const speak = useCallback((text: string) => {
    if (!voiceFeedback || typeof window === 'undefined') {return;}

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  }, [voiceFeedback]);

  // Define available commands
  const commands: VoiceCommand[] = [
    {
      command: 'send file|upload|send',
      description: 'Send a file',
      action: () => {
        onSendFile?.();
        speak('Opening file sender');
      },
    },
    {
      command: 'receive file|download|receive',
      description: 'Receive a file',
      action: () => {
        onReceiveFile?.();
        speak('Ready to receive files');
      },
    },
    {
      command: 'connect|connect to device',
      description: 'Connect to a device',
      action: () => {
        onConnectDevice?.();
        speak('Opening device connection');
      },
    },
    {
      command: 'settings|show settings|open settings',
      description: 'Open settings',
      action: () => {
        onShowSettings?.();
        speak('Opening settings');
      },
    },
    {
      command: 'help|what can I say|commands',
      description: 'Show available commands',
      action: () => {
        setShowHelp(true);
        speak('Showing available voice commands');
      },
    },
    {
      command: 'stop listening|stop|deactivate',
      description: 'Stop voice commands',
      action: () => {
        handleToggle();
        speak('Voice commands deactivated');
      },
    },
  ];

  const {
    isSupported,
    isListening,
    permissionDenied,
    transcript,
    toggleListening,
  } = useVoiceCommands(commands, {
    enabled,
    continuous: false,
    onListeningChange: (listening) => {
      if (listening) {
        speak('Listening');
      }
    },
    onError: (error) => {
      if (error === 'Permission denied') {
        setShowPermissionDialog(true);
      } else {
        toast.error(`Voice command error: ${error}`);
      }
    },
  });

  const handleToggle = useCallback(() => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    localStorage.setItem('tallow_voice_commands_enabled', String(newEnabled));

    if (newEnabled) {
      toast.success('Voice commands enabled');
    } else {
      toast.info('Voice commands disabled');
    }
  }, [enabled]);

  const handleVoiceFeedbackToggle = useCallback((checked: boolean) => {
    setVoiceFeedback(checked);
    localStorage.setItem('tallow_voice_feedback_enabled', String(checked));
    toast.success(checked ? 'Voice feedback enabled' : 'Voice feedback disabled');
  }, []);

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Voice Control Button */}
      <div className="fixed bottom-20 right-6 z-40 flex flex-col items-end gap-3">
        {/* Listening Indicator */}
        {isListening && (
          <Card className="px-4 py-2 bg-accent text-accent-foreground shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent-foreground rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                {transcript || 'Listening...'}
              </span>
            </div>
          </Card>
        )}

        {/* Main Button */}
        <Button
          size="lg"
          variant={enabled ? 'default' : 'outline'}
          onClick={toggleListening}
          disabled={permissionDenied}
          className={`h-14 w-14 rounded-full shadow-lg transition-all ${
            isListening ? 'animate-pulse ring-4 ring-accent ring-offset-2' : ''
          }`}
          aria-label={enabled ? 'Voice commands active' : 'Activate voice commands'}
          title={enabled ? 'Click to speak' : 'Enable voice commands'}
        >
          {enabled ? (
            <Mic className="w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </Button>

        {/* Help Button */}
        {enabled && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHelp(true)}
            className="h-10 w-10 rounded-full"
            aria-label="Show voice command help"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Commands
            </DialogTitle>
            <DialogDescription>
              Say any of these commands while the microphone is active
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Commands List */}
            <div className="space-y-2">
              {commands.map((cmd, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-secondary/50 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <code className="text-sm font-mono">
                      {cmd.command.split('|')[0]}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    {cmd.description}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Voice Feedback</span>
                </div>
                <Switch
                  checked={voiceFeedback}
                  onCheckedChange={handleVoiceFeedbackToggle}
                  aria-label="Toggle voice feedback"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  <span className="text-sm font-medium">Voice Commands</span>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={handleToggle}
                  aria-label="Toggle voice commands"
                />
              </div>
            </div>

            <Separator />

            {/* Privacy Notice */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Privacy First</p>
                  <p className="text-xs text-muted-foreground">
                    Voice commands are processed locally in your browser. No audio
                    is sent to external servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Click the microphone button to start listening</p>
              <p>• Speak clearly and wait for the command to execute</p>
              <p>• The microphone will automatically stop after each command</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permission Denied Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Microphone Permission Required
            </DialogTitle>
            <DialogDescription>
              Voice commands need access to your microphone
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-muted-foreground">
                To use voice commands, you need to grant microphone permission in
                your browser settings. This allows the app to listen for voice
                commands.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">How to enable:</p>
              <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Find the microphone permission setting</li>
                <li>Change it to "Allow"</li>
                <li>Reload the page and try again</li>
              </ol>
            </div>

            <Button
              onClick={() => {
                setShowPermissionDialog(false);
                setEnabled(false);
              }}
              className="w-full"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Settings panel component for voice commands
 * To be integrated into the settings page
 */
export function VoiceCommandsSettings() {
  const [enabled, setEnabled] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [_showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const storedEnabled = localStorage.getItem('tallow_voice_commands_enabled');
    const storedFeedback = localStorage.getItem('tallow_voice_feedback_enabled');

    if (storedEnabled !== null) {
      setEnabled(storedEnabled === 'true');
    }
    if (storedFeedback !== null) {
      setVoiceFeedback(storedFeedback === 'true');
    }
  }, []);

  const handleToggle = useCallback((checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem('tallow_voice_commands_enabled', String(checked));
    toast.success(checked ? 'Voice commands enabled' : 'Voice commands disabled');
  }, []);

  const handleVoiceFeedbackToggle = useCallback((checked: boolean) => {
    setVoiceFeedback(checked);
    localStorage.setItem('tallow_voice_feedback_enabled', String(checked));
    toast.success(checked ? 'Voice feedback enabled' : 'Voice feedback disabled');
  }, []);

  // Check browser support
  const isSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!isSupported) {
    return (
      <div className="p-4 rounded-lg bg-muted border border-border">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-sm">Voice Commands Unavailable</p>
            <p className="text-xs text-muted-foreground">
              Your browser does not support the Web Speech API. Try using Chrome, Edge, or Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Enable voice commands</p>
          <p className="text-sm text-muted-foreground">
            Control the app with your voice
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          aria-label="Toggle voice commands"
        />
      </div>

      {enabled && (
        <>
          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Voice feedback</p>
              <p className="text-sm text-muted-foreground">
                Speak confirmations for commands
              </p>
            </div>
            <Switch
              checked={voiceFeedback}
              onCheckedChange={handleVoiceFeedbackToggle}
              aria-label="Toggle voice feedback"
            />
          </div>

          <Separator />

          <Button
            variant="outline"
            onClick={() => setShowHelp(true)}
            className="w-full"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            View Available Commands
          </Button>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-sm">Privacy Notice</p>
                <p className="text-xs text-muted-foreground">
                  Voice commands are processed locally in your browser. No audio is
                  sent to external servers.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
