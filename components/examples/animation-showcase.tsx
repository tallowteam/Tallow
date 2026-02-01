'use client';

/**
 * Animation Showcase Component
 * Demonstrates all animation capabilities
 * Use this as a reference for implementing animations
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  DeviceListSkeleton,
  TransferCardSkeleton,
} from '@/components/ui/skeleton';
import {
  AnimatedContainer,
  AnimatedList,
  AnimatedListItem,
  AnimatedCard,
  AnimatedModal,
  AnimatedCollapse,
  AnimatedBadge,
} from '@/lib/animations/animated-components';
import { PageTransition } from '@/lib/animations/page-transition';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { Zap, Star, Check } from 'lucide-react';

export function AnimationShowcase() {
  const [showModal, setShowModal] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageTransition className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <AnimatedContainer variant="fadeUp">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Animation Showcase</h1>
          <p className="text-muted-foreground">
            Demonstrating smooth 60fps animations with accessibility support
          </p>
          {prefersReducedMotion && (
            <Badge variant="outline" className="bg-yellow-500/10">
              Reduced Motion Enabled
            </Badge>
          )}
        </div>
      </AnimatedContainer>

      {/* Basic Animations */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Basic Animations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatedContainer variant="fade" delay={0.1}>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Fade</h3>
              <p className="text-sm text-muted-foreground">
                Simple opacity transition
              </p>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer variant="fadeUp" delay={0.2}>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Fade Up</h3>
              <p className="text-sm text-muted-foreground">
                Fade with slide from bottom
              </p>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer variant="scale" delay={0.3}>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Scale</h3>
              <p className="text-sm text-muted-foreground">
                Zoom in animation
              </p>
            </Card>
          </AnimatedContainer>
        </div>
      </section>

      {/* Interactive Cards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Interactive Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedCard hoverEffect className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Hover Me</h3>
                <p className="text-sm text-muted-foreground">
                  Card lifts on hover
                </p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard hoverEffect className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Click Me</h3>
                <p className="text-sm text-muted-foreground">
                  Tap for feedback
                </p>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* Staggered List */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Staggered Animations</h2>
        <AnimatedList>
          {[1, 2, 3, 4].map((item) => (
            <AnimatedListItem key={item}>
              <Card className="p-4 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      {item}
                    </div>
                    <div>
                      <h4 className="font-semibold">Item {item}</h4>
                      <p className="text-sm text-muted-foreground">
                        Stagger delay: {item * 50}ms
                      </p>
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              </Card>
            </AnimatedListItem>
          ))}
        </AnimatedList>
      </section>

      {/* Modal Example */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Modal Animation</h2>
        <Button onClick={() => setShowModal(true)}>Open Modal</Button>
        <AnimatedModal isOpen={showModal} onClose={() => setShowModal(false)}>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Animated Modal</h3>
            <p className="text-muted-foreground mb-6">
              This modal appears with a smooth scale and fade animation.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button onClick={() => setShowModal(false)}>Confirm</Button>
            </div>
          </div>
        </AnimatedModal>
      </section>

      {/* Collapse Animation */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Collapse Animation</h2>
        <Card className="p-6">
          <Button onClick={() => setIsExpanded(!isExpanded)} className="mb-4">
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
          <AnimatedCollapse isOpen={isExpanded}>
            <div className="space-y-2 pt-4 border-t">
              <p className="text-muted-foreground">
                This content smoothly expands and collapses with automatic height
                calculation.
              </p>
              <p className="text-muted-foreground">
                The animation respects the user's reduced motion preferences.
              </p>
            </div>
          </AnimatedCollapse>
        </Card>
      </section>

      {/* Badge Animation */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Badge Animation</h2>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowBadge(!showBadge)}>
            Toggle Badge
          </Button>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <AnimatedBadge
              show={showBadge}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
            >
              3
            </AnimatedBadge>
          </div>
        </div>
      </section>

      {/* Loading States */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Skeleton Loading States</h2>
        <div className="space-y-4">
          <Button onClick={() => setIsLoading(!isLoading)}>
            {isLoading ? 'Hide' : 'Show'} Loading State
          </Button>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Device List Skeleton</h3>
                    <DeviceListSkeleton count={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Transfer Card Skeleton</h3>
                    <TransferCardSkeleton count={1} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="p-6">
                  <p className="text-muted-foreground">
                    Click the button above to see skeleton loading states
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Custom Skeleton Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Custom Skeletons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Profile Card</h3>
            <div className="flex items-center gap-4">
              <SkeletonAvatar width={60} height={60} />
              <div className="flex-1 space-y-2">
                <SkeletonText className="w-3/4" />
                <SkeletonText className="w-1/2" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Content Block</h3>
            <div className="space-y-3">
              <Skeleton height={100} />
              <div className="space-y-2">
                <SkeletonText />
                <SkeletonText className="w-5/6" />
                <SkeletonText className="w-4/6" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Performance Note */}
      <AnimatedContainer variant="fadeUp">
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex gap-3">
            <Zap className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Performance Optimized</h3>
              <p className="text-sm text-muted-foreground">
                All animations are optimized for 60fps using GPU-accelerated
                transforms and opacity. They automatically respect the user's
                reduced motion preferences for accessibility.
              </p>
            </div>
          </div>
        </Card>
      </AnimatedContainer>
    </PageTransition>
  );
}

export default AnimationShowcase;
