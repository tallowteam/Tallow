'use client';

/**
 * Project-based File Organization
 * Group transfers into projects for better organization
 */

import type { TransferRecord } from './transfer-history';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: Date;
  transferId: string;
  senderId: string;
  senderName: string;
}

export interface ProjectFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  files: ProjectFile[];
  createdAt: Date;
  updatedAt: Date;
}

interface SerializedProjectFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    addedAt: string;
    transferId: string;
    senderId: string;
    senderName: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'tallow_projects';
const UNSORTED_PROJECT_ID = '__unsorted__';

export const PROJECT_COLORS = [
  '#5E5CE6', // Purple (primary)
  '#FF2D55', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#00C7BE', // Teal
  '#32ADE6', // Blue
  '#AF52DE', // Purple
  '#FF375F', // Pink
  '#BF5AF2', // Violet
] as const;

export const PROJECT_ICONS = [
  '📁', '📂', '🗂️', '📋', '📌',
  '⭐', '🎯', '🚀', '💡', '🔥',
  '🎨', '🎬', '🎵', '📸', '💼',
  '🏠', '🏢', '🎓', '💻', '🔬',
] as const;

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function getProjects(): ProjectFolder[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [createDefaultUnsortedProject()];
    }

    const serialized: SerializedProjectFolder[] = JSON.parse(data);
    return serialized.map(deserializeProject);
  } catch (error) {
    console.error('Failed to load projects:', error);
    return [createDefaultUnsortedProject()];
  }
}

function saveProjects(projects: ProjectFolder[]): void {
  if (typeof window === 'undefined') {return;}

  try {
    const serialized = projects.map(serializeProject);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save projects:', error);
  }
}

