'use client';

/**
 * Team Workspace Example
 *
 * Demonstrates how to use TeamPanel and SharedDropFolder components
 * for collaborative file sharing in team/workspace mode.
 *
 * Features:
 * - Create and join teams
 * - Manage team members and roles
 * - Shared drop folder for collaborative file uploads
 * - Real-time team state synchronization
 */

import { useState } from 'react';
import { TeamPanel } from './TeamPanel';
import { SharedDropFolder } from './SharedDropFolder';
import { useTeamStore } from '@/lib/stores/team-store';
import styles from './TeamWorkspaceExample.module.css';

export function TeamWorkspaceExample() {
  const [view, setView] = useState<'panel' | 'folder' | 'both'>('both');
  const { activeTeam } = useTeamStore();

  return (
    <div className={styles.container}>
      {/* Example Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Team Workspace Example</h1>
        <p className={styles.subtitle}>
          Collaborative file sharing with team management
        </p>

        {/* View Toggle */}
        <div className={styles.viewToggle}>
          <button
            className={view === 'panel' ? styles.active : ''}
            onClick={() => setView('panel')}
          >
            Team Panel Only
          </button>
          <button
            className={view === 'folder' ? styles.active : ''}
            onClick={() => setView('folder')}
          >
            Shared Folder Only
          </button>
          <button
            className={view === 'both' ? styles.active : ''}
            onClick={() => setView('both')}
          >
            Both Views
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {view === 'both' ? (
          <div className={styles.splitView}>
            {/* Team Panel - Left Side */}
            <div className={styles.panelSide}>
              <TeamPanel />
            </div>

            {/* Shared Folder - Right Side */}
            <div className={styles.folderSide}>
              {activeTeam ? (
                <SharedDropFolder
                  onFileUpload={(file) => {
                    console.log('[Example] File uploaded:', file);
                  }}
                  onFileDownload={(file) => {
                    console.log('[Example] File downloaded:', file);
                  }}
                />
              ) : (
                <div className={styles.noTeam}>
                  <TeamIcon />
                  <p>Create or join a team to access the shared folder</p>
                </div>
              )}
            </div>
          </div>
        ) : view === 'panel' ? (
          <div className={styles.singleView}>
            <TeamPanel />
          </div>
        ) : (
          <div className={styles.singleView}>
            <SharedDropFolder
              onFileUpload={(file) => {
                console.log('[Example] File uploaded:', file);
              }}
              onFileDownload={(file) => {
                console.log('[Example] File downloaded:', file);
              }}
            />
          </div>
        )}
      </div>

      {/* Example Usage Instructions */}
      <div className={styles.instructions}>
        <h2 className={styles.instructionsTitle}>Usage Instructions</h2>
        <ol className={styles.instructionsList}>
          <li>
            <strong>Create a Team:</strong> Click "Create Team" to start a new
            workspace. You'll receive a unique 8-character code to share with
            others.
          </li>
          <li>
            <strong>Join a Team:</strong> Click "Join Team" and enter the code
            shared by your team owner.
          </li>
          <li>
            <strong>Share Files:</strong> Drag and drop files into the shared
            folder, or click "Browse Files" to select them.
          </li>
          <li>
            <strong>Manage Members:</strong> Team owners and admins can promote,
            demote, or remove members using the actions menu.
          </li>
          <li>
            <strong>Download Files:</strong> Click the download icon on any file
            to save it to your device.
          </li>
        </ol>
      </div>

      {/* Code Example */}
      <div className={styles.codeExample}>
        <h2 className={styles.codeTitle}>Code Example</h2>
        <pre className={styles.code}>
          <code>{`import { TeamPanel, SharedDropFolder } from '@/components/transfer';
import { useTeamStore } from '@/lib/stores/team-store';

export function MyComponent() {
  const { activeTeam } = useTeamStore();

  return (
    <div>
      {/* Team Management Panel */}
      <TeamPanel />

      {/* Shared File Drop Folder */}
      {activeTeam && (
        <SharedDropFolder
          onFileUpload={(file) => {
            console.log('File uploaded:', file);
          }}
          onFileDownload={(file) => {
            console.log('File downloaded:', file);
          }}
        />
      )}
    </div>
  );
}`}</code>
        </pre>
      </div>

      {/* Store Actions Example */}
      <div className={styles.codeExample}>
        <h2 className={styles.codeTitle}>Team Actions (Plain Module)</h2>
        <pre className={styles.code}>
          <code>{`import {
  createTeamAction,
  joinTeamAction,
  leaveTeamAction,
  addSharedFileAction,
  removeSharedFileAction,
} from '@/lib/teams/team-actions';

// Create a team
const team = createTeamAction('My Team');
console.log('Team code:', team.code);

// Join a team
await joinTeamAction('ABCD1234');

// Add file to shared folder
addSharedFileAction({
  id: 'file-1',
  name: 'document.pdf',
  size: 1024000,
  type: 'application/pdf',
  contributorId: 'current-user',
  contributorName: 'You',
  timestamp: Date.now(),
  dataUrl: '...',
});

// Leave team
leaveTeamAction();`}</code>
        </pre>
      </div>
    </div>
  );
}

function TeamIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.4"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
