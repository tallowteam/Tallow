'use client';

/**
 * Interactive Tutorial Component
 * 5-step onboarding for first-time users
 * Includes feature tour, tooltips, and navigation
 */

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  illustration?: React.ReactNode;
  targetElement?: string; // CSS selector for element to highlight
}

const DEFAULT_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Tallow',
    description:
      'Tallow is a secure, privacy-first file transfer app with quantum-resistant encryption. Transfer files directly between devices without going through any servers.',
  },
  {
    id: 'select-files',
    title: 'Select Your Files',
    description:
      'Drag & drop files, use the file selector, or capture photos/videos directly. Supports individual files, folders, and even screen sharing.',
    targetElement: '[data-tutorial="file-selector"]',
  },
  {
    id: 'connect',
    title: 'Connect to a Device',
    description:
      'Connect via QR code, share a link, add friends, or connect to your own devices. All connections are peer-to-peer and end-to-end encrypted.',
    targetElement: '[data-tutorial="connection-method"]',
  },
  {
    id: 'security',
    title: 'Your Privacy Matters',
    description:
      'Files are encrypted with ML-KEM-768 (Kyber) quantum-resistant encryption. Metadata is stripped, and no data touches our servers. You can also enable onion routing for maximum privacy.',
    targetElement: '[data-tutorial="security-badge"]',
  },
  {
    id: 'transfer',
    title: 'Start Transferring',
    description:
      'Click "Send" to begin. Monitor progress, pause/resume transfers, and enjoy unlimited file sizes with no compromises on security.',
    targetElement: '[data-tutorial="send-button"]',
  },
];

export interface InteractiveTutorialProps {
  /** Custom tutorial steps (defaults to DEFAULT_STEPS) */
  steps?: TutorialStep[];
  /** Callback when tutorial is completed */
  onComplete?: () => void;
  /** Callback when tutorial is skipped */
  onSkip?: () => void;
  /** Force show tutorial (ignores localStorage check) */
  forceShow?: boolean;
  /** Local storage key for tracking completion */
  storageKey?: string;
}

export function InteractiveTutorial({
  steps = DEFAULT_STEPS,
  onComplete,
  onSkip,
  forceShow = false,
  storageKey = 'tallow_tutorial_completed',
}: InteractiveTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  // Check if tutorial should be shown
  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      return undefined;
    }

    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(storageKey);
      if (!completed) {
        // Delay to let the page render
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [forceShow, storageKey]);

  // Handle element highlighting
  useEffect(() => {
    if (!isOpen) {
      if (highlightedElement) {
        highlightedElement.style.removeProperty('outline');
        highlightedElement.style.removeProperty('outline-offset');
        highlightedElement.style.removeProperty('z-index');
        highlightedElement.style.removeProperty('position');
        setHighlightedElement(null);
      }
      return;
    }

    const step = steps[currentStep];
    if (step?.targetElement) {
      const element = document.querySelector(step.targetElement) as HTMLElement;
      if (element) {
        // Remove previous highlight
        if (highlightedElement && highlightedElement !== element) {
          highlightedElement.style.removeProperty('outline');
          highlightedElement.style.removeProperty('outline-offset');
          highlightedElement.style.removeProperty('z-index');
          highlightedElement.style.removeProperty('position');
        }

        // Add new highlight
        element.style.outline = '3px solid hsl(var(--primary))';
        element.style.outlineOffset = '4px';
        element.style.zIndex = '9999';
        element.style.position = 'relative';
        setHighlightedElement(element);

        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (highlightedElement) {
      // Clear highlight if no target
      highlightedElement.style.removeProperty('outline');
      highlightedElement.style.removeProperty('outline-offset');
      highlightedElement.style.removeProperty('z-index');
      highlightedElement.style.removeProperty('position');
      setHighlightedElement(null);
    }
  }, [currentStep, isOpen, steps, highlightedElement]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    markAsCompleted();
    setIsOpen(false);
    onSkip?.();
  };

  const handleComplete = () => {
    markAsCompleted();
    setIsOpen(false);
    onComplete?.();
  };

  const markAsCompleted = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
  };

  const handleClose = () => {
    if (highlightedElement) {
      highlightedElement.style.removeProperty('outline');
      highlightedElement.style.removeProperty('outline-offset');
      highlightedElement.style.removeProperty('z-index');
      highlightedElement.style.removeProperty('position');
      setHighlightedElement(null);
    }
    handleSkip();
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  if (!step) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">{step.title}</DialogTitle>
              <DialogDescription className="mt-2 text-base">
                {step.description}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6 rounded-full"
              aria-label="Close tutorial"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Illustration placeholder */}
        {step.illustration && (
          <div className="my-6 flex justify-center">{step.illustration}</div>
        )}

        {/* Progress indicator */}
        <div className="mb-4 flex items-center justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-primary'
                  : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
              }`}
              aria-label={`Step ${index + 1} of ${steps.length}`}
            />
          ))}
        </div>

        {/* Step counter */}
        <p className="text-center text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </p>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip Tutorial
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button onClick={handleNext} className="gap-2">
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4" />
                  Done
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Reset tutorial completion (for testing or re-onboarding)
 */
export function resetTutorial(storageKey: string = 'tallow_tutorial_completed') {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(storageKey);
  }
}
