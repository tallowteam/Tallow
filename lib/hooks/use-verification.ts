'use client';

import { useState, useCallback } from 'react';
import {
    SASResult,
    VerificationSession,
    VerificationStatus,
    createVerificationSession,
    markSessionVerified,
    markSessionFailed,
    markSessionSkipped,
    isPeerVerified,
    getVerificationForPeer,
} from '@/lib/crypto/peer-authentication';

interface UseVerificationOptions {
    onVerified?: (session: VerificationSession) => void;
    onFailed?: (session: VerificationSession) => void;
    onSkipped?: (session: VerificationSession) => void;
}

export function useVerification(options: UseVerificationOptions = {}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentSession, setCurrentSession] = useState<VerificationSession | null>(null);
    const [peerName, setPeerName] = useState('');

    /**
     * Start verification for a peer
     */
    const startVerification = useCallback((
        peerId: string,
        name: string,
        sharedSecret: Uint8Array
    ) => {
        // Check if already verified
        const existing = getVerificationForPeer(peerId);
        if (existing) {
            // Already verified, optionally notify
            return existing;
        }

        const session = createVerificationSession(peerId, name, sharedSecret);
        setCurrentSession(session);
        setPeerName(name);
        setIsDialogOpen(true);

        return session;
    }, []);

    /**
     * Handle verification confirmed
     */
    const handleVerified = useCallback(() => {
        if (currentSession) {
            markSessionVerified(currentSession.id);
            const updatedSession = { ...currentSession, status: 'verified' as VerificationStatus };
            setCurrentSession(updatedSession);
            options.onVerified?.(updatedSession);
        }
        setIsDialogOpen(false);
    }, [currentSession, options]);

    /**
     * Handle verification failed
     */
    const handleFailed = useCallback(() => {
        if (currentSession) {
            markSessionFailed(currentSession.id);
            const updatedSession = { ...currentSession, status: 'failed' as VerificationStatus };
            setCurrentSession(updatedSession);
            options.onFailed?.(updatedSession);
        }
        setIsDialogOpen(false);
    }, [currentSession, options]);

    /**
     * Handle verification skipped
     */
    const handleSkipped = useCallback(() => {
        if (currentSession) {
            markSessionSkipped(currentSession.id);
            const updatedSession = { ...currentSession, status: 'skipped' as VerificationStatus };
            setCurrentSession(updatedSession);
            options.onSkipped?.(updatedSession);
        }
        setIsDialogOpen(false);
    }, [currentSession, options]);

    /**
     * Check if a peer is verified
     */
    const checkPeerVerified = useCallback((peerId: string): boolean => {
        return isPeerVerified(peerId);
    }, []);

    /**
     * Get verification status for a peer
     */
    const getPeerVerification = useCallback((peerId: string): VerificationSession | null => {
        return getVerificationForPeer(peerId);
    }, []);

    return {
        // State
        isDialogOpen,
        setIsDialogOpen,
        currentSession,
        peerName,

        // Actions
        startVerification,
        handleVerified,
        handleFailed,
        handleSkipped,

        // Utilities
        checkPeerVerified,
        getPeerVerification,
    };
}

export default useVerification;
