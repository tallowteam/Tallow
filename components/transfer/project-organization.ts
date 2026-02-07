/**
 * Project Organization System - Export Index
 *
 * Central export point for all project organization components and utilities.
 *
 * Usage:
 * import { ProjectBrowser, addFileToProject } from '@/components/transfer/project-organization';
 */

// ============================================================================
// COMPONENTS
// ============================================================================

export { ProjectBrowser } from './ProjectBrowser';
export { ProjectFileList } from './ProjectFileList';
export {
  TransferPageWithProjects,
  AddToProjectDialog,
  EnhancedTransferHistory,
  ProjectQuickAccess,
  INTEGRATION_GUIDE,
} from './ProjectOrganizationExample';

// ============================================================================
// STORAGE & UTILITIES
// ============================================================================

export {
  // CRUD Operations
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,

  // File Operations
  addFileToProject,
  removeFileFromProject,
  moveFileBetweenProjects,
  moveMultipleFiles,
  getProjectFiles,

  // Search & Filter
  searchProjects,
  searchFiles,

  // Statistics
  getProjectStats,
  getOverallStats,

  // Constants
  PROJECT_COLORS,
  PROJECT_ICONS,

  // Types
  type ProjectFolder,
  type ProjectFile,
} from '@/lib/storage/project-organizer';

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export { formatDataSize } from '@/lib/storage/transfer-history';
export type { TransferRecord } from '@/lib/storage/transfer-history';
