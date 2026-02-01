'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  Shield,
  Users,
  Folder,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // CSS selector for element to highlight
  action?: string; // Action to perform
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Tallow!',
    description: 'The most secure P2P file transfer app. Let\'s get you started with a quick tutorial.',
    icon: <Shield className="w-8 h-8 text-white" />,
  },
  {
    id: 'select-files',
    title: 'Select Files',
    description: 'Click the "Select Files" button to choose files you want to transfer. You can also drag and drop files directly.',
    icon: <Folder className="w-8 h-8 text-green-500" />,
    target: '[data-tutorial="file-selector"]',
  },
  {
    id: 'generate-code',
    title: 'Generate Connection Code',
    description: 'Click "Generate Code" to create a secure connection code. Share this code with your recipient.',
    icon: <Zap className="w-8 h-8 text-yellow-500" />,
    target: '[data-tutorial="generate-code"]',
  },
  {
    id: 'share-code',
    title: 'Share Your Code',
    description: 'Share the generated code with your recipient via any channel. The connection is end-to-end encrypted with post-quantum cryptography.',
    icon: <Users className="w-8 h-8 text-purple-500" />,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'That\'s it! You can now send files securely. Check out Advanced Features for more options like rooms, email fallback, and screen sharing.',
    icon: <Check className="w-8 h-8 text-green-500" />,
  },
];

interface InteractiveTutorialProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function InteractiveTutorial({ onComplete, onSkip }: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Highlight target element
    const step = tutorialSteps[currentStep];
    if (step?.target) {
      const element = document.querySelector(step.target);
      if (element) {
        element.classList.add('tutorial-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Cleanup highlighting on step change
    return () => {
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
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

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('tallow_tutorial_completed', 'true');
    onComplete?.();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('tallow_tutorial_skipped', 'true');
    onSkip?.();
  };

  if (!isVisible) {return null;}

  const step = tutorialSteps[currentStep];
  if (!step) {return null;}

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleSkip}
        />

        {/* Tutorial Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative z-10"
        >
          <Card className="w-full max-w-lg p-8 m-4 shadow-2xl">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4"
              onClick={handleSkip}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              {step.icon}
            </div>

            {/* Content */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">{step.title}</h2>
              <p className="text-muted-foreground">{step.description}</p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 my-6">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-white/20'
                      : 'w-2 bg-gray-300 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button onClick={handleNext}>
                {currentStep === tutorialSteps.length - 1 ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Skip Button */}
            <div className="text-center mt-4">
              <Button variant="link" onClick={handleSkip}>
                Skip Tutorial
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Hook to manage tutorial state
 */
export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Check if tutorial was completed or skipped
    const completed = localStorage.getItem('tallow_tutorial_completed');
    const skipped = localStorage.getItem('tallow_tutorial_skipped');

    if (!completed && !skipped) {
      // Show tutorial after short delay
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const resetTutorial = () => {
    localStorage.removeItem('tallow_tutorial_completed');
    localStorage.removeItem('tallow_tutorial_skipped');
    setShowTutorial(true);
  };

  return {
    showTutorial,
    setShowTutorial,
    resetTutorial,
  };
}
