'use client';

/**
 * @fileoverview Custom hook for managing file requests between peers
 * @module hooks/use-file-request
 */

import { useState, useCallback, useRef } from 'react';
import { generateUUID } from '@/lib/utils/uuid';
import secureLog from '@/lib/utils/secure-logger';
import { isObject, hasProperty, isString } from '../types/type-guards';

/**
 * File Request Message Structure
 */
export interface FileRequestMessage {
  type: 'file-request';
  id: string;
  from: string;
  fromName: string;
  fileName?: string;
  fileType?: string;
  message?: string;
  timestamp: number;
}

/**
 * File Request Response Message
 */
interface FileRequestResponseMessage {
  type: 'file-request-response';
  requestId: string;
  accepted: boolean;
}

/**
 * Pending file request
 */
export interface PendingFileRequest {
  id: string;
  from: string;
  fromName: string;
  fileName?: string;
  fileType?: string;
  message?: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

/**
 * Type guard for FileRequestMessage
 */
function isFileRequestMessage(value: unknown): value is FileRequestMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'type') && value['type'] === 'file-request' &&
    hasProperty(value, 'id') && isString(value['id']) &&
    hasProperty(value, 'from') && isString(value['from']) &&
    hasProperty(value, 'fromName') && isString(value['fromName']) &&
    hasProperty(value, 'timestamp') && typeof value['timestamp'] === 'number'
  );
}

/**
 * Type guard for FileRequestResponseMessage
 */
function isFileRequestResponseMessage(value: unknown): value is FileRequestResponseMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'type') && value['type'] === 'file-request-response' &&
    hasProperty(value, 'requestId') && isString(value['requestId']) &&
    hasProperty(value, 'accepted') && typeof value['accepted'] === 'boolean'
  );
}

export interface FileRequestOptions {
  currentUserId: string;
  currentUserName: string;
  dataChannel: RTCDataChannel | null;
  onFileSelected?: (file: File, requestId: string) => void;
  onRequestAccepted?: (requestId: string) => void;
  onRequestRejected?: (requestId: string) => void;
}

/**
 * Custom hook for managing file requests between peers
 *
 * Provides functionality to:
 * - Request files from connected peers
 * - Handle incoming file requests
 * - Accept/reject file requests
 * - Manage pending requests
 *
 * @example
 * ```tsx
 * const {
 *   pendingRequests,
 *   outgoingRequests,
 *   requestFile,
 *   acceptRequest,
 *   rejectRequest,
 *   cancelRequest
 * } = useFileRequest({
 *   currentUserId: 'user-123',
 *   currentUserName: 'Alice',
 *   dataChannel: channel,
 *   onFileSelected: (file, requestId) => {
 *     // Send the file in response to the request
 *   }
 * });
 * ```
 */
