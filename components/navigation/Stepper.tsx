'use client';

import React from 'react';

export interface Step {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  orientation?: 'horizontal' | 'vertical';
  allowClickNavigation?: boolean;
  className?: string;
}

/**
 * Stepper - Step indicator component
 *
 * Features:
 * - Horizontal/vertical orientation
 * - Completed/active/upcoming states
 * - Click to navigate (optional)
 * - Description per step
 * - Custom icons
 * - Animated transitions
 * - ARIA compliant
 *
 * @example
 * ```tsx
 * <Stepper
 *   steps={[
 *     { id: '1', label: 'Account', description: 'Create your account' },
 *     { id: '2', label: 'Profile', description: 'Complete your profile' },
 *     { id: '3', label: 'Done', description: 'Start using the app' }
 *   ]}
 *   currentStep={1}
 *   onStepClick={(index) => setCurrentStep(index)}
 *   allowClickNavigation
 * />
 * ```
 */
export function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = 'horizontal',
  allowClickNavigation = false,
  className = '',
}: StepperProps) {
  const handleStepClick = (index: number) => {
    if (allowClickNavigation && onStepClick) {
      onStepClick(index);
    }
  };

  const getStepState = (index: number): 'completed' | 'active' | 'upcoming' => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'upcoming';
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <nav
      aria-label="Progress"
      className={className}
    >
      <ol
        role="list"
        className={`
          ${isHorizontal
            ? 'flex items-center justify-between'
            : 'flex flex-col space-y-8'
          }
        `}
      >
        {steps.map((step, index) => {
          const state = getStepState(index);
          const isCompleted = state === 'completed';
          const isActive = state === 'active';
          const isUpcoming = state === 'upcoming';
          const isClickable = allowClickNavigation && isCompleted;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={`
                relative
                ${isHorizontal ? 'flex-1' : 'flex items-start'}
              `}
            >
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`
                    absolute
                    ${isHorizontal
                      ? 'top-5 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5'
                      : 'top-12 left-5 bottom-0 w-0.5'
                    }
                    ${isCompleted || isActive
                      ? 'bg-white'
                      : 'bg-zinc-800'
                    }
                    transition-colors duration-300
                  `}
                  aria-hidden="true"
                />
              )}

              {/* Step content */}
              <button
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                aria-current={isActive ? 'step' : undefined}
                className={`
                  group flex items-start gap-4 text-left
                  ${isHorizontal ? 'flex-col items-center' : 'flex-row'}
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg
                  ${isClickable ? 'hover:opacity-80 transition-opacity' : ''}
                `}
              >
                {/* Step indicator */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${isCompleted
                        ? 'bg-white text-black'
                        : isActive
                        ? 'bg-white text-black ring-4 ring-white/20'
                        : 'bg-zinc-900 text-zinc-500 border-2 border-zinc-800'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : step.icon ? (
                      <span className="w-5 h-5">{step.icon}</span>
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                </div>

                {/* Step text */}
                <div
                  className={`
                    ${isHorizontal ? 'text-center' : 'flex-1 pt-1'}
                    min-w-0
                  `}
                >
                  <p
                    className={`
                      text-sm font-medium transition-colors duration-300
                      ${isCompleted || isActive
                        ? 'text-white'
                        : 'text-zinc-500'
                      }
                    `}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p
                      className={`
                        mt-1 text-xs transition-colors duration-300
                        ${isActive
                          ? 'text-zinc-400'
                          : 'text-zinc-600'
                        }
                      `}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
