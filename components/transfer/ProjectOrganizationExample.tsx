'use client';

/**
 * Project Organization Example
 *
 * Demonstrates how to integrate project-based file organization
 * with existing transfer history and components.
 *
 * Usage:
 * 1. Add ProjectBrowser to your transfer page
 * 2. Use "Add to Project" action in TransferHistory
 * 3. Users can organize files into custom projects
 */

import { useState } from 'react';
import { ProjectBrowser } from './ProjectBrowser';
import { TransferHistory } from './TransferHistory';
import {
  addFileToProject,
  getAllProjects,
  type ProjectFolder,
} from '@/lib/storage/project-organizer';
import type { TransferRecord } from '@/lib/storage/transfer-history';
import { useToast } from '@/components/ui/ToastProvider';
import { Modal } from '@/components/ui/Modal';
import styles from './ProjectOrganizationExample.module.css';

// ============================================================================
// EXAMPLE 1: Transfer Page with Projects Tab
// ============================================================================

export function TransferPageWithProjects() {
  const [activeTab, setActiveTab] = useState<'history' | 'projects'>('history');

  return (
    <div className={styles.container}>
      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <HistoryIcon />
          Transfer History
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'projects' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <FolderIcon />
          Projects
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'history' && <TransferHistory />}
        {activeTab === 'projects' && <ProjectBrowser />}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Add to Project Dialog
// ============================================================================

interface AddToProjectDialogProps {
  transfer: TransferRecord;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToProjectDialog({
  transfer,
  isOpen,
  onClose,
}: AddToProjectDialogProps) {
  const [projects] = useState<ProjectFolder[]>(getAllProjects());
  const toast = useToast();

  const handleAddToProject = (projectId: string) => {
    try {
      addFileToProject(projectId, transfer);
      const project = projects.find(p => p.id === projectId);
      toast?.success(`Added to ${project?.name || 'project'}`);
      onClose();
    } catch (error) {
      toast?.error('Failed to add to project');
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Add to Project">
      <div className={styles.projectList}>
        {projects.map(project => (
          <button
            key={project.id}
            className={styles.projectItem}
            onClick={() => handleAddToProject(project.id)}
          >
            <div
              className={styles.projectItemIcon}
              style={{ backgroundColor: project.color }}
            >
              {project.icon}
            </div>
            <div className={styles.projectItemInfo}>
              <div className={styles.projectItemName}>{project.name}</div>
              {project.description && (
                <div className={styles.projectItemDesc}>
                  {project.description}
                </div>
              )}
            </div>
            <div className={styles.projectItemArrow}>
              <ArrowIcon />
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ============================================================================
// EXAMPLE 3: Enhanced Transfer History with Project Actions
// ============================================================================

export function EnhancedTransferHistory() {
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);
  const [showAddToProject, setShowAddToProject] = useState(false);

  return (
    <>
      {/* Pass custom action to TransferHistory */}
      <div className={styles.historyContainer}>
        <TransferHistory />
        {/* Custom action buttons would be added to TransferHistory component */}
      </div>

      {/* Add to Project Dialog */}
      {selectedTransfer && (
        <AddToProjectDialog
          transfer={selectedTransfer}
          isOpen={showAddToProject}
          onClose={() => {
            setShowAddToProject(false);
            setSelectedTransfer(null);
          }}
        />
      )}
    </>
  );
}

// ============================================================================
// EXAMPLE 4: Project Quick Access Widget
// ============================================================================

export function ProjectQuickAccess() {
  const [projects] = useState<ProjectFolder[]>(
    getAllProjects().slice(0, 4) // Show first 4 projects
  );

  return (
    <div className={styles.quickAccess}>
      <div className={styles.quickAccessHeader}>
        <h3>Quick Access</h3>
        <a href="/transfer?tab=projects" className={styles.viewAll}>
          View all
        </a>
      </div>
      <div className={styles.quickAccessGrid}>
        {projects.map(project => (
          <a
            key={project.id}
            href={`/transfer?tab=projects&id=${project.id}`}
            className={styles.quickAccessItem}
            style={{ '--project-color': project.color } as React.CSSProperties}
          >
            <div className={styles.quickAccessIcon}>{project.icon}</div>
            <div className={styles.quickAccessName}>{project.name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Integration Instructions
// ============================================================================

export const INTEGRATION_GUIDE = `
# Project Organization Integration Guide

## 1. Add to Transfer Page

\`\`\`tsx
// app/transfer/page.tsx
import { ProjectBrowser } from '@/components/transfer/ProjectBrowser';

export default function TransferPage() {
  return (
    <div>
      <h1>Projects</h1>
      <ProjectBrowser />
    </div>
  );
}
\`\`\`

## 2. Add "Add to Project" to Transfer History

Modify TransferHistory component to include project action:

\`\`\`tsx
import { addFileToProject, getAllProjects } from '@/lib/storage/project-organizer';

// In FileActions component, add:
const handleAddToProject = (transfer: TransferRecord) => {
  const projects = getAllProjects();
  // Show project selection modal
  // Then: addFileToProject(projectId, transfer);
};
\`\`\`

## 3. Drag and Drop Support (Optional)

Add drag-and-drop to move files between projects:

\`\`\`tsx
import { moveFileBetweenProjects } from '@/lib/storage/project-organizer';

const handleDrop = (fileId: string, targetProjectId: string) => {
  moveFileBetweenProjects(fileId, currentProjectId, targetProjectId);
};
\`\`\`

## 4. Search Integration

Add project search to global search:

\`\`\`tsx
import { searchProjects, searchFiles } from '@/lib/storage/project-organizer';

const results = searchFiles(query); // Returns { file, project }[]
\`\`\`

## Features Included

- ✓ Create/rename/delete projects
- ✓ Color and icon customization
- ✓ Add files from transfer history
- ✓ Multi-select and bulk operations
- ✓ Move files between projects
- ✓ Sort by name, date, size, sender
- ✓ Search projects and files
- ✓ Default "Unsorted" project
- ✓ LocalStorage persistence
- ✓ Full TypeScript support
- ✓ Responsive design
- ✓ Dark theme compatible
`;

// ============================================================================
// ICONS
// ============================================================================

function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
