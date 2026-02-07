'use client';

import { useState, useCallback } from 'react';
import { useFileRequest, type PendingFileRequest } from '@/lib/hooks/use-file-request';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import styles from './FileRequestPanel.module.css';

interface FileRequestPanelProps {
  currentUserId: string;
  currentUserName: string;
  dataChannel: RTCDataChannel | null;
  peerName: string;
  onFileSelected?: (file: File, requestId: string) => void;
  className?: string;
}

/**
 * FileRequestPanel Component
 *
 * Allows users to request specific files from connected peers.
 * Displays incoming file requests with accept/reject actions.
 *
 * Features:
 * - Request files with optional name/type filters
 * - Handle incoming requests
 * - Accept requests with file picker
 * - Reject or cancel requests
 * - Compact design for sidebar or modal placement
 */
export function FileRequestPanel({
  currentUserId,
  currentUserName,
  dataChannel,
  peerName,
  onFileSelected,
  className = '',
}: FileRequestPanelProps) {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestFileName, setRequestFileName] = useState('');
  const [requestFileType, setRequestFileType] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  const {
    pendingRequests,
    outgoingRequests,
    requestFile,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    clearCompletedRequests,
  } = useFileRequest({
    currentUserId,
    currentUserName,
    dataChannel,
    ...(onFileSelected ? { onFileSelected } : {}),
  });

  const handleOpenRequestDialog = useCallback(() => {
    setIsRequestDialogOpen(true);
  }, []);

  const handleCloseRequestDialog = useCallback(() => {
    setIsRequestDialogOpen(false);
    setRequestFileName('');
    setRequestFileType('');
    setRequestMessage('');
  }, []);

  const handleSubmitRequest = useCallback(() => {
    try {
      requestFile(
        requestFileName || undefined,
        requestFileType || undefined,
        requestMessage || undefined
      );
      handleCloseRequestDialog();
    } catch (error) {
      console.error('Failed to send file request:', error);
    }
  }, [requestFile, requestFileName, requestFileType, requestMessage, handleCloseRequestDialog]);

  const handleAcceptRequest = useCallback(
    (requestId: string) => {
      try {
        acceptRequest(requestId);
      } catch (error) {
        console.error('Failed to accept file request:', error);
      }
    },
    [acceptRequest]
  );

  const handleRejectRequest = useCallback(
    (requestId: string) => {
      try {
        rejectRequest(requestId);
      } catch (error) {
        console.error('Failed to reject file request:', error);
      }
    },
    [rejectRequest]
  );

  const handleCancelRequest = useCallback(
    (requestId: string) => {
      cancelRequest(requestId);
    },
    [cancelRequest]
  );

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const activePendingRequests = pendingRequests.filter(req => req.status === 'pending');
  const activeOutgoingRequests = outgoingRequests.filter(req => req.status === 'pending');
  const hasCompletedRequests =
    pendingRequests.some(req => req.status !== 'pending') ||
    outgoingRequests.some(req => req.status !== 'pending');

  const isConnected = dataChannel && dataChannel.readyState === 'open';

  return (
    <>
      <div className={`${styles.panel} ${className}`}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>File Requests</h3>
            {hasCompletedRequests && (
              <button
                onClick={clearCompletedRequests}
                className={styles.clearButton}
                aria-label="Clear completed requests"
              >
                Clear
              </button>
            )}
          </div>
          <Button
            onClick={handleOpenRequestDialog}
            disabled={!isConnected}
            size="sm"
            className={styles.requestButton}
          >
            <RequestIcon />
            Request a File
          </Button>
        </div>

        {/* Incoming Requests */}
        {activePendingRequests.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Incoming Requests</h4>
            <div className={styles.requestList}>
              {activePendingRequests.map(request => (
                <IncomingRequestCard
                  key={request.id}
                  request={request}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                  formatTimestamp={formatTimestamp}
                />
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Requests */}
        {activeOutgoingRequests.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Sent Requests</h4>
            <div className={styles.requestList}>
              {activeOutgoingRequests.map(request => (
                <OutgoingRequestCard
                  key={request.id}
                  request={request}
                  peerName={peerName}
                  onCancel={handleCancelRequest}
                  formatTimestamp={formatTimestamp}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activePendingRequests.length === 0 && activeOutgoingRequests.length === 0 && (
          <div className={styles.emptyState}>
            <FileIcon />
            <p className={styles.emptyTitle}>No active file requests</p>
            <p className={styles.emptyDescription}>
              Request specific files from {peerName || 'your peer'}
            </p>
          </div>
        )}

        {!isConnected && (
          <div className={styles.disconnectedBanner}>
            <WarningIcon />
            <span>Connect to a peer to request files</span>
          </div>
        )}
      </div>

      {/* Request Dialog */}
      <Modal
        open={isRequestDialogOpen}
        onClose={handleCloseRequestDialog}
        title="Request a File"
      >
        <div className={styles.dialogContent}>
          <p className={styles.dialogDescription}>
            Ask {peerName || 'your peer'} to send you a specific file.
          </p>

          <div className={styles.formField}>
            <label htmlFor="fileName" className={styles.label}>
              File Name (optional)
            </label>
            <Input
              id="fileName"
              value={requestFileName}
              onChange={(e) => setRequestFileName(e.target.value)}
              placeholder="e.g., report.pdf, vacation.jpg"
              className={styles.input}
            />
            <span className={styles.hint}>
              Suggest a specific file name
            </span>
          </div>

          <div className={styles.formField}>
            <label htmlFor="fileType" className={styles.label}>
              File Type (optional)
            </label>
            <Input
              id="fileType"
              value={requestFileType}
              onChange={(e) => setRequestFileType(e.target.value)}
              placeholder="e.g., .pdf, image/*, video/*"
              className={styles.input}
            />
            <span className={styles.hint}>
              MIME type or extension to filter
            </span>
          </div>

          <div className={styles.formField}>
            <label htmlFor="message" className={styles.label}>
              Message (optional)
            </label>
            <Input
              id="message"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="e.g., Can you send the project files?"
              className={styles.input}
            />
          </div>

          <div className={styles.dialogActions}>
            <Button
              onClick={handleCloseRequestDialog}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              variant="primary"
            >
              Send Request
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface IncomingRequestCardProps {
  request: PendingFileRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  formatTimestamp: (timestamp: number) => string;
}

function IncomingRequestCard({
  request,
  onAccept,
  onReject,
  formatTimestamp,
}: IncomingRequestCardProps) {
  return (
    <div className={styles.requestCard}>
      <div className={styles.requestHeader}>
        <div className={styles.requestInfo}>
          <span className={styles.requestFrom}>{request.fromName}</span>
          <span className={styles.requestTime}>{formatTimestamp(request.timestamp)}</span>
        </div>
        <span className={styles.badge}>Incoming</span>
      </div>

      {(request.fileName || request.fileType || request.message) && (
        <div className={styles.requestDetails}>
          {request.fileName && (
            <div className={styles.detailRow}>
              <FileIcon />
              <span>{request.fileName}</span>
            </div>
          )}
          {request.fileType && (
            <div className={styles.detailRow}>
              <TagIcon />
              <span>{request.fileType}</span>
            </div>
          )}
          {request.message && (
            <div className={styles.detailRow}>
              <MessageIcon />
              <span className={styles.message}>{request.message}</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.requestActions}>
        <Button
          onClick={() => onAccept(request.id)}
          variant="primary"
          size="sm"
          className={styles.acceptButton}
        >
          <CheckIcon />
          Accept
        </Button>
        <Button
          onClick={() => onReject(request.id)}
          variant="ghost"
          size="sm"
        >
          <CrossIcon />
          Decline
        </Button>
      </div>
    </div>
  );
}

interface OutgoingRequestCardProps {
  request: PendingFileRequest;
  peerName: string;
  onCancel: (requestId: string) => void;
  formatTimestamp: (timestamp: number) => string;
}

function OutgoingRequestCard({
  request,
  peerName,
  onCancel,
  formatTimestamp,
}: OutgoingRequestCardProps) {
  return (
    <div className={styles.requestCard}>
      <div className={styles.requestHeader}>
        <div className={styles.requestInfo}>
          <span className={styles.requestFrom}>To {peerName}</span>
          <span className={styles.requestTime}>{formatTimestamp(request.timestamp)}</span>
        </div>
        <span className={`${styles.badge} ${styles.badgeOutgoing}`}>Sent</span>
      </div>

      {(request.fileName || request.fileType || request.message) && (
        <div className={styles.requestDetails}>
          {request.fileName && (
            <div className={styles.detailRow}>
              <FileIcon />
              <span>{request.fileName}</span>
            </div>
          )}
          {request.fileType && (
            <div className={styles.detailRow}>
              <TagIcon />
              <span>{request.fileType}</span>
            </div>
          )}
          {request.message && (
            <div className={styles.detailRow}>
              <MessageIcon />
              <span className={styles.message}>{request.message}</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.requestActions}>
        <Button
          onClick={() => onCancel(request.id)}
          variant="ghost"
          size="sm"
        >
          Cancel
        </Button>
        <div className={styles.pendingStatus}>
          <div className={styles.spinner} />
          <span>Waiting...</span>
        </div>
      </div>
    </div>
  );
}

// Icons
function RequestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
