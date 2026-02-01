'use client';

import { useRef, useState, useCallback } from 'react';

interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

interface SwipeState {
    startX: number;
    startY: number;
    isSwiping: boolean;
}

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity

export function useSwipeGestures(handlers: SwipeHandlers) {
    const [swipeState, setSwipeState] = useState<SwipeState>({
        startX: 0,
        startY: 0,
        isSwiping: false,
    });

    const startTimeRef = useRef<number>(0);

    const handleTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
        const touch = e.touches[0];
        if (!touch) {return;}
        setSwipeState({
            startX: touch.clientX,
            startY: touch.clientY,
            isSwiping: true,
        });
        startTimeRef.current = Date.now();
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent | TouchEvent) => {
        if (!swipeState.isSwiping) {return;}

        const touch = e.changedTouches[0];
        if (!touch) {return;}
        const deltaX = touch.clientX - swipeState.startX;
        const deltaY = touch.clientY - swipeState.startY;
        const deltaTime = Date.now() - startTimeRef.current;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const velocityX = absX / deltaTime;
        const velocityY = absY / deltaTime;

        // Determine if it's a horizontal or vertical swipe
        if (absX > absY && absX > SWIPE_THRESHOLD && velocityX > SWIPE_VELOCITY_THRESHOLD) {
            // Horizontal swipe
            if (deltaX > 0) {
                handlers.onSwipeRight?.();
            } else {
                handlers.onSwipeLeft?.();
            }
        } else if (absY > absX && absY > SWIPE_THRESHOLD && velocityY > SWIPE_VELOCITY_THRESHOLD) {
            // Vertical swipe
            if (deltaY > 0) {
                handlers.onSwipeDown?.();
            } else {
                handlers.onSwipeUp?.();
            }
        }

        setSwipeState(prev => ({ ...prev, isSwiping: false }));
    }, [swipeState, handlers]);

    const handleTouchCancel = useCallback(() => {
        setSwipeState(prev => ({ ...prev, isSwiping: false }));
    }, []);

    // Return props to spread on swipeable element
    const swipeProps = {
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchCancel,
    };

    return { swipeProps, isSwiping: swipeState.isSwiping };
}

/**
 * Hook for swipe-to-dismiss functionality
 */
export function useSwipeToDismiss(onDismiss: () => void, direction: 'left' | 'right' = 'left') {
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (!touch) {return;}
        startXRef.current = touch.clientX;
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) {return;}

        const touch = e.touches[0];
        if (!touch) {return;}
        const currentX = touch.clientX;
        const delta = currentX - startXRef.current;

        // Only allow swipe in the specified direction
        if (direction === 'left' && delta < 0) {
            setOffset(delta);
        } else if (direction === 'right' && delta > 0) {
            setOffset(delta);
        }
    }, [isDragging, direction]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);

        const threshold = 100;
        if (Math.abs(offset) > threshold) {
            onDismiss();
        }
        setOffset(0);
    }, [offset, onDismiss]);

    const dismissProps = {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        style: {
            transform: `translateX(${offset}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        },
    };

    return { dismissProps, offset, isDragging };
}

/**
 * Hook for swipe navigation between tabs/pages
 */
export function useSwipeNavigation(
    currentIndex: number,
    totalItems: number,
    onNavigate: (index: number) => void
) {
    const { swipeProps } = useSwipeGestures({
        onSwipeLeft: () => {
            if (currentIndex < totalItems - 1) {
                onNavigate(currentIndex + 1);
            }
        },
        onSwipeRight: () => {
            if (currentIndex > 0) {
                onNavigate(currentIndex - 1);
            }
        },
    });

    return swipeProps;
}
