'use client';

/**
 * Project-based File Organization
 * Group transfers into projects for better organization
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  relativePath: string;
  contentHash: string | null;
  isDuplicate: boolean;
  thumbnail: string | null;
  addedAt: Date;
  transferId: string;
  senderId: string;
  senderName: string;
}

export type ProjectFileSortField = 'name' | 'date' | 'size' | 'sender' | 'path';
export type ProjectFileSortDirection = 'asc' | 'desc';

interface TransferFileLike {
  name: string;
  size: number;
  type: string;
  path?: string | null;
  relativePath?: string | null;
  hash?: string | null;
  contentHash?: string | null;
  thumbnail?: string | null;
}

interface TransferLike {
  id: string;
  files: TransferFileLike[];
  peerId: string;
  peerName: string;
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
    relativePath?: string;
    contentHash?: string | null;
    isDuplicate?: boolean;
    thumbnail?: string | null;
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
const IMAGE_FILE_PATTERN = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|heic|heif|avif)$/i;

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

function normalizeRelativePath(file: TransferFileLike): string {
  const candidate = file.relativePath || file.path || file.name;
  const normalized = candidate.replace(/\\/g, '/').replace(/^\/+/, '');
  return normalized || file.name;
}

function normalizeContentHash(file: TransferFileLike): string | null {
  const candidate = (file.contentHash || file.hash || '').trim().toLowerCase();
  return candidate.length > 0 ? candidate : null;
}

function createProjectFileId(transferId: string, relativePath: string, index: number): string {
  const safePath = relativePath.replace(/[^a-zA-Z0-9._-]/g, '_');
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
  return `file_${transferId}_${safePath}_${index}_${nonce}`;
}

export function isImageProjectFile(file: Pick<ProjectFile, 'name' | 'type'>): boolean {
  if (file.type.startsWith('image/')) {
    return true;
  }
  return IMAGE_FILE_PATTERN.test(file.name);
}

export function sortProjectFiles(
  files: ProjectFile[],
  sortField: ProjectFileSortField,
  sortDirection: ProjectFileSortDirection
): ProjectFile[] {
  const sorted = [...files].sort((left, right) => {
    switch (sortField) {
      case 'name':
        return left.name.localeCompare(right.name);
      case 'date':
        return left.addedAt.getTime() - right.addedAt.getTime();
      case 'size':
        return left.size - right.size;
      case 'sender':
        return left.senderName.localeCompare(right.senderName);
      case 'path':
        return left.relativePath.localeCompare(right.relativePath);
      default:
        return 0;
    }
  });

  return sortDirection === 'asc' ? sorted : sorted.reverse();
}

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
      relativePath: file.relativePath || file.name,
      contentHash: file.contentHash || null,
      isDuplicate: Boolean(file.isDuplicate),
      thumbnail: file.thumbnail || null,
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
  return `project_${Date.now()}_${Array.from(crypto.getRandomValues(new Uint8Array(7))).map(b => b.toString(36)).join('').substring(0, 9)}`;
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
    color,
    icon,
    files: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...(description !== undefined ? { description } : {}),
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
  const existingProject = projects[index];
  if (!existingProject) {return null;}

  const updatedProject: ProjectFolder = {
    ...existingProject,
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.description !== undefined ? { description: updates.description } : {}),
    ...(updates.color !== undefined ? { color: updates.color } : {}),
    ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
    updatedAt: new Date(),
  };
  projects[index] = updatedProject;

  saveProjects(projects);
  return updatedProject;
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
  if (!deletedProject) {return false;}
  const unsortedIndex = projects.findIndex(p => p.id === UNSORTED_PROJECT_ID);
  const unsortedProject = unsortedIndex >= 0 ? projects[unsortedIndex] : undefined;

  if (unsortedProject && deletedProject.files.length > 0) {
    unsortedProject.files.push(...deletedProject.files);
    unsortedProject.updatedAt = new Date();
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
  transfer: TransferLike
): void {
  const projects = getProjects();
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {return;}
  const project = projects[projectIndex];
  if (!project) {return;}

  // Detect duplicate payloads using content hash when available.
  const seenHashes = new Set<string>(
    project.files
      .map((file) => file.contentHash)
      .filter((hash): hash is string => Boolean(hash))
  );

  const projectFiles: ProjectFile[] = transfer.files.map((file, index) => {
    const relativePath = normalizeRelativePath(file);
    const contentHash = normalizeContentHash(file);
    const isDuplicate = contentHash ? seenHashes.has(contentHash) : false;

    if (contentHash) {
      seenHashes.add(contentHash);
    }

    return {
      id: createProjectFileId(transfer.id, relativePath, index),
      name: file.name,
      size: file.size,
      type: file.type,
      relativePath,
      contentHash,
      isDuplicate,
      thumbnail: typeof file.thumbnail === 'string' ? file.thumbnail : null,
      addedAt: new Date(),
      transferId: transfer.id,
      senderId: transfer.peerId,
      senderName: transfer.peerName,
    };
  });

  project.files.push(...projectFiles);
  project.updatedAt = new Date();

  saveProjects(projects);
}

/**
 * Remove a file from a project
 */
export function removeFileFromProject(projectId: string, fileId: string): void {
  const projects = getProjects();
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {return;}
  const project = projects[projectIndex];
  if (!project) {return;}

  project.files = project.files.filter(
    f => f.id !== fileId
  );
  project.updatedAt = new Date();

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
  const fromProject = projects[fromIndex];
  const toProject = projects[toIndex];
  if (!fromProject || !toProject) {return;}

  const fileIndex = fromProject.files.findIndex(f => f.id === fileId);
  if (fileIndex === -1) {return;}

  // Move file
  const [file] = fromProject.files.splice(fileIndex, 1);
  if (!file) {return;}
  toProject.files.push(file);

  // Update timestamps
  fromProject.updatedAt = new Date();
  toProject.updatedAt = new Date();

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

/**
 * Get image files in a project (for gallery views).
 */
export function getProjectImageFiles(projectId: string): ProjectFile[] {
  return getProjectFiles(projectId).filter((file) => isImageProjectFile(file));
}

/**
 * Group files that share the same content hash.
 */
export function getProjectDuplicateGroups(projectId: string): Array<{
  contentHash: string;
  files: ProjectFile[];
}> {
  const files = getProjectFiles(projectId);
  const duplicateMap = new Map<string, ProjectFile[]>();

  for (const file of files) {
    if (!file.contentHash) {
      continue;
    }

    const existing = duplicateMap.get(file.contentHash);
    if (existing) {
      existing.push(file);
      continue;
    }
    duplicateMap.set(file.contentHash, [file]);
  }

  return Array.from(duplicateMap.entries())
    .filter(([, group]) => group.length > 1)
    .map(([contentHash, group]) => ({ contentHash, files: group }));
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
        file.senderName.toLowerCase().includes(lowerQuery) ||
        file.relativePath.toLowerCase().includes(lowerQuery)
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
    ...(latestFile ? { latestFile } : {}),
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
  getProjectImageFiles,
  getProjectDuplicateGroups,
  isImageProjectFile,
  sortProjectFiles,
  searchProjects,
  searchFiles,
  getProjectStats,
  getOverallStats,
  PROJECT_COLORS,
  PROJECT_ICONS,
};
