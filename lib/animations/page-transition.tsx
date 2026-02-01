'use client';

/**
 * Page Transition Component
 * Provides smooth transitions between pages
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { pageTransitionVariants } from './motion-config';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Page Transition Wrapper
 * Wrap your page content with this to enable smooth transitions
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageTransitionVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Layout Transition
 * For animated layout changes within a page
 */
export function LayoutTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