function serializeProject(project: ProjectFolder): SerializedProjectFolder {
  return {
    ...project,
    files: project.files.map(file => ({
      ...file,
      addedAt: file.addedAt.toISOString(),
    })),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

function deserializeProject(serialized: SerializedProjectFolder): ProjectFolder {
  return {
    ...serialized,
    files: serialized.files.map(file => ({
      ...file,
      addedAt: new Date(file.addedAt),
    })),
    createdAt: new Date(serialized.createdAt),
    updatedAt: new Date(serialized.updatedAt),
  };
}

function createDefaultUnsortedProject(): ProjectFolder {
  return {
    id: UNSORTED_PROJECT_ID,
    name: 'Unsorted',
    description: 'Files not assigned to a project',
    color: '#8E8E93',
    icon: '📦',
    files: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function generateId(): string {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// PROJECT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new project
 */
export function createProject(
  name: string,
  description?: string,
  color: string = PROJECT_COLORS[0],
  icon: string = PROJECT_ICONS[0]
): ProjectFolder {
  const projects = getProjects();

  const newProject: ProjectFolder = {
    id: generateId(),
    name,
    description,
    color,
    icon,
    files: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  projects.push(newProject);
  saveProjects(projects);

  return newProject;
}

/**
 * Get all projects
 */
export function getAllProjects(): ProjectFolder[] {
  return getProjects();
}

/**
 * Get a single project by ID
 */
export function getProject(projectId: string): ProjectFolder | null {
  const projects = getProjects();
  return projects.find(p => p.id === projectId) || null;
}

/**
 * Update project details
 */
export function updateProject(
  projectId: string,
  updates: Partial<Pick<ProjectFolder, 'name' | 'description' | 'color' | 'icon'>>
): ProjectFolder | null {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === projectId);

  if (index === -1) {return null;}

  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date(),
  };

  saveProjects(projects);
  return projects[index];
}

/**
 * Delete a project (files move to Unsorted)
 */
export function deleteProject(projectId: string): boolean {
  if (projectId === UNSORTED_PROJECT_ID) {
    return false; // Cannot delete Unsorted
  }

  const projects = getProjects();
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {return false;}

  // Move files to Unsorted
  const deletedProject = projects[projectIndex];
  const unsortedIndex = projects.findIndex(p => p.id === UNSORTED_PROJECT_ID);

  if (unsortedIndex !== -1 && deletedProject.files.length > 0) {
    projects[unsortedIndex].files.push(...deletedProject.files);
    projects[unsortedIndex].updatedAt = new Date();
  }

  // Remove project
  projects.splice(projectIndex, 1);
  saveProjects(projects);

  return true;
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Add a file to a project from a transfer record
 */
export function addFileToProject(
  projectId: string,
  transfer: TransferRecord
): void {
  const projects = getProjects();
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {return;}

  // Convert transfer files to project files
  const projectFiles: ProjectFile[] = transfer.files.map(file => ({
    id: `file_${transfer.id}_${file.name}`,
    name: file.name,
    size: file.size,
    type: file.type,
    addedAt: new Date(),
    transferId: transfer.id,
    senderId: transfer.peerId,
    senderName: transfer.peerName,
  }));

  projects[projectIndex].files.push(...projectFiles);
  projects[projectIndex].updatedAt = new Date();

  saveProjects(projects);
}

/**
 * Remove a file from a project
 */
export function removeFileFromProject(projectId: string, fileId: string): void {
  const projects = getProjects();
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {return;}

  projects[projectIndex].files = projects[projectIndex].files.filter(
    f => f.id !== fileId
  );
  projects[projectIndex].updatedAt = new Date();

  saveProjects(projects);
}

/**
 * Move a file between projects
 */
export function moveFileBetweenProjects(
  fileId: string,
  fromProjectId: string,
  toProjectId: string
): void {
  const projects = getProjects();
  const fromIndex = projects.findIndex(p => p.id === fromProjectId);
  const toIndex = projects.findIndex(p => p.id === toProjectId);

  if (fromIndex === -1 || toIndex === -1) {return;}

  const fileIndex = projects[fromIndex].files.findIndex(f => f.id === fileId);
  if (fileIndex === -1) {return;}

  // Move file
  const [file] = projects[fromIndex].files.splice(fileIndex, 1);
  projects[toIndex].files.push(file);

  // Update timestamps
  projects[fromIndex].updatedAt = new Date();
  projects[toIndex].updatedAt = new Date();

  saveProjects(projects);
}

/**
 * Move multiple files between projects
 */
export function moveMultipleFiles(
  fileIds: string[],
  fromProjectId: string,
  toProjectId: string
): void {
  fileIds.forEach(fileId => {
    moveFileBetweenProjects(fileId, fromProjectId, toProjectId);
  });
}

/**
 * Get all files in a project
 */
export function getProjectFiles(projectId: string): ProjectFile[] {
  const project = getProject(projectId);
  return project?.files || [];
}

// ============================================================================
// SEARCH AND FILTER
// ============================================================================

/**
 * Search projects by name or description
 */
export function searchProjects(query: string): ProjectFolder[] {
  const projects = getProjects();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return projects;
  }

  return projects.filter(
    project =>
      project.name.toLowerCase().includes(lowerQuery) ||
      project.description?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search files across all projects
 */
export function searchFiles(query: string): Array<{
  file: ProjectFile;
  project: ProjectFolder;
}> {
  const projects = getProjects();
  const lowerQuery = query.toLowerCase().trim();
  const results: Array<{ file: ProjectFile; project: ProjectFolder }> = [];

  if (!lowerQuery) {
    return results;
  }

  for (const project of projects) {
    for (const file of project.files) {
      if (
        file.name.toLowerCase().includes(lowerQuery) ||
        file.senderName.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ file, project });
      }
    }
  }

  return results;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get project statistics
 */
export function getProjectStats(projectId: string): {
  fileCount: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  latestFile?: ProjectFile;
} {
  const project = getProject(projectId);

  if (!project) {
    return {
      fileCount: 0,
      totalSize: 0,
      fileTypes: {},
    };
  }

  const fileCount = project.files.length;
  const totalSize = project.files.reduce((sum, f) => sum + f.size, 0);
  const fileTypes: Record<string, number> = {};

  for (const file of project.files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    fileTypes[ext] = (fileTypes[ext] || 0) + 1;
  }

  const latestFile = project.files.length > 0
    ? [...project.files].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())[0]
    : undefined;

  return {
    fileCount,
    totalSize,
    fileTypes,
    latestFile,
  };
}

/**
 * Get overall statistics
 */
export function getOverallStats(): {
  totalProjects: number;
  totalFiles: number;
  totalSize: number;
  projectsWithFiles: number;
} {
  const projects = getProjects();

  const totalProjects = projects.filter(p => p.id !== UNSORTED_PROJECT_ID).length;
  const totalFiles = projects.reduce((sum, p) => sum + p.files.length, 0);
  const totalSize = projects.reduce(
    (sum, p) => sum + p.files.reduce((s, f) => s + f.size, 0),
    0
  );
  const projectsWithFiles = projects.filter(p => p.files.length > 0).length;

  return {
    totalProjects,
    totalFiles,
    totalSize,
    projectsWithFiles,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  addFileToProject,
  removeFileFromProject,
  moveFileBetweenProjects,
  moveMultipleFiles,
  getProjectFiles,
  searchProjects,
  searchFiles,
  getProjectStats,
  getOverallStats,
  PROJECT_COLORS,
  PROJECT_ICONS,
};