export function useFileRequest({
  currentUserId,
  currentUserName,
  dataChannel,
  onFileSelected,
  onRequestAccepted,
  onRequestRejected,
}: FileRequestOptions) {
  const [pendingRequests, setPendingRequests] = useState<PendingFileRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<PendingFileRequest[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingRequestIdRef = useRef<string | null>(null);

  /**
   * Handle incoming messages from data channel
   */
  const handleMessage = useCallback((data: string | ArrayBuffer) => {
    if (typeof data !== 'string') {
      return;
    }

    try {
      const message = JSON.parse(data);

      if (isFileRequestMessage(message)) {
        // Received a file request from peer
        secureLog.log('Received file request:', message.id);

        const request: PendingFileRequest = {
          id: message.id,
          from: message.from,
          fromName: message.fromName,
          ...(message.fileName !== null && message.fileName !== undefined && { fileName: message.fileName }),
          ...(message.fileType !== null && message.fileType !== undefined && { fileType: message.fileType }),
          ...(message.message !== null && message.message !== undefined && { message: message.message }),
          timestamp: message.timestamp,
          status: 'pending' as const,
        };

        setPendingRequests(prev => [...prev, request]);
      } else if (isFileRequestResponseMessage(message)) {
        // Received a response to our request
        secureLog.log('Received file request response:', message.requestId, message.accepted);

        setOutgoingRequests(prev =>
          prev.map(req =>
            req.id === message.requestId
              ? { ...req, status: message.accepted ? 'accepted' : 'rejected' }
              : req
          )
        );

        if (message.accepted) {
          onRequestAccepted?.(message.requestId);
        } else {
          onRequestRejected?.(message.requestId);
        }
      }
    } catch (error) {
      secureLog.error('Failed to parse file request message:', error);
    }
  }, [onRequestAccepted, onRequestRejected]);

  /**
   * Request a file from the connected peer
   */
  const requestFile = useCallback(
    (fileName?: string, fileType?: string, message?: string) => {
      if (!dataChannel || dataChannel.readyState !== 'open') {
        throw new Error('Data channel not ready');
      }

      const requestId = generateUUID();
      const request: FileRequestMessage = {
        type: 'file-request',
        id: requestId,
        from: currentUserId,
        fromName: currentUserName,
        ...(fileName !== null && fileName !== undefined && { fileName }),
        ...(fileType !== null && fileType !== undefined && { fileType }),
        ...(message !== null && message !== undefined && { message }),
        timestamp: Date.now(),
      };

      // Send request
      dataChannel.send(JSON.stringify(request));
      secureLog.log('Sent file request:', requestId);

      // Track outgoing request
      const outgoingRequest: PendingFileRequest = {
        id: requestId,
        from: currentUserId,
        fromName: currentUserName,
        ...(fileName !== null && fileName !== undefined && { fileName }),
        ...(fileType !== null && fileType !== undefined && { fileType }),
        ...(message !== null && message !== undefined && { message }),
        timestamp: Date.now(),
        status: 'pending' as const,
      };

      setOutgoingRequests(prev => [...prev, outgoingRequest]);

      return requestId;
    },
    [dataChannel, currentUserId, currentUserName]
  );

  /**
   * Accept a file request and open file picker
   */
  const acceptRequest = useCallback(
    (requestId: string) => {
      const request = pendingRequests.find(req => req.id === requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      if (!dataChannel || dataChannel.readyState !== 'open') {
        throw new Error('Data channel not ready');
      }

      // Update request status
      setPendingRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'accepted' } : req
        )
      );

      // Send acceptance response
      const response: FileRequestResponseMessage = {
        type: 'file-request-response',
        requestId,
        accepted: true,
      };

      dataChannel.send(JSON.stringify(response));
      secureLog.log('Accepted file request:', requestId);

      // Open file picker
      pendingRequestIdRef.current = requestId;

      // Create file input if it doesn't exist
      if (!fileInputRef.current) {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';

        // Apply file type filter if specified
        if (request.fileType) {
          input.accept = request.fileType;
        }

        input.onchange = (e) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          const reqId = pendingRequestIdRef.current;

          if (file && reqId) {
            onFileSelected?.(file, reqId);

            // Clean up request
            setPendingRequests(prev => prev.filter(req => req.id !== reqId));
          }

          pendingRequestIdRef.current = null;
          target.value = ''; // Reset input
        };

        document.body.appendChild(input);
        fileInputRef.current = input;
      } else {
        // Update accept attribute if file type changed
        if (request.fileType) {
          fileInputRef.current.accept = request.fileType;
        } else {
          fileInputRef.current.accept = '';
        }
      }

      // Trigger file picker
      fileInputRef.current.click();
    },
    [pendingRequests, dataChannel, onFileSelected]
  );

  /**
   * Reject a file request
   */
  const rejectRequest = useCallback(
    (requestId: string) => {
      if (!dataChannel || dataChannel.readyState !== 'open') {
        throw new Error('Data channel not ready');
      }

      // Update request status
      setPendingRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'rejected' } : req
        )
      );

      // Send rejection response
      const response: FileRequestResponseMessage = {
        type: 'file-request-response',
        requestId,
        accepted: false,
      };

      dataChannel.send(JSON.stringify(response));
      secureLog.log('Rejected file request:', requestId);

      // Remove from pending after a short delay
      setTimeout(() => {
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      }, 2000);
    },
    [dataChannel]
  );

  /**
   * Cancel an outgoing request
   */
  const cancelRequest = useCallback((requestId: string) => {
    setOutgoingRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: 'cancelled' } : req
      )
    );

    // Remove from outgoing after a short delay
    setTimeout(() => {
      setOutgoingRequests(prev => prev.filter(req => req.id !== requestId));
    }, 2000);
  }, []);

  /**
   * Clear all completed requests (accepted, rejected, cancelled)
   */
  const clearCompletedRequests = useCallback(() => {
    setPendingRequests(prev =>
      prev.filter(req => req.status === 'pending')
    );
    setOutgoingRequests(prev =>
      prev.filter(req => req.status === 'pending')
    );
  }, []);

  return {
    pendingRequests,
    outgoingRequests,
    requestFile,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    clearCompletedRequests,
    handleMessage,
  };
}

export default useFileRequest;
